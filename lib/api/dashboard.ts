import { apiClient } from './client'
import {
  Incident,
  CCTVCamera,
  AnalyticsData,
  DashboardStats,
  SystemConfig,
} from '@/types'

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats')
    return response.data
  },

  getIncidents: async (params?: {
    status?: string
    priority?: string
    limit?: number
  }): Promise<Incident[]> => {
    const response = await apiClient.get<Incident[]>('/incidents', { params })
    return response.data
  },

  getIncidentById: async (id: string): Promise<Incident> => {
    const response = await apiClient.get<Incident>(`/incidents/${id}`)
    return response.data
  },

  createIncident: async (data: Partial<Incident>): Promise<Incident> => {
    const response = await apiClient.post<Incident>('/incidents', data)
    return response.data
  },

  updateIncident: async (id: string, data: Partial<Incident>): Promise<Incident> => {
    const response = await apiClient.patch<Incident>(`/incidents/${id}`, data)
    return response.data
  },

  getCameras: async (): Promise<CCTVCamera[]> => {
    const response = await apiClient.get<CCTVCamera[]>('/cameras')
    return response.data
  },

  getCameraById: async (id: string): Promise<CCTVCamera> => {
    const response = await apiClient.get<CCTVCamera>(`/cameras/${id}`)
    return response.data
  },

  getAnalytics: async (period: string = '7d'): Promise<AnalyticsData> => {
    const response = await apiClient.get<AnalyticsData>('/analytics', {
      params: { period },
    })
    return response.data
  },

  getSystemConfig: async (): Promise<SystemConfig[]> => {
    const response = await apiClient.get<SystemConfig[]>('/config')
    return response.data
  },

  updateSystemConfig: async (key: string, value: string): Promise<SystemConfig> => {
    const response = await apiClient.patch<SystemConfig>(`/config/${key}`, { value })
    return response.data
  },
}
