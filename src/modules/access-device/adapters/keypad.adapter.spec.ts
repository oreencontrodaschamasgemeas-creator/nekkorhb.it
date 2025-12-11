import { Test, TestingModule } from '@nestjs/testing';
import { KeypadAdapter } from './keypad.adapter';

describe('KeypadAdapter', () => {
  let adapter: KeypadAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeypadAdapter],
    }).compile();

    adapter = module.get<KeypadAdapter>(KeypadAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('parseCredential', () => {
    it('should parse valid PIN code', async () => {
      const rawData = Buffer.from('1234');

      const result = await adapter.parseCredential(rawData);

      expect(result.credentialType).toBe('pin');
      expect(result.credential).toBe('1234');
      expect(result.confidence).toBe(1.0);
    });

    it('should parse PIN with leading/trailing whitespace', async () => {
      const rawData = Buffer.from('  5678  ');

      const result = await adapter.parseCredential(rawData);

      expect(result.credential).toBe('5678');
    });

    it('should reject PIN with non-digit characters', async () => {
      const rawData = Buffer.from('123A');

      await expect(adapter.parseCredential(rawData)).rejects.toThrow();
    });

    it('should reject PIN that is too short', async () => {
      const rawData = Buffer.from('123');

      await expect(adapter.parseCredential(rawData)).rejects.toThrow();
    });

    it('should reject PIN that is too long', async () => {
      const rawData = Buffer.from('123456789');

      await expect(adapter.parseCredential(rawData)).rejects.toThrow();
    });

    it('should accept PIN of valid length (4-8 digits)', async () => {
      const validPins = ['1234', '12345', '123456', '1234567', '12345678'];

      for (const pin of validPins) {
        const rawData = Buffer.from(pin);
        const result = await adapter.parseCredential(rawData);
        expect(result.credential).toBe(pin);
      }
    });
  });

  describe('supported credential types', () => {
    it('should support pin', () => {
      expect(adapter.supportedCredentialTypes).toContain('pin');
    });
  });

  describe('getCapabilities', () => {
    it('should return list of capabilities', () => {
      const capabilities = adapter.getCapabilities();

      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.some((c) => c.name === 'pin_entry')).toBe(true);
      expect(capabilities.some((c) => c.name === 'input_masking')).toBe(true);
    });
  });
});
