# Security Dashboard

A comprehensive Next.js/TypeScript frontend application for security monitoring with real-time incident management, CCTV monitoring, and administrative controls.

## Features

### Guard Dashboard
- Real-time CCTV camera grid monitoring
- Incident queue management
- Quick incident response actions
- Live statistics and metrics

### Admin Dashboard
- Comprehensive analytics and insights
- Report generation and scheduling
- System configuration management
- User and role management
- Historical trend analysis

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Libraries**: 
  - Chakra UI (component library)
  - Tailwind CSS (utility-first styling)
- **State Management**: 
  - Zustand (authentication state)
  - React Query (server state)
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18.x or 20.x
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

### Building

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

### Linting

Run ESLint:
```bash
npm run lint
```

## Project Structure

```
project/
├── app/                      # Next.js app directory
│   ├── auth/                # Authentication pages
│   │   └── login/
│   ├── guard/               # Guard dashboard pages
│   │   ├── cameras/
│   │   └── incidents/
│   ├── admin/               # Admin dashboard pages
│   │   ├── analytics/
│   │   ├── reports/
│   │   └── settings/
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── layouts/            # Layout components
│   │   ├── AuthGuard.tsx   # Role-based access control
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   └── widgets/            # Dashboard widgets
│       ├── CCTVGrid.tsx
│       ├── IncidentQueue.tsx
│       ├── AnalyticsCards.tsx
│       └── SettingsForm.tsx
├── lib/                    # Core library code
│   ├── api/               # API clients
│   │   ├── client.ts      # Axios instance with interceptors
│   │   ├── auth.ts        # Authentication API
│   │   └── dashboard.ts   # Dashboard API
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useDashboard.ts
│   ├── stores/            # Zustand stores
│   │   └── authStore.ts
│   ├── utils/             # Utility functions
│   │   ├── cn.ts
│   │   └── formatters.ts
│   ├── validators/        # Zod schemas
│   │   ├── auth.ts
│   │   └── incident.ts
│   ├── providers.tsx      # React providers
│   └── theme.ts           # Chakra UI theme
├── types/                 # TypeScript type definitions
│   ├── auth.ts
│   ├── dashboard.ts
│   └── index.ts
└── public/               # Static assets

```

## Authentication

The application implements role-based access control (RBAC) with the following roles:

- **Guard**: Access to monitoring and incident response features
- **Admin**: Full administrative access including analytics and configuration
- **Super Admin**: Extended administrative privileges

### Demo Credentials

For testing purposes, use these credentials:

**Guard Account:**
- Email: `guard@example.com`
- Password: `password123`

**Admin Account:**
- Email: `admin@example.com`
- Password: `password123`

## API Integration

The application is configured to consume RESTful APIs with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify token

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/incidents` - List incidents
- `GET /api/incidents/:id` - Get incident details
- `POST /api/incidents` - Create incident
- `PATCH /api/incidents/:id` - Update incident
- `GET /api/cameras` - List cameras
- `GET /api/cameras/:id` - Get camera details
- `GET /api/analytics` - Get analytics data
- `GET /api/config` - Get system configuration
- `PATCH /api/config/:key` - Update configuration

## State Management

### Authentication State (Zustand)
- User information
- Authentication status
- Login/logout actions
- Token refresh

### Server State (React Query)
- Automatic caching
- Background refetching
- Optimistic updates
- Query invalidation

## Testing Strategy

### Unit Tests
- Component rendering
- Utility functions
- Form validation

### Integration Tests
- User flows
- API integration
- State management

### E2E Tests (Coming Soon)
- Full user journeys
- Cross-browser testing

## CI/CD

GitHub Actions workflows are configured for:
- Linting (ESLint)
- Type checking (TypeScript)
- Unit tests (Jest)
- Build verification
- Multiple Node.js versions (18.x, 20.x)

## Performance Optimizations

- React Query caching strategy
- Automatic code splitting (Next.js)
- Image optimization
- Route prefetching
- Lazy loading of components

## Security Considerations

- JWT token authentication
- Automatic token refresh
- Role-based access control
- XSS protection
- CSRF protection
- Secure HTTP headers

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary and confidential.
