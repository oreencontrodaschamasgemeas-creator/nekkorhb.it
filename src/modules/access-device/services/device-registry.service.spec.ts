import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeviceRegistryService } from './device-registry.service';
import { AccessDevice, AccessDeviceStatus } from '../entities/access-device.entity';
import { AccessDeviceCapability } from '../entities/access-device-capability.entity';
import { HardwareAdapterFactory } from '../adapters/hardware-adapter.factory';
import { RegisterAccessDeviceDto } from '../dto/register-access-device.dto';
import { AccessDeviceType } from '../entities/access-device.entity';

describe('DeviceRegistryService', () => {
  let service: DeviceRegistryService;
  let mockRepository: any;
  let mockCapabilityRepository: any;
  let mockAdapterFactory: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockCapabilityRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockAdapterFactory = {
      getAdapter: jest.fn().mockReturnValue({
        supportedCredentialTypes: ['rfid', 'wiegand'],
        getCapabilities: jest.fn().mockReturnValue([{ name: 'cap1', enabled: true }]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceRegistryService,
        {
          provide: getRepositoryToken(AccessDevice),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(AccessDeviceCapability),
          useValue: mockCapabilityRepository,
        },
        {
          provide: HardwareAdapterFactory,
          useValue: mockAdapterFactory,
        },
      ],
    }).compile();

    service = module.get<DeviceRegistryService>(DeviceRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerDevice', () => {
    it('should register a new device successfully', async () => {
      const registerDto: RegisterAccessDeviceDto = {
        name: 'Test Device',
        serialNumber: 'SN-123',
        deviceId: 'device-123',
        type: AccessDeviceType.RFID_READER,
        firmware: '1.0.0',
      };

      const mockDevice: Partial<AccessDevice> = {
        id: 'uuid-123',
        ...registerDto,
        capabilities: [],
      };

      mockRepository.findOne.mockResolvedValueOnce(null); // First check - no existing device
      mockRepository.create.mockReturnValue(mockDevice);
      mockRepository.save.mockResolvedValue(mockDevice);
      mockRepository.findOne.mockResolvedValueOnce({
        ...mockDevice,
        capabilities: [{ name: 'cap1' }],
      }); // Second call to get full device

      const result = await service.registerDevice(registerDto);

      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining(registerDto));
      expect(result.id).toBe('uuid-123');
    });

    it('should throw error if device already exists', async () => {
      const registerDto: RegisterAccessDeviceDto = {
        name: 'Test Device',
        serialNumber: 'SN-456',
        deviceId: 'device-456',
        type: AccessDeviceType.RFID_READER,
        firmware: '1.0.0',
      };

      mockRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.registerDevice(registerDto)).rejects.toThrow();
    });
  });

  describe('findDeviceById', () => {
    it('should find device by deviceId', async () => {
      const device: Partial<AccessDevice> = {
        id: 'uuid-123',
        deviceId: 'device-123',
        capabilities: [],
      };

      mockRepository.findOne.mockResolvedValue(device);

      const result = await service.findDeviceById('device-123');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { deviceId: 'device-123' },
        relations: ['capabilities'],
      });
      expect(result).toEqual(device);
    });

    it('should throw if device not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findDeviceById('non-existent')).rejects.toThrow();
    });
  });

  describe('updateDeviceStatus', () => {
    it('should update device status', async () => {
      const device: Partial<AccessDevice> = {
        id: 'uuid-123',
        deviceId: 'device-123',
        status: AccessDeviceStatus.OFFLINE,
        failedAttempts: 5,
      };

      mockRepository.findOne.mockResolvedValue(device);
      mockRepository.save.mockImplementation((d) => Promise.resolve(d));

      const result = await service.updateDeviceStatus('device-123', AccessDeviceStatus.ONLINE);

      expect(result.status).toBe(AccessDeviceStatus.ONLINE);
      expect(result.failedAttempts).toBe(0);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment failed attempts', async () => {
      const device: Partial<AccessDevice> = {
        deviceId: 'device-123',
        failedAttempts: 5,
      };

      mockRepository.findOne.mockResolvedValue(device);
      mockRepository.save.mockResolvedValue(device);

      await service.recordFailedAttempt('device-123');

      expect(device.failedAttempts).toBe(6);
    });

    it('should mark device offline after 10 failed attempts', async () => {
      const device: Partial<AccessDevice> = {
        deviceId: 'device-123',
        failedAttempts: 10,
        status: AccessDeviceStatus.ONLINE,
      };

      mockRepository.findOne.mockResolvedValue(device);
      mockRepository.save.mockResolvedValue(device);

      await service.recordFailedAttempt('device-123');

      expect(device.failedAttempts).toBe(11);
      expect(device.status).toBe(AccessDeviceStatus.OFFLINE);
    });
  });
});
