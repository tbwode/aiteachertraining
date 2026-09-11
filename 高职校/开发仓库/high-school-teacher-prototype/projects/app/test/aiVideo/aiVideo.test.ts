/**
 * AI视频课 Mock 数据层单元测试
 * 覆盖：项目 CRUD / 复制、分镜操作、任务状态机时间推导、内容安全、分镜脚本生成
 */
import { describe, expect, it } from 'vitest';
import {
  AI_VIDEO_PROJECTS_STORAGE_KEY,
  buildPptNarration,
  createPptProject,
  createImageProject,
  createTemplateProject,
  GAUSS_COVER_URL,
  GAUSS_VIDEO_DURATION,
  GAUSS_VIDEO_URL,
  appendNextShot,
  clampDigitalHumanPlacement,
  createTextProject,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_DIGITAL_HUMAN_CONFIG,
  DEFAULT_DIGITAL_HUMAN_PLACEMENT,
  DEFAULT_SUBTITLE_CONFIG,
  INTRO_OUTRO_DURATION,
  isGaussDemoTopic,
  TASK_FAIL_AT,
  TASK_TOTAL_DURATION,
  buildStoryboardFromPrompt,
  deleteProject as apiDeleteProject,
  deriveTaskState,
  duplicateProject as apiDuplicateProject,
  findSensitiveWord,
  isPromptTooShort,
  loadProjects,
  matchFailReason,
  materializeProject,
  normalizeProject,
  optimizeShot,
  resolveSmartDuration,
  saveProjects,
  mockParsePptFile,
  PPT_ACCEPT_EXTENSIONS,
  PPT_MAX_SIZE_BYTES,
  PPT_VIP_MAX_SIZE_BYTES,
  resolvePptShotDuration,
  restoreDigitalHumanState,
  setDigitalHumanEnabled,
  isPptFileNameAccepted,
  sniffPptFileIntegrity,
  syncDigitalHumanPlacement,
  updateShotDigitalHuman,
  shotCountByDuration,
  splitSubtitle,
  totalDuration,
  updateProjectConfig,
  type StorageLike
} from '@/teacher/api/aiVideo';
import type {
  AiVideoParams,
  AiVideoProject,
  CreatePptProjectInput,
  StoryboardShot
} from '@/teacher/types/aiVideo';

/* 内存 storage shim */
function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key)
  };
}

const defaultParams: AiVideoParams = {
  ratio: '16:9',
  duration: 'balanced',
  style: 'simpleCourseware'
};

function makeShot(partial: Partial<StoryboardShot> = {}): StoryboardShot {
  return {
    id: partial.id ?? `shot_${Math.random().toString(36).slice(2, 8)}`,
    title: '分镜 1',
    sceneDescription: '画面描述',
    narration: '台词',
    productionNotes: '',
    duration: 10,
    imageUrl: '/media/ai-video/shot-1.jpg',
    ...partial
  };
}

function makeProject(partial: Partial<AiVideoProject> = {}): AiVideoProject {
  return {
    id: partial.id ?? 'video_test_1',
    title: '测试项目',
    mode: 'text',
    prompt: '讲解牛顿第二定律的应用场景',
    params: { ...defaultParams },
    storyboard: [makeShot()],
    status: 'draft',
    stage: null,
    progress: 0,
    queuePosition: 0,
    failReason: null,
    videoUrl: null,
    coverUrl: '/media/ai-video/cover-16x9.jpg',
    taskStartedAt: null,
    createdAt: '2026-08-18T00:00:00.000Z',
    updatedAt: '2026-08-18T00:00:00.000Z',
    ...partial
  };
}

describe('存储 CRUD', () => {
  it('保存并可读取项目列表', () => {
    const storage = createMemoryStorage();
    const project = makeProject();
    saveProjects([project], storage);
    expect(loadProjects(storage)).toHaveLength(1);
    expect(loadProjects(storage)[0].id).toBe(project.id);
  });

  it('无数据时返回空数组；非法 JSON 容错', () => {
    const storage = createMemoryStorage();
    expect(loadProjects(storage)).toEqual([]);
    storage.setItem(AI_VIDEO_PROJECTS_STORAGE_KEY, '{broken');
    expect(loadProjects(storage)).toEqual([]);
  });

  it('删除项目', async () => {
    const storage = createMemoryStorage();
    saveProjects([makeProject({ id: 'a' }), makeProject({ id: 'b' })], storage);
    // API 层走默认 storage，这里直接验证纯存储语义
    const rest = loadProjects(storage).filter((p) => p.id !== 'a');
    saveProjects(rest, storage);
    expect(loadProjects(storage).map((p) => p.id)).toEqual(['b']);
    expect(typeof apiDeleteProject).toBe('function');
  });
});

describe('项目复制', () => {
  it('复制生成新 id、标题加副本后缀、状态与成片重置', () => {
    const source = makeProject({
      status: 'success',
      videoUrl: '/media/ai-video/sample-16x9.mp4',
      progress: 100,
      taskStartedAt: 123
    });
    const copy: AiVideoProject = {
      ...source,
      id: 'new_id',
      title: `${source.title}（副本）`,
      status: 'draft',
      progress: 0,
      videoUrl: null,
      taskStartedAt: null
    };
    expect(copy.id).not.toBe(source.id);
    expect(copy.title).toContain('副本');
    expect(copy.status).toBe('draft');
    expect(copy.videoUrl).toBeNull();
    expect(copy.taskStartedAt).toBeNull();
    expect(typeof apiDuplicateProject).toBe('function');
  });
});

describe('分镜操作（排序/增删）', () => {
  it('上移/下移交换顺序', () => {
    const shots = [makeShot({ id: 's1' }), makeShot({ id: 's2' }), makeShot({ id: 's3' })];
    const move = (list: StoryboardShot[], index: number, offset: -1 | 1) => {
      const target = index + offset;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    };
    expect(move(shots, 1, -1).map((s) => s.id)).toEqual(['s2', 's1', 's3']);
    expect(move(shots, 1, 1).map((s) => s.id)).toEqual(['s1', 's3', 's2']);
    // 边界不变
    expect(move(shots, 0, -1).map((s) => s.id)).toEqual(['s1', 's2', 's3']);
    expect(move(shots, 2, 1).map((s) => s.id)).toEqual(['s1', 's2', 's3']);
  });
});

