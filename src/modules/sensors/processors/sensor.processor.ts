import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SensorIngestionService } from '../sensor-ingestion.service';
import { AlertDetectionService } from '../../alerts/alert-detection.service';
import { SensorEventStatus } from '../entities/sensor-event.entity';

@Processor('sensor-processing')
export class SensorProcessor {
  private readonly logger = new Logger(SensorProcessor.name);

  constructor(
    private sensorService: SensorIngestionService,
    private alertService: AlertDetectionService,
  ) {}

  @Process('process-sensor-event')
  async handleProcessEvent(job: Job): Promise<void> {
    const { eventId, deviceId, type, value } = job.data;

    try {
      this.logger.log(`Processing sensor event ${eventId}`);

      const event = await this.sensorService.findOne(eventId);

      const alert = await this.alertService.detectAndCreateAlert(event);

      if (alert) {
        await this.sensorService.updateStatus(
          eventId,
          SensorEventStatus.ELEVATED,
          alert.id,
        );
        this.logger.log(`Elevated sensor event ${eventId} to alert ${alert.id}`);
      } else {
        await this.sensorService.updateStatus(eventId, SensorEventStatus.PROCESSED);
        this.logger.log(`Processed sensor event ${eventId} without alert`);
      }
    } catch (error) {
      this.logger.error(`Failed to process sensor event ${eventId}: ${error.message}`);
      await this.sensorService.updateStatus(eventId, SensorEventStatus.IGNORED);
    }
  }
}
