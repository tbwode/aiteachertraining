/**
 * 教学资源管理 API 类型定义
 */

/**
 * 资源类型
 */
export enum EResourceType {
  /** 未知 */
  UNKNOWN = 0,
  /** 课件 */
  COURSEWARE = 1,
  /** 教案 */
  LESSON_PLAN = 2,
  /** 作业 */
  HOMEWORK = 3,
  /** 试卷 */
  EXAM_PAPER = 4,
  /** 视频 */
  VIDEO = 5,
  /** 其他 */
  OTHER = 6
}

/**
 * 归属层级（ownerType）
 */
export enum EOwnerType {
  /** 学校 */
  SCHOOL = 1,
  /** 个人 */
  PERSONAL = 2
}

/**
 * 资源状态
 */
export enum EResourceStatus {
  /** 草稿 */
  DRAFT = 0,
  /** 已上架 */
  PUBLISHED = 1,
  /** 已下架 */
  UNPUBLISHED = 2
}

/**
 * 共享范围
 */
export enum EShareScope {
  /** 个人 */
  PERSONAL = 1,
  /** 全校 */
  SCHOOL = 2,
  /** 部门 */
  DEPARTMENT = 3
}

/**
 * 资源项（对应后端 ResourceVO）
 */
export interface ResourceVO {
  /** 资源 ID */
  id: number;
  /** 文件名称 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 文件格式：pdf/doc/ppt/video/zip/html/link */
  fileFormat: string;
  /** 文件格式名称 */
  fileFormatName: string;
  /** 资源类型枚举值 */
  resourceType: number;
  /** 资源类型名称 */
  resourceTypeName: string;
  /** 上传人 ID */
  uploaderId: number;
  /** 上传人姓名 */
  uploaderName: string;
  /** 归属类型：1-学校，2-个人 */
  ownerType: number;
  /** 归属类型名称 */
  ownerTypeName: string;
  /** 状态枚举值 */
  status: number;
  /** 状态名称 */
  statusName: string;
  /** 删除状态：0-草稿, 1-已上架, 2-已下架 */
  isDeleted: number;
  /** 共享范围：1-个人，2-全校，3-部门 */
  shareScope: number;
  /** 共享范围名称 */
  shareScopeName: string;
  /** 查看次数 */
  previewCount: number;
  /** 下载次数 */
  downloadCount: number;
  /** 创建时间 */
  createTime: string;
  /** 专业名称 */
  majorName: string;
  /** 课程名称 */
  courseName: string;
  /** 部门名称 */
  deptName: string;
  /** 专业ID */
  majorId?: number;
  /** 课程ID */
  courseId?: number;
  /** 资源描述 */
  description?: string;
  /** 文件存储 URL */
  fileUrl?: string;
  /** 文件云存储 Key */
  fileKey?: string;
  /** 阿里 videoId */
  videoId?: string;
  /** 文件详情 JSON */
  fileJson?: string;
  /** 文件 MIME 类型 */
  fileType?: string;
  /** 文件格式类型（数字） */
  formatType?: number;
}

/**
 * 资源分页查询参数（对应后端 TeachingResourceQueryRequest）
 */
export interface ResourcePageRequest {
  /** 当前页，默认 1 */
  current?: number;
  /** 每页条数，默认 10 */
  size?: number;
  /** 专业 ID */
  majorId?: number;
  /** 课程 ID */
  courseId?: number;
  /** 上传人 ID */
  uploaderId?: number;
  /** 归属层级：1-个人，2-学校 */
  ownerType?: EOwnerType;
  /** 状态：0-草稿，1-已上架，2-已下架 */
  status?: EResourceStatus;
  /** 资源类型：1-课件，2-教案，3-作业，4-试卷，5-视频，6-其他 */
  resourceType?: EResourceType;
  /** 上传日期起，格式 yyyy-MM-dd */
  dateStart?: string;
  /** 上传日期止，格式 yyyy-MM-dd */
  dateEnd?: string;
  /** 来源：1-校本资源库，2-AI创作库 */
  sourceType?: number;
  /** 文件格式类型：1-PDF, 2-Word, 3-PPT, 4-视频, 5-压缩包, 6-HTML, 7-链接 */
  formatType?: number;
  /** 搜索关键词（资源名称） */
  searchKey?: string;
}

/**
 * 资源分页数据
 */
