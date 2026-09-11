import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  TeacherNotificationPageParams,
  TeacherNotificationPageResponse,
  TeacherNotificationReadParams
} from '../types/notice';

const baseURL = getProxyUrl('/ai-notice');

export const postTeacherNotificationPage = (data: TeacherNotificationPageParams) =>
  POST<TeacherNotificationPageResponse>('/notification/page', data, { baseURL });

export const postTeacherNotificationUnreadNum = () =>
  POST<number>('/notification/unReadNum', {}, { baseURL });

export const postTeacherNotificationRead = (data: TeacherNotificationReadParams) =>
  POST<boolean>('/notification/read', data, { baseURL });

export const postTeacherNotificationReadAll = () =>
  POST<boolean>('/notification/readAll', {}, { baseURL });
