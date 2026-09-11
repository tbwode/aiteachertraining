export type MockState = {
  tenant: Record<string, any>;
  departments: Record<string, any>[];
  roles: Record<string, any>[];
  majors: Record<string, any>[];
  grades: Record<string, any>[];
  classes: Record<string, any>[];
  semesters: Record<string, any>[];
  students: Record<string, any>[];
  teachers: Record<string, any>[];
  courses: Record<string, any>[];
  tasks: Record<string, any>[];
  news: Record<string, any>[];
  resources: Record<string, any>[];
  resourceTypes: Record<string, any>[];
  resourceFavorites: number[];
  resourceReferences: Record<string, any>[];
  resourcePreviewLog: string[];
  conversations: Record<string, any>[];
};

const now = '2026-09-09 09:30:00';

const resourceTypeSeeds = [
  { id: 1, code: 101, name: '课件', status: 1, sortOrder: 1 },
  { id: 2, code: 102, name: '教案', status: 1, sortOrder: 2 },
  { id: 3, code: 103, name: '实训资源', status: 1, sortOrder: 3 },
  { id: 4, code: 104, name: '题库试卷', status: 1, sortOrder: 4 },
  { id: 5, code: 105, name: '音视频', status: 1, sortOrder: 5 },
  { id: 6, code: 106, name: '互动资源', status: 1, sortOrder: 6 }
].map((item) => ({ ...item, createTime: now, updateTime: now }));

