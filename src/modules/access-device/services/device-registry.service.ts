import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessDevice, AccessDeviceStatus } from '../entities/access-device.entity';
import { AccessDeviceCapability } from '../entities/access-device-capability.entity';
import { RegisterAccessDeviceDto } from '../dto/register-access-device.dto';
import { HardwareAdapterFactory } from '../adapters/hardware-adapter.factory';

@Injectable()
export class DeviceRegistryService {
  private readonly logger = new Logger(DeviceRegistryService.name);

  constructor(
    @InjectRepository(AccessDevice)
    private devicesRepository: Repository<AccessDevice>,
    @InjectRepository(AccessDeviceCapability)
    private capabilitiesRepository: Repository<AccessDeviceCapability>,
    private adapterFactory: HardwareAdapterFactory,
  ) {}

  async registerDevice(registerDto: RegisterAccessDeviceDto): Promise<AccessDevice> {
    this.logger.log(`Registering device: ${registerDto.deviceId}`);

    // Check if device already exists
    const existing = await this.devicesRepository.findOne({
      where: [{ deviceId: registerDto.deviceId }, { serialNumber: registerDto.serialNumber }],
    });

    if (existing) {
      throw new Error(
        `Device with ID ${registerDto.deviceId} or serial number ${registerDto.serialNumber} already registered`,
      );
    }

    // Get adapter to verify capabilities
    const adapter = this.adapterFactory.getAdapter(registerDto.type);

    // Create device entity
    const device = this.devicesRepository.create({
      name: registerDto.name,
      serialNumber: registerDto.serialNumber,
      deviceId: registerDto.deviceId,
      type: registerDto.type,
      firmware: registerDto.firmware,
      model: registerDto.model,
      location: registerDto.location,
      zone: registerDto.zone,
      ipAddresses: registerDto.ipAddresses || [],
      networkInfo: registerDto.networkInfo,
      supportedCredentialTypes:
        registerDto.supportedCredentialTypes || adapter.supportedCredentialTypes,
      metadata: registerDto.metadata,
      status: AccessDeviceStatus.OFFLINE,
    });

    const savedDevice = await this.devicesRepository.save(device);

    // Register capabilities
    const capabilities = adapter.getCapabilities();
    for (const capability of capabilities) {
      const capabilityEntity = this.capabilitiesRepository.create({
        deviceId: savedDevice.id,
        capability: capability.name,
        parameters: capability.parameters,
        enabled: capability.enabled,
      });
      await this.capabilitiesRepository.save(capabilityEntity);
    }

    const fullDevice = await this.devicesRepository.findOne({
      where: { id: savedDevice.id },
      relations: ['capabilities'],
    });

    this.logger.log(`Device registered successfully: ${registerDto.deviceId}`);
    return fullDevice;
  }

  async findDeviceById(deviceId: string): Promise<AccessDevice> {
    const device = await this.devicesRepository.findOne({
      where: { deviceId },
      relations: ['capabilities'],
    });

    if (!device) {
      throw new NotFoundException(`Device not found: ${deviceId}`);
    }

    return device;
  }

  async findDeviceByInternalId(id: string): Promise<AccessDevice> {
    const device = await this.devicesRepository.findOne({
      where: { id },
      relations: ['capabilities'],
    });

    if (!device) {
      throw new NotFoundException(`Device not found: ${id}`);
    }

    return device;
  }

  async updateDeviceStatus(deviceId: string, status: AccessDeviceStatus): Promise<AccessDevice> {
    const device = await this.findDeviceById(deviceId);
    device.status = status;
    device.lastSeenAt = new Date();
    device.failedAttempts = 0;

    return this.devicesRepository.save(device);
  }

  async recordFailedAttempt(deviceId: string): Promise<void> {
    const device = await this.findDeviceById(deviceId);
    device.failedAttempts += 1;

    if (device.failedAttempts > 10) {
      device.status = AccessDeviceStatus.OFFLINE;
      this.logger.warn(`Device marked offline due to repeated failures: ${deviceId}`);
    }

    await this.devicesRepository.save(device);
  }

  async recordSuccessfulAttempt(deviceId: string): Promise<void> {
    const device = await this.findDeviceById(deviceId);
    device.lastSeenAt = new Date();
    device.failedAttempts = Math.max(0, device.failedAttempts - 1);

    if (device.status !== AccessDeviceStatus.ONLINE) {
      device.status = AccessDeviceStatus.ONLINE;
      this.logger.log(`Device came back online: ${deviceId}`);
    }

    await this.devicesRepository.save(device);
  }

  async getAllDevices(): Promise<AccessDevice[]> {
    return this.devicesRepository.find({
      relations: ['capabilities'],
    });
  }

  async getDevicesByZone(zone: string): Promise<AccessDevice[]> {
    return this.devicesRepository.find({
      where: { zone },
      relations: ['capabilities'],
    });
  }

  async getOnlineDevices(): Promise<AccessDevice[]> {
    return this.devicesRepository.find({
      where: { status: AccessDeviceStatus.ONLINE },
      relations: ['capabilities'],
    });
  }
}
