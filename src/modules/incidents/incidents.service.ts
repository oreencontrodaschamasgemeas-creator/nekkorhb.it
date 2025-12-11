import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Incident, IncidentStatus, IncidentSource } from './entities/incident.entity';
import { IncidentAnnotation } from './entities/incident-annotation.entity';
import { IncidentEvidenceLink } from './entities/incident-evidence-link.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { CreateEvidenceLinkDto } from './dto/create-evidence-link.dto';
import { IncidentWorkflowService } from './services/incident-workflow.service';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
    @InjectRepository(IncidentAnnotation)
    private annotationsRepository: Repository<IncidentAnnotation>,
    @InjectRepository(IncidentEvidenceLink)
    private evidenceLinksRepository: Repository<IncidentEvidenceLink>,
    @InjectQueue('incidents')
    private incidentsQueue: Queue,
    private workflowService: IncidentWorkflowService,
  ) {}

  async create(createIncidentDto: CreateIncidentDto): Promise<Incident> {
    const incidentData: any = {
      ...createIncidentDto,
      source: createIncidentDto.source || IncidentSource.MANUAL,
    };

    // Calculate SLA deadline if not provided
    if (!incidentData.slaDeadline) {
      incidentData.slaDeadline = this.workflowService.calculateSlaDeadline(incidentData.priority);
    } else {
      incidentData.slaDeadline = new Date(incidentData.slaDeadline);
    }

    // Ensure assignees array
    if (!incidentData.assignees) {
      incidentData.assignees = [];
    }
    if (incidentData.assignedTo && !incidentData.assignees.includes(incidentData.assignedTo)) {
      incidentData.assignees.push(incidentData.assignedTo);
    }

    const incident = this.incidentsRepository.create(incidentData);
    const savedIncident = (await this.incidentsRepository.save(incident)) as unknown as Incident;

    this.logger.log(
      `Incident created: ${savedIncident.id} (Priority: ${savedIncident.priority}, Source: ${savedIncident.source})`,
    );

    // Queue incident processing
    await this.incidentsQueue.add(
      'process-incident',
      {
        incidentId: savedIncident.id,
        priority: savedIncident.priority,
        source: savedIncident.source,
      },
      { delay: 0 },
    );

    return this.findOne(savedIncident.id);
  }

  async findAll(filters?: {
    status?: IncidentStatus;
    priority?: string;
    deviceId?: string;
  }): Promise<Incident[]> {
    const query = this.incidentsRepository.createQueryBuilder('incident');

    if (filters?.status) {
      query.andWhere('incident.status = :status', { status: filters.status });
    }
    if (filters?.priority) {
      query.andWhere('incident.priority = :priority', { priority: filters.priority });
    }
    if (filters?.deviceId) {
      query.andWhere('incident.deviceId = :deviceId', { deviceId: filters.deviceId });
    }

    return query.orderBy('incident.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentsRepository.findOne({
      where: { id },
      relations: ['annotations', 'evidenceLinks'],
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    return incident;
  }

  async update(id: string, updateIncidentDto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id);

    // Validate status transition
    if (updateIncidentDto.status) {
      if (
        !this.workflowService.validateStatusTransition(incident.status, updateIncidentDto.status)
      ) {
        throw new BadRequestException(
          `Cannot transition from ${incident.status} to ${updateIncidentDto.status}`,
        );
      }

      // Set resolution timestamp when resolving
      if (updateIncidentDto.status === IncidentStatus.RESOLVED && !incident.resolvedAt) {
        updateIncidentDto['resolvedAt'] = new Date();
      }

      // Set closed timestamp when closing
      if (updateIncidentDto.status === IncidentStatus.CLOSED && !incident.closedAt) {
        if (!this.workflowService.canClose(incident.status)) {
          throw new BadRequestException('Can only close resolved incidents');
        }
        updateIncidentDto['closedAt'] = new Date();
      }
    }

    // Update SLA deadline if provided
    if (updateIncidentDto.slaDeadline && typeof updateIncidentDto.slaDeadline === 'string') {
      (updateIncidentDto as any).slaDeadline = new Date(updateIncidentDto.slaDeadline);
    }

    // Validate resolution checklist if transitioning to resolved
    if (updateIncidentDto.status === IncidentStatus.RESOLVED) {
      const checklistToValidate =
        updateIncidentDto.resolutionChecklist || incident.resolutionChecklist;
      if (!this.workflowService.validateResolutionChecklist(checklistToValidate)) {
        throw new BadRequestException(
          'Cannot resolve incident without completing resolution checklist',
        );
      }
    }

    // Update assignees if provided
    if (updateIncidentDto.assignees) {
      updateIncidentDto['assignees'] = updateIncidentDto.assignees;
    }

    await this.incidentsRepository.update(id, updateIncidentDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const incident = await this.findOne(id);
    await this.incidentsRepository.remove(incident);
  }

  async createAnnotation(
    incidentId: string,
    createAnnotationDto: CreateAnnotationDto,
    userId: string,
  ): Promise<IncidentAnnotation> {
    // Verify incident exists
    await this.findOne(incidentId);

    const annotation = this.annotationsRepository.create({
      ...createAnnotationDto,
      incidentId,
      userId,
    });

    const savedAnnotation = (await this.annotationsRepository.save(
      annotation,
    )) as unknown as IncidentAnnotation;
    this.logger.log(`Annotation created for incident ${incidentId}`);

    // Queue notification for annotation
    await this.incidentsQueue.add(
      'notify-annotation',
      {
        incidentId,
        annotationId: savedAnnotation.id,
        userId,
      },
      { delay: 0 },
    );

    return savedAnnotation;
  }

  async getAnnotations(incidentId: string): Promise<IncidentAnnotation[]> {
    // Verify incident exists
    await this.findOne(incidentId);

    return this.annotationsRepository.find({
      where: { incidentId },
      order: { createdAt: 'DESC' },
    });
  }

  async addEvidenceLink(
    incidentId: string,
    createEvidenceLinkDto: CreateEvidenceLinkDto,
  ): Promise<IncidentEvidenceLink> {
    // Verify incident exists
    await this.findOne(incidentId);

    const evidenceData: any = {
      ...createEvidenceLinkDto,
      incidentId,
    };

    if (evidenceData.timestamp && typeof evidenceData.timestamp === 'string') {
      evidenceData.timestamp = new Date(evidenceData.timestamp);
    }

    const evidenceLink = this.evidenceLinksRepository.create(evidenceData);
    const savedLink = (await this.evidenceLinksRepository.save(
      evidenceLink,
    )) as unknown as IncidentEvidenceLink;

    this.logger.log(`Evidence link added to incident ${incidentId} (Type: ${savedLink.type})`);

    return savedLink;
  }

  async getEvidenceLinks(incidentId: string): Promise<IncidentEvidenceLink[]> {
    // Verify incident exists
    await this.findOne(incidentId);

    return this.evidenceLinksRepository.find({
      where: { incidentId },
      order: { createdAt: 'DESC' },
    });
  }

  async acknowledge(incidentId: string, userId: string): Promise<Incident> {
    const incident = await this.findOne(incidentId);

    if (incident.acknowledgedAt) {
      throw new BadRequestException('Incident already acknowledged');
    }

    await this.incidentsRepository.update(incidentId, {
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    });

    this.logger.log(`Incident ${incidentId} acknowledged by ${userId}`);

    // Queue acknowledgement notification
    await this.incidentsQueue.add(
      'notify-acknowledgement',
      {
        incidentId,
        userId,
      },
      { delay: 0 },
    );

    return this.findOne(incidentId);
  }

  async checkAndEscalate(incidentId: string): Promise<Incident | null> {
    const incident = await this.findOne(incidentId);

    if (
      this.workflowService.shouldAutoEscalate(
        incident.status,
        incident.slaDeadline,
        incident.escalatedAt,
        incident.priority,
      )
    ) {
      const newPriority = this.workflowService.getEscalationPriority(incident.priority);

      await this.incidentsRepository.update(incidentId, {
        priority: newPriority,
        escalatedAt: new Date(),
      });

      this.logger.log(
        `Incident ${incidentId} escalated from ${incident.priority} to ${newPriority}`,
      );

      // Queue escalation notification
      await this.incidentsQueue.add(
        'notify-escalation',
        {
          incidentId,
          oldPriority: incident.priority,
          newPriority,
        },
        { delay: 0 },
      );

      return this.findOne(incidentId);
    }

    return null;
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const incidents = await this.incidentsRepository.find();

    return {
      total: incidents.length,
      byStatus: incidents.reduce(
        (acc, inc) => {
          acc[inc.status] = (acc[inc.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byPriority: incidents.reduce(
        (acc, inc) => {
          acc[inc.priority] = (acc[inc.priority] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
