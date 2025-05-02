import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { IUser } from '../models/User';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: Types.ObjectId;
  clientId: Types.ObjectId;
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
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  stripePaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser & { _id: Types.ObjectId };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SearchParams {
  query?: string;
  fields?: string[];
}

export interface FilterParams {
  [key: string]: any;
}

export interface QueryParams extends PaginationParams, DateRangeParams, SearchParams {
  filters?: FilterParams;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface CacheConfig {
  ttl: number;
  prefix?: string;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

export interface CorsConfig {
  origin: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

export interface SecurityConfig {
  rateLimit: RateLimitConfig;
  cors: CorsConfig;
  helmet?: boolean;
}

export interface AppConfig {
  port: number;
  env: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  security: SecurityConfig;
  cache: CacheConfig;
}

export interface LogConfig {
  level: string;
  format: string;
  transports: any[];
}

export interface MonitoringConfig {
  enabled: boolean;
  port: number;
  path: string;
}

export interface Config {
  app: AppConfig;
  log: LogConfig;
  monitoring: MonitoringConfig;
} 