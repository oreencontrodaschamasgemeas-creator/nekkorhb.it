import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RecordingsService } from '../recordings.service';
import { RecordingStatus } from '../entities/recording.entity';

@Processor('recording-processing')
export class RecordingProcessor {
  private readonly logger = new Logger(RecordingProcessor.name);

  constructor(private recordingsService: RecordingsService) {}

  @Process('create-recording')
  async handleCreateRecording(job: Job): Promise<void> {
    const { cameraStreamId, filename, duration, fileSize, incidentId } = job.data;

    try {
      this.logger.log(`Creating recording for stream ${cameraStreamId}`);

      const recording = await this.recordingsService.create(
        cameraStreamId,
        filename,
        duration,
        fileSize,
        incidentId,
      );

      this.logger.log(`Created recording ${recording.id}`);
    } catch (error) {
      this.logger.error(`Failed to create recording: ${error.message}`);
      throw error;
    }
  }

  @Process('upload-recording')
  async handleUploadRecording(job: Job): Promise<void> {
    const { recordingId, fileBuffer, contentType } = job.data;

    try {
      this.logger.log(`Uploading recording ${recordingId} to storage`);

      await this.recordingsService.uploadToStorage(
        recordingId,
        Buffer.from(fileBuffer),
        contentType,
      );

      this.logger.log(`Uploaded recording ${recordingId} successfully`);
    } catch (error) {
      this.logger.error(`Failed to upload recording ${recordingId}: ${error.message}`);
      await this.recordingsService.updateStatus(recordingId, RecordingStatus.FAILED);
      throw error;
    }
  }

  @Process('chunk-video')
  async handleChunkVideo(job: Job): Promise<void> {
    const { streamId, startTime, duration } = job.data;

    try {
      this.logger.log(`Chunking video for stream ${streamId}`);

      const chunkFilename = `${streamId}_${Date.now()}.mp4`;
      const fileSize = 1024 * 1024 * 10;

      const recording = await this.recordingsService.create(
        streamId,
        chunkFilename,
        duration,
        fileSize,
      );

      this.logger.log(`Created video chunk ${recording.id}`);
    } catch (error) {
      this.logger.error(`Failed to chunk video: ${error.message}`);
      throw error;
    }
  }
}
