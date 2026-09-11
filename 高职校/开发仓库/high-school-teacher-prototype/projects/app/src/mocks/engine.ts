import type { Method } from 'axios';
import { getMockAuth, mockAccounts, SHARED_MOCK_ACCOUNT } from './accounts';
import { cloneSeedState, type MockState } from './fixtures';

// 原型仓库始终使用本地数据，避免环境变量误配置后意外请求真实后端。
export const isMockMode = true;

const STORAGE_KEY = 'high-school-prototype-mock-state-v1';
let memoryState = cloneSeedState();

const mergeMockState = (stored: Partial<MockState>): MockState => {
  const seed = cloneSeedState();
  const storedResources = Array.isArray(stored.resources) ? stored.resources : [];
  const mergedResources = seed.resources.map((seedResource) => {
    const storedResource = storedResources.find(
      (item) => String(item.id) === String(seedResource.id)
    );
    if (!storedResource) return seedResource;
    return storedResource.categoryId
      ? { ...seedResource, ...storedResource }
      : { ...storedResource, ...seedResource };
  });
  storedResources.forEach((item) => {
    if (!mergedResources.some((resource) => String(resource.id) === String(item.id))) {
      mergedResources.push(item);
    }
  });

  return {
    ...seed,
    ...stored,
    resources: mergedResources,
    resourceTypes: Array.isArray(stored.resourceTypes) ? stored.resourceTypes : seed.resourceTypes,
    resourceFavorites: Array.isArray(stored.resourceFavorites)
      ? stored.resourceFavorites
      : seed.resourceFavorites,
    resourceReferences: Array.isArray(stored.resourceReferences)
      ? stored.resourceReferences
      : seed.resourceReferences,
    resourcePreviewLog: Array.isArray(stored.resourcePreviewLog)
      ? stored.resourcePreviewLog
      : seed.resourcePreviewLog
  };
};

type MockRequest = {
  method: Method | string;
  url: string;
  data?: any;
  responseType?: string;
};

const delay = () => {
  const duration = Number(process.env.NEXT_PUBLIC_MOCK_DELAY ?? 80);
  return new Promise((resolve) => setTimeout(resolve, Number.isFinite(duration) ? duration : 80));
};

const getState = (): MockState => {
  if (typeof window === 'undefined') return memoryState;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    return memoryState;
  }
  try {
    memoryState = mergeMockState(JSON.parse(raw) as Partial<MockState>);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
  } catch {
    memoryState = cloneSeedState();
  }
  return memoryState;
};

const saveState = (state: MockState) => {
  memoryState = state;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

export const resetMockState = () => {
  const state = cloneSeedState();
  saveState(state);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('high-school-prototype-training-state-v1');
    window.localStorage.removeItem('high-school-prototype-training-state-v2');
    window.localStorage.removeItem('high-school-prototype-training-state-v3');
    window.localStorage.removeItem('high-school-prototype-training-state-v4');
  }
  return state;
};

const asNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const page = (records: Record<string, any>[], data: Record<string, any> = {}) => {
  const current = asNumber(data.current, 1);
  const size = asNumber(data.size, 10);
  const search = String(data.searchKey ?? data.name ?? '')
    .trim()
    .toLowerCase();
  const filtered = search
    ? records.filter((item) => JSON.stringify(item).toLowerCase().includes(search))
    : records;
  const start = (current - 1) * size;
  return {
    records: filtered.slice(start, start + size),
    total: filtered.length,
    size,
    current,
    pages: Math.max(1, Math.ceil(filtered.length / size)),
    orders: [],
    searchCount: true,
    isSearchCount: true
  };
};

const findById = (records: Record<string, any>[], id: unknown) =>
  records.find((item) => String(item.id) === String(id)) ?? records[0] ?? {};

const upsert = (records: Record<string, any>[], data: Record<string, any>) => {
  const existingIndex = records.findIndex((item) => String(item.id) === String(data.id));
  if (existingIndex >= 0) {
    records[existingIndex] = {
      ...records[existingIndex],
      ...data,
      updateTime: new Date().toISOString()
    };
    return records[existingIndex];
  }
  const next = {
    ...data,
    id: data.id ?? Date.now(),
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  };
  records.unshift(next);
  return next;
};

const remove = (records: Record<string, any>[], id: unknown) => {
  const index = records.findIndex((item) => String(item.id) === String(id));
  if (index >= 0) records.splice(index, 1);
};

const teachingConfig = {
  knowledgeWeight: 40,
  skillWeight: 40,
  innovationWeight: 20,
  enableAfterClassQuiz: true,
  enableChapterTest: true,
  enableRandomQuiz: true,
  enableAIEvaluation: true,
  enableProgressTracking: true,
  enableKnowledgeAnalysis: true,
  enableAbilityGrowth: true,
  enableBehaviorAnalysis: true,
  enablePeerComparison: true
};