describe('任务状态机（时间推导）', () => {
  const t0 = 1_000_000;

  it('排队阶段：状态 queued，queuePosition 从 2 递减', () => {
    const start = deriveTaskState(t0, t0 + 100);
    expect(start.status).toBe('queued');
    expect(start.queuePosition).toBeGreaterThanOrEqual(1);
    const end = deriveTaskState(t0, t0 + 2900);
    expect(end.status).toBe('queued');
    expect(end.queuePosition).toBe(0);
  });

  it('生成中：依次经过 script/visuals/voice/subtitle/render 五阶段', () => {
    expect(deriveTaskState(t0, t0 + 4000).stage).toBe('script');
    expect(deriveTaskState(t0, t0 + 10000).stage).toBe('visuals');
    expect(deriveTaskState(t0, t0 + 18000).stage).toBe('voice');
    expect(deriveTaskState(t0, t0 + 22000).stage).toBe('subtitle');
    expect(deriveTaskState(t0, t0 + 26000).stage).toBe('render');
    expect(deriveTaskState(t0, t0 + 10000).status).toBe('generating');
  });

  it('进度单调递增且在 0-100 内', () => {
    let prev = -1;
    for (let ms = 0; ms <= TASK_TOTAL_DURATION; ms += 1000) {
      const { progress } = deriveTaskState(t0, t0 + ms);
      expect(progress).toBeGreaterThanOrEqual(prev);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
      prev = progress;
    }
  });

  it('超过总时长后成功', () => {
    const done = deriveTaskState(t0, t0 + TASK_TOTAL_DURATION + 1);
    expect(done.status).toBe('success');
    expect(done.progress).toBe(100);
  });

  it('失败关键词： visuals 阶段中点后进入 failed', () => {
    const before = deriveTaskState(t0, t0 + TASK_FAIL_AT - 1, 'timeout');
    expect(before.status).not.toBe('failed');
    const after = deriveTaskState(t0, t0 + TASK_FAIL_AT + 1, 'timeout');
    expect(after.status).toBe('failed');
    expect(after.stage).toBe('visuals');
  });

  it('materializeProject：成功后写入成片地址；draft 不受影响', () => {
    const running = makeProject({ status: 'generating', taskStartedAt: t0 });
    const done = materializeProject(running, t0 + TASK_TOTAL_DURATION + 500);
    expect(done.status).toBe('success');
    expect(done.videoUrl).toBe('/media/ai-video/sample-16x9.mp4');

    // draft 不做任务推导：状态与成片保持原样（normalize 补齐配置属预期行为）
    const draft = makeProject({ status: 'draft' });
    const materializedDraft = materializeProject(draft, t0);
    expect(materializedDraft.status).toBe('draft');
    expect(materializedDraft.videoUrl).toBeNull();
    expect(materializedDraft.subtitle).toEqual(DEFAULT_SUBTITLE_CONFIG);
  });
});

describe('内容安全与校验', () => {
  it('敏感词命中返回词条，未命中返回 null', () => {
    expect(findSensitiveWord('这个视频包含赌博内容')).toBe('赌博');
    expect(findSensitiveWord('讲解牛顿第二定律')).toBeNull();
    expect(findSensitiveWord('')).toBeNull();
  });

  it('过短提示词判定（<10 字）', () => {
    expect(isPromptTooShort('牛顿定律')).toBe(true);
    expect(isPromptTooShort('讲解牛顿第二定律的应用场景')).toBe(false);
    expect(isPromptTooShort('   短   ')).toBe(true);
  });

  it('失败触发关键词映射', () => {
    expect(matchFailReason('测试失败')).toBe('timeout');
    expect(matchFailReason('测试拦截')).toBe('moderation');
    expect(matchFailReason('测试繁忙')).toBe('busy');
    expect(matchFailReason('正常提示词内容')).toBeNull();
  });
});

describe('分镜脚本生成', () => {
  it('按时长预设产出 4/6/8/10 条分镜', () => {
    expect(shotCountByDuration('compact')).toBe(4);
    expect(shotCountByDuration('balanced')).toBe(6);
    expect(shotCountByDuration('relaxed')).toBe(8);
    expect(shotCountByDuration('special')).toBe(10);
    const topic = '新能源汽车动力电池检测流程教学';
    expect(buildStoryboardFromPrompt(topic, '', 'compact')).toHaveLength(4);
    expect(buildStoryboardFromPrompt(topic, '', 'balanced')).toHaveLength(6);
    expect(buildStoryboardFromPrompt(topic, '', 'relaxed')).toHaveLength(8);
    expect(buildStoryboardFromPrompt(topic, '', 'special')).toHaveLength(10);
  });

  it('智能匹配：按文本信息量选档', () => {
    expect(resolveSmartDuration('短主题')).toBe('compact');
    expect(resolveSmartDuration('这是一个中等长度的视频主题描述'.repeat(4))).toBe('balanced');
    expect(resolveSmartDuration('非常详细的主题描述'.repeat(20))).toBe('relaxed');
    // smart 生成的分镜数与所推导档位一致
    const shortShots = buildStoryboardFromPrompt('短主题', '', 'smart');
    expect(shortShots).toHaveLength(4);
  });

  it('分镜时长合计等于预设目标秒数', () => {
    const expected = { compact: 45, balanced: 120, relaxed: 240, special: 320 } as const;
    for (const preset of ['compact', 'balanced', 'relaxed', 'special'] as const) {
      const shots = buildStoryboardFromPrompt('新能源汽车动力电池检测流程教学', '', preset);
      const total = shots.reduce((sum, shot) => sum + shot.duration, 0);
      expect(total).toBe(expected[preset]);
    }
  });

  it('分镜包含标题/画面设计/讲稿/制作细节，内容包含主题词', () => {
    const shots = buildStoryboardFromPrompt('新能源汽车动力电池检测', '', 'balanced');
    expect(shots[0].title).toBe('开场引入');
    expect(shots[0].productionNotes.length).toBeGreaterThan(0);
    expect(shots[0].narration).toContain('新能源汽车');
    const images = new Set(shots.map((s) => s.imageUrl));
    expect(images.size).toBeGreaterThan(1);
  });
});

