export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'freelancer';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  _id: string;
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'freelancer';
} 