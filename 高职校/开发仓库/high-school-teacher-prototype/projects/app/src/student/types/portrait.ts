import type { StudentPortraitRawData } from '@/types/common-chat';

/**
 * 获取/生成学生学习画像请求参数
 */
export type GetStudentPortraitRequest = {
  studentId: number;
};

/**
 * 接口原始响应（portraitJson 为 JSON 字符串）
 */
export type GetStudentPortraitApiResponse = {
  portraitJson: string;
  portraitUpdatedToday: boolean;
};

/**
 * 解析后的学习画像数据
 */
export type GetStudentPortraitResponse = StudentPortraitRawData;
