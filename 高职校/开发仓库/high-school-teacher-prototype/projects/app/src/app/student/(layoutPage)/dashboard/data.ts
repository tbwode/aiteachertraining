import type { DashboardData } from './types';
import { getProfileData } from '../profile/data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getDashboardData(): Promise<DashboardData> {
  const profile = await getProfileData();
  await delay(120);

  return {
    user: profile.user,
    metrics: [
      { key: 'learning', value: 5 },
      { key: 'completed', value: 12 },
      { key: 'weekly', value: 12 },
      { key: 'total', value: 168 }
    ],
    courseProgress: [
      {
        id: 'python-basic',
        progress: 80,
        actionKey: 'continue',
        actionHref: '/student/course-plaza',
        status: 'learning'
      },
      {
        id: 'web-frontend',
        progress: 45,
        actionKey: 'continue',
        actionHref: '/student/course-plaza',
        status: 'learning'
      },
      {
        id: 'network-basic',
        progress: 100,
        actionKey: 'review',
        actionHref: '/student/course-plaza',
        status: 'completed'
      },
      {
        id: 'database',
        progress: 25,
        actionKey: 'continue',
        actionHref: '/student/course-plaza',
        status: 'learning'
      }
    ],
    studyTrend: [
      { key: 'monday', hours: 2.5 },
      { key: 'tuesday', hours: 3.2 },
      { key: 'wednesday', hours: 1.8 },
      { key: 'thursday', hours: 4.0 },
      { key: 'friday', hours: 2.0 },
      { key: 'saturday', hours: 3.5 },
      { key: 'sunday', hours: 2.0 }
    ],
    timeDistribution: [
      { key: 'morning', value: 35 },
      { key: 'afternoon', value: 25 },
      { key: 'evening', value: 30 },
      { key: 'lateNight', value: 10 }
    ]
  };
}
