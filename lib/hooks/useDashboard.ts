import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'
import { Incident } from '@/types'

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000,
  })
}

export const useIncidents = (params?: {
  status?: string
  priority?: string
  limit?: number
}) => {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: () => dashboardApi.getIncidents(params),
    refetchInterval: 10000,
  })
}

export const useIncident = (id: string) => {
  return useQuery({
    queryKey: ['incidents', id],
    queryFn: () => dashboardApi.getIncidentById(id),
  })
}

export const useCreateIncident = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Incident>) => dashboardApi.createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
    },
  })
}

export const useUpdateIncident = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Incident> }) =>
      dashboardApi.updateIncident(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })
    },
  })
}

export const useCameras = () => {
  return useQuery({
    queryKey: ['cameras'],
    queryFn: dashboardApi.getCameras,
    refetchInterval: 60000,
  })
}

export const useAnalytics = (period: string = '7d') => {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: () => dashboardApi.getAnalytics(period),
  })
}

export const useSystemConfig = () => {
  return useQuery({
    queryKey: ['config'],
    queryFn: dashboardApi.getSystemConfig,
  })
}
