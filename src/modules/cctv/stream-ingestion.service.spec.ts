import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { StreamIngestionService } from './stream-ingestion.service';
import { CameraStream, StreamStatus, StreamProtocol, TranscodeFormat } from './entities/camera-stream.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

describe('StreamIngestionService', () => {
  let service: StreamIngestionService;
  let mockRepository: any;
  let mockQueue: any;
  let mockWebsocketGateway: any;

  const mockStream: CameraStream = {
    id: '123',
    deviceId: 'device-1',
    name: 'Test Stream',
    protocol: StreamProtocol.RTSP,
    sourceUrl: 'rtsp://example.com/stream',
    username: 'user',
    password: 'pass',
    transcodeFormat: TranscodeFormat.BOTH,
    status: StreamStatus.IDLE,
    webrtcUrl: null,
    hlsUrl: null,
    isRecording: false,
    reconnectAttempts: 0,
    lastHealthCheck: null,
    errorMessage: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    device: null,
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: '123' })),
      find: jest.fn(() => Promise.resolve([mockStream])),
      findOne: jest.fn(() => Promise.resolve(mockStream)),
      remove: jest.fn(() => Promise.resolve(mockStream)),
    };

    mockQueue = {
      add: jest.fn(() => Promise.resolve()),
    };

    mockWebsocketGateway = {
      sendToRoom: jest.fn(),
      broadcast: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamIngestionService,
        {
          provide: getRepositoryToken(CameraStream),
          useValue: mockRepository,
        },
        {
          provide: getQueueToken('stream-processing'),
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
          useValue: mockWebsocketGateway,
        },
      ],
    }).compile();

    service = module.get<StreamIngestionService>(StreamIngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new stream', async () => {
      const createDto = {
        deviceId: 'device-1',
        name: 'Test Stream',
        protocol: StreamProtocol.RTSP,
        sourceUrl: 'rtsp://example.com/stream',
        transcodeFormat: TranscodeFormat.BOTH,
      };

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        status: StreamStatus.IDLE,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all streams', async () => {
      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['device'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockStream]);
    });
  });

  describe('findOne', () => {
    it('should return a stream by id', async () => {
      const result = await service.findOne('123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['device'],
      });
      expect(result).toEqual(mockStream);
    });

    it('should throw NotFoundException if stream not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow('Stream with ID invalid-id not found');
    });
  });

  describe('start', () => {
    it('should start a stream', async () => {
      const result = await service.start('123');

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith('start-stream', expect.objectContaining({
        streamId: '123',
        sourceUrl: mockStream.sourceUrl,
      }));
      expect(mockWebsocketGateway.sendToRoom).toHaveBeenCalled();
    });

    it('should not start if already active', async () => {
      mockRepository.findOne.mockResolvedValueOnce({
        ...mockStream,
        status: StreamStatus.ACTIVE,
      });

      const result = await service.start('123');

      expect(result.status).toBe(StreamStatus.ACTIVE);
    });
  });

  describe('stop', () => {
    it('should stop an active stream', async () => {
      mockRepository.findOne.mockResolvedValueOnce({
        ...mockStream,
        status: StreamStatus.ACTIVE,
      });

      await service.stop('123');

      expect(mockQueue.add).toHaveBeenCalledWith('stop-stream', { streamId: '123' });
      expect(mockWebsocketGateway.sendToRoom).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return unhealthy if stream is not active', async () => {
      const result = await service.healthCheck('123');

      expect(result.healthy).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should return healthy if stream is active and recently checked', async () => {
      mockRepository.findOne.mockResolvedValueOnce({
        ...mockStream,
        status: StreamStatus.ACTIVE,
        lastHealthCheck: new Date(),
      });

      const result = await service.healthCheck('123');

      expect(result.healthy).toBe(true);
    });
  });

  describe('updateStatus', () => {
    it('should update stream status', async () => {
      await service.updateStatus('123', StreamStatus.ACTIVE);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockWebsocketGateway.sendToRoom).toHaveBeenCalled();
    });

    it('should update status with error message', async () => {
      await service.updateStatus('123', StreamStatus.ERROR, 'Connection failed');

      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
