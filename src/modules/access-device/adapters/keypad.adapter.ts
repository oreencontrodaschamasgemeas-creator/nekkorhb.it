import { Injectable, Logger } from '@nestjs/common';
import {
  IHardwareAdapter,
  ICredentialPayload,
  IDeviceCapability,
} from './hardware-adapter.interface';

@Injectable()
export class KeypadAdapter implements IHardwareAdapter {
  private readonly logger = new Logger(KeypadAdapter.name);

  name = 'Keypad Adapter';
  adapterId = 'keypad_adapter_v1';
  supportedCredentialTypes = ['pin'];

  private readonly capabilities: IDeviceCapability[] = [
    {
      name: 'pin_entry',
      enabled: true,
      parameters: { minLength: 4, maxLength: 8 },
    },
    {
      name: 'backspace_support',
      enabled: true,
    },
    {
      name: 'input_masking',
      enabled: true,
    },
    {
      name: 'timeout_protection',
      enabled: true,
      parameters: { timeoutSeconds: 30 },
    },
  ];

  async parseCredential(rawData: Buffer): Promise<ICredentialPayload> {
    const startTime = Date.now();
    try {
      const pinCode = rawData.toString('utf-8').trim();

      // Validate PIN format (digits only)
      if (!/^\d{4,8}$/.test(pinCode)) {
        throw new Error('Invalid PIN format');
      }

      return {
        credentialType: 'pin',
        credential: pinCode,
        rawData,
        timestamp: new Date(),
        confidence: 1.0,
        metadata: {
          pinLength: pinCode.length,
          parsedIn: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to parse PIN credential: ${error.message}`);
      throw new Error(`PIN parsing failed: ${error.message}`);
    }
  }

  async validateConnection(): Promise<boolean> {
    // Simulate connection validation
    return true;
  }

  getCapabilities(): IDeviceCapability[] {
    return this.capabilities;
  }
}
