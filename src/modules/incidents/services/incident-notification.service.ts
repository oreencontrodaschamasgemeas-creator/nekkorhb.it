import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Incident, IncidentStatus, IncidentPriority } from '../entities/incident.entity';
import { NotificationType } from '../../notifications/entities/notification.entity';

@Injectable()
export class IncidentNotificationService {
  private readonly logger = new Logger(IncidentNotificationService.name);

  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
  ) {}

  async notifyIncidentCreated(incident: Incident): Promise<void> {
    await this.sendTemplatedNotifications(incident, 'incident_created', {
      incidentId: incident.id,
      title: incident.title,
      priority: incident.priority,
      description: incident.description,
    });
  }

  async notifyIncidentStatusChanged(incident: Incident, oldStatus: IncidentStatus): Promise<void> {
    await this.sendTemplatedNotifications(incident, 'incident_status_changed', {
      incidentId: incident.id,
      title: incident.title,
      oldStatus,
      newStatus: incident.status,
    });
  }

  async notifyIncidentEscalated(incident: Incident, oldPriority: IncidentPriority): Promise<void> {
    await this.sendTemplatedNotifications(incident, 'incident_escalated', {
      incidentId: incident.id,
      title: incident.title,
      oldPriority,
      newPriority: incident.priority,
    });
  }

  async notifyIncidentAcknowledged(incident: Incident, acknowledgedBy: string): Promise<void> {
    await this.sendTemplatedNotifications(incident, 'incident_acknowledged', {
      incidentId: incident.id,
      title: incident.title,
      acknowledgedBy,
    });
  }

  async notifyIncidentReassigned(incident: Incident, oldAssignee?: string): Promise<void> {
    await this.sendTemplatedNotifications(incident, 'incident_reassigned', {
      incidentId: incident.id,
      title: incident.title,
      oldAssignee,
      newAssignee: incident.assignedTo,
      assignees: incident.assignees,
    });
  }

  async notifyAnnotationAdded(
    incidentId: string,
    annotationId: string,
    userId: string,
  ): Promise<void> {
    const incident = await this.incidentsRepository.findOne({ where: { id: incidentId } });
    if (!incident) return;

    await this.sendTemplatedNotifications(incident, 'incident_annotated', {
      incidentId,
      title: incident.title,
      annotationId,
      userId,
    });
  }

  private async sendTemplatedNotifications(
    incident: Incident,
    template: string,
    context: Record<string, any>,
  ): Promise<void> {
    // Get recipients
    const recipients = this.getNotificationRecipients(incident);

    // Determine channels based on priority
    const channels = this.getChannelsForPriority(incident.priority);

    // Create deduplication key
    const deduplicationKey = `${incident.id}-${template}-${Date.now()}`;

    // Queue notifications for each recipient and channel
    for (const recipient of recipients) {
      for (const channel of channels) {
        const job = {
          recipientId: recipient,
          incidentId: incident.id,
          template,
          context,
          channel,
          deduplicationKey,
          retryCount: 0,
        };

        await this.notificationsQueue.add('send-incident-notification', job, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        });
      }
    }

    this.logger.debug(
      `Queued ${recipients.length * channels.length} notifications for incident ${incident.id}`,
    );
  }

  private getNotificationRecipients(incident: Incident): string[] {
    const recipients = new Set<string>();

    // Add assigned users
    if (incident.assignedTo) {
      recipients.add(incident.assignedTo);
    }

    // Add all assignees
    if (incident.assignees && incident.assignees.length > 0) {
      incident.assignees.forEach((assignee) => recipients.add(assignee));
    }

    return Array.from(recipients);
  }

  private getChannelsForPriority(priority: IncidentPriority): NotificationType[] {
    const channelMap: Record<IncidentPriority, NotificationType[]> = {
      [IncidentPriority.LOW]: [NotificationType.IN_APP],
      [IncidentPriority.MEDIUM]: [NotificationType.IN_APP, NotificationType.EMAIL],
      [IncidentPriority.HIGH]: [
        NotificationType.IN_APP,
        NotificationType.EMAIL,
        NotificationType.PUSH,
      ],
      [IncidentPriority.CRITICAL]: [
        NotificationType.IN_APP,
        NotificationType.EMAIL,
        NotificationType.PUSH,
        NotificationType.SMS,
      ],
    };

    return channelMap[priority];
  }

  async markNotificationAsAcknowledged(incidentId: string, userId: string): Promise<void> {
    this.logger.debug(`Marking notifications acknowledged for incident ${incidentId} by ${userId}`);
    // Implement acknowledgement tracking in notifications service
  }
}
