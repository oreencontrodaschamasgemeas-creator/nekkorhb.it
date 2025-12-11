import { Injectable, Logger } from '@nestjs/common';
import {
  IHardwareAdapter,
  ICredentialPayload,
  IDeviceCapability,
} from './hardware-adapter.interface';

@Injectable()
export class RfidAdapter implements IHardwareAdapter {
  private readonly logger = new Logger(RfidAdapter.name);

  name = 'RFID Adapter';
  adapterId = 'rfid_adapter_v1';
  supportedCredentialTypes = ['rfid', 'wiegand', 'osdp'];

  private readonly capabilities: IDeviceCapability[] = [
    {
      name: 'wiegand_26bit',
      enabled: true,
      parameters: { bitLength: 26 },
    },
    {
      name: 'wiegand_34bit',
      enabled: true,
      parameters: { bitLength: 34 },
    },
    {
      name: 'osdp_standard',
      enabled: true,
      parameters: { protocol: 'OSDP' },
    },
    {
      name: 'raw_hex_parsing',
      enabled: true,
    },
  ];

  async parseCredential(rawData: Buffer): Promise<ICredentialPayload> {
    const startTime = Date.now();
    try {
      if (rawData.length === 0) {
        throw new Error('Empty credential data');
      }

      const hexString = rawData.toString('hex').toUpperCase();

      // Try to parse as Wiegand format (4 bytes = 32 bits, typically 26 or 34 bit data)
      if (rawData.length === 4) {
        return this.parseWiegand(hexString, rawData);
      }

      // Try to parse as hex card ID
      const cardId = this.parseHexCardId(hexString);

      return {
        credentialType: 'rfid',
        credential: cardId,
        rawData,
        timestamp: new Date(),
        confidence: 0.95,
        metadata: {
          format: 'hex',
          parsedIn: Date.now() - startTime,
          hexString,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to parse RFID credential: ${error.message}`);
      throw new Error(`RFID parsing failed: ${error.message}`);
    }
  }

  async validateConnection(): Promise<boolean> {
    // Simulate connection validation
    return true;
  }

  getCapabilities(): IDeviceCapability[] {
    return this.capabilities;
  }

  private parseWiegand(hexString: string, rawData: Buffer): ICredentialPayload {
    const buffer = Buffer.from(hexString, 'hex');
    const bits = this.bufferToBitString(buffer);

    let facilityCode = 0;
    let cardNumber = 0;
    let bitLength = bits.length;

    if (bits.length === 26) {
      // Wiegand 26-bit format
      facilityCode = parseInt(bits.substring(1, 9), 2);
      cardNumber = parseInt(bits.substring(9, 25), 2);
      bitLength = 26;
    } else if (bits.length === 34) {
      // Wiegand 34-bit format
      facilityCode = parseInt(bits.substring(2, 16), 2);
      cardNumber = parseInt(bits.substring(16, 32), 2);
      bitLength = 34;
    }

    const credential = `${facilityCode}_${cardNumber}`;

    return {
      credentialType: 'wiegand',
      credential,
      rawData,
      timestamp: new Date(),
      confidence: 0.98,
      metadata: {
        format: `wiegand_${bitLength}bit`,
        facilityCode,
        cardNumber,
        bitLength,
      },
    };
  }

  private parseHexCardId(hexString: string): string {
    // Parse decimal card ID from hex string
    const buffer = Buffer.from(hexString, 'hex');
    let cardId = '';

    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      if (byte !== 0) {
        cardId += byte.toString(16).padStart(2, '0');
      }
    }

    return cardId || hexString;
  }

  private bufferToBitString(buffer: Buffer): string {
    let bitString = '';
    for (let i = 0; i < buffer.length; i++) {
      bitString += buffer[i].toString(2).padStart(8, '0');
    }
    return bitString;
  }
}
