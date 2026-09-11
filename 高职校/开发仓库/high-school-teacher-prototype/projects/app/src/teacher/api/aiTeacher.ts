/**
 * AI教师相关 API
 */
import { POST } from '@/web/common/api/requestTeacher';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { getProxyUrl } from '@/web/common/api/apiProxy';
import type {
  HomeStatsData,
  AiSuggestion,
  TodoListData,
  TeachingTaskCourseSemesterGroup,
  AiTeacherBaseRequest,
  AiTeacherSuggestionRequest,
  AiAvatarListRequest,
  AiAvatarVO,
  AiAvatarDetailRequest,
  AiAvatarDetailVO,
  AiAvatarCreateRequest,
  AiAvatarUpdateRequest,
  AiAvatarUpdateResultVO,
  AiAvatarPublishRequest,
  AvatarStudentsPageRequest,
  AvatarStudentsPageResponse,
  AvatarStudentsStatsRequest,
  AvatarStudentsStatsResponse,
  TeachingContentVO,
  CourseOverviewRequest,
  CourseOverviewVO,
  ConversationGroupVO,
  StudentConversationListRequest,
  MaicTaskPageRequest,
  MaicTaskPageResponse,
  DigitalCoursewareListRequest,
  DigitalCoursewareListResponse,
  ResourceLibraryPageRequest,
  ResourceLibraryPageResponse,
  CoursewareFileUploadResponse
} from '../types/aiTeacher';

// AI教师接口使用 ai-university 服务
const baseURL = getProxyUrl('/ai-university');

/**
 * 获取首页统计数据
 */
export const getAiTeacherStats = (data: AiTeacherBaseRequest): Promise<HomeStatsData> =>
  POST<HomeStatsData>('/client/aiTeacher/stats', data, { baseURL });

/**
 * 获取AI智能建议-前沿资讯（最多返回3条）
 */
export const getAiTeacherSuggestions = (data: AiTeacherSuggestionRequest): Promise<AiSuggestion[]> =>
  POST<AiSuggestion[]>('/client/aiTeacher/suggestions', data, { baseURL });

/**
 * 获取今日待办列表（滞后学生）
 */
export const getAiTeacherTodos = (data: AiTeacherBaseRequest): Promise<TodoListData> =>
  POST<TodoListData>('/client/aiTeacher/todos', data, { baseURL });

/**
 * 获取教师教学任务课程列表（按学期分组，用于新建AI分身选择课程）
 */
export const getTeachingTaskCourses = (
  data: AiTeacherBaseRequest
): Promise<TeachingTaskCourseSemesterGroup[]> =>
  POST<TeachingTaskCourseSemesterGroup[]>('/client/aiTeacher/avatars/teachingTaskCoursesCurrent', data, {
    baseURL
  });

/**
 * 获取AI分身列表
 */
export const getAiAvatarList = (data: AiAvatarListRequest): Promise<AiAvatarVO[]> =>
  POST<AiAvatarVO[]>('/client/aiTeacher/avatars/list', data, { baseURL });

/**
 * 获取AI分身详情
 */
export const getAiAvatarDetail = (data: AiAvatarDetailRequest): Promise<AiAvatarDetailVO> =>
  POST<AiAvatarDetailVO>('/client/aiTeacher/avatars/detail', data, { baseURL });

/**
 * 创建AI分身
 */
export const createAiAvatar = (data: AiAvatarCreateRequest): Promise<AiAvatarVO> =>
  POST<AiAvatarVO>('/client/aiTeacher/avatars/create', data, { baseURL });

/**
 * 更新AI分身
 */
export const updateAiAvatar = (data: AiAvatarUpdateRequest): Promise<AiAvatarUpdateResultVO> =>
  POST<AiAvatarUpdateResultVO>('/client/aiTeacher/avatars/update', data, { baseURL });

/**
 * 发布/取消发布AI分身
 */
export const updateAiAvatarStatus = (data: AiAvatarPublishRequest): Promise<boolean> =>
  POST<boolean>('/client/aiTeacher/avatars/updateStatus', data, { baseURL });

/**
 * 批量标记AI建议已读（支持单个或多个）
 */
export const batchMarkSuggestionsRead = (data: {
  teacherId: number;
  suggestionIds: number[];
}): Promise<boolean> => POST<boolean>('/client/aiTeacher/suggestions/markRead', data, { baseURL });

/**
 * 获取AI分身学生列表（分页）
 */
