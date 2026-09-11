import type {
  AiAvatarChapterVO,
  AiAvatarMaterialVO,
  KnowledgePointVO
} from '@/teacher/types/aiTeacher';

export type GraphLayoutType = 'radial' | 'circular';

export type GraphNodeType = 'course' | 'chapter' | 'section' | 'knowledge';
export type GraphRelationType = 'contains' | 'relates';

export interface GraphNode {
  id: string;
  name: string;
  nodeType: GraphNodeType;
  depth: number;
  code?: string;
  description?: string;
  status?: 'published' | 'draft';
  parentId?: string;
  parentTitle?: string;
  childrenCount?: number;
  materials?: AiAvatarMaterialVO[];
  stats?: { chapters: number; sections: number; knowledges: number };
  [key: string]: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  weight?: number;
  relationType: GraphRelationType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// 节点颜色映射：课程红、章节橙、小节绿、知识点蓝
export const NODE_TYPE_COLORS: Record<
  GraphNodeType,
  { fill: string; stroke: string; text: string }
> = {
  course: {
    fill: '#C8000B',
    stroke: '#9A0008',
    text: '#FFFFFF'
  },
  chapter: {
    fill: '#D97706',
    stroke: '#B45309',
    text: '#FFFFFF'
  },
  section: {
    fill: '#059669',
    stroke: '#047857',
    text: '#FFFFFF'
  },
  knowledge: {
    fill: '#2563EB',
    stroke: '#1D4ED8',
    text: '#FFFFFF'
  }
};

export const NODE_TYPE_LABELS: Record<GraphNodeType, string> = {
  course: '课程',
  chapter: '章节',
  section: '小节',
  knowledge: '知识点'
};

// 关系色值与画布共用，确保图例、连线和标签一致。
export const EDGE_RELATION_STYLES: Record<
  GraphRelationType,
  { label: string; color: string; background: string; dash?: number[]; directional: boolean }
> = {
  contains: {
    label: '包含',
    color: '#0F766E',
    background: '#ECFDF5',
    directional: true
  },
  relates: {
    label: '关联',
    color: '#7C3AED',
    background: '#F5F3FF',
    dash: [6, 4],
    directional: false
  }
};

/**
 * 将 AiAvatarChapterVO 数组转换为 G6 图谱数据
 */
export function convertChaptersToGraphData(
  courseName: string,
  chapters: AiAvatarChapterVO[]
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let edgeId = 0;

  // 课程根节点
  const courseId = 'course-root';
  nodes.push({
    id: courseId,
    name: courseName || '课程',
    nodeType: 'course',
    depth: 0,
    code: 'COURSE-001',
    description: '课程知识图谱根节点，汇总章节、小节、知识点与关联教学资源。',
    status: 'published',
    childrenCount: chapters.length
  });

  const processChapter = (
    chapter: AiAvatarChapterVO,
    parentId: string,
    parentTitle: string,
    depth: number
  ) => {
    const nodeId = `chapter-${chapter.id}`;
    const childrenCount = (chapter.children?.length || 0) + (chapter.knowledgePoints?.length || 0);

    nodes.push({
      id: nodeId,
      name: chapter.title || '无标题',
      nodeType: depth === 1 ? 'chapter' : 'section',
      depth,
      code: (depth === 1 ? 'CH-' : 'SEC-') + String(chapter.id).replace(/\D/g, '').padStart(3, '0'),
      description:
        depth === 1
          ? '本章节围绕“' + (chapter.title || '无标题') + '”组织知识讲解、案例与实训资源。'
          : '本小节聚焦“' + (chapter.title || '无标题') + '”的核心概念与岗位应用。',
      status: 'published',
      parentId,
      parentTitle,
      childrenCount,
      openMode: chapter.openMode,
      openTime: chapter.openTime,
      materials: chapter.materialList || []
    });

    edges.push({
      id: `edge-${edgeId++}`,
      source: parentId,
      target: nodeId,
      label: '包含',
      weight: 1,
      relationType: 'contains'
    });

    // 处理子章节
    if (chapter.children && chapter.children.length > 0) {
      chapter.children.forEach((child) => {
        processChapter(child, nodeId, chapter.title || '无标题', depth + 1);
      });
    }

    // 处理知识点
    if (chapter.knowledgePoints && chapter.knowledgePoints.length > 0) {
      chapter.knowledgePoints.forEach((kp, index) => {
        const kpName = typeof kp === 'string' ? kp : kp.name;
        const kpId = typeof kp === 'string' ? `${nodeId}-kp-${index}` : `kp-${kp.id}`;

        nodes.push({
          id: kpId,
          name: kpName || '未命名知识点',
          nodeType: 'knowledge',
          depth: depth + 1,
          code:
            'KP-' +
            String(typeof kp === 'string' ? chapter.id * 10 + index + 1 : kp.id).padStart(3, '0'),
          description:
            '掌握“' + (kpName || '未命名知识点') + '”的基本概念、判断依据、规范要求及实训应用。',
          status: 'published',
          parentId: nodeId,
          parentTitle: chapter.title || '无标题',
          materials: chapter.materialList || []
        });

        edges.push({
          id: `edge-${edgeId++}`,
          source: nodeId,
          target: kpId,
          label: '包含',
          weight: 1,
          relationType: 'contains'
        });
      });
    }
  };

  chapters.forEach((chapter) => {
    processChapter(chapter, courseId, courseName || '课程', 1);
  });

  // 课程根节点统计信息，用于明细面板展示
  const courseNode = nodes.find((n) => n.id === courseId);
  if (courseNode) {
    const allMaterials = nodes.flatMap((node) => node.materials || []);
    courseNode.materials = Array.from(
      new Map(allMaterials.map((material) => [material.id, material])).values()
    );
    courseNode.stats = {
      chapters: nodes.filter((n) => n.nodeType === 'chapter').length,
      sections: nodes.filter((n) => n.nodeType === 'section').length,
      knowledges: nodes.filter((n) => n.nodeType === 'knowledge').length
    };
  }

  // 为同一章节/节下的相邻知识点添加交叉关联，形成网状结构
  const knowledgeNodes = nodes.filter((n) => n.nodeType === 'knowledge');
  const knowledgeByParent = new Map<string, string[]>();
  knowledgeNodes.forEach((kp) => {
    if (kp.parentId) {
      const list = knowledgeByParent.get(kp.parentId) || [];
      list.push(kp.id);
      knowledgeByParent.set(kp.parentId, list);
    }
  });

  knowledgeByParent.forEach((kpIds) => {
    if (kpIds.length < 2) return;
    for (let i = 0; i < kpIds.length - 1; i++) {
      // 相邻知识点添加关联边
      edges.push({
        id: `edge-${edgeId++}`,
        source: kpIds[i],
        target: kpIds[i + 1],
        label: '关联',
        weight: 0.6,
        relationType: 'relates'
      });
    }
  });

  return { nodes, edges };
}

/**
 * 获取节点样式
 */
export function getNodeStyleByType(type: GraphNodeType) {
  return NODE_TYPE_COLORS[type] || NODE_TYPE_COLORS.knowledge;
}

/**
 * 根据节点类型过滤数据
 */
export function filterGraphDataByNodeTypes(data: GraphData, types: GraphNodeType[]): GraphData {
  if (!types || types.length === 0) return data;

  const nodeIds = new Set(data.nodes.filter((n) => types.includes(n.nodeType)).map((n) => n.id));
  const filteredNodes = data.nodes.filter((n) => nodeIds.has(n.id));
  const filteredEdges = data.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  return { nodes: filteredNodes, edges: filteredEdges };
}

/**
 * 根据搜索关键词过滤数据
 */
export function filterGraphDataByKeyword(data: GraphData, keyword: string): GraphData {
  if (!keyword.trim()) return data;

  const lower = keyword.toLowerCase();
  const matchedNodeIds = new Set(
    data.nodes.filter((n) => n.name.toLowerCase().includes(lower)).map((n) => n.id)
  );

  // 同时包含匹配节点的上下游节点
  const relatedIds = new Set(matchedNodeIds);
  data.edges.forEach((e) => {
    if (matchedNodeIds.has(e.source)) relatedIds.add(e.target);
    if (matchedNodeIds.has(e.target)) relatedIds.add(e.source);
  });

  const filteredNodes = data.nodes.filter((n) => relatedIds.has(n.id));
  const filteredEdges = data.edges.filter(
    (e) => relatedIds.has(e.source) && relatedIds.has(e.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges };
}

/**
 * 获取节点的关联节点（上下游）
 */
export function getRelatedNodes(
  data: GraphData,
  nodeId: string
): { upstream: GraphNode[]; downstream: GraphNode[] } {
  const upstreamIds = new Set<string>();
  const downstreamIds = new Set<string>();

  data.edges.forEach((e) => {
    if (e.target === nodeId) upstreamIds.add(e.source);
    if (e.source === nodeId) downstreamIds.add(e.target);
  });

  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

  return {
    upstream: Array.from(upstreamIds).map((id) => nodeMap.get(id)!),
    downstream: Array.from(downstreamIds).map((id) => nodeMap.get(id)!)
  };
}

/**
 * 获取节点的关系统计
 */
export function getNodeStatistics(data: GraphData, nodeId: string) {
  let inDegree = 0;
  let outDegree = 0;

  data.edges.forEach((e) => {
    if (e.target === nodeId) inDegree++;
    if (e.source === nodeId) outDegree++;
  });

  return { inDegree, outDegree, total: inDegree + outDegree };
}

/**
 * 构建树形目录数据
 */
export function buildTreeData(chapters: AiAvatarChapterVO[]) {
  return chapters.map((ch) => ({
    id: `chapter-${ch.id}`,
    title: ch.title,
    nodeType: 'chapter' as GraphNodeType,
    children: [
      ...(ch.children || []).map((s) => ({
        id: `chapter-${s.id}`,
        title: s.title,
        nodeType: 'section' as GraphNodeType,
        children: (s.knowledgePoints || []).map((kp, i) => ({
          id: typeof kp === 'string' ? `chapter-${s.id}-kp-${i}` : `kp-${kp.id}`,
          title: typeof kp === 'string' ? kp : kp.name,
          nodeType: 'knowledge' as GraphNodeType
        }))
      })),
      ...(ch.knowledgePoints || []).map((kp, i) => ({
        id: typeof kp === 'string' ? `chapter-${ch.id}-kp-${i}` : `kp-${kp.id}`,
        title: typeof kp === 'string' ? kp : kp.name,
        nodeType: 'knowledge' as GraphNodeType
      }))
    ]
  }));
}