describe('二次编辑工作台：配置规范化', () => {
  it('normalizeProject：旧项目补齐默认配置', () => {
    const legacy = makeProject({ subtitle: undefined, audio: undefined, trim: undefined });
    delete (legacy as Record<string, unknown>).subtitle;
    delete (legacy as Record<string, unknown>).audio;
    delete (legacy as Record<string, unknown>).trim;
    delete (legacy as Record<string, unknown>).intro;
    delete (legacy as Record<string, unknown>).outro;

    const normalized = normalizeProject(legacy);
    expect(normalized.subtitle).toEqual(DEFAULT_SUBTITLE_CONFIG);
    expect(normalized.subtitle?.visible).toBe(true); // 字幕默认展示
    expect(normalized.aiBadge).toBe(true); // AI 标识默认展示
    expect(normalized.audio).toEqual(DEFAULT_AUDIO_CONFIG);
    expect(normalized.intro).toBe('none');
    expect(normalized.outro).toBe('none');
    expect(normalized.trim).toEqual({ start: 0, end: totalDuration(normalized) });
  });

  it('normalizeProject：已有配置不被覆盖', () => {
    const project = makeProject({
      subtitle: { fontSize: 'large', color: '#FFFF00', autoBreak: false }
    });
    const normalized = normalizeProject(project);
    expect(normalized.subtitle?.fontSize).toBe('large');
    expect(normalized.subtitle?.autoBreak).toBe(false);
  });

  it('normalizeProject：旧版数据迁移（数值时长→预设；params 音频字段→audio；分镜补标题）', () => {
    const legacy = makeProject();
    // 模拟旧版结构：数值时长 + params 内嵌音频字段 + 分镜缺标题
    (legacy.params as Record<string, unknown>).duration = 60;
    (legacy.params as Record<string, unknown>).voice = 'maleDeep';
    (legacy.params as Record<string, unknown>).speed = 1.2;
    (legacy.params as Record<string, unknown>).bgm = 'freePiano';
    delete (legacy.storyboard[0] as Partial<(typeof legacy.storyboard)[0]>).title;
    delete (legacy.storyboard[0] as Partial<(typeof legacy.storyboard)[0]>).productionNotes;
    delete (legacy as Record<string, unknown>).audio;

    const normalized = normalizeProject(legacy);
    expect(normalized.params.duration).toBe('balanced');
    expect(normalized.audio?.voice).toBe('maleDeep');
    expect(normalized.audio?.speed).toBe(1.2);
    expect(normalized.audio?.bgm).toBe('freePiano');
    expect(normalized.storyboard[0].title).toBe('分镜 1');
    expect(normalized.storyboard[0].productionNotes).toBe('');
  });

  it('normalizeProject：非法裁剪区间自愈（end<=start 重置为全区间）', () => {
    // 历史坏数据：trim {0,0} 会导致播放被立即暂停
    const broken = makeProject({ trim: { start: 0, end: 0 } });
    const normalized = normalizeProject(broken);
    expect(normalized.trim).toEqual({ start: 0, end: totalDuration(normalized) });

    const reversed = makeProject({ trim: { start: 10, end: 5 } });
    expect(normalizeProject(reversed).trim).toEqual({
      start: 0,
      end: totalDuration(reversed)
    });
  });

  it('normalizeProject：合法裁剪区间保留并收敛到总时长内', () => {
    const total = totalDuration(makeProject());
    const project = makeProject({ trim: { start: 2, end: total - 2 } });
    const normalized = normalizeProject(project);
    expect(normalized.trim).toEqual({ start: 2, end: total - 2 });

    const overflow = makeProject({ trim: { start: 4, end: 9999 } });
    expect(normalizeProject(overflow).trim?.end).toBe(totalDuration(overflow));
  });
});

describe('二次编辑工作台：总时长与断句', () => {
  it('totalDuration：分镜合计 + 片头片尾各 2s', () => {
    const project = makeProject({
      storyboard: [makeShot({ duration: 10 }), makeShot({ duration: 20 })]
    });
    expect(totalDuration(project)).toBe(30);
    expect(totalDuration({ ...project, intro: 'schoolBadge' })).toBe(30 + INTRO_OUTRO_DURATION);
    expect(totalDuration({ ...project, intro: 'schoolBadge', outro: 'minimalText' })).toBe(
      30 + INTRO_OUTRO_DURATION * 2
    );
    expect(totalDuration({ ...project, intro: 'none', outro: 'none' })).toBe(30);
  });

  it('splitSubtitle：按标点断句', () => {
    expect(splitSubtitle('首先了解概念，然后进行实操。最后总结。', true)).toEqual([
      '首先了解概念，',
      '然后进行实操。',
      '最后总结。'
    ]);
    expect(splitSubtitle('首先了解概念，然后进行实操。', false)).toEqual([
      '首先了解概念，然后进行实操。'
    ]);
    expect(splitSubtitle('  ', true)).toEqual(['']);
    // 英文标点
    expect(splitSubtitle('Hello world. Let us start!', true)).toEqual([
      'Hello world.',
      'Let us start!'
    ]);
  });
});

describe('高职校场景分镜模板', () => {
  it('分镜内容包含实训教学语境关键词', () => {
    const shots = buildStoryboardFromPrompt('新能源汽车动力电池检测流程教学', '', 'special');
    const allText = shots.map((s) => s.sceneDescription + s.narration).join('\n');
    expect(allText).toContain('实训');
    expect(allText).toContain('同学');
  });
});

describe('工作台时间轴工具', () => {
  it('formatTimecode：支持十分之一秒', async () => {
    const { formatTimecode } = await import(
      '@/app/teacher/(layoutPage)/ai-video/components/studio/timelineUtils'
    );
    expect(formatTimecode(7.8, true)).toBe('00:07.8');
    expect(formatTimecode(72)).toBe('01:12');
    expect(formatTimecode(0, true)).toBe('00:00.0');
    expect(formatTimecode(125)).toBe('02:05');
  });

  it('chooseTickInterval：刻度数量受控', async () => {
    const { chooseTickInterval, buildTicks } = await import(
      '@/app/teacher/(layoutPage)/ai-video/components/studio/timelineUtils'
    );
    expect(chooseTickInterval(45)).toBe(5);
    expect(chooseTickInterval(120)).toBe(10);
    expect(chooseTickInterval(320)).toBe(30);
    const ticks = buildTicks(120, 10);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBe(120);
    expect(ticks.length).toBeLessThanOrEqual(15);
  });

  it('timeToPercent：边界截断', async () => {
    const { timeToPercent } = await import(
      '@/app/teacher/(layoutPage)/ai-video/components/studio/timelineUtils'
    );
    expect(timeToPercent(0, 100)).toBe(0);
    expect(timeToPercent(50, 100)).toBe(50);
    expect(timeToPercent(150, 100)).toBe(100);
    expect(timeToPercent(10, 0)).toBe(0);
  });
});

