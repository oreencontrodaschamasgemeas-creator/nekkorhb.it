import { apiClient } from './api';
import { Visitor, PaginatedResponse } from '@/types';
import { API_CONFIG } from '@/constants/config';

export interface CreateVisitorRequest {
  name: string;
  phone: string;
  idNumber: string;
  purpose: string;
  expectedArrival: Date;
  notes?: string;
}

export interface UpdateVisitorRequest {
  name?: string;
  phone?: string;
  idNumber?: string;
  purpose?: string;
  expectedArrival?: Date;
  notes?: string;
}

export class VisitorService {
  async getVisitors(page = 1, limit = 20, status?: string): Promise<PaginatedResponse<Visitor>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (status) {
        params.append('status', status);
      }

      return await apiClient.get<PaginatedResponse<Visitor>>(
        `${API_CONFIG.endpoints.visitors.list}?${params.toString()}`
      );
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
      throw error;
    }
  }

  async getVisitor(id: string): Promise<Visitor> {
    try {
      return await apiClient.get<Visitor>(API_CONFIG.endpoints.visitors.list + '/' + id);
    } catch (error) {
      console.error('Failed to fetch visitor:', error);
      throw error;
    }
  }

  async createVisitor(visitorData: CreateVisitorRequest): Promise<Visitor> {
    try {
      const response = await apiClient.post<Visitor>(
        API_CONFIG.endpoints.visitors.create,
        {
          ...visitorData,
          expectedArrival: visitorData.expectedArrival.toISOString(),
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to create visitor:', error);
      throw error;
    }
  }

  async updateVisitor(id: string, updates: UpdateVisitorRequest): Promise<Visitor> {
    try {
      const payload = {
        ...updates,
        ...(updates.expectedArrival && {
          expectedArrival: updates.expectedArrival.toISOString(),
        }),
      };

      return await apiClient.put<Visitor>(
        API_CONFIG.endpoints.visitors.update.replace('{id}', id),
        payload
      );
    } catch (error) {
      console.error('Failed to update visitor:', error);
      throw error;
    }
  }

  async deleteVisitor(id: string): Promise<void> {
    try {
      await apiClient.delete(API_CONFIG.endpoints.visitors.delete.replace('{id}', id));
    } catch (error) {
      console.error('Failed to delete visitor:', error);
      throw error;
    }
  }

  async approveVisitor(id: string): Promise<Visitor> {
    try {
      return await apiClient.patch<Visitor>(
        API_CONFIG.endpoints.visitors.approve.replace('{id}', id)
      );
    } catch (error) {
      console.error('Failed to approve visitor:', error);
      throw error;
    }
  }

  async denyVisitor(id: string, reason?: string): Promise<Visitor> {
    try {
      return await apiClient.patch<Visitor>(
        API_CONFIG.endpoints.visitors.deny.replace('{id}', id),
        { reason }
      );
    } catch (error) {
      console.error('Failed to deny visitor:', error);
      throw error;
    }
  }

  async getVisitorQRCode(id: string): Promise<string> {
    try {
      const response = await apiClient.get<{ qrCode: string }>(
        API_CONFIG.endpoints.visitors.qrCode.replace('{id}', id)
      );
      return response.qrCode;
    } catch (error) {
      console.error('Failed to get visitor QR code:', error);
      throw error;
    }
  }

  // Mock data for development/testing
  getMockVisitors(): Visitor[] {
    return [
      {
        id: '1',
        name: 'John Doe',
        phone: '+1234567890',
        idNumber: 'ID123456789',
        purpose: 'Meeting',
        status: 'approved',
        expectedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        hostId: 'host1',
        hostName: 'Jane Smith',
        notes: 'Meeting in conference room B',
        qrCode: 'mock-qr-code-1',
      },
      {
        id: '2',
        name: 'Alice Johnson',
        phone: '+1987654321',
        idNumber: 'ID987654321',
        purpose: 'Delivery',
        status: 'pending',
        expectedArrival: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        hostId: 'host1',
        hostName: 'Jane Smith',
        notes: 'Package delivery',
        qrCode: 'mock-qr-code-2',
      },
      {
        id: '3',
        name: 'Bob Wilson',
        phone: '+1555123456',
        idNumber: 'ID555123456',
        purpose: 'Maintenance',
        status: 'checked-in',
        expectedArrival: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        actualArrival: new Date(Date.now() - 45 * 60 * 1000),
        hostId: 'host2',
        hostName: 'Mike Davis',
        notes: 'HVAC repair',
        qrCode: 'mock-qr-code-3',
      },
    ];
  }
}

export const visitorService = new VisitorService();