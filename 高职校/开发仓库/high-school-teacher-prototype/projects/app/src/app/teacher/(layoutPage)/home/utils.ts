import type { AvatarStatus, SuggestionType } from './constants';
import { ERROR_COLOR, INFO_COLOR, SUCCESS_COLOR, WARNING_COLOR } from './constants';

export function getSuggestionMeta(type: SuggestionType) {
  if (type === 'news') {
    return {
      label: '前沿资讯',
      badgeBg: 'rgba(22,119,255,0.12)',
      badgeColor: INFO_COLOR,
      cardBg: '#F9FAFB',
      borderColor: 'transparent'
    };
  }

  if (type === 'optimization') {
    return {
      label: '课程优化',
      badgeBg: 'rgba(250,173,20,0.16)',
      badgeColor: '#B7791F',
      cardBg: '#FFF7E6',
      borderColor: '#FCE7B2'
    };
  }

  return {
    label: '能力图谱',
    badgeBg: 'rgba(82,196,26,0.16)',
    badgeColor: '#2F855A',
    cardBg: '#F0FFF4',
    borderColor: '#C6F6D5'
  };
}

export function getStudentProgressMeta(progress: number) {
  if (progress < 40) {
    return {
      color: ERROR_COLOR,
      scheme: 'red'
    };
  }

  return {
    color: WARNING_COLOR,
    scheme: 'yellow'
  };
}

export function getStatusMeta(status: AvatarStatus) {
  if (status === 'running') {
    return {
      label: 'AI教师运行中',
      dotColor: '#2BA471',
      overlayAction: '取消发布',
      overlayActionColor: '#1F2937'
    };
  }

  if (status === 'pending') {
    return {
      label: '未开始',
      dotColor: '#9CA3AF',
      overlayAction: '发布',
      overlayActionColor: SUCCESS_COLOR
    };
  }

  return {
    label: '已截止',
    dotColor: '#9CA3AF',
    overlayAction: '重新发布',
    overlayActionColor: '#C83E3E'
  };
}
