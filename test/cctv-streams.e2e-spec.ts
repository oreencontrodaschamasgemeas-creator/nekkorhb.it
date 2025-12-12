import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { StreamProtocol, TranscodeFormat } from '../src/modules/cctv/entities/camera-stream.entity';

describe('CCTV Streams (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let streamId: string;

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

  describe('Stream Lifecycle Management', () => {
    it('should create a new camera stream', async () => {
      const streamData = {
        deviceId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Camera Stream',
        protocol: StreamProtocol.RTSP,
        sourceUrl: 'rtsp://example.com/stream',
        username: 'testuser',
        password: 'testpass',
        transcodeFormat: TranscodeFormat.BOTH,
        isRecording: false,
      };

      const response = await request(app.getHttpServer())
        .post('/cctv/streams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(streamData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(streamData.name);
      expect(response.body.status).toBe('idle');

      streamId = response.body.id;
    });

    it('should get all camera streams', async () => {
      const response = await request(app.getHttpServer())
        .get('/cctv/streams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get a specific camera stream', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cctv/streams/${streamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(streamId);
    });

    it('should start a camera stream', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cctv/streams/${streamId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(['starting', 'active']).toContain(response.body.status);
    });

    it('should check stream health', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cctv/streams/${streamId}/health`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('healthy');
    });

    it('should get live stream URL', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cctv/streams/${streamId}/live-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('webrtcUrl');
      expect(response.body).toHaveProperty('hlsUrl');
    });

    it('should stop a camera stream', async () => {
      const response = await request(app.getHttpServer())
        .post(`/cctv/streams/${streamId}/stop`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('should update a camera stream', async () => {
      const updateData = {
        name: 'Updated Stream Name',
        isRecording: true,
      };

      const response = await request(app.getHttpServer())
        .patch(`/cctv/streams/${streamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
    });

    it('should delete a camera stream', async () => {
      await request(app.getHttpServer())
        .delete(`/cctv/streams/${streamId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('RTSP Ingestion', () => {
    it('should handle RTSP stream creation', async () => {
      const rtspData = {
        deviceId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'RTSP Test Stream',
        protocol: StreamProtocol.RTSP,
        sourceUrl: 'rtsp://192.168.1.100:554/stream',
        username: 'admin',
        password: 'admin123',
        transcodeFormat: TranscodeFormat.HLS,
      };

      const response = await request(app.getHttpServer())
        .post('/cctv/streams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rtspData)
        .expect(201);

      expect(response.body.protocol).toBe(StreamProtocol.RTSP);
      expect(response.body.transcodeFormat).toBe(TranscodeFormat.HLS);
    });

    it('should handle ONVIF stream creation', async () => {
      const onvifData = {
        deviceId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'ONVIF Test Stream',
        protocol: StreamProtocol.ONVIF,
        sourceUrl: 'http://192.168.1.100/onvif/device_service',
        username: 'admin',
        password: 'admin123',
        transcodeFormat: TranscodeFormat.WEBRTC,
      };

      const response = await request(app.getHttpServer())
        .post('/cctv/streams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(onvifData)
        .expect(201);

      expect(response.body.protocol).toBe(StreamProtocol.ONVIF);
    });
  });
});
