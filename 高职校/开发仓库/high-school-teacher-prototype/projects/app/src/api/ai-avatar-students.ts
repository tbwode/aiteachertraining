/**
 * AI分身学生管理 API 封装
 * 后端接口就绪前可在此替换为 mock 实现
 */
import {
  getAvatarStudentsPage as _getAvatarStudentsPage,
  remindAvatarStudents as _remindAvatarStudents
} from '@/teacher/api/aiTeacher';
import type {
  AvatarStudentsPageRequest,
  AvatarStudentsPageResponse
} from '@/teacher/types/aiTeacher';

/**
 * 获取AI分身学生列表（分页）
 */
export const getAvatarStudentsPage = (
  data: AvatarStudentsPageRequest
): Promise<AvatarStudentsPageResponse> => _getAvatarStudentsPage(data);

/**
 * 提醒学生（支持单个或批量）
 */
export const remindAvatarStudents = (data: {
  avatarId: number;
  studentIds: number[];
  teacherId: number;
}): Promise<boolean> => _remindAvatarStudents(data);
