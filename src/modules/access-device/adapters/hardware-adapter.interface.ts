export interface ICredentialPayload {
  credentialType: string;
  credential: string;
  rawData: Buffer;
  timestamp: Date;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface IDeviceCapability {
  name: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export interface IHardwareAdapter {
  name: string;
  adapterId: string;
  supportedCredentialTypes: string[];
  parseCredential(rawData: Buffer): Promise<ICredentialPayload>;
  validateConnection(): Promise<boolean>;
  getCapabilities(): IDeviceCapability[];
}
