# Incidents & Alerts Workflow Implementation

## Overview
This document describes the comprehensive incident management system implemented as part of the feat-incidents-alerts-workflow feature. The system provides a complete lifecycle management for incidents with workflow automation, notifications, and real-time updates.

## Architecture Components

### 1. Domain Model

#### Incident Entity
The core entity with full lifecycle management:
- **Status Machine**: OPEN → IN_PROGRESS → RESOLVED → CLOSED (validated transitions)
- **Priority Levels**: LOW, MEDIUM, HIGH, CRITICAL
- **Categories**: ACCESS_DENIAL, DEVICE_MALFUNCTION, SENSOR_ALERT, SECURITY_BREACH, SYSTEM_FAILURE, NETWORK_ISSUE, MAINTENANCE, OTHER
- **Sources**: SENSOR, ACCESS_CONTROL, MANUAL, SYSTEM
- **SLA Management**:
  - CRITICAL: 4 hours
  - HIGH: 24 hours
  - MEDIUM: 48 hours
  - LOW: 72 hours
- **Tracking Fields**:
  - `acknowledgedAt` / `acknowledgedBy` - Acknowledgement tracking
  - `escalatedAt` - Auto-escalation timestamp
  - `resolvedAt` / `closedAt` - Resolution lifecycle
  - `assignees` - Array of assigned users
  - `resolutionChecklist` - Completion items for resolution

#### IncidentAnnotation Entity
- Links to incidents via foreign key
- User-associated notes with timestamps
- Supports metadata for custom attributes
- Cascading delete with incident

#### IncidentEvidenceLink Entity
- Multiple types: CCTV_CLIP, SENSOR_LOG, SYSTEM_LOG, ACCESS_LOG, IMAGE, VIDEO, DOCUMENT, OTHER
- Stores URL, media ID, and timestamp
- Metadata for additional information (duration, resolution, etc.)
- Cascading delete with incident

### 2. Services

#### IncidentWorkflowService
Manages the state machine and business rules:
- **Status Transitions**: Validates all state changes based on workflow rules
- **SLA Calculations**: Automatic deadline calculation based on priority
- **Escalation Logic**:
  - Auto-escalates when SLA breached
  - Cannot escalate if already escalated
  - Cannot escalate critical incidents
  - Escalation path: LOW → MEDIUM → HIGH → CRITICAL
- **Resolution Validation**: Ensures checklist completion before resolving
- **Incident Age**: Calculates hours elapsed since creation
- **Auto-Escalation Detection**: Checks if incident needs escalation

#### IncidentsService
Core CRUD and lifecycle operations:
- **Create**: Auto-calculates SLA, queues processing
- **Update**: Validates transitions, sets timestamps
- **Annotations**: Add/retrieve incident notes
- **Evidence Links**: Add/retrieve evidence
- **Acknowledge**: Track acknowledgement with user
- **Escalate**: Manual/auto escalation with priority bump
- **Statistics**: Aggregate stats by status and priority
- **Filtering**: By status, priority, or device

#### IncidentNotificationService
Notification orchestration:
- **Template-based Alerts**: incident_created, incident_status_changed, incident_escalated, incident_acknowledged, incident_annotated, incident_reassigned
- **Multi-channel Support**:
  - LOW: IN_APP only
  - MEDIUM: IN_APP + EMAIL
  - HIGH: IN_APP + EMAIL + PUSH
  - CRITICAL: IN_APP + EMAIL + PUSH + SMS
- **Deduplication**: Using incident-template-timestamp keys
- **Recipient Management**: Collects all assigned users
- **Queue Integration**: Integrates with Bull queue for async delivery

### 3. API Endpoints

#### Core Operations
- `POST /incidents` - Create incident
- `GET /incidents` - List with filters (status, priority, deviceId)
- `GET /incidents/stats/overview` - Incident statistics
- `GET /incidents/:id` - Get single incident with relations
- `PATCH /incidents/:id` - Update incident (validates transitions)
- `DELETE /incidents/:id` - Delete incident

#### Workflow Actions
- `POST /incidents/:id/acknowledge` - Acknowledge incident
- `POST /incidents/:id/escalate` - Manual escalation check
- `GET /incidents/:id/status` - Status changes

#### Annotations
- `POST /incidents/:id/annotations` - Add annotation
- `GET /incidents/:id/annotations` - List annotations

#### Evidence
- `POST /incidents/:id/evidence` - Add evidence link
- `GET /incidents/:id/evidence` - List evidence

### 4. Background Processing

#### Bull Queue Processors
- **process-incident**: Initial processing, sends creation notification
- **notify-annotation**: Notification when annotation added
- **notify-escalation**: Escalation notifications
- **notify-acknowledgement**: Acknowledgement notifications

All processors integrate with IncidentNotificationService for consistent notification delivery.

### 5. WebSocket Integration

#### EventsGateway Enhancements
Real-time incident updates via Socket.io:
- **Subscribe Messages**:
  - `subscribe-incidents` - All incidents
  - `subscribe-incident` - Specific incident
- **Broadcast Methods**:
  - `broadcastIncidentCreated` - New incident created
  - `broadcastIncidentUpdated` - Incident updated
  - `broadcastIncidentStatusChanged` - Status changed
  - `broadcastIncidentEscalated` - Escalation occurred
  - `broadcastAnnotationAdded` - Annotation added
  - `broadcastEvidenceAdded` - Evidence added