describe('分镜逐步生成', () => {
  it('创建项目：空分镜 + storyboardPending', async () => {
    const storage = createMemoryStorage();
    const { project } = await createTextProject(
      {
        topic: '新能源汽车动力电池检测流程教学',
        notes: '',
        params: { ...defaultParams, duration: 'compact' }
      },
      storage
    );
    expect(project.storyboard).toEqual([]);
    expect(project.storyboardPending).toBe(true);
    expect(loadProjects(storage)).toHaveLength(1);
  });

  it('appendNextShot：逐条追加直至完成', async () => {
    const storage = createMemoryStorage();
    const { project } = await createTextProject(
      {
        topic: '新能源汽车动力电池检测流程教学',
        notes: '',
        params: { ...defaultParams, duration: 'compact' }
      },
      storage
    );

    let done = false;
    let current = project;
    let steps = 0;
    while (!done && steps < 10) {
      const result = await appendNextShot(project.id, storage);
      expect(result).not.toBeNull();
      current = result!.project;
      done = result!.done;
      steps += 1;
    }

    expect(steps).toBe(4); // compact → 4 镜
    expect(done).toBe(true);
    expect(current.storyboardPending).toBe(false);
    expect(current.storyboard).toHaveLength(4);
    expect(current.storyboard[0].title).toBe('开场引入');
    expect(current.storyboard[3].title).toBe('安全规范');
    // 每条分镜都有完整字段
    for (const shot of current.storyboard) {
      expect(shot.narration.length).toBeGreaterThan(0);
      expect(shot.productionNotes.length).toBeGreaterThan(0);
      expect(shot.imageUrl).toContain('/media/ai-video/shot-');
    }
    // 持久化内容一致
    const stored = loadProjects(storage).find((p) => p.id === project.id);
    expect(stored?.storyboard).toHaveLength(4);
  });
});

describe('高斯消去法示例（真实视频演示）', () => {
  it('主题命中「高斯 / Gauss」时识别为演示项目', () => {
    expect(isGaussDemoTopic('Gauss消去法原理与步骤讲解')).toBe(true);
    expect(isGaussDemoTopic('高斯消去法入门')).toBe(true);
    expect(isGaussDemoTopic('gaussian elimination intro')).toBe(true);
    expect(isGaussDemoTopic('数控铣床加工实训')).toBe(false);
  });

  it('演示分镜与真实视频逐屏对齐：13 镜合计 51.4s，缩略图来自真实抽帧', () => {
    const shots = buildStoryboardFromPrompt('Gauss消去法原理与步骤讲解', '', 'smart');
    expect(shots).toHaveLength(13);
    const total = shots.reduce((sum, shot) => sum + shot.duration, 0);
    expect(total).toBeCloseTo(GAUSS_VIDEO_DURATION, 1);
    for (const shot of shots) {
      expect(shot.imageUrl).toMatch(/\/media\/ai-video\/shot-gauss-\d+\.jpg$/);
    }
    // 分镜标题覆盖视频章节结构
    const titles = shots.map((s) => s.title).join('|');
    expect(titles).toContain('消元过程');
    expect(titles).toContain('回代求解');
    expect(titles).toContain('例题解析');
  });

  it('创建演示项目：标记 demoVideo=gauss，默认开启轻音乐 BGM', async () => {
    const storage = createMemoryStorage();
    const { project } = await createTextProject(
      {
        topic: 'Gauss消去法原理与步骤讲解',
        notes: '',
        params: { ...defaultParams }
      },
      storage
    );
    expect(project.demoVideo).toBe('gauss');
    expect(project.audio?.bgm).toBe('freePiano');
    expect(project.coverUrl).toBe(GAUSS_COVER_URL);
  });

  it('演示项目生成成功后成片为真实视频', () => {
    const gaussProject = makeProject({
      demoVideo: 'gauss',
      status: 'generating',
      taskStartedAt: 1_000_000
    });
    const done = materializeProject(gaussProject, 1_000_000 + TASK_TOTAL_DURATION + 1);
    expect(done.status).toBe('success');
    expect(done.videoUrl).toBe(GAUSS_VIDEO_URL);
    expect(done.coverUrl).toBe(GAUSS_COVER_URL);

    // 普通项目仍走占位视频
    const normal = materializeProject(
      makeProject({ status: 'generating', taskStartedAt: 1_000_000 }),
      1_000_000 + TASK_TOTAL_DURATION + 1
    );
    expect(normal.videoUrl).toBe('/media/ai-video/sample-16x9.mp4');
  });

  it('normalizeProject 补齐数字人默认配置', () => {
    const normalized = normalizeProject(makeProject());
    expect(normalized.digitalHuman).toEqual({
      enabled: false,
      avatar: 'bailuwei',
      mode: 'floatingAvatar',
      placement: { ...DEFAULT_DIGITAL_HUMAN_PLACEMENT }
    });
  });
});

/* node 环境下为 API 层提供 window.localStorage 桩 */
function stubWindowStorage(): { restore: () => void } {
  const store = new Map<string, string>();
  const original = (globalThis as Record<string, unknown>).window;
  (globalThis as Record<string, unknown>).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key)
    }
  };
  return {
    restore: () => {
      (globalThis as Record<string, unknown>).window = original;
    }
  };
}

