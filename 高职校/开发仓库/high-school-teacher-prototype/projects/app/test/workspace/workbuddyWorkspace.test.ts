import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WORKSPACE_SKILL,
  DEFAULT_PREP_PROMPT,
  QUICK_TAGS,
  WORKSPACE_EXPERTS,
  WORKSPACE_MODES,
  WORKSPACE_SCENE_SKILLS,
  WORKSPACE_SKILLS,
  WORKSPACE_TOOLS,
  createPrepChatUrl,
  getWorkspaceSkillPrompt
} from '@/app/teacher/(layoutPage)/workspace/workbuddyConfig';

describe('教师智能备课工作台配置', () => {
  it('包含附件要求的四项核心能力和八个快捷标签', () => {
    expect(WORKSPACE_TOOLS.map((item) => item.key)).toEqual([
      'outline',
      'lesson',
      'practice',
      'graph'
    ]);
    expect(QUICK_TAGS).toHaveLength(8);
    expect(DEFAULT_PREP_PROMPT).toContain('45 分钟课包');
  });

  it('把备课提示词安全带入本地 AI 对话地址', () => {
    const url = createPrepChatUrl('生成 BMS 实训教案 & 课堂诊断题', {
      skill: 'practice',
      mode: 'plan',
      expert: 'industry'
    });

    expect(url).toBe(
      '/teacher/workspace/chat?text=%E7%94%9F%E6%88%90%20BMS%20%E5%AE%9E%E8%AE%AD%E6%95%99%E6%A1%88%20%26%20%E8%AF%BE%E5%A0%82%E8%AF%8A%E6%96%AD%E9%A2%98&skill=practice&mode=plan&expert=industry'
    );
    expect(createPrepChatUrl('   ')).toBe('/teacher/workspace/chat');
  });

  it('提供单技能、模式与专家选项', () => {
    expect(DEFAULT_WORKSPACE_SKILL).toBe('lesson');
    expect(WORKSPACE_SKILLS).toHaveLength(7);
    expect(WORKSPACE_SCENE_SKILLS.daily).toEqual([
      'lesson',
      'slides',
      'interactive',
      'video',
      'quiz'
    ]);
    expect(WORKSPACE_SCENE_SKILLS['work-order']).toEqual(['practice', 'standards']);
    expect(
      WORKSPACE_SKILLS.filter((item) => item.scene === 'daily').map((item) => item.label)
    ).toEqual(['教案生成', 'PPT 制作', '互动课件', '视频课件', '随堂诊断与测验']);
    expect(
      WORKSPACE_SKILLS.filter((item) => item.scene === 'work-order').map((item) => item.label)
    ).toEqual(['互动实训设计', '技能标准对齐']);
    expect(WORKSPACE_MODES.map((item) => item.key)).toEqual(['plan', 'qa']);
    expect(WORKSPACE_EXPERTS.map((item) => item.key)).toEqual([
      'vocational',
      'industry',
      'assessment',
      'courseware'
    ]);
    expect(WORKSPACE_TOOLS.every((item) => typeof item.skill === 'string')).toBe(true);
  });

  it('每项技能都有会同步到输入框的任务模板', () => {
    const prompts = WORKSPACE_SKILLS.map((item) => getWorkspaceSkillPrompt(item.key));

    expect(prompts.every((prompt) => prompt.length > 20)).toBe(true);
    expect(new Set(prompts).size).toBe(WORKSPACE_SKILLS.length);
    expect(getWorkspaceSkillPrompt('video')).toContain('视频');
    expect(getWorkspaceSkillPrompt('standards')).toContain('技能标准');
  });
});
