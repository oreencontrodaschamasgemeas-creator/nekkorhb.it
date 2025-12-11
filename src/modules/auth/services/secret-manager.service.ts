import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'crypto';

export interface SigningKeyPair {
  kid: string;
  algorithm: 'RS256';
  publicKey: string;
  privateKey: string;
  createdAt: Date;
}

@Injectable()
export class SecretManagerService implements OnModuleDestroy {
  private readonly logger = new Logger(SecretManagerService.name);
  private activeKeyPair: SigningKeyPair;
  private previousKeyPairs: SigningKeyPair[] = [];
  private rotationTimer?: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.initializeKeyMaterial();
  }

  private initializeKeyMaterial() {
    const privateKey = this.configService.get<string>('JWT_PRIVATE_KEY');
    const publicKey = this.configService.get<string>('JWT_PUBLIC_KEY');
    const kid = this.configService.get<string>('JWT_KEY_ID');

    if (privateKey && publicKey) {
      this.activeKeyPair = {
        kid: kid || `env-${Date.now()}`,
        algorithm: 'RS256',
        privateKey,
        publicKey,
        createdAt: new Date(),
      };
      this.logger.log(`Loaded signing key ${this.activeKeyPair.kid} from configuration`);
    } else {
      this.activeKeyPair = this.generateKeyPair();
      this.logger.log(`Generated ephemeral signing key ${this.activeKeyPair.kid}`);
    }

    this.scheduleRotation();
  }

  private generateKeyPair(): SigningKeyPair {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return {
      kid: `kp-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`,
      algorithm: 'RS256',
      privateKey,
      publicKey,
      createdAt: new Date(),
    };
  }

  private scheduleRotation() {
    const rotationInterval = Number(this.configService.get('JWT_ROTATION_INTERVAL_MS') ?? 1000 * 60 * 60 * 24);

    if (rotationInterval <= 0) {
      this.logger.warn('JWT rotation interval disabled');
      return;
    }

    this.rotationTimer = setInterval(() => this.rotateKeys(), rotationInterval);
    if (typeof this.rotationTimer.unref === 'function') {
      this.rotationTimer.unref();
    }
  }

  async rotateKeys() {
    const newKeyPair = this.generateKeyPair();
    this.previousKeyPairs.unshift(this.activeKeyPair);
    this.previousKeyPairs = this.previousKeyPairs.slice(0, 5);
    this.activeKeyPair = newKeyPair;
    this.logger.log(`Rotated signing key material. Active kid=${this.activeKeyPair.kid}`);
  }

  async getActiveKeyPair(): Promise<SigningKeyPair> {
    return this.activeKeyPair;
  }

  async getPublicKey(kid?: string): Promise<string> {
    if (!kid || kid === this.activeKeyPair.kid) {
      return this.activeKeyPair.publicKey;
    }

    const historicPair = this.previousKeyPairs.find((pair) => pair.kid === kid);
    if (!historicPair) {
      throw new Error(`Unknown signing key id: ${kid}`);
    }

    return historicPair.publicKey;
  }

  onModuleDestroy() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
  }
}