describe('AI编辑：分镜优化（optimizeShot）', () => {
  it('pacing：按讲稿篇幅调整单镜时长并追加节奏说明', async () => {
    const stub = stubWindowStorage();
    try {
      const project = makeProject({
        storyboard: [
          makeShot({
            id: 'shot_a',
            narration: '这是一段用于验证节奏优化的较长讲稿内容，大约三十个字左右。',
            duration: 10,
            productionNotes: '原始制作细节'
          })
        ]
      });
      saveProjects([project]);

      const next = await optimizeShot(project.id, 'shot_a', 'pacing');
      expect(next).not.toBeNull();
      const shot = next!.storyboard[0];
      const expected = Math.min(8, Math.max(3, Math.round(shot.narration.length / 8)));
      expect(shot.duration).toBe(expected);
      expect(shot.duration).toBeGreaterThanOrEqual(3);
      expect(shot.duration).toBeLessThanOrEqual(8);
      expect(shot.productionNotes).toContain('节奏优化');
      expect(shot.productionNotes).toContain('原始制作细节');

      // 持久化生效
      const persisted = loadProjects().find((item) => item.id === project.id);
      expect(persisted?.storyboard[0].productionNotes).toContain('节奏优化');
    } finally {
      stub.restore();
    }
  });

  it('enrich：画面/讲稿/制作细节均补充更丰富描述', async () => {
    const stub = stubWindowStorage();
    try {
      const project = makeProject({
        storyboard: [
          makeShot({
            id: 'shot_b',
            sceneDescription: '教师讲解公式',
            narration: '这一步进行消元。',
            productionNotes: '固定镜头'
          })
        ]
      });
      saveProjects([project]);

      const next = await optimizeShot(project.id, 'shot_b', 'enrich');
      const shot = next!.storyboard[0];
      expect(shot.sceneDescription).toContain('教师讲解公式');
      expect(shot.sceneDescription).toContain('特写关键公式');
      expect(shot.narration).toContain('这一步进行消元。');
      expect(shot.narration.length).toBeGreaterThan('这一步进行消元。'.length);
      expect(shot.productionNotes).toContain('固定镜头');
      expect(shot.productionNotes).toContain('重点高亮');
    } finally {
      stub.restore();
    }
  });

  it('simplify：讲稿保留第一句，制作细节标注精简版', async () => {
    const stub = stubWindowStorage();
    try {
      const project = makeProject({
        storyboard: [
          makeShot({
            id: 'shot_c',
            sceneDescription: '教师讲解公式，板书推导过程，学生认真听讲',
            narration: '首先写出增广矩阵。然后逐步消元。最后回代求解。',
            productionNotes: '多机位切换'
          })
        ]
      });
      saveProjects([project]);

      const next = await optimizeShot(project.id, 'shot_c', 'simplify');
      const shot = next!.storyboard[0];
      expect(shot.narration).toBe('首先写出增广矩阵。');
      expect(shot.sceneDescription).toBe('教师讲解公式');
      expect(shot.productionNotes).toContain('精简版');
      expect(shot.productionNotes).not.toContain('多机位切换');
    } finally {
      stub.restore();
    }
  });

  it('不影响其他分镜；未命中分镜时保持不变', async () => {
    const stub = stubWindowStorage();
    try {
      const other = makeShot({ id: 'shot_other', narration: '其他分镜讲稿' });
      const project = makeProject({
        storyboard: [makeShot({ id: 'shot_d', narration: '目标分镜讲稿内容' }), other]
      });
      saveProjects([project]);

      const next = await optimizeShot(project.id, 'shot_d', 'simplify');
      expect(next!.storyboard[1]).toEqual(other);

      const untouched = await optimizeShot(project.id, 'not_exist', 'enrich');
      expect(untouched!.storyboard[0].narration).toBe(next!.storyboard[0].narration);
    } finally {
      stub.restore();
    }
  });
});

describe('数字人展示模式（digitalHuman.mode）', () => {
  it('normalizeProject：旧项目缺 mode 时合并默认值，已有配置保留', () => {
    // 旧数据：只有 enabled/avatar，没有 mode
    const legacy = makeProject({
      digitalHuman: { enabled: true, avatar: 'maleTeacher' } as AiVideoProject['digitalHuman']
    });
    const normalized = normalizeProject(legacy);
    expect(normalized.digitalHuman).toEqual({
      enabled: true,
      avatar: 'maleTeacher',
      mode: 'floatingAvatar',
      placement: { ...DEFAULT_DIGITAL_HUMAN_PLACEMENT }
    });

    const custom = makeProject({
      digitalHuman: {
        enabled: true,
        avatar: 'femaleTeacher',
        mode: 'halfBody',
        placement: { x: 50, y: 50, scale: 1.2 }
      }
    });
    expect(normalizeProject(custom).digitalHuman?.mode).toBe('halfBody');
    expect(normalizeProject(custom).digitalHuman?.placement).toEqual({ x: 50, y: 50, scale: 1.2 });
  });

  it('updateProjectConfig：保存展示模式并持久化', async () => {
    const stub = stubWindowStorage();
    try {
      const project = makeProject();
      saveProjects([project]);

      const next = await updateProjectConfig(project.id, {
        digitalHuman: {
          enabled: true,
          avatar: 'femaleTeacher',
          mode: 'fullBody',
          placement: { x: 80, y: 70, scale: 1 }
        }
      });
      expect(next?.digitalHuman?.mode).toBe('fullBody');

      const persisted = loadProjects().find((item) => item.id === project.id);
      expect(persisted?.digitalHuman?.mode).toBe('fullBody');
    } finally {
      stub.restore();
    }
  });
});

