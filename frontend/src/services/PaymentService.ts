import { apiClient } from './api/client';
import { Payment } from '../types';

interface ApiResponse<T> {
  data: T;
  message: string;
}

export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async createPayment(data: {
    project: string;
    amount: number;
    description: string;
    dueDate: Date;
  }): Promise<Payment> {
    const response = await apiClient.post<ApiResponse<Payment>>('/payments', data);
    return response.data;
  }

  async getFreelancerPayments(): Promise<Payment[]> {
    const response = await apiClient.get<ApiResponse<Payment[]>>('/payments/freelancer');
    return response.data;
  }

  async getClientPayments(): Promise<Payment[]> {
    const response = await apiClient.get<ApiResponse<Payment[]>>('/payments/client');
    return response.data;
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
    return response.data;
  }

  async updatePaymentStatus(id: string, status: Payment['status']): Promise<Payment> {
    const response = await apiClient.patch<ApiResponse<Payment>>(`/payments/${id}/status`, { status });
    return response.data;
  }
} 