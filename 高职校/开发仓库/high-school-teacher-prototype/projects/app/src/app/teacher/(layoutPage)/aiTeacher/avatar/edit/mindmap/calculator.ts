import type { MindmapNode, NodeType } from '../constants';
import { PRIMARY_COLOR, INFO_COLOR, SUCCESS_COLOR, WARNING_COLOR } from '../constants';
import type { NodeColor, NodeSize } from './types';

// 获取节点颜色
export function getNodeColor(type: NodeType): NodeColor {
  switch (type) {
    case 'course':
      return { bg: PRIMARY_COLOR, text: 'white', border: PRIMARY_COLOR };
    case 'chapter':
      return { bg: INFO_COLOR, text: 'white', border: INFO_COLOR };
    case 'section':
      return { bg: SUCCESS_COLOR, text: 'white', border: SUCCESS_COLOR };
    case 'knowledge':
      return { bg: 'white', text: 'gray.700', border: WARNING_COLOR };
  }
}

// 获取节点大小
export function getNodeSize(type: NodeType): NodeSize {
  switch (type) {
    case 'course':
      return { radius: 45, width: 90, height: 90 };
    case 'chapter':
      return { radius: 35, width: 70, height: 70 };
    case 'section':
      return { radius: 28, width: 56, height: 56 };
    case 'knowledge':
      return { radius: 60, width: 120, height: 40 };
  }
}

// 计算每个节点的后代数量
export function calculateDescendantCount(node: MindmapNode): number {
  if (!node.expanded || !node.children || node.children.length === 0) {
    return 1;
  }
  let count = 0;
  node.children.forEach((child) => {
    count += calculateDescendantCount(child);
  });
  return count;
}

// 构建所有节点的后代数量映射
export function buildDescendantCounts(node: MindmapNode): Map<string, number> {
  const descendantCounts = new Map<string, number>();

  const build = (n: MindmapNode) => {
    const count = calculateDescendantCount(n);
    descendantCounts.set(n.id, count);
    if (n.children) {
      n.children.forEach(build);
    }
  };

  build(node);
  return descendantCounts;
}
