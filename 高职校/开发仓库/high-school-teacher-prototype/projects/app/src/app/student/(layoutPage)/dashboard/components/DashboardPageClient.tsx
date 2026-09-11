'use client';

import { DashboardPanel } from './DashboardPanel';
import type { DashboardData } from '../types';

export function DashboardPageClient({ data }: { data: DashboardData }) {
  return <DashboardPanel data={data} />;
}
