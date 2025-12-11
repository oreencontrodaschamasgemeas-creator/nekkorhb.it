import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Incident, IncidentStatus } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
    @InjectQueue('incidents')
    private incidentsQueue: Queue,
  ) {}

  async create(createIncidentDto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentsRepository.create(createIncidentDto);
    const savedIncident = await this.incidentsRepository.save(incident);

    await this.incidentsQueue.add('process-incident', {
      incidentId: savedIncident.id,
      priority: savedIncident.priority,
    });

    return savedIncident;
  }

  async findAll(): Promise<Incident[]> {
    return this.incidentsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentsRepository.findOne({ where: { id } });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    return incident;
  }

  async update(id: string, updateIncidentDto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id);

    if (updateIncidentDto.status === IncidentStatus.RESOLVED && !incident.resolvedAt) {
      updateIncidentDto['resolvedAt'] = new Date();
    }

    await this.incidentsRepository.update(id, updateIncidentDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const incident = await this.findOne(id);
    await this.incidentsRepository.remove(incident);
  }
}
