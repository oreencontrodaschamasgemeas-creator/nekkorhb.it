import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../entities/incident.entity';
import { IncidentNotificationService } from '../services/incident-notification.service';

@Processor('incidents')
export class IncidentProcessor {
  private readonly logger = new Logger(IncidentProcessor.name);

  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
    private notificationService: IncidentNotificationService,
  ) {}

  @Process('process-incident')
  async handleIncident(job: Job) {
    const { incidentId, source } = job.data;

    try {
      this.logger.log(`Processing incident ${incidentId} from source: ${source}`);

      const incident = await this.incidentsRepository.findOne({
        where: { id: incidentId },
      });

      if (!incident) {
        this.logger.warn(`Incident ${incidentId} not found`);
        return { success: false, error: 'Incident not found' };
      }

      // Send notification for incident creation
      await this.notificationService.notifyIncidentCreated(incident);

      // Check if escalation is needed (for critical incidents)
      if (incident.slaDeadline && new Date() > incident.slaDeadline) {
        await this.notificationService.notifyIncidentEscalated(incident, incident.priority);
      }

      this.logger.log(`Incident ${incidentId} processed successfully`);
      return { success: true, incidentId };
    } catch (error) {
      this.logger.error(`Error processing incident ${incidentId}:`, error);
      throw error;
    }
  }

  @Process('notify-annotation')
  async handleAnnotationNotification(job: Job) {
    const { incidentId, annotationId, userId } = job.data;

    try {
      this.logger.log(`Processing annotation notification for incident ${incidentId}`);
      await this.notificationService.notifyAnnotationAdded(incidentId, annotationId, userId);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing annotation notification:`, error);
      throw error;
    }
  }

  @Process('notify-escalation')
  async handleEscalationNotification(job: Job) {
    const { incidentId, oldPriority } = job.data;

    try {
      this.logger.log(`Processing escalation notification for incident ${incidentId}`);

      const incident = await this.incidentsRepository.findOne({
        where: { id: incidentId },
      });

      if (incident) {
        await this.notificationService.notifyIncidentEscalated(incident, oldPriority);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing escalation notification:`, error);
      throw error;
    }
  }

  @Process('notify-acknowledgement')
  async handleAcknowledgementNotification(job: Job) {
    const { incidentId, userId } = job.data;

    try {
      this.logger.log(`Processing acknowledgement notification for incident ${incidentId}`);

      const incident = await this.incidentsRepository.findOne({
        where: { id: incidentId },
      });

      if (incident) {
        await this.notificationService.notifyIncidentAcknowledged(incident, userId);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing acknowledgement notification:`, error);
      throw error;
    }
  }
}