const resourceSeedDefinitions: Array<Record<string, any>> = [
  {
    id: 701,
    title: '动力电池 BMS 实训指导书',
    fileName: 'BMS实训指导书.pdf',
    categoryId: 3,
    fileFormat: 'pdf',
    fileSize: 4280000,
    courseName: '动力电池管理系统检修',
    description: '覆盖电池包上电检查、BMS 数据采集、故障码分析与安全操作的项目化实训指导书。',
    tags: ['BMS', '实训工单', '故障诊断']
  },
  {
    id: 702,
    title: '热管理系统故障案例集',
    fileName: '热管理故障案例.pptx',
    categoryId: 1,
    fileFormat: 'pptx',
    fileSize: 12900000,
    courseName: '新能源汽车故障诊断',
    description: '精选水泵、电子风扇、冷却回路与温度传感器典型故障，适合案例研讨课。',
    tags: ['热管理', '案例教学', '故障诊断']
  },
  {
    id: 703,
    title: '动力电池认知互动课件',
    fileName: '动力电池认知互动课件.html',
    categoryId: 6,
    fileFormat: 'html',
    fileSize: 6850000,
    courseName: '新能源汽车电池及管理系统检修',
    description: '支持点击拆解电池包结构，配套知识点导览、随堂问题与安全操作提示。',
    tags: ['互动课件', '电池结构', '课堂互动']
  },
  {
    id: 704,
    title: 'BMS 故障诊断微课',
    fileName: 'BMS故障诊断微课.mp4',
    categoryId: 5,
    fileFormat: 'mp4',
    fileSize: 86400000,
    courseName: '动力电池管理系统检修',
    description: '12 分钟拆解“数据异常—故障定位—复核验证”标准诊断流程。',
    tags: ['BMS', '微课', '诊断流程']
  },
  {
    id: 705,
    title: '新能源汽车高压安全操作教案',
    fileName: '高压安全操作教案.docx',
    categoryId: 2,
    fileFormat: 'docx',
    fileSize: 2360000,
    courseName: '新能源汽车维护与保养',
    description: '包含教学目标、课前任务、风险辨识、教学过程与评价量规。',
    tags: ['高压安全', '教案', '课程思政']
  },
  {
    id: 706,
    title: '动力电池管理章节题库',
    fileName: '动力电池章节题库.pdf',
    categoryId: 4,
    fileFormat: 'pdf',
    fileSize: 3180000,
    courseName: '动力电池管理系统检修',
    description: '按电池认知、BMS 数据、均衡策略和故障诊断四个单元组织的分层题库。',
    tags: ['题库', '随堂诊断', 'BMS']
  },
  {
    id: 707,
    title: '高压互锁故障检修课件',
    fileName: '高压互锁故障检修.pptx',
    categoryId: 1,
    fileFormat: 'pptx',
    fileSize: 9800000,
    courseName: '新能源汽车故障诊断',
    description: '从高压互锁原理、线路读图到故障测量，形成完整检修路径。',
    tags: ['高压互锁', '线路读图', '检修流程']
  },
  {
    id: 708,
    title: 'SOC 估算标定实训任务书',
    fileName: 'SOC估算标定任务书.pdf',
    categoryId: 3,
    fileFormat: 'pdf',
    fileSize: 5420000,
    courseName: '动力电池管理系统检修',
    description: '引导学生完成数据准备、容量学习、误差分析与结果复核。',
    tags: ['SOC', '参数标定', '实训任务']
  },
  {
    id: 709,
    title: '电池热失控应急处置教案',
    fileName: '电池热失控应急处置教案.docx',
    categoryId: 2,
    fileFormat: 'docx',
    fileSize: 1940000,
    courseName: '新能源汽车安全与防护',
    description: '基于真实场景的热失控分级响应教案，含课堂演练和复盘表。',
    tags: ['热失控', '应急处置', '场景教学']
  },
  {
    id: 710,
    title: '单体电芯一致性诊断试卷',
    fileName: '电芯一致性诊断试卷.pdf',
    categoryId: 4,
    fileFormat: 'pdf',
    fileSize: 2760000,
    courseName: '动力电池管理系统检修',
    description: '覆盖电压极差、内阻离散度、容量衰减与均衡效果判定的综合试卷。',
    tags: ['试卷', '电芯一致性', '综合评价']
  },
  {
    id: 711,
    title: '绝缘检测规范讲解',
    fileName: '绝缘检测规范讲解.mp4',
    categoryId: 5,
    fileFormat: 'mp4',
    fileSize: 113200000,
    courseName: '新能源汽车高压系统检修',
    description: '完整演示绝缘表连接、测量条件判定与异常结果排查。',
    tags: ['绝缘检测', '规范操作', '示范视频']
  },
  {
    id: 712,
    title: '动力电池结构数字教材',
    fileName: '动力电池结构数字教材.html',
    categoryId: 6,
    fileFormat: 'html',
    fileSize: 12800000,
    courseName: '新能源汽车电池及管理系统检修',
    description: '集成三维爆炸图、知识点卡片、语音讲解和章节自测的数字教材。',
    tags: ['数字教材', '三维结构', '交互学习']
  },
  {
    id: 713,
    title: '新能源汽车充电系统故障分析课件',
    fileName: '充电系统故障分析.pptx',
    categoryId: 1,
    fileFormat: 'pptx',
    fileSize: 11700000,
    courseName: '新能源汽车故障诊断',
    description: '聚焦交直流充电控制、充电通信和车端上电条件的案例化课件。',
    tags: ['充电系统', '通信故障', '案例分析']
  },
  {
    id: 714,
    title: '项目化教学单元教案模板',
    fileName: '项目化教学单元教案模板.docx',
    categoryId: 2,
    fileFormat: 'docx',
    fileSize: 1680000,
    courseName: '汽车电气系统检修',
    description: '可复用的项目化教案模板，包含学情、任务、教学活动、评价与课后反思。',
    tags: ['项目化教学', '教案模板', '评价量规']
  },
  {
    id: 715,
    title: '电池包拆装与检测实训工单',
    fileName: '电池包拆装实训工单.pdf',
    categoryId: 3,
    fileFormat: 'pdf',
    fileSize: 4920000,
    courseName: '新能源汽车维护与保养',
    description: '按岗位操作标准组织的实训工单，包含安全确认、工具选择和质量检查点。',
    tags: ['电池包拆装', '岗位标准', '实训工单']
  },
  {
    id: 716,
    title: 'BMS 参数标定练习题',
    fileName: 'BMS参数标定练习题.pdf',
    categoryId: 4,
    fileFormat: 'pdf',
    fileSize: 2210000,
    courseName: '动力电池管理系统检修',
    description: '围绕电压、温度、SOC 与均衡参数设置的计算题和情境题。',
    tags: ['参数标定', '练习题', '分层作业']
  },
  {
    id: 717,
    title: '高压断电与验电操作示范',
    fileName: '高压断电与验电示范.mp4',
    categoryId: 5,
    fileFormat: 'mp4',
    fileSize: 94600000,
    courseName: '新能源汽车高压系统检修',
    description: '按企业规范展示个人防护、断电、等待、验电和设置警示区的全流程。',
    tags: ['高压安全', '操作示范', '企业规范']
  },
  {
    id: 718,
    title: '热管理系统虚拟仿真实训',
    fileName: '热管理虚拟仿真实训.html',
    categoryId: 6,
    fileFormat: 'html',
    fileSize: 18800000,
    courseName: '新能源汽车故障诊断',
    description: '支持故障设置、数据流观察、诊断步骤记录和操作结果评分。',
    tags: ['虚拟仿真', '热管理', '互动实训']
  },
  {
    id: 719,
    title: '新能源汽车故障诊断旧版讲义',
    fileName: '故障诊断旧版讲义.pdf',
    categoryId: 1,
    fileFormat: 'pdf',
    fileSize: 7200000,
    courseName: '新能源汽车故障诊断',
    description: '已由 2026 版校本讲义替代，仅用于展示已引用资源下架状态。',
    tags: ['故障诊断', '旧版资源'],
    publishStatus: 'offline',
    shareScope: 2
  },
  {
    id: 720,
    title: '教师个人备课草稿',
    fileName: '个人备课草稿.docx',
    categoryId: 2,
    fileFormat: 'docx',
    fileSize: 950000,
    courseName: '动力电池管理系统检修',
    description: '个人未共享资源，仅用于验证广场权限过滤。',
    tags: ['备课草稿'],
    shareScope: 1
  }
];