- **Rooms**:
  - `incidents` - All incidents broadcast
  - `incident-{id}` - Specific incident updates

### 6. Notification System

#### Integration with Notifications Module
- Automatically queues jobs on incident lifecycle events
- Tracks acknowledgements via notification metadata
- Supports all notification types (EMAIL, SMS, PUSH, IN_APP)
- Templated messages with context variables

#### Deduplication Strategy
- Prevents duplicate notifications within time window
- Uses composite key: incident-id + template + timestamp
- Configurable retry logic with exponential backoff

## Data Model

### Database Tables

#### incidents
```sql
- id (UUID, PK)
- title (TEXT)
- description (TEXT)
- status (ENUM: open, in_progress, resolved, closed)
- priority (ENUM: low, medium, high, critical)
- category (ENUM: access_denial, device_malfunction, ...)
- source (ENUM: sensor, access_control, manual, system)
- deviceId (UUID, FK to devices, nullable)
- assignedTo (UUID, FK to users, nullable)
- assignees (TEXT[], array of user IDs)
- slaDeadline (TIMESTAMP, calculated)
- resolvedAt (TIMESTAMP, nullable)
- closedAt (TIMESTAMP, nullable)
- escalatedAt (TIMESTAMP, nullable)
- acknowledgedAt (TIMESTAMP, nullable)
- acknowledgedBy (UUID, FK to users, nullable)
- resolutionChecklist (JSON, array of items with completion status)
- metadata (JSONB)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
- INDEXES: (status, priority), (deviceId), (createdAt)
```

#### incident_annotations
```sql
- id (UUID, PK)
- incidentId (UUID, FK to incidents, CASCADE DELETE)
- userId (UUID, FK to users)
- content (TEXT)
- metadata (JSONB)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
- INDEX: (incidentId, createdAt)
```

#### incident_evidence_links
```sql
- id (UUID, PK)
- incidentId (UUID, FK to incidents, CASCADE DELETE)
- type (ENUM: cctv_clip, sensor_log, system_log, access_log, image, video, document, other)
- title (TEXT)
- description (TEXT)
- url (TEXT)
- mediaId (UUID, nullable)
- timestamp (TIMESTAMP, nullable)
- metadata (JSONB)
- createdAt (TIMESTAMP)
- INDEX: (incidentId, type)
```

## Workflow Rules

### Status Transitions
```
OPEN: can transition to → IN_PROGRESS, RESOLVED, CLOSED
IN_PROGRESS: can transition to → RESOLVED, OPEN, CLOSED
RESOLVED: can transition to → CLOSED, OPEN
CLOSED: can transition to → (no transitions)
```

### SLA & Escalation
- SLA deadline calculated on creation based on priority
- Auto-escalation triggered when SLA breached
- Escalation bumps priority: LOW→MEDIUM→HIGH→CRITICAL
- Multiple escalations not allowed
- Critical incidents cannot escalate further

### Resolution Process
1. All checklist items must be marked complete
2. Status transitions to RESOLVED
3. System sets `resolvedAt` timestamp
4. Can transition to CLOSED after resolution
5. Closing sets `closedAt` timestamp

### Acknowledgement
- Each incident can be acknowledged once
- Prevents duplicate acknowledgements
- Tracks acknowledging user and timestamp
- Triggers acknowledgement notification

## Testing

### Unit Tests - IncidentWorkflowService (31 tests)
- Status transition validation
- SLA calculations (all priority levels)
- SLA breach detection
- Escalation eligibility
- Escalation priority progression
- Resolution checklist validation
- Closure validation
- Incident age calculation
- Auto-escalation conditions

### Unit Tests - IncidentsService (12 tests)
- Incident creation with SLA
- Assignee management
- Status transition validation
- Resolution timestamp setting
- Checklist validation
- Acknowledgement flow
- Annotation creation and queuing
- Statistics aggregation

All tests use Jest with mocked repositories and queues.

## Future Enhancements

1. **Advanced Filtering**
   - Full-text search on incident content
   - Date range filtering
   - Multi-select priority/status
   - Complex query builder

2. **Incident Routing**
   - Automatic assignment based on rules
   - Load balancing across teams
   - Skill-based routing

3. **Audit & History**
   - Full change history tracking
   - Who changed what and when
   - Audit trail for compliance

4. **Integrations**
   - External ticketing systems
   - ITSM platforms
   - Custom webhooks

5. **Analytics**
   - MTTR (Mean Time To Resolve)
   - SLA compliance metrics
   - Team performance dashboards
   - Incident trends analysis

6. **Mobile Notifications**
   - Push notifications with rich content
   - Deep linking to incidents
   - Voice alerts for critical incidents

## Deployment Notes

### Required Environment Variables
All standard variables in `.env.example`:
- DATABASE_URL
- REDIS_URL
- JWT_SECRET
- NOTIFICATION_CHANNELS (configured in admin settings)

### Database Migrations
After pulling changes:
```bash
npm run migration:run
```

### Hot Reload
In development:
```bash
npm run start:dev
```

Changes to incident module will automatically reload.

### Production Considerations
- Enable database connection pooling
- Configure Redis persistence
- Set appropriate Bull queue concurrency
- Monitor notification queue depth
- Set up log aggregation for incident events
