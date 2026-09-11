import { POST } from '@/web/common/api/requestStudent';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  StudentNotificationPageParams,
  StudentNotificationPageResponse,
  StudentNotificationReadParams
} from '../types/notice';

const baseURL = getProxyUrl('/ai-notice');

export const postStudentNotificationPage = (data: StudentNotificationPageParams) =>
  POST<StudentNotificationPageResponse>('/notification/page', data, { baseURL });

export const postStudentNotificationUnreadNum = () =>
  POST<number>('/notification/unReadNum', {}, { baseURL });

export const postStudentNotificationRead = (data: StudentNotificationReadParams) =>
  POST<boolean>('/notification/read', data, { baseURL });

export const postStudentNotificationReadAll = () =>
  POST<boolean>('/notification/readAll', {}, { baseURL });
