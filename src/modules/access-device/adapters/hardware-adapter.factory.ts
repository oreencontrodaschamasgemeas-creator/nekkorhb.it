import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IHardwareAdapter } from './hardware-adapter.interface';
import { RfidAdapter } from './rfid.adapter';
import { BiometricsAdapter } from './biometrics.adapter';
import { KeypadAdapter } from './keypad.adapter';
import { AccessDeviceType } from '../entities/access-device.entity';

@Injectable()
export class HardwareAdapterFactory {
  private readonly logger = new Logger(HardwareAdapterFactory.name);

  private readonly adapters: Map<string, IHardwareAdapter>;

  constructor(
    private rfidAdapter: RfidAdapter,
    private biometricsAdapter: BiometricsAdapter,
    private keypadAdapter: KeypadAdapter,
  ) {
    this.adapters = new Map();
    this.registerAdapters();
  }

  private registerAdapters(): void {
    this.adapters.set(AccessDeviceType.RFID_READER, this.rfidAdapter);
    this.adapters.set(AccessDeviceType.BIOMETRIC_SCANNER, this.biometricsAdapter);
    this.adapters.set(AccessDeviceType.KEYPAD, this.keypadAdapter);
    // Multi-modal can use all adapters
    this.adapters.set(AccessDeviceType.MULTI_MODAL, this.rfidAdapter);

    this.logger.log(`Registered ${this.adapters.size} hardware adapters`);
  }

  getAdapter(deviceType: AccessDeviceType): IHardwareAdapter {
    const adapter = this.adapters.get(deviceType);

    if (!adapter) {
      throw new NotFoundException(`Hardware adapter not found for device type: ${deviceType}`);
    }

    return adapter;
  }

  getAdapterByCredentialType(credentialType: string): IHardwareAdapter {
    for (const adapter of this.adapters.values()) {
      if (adapter.supportedCredentialTypes.includes(credentialType)) {
        return adapter;
      }
    }

    throw new NotFoundException(
      `Hardware adapter not found for credential type: ${credentialType}`,
    );
  }

  getAllAdapters(): IHardwareAdapter[] {
    return Array.from(this.adapters.values());
  }
}
