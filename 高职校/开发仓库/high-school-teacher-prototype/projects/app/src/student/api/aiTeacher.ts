import { POST } from '@/web/common/api/requestStudent';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type { AiSuggestion } from '@/teacher/types/aiTeacher';

const baseURL = getProxyUrl('/ai-university');

/**
 * 获取学生前沿资讯列表（固定返回10条）
 */
export const getStudentAiTeacherSuggestions = (): Promise<AiSuggestion[]> =>
  POST<AiSuggestion[]>('/client/student/aiTeacher/suggestions', {}, { baseURL });

/**
 * 批量标记建议已读
 */
export const postStudentSuggestionsMarkRead = (data: {
  suggestionIds: number[];
}): Promise<boolean> =>
  POST<boolean>('/client/student/aiTeacher/suggestions/markRead', data, { baseURL });

/**
 * 查询学生画像
 */
export const getStudentPortrait = (): Promise<{
  portraitJson: string;
  portraitUpdatedToday: boolean;
}> =>
  POST<{ portraitJson: string; portraitUpdatedToday: boolean }>(
    '/client/student/aiTeacher/portrait',
    {},
    { baseURL }
  );
