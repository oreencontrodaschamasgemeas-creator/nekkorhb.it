import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Recording, RecordingStatus } from './entities/recording.entity';
import { QueryRecordingsDto } from './dto/query-recordings.dto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    @InjectRepository(Recording)
    private recordingRepository: Repository<Recording>,
    private configService: ConfigService,
  ) {
    const s3Config = {
      region: this.configService.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', ''),
      },
    };

    this.s3Client = new S3Client(s3Config);
    this.bucketName = this.configService.get('S3_BUCKET_NAME', 'surveillance-recordings');
  }

  async create(
    cameraStreamId: string,
    filename: string,
    duration: number,
    fileSize: number,
    incidentId?: string,
  ): Promise<Recording> {
    const retentionDays = this.configService.get<number>('RECORDING_RETENTION_DAYS', 30);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    const storagePath = `recordings/${cameraStreamId}/${new Date().toISOString().split('T')[0]}/${filename}`;

    const recording = this.recordingRepository.create({
      cameraStreamId,
      incidentId,
      filename,
      storagePath,
      fileSize,
      duration,
      startTime: new Date(),
      status: RecordingStatus.PENDING,
      expiresAt,
    });

    const saved = await this.recordingRepository.save(recording);
    this.logger.log(`Created recording ${saved.id} for stream ${cameraStreamId}`);

    return saved;
  }

  async findAll(query: QueryRecordingsDto): Promise<{ data: Recording[]; total: number }> {
    const { cameraStreamId, incidentId, status, startTime, endTime, page = 1, limit = 50 } = query;

    const where: any = {};

    if (cameraStreamId) {
      where.cameraStreamId = cameraStreamId;
    }

    if (incidentId) {
      where.incidentId = incidentId;
    }

    if (status) {
      where.status = status;
    }

    if (startTime && endTime) {
      where.startTime = Between(new Date(startTime), new Date(endTime));
    } else if (startTime) {
      where.startTime = Between(new Date(startTime), new Date());
    }

    const [data, total] = await this.recordingRepository.findAndCount({
      where,
      relations: ['cameraStream'],
      order: { startTime: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Recording> {
    const recording = await this.recordingRepository.findOne({
      where: { id },
      relations: ['cameraStream'],
    });

    if (!recording) {
      throw new NotFoundException(`Recording with ID ${id} not found`);
    }

    return recording;
  }

  async uploadToStorage(
    id: string,
    fileBuffer: Buffer,
    contentType: string = 'video/mp4',
  ): Promise<Recording> {
    const recording = await this.findOne(id);

    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: recording.storagePath,
        Body: fileBuffer,
        ContentType: contentType,
      };

      await this.s3Client.send(new PutObjectCommand(uploadParams));

      const storageUrl = `s3://${this.bucketName}/${recording.storagePath}`;
      recording.storageUrl = storageUrl;
      recording.status = RecordingStatus.COMPLETED;
      recording.endTime = new Date();

      const updated = await this.recordingRepository.save(recording);
      this.logger.log(`Uploaded recording ${id} to storage`);

      return updated;
    } catch (error) {
      this.logger.error(`Failed to upload recording ${id}: ${error.message}`);
      recording.status = RecordingStatus.FAILED;
      await this.recordingRepository.save(recording);
      throw error;
    }
  }

  async getPlaybackUrl(id: string, expiresIn: number = 3600): Promise<string> {
    const recording = await this.findOne(id);

    if (recording.status !== RecordingStatus.COMPLETED) {
      throw new Error('Recording is not available for playback');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: recording.storagePath,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate playback URL for recording ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateStatus(id: string, status: RecordingStatus): Promise<Recording> {
    const recording = await this.findOne(id);
    recording.status = status;

    if (status === RecordingStatus.COMPLETED) {
      recording.endTime = new Date();
    }

    return this.recordingRepository.save(recording);
  }

  async linkToIncident(id: string, incidentId: string): Promise<Recording> {
    const recording = await this.findOne(id);
    recording.incidentId = incidentId;

    const extendedRetentionDays = this.configService.get<number>('INCIDENT_RECORDING_RETENTION_DAYS', 365);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + extendedRetentionDays);
    recording.expiresAt = newExpiresAt;

    const updated = await this.recordingRepository.save(recording);
    this.logger.log(`Linked recording ${id} to incident ${incidentId}`);

    return updated;
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredRecordings(): Promise<void> {
    this.logger.log('Starting cleanup of expired recordings');

    const expiredRecordings = await this.recordingRepository.find({
      where: {
        expiresAt: LessThan(new Date()),
        status: RecordingStatus.COMPLETED,
      },
    });

    for (const recording of expiredRecordings) {
      try {
        const deleteParams = {
          Bucket: this.bucketName,
          Key: recording.storagePath,
        };

        await this.s3Client.send(new DeleteObjectCommand(deleteParams));

        recording.status = RecordingStatus.ARCHIVED;
        await this.recordingRepository.save(recording);

        this.logger.log(`Archived expired recording ${recording.id}`);
      } catch (error) {
        this.logger.error(`Failed to archive recording ${recording.id}: ${error.message}`);
      }
    }

    this.logger.log(`Cleaned up ${expiredRecordings.length} expired recordings`);
  }

  async delete(id: string): Promise<void> {
    const recording = await this.findOne(id);

    if (recording.storageUrl) {
      try {
        const deleteParams = {
          Bucket: this.bucketName,
          Key: recording.storagePath,
        };

        await this.s3Client.send(new DeleteObjectCommand(deleteParams));
      } catch (error) {
        this.logger.error(`Failed to delete recording from storage: ${error.message}`);
      }
    }

    await this.recordingRepository.remove(recording);
    this.logger.log(`Deleted recording ${id}`);
  }
}
