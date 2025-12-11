import { Injectable, Logger } from '@nestjs/common';
import {
  IHardwareAdapter,
  ICredentialPayload,
  IDeviceCapability,
} from './hardware-adapter.interface';

@Injectable()
export class BiometricsAdapter implements IHardwareAdapter {
  private readonly logger = new Logger(BiometricsAdapter.name);

  name = 'Biometrics Adapter';
  adapterId = 'biometrics_adapter_v1';
  supportedCredentialTypes = ['fingerprint', 'face', 'iris'];

  private readonly capabilities: IDeviceCapability[] = [
    {
      name: 'fingerprint_matching',
      enabled: true,
      parameters: { minConfidence: 0.98 },
    },
    {
      name: 'face_recognition',
      enabled: true,
      parameters: { minConfidence: 0.95, livelinessCheck: true },
    },
    {
      name: 'iris_recognition',
      enabled: true,
      parameters: { minConfidence: 0.99 },
    },
    {
      name: 'multi_modal_fusion',
      enabled: true,
      parameters: { fusionMethod: 'weighted_sum' },
    },
  ];

  async parseCredential(rawData: Buffer): Promise<ICredentialPayload> {
    const startTime = Date.now();
    try {
      const header = rawData[0];
      const biometricType = this.getBiometricTypeFromHeader(header);

      if (biometricType === 'fingerprint') {
        return this.parseFingerprintData(rawData, startTime);
      } else if (biometricType === 'face') {
        return this.parseFaceData(rawData, startTime);
      } else if (biometricType === 'iris') {
        return this.parseIrisData(rawData, startTime);
      }

      throw new Error(`Unknown biometric type: ${header}`);
    } catch (error) {
      this.logger.error(`Failed to parse biometric credential: ${error.message}`);
      throw new Error(`Biometric parsing failed: ${error.message}`);
    }
  }

  async validateConnection(): Promise<boolean> {
    // Simulate connection validation
    return true;
  }

  getCapabilities(): IDeviceCapability[] {
    return this.capabilities;
  }

  private getBiometricTypeFromHeader(header: number): string {
    const typeMap: { [key: number]: string } = {
      0x01: 'fingerprint',
      0x02: 'face',
      0x03: 'iris',
      0x04: 'multi_modal',
    };

    return typeMap[header] || 'unknown';
  }

  private parseFingerprintData(rawData: Buffer, startTime: number): ICredentialPayload {
    const fingerprintId = rawData.toString('hex', 1, 17);
    const confidence = this.extractConfidence(rawData, 17);

    return {
      credentialType: 'fingerprint',
      credential: fingerprintId,
      rawData,
      timestamp: new Date(),
      confidence,
      metadata: {
        biometricType: 'fingerprint',
        fingerprintId,
        quality: Math.round(confidence * 100),
        parsedIn: Date.now() - startTime,
      },
    };
  }

  private parseFaceData(rawData: Buffer, startTime: number): ICredentialPayload {
    const faceId = rawData.toString('hex', 1, 33);
    const confidence = this.extractConfidence(rawData, 33);
    const livenessScore = this.extractLivenessScore(rawData, 34);

    return {
      credentialType: 'face',
      credential: faceId,
      rawData,
      timestamp: new Date(),
      confidence,
      metadata: {
        biometricType: 'face',
        faceId,
        quality: Math.round(confidence * 100),
        livenessScore,
        parsedIn: Date.now() - startTime,
      },
    };
  }

  private parseIrisData(rawData: Buffer, startTime: number): ICredentialPayload {
    const irisId = rawData.toString('hex', 1, 65);
    const confidence = this.extractConfidence(rawData, 65);

    return {
      credentialType: 'iris',
      credential: irisId,
      rawData,
      timestamp: new Date(),
      confidence,
      metadata: {
        biometricType: 'iris',
        irisId,
        quality: Math.round(confidence * 100),
        parsedIn: Date.now() - startTime,
      },
    };
  }

  private extractConfidence(rawData: Buffer, offset: number): number {
    if (rawData.length > offset) {
      return rawData[offset] / 255;
    }
    return 0.95;
  }

  private extractLivenessScore(rawData: Buffer, offset: number): number {
    if (rawData.length > offset) {
      return rawData[offset] / 255;
    }
    return 0.99;
  }
}
