import type { AiTeacherPageData } from './aiTeacherTypes';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAiTeacherPageData(): Promise<AiTeacherPageData> {
  await delay(120);

  return {
    metrics: [
      { key: 'teacherCount', value: '5' },
      { key: 'interactionCount', value: '128' },
      { key: 'studyDuration', value: '36h' }
    ],
    tabs: [
      { key: 'required', count: 3 },
      { key: 'optional', count: 2 },
      { key: 'all', count: 5 }
    ],
    courses: [
      {
        id: 'python-basic',
        status: 'learning',
        majorKey: 'computerApplication',
        teacherKey: 'teacherWang',
        studentCount: 256,
        progress: 80,
        cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop',
        coverTone: 'linear-gradient(135deg, #FDE8E8, #FEE2B3)',
        href: '/student/course-detail',
        actionKey: 'continue',
        availableTabs: ['required', 'all']
      },
      {
        id: 'web-frontend',
        status: 'learning',
        majorKey: 'computerApplication',
        teacherKey: 'teacherLi',
        studentCount: 189,
        progress: 50,
        cover: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&h=400&fit=crop',
        coverTone: 'linear-gradient(135deg, #FFE9D6, #FFF1BF)',
        href: '/student/course-detail',
        actionKey: 'continue',
        availableTabs: ['required', 'all']
      },
      {
        id: 'database',
        status: 'learning',
        majorKey: 'computerApplication',
        teacherKey: 'teacherZhang',
        studentCount: 312,
        progress: 25,
        cover: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop',
        coverTone: 'linear-gradient(135deg, #FDE68A, #FEF3C7)',
        href: '/student/course-detail',
        actionKey: 'continue',
        availableTabs: ['required', 'all']
      },
      {
        id: 'java-programming',
        status: 'locked',
        majorKey: 'softwareTechnology',
        teacherKey: 'teacherChen',
        studentCount: 178,
        progress: 0,
        cover: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
        coverTone: 'linear-gradient(135deg, #FFE4E6, #FBCFE8)',
        href: '/student/course-detail',
        actionKey: 'locked',
        availableTabs: ['optional', 'all'],
        unlockDate: '04-15'
      },
      {
        id: 'network-basic',
        status: 'completed',
        majorKey: 'networkTechnology',
        teacherKey: 'teacherLiu',
        studentCount: 245,
        progress: 100,
        cover: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=400&fit=crop',
        coverTone: 'linear-gradient(135deg, #F3E8FF, #FBCFE8)',
        href: '/student/course-detail',
        actionKey: 'review',
        availableTabs: ['optional', 'all']
      }
    ],
    styleOptions: [{ id: 'gentle' }, { id: 'professional' }, { id: 'funny' }, { id: 'inspiring' }],
    learningPaceOptions: [{ id: 'fast' }, { id: 'steady' }, { id: 'deepDive' }],
    sliders: [
      {
        id: 'depth',
        min: 1,
        max: 5,
        defaultValue: 3,
        activeValue: 3,
        labelRange: ['brief', 'deep'],
        scaleLabels: ['brief', 'lean', 'balanced', 'detailed', 'deep']
      },
      {
        id: 'interaction',
        min: 1,
        max: 5,
        defaultValue: 3,
        activeValue: 3,
        labelRange: ['direct', 'interactive'],
        scaleLabels: ['low', 'less', 'balanced', 'more', 'high']
      }
    ],
    preferenceGroups: [
      {
        id: 'teachingMethod',
        optionIds: ['stepByStep', 'dialogue', 'visual', 'analogy', 'caseStudy'],
        defaultSelected: ['stepByStep', 'analogy']
      },
      {
        id: 'contentFormat',
        optionIds: ['article', 'audio', 'interactive', 'video', 'code', 'project'],
        defaultSelected: ['article', 'interactive', 'video']
      },
      {
        id: 'feedbackStyle',
        optionIds: ['corrective', 'encouraging', 'summary'],
        defaultSelected: ['corrective']
      }
    ]
  };
}
