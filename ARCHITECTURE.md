# Architecture Documentation

## Overview

This document describes the architecture and design decisions for the Security Dashboard application.

## System Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Auth Flow  │  │    Guard     │  │    Admin     │ │
│  │    /auth     │  │  Dashboard   │  │  Dashboard   │ │
│  │              │  │   /guard     │  │   /admin     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                  Component Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Layouts    │  │     UI       │  │   Widgets    │ │
│  │  - Guards    │  │  - Button    │  │ - CCTVGrid   │ │
│  │  - Headers   │  │  - Card      │  │ - Incidents  │ │
│  │  - Sidebar   │  │  - Spinner   │  │ - Analytics  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                  State Management                        │
│  ┌──────────────┐           ┌──────────────────────┐   │
│  │   Zustand    │           │   React Query        │   │
│  │  (Auth State)│           │  (Server State)      │   │
│  └──────────────┘           └──────────────────────┘   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                     API Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Auth API     │  │ Dashboard API│  │  Axios Client│ │
│  │              │  │              │  │ (Interceptors)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                   Backend REST API
```

## Technology Choices

### Next.js 16 (App Router)
- **Why**: Modern React framework with excellent performance
- **Benefits**: 
  - Server-side rendering
  - Automatic code splitting
  - File-based routing
  - Built-in optimization

### TypeScript
- **Why**: Type safety and better developer experience
- **Benefits**:
  - Catch errors at compile time
  - Better IDE support
  - Self-documenting code
  - Easier refactoring

### Chakra UI + Tailwind CSS
- **Why**: Best of both worlds
- **Chakra UI**: Component library for rapid development
- **Tailwind CSS**: Utility-first styling for customization
- **Benefits**:
  - Consistent design system
  - Accessibility built-in
  - Dark mode support
  - Responsive design

### State Management

#### Zustand (Authentication)
- **Why**: Simple and lightweight
- **Use case**: Global authentication state
- **Benefits**:
  - Minimal boilerplate
  - Easy to test
  - Persistent storage
  - TypeScript support

#### React Query (Server State)
- **Why**: Best practice for server state
- **Use case**: API data caching and synchronization
- **Benefits**:
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Request deduplication

## Design Patterns

### Authentication Flow

```
User Login
    │
    ▼
┌─────────────────┐
│  Login Form     │
│  (React Hook    │
│   Form + Zod)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  authApi.login  │
│  (Axios POST)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Save Tokens    │
│  (localStorage) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Auth     │
│ Store (Zustand) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Redirect to     │
│ Dashboard       │
└─────────────────┘
```

### Role-Based Access Control (RBAC)

```typescript
// AuthGuard component wraps protected routes
<AuthGuard allowedRoles={[UserRole.ADMIN]}>
  <AdminDashboard />
</AuthGuard>

// Checks:
// 1. Is user authenticated?
// 2. Does user have required role?
// 3. Redirect if not authorized
```

### API Request Flow

```
Component
    │
    ▼
React Query Hook
    │
    ▼
API Function
    │
    ▼
Axios Client
    │
    ├─► Request Interceptor (Add auth token)
    │
    ▼
Backend API
    │
    ▼
Axios Client
    │
    ├─► Response Interceptor (Handle 401, refresh token)
    │
    ▼
React Query
    │
    ├─► Cache result
    ├─► Update UI
    └─► Schedule refetch
```

## Component Architecture

### Layout Components

- **DashboardLayout**: Main wrapper for dashboard pages
- **AuthGuard**: Protects routes based on authentication and roles
- **Header**: Top navigation with user menu
- **Sidebar**: Side navigation with role-based menu items

### Widget Components

- **CCTVGrid**: Displays camera feeds in grid layout
- **IncidentQueue**: Lists and manages incidents
- **AnalyticsCards**: Shows key metrics and statistics
- **SettingsForm**: System configuration interface

### UI Components

Reusable components built on Chakra UI:
- Button
- Card
- LoadingSpinner

## Data Flow

### Server State (React Query)

```typescript
// Data fetching
const { data, isLoading, error } = useIncidents()

// Mutations
const { mutate } = useUpdateIncident()

// Automatic:
// - Caching
// - Refetching
// - Error handling
// - Loading states
```

### Client State (Zustand)

```typescript
// Global auth state
const { user, login, logout } = useAuthStore()

// Persisted:
// - User information
// - Authentication status
```

## Security Architecture

### Authentication
- JWT tokens stored in localStorage
- Access token for API requests
- Refresh token for token renewal
- Automatic token refresh on 401 responses

### Authorization
- Role-based access control (RBAC)
- Route-level guards
- API-level validation (backend)

### Security Headers
- Next.js built-in security features
- XSS protection
- Content Security Policy

## Testing Strategy

### Unit Tests
```typescript
// Component tests
describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click</Button>)
    expect(screen.getByText('Click')).toBeInTheDocument()
  })
})

// Utility tests
describe('formatters', () => {
  it('formats numbers', () => {
    expect(formatNumber(1000)).toBe('1,000')
  })
})
```

### Integration Tests
- API integration with mock server
- State management flows
- User authentication flows

## Performance Optimizations

### Next.js Features
- Automatic code splitting
- Image optimization
- Font optimization
- Route prefetching

### React Query
- Intelligent caching
- Request deduplication
- Background refetching
- Stale-while-revalidate

### Component Optimization
- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for stable references

## Deployment Architecture

### Build Process
```bash
npm install     # Install dependencies
npm run lint    # Check code quality
npm test        # Run tests
npm run build   # Build for production
```

### CI/CD Pipeline
1. Code pushed to repository
2. GitHub Actions triggered
3. Run linting
4. Run type checking
5. Run tests
6. Build application
7. Deploy to hosting platform

## Monitoring and Observability

### Client-Side
- React Query DevTools
- Error boundaries
- Console logging (development)

### API Monitoring
- Request/response logging
- Error tracking
- Performance metrics

## Scalability Considerations

### Code Organization
- Feature-based folder structure
- Reusable components
- Shared utilities
- Type definitions

### State Management
- Localized state when possible
- Global state for cross-cutting concerns
- Server state cached efficiently

### API Design
- RESTful endpoints
- Pagination support
- Filtering and sorting
- Efficient data transfer

## Future Enhancements

### Planned Features
- Real-time updates via WebSockets
- Push notifications
- Advanced analytics charts
- Export functionality
- Audit logging
- User management interface

### Technical Improvements
- E2E testing with Playwright
- Storybook for component documentation
- Performance monitoring
- Error tracking service
- A/B testing framework

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint rules
- Use functional components
- Prefer composition over inheritance

### Component Guidelines
- Keep components small and focused
- Use custom hooks for logic
- Props should be typed
- Add proper error handling

### State Management
- Use React Query for server state
- Use Zustand for global client state
- Use local state for UI state
- Avoid prop drilling

### API Integration
- All API calls through centralized client
- Proper error handling
- Loading states
- Optimistic updates when appropriate

## Troubleshooting

### Common Issues

**401 Unauthorized**
- Check if token is present
- Verify token hasn't expired
- Check refresh token flow

**CORS Errors**
- Verify API URL configuration
- Check backend CORS settings

**Build Errors**
- Clear .next directory
- Delete node_modules and reinstall
- Check TypeScript errors

### Debug Tools
- React DevTools
- Redux DevTools (for Zustand)
- React Query DevTools
- Network tab (browser)