export interface ResourcePageData {
  records: ResourceVO[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/**
 * 批量更新状态参数
 */
export interface BatchUpdateStatusRequest {
  ids: number[];
  status: EResourceStatus;
}

/**
 * 批量删除参数
 */
export interface BatchDeleteRequest {
  ids: number[];
}

/**
 * 上传资源参数（对应后端 ResourceUploadRequest）
 */
export interface ResourceUploadRequest {
  /** 文件云存储 Key */
  fileKey?: string;
  /** 原始文件名（必填） */
  fileName: string;
  /** 文件存储 URL */
  fileUrl?: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 文件格式：pdf/doc/ppt/video/zip/html/link */
  fileFormat?: string;
  /** 文件 MIME 类型 */
  fileType?: string;
  /** 文件格式类型（数字） */
  formatType?: number;
  /** 文件详情 JSON */
  fileJson?: string;
  /** 阿里 videoId */
  videoId?: string;
  /** 视频/音频时长（秒） */
  duration?: number;
  /** 封面/缩略图 URL */
  coverUrl?: string;
  /** 外部链接地址 */
  linkUrl?: string;
  /** 资源类型：1-课件，2-教案，3-作业，4-试卷，5-视频，6-其他 */
  resourceType?: EResourceType;
  /** 状态：0-保存草稿，1-直接发布 */
  status?: EResourceStatus;
  /** 共享范围：1-个人，2-全校，3-部门 */
  shareScope?: EShareScope;
  /** 关联专业 ID */
  majorId?: number;
  /** 关联课程 ID */
  courseId?: number;
  /** 当 shareScope=3 时必传 */
  shareDeptIds?: number[];
  /** 来源：1-教师上传，2-学校资源库，3-AI 资源库 */
  sourceType?: number;
  /** 归属：1-学校，2-个人 */
  ownerType?: EOwnerType;
  /** 资源描述 */
  description?: string;
  /** 标签（逗号分隔） */
  tags?: string;
  /** 草稿/资源 ID，编辑时传入 */
  id?: number;
}

/**
 * 资源详情查询参数
 */
export interface ResourceDetailRequest {
  /** 资源ID */
  id: number;
}

/**
 * 资源预览返回数据
 */
export interface ResourcePreviewData {
  /** 资源ID */
  id: number;
  /** 文件名 */
  fileName: string;
  /** 文件URL */
  fileUrl: string;
  /** 文件格式 */
  fileFormat: string;
  /** 阿里videoId */
  videoId?: string;
}

/**
 * 资源类型请求参数
 */
export interface ResourceTypeRequest {
  /** 资源类型ID，新增不传 */
  id?: number;
  /** 类型编码，不填则系统自动生成 */
  code?: number;
  /** 资源类型名称 */
  name: string;
  /** 状态：0-停用，1-启用，默认1 */
  status?: number;
  /** 排序，默认0 */
  sortOrder?: number;
}

/**
 * 资源类型查询参数
 */
export interface ResourceTypeQueryRequest {
  /** 名称关键字 */
  searchKey?: string;
  /** 状态：0-停用，1-启用 */
  status?: number;
}

/**
 * 删除资源类型返回数据
 */
export interface DeleteResourceTypeData {
  /** 是否删除成功 */
  success: boolean;
  /** 关联资源数量 */
  referencedCount: number;
}

/**
 * 资源类型 VO
 */
export interface ResourceTypeVO {
  /** 资源类型ID */
  id: number;
  /** 资源类型编码 */
  code: number;
  /** 资源类型名称 */
  name: string;
  /** 状态：0-停用，1-启用 */
  status: number;
  /** 排序 */
  sortOrder: number;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/**
 * 草稿箱资源项
 */
export interface DraftItem {
  /** 资源ID */
  id: number;
  /** 创建时间 */
  createTime: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 专业ID */
  majorId?: number;
  /** 课程ID */
  courseId?: number;
  /** 共享范围：1-个人，2-全校，3-部门 */
  shareScope?: number;
  /** 资源类型：1-课件，2-教案，3-作业，4-试卷，5-视频，6-其他 */
  resourceType?: number;
  /** 资源描述 */
  description?: string;
}

/**
 * 教师名称查询参数
 */
export interface TeacherNameRequest {
  /** 教师姓名关键字 */
  searchKey?: string;
}

/**
 * 教师名称 VO
 */
export interface TeacherNameVO {
  /** 教师 ID */
  id: number;
  /** 教师姓名 */
  name: string;
}

/**
 * 专业名称查询参数
 */
export interface TenantMajorNameRequest {
  /** 专业名关键字 */
  searchKey?: string;
}

/**
 * 专业名称 VO
 */
export interface TenantMajorNameVO {
  /** 专业 ID */
  id: string;
  /** 专业名称 */
  name: string;
}

/**
 * 课程名称查询参数
 */
export interface TenantCourseNameRequest {
  /** 专业 ID */
  majorId?: number;
  /** 课程名关键字 */
  searchKey?: string;
}

/**
 * 课程名称 VO
 */
export interface TenantCourseNameVO {
  /** 课程 ID */
  id: number;
  /** 课程名称 */
  name: string;
}

/**
 * 单文件上传返回数据（POST /client/teaching-resource/uploadFile）
 */
export interface ResourceFileUploadData {
  /** 文件 ID */
  id: string;
  /** 原始文件名 */
  fileName: string;
  /** 文件访问 URL */
  fileUrl: string;
  /** 文件云存储 Key */
  fileKey: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 文件详情 JSON */
  fileJson?: string;
  /** 文件类型扩展名 */
  fileType?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 更新资源参数
 */
export interface ResourceUpdateRequest {
  /** 资源ID */
  id: number;
  /** 文件名 */
  fileName?: string;
  /** 专业ID */
  majorId?: number;
  /** 课程ID */
  courseId?: number;
  /** 共享范围：1-个人，2-全校，3-部门 */
  shareScope?: number;
  /** 资源类型：1-课件，2-教案，3-作业，4-试卷，5-视频，6-其他 */
  resourceType?: number;
  /** 资源描述 */
  description?: string;
  /** 文件云存储 Key */
  fileKey?: string;
  /** 文件存储 URL */
  fileUrl?: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 文件格式：pdf/doc/ppt/video/zip/html/link */
  fileFormat?: string;
  /** 文件 MIME 类型 */
  fileType?: string;
  /** 文件格式类型（数字） */
  formatType?: number;
  /** 文件详情 JSON */
  fileJson?: string;
  /** 阿里 videoId */
  videoId?: string;
  /** 视频/音频时长（秒） */
  duration?: number;
  /** 封面/缩略图 URL */
  coverUrl?: string;
  /** 状态：0-草稿，1-已上架，2-已下架 */
  status?: number;
  /** 标签（逗号分隔） */
  tags?: string;
}
