import { POST } from '@/web/common/api/requestStudent';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  GetStudentOverviewRequest,
  GetStudentOverviewResponse,
} from '../types/overview';

/**
 * 获取学生概览数据（基础信息 + 课程进度 + 雷达图维度名称）
 * @param data 请求参数（studentId）
 * @returns 学生概览数据
 */
export const getStudentOverview = (data: GetStudentOverviewRequest) =>
  POST<GetStudentOverviewResponse>(
    '/client/student/aiTeacher/overview',
    data,
    { baseURL: getProxyUrl('/ai-university') }
  );
