import { apiClient } from './ApiClient';
import { Payment } from '../types';

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
    timeEntryIds: string[];
    amount: number;
    currency: string;
    paymentMethod: string;
  }): Promise<Payment> {
    const response = await apiClient.post<Payment>('/payments', data);
    return response.data;
  }

  async getFreelancerPayments(): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>('/payments/freelancer');
    return response.data;
  }

  async getClientPayments(): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>('/payments/client');
    return response.data;
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data;
  }

  async updatePaymentStatus(id: string, status: 'pending' | 'paid' | 'failed'): Promise<Payment> {
    const response = await apiClient.patch<Payment>(`/payments/${id}/status`, { status });
    return response.data;
  }
} 