const courseChapters = [
  {
    id: 1,
    chapterId: 1,
    title: '模块1 · 动力电池认知',
    sortOrder: 1,
    knowledgePoints: [
      { id: 11, name: '电池化学体系', sortOrder: 1 },
      { id: 12, name: '电池安全防护', sortOrder: 2 }
    ],
    materialList: [
      {
        id: 10000,
        materialId: 10000,
        fileName: '动力电池课程导学.pptx',
        fileType: 'presentation',
        fileFormat: 'pptx',
        fileUrl: '',
        fileSize: 12845056,
        coverageStatus: 2,
        studyStatus: 2,
        studyProgress: 100
      }
    ],
    materials: [],
    hasLearned: 1,
    children: [
      {
        id: 11,
        chapterId: 11,
        title: '1.1 电池化学体系',
        sortOrder: 1,
        knowledgePoints: [
          { id: 111, name: '磷酸铁锂电池特性', sortOrder: 1 },
          { id: 112, name: '三元锂电池特性', sortOrder: 2 },
          { id: 113, name: '单体电压与容量', sortOrder: 3 }
        ],
        materialList: [
          {
            id: 10001,
            materialId: 10001,
            fileName: '电池化学体系导学.pdf',
            fileType: 'document',
            fileFormat: 'pdf',
            fileUrl: '',
            fileSize: 2845600,
            coverageStatus: 3,
            studyStatus: 2,
            studyProgress: 100
          },
          {
            id: 10002,
            materialId: 10002,
            fileName: '磷酸铁锂电池特性讲解.mp4',
            fileType: 'video',
            fileFormat: 'mp4',
            fileUrl: '/media/ai-video/sample-16x9.mp4',
            fileSize: 48652000,
            duration: 756,
            coverageStatus: 2,
            studyStatus: 1,
            studyProgress: 72
          },
          {
            id: 10003,
            materialId: 10003,
            fileName: '电芯结构与工艺图.jpg',
            fileType: 'image',
            fileFormat: 'jpg',
            fileUrl: '/media/ai-video/cover-gauss.jpg',
            fileSize: 1860000,
            coverageStatus: 2,
            studyStatus: 1,
            studyProgress: 64
          }
        ],
        materials: [],
        children: [],
        hasLearned: 1
      },
      {
        id: 12,
        chapterId: 12,
        title: '1.2 电池安全防护',
        sortOrder: 2,
        knowledgePoints: [
          { id: 121, name: '热失控触发机理', sortOrder: 1 },
          { id: 122, name: '进食防护', sortOrder: 2 },
          { id: 123, name: '吞咽风险识别', sortOrder: 3 }
        ],
        materialList: [
          {
            id: 10004,
            materialId: 10004,
            fileName: '电池安全防护要点.pptx',
            fileType: 'presentation',
            fileFormat: 'pptx',
            fileUrl: '',
            fileSize: 9690000,
            coverageStatus: 2,
            studyStatus: 1,
            studyProgress: 58
          },
          {
            id: 10005,
            materialId: 10005,
            fileName: '进食防护操作要领.mp3',
            fileType: 'audio',
            fileFormat: 'mp3',
            fileUrl: '',
            fileSize: 6820000,
            duration: 428,
            coverageStatus: 1,
            studyStatus: 0,
            studyProgress: 0
          },
          {
            id: 10006,
            materialId: 10006,
            fileName: '电池热失控互动课件.html',
            fileType: 'openmaic',
            fileFormat: 'html',
            fileUrl: '/graph-proto',
            fileSize: 3580000,
            coverageStatus: 2,
            studyStatus: 1,
            studyProgress: 46
          }
        ],
        materials: [],
        children: [],
        hasLearned: 1
      }
    ]
  },
  {
    id: 2,
    chapterId: 2,
    title: '模块2 · BMS 系统检修',
    sortOrder: 2,
    knowledgePoints: [
      { id: 21, name: 'BMS 硬件架构', sortOrder: 1 },
      { id: 22, name: '均衡策略', sortOrder: 2 }
    ],
    materialList: [
      {
        id: 20000,
        materialId: 20000,
        fileName: 'BMS 系统检修任务书.docx',
        fileType: 'document',
        fileFormat: 'docx',
        fileUrl: '',
        fileSize: 1680000,
        coverageStatus: 2,
        studyStatus: 1,
        studyProgress: 42
      }
    ],
    materials: [],
    hasLearned: 0,
    children: [
      {
        id: 21,
        chapterId: 21,
        title: '2.1 BMS 硬件架构',
        sortOrder: 1,
        knowledgePoints: [
          { id: 211, name: '采样电路', sortOrder: 1 },
          { id: 212, name: '主控单元', sortOrder: 2 },
          { id: 213, name: 'CAN 通信', sortOrder: 3 }
        ],
        materialList: [
          {
            id: 20001,
            materialId: 20001,
            fileName: 'BMS 硬件架构全景解析.mp4',
            fileType: 'video',
            fileFormat: 'mp4',
            fileUrl: '/media/ai-video/gauss-elimination.mp4',
            fileSize: 62480000,
            duration: 925,
            coverageStatus: 2,
            studyStatus: 1,
            studyProgress: 38
          },
          {
            id: 20002,
            materialId: 20002,
            fileName: 'BMS 主控单元接口图.png',
            fileType: 'image',
            fileFormat: 'png',
            fileUrl: '/media/ai-video/shot-gauss-9.jpg',
            fileSize: 2350000,
            coverageStatus: 1,
            studyStatus: 0,
            studyProgress: 0
          }
        ],
        materials: [],
        children: [],
        hasLearned: 1
      },
      {
        id: 22,
        chapterId: 22,
        title: '2.2 单体均衡策略',
        sortOrder: 2,
        knowledgePoints: [
          { id: 221, name: '被动均衡', sortOrder: 1 },
          { id: 222, name: '主动均衡', sortOrder: 2 },
          { id: 223, name: '均衡阈值标定', sortOrder: 3 }
        ],
        materialList: [
          {
            id: 20003,
            materialId: 20003,
            fileName: '被动均衡 vs 主动均衡.pptx',
            fileType: 'presentation',
            fileFormat: 'pptx',
            fileUrl: '',
            fileSize: 7860000,
            coverageStatus: 2,
            studyStatus: 1,
            studyProgress: 26
          },
          {
            id: 20004,
            materialId: 20004,
            fileName: '均衡策略数字教材.html',
            fileType: 'digital',
            fileFormat: 'html',
            fileUrl: '/graph-proto',
            fileSize: 4150000,
            coverageStatus: 2,
            studyStatus: 0,
            studyProgress: 0
          }
        ],
        materials: [],
        children: [],
        hasLearned: 0
      }
    ]
  },
  {
    id: 3,
    chapterId: 3,
    title: '模块3 · 故障诊断与实训',
    sortOrder: 3,
    knowledgePoints: [
      { id: 31, name: '故障树分析', sortOrder: 1 },
      { id: 32, name: '安全作业规范', sortOrder: 2 }
    ],
    materialList: [],
    materials: [],
    hasLearned: 0,
    children: [
      {
        id: 31,
        chapterId: 31,
        title: '3.1 高压不上电故障排查',
        sortOrder: 1,
        knowledgePoints: [
          { id: 311, name: '故障码读取', sortOrder: 1 },
          { id: 312, name: '高压互锁检测', sortOrder: 2 },
          { id: 313, name: '绝缘故障定位', sortOrder: 3 }
        ],
        materialList: [
          {
            id: 30001,
            materialId: 30001,
            fileName: '高压不上电故障诊断实训.mp4',
            fileType: 'video',
            fileFormat: 'mp4',
            fileUrl: '/media/ai-video/sample-16x9.mp4',
            fileSize: 85320000,
            duration: 1138,
            coverageStatus: 1,
            studyStatus: 0,
            studyProgress: 0
          },
          {
            id: 30002,
            materialId: 30002,
            fileName: '绝缘检测工单.pdf',
            fileType: 'document',
            fileFormat: 'pdf',
            fileUrl: '',
            fileSize: 1920000,
            coverageStatus: 1,
            studyStatus: 0,
            studyProgress: 0
          },
          {
            id: 30003,
            materialId: 30003,
            fileName: '高压互锁检测互动实训.html',
            fileType: 'openmaic',
            fileFormat: 'html',
            fileUrl: '/graph-proto',
            fileSize: 5280000,
            coverageStatus: 1,
            studyStatus: 0,
            studyProgress: 0
          }
        ],
        materials: [],
        children: [],
        hasLearned: 0
      }
    ]
  }
];

