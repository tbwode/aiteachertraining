export type CourseSquareQueryRequest = {
  current?: number;
  size?: number;
  ascs?: string;
  descs?: string;
  searchKey?: string;
  studentId: number;
  categoryId?: number;
  majorId?: number;
  semesterId?: number;
  sortType?: 1 | 2;
};

export type CourseSquareOrderItem = {
  column?: string;
  asc?: boolean;
};

export type CourseSquareCardVO = {
  avatarId: number;
  courseId: number;
  courseName: string;
  coverUrl?: string;
  categoryName?: string;
  majorName?: string;
  teacherName?: string;
  hours?: number;
  semesterName?: string;
  studentCount?: number;
  courseType?: number;
  isEnrolled?: boolean;
  teachingTaskId?: number;
  semesterId?: number;
  categoryId?: number;
  majorId?: number;
};

export type CourseSquarePageVO = {
  records?: CourseSquareCardVO[];
  total?: number;
  size?: number;
  current?: number;
  orders?: CourseSquareOrderItem[];
  optimizeCountSql?: boolean;
  isSearchCount?: boolean;
  searchCount?: boolean;
  pages?: number;
  ascs?: string[];
  asc?: string[];
  descs?: string[];
  desc?: string[];
};