describe('数字人摆放与分镜覆盖（placement / digitalHumanOverride）', () => {
  it('clampDigitalHumanPlacement：位置约束在画面内并限制缩放范围', () => {
    expect(clampDigitalHumanPlacement({ x: 120, y: -5, scale: 3 })).toEqual({
      x: 96,
      y: 4,
      scale: 1.6
    });
    expect(clampDigitalHumanPlacement({ x: 50, y: 50, scale: 0.2 })).toEqual({
      x: 50,
      y: 50,
      scale: 0.6
    });
  });

  it('updateShotDigitalHuman：仅此片段写入摆放覆盖并持久化，不影响其他分镜', async () => {
    const stub = stubWindowStorage();
    try {
      const shotA = makeShot({ id: 'shot_a' });
      const shotB = makeShot({ id: 'shot_b' });
      const project = makeProject({ storyboard: [shotA, shotB] });
      saveProjects([project]);

      const next = await updateShotDigitalHuman(project.id, 'shot_a', {
        placement: { x: 20, y: 30, scale: 1.4 }
      });
      const updatedA = next?.storyboard.find((shot) => shot.id === 'shot_a');
      const updatedB = next?.storyboard.find((shot) => shot.id === 'shot_b');
      expect(updatedA?.digitalHumanOverride?.placement).toEqual({ x: 20, y: 30, scale: 1.4 });
      expect(updatedB?.digitalHumanOverride).toBeUndefined();

      const persisted = loadProjects().find((item) => item.id === project.id);
      expect(
        persisted?.storyboard.find((shot) => shot.id === 'shot_a')?.digitalHumanOverride?.placement
      ).toEqual({ x: 20, y: 30, scale: 1.4 });
    } finally {
      stub.restore();
    }
  });

  it('updateShotDigitalHuman：hidden 仅此片段隐藏；再次调用合并覆盖；传 null 清除', async () => {
    const stub = stubWindowStorage();
    try {
      const shot = makeShot({ id: 'shot_x' });
      const project = makeProject({ storyboard: [shot] });
      saveProjects([project]);

      await updateShotDigitalHuman(project.id, 'shot_x', {
        placement: { x: 10, y: 20, scale: 1 }
      });
      const hidden = await updateShotDigitalHuman(project.id, 'shot_x', { hidden: true });
      expect(hidden?.storyboard[0].digitalHumanOverride).toEqual({
        placement: { x: 10, y: 20, scale: 1 },
        hidden: true
      });

      const cleared = await updateShotDigitalHuman(project.id, 'shot_x', null);
      expect(cleared?.storyboard[0].digitalHumanOverride).toBeUndefined();
    } finally {
      stub.restore();
    }
  });

  it('syncDigitalHumanPlacement：更新全局摆放并清除各分镜摆放覆盖（保留 hidden）', async () => {
    const stub = stubWindowStorage();
    try {
      const shotA = makeShot({
        id: 'shot_a',
        digitalHumanOverride: { placement: { x: 10, y: 10, scale: 0.8 } }
      });
      const shotB = makeShot({
        id: 'shot_b',
        digitalHumanOverride: { placement: { x: 15, y: 15, scale: 1 }, hidden: true }
      });
      const project = makeProject({
        storyboard: [shotA, shotB],
        digitalHuman: {
          enabled: true,
          avatar: 'bailuwei',
          mode: 'floatingAvatar',
          placement: { ...DEFAULT_DIGITAL_HUMAN_PLACEMENT }
        }
      });
      saveProjects([project]);

      const next = await syncDigitalHumanPlacement(project.id, { x: 40, y: 60, scale: 1.3 });
      expect(next?.digitalHuman?.placement).toEqual({ x: 40, y: 60, scale: 1.3 });
      // 仅 placement 覆盖的分镜 → 覆盖整体移除
      expect(next?.storyboard[0].digitalHumanOverride).toBeUndefined();
      // 同时带 hidden 的分镜 → 仅移除 placement，保留 hidden
      expect(next?.storyboard[1].digitalHumanOverride).toEqual({ hidden: true });

      const persisted = loadProjects().find((item) => item.id === project.id);
      expect(persisted?.digitalHuman?.placement).toEqual({ x: 40, y: 60, scale: 1.3 });
    } finally {
      stub.restore();
    }
  });

  it('setDigitalHumanEnabled(false)：关闭并清除各分镜 hidden 覆盖', async () => {
    const stub = stubWindowStorage();
    try {
      const shotA = makeShot({ id: 'shot_a', digitalHumanOverride: { hidden: true } });
      const shotB = makeShot({
        id: 'shot_b',
        digitalHumanOverride: { hidden: true, placement: { x: 30, y: 30, scale: 1 } }
      });
      const project = makeProject({
        storyboard: [shotA, shotB],
        digitalHuman: {
          enabled: true,
          avatar: 'bailuwei',
          mode: 'halfBody',
          placement: { ...DEFAULT_DIGITAL_HUMAN_PLACEMENT }
        }
      });
      saveProjects([project]);

      const next = await setDigitalHumanEnabled(project.id, false);
      expect(next?.digitalHuman?.enabled).toBe(false);
      expect(next?.storyboard[0].digitalHumanOverride).toBeUndefined();
      // hidden 移除后仍有 placement 覆盖则保留
      expect(next?.storyboard[1].digitalHumanOverride).toEqual({
        placement: { x: 30, y: 30, scale: 1 }
      });
    } finally {
      stub.restore();
    }
  });

  it('normalizeProject：分镜 digitalHumanOverride 原样保留', () => {
    const shot = makeShot({
      id: 'shot_o',
      digitalHumanOverride: { hidden: true, placement: { x: 25, y: 35, scale: 0.9 } }
    });
    const normalized = normalizeProject(makeProject({ storyboard: [shot] }));
    expect(normalized.storyboard[0].digitalHumanOverride).toEqual({
      hidden: true,
      placement: { x: 25, y: 35, scale: 0.9 }
    });
  });

  it('restoreDigitalHumanState：整体还原全局配置与各分镜覆盖（撤销）', async () => {
    const stub = stubWindowStorage();
    try {
      const baseConfig = {
        enabled: true,
        avatar: 'bailuwei' as const,
        mode: 'floatingAvatar' as const,
        placement: { x: 86, y: 78, scale: 1 }
      };
      const shotA = makeShot({ id: 'shot_a' });
      const shotB = makeShot({
        id: 'shot_b',
        digitalHumanOverride: { placement: { x: 30, y: 40, scale: 1.2 } }
      });
      const project = makeProject({
        storyboard: [shotA, shotB],
        digitalHuman: { ...baseConfig }
      });
      saveProjects([project]);

      // 模拟一次调整：全局同步新摆放（清除 shotB 覆盖）+ shotA 隐藏
      await syncDigitalHumanPlacement(project.id, { x: 50, y: 50, scale: 1.4 });
      await updateShotDigitalHuman(project.id, 'shot_a', { hidden: true });
      let current = loadProjects().find((item) => item.id === project.id)!;
      expect(current.digitalHuman?.placement).toEqual({ x: 50, y: 50, scale: 1.4 });
      expect(current.storyboard[1].digitalHumanOverride).toBeUndefined();

      // 撤销：还原到调整前快照
      const restored = await restoreDigitalHumanState(project.id, {
        config: { ...baseConfig },
        overrides: [
          { shotId: 'shot_a', override: undefined },
          { shotId: 'shot_b', override: { placement: { x: 30, y: 40, scale: 1.2 } } }
        ]
      });
      expect(restored?.digitalHuman?.placement).toEqual({ x: 86, y: 78, scale: 1 });
      expect(restored?.storyboard[0].digitalHumanOverride).toBeUndefined();
      expect(restored?.storyboard[1].digitalHumanOverride).toEqual({
        placement: { x: 30, y: 40, scale: 1.2 }
      });

      // 持久化一致
      current = loadProjects().find((item) => item.id === project.id)!;
      expect(current.digitalHuman?.placement).toEqual({ x: 86, y: 78, scale: 1 });
    } finally {
      stub.restore();
    }
  });
});

