export interface TodoItem {
  id: string;
  teacherName: string;
  courseName: string;
  message: string;
  remindTime: string;
  isRead?: boolean;
  className?: string;
  progress?: number;
  studyDuration?: string;
  lastStudyTime?: string;
  lagReason?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  relatedCourse: string;
  publishTime: string;
  isRead?: boolean;
}

export interface SuggestionItem {
  id: number;
  suggestionType: number;
  title: string;
  content: string;
  relatedCourseName: string;
  relatedCourseId: number;
  isRead: number;
  publishTime: string;
}

export interface AbilityDimension {
  key: string;
  label: string;
  value: number;
  fullMark: number;
}

export interface HomePageData {
  userName: string;
  greeting: string;
  weather: string;
  temperature: string;
  todoList: TodoItem[];
  todoTotal: number;
  newsList: NewsItem[];
  abilityDimensions: AbilityDimension[];
  suggestionList: SuggestionItem[];
}
