// teacher-mock-data.js - 教师端专用假数据（依赖 ../PC/js/mock-data.js 中的基础数据）

const CURRENT_TEACHER = {
  id: 't1',
  name: '张老师',
  avatar: '',
  orgName: '教学研究组',
  grade: '七年级',
  subject: '语文',
  isAdmin: true,
};

// 教师-课程关系（哪些课程已报名/关注，学习进度如何）
const TEACHER_COURSE_RELATIONS = {
  t1: [
    { courseId: 'c1', enrolled: true, followed: true, progress: 100, lastLearnTime: '2025-06-18 10:00:00', earnedHours: 3.0, followTime: '2025-05-10 09:00:00' },
    { courseId: 'c2', enrolled: true, followed: true, progress: 75, lastLearnTime: '2025-06-20 15:30:00', earnedHours: 4.0, followTime: '2025-05-12 14:00:00' },
    { courseId: 'c4', enrolled: true, followed: false, progress: 50, lastLearnTime: '2025-06-19 09:00:00', earnedHours: 2.0, followTime: '2025-05-15 10:30:00' },
    { courseId: 'c3', enrolled: true, followed: true, progress: 0, lastLearnTime: '-', earnedHours: 0, followTime: '2025-06-01 16:00:00' }
  ]
};

// 教师-活动关系
const TEACHER_ACTIVITY_RELATIONS = {
  t1: [
    { activityId: 'a1', status: 'ongoing', earnedHours: 9.0, completed: false },
    { activityId: 'a2', status: 'ended', earnedHours: 8.0, completed: true },
    { activityId: 'a4', status: 'ended', earnedHours: 4.0, completed: true },
    { activityId: 'a5', status: 'upcoming', earnedHours: 0, completed: false }
  ]
};

// 教师学习明细（课件级别）
const TEACHER_LEARNING_RECORDS = {
  t1: [
    { courseId: 'c1', coursewareId: 'cw1', coursewareName: '1.1 职业道德的定义与内涵', chapterName: '第一章 职业道德概述', learnTime: '2025-06-18 09:00:00', duration: 45, completed: true },
    { courseId: 'c1', coursewareId: 'cw2', coursewareName: '1.2 教师职业道德的历史演变', chapterName: '第一章 职业道德概述', learnTime: '2025-06-18 10:00:00', duration: 80, completed: true },
    { courseId: 'c1', coursewareId: 'cw3', coursewareName: '2.1 爱国守法', chapterName: '第二章 职业道德规范', learnTime: '2025-06-17 14:00:00', duration: 30, completed: true },
    { courseId: 'c1', coursewareId: 'cw4', coursewareName: '2.2 爱岗敬业', chapterName: '第二章 职业道德规范', learnTime: '2025-06-17 15:30:00', duration: 55, completed: true },
    { courseId: 'c2', coursewareId: 'cw5', coursewareName: '1.1 什么是智慧课堂', chapterName: '第一章 智慧课堂基础', learnTime: '2025-06-20 14:00:00', duration: 60, completed: true },
    { courseId: 'c2', coursewareId: 'cw6', coursewareName: '1.2 智慧课堂核心技术', chapterName: '第一章 智慧课堂基础', learnTime: '2025-06-20 15:30:00', duration: 90, completed: false }
  ]
};