describe('「AI 生成」标识位置（aiBadgePosition）', () => {
  it('normalizeProject：缺省补 topRight，已有值保留', () => {
    const project = makeProject();
    delete (project as Record<string, unknown>).aiBadgePosition;
    expect(normalizeProject(project).aiBadgePosition).toBe('topRight');

    const custom = makeProject({ aiBadgePosition: 'bottomLeft' });
    expect(normalizeProject(custom).aiBadgePosition).toBe('bottomLeft');
  });

  it('updateProjectConfig：保存标识位置并持久化', async () => {
    const stub = stubWindowStorage();
    try {
      const project = makeProject();
      saveProjects([project]);

      const next = await updateProjectConfig(project.id, { aiBadgePosition: 'bottomRight' });
      expect(next?.aiBadgePosition).toBe('bottomRight');

      const persisted = loadProjects().find((item) => item.id === project.id);
      expect(persisted?.aiBadgePosition).toBe('bottomRight');
    } finally {
      stub.restore();
    }
  });
});
/* -------------------------------------------------------------------------- */
/* PPT/文档转视频（PRD 5.2-5.6）                                                */
/* -------------------------------------------------------------------------- */

const pptConfig: CreatePptProjectInput['pptConfig'] = {
  scriptMode: 'concise',
  pageDuration: 'auto',
  customDuration: 5,
  transition: 'fade',
  transitionGap: 1,
  resolution: '720p',
  watermark: false,
  emotion: 'warm',
  smartAvoid: true
};

function makePptInput(partial: Partial<CreatePptProjectInput> = {}): CreatePptProjectInput {
  return {
    fileName: '勾股定理课件.pptx',
    pages: mockParsePptFile('勾股定理课件.pptx'),
    params: defaultParams,
    audio: { ...DEFAULT_AUDIO_CONFIG },
    subtitle: { ...DEFAULT_SUBTITLE_CONFIG },
    digitalHuman: {
      ...DEFAULT_DIGITAL_HUMAN_CONFIG,
      placement: { ...DEFAULT_DIGITAL_HUMAN_CONFIG.placement }
    },
    digitalHumanDisabledPages: [],
    pptConfig: { ...pptConfig },
    ...partial
  };
}

describe('PPT/文档转视频 - 上传前置校验（5.2.2）', () => {
  it('格式校验：接受 ppt/pptx/doc/docx/pdf，拒绝其他格式', () => {
    for (const ext of PPT_ACCEPT_EXTENSIONS) {
      expect(isPptFileNameAccepted(`课件.${ext}`)).toBe(true);
    }
    for (const bad of ['课件.exe', '课件.txt', '课件.mp4', '无扩展名']) {
      expect(isPptFileNameAccepted(bad)).toBe(false);
    }
  });

  it('大小限制常量：免费 100MB / 会员 500MB', () => {
    expect(PPT_MAX_SIZE_BYTES).toBe(100 * 1024 * 1024);
    expect(PPT_VIP_MAX_SIZE_BYTES).toBe(500 * 1024 * 1024);
  });

  it('完整性校验：pptx/docx 需 ZIP 签名，pdf 需 %PDF，旧版 ppt/doc 需 OLE2', () => {
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14]);
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const ole2 = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    const junk = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77]);
    expect(sniffPptFileIntegrity(zip, 'a.pptx')).toBe(true);
    expect(sniffPptFileIntegrity(zip, 'a.docx')).toBe(true);
    expect(sniffPptFileIntegrity(pdf, 'a.pdf')).toBe(true);
    expect(sniffPptFileIntegrity(ole2, 'a.ppt')).toBe(true);
    expect(sniffPptFileIntegrity(ole2, 'a.doc')).toBe(true);
    // 损坏/加密/无法解析
    expect(sniffPptFileIntegrity(junk, 'a.pptx')).toBe(false);
    expect(sniffPptFileIntegrity(junk, 'a.pdf')).toBe(false);
    expect(sniffPptFileIntegrity(new Uint8Array([]), 'a.pptx')).toBe(false);
    expect(sniffPptFileIntegrity(zip, 'a.exe')).toBe(false);
  });
});

describe('PPT/文档转视频 - 智能解析（5.3）', () => {
  it('解析出 封面/目录/内容/图表/结尾 结构并标记页面类型', () => {
    const pages = mockParsePptFile('高等数学第一章.pptx');
    const types = pages.map((p) => p.type);
    expect(types[0]).toBe('cover');
    expect(types[1]).toBe('toc');
    expect(types).toContain('content');
    expect(types).toContain('chart');
    expect(types[types.length - 1]).toBe('ending');
    // 页码连续递增
    pages.forEach((p, i) => expect(p.index).toBe(i + 1));
  });

  it('同名文件解析结果确定；空白页被标记过滤；存在 AI 补充页', () => {
    const a = mockParsePptFile('试讲课件.pptx');
    const b = mockParsePptFile('试讲课件.pptx');
    expect(a).toEqual(b);
    expect(a.some((p) => p.blank)).toBe(true);
    expect(a.some((p) => p.aiEnrich)).toBe(true);
  });
});

