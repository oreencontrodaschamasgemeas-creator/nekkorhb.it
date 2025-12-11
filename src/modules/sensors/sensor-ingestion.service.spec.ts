import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { SensorIngestionService } from './sensor-ingestion.service';
import { SensorEvent, SensorEventType, SensorEventStatus } from './entities/sensor-event.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(() => Promise.resolve(null)),
    setex: jest.fn(() => Promise.resolve('OK')),
  }));
});

describe('SensorIngestionService', () => {
  let service: SensorIngestionService;
  let mockRepository: any;
  let mockQueue: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: 'event-123' })),
      findOne: jest.fn(() => Promise.resolve({
        id: 'event-123',
        deviceId: 'device-1',
        type: SensorEventType.MOTION,
        value: 'detected',
        timestamp: new Date(),
        normalizedTimestamp: new Date(),
        status: SensorEventStatus.PENDING,
      })),
      find: jest.fn(() => Promise.resolve([])),
      findAndCount: jest.fn(() => Promise.resolve([[], 0])),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(() => Promise.resolve([])),
        getMany: jest.fn(() => Promise.resolve([])),
      })),
    };

    mockQueue = {
      add: jest.fn(() => Promise.resolve()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensorIngestionService,
        {
          provide: getRepositoryToken(SensorEvent),
          useValue: mockRepository,
        },
        {
          provide: getQueueToken('sensor-processing'),
          useValue: mockQueue,
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
            sendToRoom: jest.fn(),
            broadcast: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SensorIngestionService>(SensorIngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingest', () => {
    it('should ingest a sensor event', async () => {
      const ingestDto = {
        deviceId: 'device-1',
        type: SensorEventType.MOTION,
        value: 'detected',
        timestamp: new Date().toISOString(),
      };

      const result = await service.ingest(ingestDto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('process-sensor-event', expect.any(Object));
      expect(result).toBeDefined();
      expect(result.id).toBe('event-123');
    });

    it('should detect and skip duplicate events', async () => {
      const ingestDto = {
        deviceId: 'device-1',
        type: SensorEventType.MOTION,
        value: 'detected',
        timestamp: new Date().toISOString(),
      };

      const Redis = require('ioredis');
      const mockRedisInstance = new Redis();
      mockRedisInstance.get = jest.fn(() => Promise.resolve('1'));

      mockRepository.findOne.mockResolvedValueOnce({
        id: 'existing-event',
        deduplicationKey: 'test-key',
      });

      const firstResult = await service.ingest(ingestDto);

      expect(firstResult).toBeDefined();
    });

    it('should normalize timestamps with large drift', async () => {
      const oldTimestamp = new Date();
      oldTimestamp.setHours(oldTimestamp.getHours() - 2);

      const ingestDto = {
        deviceId: 'device-1',
        type: SensorEventType.MOTION,
        value: 'detected',
        timestamp: oldTimestamp.toISOString(),
      };

      await service.ingest(ingestDto);

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return filtered sensor events', async () => {
      const query = {
        deviceId: 'device-1',
        type: SensorEventType.MOTION,
        page: 1,
        limit: 50,
      };

      await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update event status', async () => {
      await service.updateStatus('event-123', SensorEventStatus.PROCESSED);

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should update status with alert ID', async () => {
      await service.updateStatus('event-123', SensorEventStatus.ELEVATED, 'alert-123');

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('getEventHistory', () => {
    it('should return event history for a device', async () => {
      await service.getEventHistory('device-1', 24);

      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('getEventStats', () => {
    it('should return event statistics for a device', async () => {
      const mockStats = [
        { type: 'motion', count: '5' },
        { type: 'door', count: '2' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(() => Promise.resolve(mockStats)),
      };

      mockRepository.createQueryBuilder.mockReturnValueOnce(mockQueryBuilder);

      const result = await service.getEventStats('device-1', 24);

      expect(result).toEqual([
        { type: 'motion', count: 5 },
        { type: 'door', count: 2 },
      ]);
    });
  });
});
