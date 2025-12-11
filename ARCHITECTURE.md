# Architecture Documentation

## Overview

This is a NestJS-based backend monorepo implementing a comprehensive system for device management, monitoring, incident tracking, notifications, and administrative functions. The architecture follows clean architecture principles with clear separation of concerns.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  (Web Apps, Mobile Apps, IoT Devices, External Services)    │
└───────────────────┬──────────────────┬──────────────────────┘
                    │                   │
                    ▼                   ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │   REST API (HTTP)    │  │  WebSocket (Socket.io)│
    │   Port: 3000         │  │   Real-time Events    │
    └──────────┬───────────┘  └──────────┬────────────┘
               │                         │
               └─────────┬───────────────┘
                         ▼
         ┌─────────────────────────────────┐
         │      NestJS Application         │
         │    (Business Logic Layer)       │
         └─────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌────────┐    ┌──────────┐    ┌─────────┐
    │PostgreSQL│   │  Redis   │    │  Bull   │
    │Database │    │  Cache   │    │ Queue   │
    └────────┘    └──────────┘    └─────────┘
```

## Module Architecture

### 1. Authentication Module (`src/modules/auth/`)

**Purpose**: User authentication and authorization using JWT tokens

**Components**:
- `User` entity with role-based access control (RBAC)
- JWT and Local Passport strategies
- Registration, login, and profile endpoints
- JwtAuthGuard for protecting routes

**Flow**:
1. User registers → Password hashed with bcrypt → User stored in DB
2. User logs in → Credentials validated → JWT token issued
3. Protected routes → Token validated → User context provided

**Database Tables**:
- `users`: User accounts with email, password, role, and status

### 2. Devices Module (`src/modules/devices/`)

**Purpose**: Manage IoT devices, cameras, sensors, and controllers

**Components**:
- `Device` entity with type, status, and metadata
- CRUD operations for device management
- Support for different device types (camera, sensor, controller, gateway)

**Device Lifecycle**:
```
[Registered] → [Online] ⇄ [Offline] → [Maintenance] → [Online/Offline]
```

**Database Tables**:
- `devices`: Device information with serial numbers, locations, and metadata

### 3. Monitoring Module (`src/modules/monitoring/`)

**Purpose**: Collect and retrieve monitoring data from devices

**Components**:
- `MonitoringFeed` entity for time-series data
- Feed types: metrics, logs, events, alerts
- Severity levels for prioritization
- Query endpoints with pagination

**Data Flow**:
```
Device → Generate Feed → API Endpoint → Store in DB → Query/Display
```

**Database Tables**:
- `monitoring_feeds`: Time-series monitoring data with JSONB metadata

### 4. Incidents Module (`src/modules/incidents/`)

**Purpose**: Track and manage incidents with automated processing

**Components**:
- `Incident` entity with status and priority tracking
- Background job queue for incident processing
- Status workflow: open → in_progress → resolved → closed
- Priority levels: low, medium, high, critical

**Background Processing**:
- Uses Bull queue for async incident processing
- Jobs triggered on incident creation
- Processor logs incident handling (extensible for notifications, escalations)

**Database Tables**:
- `incidents`: Incident records with assignments and resolution tracking

### 5. Notifications Module (`src/modules/notifications/`)

**Purpose**: Multi-channel notification delivery system

**Components**:
- `Notification` entity with type and status
- Support for email, SMS, push, and in-app notifications
- Background job queue for async delivery
- Status tracking: pending → sent/failed

**Notification Flow**:
```
Trigger → Create Notification → Queue Job → Process → Update Status
```

**Database Tables**:
- `notifications`: Notification records with delivery status

### 6. Admin Module (`src/modules/admin/`)

**Purpose**: System-wide configuration and settings management

**Components**:
- `Setting` entity with key-value pairs
- Type-safe settings (string, number, boolean, JSON)
- CRUD operations for configuration management

**Use Cases**:
- Feature flags
- System limits (max devices, rate limits)
- Integration credentials
- Display preferences

**Database Tables**:
- `settings`: Configuration key-value store

### 7. WebSocket Module (`src/modules/websocket/`)

**Purpose**: Real-time bidirectional communication

**Components**:
- EventsGateway for WebSocket connections
- Room-based broadcasting
- Message handling and event distribution

**Events**:
- `message`: General message exchange
- `subscribe`: Join a room (e.g., device updates, incidents)
- `unsubscribe`: Leave a room

**Use Cases**:
- Real-time device status updates
- Live incident notifications
- Monitoring feed streaming
- Admin dashboard updates

## Data Layer

### TypeORM Configuration

- **Connection**: PostgreSQL with connection pooling
- **Synchronize**: Enabled only in development
- **Entities**: Auto-discovered from `**/*.entity.ts`
- **Migrations**: Managed through TypeORM CLI

### Entity Patterns

All entities follow this pattern:
```typescript
@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  // Entity fields with decorators
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Background Jobs

### Bull Queue Architecture

**Queues**:
1. `incidents`: Process new incidents
2. `notifications`: Send notifications

**Configuration**:
- Redis as backend
- Job retries and failure handling
- Processor classes handle job execution

**Example Flow**:
```typescript
// Create incident
incident = await incidentsService.create(dto);

// Queue job
await incidentsQueue.add('process-incident', {
  incidentId: incident.id,
  priority: incident.priority
});

// Processor handles asynchronously
@Process('process-incident')
async handleIncident(job: Job) {
  // Process logic here
}
```

## API Layer

### REST API Design

**Conventions**:
- RESTful resource-based URLs
- HTTP methods: GET, POST, PATCH, DELETE
- JSON request/response bodies
- Bearer token authentication

**Response Format**:
```json
{
  "id": "uuid",
  "field": "value",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Format**:
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### Swagger Documentation

- Auto-generated from decorators
- Available at `/api` endpoint
- Interactive API testing
- Request/response schemas
- Authentication support

## Security

### Authentication Flow

```
1. User Login → 2. Validate Credentials → 3. Generate JWT
                      ↓
4. Return Token → 5. Client Stores Token → 6. Include in Requests
                      ↓
7. Validate Token → 8. Extract User Context → 9. Authorize Access
```

### Security Features

- Password hashing with bcrypt (10 rounds)
- JWT tokens with configurable expiration
- Bearer token authentication
- Route-level authentication guards
- CORS enabled for cross-origin requests
- Input validation with class-validator
- SQL injection prevention via TypeORM

## Deployment

### Docker Deployment

**Services**:
- **app**: NestJS application
- **postgres**: PostgreSQL database
- **redis**: Redis for queues and caching

**Volumes**:
- `postgres_data`: Persistent database storage
- `redis_data`: Persistent Redis storage
- Source code mount for development

### Environment Configuration

Required environment variables:
```
NODE_ENV=development|production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=backend_db
JWT_SECRET=secret-key
JWT_EXPIRES_IN=24h
REDIS_HOST=redis
REDIS_PORT=6379
```

## Scaling Considerations

### Horizontal Scaling

- Stateless API servers (JWT-based auth)
- Bull queue distributes jobs across instances
- Redis for shared session/queue state
- PostgreSQL connection pooling

### Vertical Scaling

- Database indexing on frequently queried fields
- Redis for caching hot data
- JSONB columns for flexible metadata
- Pagination on list endpoints

### Performance Optimization

- Database query optimization with TypeORM
- Eager/lazy loading strategies
- Background job processing for heavy tasks
- WebSocket for efficient real-time updates
- Redis caching layer (can be added)

## Monitoring & Observability

### Health Checks

- Root endpoint (`/`) for basic health
- Detailed health endpoint (`/health`) with metrics

### Logging

- Console logging in development
- Structured logging ready for production
- Request/response logging
- Error stack traces

### Metrics (Future Enhancement)

- Request rate and latency
- Database query performance
- Queue job processing time
- WebSocket connection count

## Testing Strategy

### Unit Tests

- Service layer business logic
- Controller request handling
- Guard authorization logic
- Isolated with mocked dependencies

### Integration Tests

- API endpoint testing
- Database operations
- Authentication flows
- WebSocket connections

### E2E Tests

- Complete user workflows
- Multi-module interactions
- Real database and Redis

## Extension Points

### Adding New Modules

1. Generate module: `nest generate module module-name`
2. Create entity with TypeORM decorators
3. Implement DTOs with validation
4. Create service with business logic
5. Create controller with REST endpoints
6. Add Swagger documentation
7. Write tests

### Adding Background Jobs

1. Register queue in module
2. Create processor class
3. Add job trigger in service
4. Implement job handler

### Adding WebSocket Events

1. Add @SubscribeMessage in EventsGateway
2. Implement event handler
3. Emit events from services

## Best Practices

1. **Module Organization**: Keep modules self-contained
2. **Dependency Injection**: Use NestJS DI container
3. **Validation**: Always validate input with DTOs
4. **Documentation**: Use Swagger decorators
5. **Error Handling**: Use NestJS exception filters
6. **Testing**: Write tests for business logic
7. **Security**: Never expose sensitive data
8. **Logging**: Log important events and errors
9. **Performance**: Use pagination for lists
10. **Versioning**: Consider API versioning for breaking changes

## Future Enhancements

- [ ] Redis caching layer
- [ ] Rate limiting
- [ ] API versioning
- [ ] Prometheus metrics
- [ ] ELK stack logging
- [ ] Bull Board for queue monitoring
- [ ] GraphQL API
- [ ] Event sourcing
- [ ] CQRS pattern
- [ ] Microservices migration path
