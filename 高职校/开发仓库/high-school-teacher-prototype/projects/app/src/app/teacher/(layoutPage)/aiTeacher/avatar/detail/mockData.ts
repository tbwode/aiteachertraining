import type { StudentData, ChapterData, CatalogItem } from './constants';

export const studentsData: StudentData[] = [
  {
    id: '1',
    name: '张三',
    className: '计应2401班',
    progress: 85,
    studyHours: 12,
    lastStudy: '2小时前',
    status: 'normal'
  },
  {
    id: '2',
    name: '李四',
    className: '计应2401班',
    progress: 35,
    studyHours: 5,
    lastStudy: '3天前',
    status: 'lagging',
    reminded: false
  },
  {
    id: '3',
    name: '王五',
    className: '计应2402班',
    progress: 92,
    studyHours: 15,
    lastStudy: '1天前',
    status: 'normal'
  },
  {
    id: '4',
    name: '赵六',
    className: '计应2402班',
    progress: 28,
    studyHours: 4,
    lastStudy: '5天前',
    status: 'lagging',
    reminded: true
  },
  {
    id: '5',
    name: '钱七',
    className: '计应2401班',
    progress: 100,
    studyHours: 18,
    lastStudy: '2天前',
    status: 'completed'
  }
];

export const chapters: ChapterData[] = [
  {
    id: '1',
    title: '第一章 机械设计概论',
    color: 'green.500',
    description: '设计基础概念与原则',
    tags: ['#概述', '#原则'],
    sections: ['机械设计概述', '设计原则', '设计流程', '设计方法']
  },
  {
    id: '2',
    title: '第二章 机械零件强度',
    color: 'blue.500',
    description: '强度计算与分析方法',
    tags: ['#强度', '#计算'],
    sections: ['静载荷', '动载荷', '疲劳极限', '安全系数']
  },
  {
    id: '3',
    title: '第三章 连接设计',
    color: 'gray.400',
    description: '常用连接方式设计',
    tags: ['#连接', '#设计'],
    sections: ['螺纹连接', '键连接', '销连接']
  }
];

export const catalogItems: CatalogItem[] = [
  {
    chapter: '第一章 机械设计概论',
    lessons: [
      { title: '1.1 机械设计基本概念', type: 'video', icon: 'play-circle' },
      { title: '1.2 机械设计发展历程', type: 'pdf', icon: 'file-text' },
      { title: '1.3 本章小结', type: 'image', icon: 'image' }
    ]
  },
  {
    chapter: '第二章 机械零件的强度计算',
    lessons: [
      { title: '2.1 载荷与应力', type: 'pdf', icon: 'file-text' },
      { title: '2.2 材料的疲劳强度', type: 'pdf', icon: 'file-text' }
    ]
  }
];
