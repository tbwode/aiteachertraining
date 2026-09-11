import type { StatusMeta } from './constants';
import { SUCCESS_COLOR, WARNING_COLOR } from './constants';

export function getStatusMeta(status: string): StatusMeta {
  switch (status) {
    case 'not-started':
      return {
        label: '未开始',
        bg: 'rgba(0,0,0,0.04)',
        color: '#8C8C8C'
      };
    case 'normal':
      return {
        label: '正常',
        bg: 'rgba(82,196,26,0.1)',
        color: SUCCESS_COLOR
      };
    case 'lagging':
      return {
        label: '滞后',
        bg: 'rgba(250,173,20,0.1)',
        color: WARNING_COLOR
      };
    case 'completed':
      return {
        label: '已完成',
        bg: 'rgba(24,144,255,0.1)',
        color: '#1890FF'
      };
    default:
      return {
        label: '未知',
        bg: 'rgba(0,0,0,0.04)',
        color: '#8C8C8C'
      };
  }
}

export function getProgressColor(progress: number): string {
  if (progress >= 80) return SUCCESS_COLOR;
  if (progress >= 50) return WARNING_COLOR;
  return '#F5222D';
}