// 课程评价
const COURSE_REVIEWS = {
  c1: [
    { id: 'r1', teacherId: 't2', teacherName: '李老师', avatar: '', rating: 5, content: '内容非常详实，对教师职业道德有了更深刻的理解，受益匪浅！', anonymous: false, createTime: '2025-05-22 10:30:00', likes: 12 },
    { id: 'r2', teacherId: 't3', teacherName: '王老师', avatar: '', rating: 4, content: '整体不错，案例丰富，就是有些章节略显冗长。', anonymous: true, createTime: '2025-05-20 14:15:00', likes: 5 },
    { id: 'r3', teacherId: 't4', teacherName: '赵老师', avatar: '', rating: 5, content: '非常实用的课程，推荐给所有新教师。', anonymous: false, createTime: '2025-05-18 09:00:00', likes: 8 },
    { id: 'r4', teacherId: 't5', teacherName: '刘老师', avatar: '', rating: 3, content: '内容还可以，但互动环节较少。', anonymous: true, createTime: '2025-05-15 16:45:00', likes: 2 }
  ],
  c2: [
    { id: 'r5', teacherId: 't1', teacherName: '张老师', avatar: '', rating: 5, content: '智慧课堂的设计理念非常前沿，对我的教学帮助很大。', anonymous: false, createTime: '2025-06-21 11:00:00', likes: 15 },
    { id: 'r6', teacherId: 't3', teacherName: '王老师', avatar: '', rating: 4, content: '技术讲解很清晰，就是实践案例可以再多一些。', anonymous: false, createTime: '2025-05-25 10:20:00', likes: 6 }
  ],
  c4: [
    { id: 'r7', teacherId: 't1', teacherName: '张老师', avatar: '', rating: 4, content: '心理辅导技巧很实用，特别是处理学生情绪问题的方法。', anonymous: false, createTime: '2025-06-19 16:00:00', likes: 7 },
    { id: 'r8', teacherId: 't2', teacherName: '李老师', avatar: '', rating: 5, content: '作为班主任，这门课给了我很多启发，非常推荐！', anonymous: true, createTime: '2025-05-28 09:30:00', likes: 10 }
  ]
};

// 排行榜数据
const RANKINGS = {
  learnTop5: [
    { rank: 1, courseId: 'c1', name: '新时代教师职业道德规范', value: 342 },
    { rank: 2, courseId: 'c2', name: '智慧课堂教学设计与实践', value: 256 },
    { rank: 3, courseId: 'c4', name: '学生心理健康辅导技巧', value: 189 },
    { rank: 4, courseId: 'c5', name: '高效课堂教学管理策略', value: 156 },
    { rank: 5, courseId: 'c3', name: 'AI赋能教学创新', value: 98 }
  ],
  followTop5: [
    { rank: 1, courseId: 'c2', name: '智慧课堂教学设计与实践', value: 128 },
    { rank: 2, courseId: 'c1', name: '新时代教师职业道德规范', value: 115 },
    { rank: 3, courseId: 'c4', name: '学生心理健康辅导技巧', value: 96 },
    { rank: 4, courseId: 'c3', name: 'AI赋能教学创新', value: 78 },
    { rank: 5, courseId: 'c5', name: '高效课堂教学管理策略', value: 65 }
  ],
  ratingTop5: [
    { rank: 1, courseId: 'c4', name: '学生心理健康辅导技巧', value: 4.9 },
    { rank: 2, courseId: 'c1', name: '新时代教师职业道德规范', value: 4.8 },
    { rank: 3, courseId: 'c2', name: '智慧课堂教学设计与实践', value: 4.6 },
    { rank: 4, courseId: 'c3', name: 'AI赋能教学创新', value: 4.5 },
    { rank: 5, courseId: 'c5', name: '高效课堂教学管理策略', value: 4.3 }
  ],
  teacherTop5: [
    { rank: 1, teacherId: 't2', name: '李老师', value: 156 },
    { rank: 2, teacherId: 't1', name: '张老师', value: 142 },
    { rank: 3, teacherId: 't4', name: '赵老师', value: 138 },
    { rank: 4, teacherId: 't7', name: '杨老师', value: 125 },
    { rank: 5, teacherId: 't3', name: '王老师', value: 110 }
  ]
};

// 课件拓展资料（mock）
const COURSEWARE_MATERIALS = {
  cw1: [
    { id: 'm1', name: '职业道德规范原文.pdf', url: '#', size: '1.2MB' },
    { id: 'm2', name: '案例分析集.docx', url: '#', size: '856KB' }
  ],
  cw2: [
    { id: 'm3', name: '历史演变时间轴.pdf', url: '#', size: '2.1MB' }
  ],
  cw3: [
    { id: 'm4', name: '相关法律法规汇编.pdf', url: '#', size: '3.5MB' }
  ],
  cw4: [
    { id: 'm5', name: '爱岗敬业典型事迹.pdf', url: '#', size: '1.8MB' },
    { id: 'm6', name: '学习心得模板.docx', url: '#', size: '120KB' },
    { id: 'm7', name: '课后测试题.pdf', url: '#', size: '450KB' }
  ],
  cw5: [
    { id: 'm8', name: '智慧课堂概念解析.pdf', url: '#', size: '1.5MB' }
  ],
  cw6: [
    { id: 'm9', name: '核心技术白皮书.pdf', url: '#', size: '4.2MB' },
    { id: 'm10', name: '实践操作手册.docx', url: '#', size: '2.3MB' }
  ]
};

