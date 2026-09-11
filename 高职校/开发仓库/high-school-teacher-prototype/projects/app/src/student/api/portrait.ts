import { POST } from '@/web/common/api/requestStudent';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  GetStudentPortraitRequest,
  GetStudentPortraitApiResponse,
  GetStudentPortraitResponse,
} from '../types/portrait';

/**
 * 获取学生学习画像
 * @param data 请求参数（studentId）
 * @returns 解析后的学习画像数据
 */
export const getStudentPortrait = async (data: GetStudentPortraitRequest) => {
  const res = await POST<GetStudentPortraitApiResponse>(
    '/client/student/aiTeacher/portrait',
    data,
    { baseURL: getProxyUrl('/ai-university') }
  );

  // portraitJson 可能是字符串、null、undefined 或已经是对象
  let parsed: GetStudentPortraitResponse | null = null;
  if (res.portraitJson) {
    if (typeof res.portraitJson === 'string') {
      console.log('portraitJson === "string"', typeof res.portraitJson  === 'string');
      try {
        console.log('portraitJson string:', res.portraitJson);
        parsed = JSON.parse(res.portraitJson);
        console.log('portraitJson parsed:', parsed);
      } catch (err) {
        console.error('portraitJson parse error:', err);
        parsed = null;
      }
    } else if (typeof res.portraitJson === 'object') {
      console.log('portraitJson === "object"', typeof res.portraitJson  === 'object');
      parsed = res.portraitJson as GetStudentPortraitResponse;
    }
  }

  console.log('final return:', {
    ...(parsed ?? {}),
    portraitUpdatedToday: res.portraitUpdatedToday ?? false,
  });
  return {
    ...(parsed ?? {}),
    portraitUpdatedToday: res.portraitUpdatedToday ?? false,
  };
};

/**
 * 生成学生学习画像
 * @param data 请求参数（studentId）
 * @returns 接口原始响应
 */
export const generateStudentPortrait = (data: GetStudentPortraitRequest) =>
  POST('/client/student/aiTeacher/portrait/generate', data, {
    baseURL: getProxyUrl('/ai-university')
  });
