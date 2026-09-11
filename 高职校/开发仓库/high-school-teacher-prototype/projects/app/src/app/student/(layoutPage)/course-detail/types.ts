export type CourseDetailTabKey = 'intro' | 'catalog';

export type CourseLessonMediaType = 'video' | 'text' | 'audio' | 'image';

export type CourseLessonStatus = 'completed' | 'current' | 'pending';

export type CourseDetailQuery = {
  avatarId?: string;
  courseId?: string;
  teachingTaskId?: string;
  majorName?: string;
  teacherName?: string;
  hours?: string;
};

export type CourseKnowledgeChapter = {
  id: string;
  title: string;
  nodeNames: string[];
  childCount: number;
  knowledgeCount: number;
};

export type CourseCatalogLesson = {
  id: string;
  mediaType: CourseLessonMediaType;
  fileType?: string;
  fileFormat?: string;
  title: string;
  duration: string;
  status: CourseLessonStatus;
  href: string;
  sectionTitle?: string;
  progress?: number;
};

export type CourseCatalogChapter = {
  id: string;
  title: string;
  tip: string;
  defaultExpanded: boolean;
  lessons: CourseCatalogLesson[];
  children?: CourseCatalogChapter[];
};

export type CourseDetailData = {
  avatarId?: number;
  courseName?: string;
  cover?: string;
  description?: string;
  progress?: number;
  majorName?: string;
  teacherName?: string;
  durationLabel?: string;
  courseId?: string;
  teachingTaskId?: string;
  datasetId: string;
  knowledgeChapters: CourseKnowledgeChapter[];
  catalogChapters: CourseCatalogChapter[];
  rawChapters: import('@/types/api/student/student').ChapterVO[];
};
