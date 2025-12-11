import { Test, TestingModule } from '@nestjs/testing';
import { RfidAdapter } from './rfid.adapter';

describe('RfidAdapter', () => {
  let adapter: RfidAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RfidAdapter],
    }).compile();

    adapter = module.get<RfidAdapter>(RfidAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('parseCredential', () => {
    it('should parse hex format RFID credential', async () => {
      const rawData = Buffer.from([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]);

      const result = await adapter.parseCredential(rawData);

      expect(result.credentialType).toBe('rfid');
      expect(result.credential).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should parse Wiegand 26-bit format', async () => {
      // Simulating Wiegand 26-bit data
      const rawData = Buffer.alloc(4);
      rawData[0] = 0b01100101;
      rawData[1] = 0b01100110;
      rawData[2] = 0b00000000;
      rawData[3] = 0b10000000;

      const result = await adapter.parseCredential(rawData);

      expect(result.credentialType).toBe('wiegand');
      expect(result.metadata?.format).toContain('wiegand');
      expect(result.metadata?.facilityCode).toBeDefined();
      expect(result.metadata?.cardNumber).toBeDefined();
    });

    it('should throw error on empty data', async () => {
      const rawData = Buffer.alloc(0);

      await expect(adapter.parseCredential(rawData)).rejects.toThrow('Empty credential data');
    });
  });

  describe('validateConnection', () => {
    it('should return true for valid connection', async () => {
      const result = await adapter.validateConnection();

      expect(result).toBe(true);
    });
  });

  describe('getCapabilities', () => {
    it('should return list of capabilities', () => {
      const capabilities = adapter.getCapabilities();

      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
      expect(capabilities[0].name).toBeDefined();
      expect(capabilities[0].enabled).toBeDefined();
    });
  });

  describe('supported credential types', () => {
    it('should support rfid, wiegand, and osdp', () => {
      expect(adapter.supportedCredentialTypes).toContain('rfid');
      expect(adapter.supportedCredentialTypes).toContain('wiegand');
      expect(adapter.supportedCredentialTypes).toContain('osdp');
    });
  });
});
