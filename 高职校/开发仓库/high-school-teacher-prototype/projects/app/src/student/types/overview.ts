import type { CourseProgressItem } from '@/types/common-chat';

/**
 * 获取学生概览数据请求参数
 */
export type GetStudentOverviewRequest = {
  studentId: number;
};

/**
 * 学生概览接口响应（data 字段）
 */
export type GetStudentOverviewResponse = {
  studentName?: string;
  studentCode?: string;
  majorName?: string;
  majorId?: number;
  radarDimensions?: string;
  studyingCourseCount?: number;
  completedCourseCount?: number;
  totalStudyHours?: number;
  portraitJson?: string;
  portraitUpdatedToday?: boolean;
  courseProgressList?: {
    courseId?: number;
    courseName?: string;
    avatarId?: number;
    progress?: number;
  }[];
};
