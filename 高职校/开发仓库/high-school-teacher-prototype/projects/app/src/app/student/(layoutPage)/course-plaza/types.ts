import type { CourseSquareCardVO } from '@/types/api/student/courseSquare';

export type CoursePlazaSortType = '1' | '2';

export type CoursePlazaOption = {
  label: string;
  value: string;
};

export type CoursePlazaFilters = {
  keyword: string;
  categoryId: string;
  majorId: string;
  semesterId: string;
  sortType: CoursePlazaSortType;
};

export type CoursePlazaCard = {
  avatarId: number;
  courseId: number;
  courseName: string;
  coverUrl: string;
  categoryName: string;
  majorName: string;
  teacherName: string;
  hours: number;
  semesterName: string;
  studentCount: number;
  courseType: number;
  isEnrolled: boolean;
  teachingTaskId: number;
  semesterId: number;
  categoryId: number;
  majorId: number;
};

export type CoursePlazaPaginationItem =
  | {
      type: 'page';
      value: number;
    }
  | {
      type: 'ellipsis';
      value: string;
    };

export const defaultCoursePlazaFilters: CoursePlazaFilters = {
  keyword: '',
  categoryId: '',
  majorId: '',
  semesterId: '',
  sortType: '2'
};

export const mapCourseSquareCard = (course: CourseSquareCardVO): CoursePlazaCard => ({
  avatarId: course.avatarId ?? 0,
  courseId: course.courseId ?? 0,
  courseName: course.courseName || '未命名课程',
  coverUrl: course.coverUrl || '',
  categoryName: course.categoryName || '未分类',
  majorName: course.majorName || '未分配专业',
  teacherName: course.teacherName || '未知教师',
  hours: Number(course.hours ?? 0),
  semesterName: course.semesterName || '未设置学期',
  studentCount: Number(course.studentCount ?? 0),
  courseType: Number(course.courseType ?? 2),
  isEnrolled: Boolean(course.isEnrolled),
  teachingTaskId: Number(course.teachingTaskId ?? 0),
  semesterId: Number(course.semesterId ?? 0),
  categoryId: Number(course.categoryId ?? 0),
  majorId: Number(course.majorId ?? 0)
});
