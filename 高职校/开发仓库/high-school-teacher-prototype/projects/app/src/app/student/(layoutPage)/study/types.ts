export type StudyLessonStatus = 'completed' | 'current' | 'locked';

export type StudyLessonMediaType = 'video' | 'image' | 'audio' | 'pdf' | 'office' | 'text' | 'iframe';

export type StudyLesson = {
  id: string;
  title: string;
  mediaType: StudyLessonMediaType;
  fileType?: string;
  fileFormat?: string;
  status: StudyLessonStatus;
  progress?: number;
  href: string;
};

export type StudyChapter = {
  id: string;
  title: string;
  tip: string;
  lessons: StudyLesson[];
  knowledgePoints?: string[];
  children?: StudyChapter[];
};

export type StudyPageData = {
  courseTitle: string;
  lessonTitle: string;
  lessonMeta: string;
  poster?: string;
  source?: string;
  mediaType: StudyLessonMediaType;
  progress: number;
  knowledgePoints: string[];
  previousHref: string;
  nextHref: string;
  chapters: StudyChapter[];
  datasetId?: string;
};
