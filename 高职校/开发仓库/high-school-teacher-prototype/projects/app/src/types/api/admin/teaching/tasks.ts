/**
 * 教学管理-教学任务管理 API 类型定义
 */

/**
 * 教学任务新增/修改请求参数
 */
export type TeachingTaskRequest = {
  /** 任务ID，编辑时必填 */
  id?: number;
  /** 任务名称 */
  name: string;
  /** 教师ID */
  teacherId: number;
  /** 租户课程ID */
  tenantCourseId: number;
  /**
   * 班级ID列表
   * 必修时必填（支持多选），选修时传空数组或 null
   */
  classIds?: number[] | null;
  /** 学期ID */
  semesterId: number;
  /** 课程类型：1-必修，2-选修 */
  courseType: 1 | 2;
  /** 状态：0-未开始，1-进行中，2-已完成 */
  status?: 0 | 1 | 2;
};

/**
 * 教学任务ID请求参数
 */
export type TeachingTaskIdRequest = {
  /** 任务ID */
  id: number;
};

/**
 * 分页查询教学任务列表请求参数
 */
export type TeachingTaskQueryRequest = {
  /** 当前页 */
  current?: number;
  /** 每页的数量 */
  size?: number;
  /** 正序排序字段名 */
  ascs?: string;
  /** 倒序排序字段名 */
  descs?: string;
  /** 关键字 */
  searchKey?: string;
  /** 学期ID */
  semesterId?: number;
  /** 教师ID */
  teacherId?: number;
  /** 租户课程ID */
  tenantCourseId?: number;
  /** 课程类型：1-必修，2-选修 */
  courseType?: 1 | 2;
  /** 状态：0-未开始，1-进行中，2-已完成 */
  status?: 0 | 1 | 2;
};

/**
 * 更新任务状态请求参数
 */
export type TeachingTaskStatusRequest = {
  /** 任务ID */
  id: number;
  /** 目标状态：0-未开始，1-进行中，2-已完成 */
  status: 0 | 1 | 2;
};

/**
 * 排序字段信息
 */
export type TeachingTaskOrderItem = {
  /** 需要进行排序的字段 */
  column?: string;
  /** 是否正序排列，默认 true */
  asc?: boolean;
};

/**
 * 教学任务列表项
 */
export type TeachingTaskVO = {
  /** 任务ID */
  id?: number;
  /** 任务编号 */
  taskCode?: string;
  /** 任务名称 */
  name?: string;
  /** 教师ID */
  teacherId?: number;
  /** 教师姓名 */
  teacherName?: string;
  /** 教师编码 */
  teacherCode?: string;
  /** 租户课程ID */
  tenantCourseId?: number;
  /** 课程名称 */
  courseName?: string;
  /** 班级ID列表 */
  classIds?: number[];
  /** 班级名称列表（选修课为空） */
  classNames?: string[];
  /** 学期ID */
  semesterId?: number;
  /** 学期名称 */
  semesterName?: string;
  /** 课程类型：1-必修，2-选修 */
  courseType?: 1 | 2;
  /** 状态：0-未开始，1-进行中，2-已完成 */
  status?: 0 | 1 | 2;
  /** 创建时间 */
  createTime?: string;
};

/**
 * 教学任务详情
 */
export type TeachingTaskDetailVO = TeachingTaskVO & {
  /** 更新时间 */
  updateTime?: string;
};

/**
 * 分页查询教学任务列表返回数据
 */
export type TeachingTaskPageResponse = {
  /** 查询数据列表 */
  records?: TeachingTaskVO[];
  /** 总数 */
  total?: number;
  /** 每页显示条数 */
  size?: number;
  /** 当前页 */
  current?: number;
  /** 排序字段信息 */
  orders?: TeachingTaskOrderItem[];
  /** 自动优化 COUNT SQL */
  optimizeCountSql?: boolean;
  /** 是否进行 count 查询 */
  isSearchCount?: boolean;
  searchCount?: boolean;
  /** 当前分页总页数 */
  pages?: number;
  /** 正序排序字段 */
  ascs?: string[];
  /** 升序字段 */
  asc?: string[];
  /** 倒序排序字段 */
  descs?: string[];
  /** 降序字段 */
  desc?: string[];
};

/**
 * 新增教学任务返回数据
 */
export type AddTeachingTaskResponse = boolean;

/**
 * 编辑教学任务返回数据
 */
export type UpdateTeachingTaskResponse = boolean;

/**
 * 删除教学任务返回数据
 */
export type DeleteTeachingTaskResponse = boolean;

/**
 * 获取教学任务详情返回数据
 */
export type TeachingTaskDetailResponse = TeachingTaskDetailVO;

/**
 * 更新任务状态返回数据
 */
export type UpdateTeachingTaskStatusResponse = boolean;
