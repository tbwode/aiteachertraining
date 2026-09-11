import type { CourseDetailData } from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getCourseDetailData(): Promise<CourseDetailData> {
  await delay(120);

  return {
    courseId: 'python-basic',
    titleKey: 'studentCourseDetail.course.title',
    majorKey: 'computerApplication',
    teacherKey: 'teacherWang',
    durationLabel: '48',
    progress: 80,
    cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=500&fit=crop',
    introKey: 'studentCourseDetail.course.introduction',
    tags: ['python', 'programmingBasics'],
    knowledgeChapters: [
      {
        id: 'chapter1',
        lessonCount: 3,
        tags: ['overview', 'setup'],
        nodeKeys: ['variables', 'dataTypes', 'environment']
      },
      {
        id: 'chapter2',
        lessonCount: 3,
        tags: ['types', 'structures'],
        nodeKeys: ['numeric', 'string', 'listTuple']
      },
      {
        id: 'chapter3',
        lessonCount: 3,
        tags: ['flow', 'control'],
        nodeKeys: ['ifStatement', 'forLoop', 'whileLoop']
      }
    ],
    catalogChapters: [
      {
        id: 'catalog-1',
        titleKey: 'studentCourseDetail.catalog.chapter1.title',
        tipKey: 'studentCourseDetail.catalog.chapter1.tip',
        defaultExpanded: true,
        lessons: [
          {
            id: 'lesson-1-1',
            mediaType: 'video',
            titleKey: 'studentCourseDetail.catalog.lesson11',
            duration: '15:30',
            status: 'completed',
            href: '/student/study'
          },
          {
            id: 'lesson-1-2',
            mediaType: 'video',
            titleKey: 'studentCourseDetail.catalog.lesson12',
            duration: '22:15',
            status: 'completed',
            href: '/student/study'
          },
          {
            id: 'lesson-1-3',
            mediaType: 'video',
            titleKey: 'studentCourseDetail.catalog.lesson13',
            duration: '学习中',
            status: 'current',
            href: '/student/study'
          }
        ]
      },
      {
        id: 'catalog-2',
        titleKey: 'studentCourseDetail.catalog.chapter2.title',
        tipKey: 'studentCourseDetail.catalog.chapter2.tip',
        defaultExpanded: false,
        lessons: [
          {
            id: 'lesson-2-1',
            mediaType: 'text',
            titleKey: 'studentCourseDetail.catalog.lesson21',
            duration: '18:45',
            status: 'locked',
            href: '/student/study'
          },
          {
            id: 'lesson-2-2',
            mediaType: 'audio',
            titleKey: 'studentCourseDetail.catalog.lesson22',
            duration: '25:20',
            status: 'locked',
            href: '/student/study'
          }
        ]
      },
      {
        id: 'catalog-3',
        titleKey: 'studentCourseDetail.catalog.chapter3.title',
        tipKey: 'studentCourseDetail.catalog.chapter3.tip',
        defaultExpanded: false,
        lessons: [
          {
            id: 'lesson-3-1',
            mediaType: 'video',
            titleKey: 'studentCourseDetail.catalog.lesson31',
            duration: '20:00',
            status: 'locked',
            href: '/student/study'
          },
          {
            id: 'lesson-3-2',
            mediaType: 'text',
            titleKey: 'studentCourseDetail.catalog.lesson32',
            duration: '18:30',
            status: 'locked',
            href: '/student/study'
          }
        ]
      },
      {
        id: 'catalog-4',
        titleKey: 'studentCourseDetail.catalog.chapter4.title',
        tipKey: 'studentCourseDetail.catalog.chapter4.tip',
        defaultExpanded: false,
        lessons: [
          {
            id: 'lesson-4-1',
            mediaType: 'image',
            titleKey: 'studentCourseDetail.catalog.lesson41',
            duration: '22:00',
            status: 'locked',
            href: '/student/study'
          },
          {
            id: 'lesson-4-2',
            mediaType: 'video',
            titleKey: 'studentCourseDetail.catalog.lesson42',
            duration: '25:00',
            status: 'locked',
            href: '/student/study'
          }
        ]
      }
    ],
    aiMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        contentKey: 'studentCourseDetail.aiChat.welcome'
      },
      {
        id: 'question',
        role: 'user',
        contentKey: 'studentCourseDetail.aiChat.question'
      },
      {
        id: 'answer',
        role: 'assistant',
        contentKey: 'studentCourseDetail.aiChat.answerIntro',
        listKeys: [
          'studentCourseDetail.aiChat.answerPoints.mutable',
          'studentCourseDetail.aiChat.answerPoints.syntax',
          'studentCourseDetail.aiChat.answerPoints.performance'
        ]
      }
    ]
  };
}
