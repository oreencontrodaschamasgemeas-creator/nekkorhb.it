import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Alert, AlertType, AlertSeverity, AlertStatus } from './entities/alert.entity';
import { SensorEvent, SensorEventType } from '../sensors/entities/sensor-event.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AlertDetectionService {
  private readonly logger = new Logger(AlertDetectionService.name);

  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(SensorEvent)
    private sensorEventRepository: Repository<SensorEvent>,
    private configService: ConfigService,
    private websocketGateway: WebsocketGateway,
    private notificationsService: NotificationsService,
  ) {}

  async detectAndCreateAlert(sensorEvent: SensorEvent): Promise<Alert | null> {
    const alertConfig = this.getAlertConfigForEvent(sensorEvent);

    if (!alertConfig) {
      return null;
    }

    const shouldElevate = await this.shouldElevateToAlert(sensorEvent, alertConfig);

    if (!shouldElevate) {
      return null;
    }

    const alert = this.alertRepository.create({
      deviceId: sensorEvent.deviceId,
      type: alertConfig.type,
      severity: alertConfig.severity,
      title: alertConfig.title,
      description: alertConfig.description(sensorEvent),
      sensorEventId: sensorEvent.id,
      status: AlertStatus.OPEN,
      metadata: {
        sensorType: sensorEvent.type,
        sensorValue: sensorEvent.value,
        timestamp: sensorEvent.normalizedTimestamp,
      },
    });

    const saved = await this.alertRepository.save(alert);
    this.logger.log(`Created alert ${saved.id} from sensor event ${sensorEvent.id}`);

    this.websocketGateway.broadcast('alert:created', {
      alertId: saved.id,
      type: saved.type,
      severity: saved.severity,
      deviceId: saved.deviceId,
    });

    await this.notificationsService.create({
      userId: this.configService.get('ALERT_USER_ID', '00000000-0000-0000-0000-000000000000'),
      type: 'email' as any,
      subject: `${saved.severity.toUpperCase()}: ${saved.title}`,
      message: saved.description,
      metadata: { alertId: saved.id },
    });

    return saved;
  }

  private getAlertConfigForEvent(
    sensorEvent: SensorEvent,
  ): {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: (event: SensorEvent) => string;
  } | null {
    const configs = {
      [SensorEventType.MOTION]: {
        type: AlertType.MOTION_DETECTED,
        severity: AlertSeverity.MEDIUM,
        title: 'Motion Detected',
        description: (event: SensorEvent) =>
          `Motion detected by sensor ${event.deviceId} at ${event.normalizedTimestamp.toISOString()}`,
      },
      [SensorEventType.DOOR]: {
        type: AlertType.DOOR_OPENED,
        severity: AlertSeverity.HIGH,
        title: 'Door Opened',
        description: (event: SensorEvent) =>
          `Door opened: ${event.value} at ${event.normalizedTimestamp.toISOString()}`,
      },
      [SensorEventType.ALARM]: {
        type: AlertType.ALARM_TRIGGERED,
        severity: AlertSeverity.CRITICAL,
        title: 'Alarm Triggered',
        description: (event: SensorEvent) =>
          `Alarm triggered by sensor ${event.deviceId}: ${event.value}`,
      },
      [SensorEventType.TAMPER]: {
        type: AlertType.TAMPER_DETECTED,
        severity: AlertSeverity.CRITICAL,
        title: 'Tamper Detected',
        description: (event: SensorEvent) =>
          `Tamper detected on device ${event.deviceId}`,
      },
      [SensorEventType.BATTERY_LOW]: {
        type: AlertType.BATTERY_LOW,
        severity: AlertSeverity.LOW,
        title: 'Battery Low',
        description: (event: SensorEvent) =>
          `Low battery on device ${event.deviceId}: ${event.value}%`,
      },
    };

    return configs[sensorEvent.type] || null;
  }

  private async shouldElevateToAlert(
    sensorEvent: SensorEvent,
    alertConfig: any,
  ): Promise<boolean> {
    if (sensorEvent.type === SensorEventType.MOTION) {
      return this.detectMotionAnomaly(sensorEvent);
    }

    if (
      sensorEvent.type === SensorEventType.ALARM ||
      sensorEvent.type === SensorEventType.TAMPER
    ) {
      return true;
    }

    if (sensorEvent.type === SensorEventType.DOOR) {
      return this.detectDoorAnomaly(sensorEvent);
    }

    if (sensorEvent.type === SensorEventType.BATTERY_LOW) {
      const batteryLevel = parseFloat(sensorEvent.value);
      return batteryLevel < 20;
    }

    return false;
  }

  private async detectMotionAnomaly(sensorEvent: SensorEvent): Promise<boolean> {
    const recentEvents = await this.getRecentEvents(
      sensorEvent.deviceId,
      SensorEventType.MOTION,
      5,
    );

    if (recentEvents.length < 3) {
      return false;
    }

    const motionThreshold = this.configService.get<number>('MOTION_ALERT_THRESHOLD', 3);
    return recentEvents.length >= motionThreshold;
  }

  private async detectDoorAnomaly(sensorEvent: SensorEvent): Promise<boolean> {
    const now = new Date();
    const currentHour = now.getHours();

    const afterHours = currentHour < 6 || currentHour > 22;

    if (afterHours && sensorEvent.value === 'opened') {
      return true;
    }

    return false;
  }

  private async getRecentEvents(
    deviceId: string,
    type: SensorEventType,
    minutes: number,
  ): Promise<SensorEvent[]> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - minutes);

    return this.sensorEventRepository
      .createQueryBuilder('event')
      .where('event.deviceId = :deviceId', { deviceId })
      .andWhere('event.type = :type', { type })
      .andWhere('event.normalizedTimestamp >= :since', { since })
      .orderBy('event.normalizedTimestamp', 'DESC')
      .getMany();
  }

  async findAll(filters?: {
    deviceId?: string;
    type?: AlertType;
    severity?: AlertSeverity;
    status?: AlertStatus;
  }): Promise<Alert[]> {
    const where: any = {};

    if (filters?.deviceId) {
      where.deviceId = filters.deviceId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.severity) {
      where.severity = filters.severity;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.alertRepository.find({
      where,
      relations: ['device'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id },
      relations: ['device'],
    });

    if (!alert) {
      throw new Error(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  async acknowledge(id: string, userId: string): Promise<Alert> {
    const alert = await this.findOne(id);
    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    const updated = await this.alertRepository.save(alert);

    this.websocketGateway.broadcast('alert:acknowledged', {
      alertId: id,
      acknowledgedBy: userId,
    });

    return updated;
  }

  async resolve(id: string): Promise<Alert> {
    const alert = await this.findOne(id);
    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();

    const updated = await this.alertRepository.save(alert);

    this.websocketGateway.broadcast('alert:resolved', {
      alertId: id,
    });

    return updated;
  }

  async dismiss(id: string): Promise<Alert> {
    const alert = await this.findOne(id);
    alert.status = AlertStatus.DISMISSED;

    const updated = await this.alertRepository.save(alert);

    this.websocketGateway.broadcast('alert:dismissed', {
      alertId: id,
    });

    return updated;
  }

  async linkToIncident(alertId: string, incidentId: string): Promise<Alert> {
    const alert = await this.findOne(alertId);
    alert.incidentId = incidentId;
    return this.alertRepository.save(alert);
  }
}
