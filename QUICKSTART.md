# Quick Start Guide

This guide will help you get the backend up and running quickly with sample data.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ or 20+ (for local development)
- `jq` (for running sample API calls script)

## Start the Application

### Option 1: Using Docker (Recommended)

1. Start all services:
```bash
docker-compose up
```

Wait for all services to start. You should see:
```
backend-app     | Application is running on: http://localhost:3000
backend-app     | Swagger documentation is available at: http://localhost:3000/api
```

2. The following services will be available:
   - **API Server**: http://localhost:3000
   - **Swagger Docs**: http://localhost:3000/api
   - **PostgreSQL**: localhost:5432
   - **Redis**: localhost:6379

### Option 2: Local Development

1. Copy environment file:
```bash
cp .env.example .env
```

2. Start PostgreSQL and Redis (or use Docker for just these):
```bash
docker-compose up postgres redis -d
```

3. Install dependencies and start:
```bash
npm install
npm run start:dev
```

## Access the API Documentation

Open your browser and navigate to: http://localhost:3000/api

You'll see the interactive Swagger documentation where you can test all endpoints.

## Test the Endpoints

### Using Swagger UI

1. Go to http://localhost:3000/api
2. Try the `/health` endpoint to verify the API is running
3. Use the `/auth/register` endpoint to create a user
4. Use the `/auth/login` endpoint to get a JWT token
5. Click "Authorize" button at the top and paste your token
6. Now you can test all protected endpoints

### Using the Sample Script

Run the automated sample API calls:

```bash
./scripts/sample-api-calls.sh
```

This script will:
1. Check API health
2. Register a new user
3. Login and get a JWT token
4. Create a device
5. Create monitoring feeds
6. Create an incident
7. Create a notification
8. Create admin settings
9. Retrieve all data

### Using cURL Manually

1. **Health Check**:
```bash
curl http://localhost:3000/health
```

2. **Register User**:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

3. **Login**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

4. **Create Device** (replace TOKEN with your JWT):
```bash
curl -X POST http://localhost:3000/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "Camera 1",
    "serialNumber": "SN-12345",
    "type": "camera",
    "status": "online",
    "location": "Building A"
  }'
```

## Test WebSocket Connection

You can test WebSocket functionality using a WebSocket client or the browser console:

```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to WebSocket');
  
  // Send a message
  socket.emit('message', { text: 'Hello from client' });
  
  // Subscribe to a room
  socket.emit('subscribe', { room: 'devices' });
});

socket.on('message', (data) => {
  console.log('Received:', data);
});
```

## Verify Background Jobs

Background jobs are processed automatically by Bull queue with Redis. When you:
- Create an incident → Job is queued for processing
- Create a notification → Job is queued for sending

Check the application logs to see job processing:
```bash
docker-compose logs -f app
```

## Database Access

Access PostgreSQL directly:
```bash
docker-compose exec postgres psql -U postgres -d backend_db
```

Common queries:
```sql
-- List all tables
\dt

-- View users
SELECT * FROM users;

-- View devices
SELECT * FROM devices;

-- View incidents
SELECT * FROM incidents;
```

## Stop the Application

```bash
docker-compose down
```

To also remove volumes (database data):
```bash
docker-compose down -v
```

## Troubleshooting

### Port Already in Use

If port 3000, 5432, or 6379 is already in use, you can modify the ports in `docker-compose.yml` or `.env` file.

### Database Connection Issues

Make sure PostgreSQL container is running:
```bash
docker-compose ps postgres
```

### Redis Connection Issues

Make sure Redis container is running:
```bash
docker-compose ps redis
```

### View Application Logs

```bash
docker-compose logs -f app
```

## Next Steps

1. Explore the API documentation at http://localhost:3000/api
2. Check out the module implementations in `src/modules/`
3. Review the entity definitions to understand the data models
4. Modify and extend the code for your specific needs
5. Add custom business logic to the services
6. Implement additional endpoints as needed

## Development Tips

- Use `npm run start:dev` for hot-reload during development
- Run `npm test` to execute unit tests
- Run `npm run lint` to check code style
- Access Swagger docs for interactive API testing
- Monitor job queues via Bull Board (can be added as enhancement)
