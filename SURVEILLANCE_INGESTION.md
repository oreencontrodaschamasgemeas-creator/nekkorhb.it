# Surveillance Ingestion System

## Overview

This document describes the comprehensive video and sensor ingestion backbone implemented for the surveillance system.

## Features

### 1. CCTV Service

The CCTV service handles video stream ingestion and management:

- **Stream Protocols**: Supports RTSP, ONVIF, and HTTP streams
- **Transcoding**: Converts streams to WebRTC and HLS formats for dashboard and mobile consumption
- **Lifecycle Management**: Start, stop, and monitor stream health
- **Reconnection**: Automatic reconnection with exponential backoff
- **Health Checks**: Periodic health monitoring with automatic recovery

#### API Endpoints

- `POST /cctv/streams` - Create a new camera stream
- `GET /cctv/streams` - List all streams
- `GET /cctv/streams/:id` - Get stream details
- `PATCH /cctv/streams/:id` - Update stream configuration
- `DELETE /cctv/streams/:id` - Delete a stream
- `POST /cctv/streams/:id/start` - Start streaming
- `POST /cctv/streams/:id/stop` - Stop streaming
- `GET /cctv/streams/:id/health` - Check stream health
- `GET /cctv/streams/:id/live-url` - Get WebRTC/HLS URLs

### 2. Recording Pipelines

The recording system chunks video and stores it with retention policies:

- **Object Storage**: Integrates with AWS S3 for video storage
- **Chunking**: Automatically chunks video streams into manageable segments
- **Retention Policies**: Configurable retention periods (default: 30 days)
- **Incident Linking**: Extended retention for incident-related recordings (365 days)
- **Searchable Metadata**: Indexed by camera, timestamp, and incident
- **Automatic Cleanup**: Daily cleanup job for expired recordings

#### API Endpoints

- `GET /recordings` - Query recordings with filters
- `GET /recordings/:id` - Get recording details
- `GET /recordings/:id/playback-url` - Get signed playback URL
- `POST /recordings/:id/link-incident` - Link recording to incident
- `DELETE /recordings/:id` - Delete a recording

### 3. Sensor Ingestion Service

The sensor service handles real-time event ingestion from IoT devices:

- **Event Types**: Motion, door, alarm, temperature, humidity, tamper, battery
- **Deduplication**: Redis-based deduplication with 5-second window
- **Timestamp Normalization**: Handles clock drift up to 60 seconds
- **Message Bus**: Publishes events to Bull queue for async processing
- **Real-time Broadcasting**: WebSocket notifications for live events
- **Low Latency**: Sub-2-second end-to-end latency

#### API Endpoints

- `POST /sensors/events` - Ingest sensor event (no auth required)
- `GET /sensors/events` - Query sensor events with filters
- `GET /sensors/events/:id` - Get event details
- `GET /sensors/devices/:deviceId/history` - Get event history
- `GET /sensors/devices/:deviceId/stats` - Get event statistics

### 4. Motion/Anomaly Detection

The alert detection service elevates sensor events to actionable alerts:

- **Motion Detection**: Triggers alert after multiple motion events in 5 minutes
- **Door Anomaly**: Detects after-hours door openings
- **Alarm Handling**: Immediate elevation of alarm events
- **Battery Monitoring**: Alerts when battery drops below 20%
- **Tamper Detection**: Critical alerts for device tampering
- **Severity Levels**: Low, Medium, High, Critical

#### API Endpoints

- `GET /alerts` - Query alerts with filters
- `GET /alerts/:id` - Get alert details
- `POST /alerts/:id/acknowledge` - Acknowledge an alert
- `POST /alerts/:id/resolve` - Resolve an alert
- `POST /alerts/:id/dismiss` - Dismiss an alert
- `POST /alerts/:id/link-incident` - Link alert to incident

## Configuration

Add the following to your `.env` file:

```env
# CCTV Streaming
WEBRTC_BASE_URL=ws://localhost:8000
HLS_BASE_URL=http://localhost:8080
MAX_RECONNECT_ATTEMPTS=5

# Recordings
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=surveillance-recordings
RECORDING_RETENTION_DAYS=30
INCIDENT_RECORDING_RETENTION_DAYS=365

# Sensors
MAX_TIMESTAMP_DRIFT_MS=60000
MOTION_ALERT_THRESHOLD=3

# Alerts
ALERT_EMAIL=admin@example.com
```

## Architecture

### Stream Processing Flow

1. **Ingestion**: Stream created via API
2. **Queue Job**: Start stream job added to Bull queue
3. **Processor**: Stream processor handles RTSP/ONVIF connection
4. **Transcoding**: FFmpeg transcodes to WebRTC/HLS formats
5. **Distribution**: URLs provided for dashboard/mobile consumption
6. **Health Monitoring**: Periodic health checks ensure stream stability
7. **Reconnection**: Automatic recovery on connection loss

### Recording Flow

1. **Chunking**: Video streams chunked every N seconds
2. **Metadata**: Recording entry created with metadata
3. **Upload**: Chunk uploaded to S3 via async job
4. **Indexing**: Recording indexed by camera, time, and incident
5. **Playback**: Signed URLs generated for secure playback
6. **Retention**: Daily job cleans up expired recordings