export const getAvatarStudentsPage = (
  data: AvatarStudentsPageRequest
): Promise<AvatarStudentsPageResponse> =>
  POST<AvatarStudentsPageResponse>('/client/aiTeacher/avatars/students/page', data, { baseURL });

/**
 * 获取AI分身学生统计数据
 */
export const getAvatarStudentsStats = (
  data: AvatarStudentsStatsRequest
): Promise<AvatarStudentsStatsResponse> =>
  POST<AvatarStudentsStatsResponse>('/client/aiTeacher/avatars/students/stats', data, { baseURL });

/**
 * 上传文件后触发解析（用于课件资源解析）
 * 返回解析结果数组
 */
export const triggerFileParseAfterUpload = (data: {
  fileKeys: string[];
  source: number;
  courseId: string | number;
}): Promise<
  Array<{
    id: number;
    fileKey: string;
    fileName: string;
    parseStatus: number;
    content: string;
  }>
> => POST('/client/fileParse/upload', data, { baseURL });

/**
 * 导出AI分身学生数据
 */
export const exportAvatarStudents = (data: {
  avatarId: number;
  clazzId?: number | null;
  progressRange?: string | null;
  status?: number | null;
  isLagging?: number | null;
  searchKey?: string | null;
}): Promise<Blob> =>
  POST('/client/aiTeacher/avatars/students/export', data, {
    baseURL,
    responseType: 'blob'
  });

/**
 * 提醒学生（支持单个或批量）
 */
export const remindAvatarStudents = (data: {
  avatarId: number;
  studentIds: number[];
  teacherId: number;
}): Promise<boolean> => POST<boolean>('/client/aiTeacher/avatars/remind', data, { baseURL });

/**
 * 删除 AI 分身
 * TODO: 替换为真实删除接口
 */
export const deleteAiAvatar = (data: { id: number; teacherId: number }): Promise<boolean> =>
  // TODO: DELETE /client/aiTeacher/avatars/:id
  POST<boolean>('/client/aiTeacher/avatars/delete', data, { baseURL });

/**
 * 获取教师授课内容(当前学期教学任务课程列表)
 */
export const getAiTeacherTeachingContent = (
  data: AiTeacherBaseRequest
): Promise<TeachingContentVO> =>
  POST<TeachingContentVO>('/client/aiTeacher/teachingContent', data, { baseURL });

/**
 * 课程教学概况
 */
export const getAiTeacherCourseOverview = (
  data: CourseOverviewRequest
): Promise<CourseOverviewVO> =>
  POST<CourseOverviewVO>('/client/aiTeacher/courseOverview', data, { baseURL });

/**
 * 教师查看学生对话记录列表（按话题分组含消息）
 */
export const getStudentConversationList = (
  data: StudentConversationListRequest
): Promise<ConversationGroupVO[]> =>
  POST<ConversationGroupVO[]>('/client/aiTeacher/avatars/students/conversation/list', data, {
    baseURL
  });

/**
 * 获取AI互动课分页列表（创作空间弹窗-AI互动课Tab）
 */
export const getMaicTaskPage = (data: MaicTaskPageRequest): Promise<MaicTaskPageResponse> =>
  POST<MaicTaskPageResponse>('/client/courseware-file/maic-task/page', data, { baseURL });

/**
 * 获取数字课件列表（创作空间弹窗-数字课件Tab）
 */
export const getDigitalCoursewareList = (
  data: DigitalCoursewareListRequest
): Promise<DigitalCoursewareListResponse> =>
  POST<DigitalCoursewareListResponse>('/client/courseware-file/all-files', data, { baseURL });

/**
 * 获取教学资源库分页列表（创作空间弹窗-教学资源库Tab）
 */
export const getResourceLibraryPage = (
  data: ResourceLibraryPageRequest
): Promise<ResourceLibraryPageResponse> =>
  POST<ResourceLibraryPageResponse>('/client/courseware-file/resource/page', data, { baseURL });

/**
 * 批量上传课件文件（创作空间弹窗-本地上传Tab）
 * 表单字段名固定为 files，支持多文件。空文件会被业务拒绝
 * 后端可能返回 { records: [...] } 或直接返回数组
 */
export const uploadCoursewareFiles = (
  data: FormData
): Promise<CoursewareFileUploadResponse | CoursewareFileUploadRecord[]> =>
  POST<CoursewareFileUploadResponse | CoursewareFileUploadRecord[]>('/client/courseware-file/upload', data, {
    baseURL,
    timeout: 480000
  });
