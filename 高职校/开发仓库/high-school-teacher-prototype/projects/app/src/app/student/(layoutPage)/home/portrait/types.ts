export interface AbilityDimension {
  key: string;
  label: string;
  value: number;
  fullMark: number;
}

export interface CourseProgressItem {
  courseName: string;
  progress: number;
  status: 'learning' | 'completed';
}

export interface CareerAnalysisItem {
  content: string;
}

export interface SuggestionItem {
  content: string;
}

export interface ImprovementPlan {
  title: string;
  description: string;
  courseName: string;
  priority: string;
  matchRate: number;
}

export interface PortraitData {
  userName: string;
  avatar: string;
  studentId: string;
  major: string;
  learningCourses: number;
  completedCourses: number;
  totalStudyHours: number;
  courseProgressList: CourseProgressItem[];
  abilityDimensions: AbilityDimension[];
  radarDescription: string;
  careerAnalysis: CareerAnalysisItem[];
  suggestions: SuggestionItem[];
  improvementPlan: ImprovementPlan;
}
