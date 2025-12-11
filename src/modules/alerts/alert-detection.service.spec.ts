import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AlertDetectionService } from './alert-detection.service';
import { Alert, AlertType, AlertSeverity, AlertStatus } from './entities/alert.entity';
import { SensorEvent, SensorEventType } from '../sensors/entities/sensor-event.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';

describe('AlertDetectionService', () => {
  let service: AlertDetectionService;
  let mockAlertRepository: any;
  let mockSensorEventRepository: any;
  let mockNotificationsService: any;

  beforeEach(async () => {
    mockAlertRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: 'alert-123' })),
      find: jest.fn(() => Promise.resolve([])),
      findOne: jest.fn(() => Promise.resolve({
        id: 'alert-123',
        deviceId: 'device-1',
        type: AlertType.MOTION_DETECTED,
        severity: AlertSeverity.MEDIUM,
        status: AlertStatus.OPEN,
        title: 'Motion Detected',
        description: 'Test alert',
      })),
    };

    mockSensorEventRepository = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(() => Promise.resolve([])),
      })),
    };

    mockNotificationsService = {
      create: jest.fn(() => Promise.resolve({ id: 'notif-123' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertDetectionService,
        {
          provide: getRepositoryToken(Alert),
          useValue: mockAlertRepository,
        },
        {
          provide: getRepositoryToken(SensorEvent),
          useValue: mockSensorEventRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => defaultValue),
          },
        },
        {
          provide: WebsocketGateway,
          useValue: {
            broadcast: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<AlertDetectionService>(AlertDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectAndCreateAlert', () => {
    it('should create an alert for alarm event', async () => {
      const sensorEvent: SensorEvent = {
        id: 'event-123',
        deviceId: 'device-1',
        type: SensorEventType.ALARM,
        value: 'triggered',
        timestamp: new Date(),
        normalizedTimestamp: new Date(),
        status: null,
        alertId: null,
        rawData: {},
        deduplicationKey: 'test-key',
        createdAt: new Date(),
        device: null,
      };

      const result = await service.detectAndCreateAlert(sensorEvent);

      expect(mockAlertRepository.create).toHaveBeenCalled();
      expect(mockAlertRepository.save).toHaveBeenCalled();
      expect(mockNotificationsService.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('alert-123');
    });

    it('should not create alert for temperature event', async () => {
      const sensorEvent: SensorEvent = {
        id: 'event-123',
        deviceId: 'device-1',
        type: SensorEventType.TEMPERATURE,
        value: '25',
        timestamp: new Date(),
        normalizedTimestamp: new Date(),
        status: null,
        alertId: null,
        rawData: {},
        deduplicationKey: 'test-key',
        createdAt: new Date(),
        device: null,
      };

      const result = await service.detectAndCreateAlert(sensorEvent);

      expect(result).toBeNull();
    });

    it('should create alert for low battery', async () => {
      const sensorEvent: SensorEvent = {
        id: 'event-123',
        deviceId: 'device-1',
        type: SensorEventType.BATTERY_LOW,
        value: '15',
        timestamp: new Date(),
        normalizedTimestamp: new Date(),
        status: null,
        alertId: null,
        rawData: {},
        deduplicationKey: 'test-key',
        createdAt: new Date(),
        device: null,
      };

      const result = await service.detectAndCreateAlert(sensorEvent);

      expect(result).toBeDefined();
    });

    it('should not create alert for sufficient battery', async () => {
      const sensorEvent: SensorEvent = {
        id: 'event-123',
        deviceId: 'device-1',
        type: SensorEventType.BATTERY_LOW,
        value: '50',
        timestamp: new Date(),
        normalizedTimestamp: new Date(),
        status: null,
        alertId: null,
        rawData: {},
        deduplicationKey: 'test-key',
        createdAt: new Date(),
        device: null,
      };

      const result = await service.detectAndCreateAlert(sensorEvent);

      expect(result).toBeNull();
    });
  });

  describe('acknowledge', () => {
    it('should acknowledge an alert', async () => {
      const result = await service.acknowledge('alert-123', 'user-123');

      expect(mockAlertRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('resolve', () => {
    it('should resolve an alert', async () => {
      const result = await service.resolve('alert-123');

      expect(mockAlertRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('dismiss', () => {
    it('should dismiss an alert', async () => {
      const result = await service.dismiss('alert-123');

      expect(mockAlertRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('linkToIncident', () => {
    it('should link alert to incident', async () => {
      const result = await service.linkToIncident('alert-123', 'incident-123');

      expect(mockAlertRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return alerts with filters', async () => {
      const filters = {
        deviceId: 'device-1',
        type: AlertType.MOTION_DETECTED,
        severity: AlertSeverity.HIGH,
        status: AlertStatus.OPEN,
      };

      await service.findAll(filters);

      expect(mockAlertRepository.find).toHaveBeenCalled();
    });
  });
});
