export interface User {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: 'freelancer';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  _id: string;
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold';
  startDate?: Date;
  endDate?: Date;
  hourlyRate?: number;
}

export interface TimeEntry {
  _id: string;
  id: string;
  project: Project | string;
  description: string;
  startTime: string;
  endTime: string;
  user: string;
  duration: number;
}

export interface Payment {
  _id: string;
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  project: Project;
  dueDate: string;
  paymentDate?: string;
  paymentMethod: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  client: User;
  freelancer: User;
  timeEntries: TimeEntry[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'freelancer' | 'client';
} 