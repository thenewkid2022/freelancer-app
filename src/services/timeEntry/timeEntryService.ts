import { apiClient } from '../api/client';
import type {
  TimeEntry,
  CreateTimeEntryData,
  UpdateTimeEntryData,
  TimeEntryFilters,
  PaginatedResponse,
  ApiResponse
} from '@/types/api';

interface TimeEntryStats {
  totalHours: number;
  totalEntries: number;
  averageHoursPerDay: number;
  projectBreakdown: Record<string, number>;
}

interface DailyStats {
  date: string;
  totalHours: number;
  entries: TimeEntry[];
}

interface MonthlyStats {
  year: number;
  month: number;
  totalHours: number;
  dailyBreakdown: Record<string, number>;
}

export class TimeEntryService {
  private static instance: TimeEntryService;

  private constructor() {}

  public static getInstance(): TimeEntryService {
    if (!TimeEntryService.instance) {
      TimeEntryService.instance = new TimeEntryService();
    }
    return TimeEntryService.instance;
  }

  public async getAll(filters?: TimeEntryFilters): Promise<PaginatedResponse<TimeEntry>> {
    const response = await apiClient.get<PaginatedResponse<TimeEntry>>('/time-entries', {
      params: filters
    });
    return response.data;
  }

  public async create(data: CreateTimeEntryData): Promise<TimeEntry> {
    const response = await apiClient.post<TimeEntry>('/time-entries', data);
    return response.data;
  }

  public async update(id: string, data: UpdateTimeEntryData): Promise<TimeEntry> {
    const response = await apiClient.put<TimeEntry>(`/time-entries/${id}`, data);
    return response.data;
  }

  public async delete(id: string): Promise<void> {
    await apiClient.delete(`/time-entries/${id}`);
  }

  public async start(description: string, project?: string): Promise<TimeEntry> {
    const response = await apiClient.post<TimeEntry>('/time-entries/start', {
      description,
      project,
      startTime: new Date().toISOString()
    });
    return response.data;
  }

  public async stop(id: string): Promise<TimeEntry> {
    const response = await apiClient.put<TimeEntry>(`/time-entries/${id}/stop`, {
      endTime: new Date().toISOString()
    });
    return response.data;
  }

  public async getStats(filters?: TimeEntryFilters): Promise<TimeEntryStats> {
    const response = await apiClient.get<TimeEntryStats>('/time-entries/stats', {
      params: filters
    });
    return response.data;
  }

  public async getDailyStats(date: string): Promise<DailyStats> {
    const response = await apiClient.get<DailyStats>('/time-entries/stats/daily', {
      params: { date }
    });
    return response.data;
  }

  public async getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    const response = await apiClient.get<MonthlyStats>('/time-entries/stats/monthly', {
      params: { year, month }
    });
    return response.data;
  }
}

export const timeEntryService = TimeEntryService.getInstance(); 