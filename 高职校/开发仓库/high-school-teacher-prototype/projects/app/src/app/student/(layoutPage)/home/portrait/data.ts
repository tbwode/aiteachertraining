import type { PortraitData } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPortraitData(): Promise<PortraitData> {
  await delay(120);

  return {
    userName: '王小雨',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaoyu',
    studentId: 'S240002',
    major: '软件工程专业',
    learningCourses: 12,
    completedCourses: 6,
    totalStudyHours: 48,
    courseProgressList: [
      { courseName: 'PYTHON基础编程', progress: 80, status: 'learning' },
      { courseName: 'WEB前端开发', progress: 45, status: 'learning' },
      { courseName: '计算机网络基础', progress: 100, status: 'completed' },
      { courseName: '数据库原理', progress: 25, status: 'learning' }
    ],
    abilityDimensions: [
      { key: 'knowledge', label: '知识掌握', value: 85, fullMark: 100 },
      { key: 'practice', label: '实践能力', value: 72, fullMark: 100 },
      { key: 'efficiency', label: '学习效率', value: 68, fullMark: 100 },
      { key: 'persistence', label: '学习毅力', value: 78, fullMark: 100 },
      { key: 'innovation', label: '创新思维', value: 80, fullMark: 100 }
    ],
    radarDescription:
      '雷达图由外至内：最外层为专业培养要求，最内层为我当前专业知识掌握能力。当前在"学习效率"能力和"学习毅力"能力方面与专业要求所达到能力有明显差距。',
    careerAnalysis: [
      {
        content:
          '当前画像显示你在编程基础和执行力方面表现较好，适合从软件开发、测试开发、实施工程师等岗位切入。若继续强化算法架构、数据工程与系统设计能力，可向AL应用开发、AL解决方案支持等岗位延展。'
      },
      {
        content:
          '你在已完成课程中具备较好的学习稳定性，但在部分核心课程上仍存在推进不均衡的问题，建议以"核心课打底 + 项目实践补强"的方式优化学习路径。'
      }
    ],
    suggestions: [
      {
        content:
          '建议优先提高《数据库原理》和《WEB前端开发》的学习进度，形成完整的前后端知识闭环。'
      },
      {
        content:
          '围绕《PYTHON基础编程》继续增加小型项目训练，并同步补充《计算机网络基础》的复习任务，避免已完成课程遗忘。'
      },
      {
        content: '若计划向AI岗位发展，后续应增加数据处理、模型部署和业务场景分析类课程。'
      }
    ],
    improvementPlan: {
      title: '跨界大模型解决方案',
      description:
        '建议优先补齐解决方案设计能力，优先学习更贴近岗位实战的大模型架构与业务落地课程。',
      courseName: '大模型架构实战',
      priority: '极高',
      matchRate: 80
    }
  };
}
