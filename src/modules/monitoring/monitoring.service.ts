import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitoringFeed } from './entities/monitoring-feed.entity';
import { CreateMonitoringFeedDto } from './dto/create-monitoring-feed.dto';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(MonitoringFeed)
    private monitoringRepository: Repository<MonitoringFeed>,
  ) {}

  async create(createMonitoringFeedDto: CreateMonitoringFeedDto): Promise<MonitoringFeed> {
    const feed = this.monitoringRepository.create(createMonitoringFeedDto);
    return this.monitoringRepository.save(feed);
  }

  async findAll(limit: number = 100): Promise<MonitoringFeed[]> {
    return this.monitoringRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findByDevice(deviceId: string, limit: number = 50): Promise<MonitoringFeed[]> {
    return this.monitoringRepository.find({
      where: { deviceId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
