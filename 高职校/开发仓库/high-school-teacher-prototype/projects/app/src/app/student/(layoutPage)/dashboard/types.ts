import type { UserInfo } from '../profile/types';

export interface DashboardMetric {
  key: 'learning' | 'completed' | 'weekly' | 'total';
  value: number;
}

export interface CourseProgressItem {
  id: 'python-basic' | 'web-frontend' | 'network-basic' | 'database';
  progress: number;
  actionKey: 'continue' | 'review';
  actionHref: string;
  status: 'learning' | 'completed';
}

export interface StudyTrendPoint {
  key: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  hours: number;
}

export interface StudyTimeDistribution {
  key: 'morning' | 'afternoon' | 'evening' | 'lateNight';
  value: number;
}

export interface DashboardData {
  user: UserInfo;
  metrics: DashboardMetric[];
  courseProgress: CourseProgressItem[];
  studyTrend: StudyTrendPoint[];
  timeDistribution: StudyTimeDistribution[];
}
