import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { SensorEvent, SensorEventStatus } from './entities/sensor-event.entity';
import { IngestEventDto } from './dto/ingest-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { createHash } from 'crypto';

@Injectable()
export class SensorIngestionService {
  private readonly logger = new Logger(SensorIngestionService.name);
  private redis: Redis;
  private readonly deduplicationWindow = 5000;

  constructor(
    @InjectRepository(SensorEvent)
    private eventRepository: Repository<SensorEvent>,
    @InjectQueue('sensor-processing')
    private sensorQueue: Queue,
    private configService: ConfigService,
    private websocketGateway: WebsocketGateway,
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }

  async ingest(ingestDto: IngestEventDto): Promise<SensorEvent> {
    const receivedAt = new Date();
    const eventTimestamp = new Date(ingestDto.timestamp);
    const normalizedTimestamp = this.normalizeTimestamp(eventTimestamp, receivedAt);

    const deduplicationKey = this.generateDeduplicationKey(ingestDto);
    const isDuplicate = await this.checkDuplicate(deduplicationKey);

    if (isDuplicate) {
      this.logger.warn(`Duplicate sensor event detected: ${deduplicationKey}`);
      const existing = await this.eventRepository.findOne({
        where: { deduplicationKey },
        order: { createdAt: 'DESC' },
      });
      return existing;
    }

    const event = this.eventRepository.create({
      deviceId: ingestDto.deviceId,
      type: ingestDto.type,
      value: ingestDto.value,
      timestamp: eventTimestamp,
      normalizedTimestamp,
      rawData: ingestDto.rawData,
      deduplicationKey,
      status: SensorEventStatus.PENDING,
    });

    const saved = await this.eventRepository.save(event);

    await this.storeDuplicateKey(deduplicationKey);

    await this.sensorQueue.add('process-sensor-event', {
      eventId: saved.id,
      deviceId: saved.deviceId,
      type: saved.type,
      value: saved.value,
    });

    this.websocketGateway.sendToRoom(
      `device:${saved.deviceId}`,
      'sensor:event',
      {
        eventId: saved.id,
        type: saved.type,
        value: saved.value,
        timestamp: saved.normalizedTimestamp,
      },
    );

    const latency = Date.now() - eventTimestamp.getTime();
    this.logger.log(`Ingested sensor event ${saved.id} with ${latency}ms latency`);

    return saved;
  }

  async findAll(query: QueryEventsDto): Promise<{ data: SensorEvent[]; total: number }> {
    const { deviceId, type, status, startTime, endTime, page = 1, limit = 50 } = query;

    const where: any = {};

    if (deviceId) {
      where.deviceId = deviceId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startTime && endTime) {
      where.normalizedTimestamp = Between(new Date(startTime), new Date(endTime));
    } else if (startTime) {
      where.normalizedTimestamp = Between(new Date(startTime), new Date());
    }

    const [data, total] = await this.eventRepository.findAndCount({
      where,
      relations: ['device'],
      order: { normalizedTimestamp: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<SensorEvent> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['device'],
    });

    if (!event) {
      throw new Error(`Sensor event with ID ${id} not found`);
    }

    return event;
  }

  async updateStatus(id: string, status: SensorEventStatus, alertId?: string): Promise<SensorEvent> {
    const event = await this.findOne(id);
    event.status = status;

    if (alertId) {
      event.alertId = alertId;
    }

    return this.eventRepository.save(event);
  }

  private normalizeTimestamp(eventTimestamp: Date, receivedAt: Date): Date {
    const maxDrift = this.configService.get<number>('MAX_TIMESTAMP_DRIFT_MS', 60000);
    const drift = Math.abs(receivedAt.getTime() - eventTimestamp.getTime());

    if (drift > maxDrift) {
      this.logger.warn(
        `Large timestamp drift detected: ${drift}ms, using server time`,
      );
      return receivedAt;
    }

    return eventTimestamp;
  }

  private generateDeduplicationKey(dto: IngestEventDto): string {
    const payload = `${dto.deviceId}:${dto.type}:${dto.value}:${dto.timestamp}`;
    return createHash('sha256').update(payload).digest('hex');
  }

  private async checkDuplicate(key: string): Promise<boolean> {
    const exists = await this.redis.get(`dedup:${key}`);
    return exists !== null;
  }

  private async storeDuplicateKey(key: string): Promise<void> {
    await this.redis.setex(
      `dedup:${key}`,
      Math.ceil(this.deduplicationWindow / 1000),
      '1',
    );
  }

  async getEventHistory(
    deviceId: string,
    hours: number = 24,
  ): Promise<SensorEvent[]> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    return this.eventRepository.find({
      where: {
        deviceId,
        normalizedTimestamp: Between(startTime, new Date()),
      },
      order: { normalizedTimestamp: 'ASC' },
    });
  }

  async getEventStats(
    deviceId: string,
    hours: number = 24,
  ): Promise<{ type: string; count: number }[]> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const results = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('event.deviceId = :deviceId', { deviceId })
      .andWhere('event.normalizedTimestamp >= :startTime', { startTime })
      .groupBy('event.type')
      .getRawMany();

    return results.map((r) => ({ type: r.type, count: parseInt(r.count, 10) }));
  }
}
