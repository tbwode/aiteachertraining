export type AiTeacherTabKey = 'required' | 'optional' | 'all';

export type AiTeacherCourseStatus = 'locked' | 'learning' | 'completed';

export type AiTeacherCourseActionKey = 'continue' | 'review' | 'locked';

export type AiTeacherMetricKey = 'teacherCount' | 'interactionCount' | 'studyDuration';

export type TeacherStyleOptionId = 'gentle' | 'professional' | 'funny' | 'inspiring';

export type LearningPaceOptionId = 'fast' | 'steady' | 'deepDive';

export type PreferenceOptionId =
  | 'stepByStep'
  | 'dialogue'
  | 'visual'
  | 'analogy'
  | 'caseStudy'
  | 'article'
  | 'audio'
  | 'interactive'
  | 'video'
  | 'code'
  | 'project'
  | 'corrective'
  | 'encouraging'
  | 'summary';

export type SliderRangeKey = 'brief' | 'deep' | 'direct' | 'interactive';

export type SliderScaleKey =
  | 'brief'
  | 'lean'
  | 'balanced'
  | 'detailed'
  | 'deep'
  | 'low'
  | 'less'
  | 'more'
  | 'high';

export type AiTeacherMetric = {
  key: AiTeacherMetricKey;
  value: string;
};

export type AiTeacherTab = {
  key: AiTeacherTabKey;
  count: number;
};

export type AiTeacherCourse = {
  courseId: number;
  teachingTaskId: number;
  avatarId: number;
  courseType: number;
  hours: number;
  courseName: string;
  courseImage?: string;
  majorName: string;
  teacherName: string;
  studentCount: number;
  progress: number;
  status: AiTeacherCourseStatus;
  actionKey: AiTeacherCourseActionKey;
  availableTabs: AiTeacherTabKey[];
  unlockDate?: string;
};

export type TeacherStyleOption = {
  id: TeacherStyleOptionId;
};

export type LearningPaceOption = {
  id: LearningPaceOptionId;
};

export type SliderConfig = {
  id: 'depth' | 'interaction';
  min: number;
  max: number;
  defaultValue: number;
  labelRange: [SliderRangeKey, SliderRangeKey];
  scaleLabels: SliderScaleKey[];
};

export type PreferenceGroup = {
  id: 'teachingMethod' | 'contentFormat' | 'feedbackStyle';
  optionIds: PreferenceOptionId[];
  defaultSelected: PreferenceOptionId[];
};

export type AiTeacherPageConfig = {
  styleOptions: TeacherStyleOption[];
  learningPaceOptions: LearningPaceOption[];
  sliders: SliderConfig[];
  preferenceGroups: PreferenceGroup[];
};

export type AiTeacherPreferenceState = {
  id?: number;
  teachingStyle: TeacherStyleOptionId;
  learningPace: LearningPaceOptionId;
  sliderValues: Record<'depth' | 'interaction', number>;
  selectedOptions: PreferenceOptionId[];
};

export const aiTeacherPageConfig = {
  styleOptions: [{ id: 'gentle' }, { id: 'professional' }, { id: 'funny' }, { id: 'inspiring' }],
  learningPaceOptions: [{ id: 'fast' }, { id: 'steady' }, { id: 'deepDive' }],
  sliders: [
    {
      id: 'depth',
      min: 1,
      max: 5,
      defaultValue: 3,
      labelRange: ['brief', 'deep'],
      scaleLabels: ['brief', 'lean', 'balanced', 'detailed', 'deep']
    },
    {
      id: 'interaction',
      min: 1,
      max: 5,
      defaultValue: 3,
      labelRange: ['direct', 'interactive'],
      scaleLabels: ['low', 'less', 'balanced', 'more', 'high']
    }
  ],
  preferenceGroups: [
    {
      id: 'teachingMethod',
      optionIds: ['stepByStep', 'dialogue', 'visual', 'analogy', 'caseStudy'],
      defaultSelected: ['stepByStep', 'analogy']
    },
    {
      id: 'contentFormat',
      optionIds: ['article', 'audio', 'interactive', 'video', 'code', 'project'],
      defaultSelected: ['article', 'interactive', 'video']
    },
    {
      id: 'feedbackStyle',
      optionIds: ['corrective', 'encouraging', 'summary'],
      defaultSelected: ['corrective']
    }
  ]
} satisfies AiTeacherPageConfig;

export const defaultAiTeacherPreferenceState: AiTeacherPreferenceState = {
  teachingStyle: 'gentle',
  learningPace: 'fast',
  sliderValues: {
    depth: 3,
    interaction: 3
  },
  selectedOptions: aiTeacherPageConfig.preferenceGroups.flatMap((group) => group.defaultSelected)
};