const plazaResources = resourceSeedDefinitions.map((item, index) => {
  const category = resourceTypeSeeds.find((type) => type.id === item.categoryId)!;
  const publishStatus = item.publishStatus ?? 'published';
  const shareScope = item.shareScope ?? 2;
  const uploaderNames = ['李明远', '王建国', '陈静', '赵敏', '孙磊', '校本资源组'];
  const sourceTypes = ['teacher', 'school', 'ai'];
  const day = String(10 - (index % 9)).padStart(2, '0');
  const previewCount = 1680 - index * 61;
  const favoriteCount = 286 - index * 8;
  const downloadCount = 420 - index * 11;
  const referenceCount = 132 - index * 4;

  return {
    ...item,
    name: item.title,
    categoryName: category.name,
    resourceTypeId: category.id,
    resourceTypeName: category.name,
    resourceType: category.id,
    majorId: 101,
    majorName: '新能源汽车技术',
    courseId: 401 + (index % 3),
    teacherId: 1001 + (index % 5),
    teacherName: uploaderNames[index % uploaderNames.length],
    uploaderName: uploaderNames[index % uploaderNames.length],
    ownerType: index % 4 === 0 ? 2 : 1,
    sourceType: sourceTypes[index % sourceTypes.length],
    publishStatus,
    status: publishStatus === 'published' ? 1 : 2,
    isDeleted: publishStatus === 'published' ? 1 : 2,
    shareScope,
    fileType: item.fileFormat,
    fileUrl: '',
    fileKey: `mock/resource-plaza/${item.id}/${item.fileName}`,
    coverUrl: '',
    version: item.id === 701 || item.id === 702 ? 2 : 1,
    previewCount,
    favoriteCount,
    downloadCount,
    referenceCount,
    hotScore: previewCount + favoriteCount * 2 + downloadCount * 3 + referenceCount * 4,
    publishTime: `2026-09-${day} ${String(9 + (index % 7)).padStart(2, '0')}:30:00`,
    createTime: `2026-09-${day} 09:00:00`,
    updateTime: `2026-09-${day} 16:20:00`,
    duration: item.fileFormat === 'mp4' ? `${10 + (index % 9)}:${String(18 + index).slice(-2)}` : ''
  };
});

