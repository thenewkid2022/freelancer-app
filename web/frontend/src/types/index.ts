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
  name: string;
  email: string;
  password: string;
  role: 'freelancer' | 'client';
} 