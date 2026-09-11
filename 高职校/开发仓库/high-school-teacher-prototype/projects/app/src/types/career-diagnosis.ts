/**
 * 职业能力诊断相关类型定义
 *
 * 由 AI agent（useSimpleChat, type=30, jsonFormat=true）生成，
 * dimension 字段取自 overview.radar_dimensions，分值统一 0-100。
 */

/** 单个能力维度项（与雷达维度对齐） */
export type CareerAbilityItem = {
  dimension: string;
  /** 0-100 */
  target: number;
};

/** 能力差距项 */
export type CareerGapItem = {
  dimension: string;
  current: number;
  target: number;
  /** target - current，正值表示待提升 */
  gap: number;
  suggestion?: string;
};

/** 推荐选修课程 */
export type RecommendedCourse = {
  name: string;
  reason?: string;
  estimatedHours?: number;
};

/** 推荐书单 */
export type RecommendedBook = {
  title: string;
  author?: string;
  reason?: string;
  /** 入门 / 进阶 / 实战 */
  category?: string;
};

/** 目标岗位（按学生专业匹配） */
export type TargetPosition = {
  id: string;
  name: string;
  summary?: string;
  /** 该岗位对各能力维度的要求分值 */
  abilities: CareerAbilityItem[];
  /** 与当前能力的差距 */
  gaps: CareerGapItem[];
  /** 推荐选修课程 */
  recommendedCourses: RecommendedCourse[];
  /** 推荐书单 */
  recommendedBooks: RecommendedBook[];
};

/** 学校人才培养方案对各能力维度的要求（全局，不随岗位切换） */
export type TrainingPlanAbility = {
  dimension: string;
  /** 0-100 */
  training: number;
};

/** AI 职业诊断完整结果 */
export type CareerDiagnosisResult = {
  /** 按专业匹配的目标岗位列表（2-4 个） */
  targetPositions: TargetPosition[];
  /** 学校人培要求（全局） */
  trainingPlanAbilities: TrainingPlanAbility[];
};

/** 课程广场模糊匹配结果：课程名 → 命中的课程卡片 */
export type CourseMatchMap = Record<
  string,
  {
    avatarId?: number;
    courseId?: number;
    courseName?: string;
    coverUrl?: string;
    majorName?: string;
    teacherName?: string;
    isEnrolled?: boolean;
  } | null
>;
