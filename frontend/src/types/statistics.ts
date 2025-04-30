export interface TimeEntry {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  project: string;
  description: string;
}

export interface ProjectBreakdown {
  name: string;
  hours: number;
}

export interface DailyData {
  date: string;
  hours: number;
}

export interface Statistics {
  totalHours: number;
  totalEntries: number;
  averageHoursPerDay: number;
  projectBreakdown: ProjectBreakdown[];
  dailyData: DailyData[];
}

export type TimeRange = 'week' | 'month' | 'year';
export type ChartType = 'line' | 'bar' | 'pie'; 