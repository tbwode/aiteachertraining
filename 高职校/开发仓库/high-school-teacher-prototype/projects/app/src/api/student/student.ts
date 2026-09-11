import { POST } from '@/web/common/api/requestStudent';
import type {
  StudentPreferenceQueryRequest,
  StudentPreferenceVO,
  StudentPreferenceRequest,
  RBoolean,
  StudentAiTeacherStatsRequest,
  StudentAiTeacherStatsVO,
  StudentCourseListRequest,
  StudentCourseCardVO,
  JoinAvatarStudyRequest,
  StudentCourseDetailRequest,
  StudentCourseDetailVO,
  SaveStudyProgressRequest,
  ConversationPageRequest,
  ConversationItemVO,
  ConversationSaveRequest,
  ConversationDetailRequest,
  ConversationDetailVO
} from '@/types/api/student/student';
import type {
  CourseSquarePageVO,
  CourseSquareQueryRequest
} from '@/types/api/student/courseSquare';
import type {
  ListMajorCategoriesResponse,
  ListTenantMajorsResponse,
  TenantMajorListRequest
} from '@/types/api/admin/teaching/majors';
import type { SemesterListItem } from '@/types/api/admin/teaching/semesters';

// 学生端 API baseURL
const baseURL = '/ai-university';

/**
 * 获取学生AI教师偏好配置
 * @param data 请求参数
 * @returns 学生AI教师偏好配置数据
 */
export const queryStudentPreference = (data: StudentPreferenceQueryRequest) => {
  return POST<StudentPreferenceVO>('/client/student/aiTeacher/preference/query', data, {
    baseURL: baseURL
  });
};

/**
 * 保存学生AI教师偏好配置
 * @param data 请求参数（不传id则新增，传id则修改）
 * @returns 保存结果
 */
export const saveStudentPreference = (data: StudentPreferenceRequest) => {
  return POST<boolean>('/client/student/aiTeacher/preference/save', data, {
    baseURL: baseURL
  });
};

/**
 * 获取学生AI教师首页统计数据
 * @param data 请求参数
 * @returns 学生AI教师统计数据
 */
export const getStudentAiTeacherStats = (data: StudentAiTeacherStatsRequest) => {
  return POST<StudentAiTeacherStatsVO>('/client/student/aiTeacher/stats', data, {
    baseURL: baseURL
  });
};

/**
 * 获取学生课程列表
 * @param data 请求参数
 * @returns 学生课程列表
 */
export const getStudentCourseList = (data: StudentCourseListRequest) => {
  return POST<StudentCourseCardVO[]>('/client/student/aiTeacher/courses', data, {
    baseURL: baseURL
  });
};

/**
 * 加入学习（选修课程）
 * @param data 请求参数
 * @returns 加入结果
 */
export const joinAvatarStudy = (data: JoinAvatarStudyRequest) => {
  return POST<boolean>('/client/student/aiTeacher/joinAvatar', data, {
    baseURL: baseURL
  });
};

/**
 * 查询课程详情
 * @param data 请求参数
 * @returns 课程详情数据
 */
export const getStudentCourseDetail = (data: StudentCourseDetailRequest) => {
  return POST<StudentCourseDetailVO>('/client/student/aiTeacher/courseDetail', data, {
    baseURL: baseURL
  });
};

/**
 * 保存学生课件学习进度
 * @param data 请求参数
 * @returns 保存结果
 */
export const saveStudyProgress = (data: SaveStudyProgressRequest) => {
  return POST<boolean>('/client/student/aiTeacher/saveProgress', data, {
    baseURL: baseURL
  });
};

/**
 * 获取AI教师历史对话列表
 * @param data 查询参数
 * @returns 历史对话分页列表
 */
export const getConversationPage = (data: ConversationPageRequest) => {
  return POST<{
    records: ConversationItemVO[];
    total: number;
    current: number;
    size: number;
    pages: number;
  }>('/client/student/aiTeacher/conversation/page', data, {
    baseURL: baseURL
  });
};

/**
 * 保存对话记录（新建或追加）
 * @param data 请求参数
 * @returns 会话ID
 */
export const saveConversation = (data: ConversationSaveRequest) => {
  return POST<number>('/client/student/aiTeacher/conversation/save', data, {
    baseURL: baseURL
  });
};

/**
 * 获取历史对话详情
 * @param data 请求参数
 * @returns 对话详情
 */
export const getConversationDetail = (data: ConversationDetailRequest) => {
  return POST<ConversationDetailVO>('/client/student/aiTeacher/conversation/detail', data, {
    baseURL: baseURL
  });
};

/**
 * 获取课程广场分页列表
 * @param data 查询参数
 * @returns 课程广场分页数据
 */
export const postCourseSquarePage = (data: CourseSquareQueryRequest) => {
  return POST<CourseSquarePageVO>('/client/courseSquare/page', data, {
    baseURL: baseURL
  });
};

/**
 * 获取课程广场专业大类列表
 * @returns 专业大类列表
 */
export const postStudentMajorListCategories = () => {
  return POST<ListMajorCategoriesResponse>(
    '/client/tenantMajor/listCategories',
    {},
    {
      baseURL: baseURL
    }
  );
};

/**
 * 获取课程广场专业列表
 * @param data 查询参数
 * @returns 专业列表
 */
export const postStudentMajorList = (data: TenantMajorListRequest) => {
  return POST<ListTenantMajorsResponse>('/client/tenantMajor/list', data, {
    baseURL: baseURL
  });
};

/**
 * 获取课程广场学期列表
 * @returns 学期列表
 */
export const postStudentSemesterList = () => {
  return POST<SemesterListItem[]>(
    '/client/semester/list',
    {},
    {
      baseURL: baseURL
    }
  );
};