// 活动排名 Top10
const ACTIVITY_RANKINGS = [
  { rank: 1, activityId: 'a1', name: '2025暑期教师专业能力提升培训', teacherCount: 156 },
  { rank: 2, activityId: 'a4', name: '师德师风专题学习', teacherCount: 142 },
  { rank: 3, activityId: 'a2', name: '信息化教学工具应用培训', teacherCount: 98 },
  { rank: 4, activityId: 'a3', name: '新教师入职培训（2025春）', teacherCount: 86 },
  { rank: 5, activityId: 'a5', name: 'AI赋能教育创新研讨', teacherCount: 72 },
  { rank: 6, activityId: 'a1', name: '2025暑期教师专业能力提升培训', teacherCount: 65 },
  { rank: 7, activityId: 'a4', name: '师德师风专题学习', teacherCount: 58 },
  { rank: 8, activityId: 'a2', name: '信息化教学工具应用培训', teacherCount: 45 },
  { rank: 9, activityId: 'a3', name: '新教师入职培训（2025春）', teacherCount: 38 },
  { rank: 10, activityId: 'a5', name: 'AI赋能教育创新研讨', teacherCount: 32 }
];

// 活动详情（培训目标、附件等）
const ACTIVITY_DETAILS = {
  a1: {
    goal: '通过本次暑期培训，系统提升教师的专业能力与信息化教学水平，促进教育教学质量全面提升。',
    attachments: [
      { id: 'fa1', name: '培训手册.pdf', size: '2.5MB' },
      { id: 'fa2', name: '课程安排表.xlsx', size: '180KB' }
    ]
  },
  a2: {
    goal: '掌握主流信息化教学工具的使用方法，能够熟练运用智慧课堂平台开展日常教学。',
    attachments: [
      { id: 'fa3', name: '工具清单.pdf', size: '1.2MB' }
    ]
  },
  a3: {
    goal: '帮助新入职教师快速适应岗位要求，了解学校文化、教学规范与班级管理要点。',
    attachments: [
      { id: 'fa4', name: '入职指南.docx', size: '560KB' },
      { id: 'fa5', name: '学校制度汇编.pdf', size: '3.8MB' }
    ]
  },
  a4: {
    goal: '深入学习新时代师德师风建设要求，强化教师职业道德意识，树立良好师表形象。',
    attachments: [
      { id: 'fa6', name: '师德规范.pdf', size: '890KB' }
    ]
  },
  a5: {
    goal: '探讨人工智能在教育教学中的创新应用场景，分享实践经验，推动教育数字化转型。',
    attachments: [
      { id: 'fa7', name: '研讨议题.pdf', size: '450KB' },
      { id: 'fa8', name: '案例集.docx', size: '1.1MB' }
    ]
  }
};

// 学习排名 Top10（课程学习排行榜）
const STUDY_RANKINGS = [
  { rank: 1, teacherId: 't2', name: '李老师', hours: 28.5, coursewareCount: 156 },
  { rank: 2, teacherId: 't1', name: '张老师', hours: 24.0, coursewareCount: 142 },
  { rank: 3, teacherId: 't4', name: '赵老师', hours: 22.5, coursewareCount: 138 },
  { rank: 4, teacherId: 't7', name: '杨老师', hours: 20.0, coursewareCount: 125 },
  { rank: 5, teacherId: 't3', name: '王老师', hours: 18.5, coursewareCount: 110 },
  { rank: 6, teacherId: 't5', name: '刘老师', hours: 16.0, coursewareCount: 98 },
  { rank: 7, teacherId: 't6', name: '陈老师', hours: 14.5, coursewareCount: 85 },
  { rank: 8, teacherId: 't8', name: '周老师', hours: 12.0, coursewareCount: 72 },
  { rank: 9, teacherId: 't9', name: '吴老师', hours: 10.5, coursewareCount: 60 },
  { rank: 10, teacherId: 't10', name: '郑老师', hours: 9.0, coursewareCount: 48 }
];
