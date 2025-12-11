# Backend Monorepo

A comprehensive NestJS backend monorepo with modules for authentication/authorization, device management, monitoring feeds, incident management, notifications, and administrative settings.

## Features

- **Authentication & Authorization**: JWT-based auth with user registration and login
- **Device Management**: CRUD operations for managing devices with status tracking
- **Monitoring Feeds**: Real-time monitoring data collection and retrieval
- **Incident Management**: Track and manage incidents with priority levels
- **Notifications**: Multi-channel notification system with background job processing
- **Administrative Settings**: Key-value configuration system
- **WebSocket Gateway**: Real-time event broadcasting and room-based communication
- **Background Jobs**: Bull queue for async task processing
- **PostgreSQL Database**: Type-safe database operations with TypeORM
- **Swagger Documentation**: Auto-generated API documentation
- **Docker Support**: Full Docker Compose setup for local development
- **CI/CD**: GitHub Actions workflow for automated testing

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL 16 with TypeORM
- **Cache/Queue**: Redis with Bull
- **Authentication**: JWT with Passport
- **WebSocket**: Socket.io
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Container**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- Docker and Docker Compose (for local development)
- PostgreSQL 16+ (if running locally without Docker)
- Redis 7+ (if running locally without Docker)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend-monorepo
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Install dependencies:
```bash
npm install
```

### Running with Docker (Recommended)

Start all services with Docker Compose:
```bash
docker-compose up
```

The application will be available at:
- API: http://localhost:3000
- Swagger Documentation: http://localhost:3000/api
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Running Locally

1. Make sure PostgreSQL and Redis are running locally

2. Update `.env` with your local database credentials

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run start:dev
```

## API Documentation

Once the application is running, visit http://localhost:3000/api to access the Swagger documentation.

### Available Endpoints

#### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health status

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile (authenticated)

#### Devices
- `POST /devices` - Create a new device
- `GET /devices` - Get all devices
- `GET /devices/:id` - Get device by ID
- `PATCH /devices/:id` - Update device
- `DELETE /devices/:id` - Delete device

#### Monitoring
- `POST /monitoring` - Create monitoring feed entry
- `GET /monitoring` - Get all monitoring feeds
- `GET /monitoring/device/:deviceId` - Get feeds by device

#### Incidents
- `POST /incidents` - Create a new incident
- `GET /incidents` - Get all incidents
- `GET /incidents/:id` - Get incident by ID
- `PATCH /incidents/:id` - Update incident
- `DELETE /incidents/:id` - Delete incident

#### Notifications
- `POST /notifications` - Create a new notification
- `GET /notifications` - Get all notifications
- `GET /notifications/user?userId=xxx` - Get user notifications

#### Admin Settings
- `POST /admin/settings` - Create a new setting
- `GET /admin/settings` - Get all settings
- `GET /admin/settings/:key` - Get setting by key
- `PATCH /admin/settings/:key` - Update setting
- `DELETE /admin/settings/:key` - Delete setting

### WebSocket Events

Connect to the WebSocket server at `ws://localhost:3000`

Available events:
- `message` - Send/receive messages
- `subscribe` - Subscribe to a room
- `unsubscribe` - Unsubscribe from a room

## Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

### Database Migrations

```bash
# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Project Structure

```
backend-monorepo/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── devices/        # Device management
│   │   ├── monitoring/     # Monitoring feeds
│   │   ├── incidents/      # Incident management
│   │   ├── notifications/  # Notification system
│   │   ├── admin/          # Administrative settings
│   │   └── websocket/      # WebSocket gateway
│   ├── config/             # Configuration files
│   ├── app.module.ts       # Root module
│   └── main.ts             # Application entry point
├── test/                   # E2E tests
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker image definition
└── README.md               # This file
```

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Application port (default: 3000)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration time
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port

## License

MIT
