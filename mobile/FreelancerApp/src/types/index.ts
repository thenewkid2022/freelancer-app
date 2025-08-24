// Freelancer App Types
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'freelancer' | 'client' | 'admin';
  isActive: boolean;
  settings?: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  timezone?: string;
  language?: string;
  notifications?: boolean;
}

export interface TimeEntry {
  _id: string;
  projectNumber?: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  correctedDuration?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MergedEntry {
  project: { _id: string };
  projectNumber?: string;
  date: string;
  totalDuration: number;
  comments: string[];
  entryIds: string[];
  startTime?: string;
  endTime?: string;
  hasCorrectedDuration: boolean;
  correctedDuration?: number;
}

export interface AdjustmentData {
  workStart: string;
  workEnd: string;
  lunchBreak: number;
  otherBreaks: number;
}

export interface AdjustedEntry {
  id: string;
  originalDuration: number;
  unrounded: number;
  duration: number;
}

export interface TimeEntryFormData {
  projectNumber: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface Project {
  _id: string;
  projectNumber: string;
  name: string;
  description?: string;
  clientId: string;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  budget?: number;
  hourlyRate?: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface Statistics {
  totalHours: number;
  totalProjects: number;
  averageHoursPerDay: number;
  totalEarnings?: number;
  monthlyData: MonthlyData[];
}

export interface MonthlyData {
  month: string;
  hours: number;
  earnings?: number;
  projects: number;
}
