import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { StreamIngestionService } from '../stream-ingestion.service';
import { StreamStatus, StreamProtocol } from '../entities/camera-stream.entity';

@Processor('stream-processing')
export class StreamProcessor {
  private readonly logger = new Logger(StreamProcessor.name);
  private activeStreamProcesses: Map<string, any> = new Map();

  constructor(
    private streamService: StreamIngestionService,
    private configService: ConfigService,
  ) {}

  @Process('start-stream')
  async handleStartStream(job: Job): Promise<void> {
    const { streamId, sourceUrl, username, password, protocol, transcodeFormat } = job.data;

    try {
      this.logger.log(`Starting stream ${streamId}`);

      const rtspUrl = this.buildRtspUrl(sourceUrl, username, password);

      const webrtcUrl = `${this.configService.get('WEBRTC_BASE_URL', 'ws://localhost:8000')}/stream/${streamId}`;
      const hlsUrl = `${this.configService.get('HLS_BASE_URL', 'http://localhost:8080')}/hls/${streamId}/playlist.m3u8`;

      await this.streamService.updateStreamUrls(streamId, webrtcUrl, hlsUrl);

      await this.streamService.updateStatus(streamId, StreamStatus.ACTIVE);

      this.activeStreamProcesses.set(streamId, {
        sourceUrl: rtspUrl,
        webrtcUrl,
        hlsUrl,
        startedAt: new Date(),
      });

      this.logger.log(`Stream ${streamId} started successfully`);
    } catch (error) {
      this.logger.error(`Failed to start stream ${streamId}: ${error.message}`);
      await this.streamService.updateStatus(
        streamId,
        StreamStatus.ERROR,
        error.message,
      );
    }
  }

  @Process('stop-stream')
  async handleStopStream(job: Job): Promise<void> {
    const { streamId } = job.data;

    try {
      this.logger.log(`Stopping stream ${streamId}`);

      const process = this.activeStreamProcesses.get(streamId);
      if (process) {
        this.activeStreamProcesses.delete(streamId);
      }

      await this.streamService.updateStatus(streamId, StreamStatus.IDLE);

      this.logger.log(`Stream ${streamId} stopped successfully`);
    } catch (error) {
      this.logger.error(`Failed to stop stream ${streamId}: ${error.message}`);
    }
  }

  @Process('reconnect-stream')
  async handleReconnectStream(job: Job): Promise<void> {
    const { streamId } = job.data;

    try {
      this.logger.log(`Reconnecting stream ${streamId}`);

      const stream = await this.streamService.findOne(streamId);

      await this.handleStartStream({
        ...job,
        data: {
          streamId,
          sourceUrl: stream.sourceUrl,
          username: stream.username,
          password: stream.password,
          protocol: stream.protocol,
          transcodeFormat: stream.transcodeFormat,
        },
      });

      await this.streamService.updateStatus(streamId, StreamStatus.ACTIVE);
      
      const updatedStream = await this.streamService.findOne(streamId);
      updatedStream.reconnectAttempts = 0;
      await this.streamService.update(streamId, { metadata: updatedStream.metadata });

      this.logger.log(`Stream ${streamId} reconnected successfully`);
    } catch (error) {
      this.logger.error(`Failed to reconnect stream ${streamId}: ${error.message}`);
      await this.streamService.handleReconnect(streamId);
    }
  }

  @Process('health-check')
  async handleHealthCheck(job: Job): Promise<void> {
    const { streamId } = job.data;

    try {
      const result = await this.streamService.healthCheck(streamId);

      if (!result.healthy) {
        this.logger.warn(`Stream ${streamId} health check failed: ${result.message}`);
      }
    } catch (error) {
      this.logger.error(`Health check failed for stream ${streamId}: ${error.message}`);
    }
  }

  private buildRtspUrl(sourceUrl: string, username?: string, password?: string): string {
    if (!username || !password) {
      return sourceUrl;
    }

    const url = new URL(sourceUrl);
    url.username = username;
    url.password = password;
    return url.toString();
  }
}
