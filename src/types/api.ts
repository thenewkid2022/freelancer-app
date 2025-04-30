// Common Types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  confirmPassword: string;
}

// Time Entry Types
export interface TimeEntry {
  id: string;
  userId: string;
  description: string;
  project?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryData {
  description: string;
  project?: string;
  startTime?: string;
}

export interface UpdateTimeEntryData {
  description?: string;
  project?: string;
  startTime?: string;
  endTime?: string;
}

export interface TimeEntryFilters {
  startDate?: string;
  endDate?: string;
  project?: string;
  page?: number;
  pageSize?: number;
}

// Payment Types
export interface PaymentSession {
  id: string;
  url: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface CreatePaymentData {
  amount: number;
  currency: string;
  description?: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
} 