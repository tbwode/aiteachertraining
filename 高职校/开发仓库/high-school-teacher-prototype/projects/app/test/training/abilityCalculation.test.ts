import { describe, expect, it } from 'vitest';
import { buildCumulativeAbilityResults, createSeedTrainingState } from '@/app/teacher/(layoutPage)/aiTeacher/avatar/detail/components/training/mockTraining';
import {
  calculateAbilityResults,
  isReviewComplete,
  type TrainingReview,
  type TrainingTask
} from '@/app/teacher/(layoutPage)/aiTeacher/avatar/detail/components/training/types';

const task: TrainingTask = {
  id: 'task-test',
  title: '测试实训',
  courseName: '测试课程',
  description: '',
  requirements: [],
  classNames: ['测试班'],
  deadline: '2026-09-30T18:00',
  status: 'published',
  abilities: [],
  rubrics: [
    {
      id: 'r1',
      name: '评价项 1',
      description: '',
      maxScore: 40,
      abilityWeights: [
        { abilityCode: 'A', abilityName: '能力 A', weight: 75 },
        { abilityCode: 'B', abilityName: '能力 B', weight: 25 }
      ]
    },
    {
      id: 'r2',
      name: '评价项 2',
      description: '',
      maxScore: 60,
      abilityWeights: [{ abilityCode: 'B', abilityName: '能力 B', weight: 100 }]
    }
  ],
  createdAt: '2026-09-01 09:00',
  updatedAt: '2026-09-01 09:00'
};

describe('training ability calculation', () => {
  it('按评价项得分和能力权重计算多能力达成度', () => {
    const review: TrainingReview = {
      status: 'reviewed',
      scores: [
        { rubricId: 'r1', score: 32 },
        { rubricId: 'r2', score: 42 }
      ],
      comment: '',
      strengths: [],
      improvements: []
    };

    const result = calculateAbilityResults(task, review);
    expect(result.find((item) => item.abilityCode === 'A')?.score).toBe(80);
    expect(result.find((item) => item.abilityCode === 'B')?.score).toBe(71);
    expect(isReviewComplete(task, review)).toBe(true);
  });

  it('忽略未评分项并识别不完整批改', () => {
    const review: TrainingReview = {
      status: 'draft',
      scores: [{ rubricId: 'r1', score: 30 }],
      comment: '',
      strengths: [],
      improvements: []
    };
    const result = calculateAbilityResults(task, review);
    expect(result).toHaveLength(2);
    expect(isReviewComplete(task, review)).toBe(false);
  });

  it('累计能力只统计已提交批改的证据', () => {
    const state = createSeedTrainingState();
    const reviewed = state.submissions.find((item) => item.review.status === 'reviewed');
    expect(reviewed).toBeTruthy();
    const result = buildCumulativeAbilityResults(state, reviewed!.studentId, reviewed!.taskId);
    expect(result.current.length).toBeGreaterThan(0);
    expect(result.cumulative.every((item) => item.maximum > 0)).toBe(true);
    expect(result.cumulative.every((item) => item.evidences.length > 0)).toBe(true);
  });
});

