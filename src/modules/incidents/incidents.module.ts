import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { Incident } from './entities/incident.entity';
import { IncidentAnnotation } from './entities/incident-annotation.entity';
import { IncidentEvidenceLink } from './entities/incident-evidence-link.entity';
import { IncidentProcessor } from './processors/incident.processor';
import { IncidentWorkflowService } from './services/incident-workflow.service';
import { IncidentNotificationService } from './services/incident-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident, IncidentAnnotation, IncidentEvidenceLink]),
    BullModule.registerQueue(
      {
        name: 'incidents',
      },
      {
        name: 'notifications',
      },
    ),
  ],
  controllers: [IncidentsController],
  providers: [
    IncidentsService,
    IncidentProcessor,
    IncidentWorkflowService,
    IncidentNotificationService,
  ],
  exports: [IncidentsService, IncidentWorkflowService, IncidentNotificationService],
})
export class IncidentsModule {}