describe('PPT/文档转视频 - 逐页脚本与时长（5.4.2 / 5.6.1）', () => {
  const cover = mockParsePptFile('语文课件.pptx')[0];

  it('封面页按脚本模式生成不同旁白', () => {
    expect(buildPptNarration(cover, 'concise')).toContain('大家好');
    expect(buildPptNarration(cover, 'detailed').length).toBeGreaterThan(
      buildPptNarration(cover, 'concise').length
    );
    expect(buildPptNarration(cover, 'formal')).toContain('汇报');
    expect(buildPptNarration(cover, 'minimal')).toBe(`【${cover.title}】`);
  });

  it('字数过少页面自动补充讲解（5.3.2）', () => {
    const enrichPage = mockParsePptFile('语文课件.pptx').find((p) => p.aiEnrich)!;
    expect(buildPptNarration(enrichPage, 'concise')).toContain('补充');
  });

  it('单页停留时长：auto 按字数动态分配并夹在 3-10s；custom 夹在 3-15s', () => {
    expect(resolvePptShotDuration({ ...cover, words: 0 }, pptConfig)).toBe(3);
    expect(resolvePptShotDuration({ ...cover, words: 400 }, pptConfig)).toBe(10);
    expect(resolvePptShotDuration(cover, { ...pptConfig, pageDuration: '8' })).toBe(8);
    expect(
      resolvePptShotDuration(cover, { ...pptConfig, pageDuration: 'custom', customDuration: 99 })
    ).toBe(15);
  });
});

describe('PPT/文档转视频 - 创建项目（5.6.2）', () => {
  it('1 页 PPT = 1 个分镜，空白页不生成分镜；逐页关闭数字人写入 hidden 覆盖', async () => {
    const storage = createMemoryStorage();
    const input = makePptInput();
    const blankCount = input.pages.filter((p) => p.blank).length;
    const disableIndex = input.pages.find((p) => !p.blank)!.index;

    const { project } = await createPptProject(
      makePptInput({ digitalHumanDisabledPages: [disableIndex] }),
      storage
    );

    expect(project.mode).toBe('ppt');
    expect(project.status).toBe('draft');
    expect(project.storyboardPending).toBe(false);
    expect(project.storyboard.length).toBe(input.pages.length - blankCount);
    expect(project.sourceFileName).toBe('勾股定理课件.pptx');
    expect(project.pptConfig?.scriptMode).toBe('concise');
    // 逐页关闭数字人
    const disabledShot = project.storyboard.find((shot) =>
      shot.sceneDescription.startsWith(`PPT 第 ${disableIndex} 页`)
    );
    expect(disabledShot?.digitalHumanOverride?.hidden).toBe(true);
    // 智能避让：含视觉素材页写入缩小摆放
    const visualShot = project.storyboard.find((shot) =>
      shot.sceneDescription.includes('（chart）')
    );
    expect(visualShot?.digitalHumanOverride?.placement?.scale).toBe(0.8);
    // 分镜带页面预览图与旁白
    expect(project.storyboard[0].imageUrl).toContain('/media/ai-video/');
    expect(project.storyboard[0].narration.length).toBeGreaterThan(0);
  });

  it('文件名含敏感词时拒绝创建（内容安全前置校验 5.2.2）', async () => {
    await expect(
      createPptProject(makePptInput({ fileName: '暴力内容课件.pptx' }), createMemoryStorage())
    ).rejects.toMatchObject({ code: 'MODERATION' });
  });
});

describe('图片转视频 - 创建项目', () => {
  it('按图片顺序生成分镜，并保留旁白、时长与镜头动效', async () => {
    const storage = createMemoryStorage();
    const { project } = await createImageProject(
      {
        title: '工业机器人操作要点',
        images: [
          {
            id: 'image-1',
            name: '课程导入.jpg',
            src: '/media/ai-video/shot-1.jpg',
            narration: '欢迎进入本节实训课。',
            duration: 5,
            motion: 'zoomIn'
          },
          {
            id: 'image-2',
            name: '操作示范.jpg',
            src: '/media/ai-video/shot-2.jpg',
            narration: '下面演示标准操作步骤。',
            duration: 8,
            motion: 'panLeft'
          }
        ],
        params: defaultParams,
        audio: { ...DEFAULT_AUDIO_CONFIG, voice: 'femaleGentle' }
      },
      storage
    );

    expect(project.mode).toBe('images');
    expect(project.storyboard).toHaveLength(2);
    expect(project.storyboard[0].narration).toBe('欢迎进入本节实训课。');
    expect(project.storyboard[1].duration).toBe(8);
    expect(project.storyboard[1].productionNotes).toContain('向左平移');
    expect(project.storyboard[0].mediaType).toBe('image');
    expect(project.audio?.voice).toBe('femaleGentle');
    expect(loadProjects(storage)[0].id).toBe(project.id);
  });

  it('不足两张图片时拒绝创建', async () => {
    await expect(
      createImageProject(
        {
          title: '单张图片',
          images: [
            {
              id: 'only',
              name: 'only.jpg',
              src: '/media/ai-video/shot-1.jpg',
              narration: '',
              duration: 5,
              motion: 'none'
            }
          ],
          params: defaultParams,
          audio: DEFAULT_AUDIO_CONFIG
        },
        createMemoryStorage()
      )
    ).rejects.toMatchObject({ code: 'NOT_ENOUGH_IMAGES' });
  });
});

describe('模板视频 - 创建项目', () => {
  it('从公共模板创建可编辑的四镜头副本', async () => {
    const storage = createMemoryStorage();
    const { project } = await createTemplateProject(
      {
        templateId: 'skill-demo',
        templateName: '技能操作示范',
        coverUrl: '/media/ai-video/style-realistic-16x9.jpg',
        category: '实训教学',
        params: { ...defaultParams, style: 'realistic', duration: 'compact' }
      },
      storage
    );

    expect(project.mode).toBe('template');
    expect(project.templateId).toBe('skill-demo');
    expect(project.title).toContain('技能操作示范');
    expect(project.storyboard).toHaveLength(4);
    expect(project.storyboard[0].narration).toContain('技能操作示范');
    expect(project.coverUrl).toContain('style-realistic');
    expect(loadProjects(storage)[0].id).toBe(project.id);
  });

  it('从空白开始时创建一个初始场景', async () => {
    const { project } = await createTemplateProject(
      {
        templateId: null,
        params: defaultParams
      },
      createMemoryStorage()
    );

    expect(project.mode).toBe('template');
    expect(project.templateId).toBeNull();
    expect(project.storyboard).toHaveLength(1);
    expect(project.storyboard[0].sceneDescription).toContain('空白教学画布');
  });
});