const createAvatar = (state: MockState, id = 901) => ({
  id,
  status: 1,
  coverUrl: '/imgs/ai-cover-styles/tech.png',
  courseName: state.courses[0].name,
  semesterName: state.semesters[0].name,
  startTime: '2026-09-01 00:00:00',
  endTime: '2027-01-20 23:59:59',
  studentCount: 87,
  todayInteractionCount: 36,
  classList: state.classes.map((item) => ({ classId: Number(item.id), className: item.name })),
  majorList: [{ majorId: 101, majorName: '新能源汽车技术' }],
  description: '结合任务驱动和 AI 辅导，完成动力电池系统检修学习。',
  teachingConfig,
  knowledgeGraph: JSON.stringify({ nodes: [], edges: [] }),
  chapterList: courseChapters
});

const studentCourse = (state: MockState, courseIndex = 0, avatarId = 901) => ({
  avatarId,
  courseId: state.courses[courseIndex].id,
  teachingTaskId: state.tasks[courseIndex]?.id ?? 501,
  courseType: state.courses[courseIndex].courseType,
  hours: state.courses[courseIndex].hours,
  courseName: state.courses[courseIndex].name,
  courseImage: state.courses[courseIndex].coverUrl,
  coverUrl: state.courses[courseIndex].coverUrl,
  majorName: state.courses[courseIndex].majorName,
  teacherName: courseIndex === 0 ? '李老师' : '王老师',
  studentCount: 87,
  progress: courseIndex === 0 ? 68 : 32,
  studyStatus: 1,
  startTime: '2026-09-01'
});

const menuTree = [
  {
    id: 'admin_base',
    name: '基础数据',
    children: [
      { id: 'admin_base_configuration', name: '定制配置' },
      { id: 'admin_base_organization', name: '组织架构' },
      { id: 'admin_base_roles', name: '角色权限' }
    ]
  },
  {
    id: 'admin_teaching',
    name: '教学管理',
    children: [
      { id: 'admin_teaching_majors', name: '专业管理' },
      { id: 'admin_teaching_classes', name: '班级管理' },
      { id: 'admin_teaching_courses', name: '课程管理' }
    ]
  }
];

const getResourceHotScore = (resource: Record<string, any>) =>
  asNumber(resource.previewCount, 0) +
  asNumber(resource.favoriteCount, 0) * 2 +
  asNumber(resource.downloadCount, 0) * 3 +
  asNumber(resource.referenceCount, 0) * 4;

const decoratePlazaResource = (state: MockState, resource: Record<string, any>) => {
  const category = state.resourceTypes.find(
    (item) => String(item.id) === String(resource.categoryId ?? resource.resourceTypeId)
  );
  return {
    ...resource,
    categoryId: resource.categoryId ?? resource.resourceTypeId,
    categoryName: category?.name ?? resource.categoryName ?? resource.resourceTypeName ?? '其他',
    title: resource.title ?? resource.name ?? resource.fileName,
    uploaderName: resource.uploaderName ?? resource.teacherName ?? '校本资源组',
    fileFormat: resource.fileFormat ?? resource.fileType ?? '',
    publishTime: resource.publishTime ?? resource.createTime,
    publishStatus:
      resource.publishStatus ??
      (resource.isDeleted === 2 || resource.status === 2 ? 'offline' : 'published'),
    hotScore: getResourceHotScore(resource),
    isFavorite: state.resourceFavorites.includes(Number(resource.id))
  };
};

const getVisiblePlazaResources = (state: MockState) => {
  const enabledCategoryIds = new Set(
    state.resourceTypes.filter((item) => item.status !== 0).map((item) => String(item.id))
  );
  return state.resources
    .map((item) => decoratePlazaResource(state, item))
    .filter(
      (item) =>
        item.publishStatus === 'published' &&
        Number(item.shareScope) === 2 &&
        enabledCategoryIds.has(String(item.categoryId))
    );
};

const filterPlazaResources = (
  state: MockState,
  resources: Record<string, any>[],
  data: Record<string, any>
) => {
  const keyword = String(data.searchKey ?? '')
    .trim()
    .toLowerCase();
  const result = resources.filter((resource) => {
    if (data.categoryId && String(resource.categoryId) !== String(data.categoryId)) return false;
    if (data.majorName && resource.majorName !== data.majorName) return false;
    if (data.courseName && resource.courseName !== data.courseName) return false;
    if (data.fileFormat && resource.fileFormat !== data.fileFormat) return false;
    if (data.sourceType && resource.sourceType !== data.sourceType) return false;
    if (data.uploaderName && resource.uploaderName !== data.uploaderName) return false;
    if (data.publishWindow) {
      const publishDate = new Date(String(resource.publishTime).replace(' ', 'T')).getTime();
      const cutoff = Date.now() - asNumber(data.publishWindow, 30) * 24 * 60 * 60 * 1000;
      if (Number.isFinite(publishDate) && publishDate < cutoff) return false;
    }
    if (!keyword) return true;
    return [
      resource.title,
      resource.description,
      resource.tags?.join(' '),
      resource.courseName,
      resource.majorName,
      resource.uploaderName
    ]
      .join(' ')
      .toLowerCase()
      .includes(keyword);
  });

  return result.sort((a, b) => {
    if (data.sort === 'hot') {
      return b.hotScore - a.hotScore || String(b.publishTime).localeCompare(String(a.publishTime));
    }
    return (
      String(b.publishTime).localeCompare(String(a.publishTime)) || Number(b.id) - Number(a.id)
    );
  });
};

const safeFallback = (url: string) => {
  if (/\/(page|pageList)$/.test(url)) return page([]);
  if (/\/(list|all-files|sceneLabelList|filter\/list)$/.test(url)) return [];
  if (/\/(detail|query|overview|portrait)$/.test(url)) return {};
  if (/(Count|count|Num|num)$/.test(url)) return 0;
  if (url.includes('token')) return { token: 'mock-fastgpt-token', accessToken: 'mock-token' };
  if (/\/(create|add|update|delete|save|read|readAll|publish|unpublish|remind)$/.test(url))
    return true;
  return {};
};