### Sensor Event Flow

1. **Ingestion**: Event posted to `/sensors/events` endpoint
2. **Deduplication**: Redis checks for duplicates
3. **Normalization**: Timestamp normalized for clock drift
4. **Storage**: Event saved to PostgreSQL
5. **Queue**: Processing job added to Bull queue
6. **Detection**: Alert detection service evaluates event
7. **Elevation**: Alert created if conditions met
8. **Notification**: Email/push notifications sent
9. **WebSocket**: Real-time broadcast to connected clients

**Latency**: < 2 seconds end-to-end

## Database Schema

### camera_streams

- `id` (UUID) - Primary key
- `deviceId` (UUID) - Foreign key to devices
- `name` (String) - Stream name
- `protocol` (Enum) - RTSP, ONVIF, HTTP
- `sourceUrl` (String) - Source stream URL
- `username` (String) - Auth username
- `password` (String) - Auth password
- `transcodeFormat` (Enum) - WebRTC, HLS, BOTH
- `status` (Enum) - idle, starting, active, stopping, error, reconnecting
- `webrtcUrl` (String) - WebRTC endpoint
- `hlsUrl` (String) - HLS playlist URL
- `isRecording` (Boolean) - Recording enabled
- `reconnectAttempts` (Integer) - Reconnection count
- `lastHealthCheck` (Timestamp) - Last health check
- `errorMessage` (String) - Error details

### recordings

- `id` (UUID) - Primary key
- `cameraStreamId` (UUID) - Foreign key to camera_streams
- `incidentId` (UUID) - Optional incident link
- `filename` (String) - Storage filename
- `storagePath` (String) - S3 path
- `storageUrl` (String) - S3 URL
- `fileSize` (BigInt) - File size in bytes
- `duration` (Integer) - Duration in seconds
- `startTime` (Timestamp) - Recording start
- `endTime` (Timestamp) - Recording end
- `status` (Enum) - pending, recording, completed, failed, archived
- `expiresAt` (Timestamp) - Expiration date

### sensor_events

- `id` (UUID) - Primary key
- `deviceId` (UUID) - Foreign key to devices
- `type` (Enum) - motion, door, alarm, temperature, humidity, tamper, battery_low
- `value` (String) - Event value
- `timestamp` (Timestamp) - Original timestamp
- `normalizedTimestamp` (Timestamp) - Normalized timestamp
- `status` (Enum) - pending, processed, elevated, ignored
- `alertId` (UUID) - Optional alert link
- `rawData` (JSONB) - Raw event data
- `deduplicationKey` (String) - Hash for deduplication

### alerts

- `id` (UUID) - Primary key
- `deviceId` (UUID) - Foreign key to devices
- `type` (Enum) - motion_detected, anomaly_detected, door_opened, alarm_triggered, tamper_detected, battery_low
- `severity` (Enum) - low, medium, high, critical
- `status` (Enum) - open, acknowledged, resolved, dismissed
- `title` (String) - Alert title
- `description` (Text) - Alert description
- `sensorEventId` (UUID) - Optional sensor event link
- `incidentId` (UUID) - Optional incident link
- `acknowledgedBy` (UUID) - User who acknowledged
- `acknowledgedAt` (Timestamp) - Acknowledgment time
- `resolvedAt` (Timestamp) - Resolution time

## Testing

### Unit Tests

Run unit tests for parsers and services:

```bash
npm test
```

Tests include:
- Stream ingestion service
- Sensor ingestion service
- Alert detection service
- Deduplication logic
- Timestamp normalization

### Integration Tests

Run end-to-end integration tests:

```bash
npm run test:e2e
```

Tests include:
- RTSP stream ingestion
- Sensor event flow (< 2s latency)
- Alert creation and management
- Recording playback URLs

## Monitoring

### Metrics

- Stream health status
- Recording success/failure rates
- Sensor event ingestion rate
- Alert generation rate
- End-to-end latency

### WebSocket Events

Subscribe to real-time events:
- `stream:status` - Stream status changes
- `sensor:event` - New sensor events
- `alert:created` - New alerts
- `alert:acknowledged` - Alert acknowledgments
- `alert:resolved` - Alert resolutions

## Security

- JWT authentication required for all management APIs
- Sensor ingestion endpoint open for IoT devices
- Stream credentials encrypted in database
- Signed URLs with expiration for playback
- Redis deduplication prevents replay attacks

## Performance

- Async processing via Bull queues
- Redis caching for deduplication
- Database indexes on query fields
- S3 for scalable storage
- WebSocket for efficient real-time updates

## Acceptance Criteria

✅ Cameras can stream live to dashboards (WebRTC/HLS)
✅ Recordings persist per retention config (30/365 days)
✅ Sensor events arrive in under 2s end-to-end
✅ Motion/anomaly detection creates alerts
✅ APIs for live streams, playback URLs, sensor history
✅ Automated tests (unit + integration)
✅ Monitoring and health checks
