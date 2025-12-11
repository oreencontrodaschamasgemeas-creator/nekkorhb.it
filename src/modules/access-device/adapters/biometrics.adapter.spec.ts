import { Test, TestingModule } from '@nestjs/testing';
import { BiometricsAdapter } from './biometrics.adapter';

describe('BiometricsAdapter', () => {
  let adapter: BiometricsAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BiometricsAdapter],
    }).compile();

    adapter = module.get<BiometricsAdapter>(BiometricsAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('parseCredential', () => {
    it('should parse fingerprint data', async () => {
      const rawData = Buffer.alloc(18);
      rawData[0] = 0x01; // Fingerprint type
      rawData.fill(0xaa, 1, 17); // Fingerprint ID
      rawData[17] = 0xf0; // Confidence

      const result = await adapter.parseCredential(rawData);

      expect(result.credentialType).toBe('fingerprint');
      expect(result.metadata?.biometricType).toBe('fingerprint');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should parse face data', async () => {
      const rawData = Buffer.alloc(34);
      rawData[0] = 0x02; // Face type
      rawData.fill(0xbb, 1, 33); // Face ID
      rawData[33] = 0xf0; // Confidence

      const result = await adapter.parseCredential(rawData);

      expect(result.credentialType).toBe('face');
      expect(result.metadata?.biometricType).toBe('face');
      expect(result.metadata?.livenessScore).toBeDefined();
    });

    it('should parse iris data', async () => {
      const rawData = Buffer.alloc(66);
      rawData[0] = 0x03; // Iris type
      rawData.fill(0xcc, 1, 65); // Iris ID
      rawData[65] = 0xf0; // Confidence

      const result = await adapter.parseCredential(rawData);

      expect(result.credentialType).toBe('iris');
      expect(result.metadata?.biometricType).toBe('iris');
    });

    it('should throw error for unknown biometric type', async () => {
      const rawData = Buffer.alloc(10);
      rawData[0] = 0xff; // Unknown type

      await expect(adapter.parseCredential(rawData)).rejects.toThrow();
    });
  });

  describe('supported credential types', () => {
    it('should support fingerprint, face, and iris', () => {
      expect(adapter.supportedCredentialTypes).toContain('fingerprint');
      expect(adapter.supportedCredentialTypes).toContain('face');
      expect(adapter.supportedCredentialTypes).toContain('iris');
    });
  });

  describe('getCapabilities', () => {
    it('should return list of capabilities', () => {
      const capabilities = adapter.getCapabilities();

      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
      expect(capabilities.some((c) => c.name === 'fingerprint_matching')).toBe(true);
      expect(capabilities.some((c) => c.name === 'face_recognition')).toBe(true);
    });
  });
});
