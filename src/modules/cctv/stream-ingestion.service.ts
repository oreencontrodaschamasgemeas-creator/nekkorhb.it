import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { CameraStream, StreamStatus } from './entities/camera-stream.entity';
import { CreateStreamDto } from './dto/create-stream.dto';
import { UpdateStreamDto } from './dto/update-stream.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class StreamIngestionService {
  private readonly logger = new Logger(StreamIngestionService.name);
  private activeStreams: Map<string, any> = new Map();

  constructor(
    @InjectRepository(CameraStream)
    private streamRepository: Repository<CameraStream>,
    @InjectQueue('stream-processing')
    private streamQueue: Queue,
    private configService: ConfigService,
    private websocketGateway: WebsocketGateway,
  ) {}

  async create(createStreamDto: CreateStreamDto): Promise<CameraStream> {
    const stream = this.streamRepository.create({
      ...createStreamDto,
      status: StreamStatus.IDLE,
    });

    const savedStream = await this.streamRepository.save(stream);
    this.logger.log(`Created stream ${savedStream.id} for device ${savedStream.deviceId}`);

    return savedStream;
  }

  async findAll(): Promise<CameraStream[]> {
    return this.streamRepository.find({
      relations: ['device'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CameraStream> {
    const stream = await this.streamRepository.findOne({
      where: { id },
      relations: ['device'],
    });

    if (!stream) {
      throw new NotFoundException(`Stream with ID ${id} not found`);
    }

    return stream;
  }

  async findByDevice(deviceId: string): Promise<CameraStream[]> {
    return this.streamRepository.find({
      where: { deviceId },
      relations: ['device'],
    });
  }

  async update(id: string, updateStreamDto: UpdateStreamDto): Promise<CameraStream> {
    const stream = await this.findOne(id);
    Object.assign(stream, updateStreamDto);
    return this.streamRepository.save(stream);
  }

  async delete(id: string): Promise<void> {
    const stream = await this.findOne(id);
    await this.stop(id);
    await this.streamRepository.remove(stream);
    this.logger.log(`Deleted stream ${id}`);
  }

  async start(id: string): Promise<CameraStream> {
    const stream = await this.findOne(id);

    if (stream.status === StreamStatus.ACTIVE) {
      this.logger.warn(`Stream ${id} is already active`);
      return stream;
    }

    stream.status = StreamStatus.STARTING;
    stream.errorMessage = null;
    await this.streamRepository.save(stream);

    await this.streamQueue.add('start-stream', {
      streamId: id,
      sourceUrl: stream.sourceUrl,
      username: stream.username,
      password: stream.password,
      protocol: stream.protocol,
      transcodeFormat: stream.transcodeFormat,
    });

    this.websocketGateway.sendToRoom(
      `device:${stream.deviceId}`,
      'stream:status',
      { streamId: id, status: StreamStatus.STARTING },
    );

    this.logger.log(`Starting stream ${id}`);
    return stream;
  }

  async stop(id: string): Promise<CameraStream> {
    const stream = await this.findOne(id);

    if (stream.status === StreamStatus.IDLE) {
      this.logger.warn(`Stream ${id} is already stopped`);
      return stream;
    }

    stream.status = StreamStatus.STOPPING;
    await this.streamRepository.save(stream);

    await this.streamQueue.add('stop-stream', { streamId: id });

    this.websocketGateway.sendToRoom(
      `device:${stream.deviceId}`,
      'stream:status',
      { streamId: id, status: StreamStatus.STOPPING },
    );

    this.logger.log(`Stopping stream ${id}`);
    return stream;
  }

  async updateStatus(
    id: string,
    status: StreamStatus,
    errorMessage?: string,
  ): Promise<CameraStream> {
    const stream = await this.findOne(id);
    stream.status = status;
    stream.lastHealthCheck = new Date();
    
    if (errorMessage) {
      stream.errorMessage = errorMessage;
    }

    const updated = await this.streamRepository.save(stream);

    this.websocketGateway.sendToRoom(
      `device:${stream.deviceId}`,
      'stream:status',
      { streamId: id, status, errorMessage },
    );

    return updated;
  }

  async handleReconnect(id: string): Promise<void> {
    const stream = await this.findOne(id);
    const maxReconnectAttempts = this.configService.get<number>('MAX_RECONNECT_ATTEMPTS', 5);

    if (stream.reconnectAttempts >= maxReconnectAttempts) {
      this.logger.error(`Stream ${id} exceeded max reconnect attempts`);
      await this.updateStatus(id, StreamStatus.ERROR, 'Max reconnect attempts exceeded');
      return;
    }

    stream.reconnectAttempts++;
    stream.status = StreamStatus.RECONNECTING;
    await this.streamRepository.save(stream);

    await this.streamQueue.add(
      'reconnect-stream',
      { streamId: id },
      { delay: 5000 * stream.reconnectAttempts },
    );

    this.logger.log(`Reconnecting stream ${id} (attempt ${stream.reconnectAttempts})`);
  }

  async healthCheck(id: string): Promise<{ healthy: boolean; message?: string }> {
    const stream = await this.findOne(id);

    if (stream.status !== StreamStatus.ACTIVE) {
      return {
        healthy: false,
        message: `Stream is ${stream.status}`,
      };
    }

    const lastCheck = stream.lastHealthCheck;
    const now = new Date();
    const diffMinutes = lastCheck
      ? (now.getTime() - lastCheck.getTime()) / 1000 / 60
      : Infinity;

    if (diffMinutes > 5) {
      await this.handleReconnect(id);
      return {
        healthy: false,
        message: 'Stream health check timeout',
      };
    }

    return { healthy: true };
  }

  async updateStreamUrls(
    id: string,
    webrtcUrl?: string,
    hlsUrl?: string,
  ): Promise<CameraStream> {
    const stream = await this.findOne(id);
    
    if (webrtcUrl) {
      stream.webrtcUrl = webrtcUrl;
    }
    
    if (hlsUrl) {
      stream.hlsUrl = hlsUrl;
    }

    return this.streamRepository.save(stream);
  }
}
