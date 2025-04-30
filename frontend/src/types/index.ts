export interface User {
  id: string;
  email: string;
  name: string;
  role: 'freelancer' | 'client';
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  clientId: string;
  project: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  tags: string[];
  hourlyRate: number;
  billable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  freelancer: User;
  client: User;
  timeEntries: TimeEntry[];
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  paymentMethod: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 