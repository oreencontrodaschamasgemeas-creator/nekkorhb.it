export enum IncidentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum IncidentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Incident {
  id: string
  title: string
  description: string
  status: IncidentStatus
  priority: IncidentPriority
  location: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
}

export interface CCTVCamera {
  id: string
  name: string
  location: string
  status: 'online' | 'offline'
  streamUrl: string
  thumbnail?: string
}

export interface AnalyticsData {
  totalIncidents: number
  activeIncidents: number
  resolvedIncidents: number
  averageResponseTime: number
  period: string
}

export interface DashboardStats {
  activeGuards: number
  totalCameras: number
  onlineCameras: number
  offlineCameras: number
  todayIncidents: number
}

export interface SystemConfig {
  id: string
  key: string
  value: string
  description: string
  updatedAt: string
}