export async function resolveMockRequest<T = unknown>({
  method,
  url,
  data = {},
  responseType
}: MockRequest): Promise<T> {
  await delay();
  const state = getState();
  const path = url.split('?')[0];
  let result: any;

  if (
    (responseType === 'blob' || responseType === 'arraybuffer') &&
    /(download|template|export)/i.test(path)
  ) {
    result = new Blob(['Mock prototype export'], { type: 'text/plain;charset=utf-8' });
  } else if (
    path.endsWith('/uploadFile') ||
    path === '/system/file/upload' ||
    path === '/system/file/public/upload' ||
    path === '/client/courseware-file/upload'
  ) {
    const file =
      typeof FormData !== 'undefined' && data instanceof FormData ? data.get('file') : null;
    const name =
      typeof File !== 'undefined' && file instanceof File ? file.name : '原型演示文件.pdf';
    result = {
      id: Date.now(),
      name,
      fileName: name,
      url: '/imgs/app/fileUploadPlaceholder.png',
      fileUrl: '/imgs/app/fileUploadPlaceholder.png',
      previewUrl: '/imgs/app/fileUploadPlaceholder.png',
      objectKey: `mock/${name}`
    };
  } else if (path === '/system/file/decompression') {
    result = [];
  } else if (path === '/client/auth/university/login' || path === '/client/auth/studentLogin') {
    result = getMockAuth(String(data.account ?? ''), String(data.password ?? ''));
  } else if (path === '/client/auth/token') {
    result = mockAccounts[SHARED_MOCK_ACCOUNT];
  } else if (path === '/client/auth/getUserInfo') {
    result = mockAccounts[SHARED_MOCK_ACCOUNT];
  } else if (path === '/client/auth/refresh') {
    result = { accessToken: 'mock-refreshed-token' };
  } else if (path === '/client/auth/getCaptcha') {
    result = { ticket: 'mock-captcha', backgroundImage: '', sliderImage: '', y: 0 };
  } else if (path === '/client/auth/logout') {
    result = true;
  } else if (path === '/client/courseFastgpt/token') {
    result = { token: 'mock-fastgpt-token' };
  } else if (path === '/client/tenant/detail') {
    if (String(method).toUpperCase() === 'POST' && data.name) {
      state.tenant = { ...state.tenant, ...data };
      saveState(state);
    }
    result = state.tenant;
  } else if (path === '/client/tenant/update') {
    state.tenant = { ...state.tenant, ...data };
    saveState(state);
    result = true;
  } else if (path === '/client/dept/list') {
    result = state.departments;
  } else if (path.startsWith('/client/dept/')) {
    if (path.endsWith('/delete')) remove(state.departments, data.id);
    else if (!path.endsWith('/sort')) upsert(state.departments, data);
    saveState(state);
    result = true;
  } else if (path === '/client/role/page') {
    result = page(state.roles, data);
  } else if (path === '/client/role/list') {
    result = state.roles;
  } else if (path === '/client/role/detail') {
    result = {
      ...findById(state.roles, data.id),
      menuIds: 'admin_base,admin_teaching',
      roleDataAuthority: {
        isAll: 0,
        classAuthority: 1,
        subjectAuthority: 1,
        deptAuthority: 1,
        allFunctionPerms: 0
      }
    };
  } else if (path === '/client/tenant/authority/list') {
    result = menuTree;
  } else if (path.startsWith('/client/role/')) {
    if (path.endsWith('/delete')) remove(state.roles, data.id);
    else if (path.endsWith('/updateStatus')) {
      const item = findById(state.roles, data.id);
      item.status = item.status === 1 ? 0 : 1;
    } else if (!path.includes('/authority/')) result = upsert(state.roles, data);
    saveState(state);
    result ??= true;
  } else if (path === '/client/tenantMajor/page') {
    result = page(state.majors, data);
  } else if (path === '/client/tenantMajor/list') {
    result = state.majors.map(({ id, name }) => ({ id, name }));
  } else if (path === '/client/tenantMajor/listCategories') {
    result = [
      { id: 46, code: '46', name: '装备制造大类', majorCount: 2, sortOrder: 1 },
      { id: 51, code: '51', name: '电子与信息大类', majorCount: 1, sortOrder: 2 }
    ];
  } else if (path === '/client/tenantMajor/detail') {
    result = findById(state.majors, data.id);
  } else if (path.startsWith('/client/tenantMajor/')) {
    if (path.endsWith('/delete')) remove(state.majors, data.id);
    else upsert(state.majors, data);
    saveState(state);
    result = {};
  } else if (path === '/client/grade/pageList') {
    result = page(state.grades, data);
  } else if (path === '/client/grade/list') {
    result = state.grades;
  } else if (path === '/client/grade/detail') {
    result = findById(state.grades, data.id);
  } else if (path.startsWith('/client/grade/')) {
    if (path.endsWith('/delete')) remove(state.grades, data.id);
    else upsert(state.grades, data);
    saveState(state);
    result = null;
  } else if (path === '/client/clazz/pageList') {
    result = page(state.classes, data);
  } else if (path === '/client/clazz/list') {
    result = state.classes;
  } else if (path === '/client/clazz/detail') {
    result = findById(state.classes, data.id);
  } else if (path.startsWith('/client/clazz/')) {
    if (path.endsWith('/delete')) remove(state.classes, data.id);
    else upsert(state.classes, data);
    saveState(state);
    result = null;
  } else if (path === '/client/semester/pageList') {
    result = page(state.semesters, data);
  } else if (path === '/client/semester/list') {
    result = state.semesters;
  } else if (path === '/client/semester/detail') {
    result = findById(state.semesters, data.id);
  } else if (path.startsWith('/client/semester/')) {
    if (path.endsWith('/delete')) remove(state.semesters, data.id);
    else upsert(state.semesters, data);
    saveState(state);
    result = null;
  } else if (path === '/client/student/pageList') {
    result = page(state.students, data);
  } else if (path === '/client/student/detail') {
    result = findById(state.students, data.id ?? 3001);
  } else if (path.startsWith('/client/student/') && !path.includes('/aiTeacher/')) {
    if (path.endsWith('/delete')) remove(state.students, data.id);
    else if (path.endsWith('/create') || path.endsWith('/update')) upsert(state.students, data);
    saveState(state);
    result = path.endsWith('/import') ? { valid: 3, msg: '导入成功', errMsgs: [] } : true;
  } else if (path === '/client/teacher/pageList') {
    result = page(state.teachers, data);
  } else if (path === '/client/teacher/list') {
    result = state.teachers;
  } else if (path === '/client/teacher/detail') {
    result = findById(state.teachers, data.id ?? 1001);
  } else if (path.startsWith('/client/teacher/')) {
    if (path.endsWith('/delete')) remove(state.teachers, data.id);
    else if (path.endsWith('/create') || path.endsWith('/update')) upsert(state.teachers, data);
    saveState(state);
    result = path.endsWith('/import') ? { valid: 2, msg: '导入成功', errMsgs: [] } : true;
  } else if (path === '/client/course/page') {
    result = page(state.courses, data);
  } else if (path === '/client/course/list') {
    result = state.courses;
  } else if (path === '/client/course/detail') {
    result = findById(state.courses, data.id);
  } else if (path === '/client/course/generateCode') {
    result = { code: `KC-MOCK-${String(Date.now()).slice(-4)}` };
  } else if (path === '/client/course/checkCode') {
    result = true;
  } else if (path.startsWith('/client/course/')) {
    if (path.endsWith('/delete')) remove(state.courses, data.id);
    else if (path.endsWith('/toggleStatus')) {
      const item = findById(state.courses, data.id);
      item.status = item.status === 1 ? 0 : 1;
    } else upsert(state.courses, data);
    saveState(state);
    result = {};
  } else if (path === '/client/teachingTask/page') {
    result = page(state.tasks, data);
  } else if (path === '/client/teachingTask/detail') {
    result = findById(state.tasks, data.id);
  } else if (path.startsWith('/client/teachingTask/')) {
    if (path.endsWith('/delete')) remove(state.tasks, data.id);
    else upsert(state.tasks, data);
    saveState(state);
    result = {};
  } else if (path === '/client/tenant/news/page') {
    result = page(state.news, data);
  } else if (path === '/client/tenant/news/detail') {
    result = findById(state.news, data.id);
  } else if (path.startsWith('/client/tenant/news/')) {
    if (path.endsWith('/delete')) remove(state.news, data.id);
    else if (!path.endsWith('/incrementReadCount')) upsert(state.news, data);
    saveState(state);
    result = null;
  } else if (path.includes('/teaching-resource/page')) {
    result = page(state.resources, data);
  } else if (path.includes('/teaching-resource/detail')) {
    result = findById(state.resources, data.id);
  } else if (path.includes('/teaching-resource/resourceType/list')) {
    const searchKey = String(data.searchKey ?? '').trim();
    result = state.resourceTypes
      .filter((item) =>
        data.status === undefined ? true : Number(item.status) === Number(data.status)
      )
      .filter((item) => (searchKey ? String(item.name).includes(searchKey) : true))
      .sort((a, b) => asNumber(a.sortOrder, 0) - asNumber(b.sortOrder, 0));
  } else if (path.includes('/teaching-resource/resourceType/add')) {
    const nextId = Math.max(0, ...state.resourceTypes.map((item) => asNumber(item.id, 0))) + 1;
    state.resourceTypes.push({
      id: nextId,
      code: data.code ?? 100 + nextId,
      name: data.name,
      status: data.status ?? 1,
      sortOrder: data.sortOrder ?? state.resourceTypes.length + 1,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    });
    saveState(state);
    result = true;
  } else if (path.includes('/teaching-resource/resourceType/update')) {
    upsert(state.resourceTypes, data);
    saveState(state);
    result = true;
  } else if (path.includes('/teaching-resource/resourceType/delete')) {
    const referencedCount = state.resources.filter(
      (item) => String(item.categoryId ?? item.resourceTypeId) === String(data.id)
    ).length;
    if (referencedCount > 0) {
      result = { success: false, referencedCount };
    } else {
      remove(state.resourceTypes, data.id);
      saveState(state);
      result = { success: true, referencedCount: 0 };
    }
  } else if (path.includes('/teaching-resource/teacherNames')) {
    result = state.teachers.map((item) => ({ id: Number(item.id), name: item.name }));
  } else if (path.includes('/teaching-resource/majorNames')) {
    result = state.majors.map((item) => ({ id: item.id, name: item.name }));
  } else if (path.includes('/teaching-resource/courseNames')) {
    result = state.courses.map((item) => ({ id: item.id, name: item.name }));
  } else if (path.includes('/teaching-resource/drafts')) {
    result = state.resources.filter((item) => item.status === 0);
  } else if (path.includes('/teaching-resource/preview')) {
    result = { fileUrl: '', fileName: findById(state.resources, data.id).fileName };
  } else if (path.includes('/teaching-resource/')) {
    if (path.endsWith('/delete') || path.endsWith('/batchDelete'))
      remove(state.resources, data.id ?? data.ids?.[0]);
    else if (path.endsWith('/upload') || path.endsWith('/update') || path.endsWith('/saveDraft'))
      upsert(state.resources, data);
    saveState(state);
    result = true;
  } else if (path === '/teacher/resource-plaza/home') {
    const visibleResources = getVisiblePlazaResources(state);
    const categories = state.resourceTypes
      .filter((item) => item.status !== 0)
      .sort((a, b) => asNumber(a.sortOrder, 0) - asNumber(b.sortOrder, 0))
      .map((category) => ({
        ...category,
        resourceCount: visibleResources.filter(
          (resource) => String(resource.categoryId) === String(category.id)
        ).length
      }));
    result = {
      categories,
      rankings: categories.map((category) => {
        const categoryResources = visibleResources.filter(
          (resource) => String(resource.categoryId) === String(category.id)
        );
        return {
          category,
          hotResources: filterPlazaResources(state, categoryResources, { sort: 'hot' }).slice(
            0,
            10
          ),
          latestResources: filterPlazaResources(state, categoryResources, { sort: 'latest' }).slice(
            0,
            6
          )
        };
      }),
      stats: {
        resourceCount: visibleResources.length,
        categoryCount: categories.length,
        newThisWeek: visibleResources.filter((item) =>
          String(item.publishTime).startsWith('2026-09-')
        ).length,
        referenceCount: state.resourceReferences.filter((item) => item.status !== 'unavailable')
          .length
      }
    };
  } else if (path === '/teacher/resource-plaza/categories') {
    result = state.resourceTypes
      .filter((item) => item.status !== 0)
      .sort((a, b) => asNumber(a.sortOrder, 0) - asNumber(b.sortOrder, 0));
  } else if (path === '/teacher/resource-plaza/page') {
    const filtered = filterPlazaResources(state, getVisiblePlazaResources(state), data);
    result = page(filtered, { current: data.current, size: data.size });
  } else if (path === '/teacher/resource-plaza/favorites/page') {
    const favoriteResources = getVisiblePlazaResources(state).filter((item) =>
      state.resourceFavorites.includes(Number(item.id))
    );
    const filtered = filterPlazaResources(state, favoriteResources, data);
    result = page(filtered, { current: data.current, size: data.size });
  } else if (path === '/teacher/resource-plaza/detail') {
    const resource = state.resources.find((item) => String(item.id) === String(data.id));
    result = resource ? decoratePlazaResource(state, resource) : null;
  } else if (path === '/teacher/resource-plaza/related') {
    const current = state.resources.find((item) => String(item.id) === String(data.id));
    result = current
      ? getVisiblePlazaResources(state)
          .filter(
            (item) =>
              item.id !== current.id &&
              (item.categoryId === current.categoryId || item.courseName === current.courseName)
          )
          .sort((a, b) => b.hotScore - a.hotScore)
          .slice(0, 4)
      : [];
  } else if (path === '/teacher/resource-plaza/preview') {
    const resource = state.resources.find((item) => String(item.id) === String(data.id));
    if (!resource || resource.publishStatus === 'offline' || Number(resource.shareScope) !== 2) {
      result = { success: false, reason: '资源已下架或无权访问' };
    } else {
      const previewKey = `${new Date().toISOString().slice(0, 10)}:${resource.id}`;
      if (!state.resourcePreviewLog.includes(previewKey)) {
        state.resourcePreviewLog.push(previewKey);
        resource.previewCount = asNumber(resource.previewCount, 0) + 1;
        saveState(state);
      }
      result = { success: true, resource: decoratePlazaResource(state, resource) };
    }
  } else if (path === '/teacher/resource-plaza/favorite/toggle') {
    const resourceId = asNumber(data.id, 0);
    const existingIndex = state.resourceFavorites.indexOf(resourceId);
    const resource = state.resources.find((item) => Number(item.id) === resourceId);
    if (existingIndex >= 0) {
      state.resourceFavorites.splice(existingIndex, 1);
      if (resource) resource.favoriteCount = Math.max(0, asNumber(resource.favoriteCount, 0) - 1);
    } else {
      state.resourceFavorites.push(resourceId);
      if (resource) resource.favoriteCount = asNumber(resource.favoriteCount, 0) + 1;
    }
    saveState(state);
    result = { isFavorite: existingIndex < 0 };
  } else if (path === '/teacher/resource-plaza/download') {
    const resource = state.resources.find((item) => String(item.id) === String(data.id));
    if (!resource || resource.publishStatus === 'offline') {
      result = { success: false, reason: '资源已下架' };
    } else {
      resource.downloadCount = asNumber(resource.downloadCount, 0) + 1;
      saveState(state);
      result = { success: true, fileName: resource.fileName, fileUrl: resource.fileUrl ?? '' };
    }
  } else if (path === '/teacher/resource-plaza/reference/create') {
    const resource = state.resources.find((item) => String(item.id) === String(data.resourceId));
    if (!resource || resource.publishStatus === 'offline') {
      result = { success: false, reason: '资源已下架，无法新增引用' };
    } else {
      const existing = state.resourceReferences.find(
        (item) =>
          String(item.resourceId) === String(data.resourceId) &&
          item.targetType === data.targetType &&
          String(item.targetId) === String(data.targetId) &&
          String(item.locationId) === String(data.locationId)
      );
      if (existing) {
        existing.updateTime = new Date().toISOString();
        result = { success: true, reference: existing, duplicated: true };
      } else {
        const reference = {
          ...data,
          id: Date.now(),
          resourceVersion: resource.version ?? 1,
          status: data.targetType === 'avatar' ? 'parsing' : 'ready',
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        };
        state.resourceReferences.unshift(reference);
        resource.referenceCount = asNumber(resource.referenceCount, 0) + 1;
        result = { success: true, reference, duplicated: false };
      }
      saveState(state);
    }
  } else if (path === '/teacher/resource-plaza/references/page') {
    const records = state.resourceReferences
      .filter((item) => (data.targetType ? item.targetType === data.targetType : true))
      .map((reference) => {
        const source = state.resources.find(
          (resource) => String(resource.id) === String(reference.resourceId)
        );
        const resource = source ? decoratePlazaResource(state, source) : null;
        return {
          ...reference,
          resource,
          hasUpgrade: Boolean(
            resource && asNumber(resource.version, 1) > asNumber(reference.resourceVersion, 1)
          ),
          status: resource?.publishStatus === 'offline' ? 'unavailable' : reference.status
        };
      })
      .sort((a, b) => String(b.updateTime).localeCompare(String(a.updateTime)));
    result = page(records, { current: data.current, size: data.size });
  } else if (path === '/teacher/resource-plaza/reference/upgrade') {
    const reference = state.resourceReferences.find((item) => String(item.id) === String(data.id));
    const resource = reference
      ? state.resources.find((item) => String(item.id) === String(reference.resourceId))
      : null;
    if (!reference || !resource || resource.publishStatus === 'offline') {
      result = { success: false, reason: '当前资源不可升级' };
    } else {
      reference.resourceVersion = resource.version ?? 1;
      reference.status = reference.targetType === 'avatar' ? 'parsing' : 'ready';
      reference.updateTime = new Date().toISOString();
      saveState(state);
      result = { success: true, reference };
    }
  } else if (
    path === '/teacher/resource/my/page' ||
    path === '/teacher/resource/all/page' ||
    path === '/teacher/resource/my/drafts'
  ) {
    result = page(
      path.includes('/my/')
        ? state.resources.filter((item) => item.teacherId === 1001)
        : state.resources,
      data
    );
  } else if (path.endsWith('/resourceType/list')) {
    result = state.resourceTypes
      .filter((item) => item.status !== 0)
      .sort((a, b) => asNumber(a.sortOrder, 0) - asNumber(b.sortOrder, 0));
  } else if (path.endsWith('/majorNames')) {
    result = state.majors.map((item) => ({ id: item.id, name: item.name }));
  } else if (path.endsWith('/courseNames')) {
    result = state.courses.map((item) => ({ id: item.id, name: item.name }));
  } else if (path.endsWith('/teacherNames')) {
    result = state.teachers.map((item) => ({ id: Number(item.id), name: item.name }));
  } else if (path.startsWith('/teacher/resource/')) {
    if (path.endsWith('/detail')) result = findById(state.resources, data.id);
    else if (path.endsWith('/preview'))
      result = { fileUrl: '', fileName: findById(state.resources, data.id).fileName };
    else if (path.endsWith('/delete') || path.endsWith('/batchDelete')) {
      remove(state.resources, data.id ?? data.ids?.[0]);
      saveState(state);
      result = true;
    } else result = true;
  } else if (path === '/client/aiTeacher/stats') {
    result = { courseCount: 2, aiAvatarCount: 2, todayInteractionCount: 36 };
  } else if (
    path === '/client/aiTeacher/suggestions' ||
    path === '/client/student/aiTeacher/suggestions'
  ) {
    result = [
      {
        id: 101,
        suggestionType: 1,
        title: '新能源汽车产教融合实训周启动',
        content: '本周将开放动力电池检测与整车故障诊断联合实训任务。',
        relatedCourseName: state.courses[0].name,
        relatedCourseId: 401,
        publishTime: '2026-09-09 09:10:00',
        isRead: 0
      },
      {
        id: 1,
        suggestionType: 2,
        title: '建议补充 BMS 均衡策略实训',
        content: '学生在均衡触发条件上错误率较高，建议增加一个数据流对比任务。',
        relatedCourseName: state.courses[0].name,
        relatedCourseId: 401,
        publishTime: '2026-09-09 08:20:00',
        isRead: 0
      }
    ];
  } else if (path === '/client/aiTeacher/todos') {
    result = {
      totalCount: 2,
      list: [
        {
          studentId: 3002,
          studentName: '周雨桐',
          className: '新能源汽车 2501 班',
          avatarId: 901,
          avatarName: state.courses[0].name,
          courseName: state.courses[0].name,
          progress: 35,
          lagDays: 3,
          isReminded: 0,
          studyHours: 5.5,
          lastStudyTimeDesc: '3 天前',
          lagReasonList: ['章节测试未完成']
        }
      ]
    };
  } else if (path === '/client/aiTeacher/avatars/teachingTaskCoursesCurrent') {
    result = [
      {
        semesterId: 301,
        semesterName: state.semesters[0].name,
        courses: state.tasks.map((item) => ({
          teachingTaskId: item.id,
          tenantCourseId: item.tenantCourseId,
          courseName: item.courseName,
          courseHours: item.courseHours,
          courseType: item.courseType,
          clazzList: item.clazzList
        }))
      }
    ];
  } else if (path === '/client/aiTeacher/avatars/list') {
    result = [
      createAvatar(state),
      {
        ...createAvatar(state, 902),
        courseName: state.courses[1].name,
        coverUrl: '/imgs/ai-cover-styles/modern.png',
        status: 0
      }
    ];
  } else if (path === '/client/aiTeacher/avatars/detail') {
    result = createAvatar(state, asNumber(data.id, 901));
  } else if (path === '/client/aiTeacher/avatars/create') {
    result = createAvatar(state, Date.now());
  } else if (path === '/client/aiTeacher/avatars/update') {
    result = { success: true, needsConfirm: false };
  } else if (path === '/client/aiTeacher/avatars/students/page') {
    result = page(
      state.students.map((item, index) => ({
        studentId: Number(item.id),
        studentName: item.name,
        studentCode: item.code,
        classId: item.clazzId,
        className: item.clazzName,
        progress: [68, 35, 92][index] ?? 50,
        studyHours: [18.5, 5.5, 26][index] ?? 10,
        lastLearnTime: '2026-09-08 16:20:00',
        status: index === 1 ? 2 : 1,
        lagDays: index === 1 ? 3 : 0
      })),
      data
    );
  } else if (path === '/client/aiTeacher/avatars/students/stats') {
    result = {
      totalCount: 87,
      notStartedCount: 8,
      learningCount: 61,
      completedCount: 18,
      needAttentionCount: 6,
      averageProgress: 64
    };
  } else if (path === '/client/aiTeacher/teachingContent') {
    result = {
      courseCount: state.tasks.length,
      courses: state.tasks.map((task, index) => ({
        teachingTaskId: task.id,
        tenantCourseId: task.tenantCourseId,
        courseName: task.courseName,
        categoryName:
          state.courses.find((course) => course.id === task.tenantCourseId)?.majorName ??
          '装备制造大类',
        courseHours: task.courseHours,
        latestAvatarId: index === 0 ? 901 : index === 1 ? 902 : null
      }))
    };
  } else if (path === '/client/aiTeacher/courseOverview') {
    const task = findById(state.tasks, data.teachingTaskId);
    result = {
      teachingTaskId: task.id,
      courseName: task.courseName,
      statusLabel: '正常',
      totalStudentCount: 87,
      studyingCount: 61,
      normalProgressCount: 55,
      laggingCount: 6,
      averageProgress: 64
    };
  } else if (path === '/client/aiTeacher/avatars/students/conversation/list') {
    const seedConversations = cloneSeedState().conversations;
    result =
      Array.isArray(state.conversations) && state.conversations.length >= seedConversations.length
        ? state.conversations
        : seedConversations;
  } else if (path === '/client/courseware-file/maic-task/page') {
    result = page(
      [
        {
          id: 1,
          taskName: '动力电池检修课件',
          status: 2,
          progress: 100,
          createTime: '2026-09-08 10:00:00'
        }
      ],
      data
    );
  } else if (
    path === '/client/courseware-file/all-files' ||
    path === '/client/courseware-file/resource/page'
  ) {
    result = page(state.resources, data);
  } else if (path === '/notification/page') {
    result = page(
      [
        {
          id: 1,
          title: '课程学习提醒',
          content: '《动力电池管理系统检修》本周任务即将截止。',
          readStatus: 0,
          typeCode: 'COURSE_STUDY',
          notificationTime: '2026-09-09 08:30:00',
          createTime: '2026-09-09 08:30:00'
        },
        {
          id: 2,
          title: 'AI 学习建议已生成',
          content: '已更新你的个性化学习建议。',
          readStatus: 1,
          typeCode: 'AI_REPLY',
          notificationTime: '2026-09-08 17:10:00',
          createTime: '2026-09-08 17:10:00'
        }
      ],
      data
    );
  } else if (path === '/notification/unReadNum') {
    result = 1;
  } else if (path.startsWith('/notification/')) {
    result = true;
  } else if (path === '/client/student/aiTeacher/stats') {
    result = { aiTeacherCount: 2, interactionCount: 48, totalStudyHours: 31.5 };
  } else if (path === '/client/student/aiTeacher/courses') {
    result = [studentCourse(state, 0, 901), studentCourse(state, 1, 902)];
  } else if (path === '/client/student/aiTeacher/courseDetail') {
    const card = studentCourse(state, 0, asNumber(data.avatarId, 901));
    result = {
      ...card,
      description: state.courses[0].description,
      chapters: courseChapters,
      startTime: '2026-09-01',
      endTime: '2027-01-20',
      status: 1,
      datasetId: 'mock-dataset',
      teachingConfig: JSON.stringify(teachingConfig),
      courseStructure: JSON.stringify({ courseName: card.courseName, chapters: courseChapters })
    };
  } else if (path === '/client/student/aiTeacher/overview') {
    result = {
      studentName: '陈思远',
      studentCode: '20250101',
      majorName: '新能源汽车技术',
      majorId: 101,
      studyingCourseCount: 2,
      completedCourseCount: 1,
      totalStudyHours: 31.5,
      portraitUpdatedToday: true,
      radarDimensions: JSON.stringify([
        { name: '理论理解', value: 78 },
        { name: '实践操作', value: 72 },
        { name: '故障诊断', value: 66 },
        { name: '创新应用', value: 61 }
      ]),
      courseProgressList: [
        { courseId: 401, courseName: state.courses[0].name, avatarId: 901, progress: 68 },
        { courseId: 402, courseName: state.courses[1].name, avatarId: 902, progress: 32 }
      ]
    };
  } else if (path === '/client/student/aiTeacher/portrait') {
    result = {
      portraitJson: JSON.stringify({
        summary: '学习态度积极，实操任务完成度较高，建议加强故障诊断路径的系统性。',
        strengths: ['知识点完成率高', '实训操作规范'],
        weaknesses: ['CAN 通信故障分析仍需巩固'],
        suggestions: ['完成 BMS 数据流对比练习']
      }),
      portraitUpdatedToday: true
    };
  } else if (path === '/client/student/aiTeacher/preference/query') {
    result = {
      id: 1,
      teachingStyle: 2,
      explanationDepth: 2,
      interactionFrequency: 2,
      explanationMethods: 'case,step',
      coursewareTypes: 'video,ppt',
      feedbackStyle: 'encouraging',
      learningPace: 2
    };
  } else if (path === '/client/student/aiTeacher/conversation/page') {
    result = page(state.conversations, data);
  } else if (path === '/client/student/aiTeacher/conversation/detail') {
    result = findById(state.conversations, data.conversationId);
  } else if (path === '/client/student/aiTeacher/conversation/save') {
    const item = upsert(state.conversations, {
      id: data.conversationId,
      avatarId: data.avatarId,
      title: '新的 AI 学习对话',
      messageCount: data.messages?.length ?? 0,
      messages: data.messages ?? [],
      lastMessageTime: new Date().toISOString()
    });
    saveState(state);
    result = item.id;
  } else if (path === '/client/courseSquare/page') {
    result = page(
      state.courses.map((item, index) => ({
        ...studentCourse(state, index % state.courses.length, 901 + index),
        id: item.id,
        coverUrl: item.coverUrl,
        description: item.description
      })),
      data
    );
  } else if (path === '/client/agent/detailByAppointedType') {
    result = {
      id: 1,
      name: data.appointedType === 1 ? '思维导图助手' : '课程 AI 教师',
      avatarUrl: '/imgs/avatar/defaultAiIcon.png',
      intro: '用于原型交互演示的本地 AI 智能体',
      status: 1,
      finalAppId: 'mock-agent',
      appointedType: data.appointedType,
      endpointType: '1'
    };
  } else if (path === '/client/tenant/scene/sceneLabelList') {
    result = [
      {
        id: 1,
        name: '教学工具',
        labels: [
          { id: 11, name: '备课' },
          { id: 12, name: '评价' }
        ]
      },
      { id: 2, name: '学习辅导', labels: [{ id: 21, name: '答疑' }] }
    ];
  } else if (path === '/client/app/center/filter/list') {
    result = [
      {
        id: 1,
        name: '教案生成助手',
        avatarUrl: '/imgs/avatar/BrightBlueAvatar.svg',
        intro: '根据课程标准生成结构化教案',
        status: 1,
        finalAppId: 'mock-lesson-agent',
        useUserCount: 326
      },
      {
        id: 2,
        name: '实训评价助手',
        avatarUrl: '/imgs/avatar/OrangeAvatar.svg',
        intro: '生成实训操作评价与改进建议',
        status: 1,
        finalAppId: 'mock-eval-agent',
        useUserCount: 218
      }
    ];
  } else if (path === '/client/agentChat/page') {
    result = page(state.conversations, data);
  } else if (path === '/client/agentChat/detail') {
    result = findById(state.conversations, data.id);
  } else if (path.startsWith('/client/agentChat/')) {
    result = true;
  } else if (path === '/client/ai-base/agent/chat') {
    result = {
      code: 200,
      success: true,
      data: {
        content: '这是 Mock AI 助手的演示回复。你可以继续体验课程、资源和学情相关交互。'
      },
      msg: 'success'
    };
  } else if (path === '/client/ai-base/conversations') {
    result = {
      data: {
        items: state.conversations.map((item, index) => ({
          id: Number(item.id ?? index + 1),
          chat_id: String(item.chatId ?? item.id ?? index + 1),
          title: item.title ?? 'AI 教学对话',
          agent_name: '课程 AI 助手',
          status: 'active',
          created_at: item.createTime ?? '2026-09-08 10:00:00',
          updated_at: item.lastMessageTime ?? '2026-09-09 09:00:00',
          last_message_at: item.lastMessageTime ?? '2026-09-09 09:00:00'
        }))
      }
    };
  } else if (path.startsWith('/client/ai-base/conversations/')) {
    const chatId = path.split('/').pop() ?? 'mock-chat';
    result = {
      code: 200,
      success: true,
      data: {
        id: 1,
        chat_id: chatId,
        title: '动力电池课程答疑',
        messages: [
          {
            id: 1,
            role: 'human',
            content: '请解释 BMS 的核心作用。',
            display_content: '请解释 BMS 的核心作用。',
            message_type: 'text',
            created_at: '2026-09-09 09:00:00'
          },
          {
            id: 2,
            role: 'ai',
            content: 'BMS 负责监测、保护、均衡与估算电池状态，是动力电池安全运行的核心。',
            display_content: 'BMS 负责监测、保护、均衡与估算电池状态，是动力电池安全运行的核心。',
            message_type: 'text',
            created_at: '2026-09-09 09:00:10'
          }
        ]
      },
      msg: 'success'
    };
  } else if (path === '/api/v1/teacher/courses') {
    result = {
      data: state.courses.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.majorName,
        hours: item.hours,
        teachingTaskId: state.tasks.find((task) => task.tenantCourseId === item.id)?.id
      }))
    };
  } else if (path === '/client/maicOutlineConfig/create') {
    result = {
      code: 200,
      success: true,
      data: {
        id: `mock-outline-${Date.now()}`,
        taskId: `mock-task-${Date.now()}`,
        url: '',
        name: '动力电池检修课程大纲'
      },
      msg: 'success'
    };
  } else if (path === '/client/maicOutlineConfig/detail') {
    result = {
      code: 200,
      success: true,
      data: {
        taskId: String(data.taskId ?? 'mock-task'),
        status: 2,
        content: JSON.stringify({ courseName: state.courses[0].name, chapters: courseChapters })
      },
      msg: 'success'
    };
  } else if (path === '/client/digital-courseware/create') {
    result = { code: 200, success: true, data: true, msg: 'success' };
  } else if (path.includes('/upload') || path === '/system/file/public/upload') {
    const file =
      typeof FormData !== 'undefined' && data instanceof FormData ? data.get('file') : null;
    const name =
      typeof File !== 'undefined' && file instanceof File ? file.name : '原型演示文件.pdf';
    result = {
      id: Date.now(),
      name,
      fileName: name,
      url: '/imgs/app/fileUploadPlaceholder.png',
      fileUrl: '/imgs/app/fileUploadPlaceholder.png',
      previewUrl: '/imgs/app/fileUploadPlaceholder.png',
      objectKey: `mock/${name}`
    };
  } else if (responseType === 'blob' || responseType === 'arraybuffer') {
    result = new Blob(['Mock prototype export'], { type: 'text/plain;charset=utf-8' });
  } else {
    console.warn(
      `[Mock API] 未精细建模，已返回本地安全默认值: ${String(method).toUpperCase()} ${path}`
    );
    result = safeFallback(path);
  }

  return structuredClone(result) as T;
}
