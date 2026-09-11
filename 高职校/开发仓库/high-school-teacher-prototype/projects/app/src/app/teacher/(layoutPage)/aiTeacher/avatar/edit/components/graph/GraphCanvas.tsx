'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type ForwardRefRenderFunction
} from 'react';
import { Box } from '@chakra-ui/react';
import type { GraphNode, GraphEdge, GraphLayoutType } from './utils';
import { EDGE_RELATION_STYLES, getNodeStyleByType } from './utils';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layoutType: GraphLayoutType;
  onNodeToggle?: (nodeId: string) => void;
  onNodeSelect?: (node: GraphNode | null) => void;
  collapsedNodes?: Set<string>;
}

export interface GraphCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  clearSelection: () => void;
  selectNode: (nodeId: string) => void;
}

const GraphCanvasInner: ForwardRefRenderFunction<GraphCanvasRef, GraphCanvasProps> =
  function GraphCanvas(
    { nodes, edges, layoutType, onNodeToggle, onNodeSelect, collapsedNodes = new Set() },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const selectedNodeIdRef = useRef<string | null>(null);
    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;
    const edgesRef = useRef(edges);
    edgesRef.current = edges;
    const onNodeToggleRef = useRef(onNodeToggle);
    onNodeToggleRef.current = onNodeToggle;
    const onNodeSelectRef = useRef(onNodeSelect);
    onNodeSelectRef.current = onNodeSelect;
    const collapsedNodesRef = useRef(collapsedNodes);
    collapsedNodesRef.current = collapsedNodes;

    // 暴露缩放方法给父组件
    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (graphRef.current) {
          const currentZoom = graphRef.current.getZoom?.() || 1;
          graphRef.current.zoomTo?.(currentZoom * 1.2);
        }
      },
      zoomOut: () => {
        if (graphRef.current) {
          const currentZoom = graphRef.current.getZoom?.() || 1;
          graphRef.current.zoomTo?.(currentZoom / 1.2);
        }
      },
      resetZoom: () => {
        if (graphRef.current) {
          graphRef.current.fitView?.({ padding: 40 });
        }
      },
      clearSelection: () => {
        const prevId = selectedNodeIdRef.current;
        selectedNodeIdRef.current = null;
        if (graphRef.current && prevId) {
          try {
            graphRef.current.setElementState({ [prevId]: [] }, false);
          } catch (e) {
            // ignore
          }
        }
      },
      selectNode: (nodeId: string) => {
        if (!graphRef.current || !nodesRef.current.some((node) => node.id === nodeId)) return;
        const prevId = selectedNodeIdRef.current;
        selectedNodeIdRef.current = nodeId;
        try {
          const states: Record<string, string[]> = { [nodeId]: ['selected'] };
          if (prevId && prevId !== nodeId) states[prevId] = [];
          graphRef.current.setElementState(states, false);
          graphRef.current.focusElement?.(nodeId, { duration: 300 });
        } catch {
          // Graph state can be unavailable briefly while layout data is refreshing.
        }
      }
    }));

    // 初始化 G6 图
    useEffect(() => {
      let graph: any = null;

      const initGraph = async () => {
        if (!containerRef.current || graphRef.current) return;

        const { Graph } = await import('@antv/g6');

        graph = new Graph({
          container: containerRef.current,
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || 700,
          padding: 40,
          data: {
            nodes: nodesRef.current,
            edges: edgesRef.current
          },
          node: {
            type: 'circle',
            style: {
              fill: (d: GraphNode) => getNodeStyleByType(d.nodeType).fill,
              stroke: (d: GraphNode) => getNodeStyleByType(d.nodeType).stroke,
              lineWidth: (d: GraphNode) => (d.nodeType === 'course' ? 3 : 2),
              labelText: (d: GraphNode) => {
                const name = d.name.length > 8 ? d.name.slice(0, 8) + '…' : d.name;
                const hasChildren = (d.childrenCount || 0) > 0;
                if (hasChildren) {
                  const isCollapsed = collapsedNodesRef.current.has(d.id);
                  return isCollapsed ? `${name} +` : `${name} −`;
                }
                return name;
              },
              labelFill: '#1F2937',
              labelFontSize: (d: GraphNode) =>
                d.nodeType === 'course' ? 13 : d.nodeType === 'chapter' ? 11 : 10,
              labelFontWeight: (d: GraphNode) => (d.nodeType === 'course' ? 700 : 600),
              labelBackground: true,
              labelBackgroundFill: '#FFFFFF',
              labelBackgroundOpacity: 0.95,
              labelBackgroundPadding: [4, 6],
              labelBackgroundRadius: 6,
              labelOffsetY: (d: GraphNode) => {
                if (d.nodeType === 'course') return 22;
                if (d.nodeType === 'chapter') return 16;
                if (d.nodeType === 'section') return 14;
                return 12;
              },
              size: (d: GraphNode) => {
                if (d.nodeType === 'course') return 56;
                if (d.nodeType === 'chapter') return 40;
                if (d.nodeType === 'section') return 30;
                return 22;
              },
              cursor: 'pointer',
              shadowColor: (d: GraphNode) => {
                const base = getNodeStyleByType(d.nodeType).fill;
                return d.nodeType === 'course' ? `${base}60` : `${base}25`;
              },
              shadowBlur: (d: GraphNode) => (d.nodeType === 'course' ? 32 : 14),
              shadowOffsetX: 0,
              shadowOffsetY: 0
            },
            state: {
              selected: {
                lineWidth: 4,
                stroke: '#C8000B',
                shadowColor: 'rgba(200,0,11,0.35)',
                shadowBlur: 20,
                shadowOffsetY: 0
              },
              hover: {
                lineWidth: 3,
                stroke: '#C8000B',
                shadowColor: 'rgba(200,0,11,0.25)',
                shadowBlur: 16,
                shadowOffsetY: 0
              },
              inactive: {
                opacity: 0.12,
                shadowBlur: 0
              }
            }
          },
          edge: {
            type: 'line',
            style: {
              stroke: (d: GraphEdge) => EDGE_RELATION_STYLES[d.relationType].color,
              lineWidth: (d: GraphEdge) =>
                d.relationType === 'relates' ? 1.4 : Math.max(1.5, (d.weight || 1) * 1.5),
              opacity: (d: GraphEdge) => (d.relationType === 'relates' ? 0.62 : 0.72),
              lineDash: (d: GraphEdge) => EDGE_RELATION_STYLES[d.relationType].dash,
              endArrow: (d: GraphEdge) => EDGE_RELATION_STYLES[d.relationType].directional,
              endArrowSize: 5,
              endArrowFill: (d: GraphEdge) => EDGE_RELATION_STYLES[d.relationType].color,
              labelText: (d: GraphEdge) => d.label || '',
              labelFill: (d: GraphEdge) => EDGE_RELATION_STYLES[d.relationType].color,
              labelFontSize: 8,
              labelFontWeight: 400,
              labelBackground: true,
              labelBackgroundFill: '#FAFAFA',
              labelBackgroundOpacity: 0.7,
              labelBackgroundPadding: [2, 4],
              labelBackgroundRadius: 3,
              labelAutoRotate: true,
              curveOffset: (d: GraphEdge) => (d.relationType === 'relates' ? 40 : 20),
              cursor: 'pointer'
            },
            state: {
              selected: {
                stroke: '#C8000B',
                lineWidth: 2.5,
                endArrowFill: '#C8000B',
                labelFill: '#C8000B'
              },
              active: {
                stroke: '#C8000B',
                lineWidth: 2.5,
                endArrowFill: '#C8000B',
                labelFill: '#C8000B'
              },
              inactive: {
                opacity: 0.08
              }
            }
          },
          layout: getLayoutConfig(layoutType),
          behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element', 'hover-activate'],
          plugins: [
            {
              type: 'minimap',
              size: [180, 120],
              position: 'top-right',
              padding: 10,
              containerStyle: {
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                background: '#FFFFFF'
              }
            },
            {
              type: 'tooltip',
              key: 'node-tooltip',
              itemTypes: ['node'],
              getContent: (e: any, items: any) => {
                const node = items[0];
                const typeColors: Record<string, string> = {
                  course: '#C8000B',
                  chapter: '#D97706',
                  section: '#059669',
                  knowledge: '#2563EB'
                };
                const typeLabels: Record<string, string> = {
                  course: '课程',
                  chapter: '章',
                  section: '节',
                  knowledge: '知识点'
                };
                const color = typeColors[node?.nodeType] || '#6B7280';
                const typeLabel = typeLabels[node?.nodeType] || node?.nodeType || '';
                const nodeId = node?.id;
                const nodeData = nodesRef.current.find((n) => n.id === nodeId);
                const hasChildren = (nodeData?.childrenCount || 0) > 0;
                const isCollapsed = collapsedNodesRef.current.has(node?.id);
                const toggleHint = hasChildren
                  ? isCollapsed
                    ? '<div style="margin-top: 6px; font-size: 11px; color: #9CA3AF;">⚡ 子节点已折叠 · 单击查看明细，双击展开</div>'
                    : '<div style="margin-top: 6px; font-size: 11px; color: #9CA3AF;">单击查看明细，双击折叠子节点</div>'
                  : '<div style="margin-top: 6px; font-size: 11px; color: #9CA3AF;">点击查看明细</div>';
                return `
                  <div style="padding: 10px 14px; font-size: 13px; color: #1F2937; max-width: 260px; font-family: system-ui, -apple-system, sans-serif;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; display: inline-block;"></span>
                      <span style="font-size: 11px; color: ${color}; font-weight: 600;">${typeLabel}</span>
                    </div>
                    <div style="font-weight: 600; line-height: 1.4; color: #111827;">${node?.name || ''}</div>
                    ${toggleHint}
                  </div>
                `;
              }
            }
          ],
          animation: {
            duration: 400,
            easing: 'ease-in-out-sine'
          }
        });

        graphRef.current = graph;

        const clearSelection = () => {
          const prevId = selectedNodeIdRef.current;
          selectedNodeIdRef.current = null;
          if (prevId) {
            try {
              graph.setElementState({ [prevId]: [] }, false);
            } catch (e) {
              // ignore
            }
          }
        };

        // 节点单击：选中并展示明细
        graph.on('node:click', (e: any) => {
          const nodeId = e?.target?.id;
          if (!nodeId) return;
          const nodeData = nodesRef.current.find((n) => n.id === nodeId);
          if (!nodeData) return;
          const prevId = selectedNodeIdRef.current;
          selectedNodeIdRef.current = nodeId;
          try {
            const states: Record<string, string[]> = { [nodeId]: ['selected'] };
            if (prevId && prevId !== nodeId) {
              states[prevId] = [];
            }
            graph.setElementState(states, false);
          } catch (err) {
            // ignore
          }
          onNodeSelectRef.current?.(nodeData);
        });

        // 节点双击：展开/收起子节点（仅对有子节点的节点）
        graph.on('node:dblclick', (e: any) => {
          const nodeId = e?.target?.id;
          if (nodeId) {
            const nodeData = nodesRef.current.find((n) => n.id === nodeId);
            const hasChildren = (nodeData?.childrenCount || 0) > 0;
            if (hasChildren) {
              onNodeToggleRef.current?.(nodeId);
            }
          }
        });

        // 画布点击：取消选中并关闭明细
        graph.on('canvas:click', () => {
          clearSelection();
          onNodeSelectRef.current?.(null);
        });

        await graph.render();
        // 延迟执行 fitView，确保 radial 布局计算完成
        setTimeout(() => {
          graph.fitView?.({ padding: 40 });
        }, 150);
        setIsReady(true);
      };

      initGraph();

      return () => {
        if (graphRef.current) {
          try {
            graphRef.current.destroy();
          } catch (e) {
            console.warn('Graph destroy error:', e);
          }
          graphRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 数据更新时重新渲染
    useEffect(() => {
      if (!graphRef.current || !isReady) return;
      const graph = graphRef.current;
      graph.setData({ nodes, edges });
      graph.render().catch((e: any) => {
        console.warn('Graph render error:', e);
      });
    }, [nodes, edges, isReady]);

    // 布局切换
    useEffect(() => {
      if (!graphRef.current || !isReady) return;
      const graph = graphRef.current;
      graph.setLayout(getLayoutConfig(layoutType));
      graph.render().catch((e: any) => {
        console.warn('Graph render error:', e);
      });
    }, [layoutType, isReady]);

    // 响应窗口及三栏面板宽度变化
    useEffect(() => {
      const handleResize = () => {
        if (graphRef.current && containerRef.current) {
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight || 700;
          graphRef.current.setSize(width, height);
        }
      };
      const resizeObserver =
        typeof ResizeObserver !== 'undefined' && containerRef.current
          ? new ResizeObserver(handleResize)
          : null;
      if (containerRef.current) resizeObserver?.observe(containerRef.current);
      window.addEventListener('resize', handleResize);
      return () => {
        resizeObserver?.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    return (
      <Box
        ref={containerRef}
        w="100%"
        h="100%"
        position="relative"
        bg="#FAFAFA"
        overflow="hidden"
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
        sx={{
          // 网格线背景（网状结构）
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(to right, rgba(0,0,0,0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px, 60px 60px, 12px 12px, 12px 12px'
        }}
      />
    );
  };

export const GraphCanvas = forwardRef(GraphCanvasInner);

function getLayoutConfig(type: GraphLayoutType) {
  switch (type) {
    case 'radial':
      return {
        type: 'radial',
        focusNode: 'course-root',
        unitRadius: 140,
        linkDistance: 140,
        preventOverlap: true,
        nodeSize: 40,
        nodeSpacing: 24,
        maxIteration: 1000,
        animation: true
      };
    case 'circular':
      return {
        type: 'circular',
        radius: null,
        startRadius: null,
        endRadius: null,
        startAngle: 0,
        endAngle: 2 * Math.PI,
        clockwise: true,
        nodeSpacing: 40,
        nodeSize: 50,
        preventOverlap: true,
        animation: true
      };
    default:
      return { type: 'radial' };
  }
}
