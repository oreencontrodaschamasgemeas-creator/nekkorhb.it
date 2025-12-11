import { z } from 'zod'
import { IncidentStatus, IncidentPriority } from '@/types'

export const incidentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.nativeEnum(IncidentStatus),
  priority: z.nativeEnum(IncidentPriority),
  location: z.string().min(1, 'Location is required'),
  assignedTo: z.string().optional(),
})

export type IncidentFormData = z.infer<typeof incidentSchema>
