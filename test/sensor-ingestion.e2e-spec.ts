import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SensorEventType } from '../src/modules/sensors/entities/sensor-event.entity';

describe('Sensor Ingestion (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Sensor Event Ingestion Flow', () => {
    it('should ingest a sensor event without authentication', async () => {
      const eventData = {
        deviceId: '550e8400-e29b-41d4-a716-446655440000',
        type: SensorEventType.MOTION,
        value: 'detected',
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/sensors/events')
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe(SensorEventType.MOTION);
      expect(response.body.status).toBe('pending');
    });

    it('should reject invalid sensor event data', async () => {
      const invalidData = {
        deviceId: 'invalid-uuid',
        type: 'INVALID_TYPE',
        value: 'detected',
        timestamp: 'invalid-date',
      };

      await request(app.getHttpServer())
        .post('/sensors/events')
        .send(invalidData)
        .expect(400);
    });

    it('should query sensor events with authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/sensors/events')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get event history for a device', async () => {
      const deviceId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app.getHttpServer())
        .get(`/sensors/devices/${deviceId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ hours: 24 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get event statistics for a device', async () => {
      const deviceId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await request(app.getHttpServer())
        .get(`/sensors/devices/${deviceId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ hours: 24 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('End-to-End Latency Test', () => {
    it('should process sensor event in under 2 seconds', async () => {
      const startTime = Date.now();

      const eventData = {
        deviceId: '550e8400-e29b-41d4-a716-446655440000',
        type: SensorEventType.ALARM,
        value: 'triggered',
        timestamp: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/sensors/events')
        .send(eventData)
        .expect(201);

      const endTime = Date.now();
      const latency = endTime - startTime;

      expect(latency).toBeLessThan(2000);
    });
  });
});
