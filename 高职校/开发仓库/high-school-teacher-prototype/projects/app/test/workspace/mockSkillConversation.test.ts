import { describe, expect, it } from 'vitest';
import {
  createMockSkillRun,
  inferWorkspaceSkills,
  normalizeSkillKeys
} from '@/app/teacher/(layoutPage)/workspace/chat/mockSkillConversation';

describe('教师工作台技能 Mock 生成器', () => {
  it('去重技能并过滤非法值', () => {
    expect(normalizeSkillKeys(['slides', 'quiz', 'slides', 'unknown', 'practice'])).toEqual([
      'slides',
      'quiz',
      'practice'
    ]);
  });

  it('根据任务文本识别 PPT、互动课件、视频、测验和实训技能', () => {
    expect(inferWorkspaceSkills('生成 PPT 幻灯片和随堂测验')).toEqual(['slides', 'quiz']);
    expect(inferWorkspaceSkills('制作带热点反馈的互动课件')).toEqual(['interactive']);
    expect(inferWorkspaceSkills('制作五分钟视频课件')).toEqual(['video']);
    expect(inferWorkspaceSkills('设计一份设备检修实训工单')).toEqual(['practice']);
  });

  it('只执行第一个有效技能，保证技能单选', () => {
    const result = createMockSkillRun('工业机器人 TCP 标定完整课包', [
      'slides',
      'quiz',
      'practice'
    ]);

    expect(result.skills).toEqual(['slides']);
    expect(result.invocations).toHaveLength(1);
    expect(result.invocations[0].status).toBe('completed');
    expect(result.artifacts.map((item) => item.type)).toEqual(['slides']);
  });

  it('不同技能分别生成可预览的教学产物', () => {
    const artifacts = [
      'lesson',
      'slides',
      'interactive',
      'video',
      'quiz',
      'practice',
      'standards'
    ].map((skill) => createMockSkillRun('工业机器人 TCP 标定教学任务', [skill]).artifacts[0]);
    const [lesson, slides, interactive, video, quiz, practice, standards] = artifacts;

    expect(lesson?.type === 'lesson' && lesson.timeline.length).toBeGreaterThanOrEqual(4);
    expect(slides?.type === 'slides' && slides.slides).toHaveLength(6);
    expect(interactive?.type === 'interactive' && interactive.modules.length).toBeGreaterThan(2);
    expect(video?.type === 'video' && video.chapters.length).toBeGreaterThan(2);
    expect(quiz?.type === 'quiz' && quiz.questions.every((item) => item.answerId)).toBe(true);
    expect(practice?.type === 'practice' && practice.steps.length).toBeGreaterThanOrEqual(5);
    expect(practice?.type === 'practice' && practice.safetyNotes.length).toBeGreaterThan(0);
    expect(practice?.type === 'practice' && practice.rubrics.length).toBeGreaterThan(0);
    expect(standards?.type === 'standards' && standards.items.length).toBeGreaterThan(2);
    expect(standards?.type === 'standards' && standards.coverage).toBeGreaterThan(80);
  });

  it('无明确技能时使用默认教案技能', () => {
    const result = createMockSkillRun('帮我准备明天的课程', []);

    expect(result.skills).toEqual(['lesson']);
    expect(result.artifacts.map((item) => item.type)).toEqual(['lesson']);
  });

  it('仅问答模式调用技能但不生成扩展产物', () => {
    const result = createMockSkillRun('生成 TCP 标定 PPT', ['slides'], 'qa');

    expect(result.skills).toEqual(['slides']);
    expect(result.invocations).toHaveLength(1);
    expect(result.artifacts).toEqual([]);
    expect(result.summary).toContain('仅提供问答结论');
  });
});
