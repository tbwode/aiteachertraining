/**
 * 岗位能力图谱 Mock 数据层单元测试
 * 覆盖：权重校验 / 发布闸门 / 版本发布 / 废弃语义 / 编码生成 / diff / AI 解析转换 / store 隔离
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { AbilityGraph } from '@/app/admin/(layoutPage)/graph/ability/_mock/types';
import {
  cleanTree,
  computeDiff,
  countNodes,
  createDraftGraph,
  getGraph,
  getPublishGate,
  listGraphs,
  mockParseJobDocs,
  nextAbilityCode,
  nextKnowledgeCode,
  nextTaskCode,
  nextVersion,
  parsedTreeToTasks,
  publishGraph,
  resetStore,
  validateWeights,
  withDeprecationResolved,
  withNodeMoved,
  withNodeRemoved
} from '@/app/admin/(layoutPage)/graph/ability/_mock/store';

const g1 = () => {
  const graph = getGraph('g1');
  if (!graph) throw new Error('g1 不存在');
  return graph;
};

beforeEach(() => {
  resetStore();
});

describe('validateWeights 权重校验', () => {
  it('g1 草稿无权重问题（B3 废弃子树被跳过）；改坏 B1-1 后报 1 条 sum=110', () => {
    expect(validateWeights(g1().tasks)).toEqual([]);

    const broken: AbilityGraph = JSON.parse(JSON.stringify(g1()));
    const b1 = broken.tasks.find((t) => t.code === 'B')!.abilities.find((a) => a.code === 'B1')!;
    b1.knowledges[0].weight = 70;
    const issues = validateWeights(broken.tasks);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ abilityCode: 'B1', sum: 110 });
  });
});

describe('getPublishGate 发布闸门', () => {
  it('g1 因 pending 废弃项不 ok；g2 ok', () => {
    const gate1 = getPublishGate(g1());
    expect(gate1.ok).toBe(false);
    expect(gate1.reasons.some((r) => r.kind === 'deprecation')).toBe(true);

    const g2 = getGraph('g2')!;
    expect(getPublishGate(g2).ok).toBe(true);
  });
});

describe('publishGraph 发布', () => {
  it('g1 有 pending 废弃项时返回 null，store 不变', () => {
    expect(publishGraph(g1(), '测试发布')).toBeNull();
    expect(getGraph('g1')!.currentVersion).toBe('v2.3');
  });

  it('废弃项处理后发布成功：版本推进、快照清理、diff 正确', () => {
    const handled = withDeprecationResolved(g1(), 'B3', 'handled');
    const published = publishGraph(handled, 'AI 生成审核发布');
    expect(published).not.toBeNull();
    expect(published!.currentVersion).toBe('v2.4');
    expect(published!.status).toBe('published');

    const v24 = published!.versions.find((v) => v.version === 'v2.4')!;
    expect(v24.status).toBe('current');
    expect(v24.deprecations[0]).toMatchObject({ code: 'B3', status: 'handled' });
    expect(v24.diff.added).toEqual(expect.arrayContaining(['B5', 'B5-1', 'B5-2']));
    expect(v24.diff.deprecated).toEqual(expect.arrayContaining(['B3', 'B3-1', 'B3-2']));

    const v23 = published!.versions.find((v) => v.version === 'v2.3')!;
    expect(v23.status).toBe('archived');

    const taskB = published!.tasks.find((t) => t.code === 'B')!;
    expect(taskB.abilities.some((a) => a.code === 'B3')).toBe(false);
    const b5 = taskB.abilities.find((a) => a.code === 'B5')!;
    expect(b5.status).toBe('active');
    expect(b5.knowledges.every((k) => k.status === 'active')).toBe(true);
    expect(validateWeights(v24.snapshot)).toEqual([]);
  });
});

describe('withNodeRemoved 删除语义', () => {
  it('删 new 节点（B5）→ 硬删，草稿 deprecations 不新增', () => {
    const next = withNodeRemoved(g1(), 'B5');
    const taskB = next.tasks.find((t) => t.code === 'B')!;
    expect(taskB.abilities.some((a) => a.code === 'B5')).toBe(false);
    const draft = next.versions.find((v) => v.status === 'draft')!;
    expect(draft.deprecations).toHaveLength(1);
    expect(draft.deprecations[0].code).toBe('B3');
  });

  it('删 active 节点（B2）→ 级联 deprecated，草稿 deprecations +1 pending', () => {
    const next = withNodeRemoved(g1(), 'B2');
    const taskB = next.tasks.find((t) => t.code === 'B')!;
    const b2 = taskB.abilities.find((a) => a.code === 'B2')!;
    expect(b2.status).toBe('deprecated');
    expect(b2.knowledges.every((k) => k.status === 'deprecated')).toBe(true);

    const draft = next.versions.find((v) => v.status === 'draft')!;
    expect(draft.deprecations).toHaveLength(2);
    expect(draft.deprecations.every((d) => d.status === 'pending')).toBe(true);
    expect(draft.deprecations.map((d) => d.code)).toEqual(['B3', 'B2']);
    expect(validateWeights(next.tasks)).toEqual([]);
  });

  it('已发布图谱（无草稿版本）删除节点 → 自动创建草稿版本', () => {
    const g2 = getGraph('g2')!;
    const next = withNodeRemoved(g2, 'A1');
    const draft = next.versions.find((v) => v.status === 'draft')!;
    expect(draft.version).toBe('v1.7');
    expect(draft.deprecations).toHaveLength(1);
    expect(draft.deprecations[0]).toMatchObject({ code: 'A1', status: 'pending' });
  });
});

describe('编码与版本号生成', () => {
  it('nextTaskCode / nextAbilityCode / nextKnowledgeCode / nextVersion', () => {
    const graph = g1();
    expect(nextTaskCode(graph.tasks)).toBe('D');
    const taskB = graph.tasks.find((t) => t.code === 'B')!;
    expect(nextAbilityCode(taskB)).toBe('B6');
    const a1 = graph.tasks.find((t) => t.code === 'A')!.abilities.find((a) => a.code === 'A1')!;
    expect(nextKnowledgeCode(a1)).toBe('A1-4');
    expect(nextVersion('v2.3')).toBe('v2.4');
    expect(nextVersion('')).toBe('v1.0');
  });
});

describe('computeDiff', () => {
  it('v2.3 快照 vs 清理后 v2.4：added/deprecated 正确、modified 为空', () => {
    const graph = g1();
    const v23 = graph.versions.find((v) => v.version === 'v2.3')!;
    const diff = computeDiff(v23.snapshot, cleanTree(graph.tasks));
    expect(diff.added).toEqual(expect.arrayContaining(['B5', 'B5-1', 'B5-2']));
    expect(diff.deprecated).toEqual(expect.arrayContaining(['B3', 'B3-1', 'B3-2']));
    expect(diff.modified).toEqual([]);
  });
});

describe('AI 解析与转换', () => {
  it('mockParseJobDocs 含 2 个低置信节点；parsedTreeToTasks 剔除 excluded 且 status 全 new', () => {
    const parsed = mockParseJobDocs([]);
    const low: string[] = [];
    parsed.forEach((t) => {
      if (t.confidence === 'low') low.push(t.code);
      t.abilities.forEach((a) => {
        if (a.confidence === 'low') low.push(a.code);
        a.knowledges.forEach((k) => {
          if (k.confidence === 'low') low.push(k.code);
        });
      });
    });
    expect(low).toEqual(expect.arrayContaining(['B2-2', 'C2-1']));
    expect(low).toHaveLength(2);

    const copy = JSON.parse(JSON.stringify(parsed)) as typeof parsed;
    const b2 = copy.find((t) => t.code === 'B')!.abilities.find((a) => a.code === 'B2')!;
    b2.knowledges.find((k) => k.code === 'B2-2')!.excluded = true;
    // 剔除后同能力权重不再满 100，按向导流程把剩余知识点调满
    b2.knowledges.find((k) => k.code === 'B2-1')!.weight = 100;
    const tasks = parsedTreeToTasks(copy, 'gx');
    const allCodes: string[] = [];
    const allStatus: string[] = [];
    tasks.forEach((t) => {
      allCodes.push(t.code);
      allStatus.push(t.status);
      t.abilities.forEach((a) => {
        allCodes.push(a.code);
        allStatus.push(a.status);
        a.knowledges.forEach((k) => {
          allCodes.push(k.code);
          allStatus.push(k.status);
          expect(k.id).toBe(`gx-${k.code}`);
        });
      });
    });
    expect(allCodes).not.toContain('B2-2');
    expect(new Set(allStatus)).toEqual(new Set(['new']));
    expect(validateWeights(tasks)).toEqual([]);
  });
});

describe('withNodeMoved 排序', () => {
  it('边界不变与交换', () => {
    const graph = g1();
    const before = graph.tasks.find((t) => t.code === 'A')!.abilities.map((a) => a.code);
    expect(before).toEqual(['A1', 'A2']);

    const up = withNodeMoved(graph, 'A1', 'up');
    expect(up.tasks.find((t) => t.code === 'A')!.abilities.map((a) => a.code)).toEqual(['A1', 'A2']);

    const down = withNodeMoved(graph, 'A1', 'down');
    expect(down.tasks.find((t) => t.code === 'A')!.abilities.map((a) => a.code)).toEqual(['A2', 'A1']);
    expect(graph.tasks.find((t) => t.code === 'A')!.abilities.map((a) => a.code)).toEqual(['A1', 'A2']);
  });
});

describe('store 状态', () => {
  it('createDraftGraph 注册新图谱；resetStore 还原', () => {
    expect(listGraphs()).toHaveLength(6);
    const created = createDraftGraph({
      jobName: '测试岗位',
      majorDirection: '新能源汽车技术',
      sourceDocs: [],
      buildTasks: () => []
    });
    expect(created.id).toBe('g101');
    expect(created.status).toBe('draft');
    expect(created.currentVersion).toBe('');
    expect(listGraphs()).toHaveLength(7);
    expect(listGraphs()[0].id).toBe('g101');

    resetStore();
    expect(listGraphs()).toHaveLength(6);
  });

  it('resetStore 后种子数据还原（B3 恢复 pending）', () => {
    withDeprecationResolved(g1(), 'B3', 'handled');
    resetStore();
    const draft = getGraph('g1')!.versions.find((v) => v.status === 'draft')!;
    expect(draft.deprecations[0].status).toBe('pending');
  });

  it('countNodes 统计三级节点数', () => {
    expect(countNodes(g1().tasks)).toEqual({ tasks: 3, abilities: 7, knowledges: 15 });
  });
});
