import type { StudentPreferenceVO } from '@/types/api/student/student';

/**
 * 教师风格枚举映射
 */
const teachingStyleMap: Record<number, string> = {
  1: '温和亲切',
  2: '专业严谨',
  3: '幽默风趣',
  4: '启发激励'
};

/**
 * 教学方式枚举映射
 */
const explanationMethodMap: Record<number, string> = {
  1: '循序渐进',
  2: '对话引导',
  3: '可视化讲解',
  4: '类比举例',
  5: '案例教学'
};

/**
 * 课件类型枚举映射
 */
const coursewareTypeMap: Record<number, string> = {
  1: '文章文档',
  2: '音频讲解',
  3: '互动练习',
  4: '视频课程',
  5: '代码实践',
  6: '项目实战'
};

/**
 * 反馈风格枚举映射
 */
const feedbackStyleMap: Record<number, string> = {
  1: '纠错型',
  2: '鼓励型',
  3: '总结型'
};

/**
 * 学习节奏枚举映射
 */
const learningPaceMap: Record<number, string> = {
  1: '快速学习',
  2: '稳步推进',
  3: '深度钻研'
};

/**
 * 讲解深度枚举映射
 */
const explanationDepthMap: Record<number, string> = {
  1: '简洁',
  2: '偏简',
  3: '适中',
  4: '偏深',
  5: '深入'
};

/**
 * 互动频率枚举映射
 */
const interactionFrequencyMap: Record<number, string> = {
  1: '直接回答',
  2: '较少',
  3: '适中',
  4: '较多',
  5: '频繁互动'
};

/**
 * 技能应用层级枚举映射
 */
const skillLevelMap: Record<number, string> = {
  0: '模仿练习',
  1: '独立操作',
  2: '灵活变通',
  3: '熟练创新'
};

/**
 * 知识掌握层级枚举映射
 */
const knowledgeLevelMap: Record<number, string> = {
  0: '基础认知',
  1: '理解关联',
  2: '迁移应用',
  3: '综合创新'
};

/**
 * 创新素质层级枚举映射
 */
const innovationLevelMap: Record<number, string> = {
  0: '好奇质疑',
  1: '发散思维',
  2: '批判构建',
  3: '实践引领'
};

/**
 * 解析逗号分隔的枚举字符串为中文数组
 */
const parseEnumString = (enumStr: string | undefined, map: Record<number, string>): string[] => {
  if (!enumStr) return [];
  return enumStr
    .split(',')
    .map((v) => parseInt(v.trim(), 10))
    .filter((v) => !isNaN(v) && map[v])
    .map((v) => map[v]);
};

/**
 * 翻译学生偏好设置为中文对象
 * @param preference StudentPreferenceVO 对象
 * @returns 翻译后的中文对象
 */
export const translateStudentSetting = (
  preference: StudentPreferenceVO | null | undefined
): Record<string, any> => {
  if (!preference) {
    return {};
  }

  return {
    // 教师风格
    teachingStyle: teachingStyleMap[preference.teachingStyle ?? 0] || '未设置',
    // 讲解深度
    explanationDepth: explanationDepthMap[preference.explanationDepth ?? 0] || '未设置',
    // 互动频率
    interactionFrequency: interactionFrequencyMap[preference.interactionFrequency ?? 0] || '未设置',
    // 教学方式（多选）
    explanationMethods: parseEnumString(preference.explanationMethods, explanationMethodMap),
    // 课件类型（多选）
    coursewareTypes: parseEnumString(preference.coursewareTypes, coursewareTypeMap),
    // 反馈风格（多选）
    feedbackStyle: parseEnumString(preference.feedbackStyle, feedbackStyleMap),
    // 学习节奏
    learningPace: learningPaceMap[preference.learningPace ?? 0] || '未设置'
  };
};

/**
 * 翻译教师设置为中文对象
 * @param teachingConfig 原始 teachingConfig 对象
 * @returns 翻译后的中文对象
 */
export const translateTeacherSetting = (
  teachingConfig: Record<string, any> | null | undefined
): Record<string, any> => {
  if (!teachingConfig) {
    return {};
  }

  return {
    // 技能应用层级
    skillLevel: skillLevelMap[teachingConfig.skillLevel ?? 0] || '未设置',
    // 知识掌握层级
    knowledgeLevel: knowledgeLevelMap[teachingConfig.knowledgeLevel ?? 0] || '未设置',
    // 创新素质层级
    innovationLevel: innovationLevelMap[teachingConfig.innovationLevel ?? 0] || '未设置'
  };
};

/**
 * 将 studentSetting JSON 字符串翻译为中文后返回 JSON 字符串
 * @param studentSettingStr 原始 studentSetting JSON 字符串
 * @returns 翻译后的 JSON 字符串
 */
export const translateStudentSettingToJson = (studentSettingStr: string): string => {
  try {
    const parsed = JSON.parse(studentSettingStr);
    const translated = translateStudentSetting(parsed);
    return JSON.stringify(translated);
  } catch {
    return '{}';
  }
};

/**
 * 将 teacherSetting JSON 字符串翻译为中文后返回 JSON 字符串
 * @param teachingConfigStr 原始 teachingConfig JSON 字符串
 * @returns 翻译后的 JSON 字符串
 */
export const translateTeacherSettingToJson = (teachingConfigStr: string): string => {
  try {
    const parsed = JSON.parse(teachingConfigStr);
    const translated = translateTeacherSetting(parsed);
    return JSON.stringify(translated);
  } catch {
    return '{}';
  }
};
