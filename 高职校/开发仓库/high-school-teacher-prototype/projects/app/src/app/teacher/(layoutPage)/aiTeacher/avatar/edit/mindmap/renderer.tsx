import type { MindmapNode } from '../constants';
import { PRIMARY_COLOR } from '../constants';
import { getNodeColor, getNodeSize } from './calculator';

// 渲染连线
export function renderLinks(
  node: MindmapNode,
  x: number,
  y: number,
  descendantCounts: Map<string, number>
): JSX.Element[] {
  const links: JSX.Element[] = [];

  if (node.expanded && node.children && node.children.length > 0) {
    const levelWidth = 240;
    const nodeHeight = 80;
    const fromSize = getNodeSize(node.type);
    const childX = x + levelWidth;

    // 计算所有子节点的总高度
    let childrenTotalHeight = 0;
    node.children.forEach((child) => {
      const childDescendants = descendantCounts.get(child.id) || 1;
      childrenTotalHeight += childDescendants * nodeHeight;
    });

    let currentY = y - childrenTotalHeight / 2;

    node.children.forEach((child) => {
      const toSize = getNodeSize(child.type);
      const childDescendants = descendantCounts.get(child.id) || 1;
      const childHeight = childDescendants * nodeHeight;
      const childY = currentY + childHeight / 2;

      const startX = x + fromSize.radius;
      const endX = childX - toSize.radius;
      const controlX1 = startX + (endX - startX) / 2;
      const controlX2 = endX - (endX - startX) / 2;

      const path = `M ${startX} ${y} C ${controlX1} ${y}, ${controlX2} ${childY}, ${endX} ${childY}`;

      links.push(
        <path
          key={`link-${node.id}-${child.id}`}
          d={path}
          stroke="#CBD5E1"
          strokeWidth="2"
          fill="none"
        />
      );

      const childLinks = renderLinks(child, childX, childY, descendantCounts);
      links.push(...childLinks);

      currentY += childHeight;
    });
  }

  return links;
}

// 渲染节点
export function renderNodes(
  node: MindmapNode,
  x: number,
  y: number,
  onToggle: (id: string) => void,
  descendantCounts: Map<string, number>
): JSX.Element[] {
  const nodes: JSX.Element[] = [];
  const colors = getNodeColor(node.type);
  const size = getNodeSize(node.type);
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = node.expanded !== false;

  // 渲染当前节点
  if (node.type === 'knowledge') {
    // 知识点用圆角矩形
    nodes.push(
      <g key={node.id}>
        <rect
          x={x - size.width / 2}
          y={y - size.height / 2}
          width={size.width}
          height={size.height}
          rx="20"
          fill={colors.bg}
          stroke={colors.border}
          strokeWidth="2"
          filter="url(#shadow)"
        />
        <text x={x} y={y + 4} textAnchor="middle" fill={colors.text} fontSize="11" fontWeight="500">
          {node.name}
        </text>
      </g>
    );
  } else {
    // 其他节点用圆形
    nodes.push(
      <g key={node.id}>
        <circle cx={x} cy={y} r={size.radius} fill={colors.bg} filter="url(#shadow)" />
        <text
          x={x}
          y={node.subtitle ? y - 3 : y + 4}
          textAnchor="middle"
          fill={colors.text}
          fontSize={node.type === 'course' ? '13' : '11'}
          fontWeight={node.type === 'course' ? '600' : '500'}
        >
          {node.name}
        </text>
        {node.subtitle && (
          <text x={x} y={y + 12} textAnchor="middle" fill={colors.text} fontSize="9" opacity="0.8">
            {node.subtitle}
          </text>
        )}
      </g>
    );
  }

  // 渲染展开/收起按钮
  if (hasChildren) {
    const btnX = x + size.radius + 15;
    nodes.push(
      <g key={`expand-${node.id}`} onClick={() => onToggle(node.id)} style={{ cursor: 'pointer' }}>
        <circle cx={btnX} cy={y} r="10" fill="white" stroke="#CBD5E1" strokeWidth="1" />
        <text
          x={btnX}
          y={y + 1}
          textAnchor="middle"
          fill={isExpanded ? '#64748B' : PRIMARY_COLOR}
          fontSize="12"
          fontWeight="bold"
        >
          {isExpanded ? '−' : '+'}
        </text>
        {!isExpanded && (
          <>
            <circle cx={btnX + 14} cy={y - 10} r="8" fill={PRIMARY_COLOR} />
            <text
              x={btnX + 14}
              y={y - 6}
              textAnchor="middle"
              fill="white"
              fontSize="9"
              fontWeight="bold"
            >
              {node.children!.length}
            </text>
          </>
        )}
      </g>
    );
  }

  // 递归渲染子节点
  if (isExpanded && hasChildren) {
    const levelWidth = 240;
    const nodeHeight = 80;
    const childX = x + levelWidth;

    // 计算所有子节点的总高度
    let childrenTotalHeight = 0;
    node.children!.forEach((child) => {
      const childDescendants = descendantCounts.get(child.id) || 1;
      childrenTotalHeight += childDescendants * nodeHeight;
    });

    let currentY = y - childrenTotalHeight / 2;

    node.children!.forEach((child) => {
      const childDescendants = descendantCounts.get(child.id) || 1;
      const childHeight = childDescendants * nodeHeight;
      const childY = currentY + childHeight / 2;

      const childNodes = renderNodes(child, childX, childY, onToggle, descendantCounts);
      nodes.push(...childNodes);

      currentY += childHeight;
    });
  }

  return nodes;
}