export const seedMockState: MockState = {
  tenant: {
    id: '1',
    name: '南通中专',
    fullName: '江苏省南通中等专业学校',
    domain: 'prototype.local',
    industry: 1,
    avatarUrl: '/imgs/app/logo.svg',
    backgroundImgUrl: '/imgs/teacher/login/login_bg.png',
    sidebarImgUrl: '/imgs/teacher/login/login_bg.png'
  },
  departments: [
    {
      id: '1',
      name: '教务处',
      parentId: '0',
      parentKey: '0',
      deptKey: 'jw',
      sort: 1,
      tenantId: '1',
      deptUserNum: 8,
      createTime: now,
      updateTime: now,
      isDeleted: 0,
      type: 1,
      tmbId: null
    },
    {
      id: '2',
      name: '汽车工程系',
      parentId: '0',
      parentKey: '0',
      deptKey: 'qc',
      sort: 2,
      tenantId: '1',
      deptUserNum: 26,
      createTime: now,
      updateTime: now,
      isDeleted: 0,
      type: 1,
      tmbId: null
    },
    {
      id: '3',
      name: '新能源汽车教研组',
      parentId: '2',
      parentKey: 'qc',
      deptKey: 'qc-xny',
      sort: 1,
      tenantId: '1',
      deptUserNum: 9,
      createTime: now,
      updateTime: now,
      isDeleted: 0,
      type: 2,
      tmbId: null
    }
  ],
  roles: [
    {
      id: '1',
      name: '学校管理员',
      info: '管理学校基础数据与权限',
      source: 1,
      status: 1,
      tenantId: '1',
      type: 1,
      isAllAuthority: 1,
      createTime: now,
      updateTime: now
    },
    {
      id: '2',
      name: '普通教师',
      info: '课程教学与 AI 工具',
      source: 1,
      status: 1,
      tenantId: '1',
      type: 2,
      isAllAuthority: 0,
      createTime: now,
      updateTime: now
    },
    {
      id: '3',
      name: '班主任',
      info: '班级管理与学情查看',
      source: 2,
      status: 1,
      tenantId: '1',
      type: 2,
      isAllAuthority: 0,
      createTime: now,
      updateTime: now
    }
  ],
  majors: [
    {
      id: 101,
      code: 'ZY-001',
      name: '新能源汽车技术',
      categoryId: 46,
      categoryName: '装备制造大类',
      duration: 3,
      description: '面向新能源汽车检测与维修岗位群',
      status: 1,
      sortOrder: 1,
      classCount: 4,
      updateTime: now
    },
    {
      id: 102,
      code: 'ZY-002',
      name: '智能网联汽车技术',
      categoryId: 46,
      categoryName: '装备制造大类',
      duration: 3,
      description: '面向智能驾驶与车联网应用',
      status: 1,
      sortOrder: 2,
      classCount: 2,
      updateTime: now
    },
    {
      id: 103,
      code: 'ZY-003',
      name: '计算机应用技术',
      categoryId: 51,
      categoryName: '电子与信息大类',
      duration: 3,
      description: '软件开发与智能应用',
      status: 1,
      sortOrder: 3,
      classCount: 3,
      updateTime: now
    }
  ],
  grades: [
    {
      id: '2024',
      name: '2024级',
      description: '二年级',
      sort: 1,
      clazzCount: 5,
      studentCount: 186,
      tenantId: 1,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    },
    {
      id: '2025',
      name: '2025级',
      description: '一年级',
      sort: 2,
      clazzCount: 6,
      studentCount: 224,
      tenantId: 1,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    }
  ],
  classes: [
    {
      id: '201',
      code: 'XNY-2401',
      name: '新能源汽车 2401 班',
      majorId: 101,
      gradeId: 2024,
      teacherId: 1001,
      status: 1,
      categoryId: 46,
      majorName: '新能源汽车技术',
      gradeName: '2024级',
      teacherName: '李老师',
      studentCount: 42,
      tenantId: 1,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    },
    {
      id: '202',
      code: 'XNY-2501',
      name: '新能源汽车 2501 班',
      majorId: 101,
      gradeId: 2025,
      teacherId: 1002,
      status: 1,
      categoryId: 46,
      majorName: '新能源汽车技术',
      gradeName: '2025级',
      teacherName: '王老师',
      studentCount: 45,
      tenantId: 1,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    }
  ],
  semesters: [
    {
      id: '301',
      name: '2026-2027学年第一学期',
      year: '2026-2027',
      type: 1,
      startDate: '2026-09-01',
      endDate: '2027-01-20',
      isCurrent: 1,
      tenantId: 1,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    },
    {
      id: '302',
      name: '2025-2026学年第二学期',
      year: '2025-2026',
      type: 2,
      startDate: '2026-02-20',
      endDate: '2026-07-10',
      isCurrent: 0,
      tenantId: 1,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    }
  ],
  students: [
    {
      id: '3001',
      code: '20250101',
      name: '陈思远',
      gender: 1,
      phone: '13800138001',
      idCard: '',
      majorId: 101,
      majorName: '新能源汽车技术',
      gradeId: 2025,
      clazzId: 202,
      clazzName: '新能源汽车 2501 班',
      enrollmentDate: '2025-09-01',
      status: 1,
      tenantId: 1,
      tmbId: 3001,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    },
    {
      id: '3002',
      code: '20250102',
      name: '周雨桐',
      gender: 2,
      phone: '13800138002',
      idCard: '',
      majorId: 101,
      majorName: '新能源汽车技术',
      gradeId: 2025,
      clazzId: 202,
      clazzName: '新能源汽车 2501 班',
      enrollmentDate: '2025-09-01',
      status: 1,
      tenantId: 1,
      tmbId: 3002,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    },
    {
      id: '3003',
      code: '20240108',
      name: '赵子涵',
      gender: 1,
      phone: '13800138003',
      idCard: '',
      majorId: 101,
      majorName: '新能源汽车技术',
      gradeId: 2024,
      clazzId: 201,
      clazzName: '新能源汽车 2401 班',
      enrollmentDate: '2024-09-01',
      status: 1,
      tenantId: 1,
      tmbId: 3003,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    }
  ],
  teachers: [
    {
      id: '1001',
      code: 'T2024001',
      name: '李老师',
      gender: 1,
      phone: '15815501001',
      loginAccount: '15815501001',
      email: 'li@example.edu.cn',
      professionalTitle: 2,
      professionalTitleName: '讲师',
      status: 1,
      accountStatus: 1,
      deptIds: [2, 3],
      deptNames: ['汽车工程系', '新能源汽车教研组'],
      roleIds: [2, 3],
      roleNames: ['普通教师', '班主任'],
      tenantId: 1,
      tmbId: 1001,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    },
    {
      id: '1002',
      code: 'T2023006',
      name: '王老师',
      gender: 2,
      phone: '15815501002',
      loginAccount: '15815501002',
      email: 'wang@example.edu.cn',
      professionalTitle: 3,
      professionalTitleName: '副教授',
      status: 1,
      accountStatus: 1,
      deptIds: [2],
      deptNames: ['汽车工程系'],
      roleIds: [2],
      roleNames: ['普通教师'],
      tenantId: 1,
      tmbId: 1002,
      createTime: now,
      updateTime: now,
      isDeleted: 0
    }
  ],
  courses: [
    {
      id: 401,
      code: 'KC-XNY-001',
      name: '动力电池管理系统检修',
      majorId: 101,
      majorName: '新能源汽车技术',
      categoryId: 46,
      hours: 64,
      credit: 4,
      type: 1,
      courseType: 1,
      status: 1,
      description: '掌握动力电池、BMS 与热管理系统检修技能',
      coverUrl: '/imgs/ai-cover-styles/tech.png',
      updateTime: now
    },
    {
      id: 402,
      code: 'KC-XNY-002',
      name: '新能源汽车故障诊断',
      majorId: 101,
      majorName: '新能源汽车技术',
      categoryId: 46,
      hours: 48,
      credit: 3,
      type: 1,
      courseType: 1,
      status: 1,
      description: '培养综合故障分析与诊断能力',
      coverUrl: '/imgs/ai-cover-styles/modern.png',
      updateTime: now
    },
    {
      id: 403,
      code: 'KC-AI-001',
      name: 'AI 应用基础',
      majorId: 103,
      majorName: '计算机应用技术',
      categoryId: 51,
      hours: 32,
      credit: 2,
      type: 2,
      courseType: 2,
      status: 1,
      description: '人工智能通识与实践',
      coverUrl: '/imgs/ai-cover-styles/minimal.png',
      updateTime: now
    }
  ],
  tasks: [
    {
      id: 501,
      tenantCourseId: 401,
      courseId: 401,
      courseName: '动力电池管理系统检修',
      semesterId: 301,
      semesterName: '2026-2027学年第一学期',
      teacherId: 1001,
      teacherName: '李老师',
      courseHours: 64,
      courseType: 1,
      status: 1,
      clazzIds: [201, 202],
      clazzList: [
        { clazzId: 201, clazzName: '新能源汽车 2401 班', clazzCode: 'XNY-2401' },
        { clazzId: 202, clazzName: '新能源汽车 2501 班', clazzCode: 'XNY-2501' }
      ],
      createTime: now,
      updateTime: now
    },
    {
      id: 502,
      tenantCourseId: 402,
      courseId: 402,
      courseName: '新能源汽车故障诊断',
      semesterId: 301,
      semesterName: '2026-2027学年第一学期',
      teacherId: 1002,
      teacherName: '王老师',
      courseHours: 48,
      courseType: 1,
      status: 1,
      clazzIds: [201],
      clazzList: [{ clazzId: 201, clazzName: '新能源汽车 2401 班', clazzCode: 'XNY-2401' }],
      createTime: now,
      updateTime: now
    }
  ],
  news: [
    {
      id: 601,
      title: '学校启动 2026 年 AI 教学创新实践月',
      summary: '聚焦专业建设、课程改革与学生成长。',
      content: '<p>欢迎各位师生参与 AI 教学创新实践月。</p>',
      type: 1,
      level: 1,
      status: 1,
      isTop: 1,
      publisher: '教务处',
      publishTime: '2026-09-08 10:00:00',
      createTime: now,
      updateTime: now,
      readCount: 328
    },
    {
      id: 602,
      title: '新能源汽车实训中心开放通知',
      summary: '实训中心开放时间与安全要求。',
      content: '<p>请按预约时段前往实训中心。</p>',
      type: 2,
      level: 2,
      status: 1,
      isTop: 0,
      publisher: '汽车工程系',
      publishTime: '2026-09-07 14:30:00',
      createTime: now,
      updateTime: now,
      readCount: 189
    }
  ],
  resources: plazaResources,
  resourceTypes: resourceTypeSeeds,
  resourceFavorites: [701, 704, 712],
  resourcePreviewLog: [],
  resourceReferences: [
    {
      id: 9001,
      resourceId: 701,
      resourceVersion: 1,
      targetType: 'course',
      targetId: 401,
      targetName: '动力电池管理系统检修',
      locationId: 'chapter-2-1',
      locationName: '模块2·BMS 系统检修 / 2.1 BMS 硬件架构',
      status: 'ready',
      createTime: '2026-09-09 10:20:00',
      updateTime: '2026-09-09 10:20:00'
    },
    {
      id: 9002,
      resourceId: 704,
      resourceVersion: 1,
      targetType: 'avatar',
      targetId: 901,
      targetName: '动力电池管理系统检修',
      locationId: 'knowledge-diagnosis',
      locationName: '故障诊断知识库',
      status: 'parsing',
      createTime: '2026-09-10 08:42:00',
      updateTime: '2026-09-10 08:42:00'
    },
    {
      id: 9003,
      resourceId: 719,
      resourceVersion: 1,
      targetType: 'course',
      targetId: 402,
      targetName: '新能源汽车故障诊断',
      locationId: 'chapter-1-2',
      locationName: '项目一·故障诊断基础 / 课前资料',
      status: 'unavailable',
      createTime: '2026-08-26 15:10:00',
      updateTime: '2026-09-08 09:00:00'
    }
  ],
  conversations: [
    {
      id: 801,
      avatarId: 901,
      title: 'BMS 过压保护原理',
      messageCount: 6,
      lastMessageTime: '2026-09-10 09:26:00',
      createTime: '2026-09-10 09:18:00',
      messages: [
        {
          role: 'user',
          content: 'BMS 过压保护如何触发？',
          createTime: '09:18'
        },
        {
          role: 'ai',
          content: '当单体电压连续超过标定阈值时，BMS 会依次告警、限制功率并在必要时断开主回路。',
          createTime: '09:19'
        },
        {
          role: 'user',
          content: '如果只有一个单体瞬时超阈值，也会立即断开主回路吗？',
          createTime: '09:22'
        },
        {
          role: 'ai',
          content:
            '不一定。控制策略通常会同时校验持续时间、超限幅度与采样有效性，先进入预警或限功率状态，只有达到标定的严重等级才执行断电。',
          createTime: '09:23'
        },
        {
          role: 'user',
          content: '诊断时怎么区分真实过压和采样线束异常？',
          createTime: '09:25'
        },
        {
          role: 'ai',
          content:
            '可按“历史曲线—相邻单体对比—万用表实测—采样线束压降”的顺序复核，避免只根据一个瞬时值下结论。',
          createTime: '09:26'
        }
      ]
    },
    {
      id: 802,
      avatarId: 901,
      title: '单体一致性与均衡策略',
      messageCount: 4,
      lastMessageTime: '2026-09-09 16:42:00',
      createTime: '2026-09-09 16:31:00',
      messages: [
        {
          role: 'user',
          content: '单体压差多大时应该启动均衡？',
          createTime: '16:31'
        },
        {
          role: 'ai',
          content:
            '均衡触发不只看压差，还要结合 SOC 区间、电池温度、充电状态和持续时间。实训中应以该车型的标定阈值为准。',
          createTime: '16:33'
        },
        {
          role: 'user',
          content: '被动均衡和主动均衡在数据流上怎么区分？',
          createTime: '16:39'
        },
        {
          role: 'ai',
          content:
            '被动均衡通常表现为高电压单体通过电阻放电，主动均衡则会在单体之间转移能量。可结合均衡电流方向、温度变化与单体电压曲线判断。',
          createTime: '16:42'
        }
      ]
    },
    {
      id: 803,
      avatarId: 901,
      title: 'SOC 估算偏差与校准',
      messageCount: 4,
      lastMessageTime: '2026-09-08 20:18:00',
      createTime: '2026-09-08 20:05:00',
      messages: [
        {
          role: 'user',
          content: 'SOC 估算值和仪表显示不一致时应该先检查什么？',
          createTime: '20:05'
        },
        {
          role: 'ai',
          content:
            '先确认诊断仪读取的数据源与时间戳，再检查总压、电流零点和温度信号是否可信，最后核对 BMS 是否处于容量修正或重新标定过程。',
          createTime: '20:08'
        },
        {
          role: 'user',
          content: '完成一次满充满放就能立即消除偏差吗？',
          createTime: '20:15'
        },
        {
          role: 'ai',
          content:
            '不能保证。容量学习需要满足完整的工况、温度和静置条件，且偏差还可能来自电流传感器零漂或电池老化。',
          createTime: '20:18'
        }
      ]
    }
  ]
};

export const cloneSeedState = (): MockState => JSON.parse(JSON.stringify(seedMockState));
