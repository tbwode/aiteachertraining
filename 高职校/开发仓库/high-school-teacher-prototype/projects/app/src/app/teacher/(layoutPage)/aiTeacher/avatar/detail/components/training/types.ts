export type TrainingTaskStatus = 'draft' | 'published' | 'ended';
export type AbilitySource = 'course' | 'manual';
export type SubmissionStatus = 'not-submitted' | 'submitted' | 'late';
export type ReviewStatus = 'unreviewed' | 'draft' | 'reviewed';

export type TrainingAbilityRef = {
  graphId: string;
  graphName: string;
  graphVersion: string;
  taskCode: string;
  taskName: string;
  abilityCode: string;
  abilityName: string;
  description: string;
  source: AbilitySource;
  manualOrigin?: 'graph' | 'teacher';
};

export type AbilityWeight = {
  abilityCode: string;
  abilityName: string;
  weight: number;
};

export type TrainingRubricItem = {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  abilityWeights: AbilityWeight[];
};

export type TrainingTask = {
  id: string;
  title: string;
  courseName: string;
  description: string;
  requirements: string[];
  classNames: string[];
  deadline: string;
  status: TrainingTaskStatus;
  abilities: TrainingAbilityRef[];
  rubrics: TrainingRubricItem[];
  createdAt: string;
  updatedAt: string;
};

export type TrainingAttachment = {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'data';
  size: string;
  preview: string;
};

export type RubricScore = {
  rubricId: string;
  score: number | null;
};

export type TrainingReview = {
  status: ReviewStatus;
  scores: RubricScore[];
  comment: string;
  strengths: string[];
  improvements: string[];
  reviewedAt?: string;
};

export type TrainingSubmission = {
  id: string;
  taskId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  submitStatus: SubmissionStatus;
  submittedAt?: string;
  report: string;
  selfReview: string;
  operationSteps: { time: string; name: string; result: string }[];
  processData: { label: string; value: string; status?: 'normal' | 'warning' }[];
  attachments: TrainingAttachment[];
  review: TrainingReview;
};

export type AbilityEvidence = {
  taskId: string;
  taskTitle: string;
  abilityCode: string;
  abilityName: string;
  earned: number;
  maximum: number;
  score: number;
  classAverage: number;
  rubricNames: string[];
  feedback: string;
};

export type AbilityResult = {
  abilityCode: string;
  abilityName: string;
  score: number;
  earned: number;
  maximum: number;
  evidences: AbilityEvidence[];
};

export type TrainingState = {
  tasks: TrainingTask[];
  submissions: TrainingSubmission[];
};

export const totalRubricScore = (task: TrainingTask) =>
  task.rubrics.reduce((sum, item) => sum + item.maxScore, 0);

export const reviewTotalScore = (task: TrainingTask, review: TrainingReview) =>
  task.rubrics.reduce(
    (sum, rubric) =>
      sum + (review.scores.find((item) => item.rubricId === rubric.id)?.score ?? 0),
    0
  );

export const isReviewComplete = (task: TrainingTask, review: TrainingReview) =>
  task.rubrics.every((rubric) => {
    const score = review.scores.find((item) => item.rubricId === rubric.id)?.score;
    return score !== null && score !== undefined && score >= 0 && score <= rubric.maxScore;
  });

export function calculateAbilityResults(
  task: TrainingTask,
  review: TrainingReview
): AbilityResult[] {
  const result = new Map<string, AbilityResult>();
  task.rubrics.forEach((rubric) => {
    const score = review.scores.find((item) => item.rubricId === rubric.id)?.score;
    if (score === null || score === undefined) return;
    rubric.abilityWeights.forEach((mapping) => {
      const ratio = mapping.weight / 100;
      const previous = result.get(mapping.abilityCode) ?? {
        abilityCode: mapping.abilityCode,
        abilityName: mapping.abilityName,
        score: 0,
        earned: 0,
        maximum: 0,
        evidences: []
      };
      previous.earned += score * ratio;
      previous.maximum += rubric.maxScore * ratio;
      result.set(mapping.abilityCode, previous);
    });
  });

  return Array.from(result.values()).map((item) => ({
    ...item,
    earned: Number(item.earned.toFixed(2)),
    maximum: Number(item.maximum.toFixed(2)),
    score: item.maximum > 0 ? Math.round((item.earned / item.maximum) * 100) : 0
  }));
}

export const abilityLevel = (score: number) => {
  if (score >= 85) return { label: '优秀', color: '#059669', bg: '#ECFDF5' };
  if (score >= 70) return { label: '已达成', color: '#2563EB', bg: '#EFF6FF' };
  if (score >= 60) return { label: '基本达成', color: '#D97706', bg: '#FFFBEB' };
  return { label: '待提升', color: '#DC2626', bg: '#FEF2F2' };
};
