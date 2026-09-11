import { useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Box } from '@chakra-ui/react';
import type { ChapterVO } from '../../types/api/student/student';

export interface CourseMarkmapProps {
  courseName: string;
  chapters: ChapterVO[];
  onNodeClick?: (nodeData: NodeClickData) => void;
}

export interface NodeClickData {
  title: string;
  type: 'course' | 'chapter' | 'section' | 'knowledge';
  parentTitle?: string;
  childrenCount?: number;
}

export interface CourseMarkmapRef {
  expandAll: () => void;
  collapseAll: () => void;
}

const transformer = new Transformer();

// 主题色配置 - 与设计系统对齐
const THEME_COLORS = {
  course: '#C8000B',      // 主色 - 课程根节点
  chapter: '#D43D3D',     // 较浅红 - 章节
  section: '#FA8C16',     // 橙色 - 小节
  knowledge: '#1677FF',   // 蓝色 - 知识点
  line: '#E5E7EB',        // 连线颜色
  text: '#374151',        // 文字颜色
  bg: '#FAFAFA'           // 背景色
};

export const CourseMarkmap = forwardRef<CourseMarkmapRef, CourseMarkmapProps>(
  ({ courseName, chapters, onNodeClick }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const markmapRef = useRef<Markmap | null>(null);
    const clickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
    const styleInjectedRef = useRef(false);

    // 暴露展开/收起方法给父组件
    useImperativeHandle(ref, () => ({
      expandAll: () => {
        if (markmapRef.current) {
          const { root } = transformer.transform(markdown);
          const expandNode = (node: any) => {
            if (node.children && node.children.length > 0) {
              node.payload = { ...node.payload, fold: 0 };
              node.children.forEach(expandNode);
            }
          };
          expandNode(root);
          markmapRef.current.setData(root);
          markmapRef.current.fit();
        }
      },
      collapseAll: () => {
        if (markmapRef.current) {
          const { root } = transformer.transform(markdown);
          const collapseNode = (node: any, isRoot = false) => {
            if (node.children && node.children.length > 0) {
              if (!isRoot) {
                node.payload = { ...node.payload, fold: 1 };
              }
              node.children.forEach((child: any) => collapseNode(child, false));
            }
          };
          collapseNode(root, true);
          markmapRef.current.setData(root);
          markmapRef.current.fit();
        }
      }
    }));

    const markdown = useMemo(() => {
      let md = `# ${courseName || '课程知识图谱'}\n`;

      const processChapter = (chapter: ChapterVO, level: number) => {
        const heading = '#'.repeat(level);
        md += `${heading} ${chapter.title || '无标题'}\n`;

        if (chapter.knowledgePoints && chapter.knowledgePoints.length > 0) {
          const kpHeading = '#'.repeat(level + 1);
          chapter.knowledgePoints.forEach((kp) => {
            md += `${kpHeading} ${kp.name}\n`;
          });
        }

        if (chapter.children && chapter.children.length > 0) {
          chapter.children.forEach((child) => {
            processChapter(child, level + 1);
          });
        }
      };

      if (chapters) {
        chapters.forEach((ch) => {
          processChapter(ch, 2);
        });
      }

      return md;
    }, [courseName, chapters]);

    // 注入自定义样式到 markmap
    const injectCustomStyles = () => {
      if (styleInjectedRef.current) return;

      const styleId = 'course-markmap-custom-styles';
      if (document.getElementById(styleId)) {
        styleInjectedRef.current = true;
        return;
      }

      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        .markmap-node {
          cursor: pointer;
        }
        .markmap-node:hover > foreignObject div {
          color: ${THEME_COLORS.course} !important;
          font-weight: 600 !important;
          transition: color 0.15s ease, font-weight 0.15s ease;
        }
        .markmap-node circle {
          transition: r 0.2s ease, fill 0.2s ease;
        }
        .markmap-node:hover > circle {
          r: 6px !important;
        }
        .markmap-node[data-depth="0"] circle {
          fill: ${THEME_COLORS.course};
        }
        .markmap-node[data-depth="1"] circle {
          fill: ${THEME_COLORS.chapter};
        }
        .markmap-node[data-depth="2"] circle {
          fill: ${THEME_COLORS.section};
        }
        .markmap-node[data-depth="3"] circle {
          fill: ${THEME_COLORS.knowledge};
        }
        .markmap-node[data-depth="4"] circle {
          fill: ${THEME_COLORS.knowledge};
        }
        .markmap-link {
          stroke: ${THEME_COLORS.line} !important;
          stroke-opacity: 0.8;
        }
        .markmap-foreign div {
          color: ${THEME_COLORS.text};
        }
        .markmap-node[data-depth="0"] .markmap-foreign div {
          color: ${THEME_COLORS.course};
          font-weight: 700;
          font-size: 16px;
        }
        .markmap-node[data-depth="1"] .markmap-foreign div {
          color: ${THEME_COLORS.chapter};
          font-weight: 600;
        }
        .markmap-node[data-depth="2"] .markmap-foreign div {
          color: ${THEME_COLORS.section};
          font-weight: 500;
        }
        .markmap-node[data-depth="3"] .markmap-foreign div,
        .markmap-node[data-depth="4"] .markmap-foreign div {
          color: ${THEME_COLORS.knowledge};
          font-weight: 500;
        }
      `;
      document.head.appendChild(styleEl);
      styleInjectedRef.current = true;
    };

    useEffect(() => {
      injectCustomStyles();

      if (svgRef.current && !markmapRef.current) {
        // 确保 SVG 有明确的尺寸后再初始化
        const rect = svgRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          // SVG 尺寸还未确定，等待下一帧
          requestAnimationFrame(() => {
            if (svgRef.current && !markmapRef.current) {
              markmapRef.current = Markmap.create(svgRef.current, {
                pan: false,
                zoom: true,
                scrollForPan: false,
                fitRatio: 1,
                duration: 300,
                autoFit: true
              });

              const handleWheel = (e: WheelEvent) => {
                e.preventDefault();
              };
              svgRef.current.addEventListener('wheel', handleWheel, { passive: false });

              const stopDblClick = (e: MouseEvent) => {
                e.stopPropagation();
              };
              svgRef.current.addEventListener('dblclick', stopDblClick, { capture: true });

              // 初始化后立即设置数据
              if (markmapRef.current) {
                const { root } = transformer.transform(markdown);
                markmapRef.current.setData(root);
                markmapRef.current.fit();
              }
            }
          });
          return;
        }

        markmapRef.current = Markmap.create(svgRef.current, {
          pan: false,
          zoom: true,
          scrollForPan: false,
          fitRatio: 1,
          duration: 300,
          autoFit: true
        });

        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
        };
        svgRef.current.addEventListener('wheel', handleWheel, { passive: false });

        const stopDblClick = (e: MouseEvent) => {
          e.stopPropagation();
        };
        svgRef.current.addEventListener('dblclick', stopDblClick, { capture: true });
      }

      if (markmapRef.current) {
        const { root } = transformer.transform(markdown);
        markmapRef.current.setData(root);
        markmapRef.current.fit();
      }

      // 注册事件监听器
      if (svgRef.current && clickHandlerRef.current) {
        svgRef.current.removeEventListener('click', clickHandlerRef.current, true);
        clickHandlerRef.current = null;
      }

      if (onNodeClick && svgRef.current) {
        // 构建节点标题到子节点数量的映射
        const nodeChildrenCountMap = new Map<string, number>();

        const buildNodeMap = (chapter: ChapterVO) => {
          const title = chapter.title || '无标题';
          const childrenCount =
            (chapter.children?.length || 0) + (chapter.knowledgePoints?.length || 0);
          nodeChildrenCountMap.set(title, childrenCount);

          // 递归处理子章节
          if (chapter.children && chapter.children.length > 0) {
            chapter.children.forEach((child) => buildNodeMap(child));
          }

          // 处理知识点（知识点没有子节点）
          if (chapter.knowledgePoints && chapter.knowledgePoints.length > 0) {
            chapter.knowledgePoints.forEach((kp) => {
              if (kp.name) {
                nodeChildrenCountMap.set(kp.name, 0);
              }
            });
          }
        };

        // 课程根节点
        nodeChildrenCountMap.set(courseName || '课程知识图谱', chapters.length);

        // 构建所有节点的映射
        chapters.forEach((chapter) => buildNodeMap(chapter));

        const clickHandler = (e: MouseEvent) => {
          try {
            const target = e.target as SVGElement;

            // 只处理点击文字的情况（foreignObject 中的 div 或 text 元素）
            const isForeignObjectDiv = target.closest('foreignObject') !== null;
            const isTextElement = target.tagName === 'text' || target.tagName === 'tspan';

            // 如果不是点击文字，不处理（让 markmap 处理展开/收起）
            if (!isForeignObjectDiv && !isTextElement) {
              return;
            }

            // 阻止默认行为和事件传播，防止视图调整
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            let nodeElement: Element | null = target.closest('g.markmap-node');

            if (!nodeElement) {
              nodeElement = target.closest('g[data-depth]');
            }

            if (!nodeElement) {
              nodeElement = target.closest('g');
            }

            if (nodeElement) {
              let title = '';

              const foreignObject = nodeElement.querySelector('foreignObject');
              if (foreignObject) {
                const divElement = foreignObject.querySelector('div');
                if (divElement) {
                  title = divElement.textContent?.trim() || '';
                }
              }

              if (!title) {
                const textElement = nodeElement.querySelector('text');
                if (textElement) {
                  title = textElement.textContent?.trim() || '';
                }
              }

              if (!title) return;

              let depth = 0;
              const depthAttr = nodeElement.getAttribute('data-depth');
              if (depthAttr) {
                depth = parseInt(depthAttr, 10);
              }

              let type: 'course' | 'chapter' | 'section' | 'knowledge' = 'knowledge';
              if (depth === 0) {
                type = 'course';
              } else if (depth === 1) {
                type = 'chapter';
              } else if (depth === 2) {
                type = 'section';
              } else {
                type = 'knowledge';
              }

              let parentTitle: string | undefined;
              let parentNode = nodeElement.parentElement;
              while (parentNode && parentNode.tagName === 'g') {
                const parentForeignObject = parentNode.querySelector(':scope > foreignObject');
                if (parentForeignObject) {
                  const parentDiv = parentForeignObject.querySelector('div');
                  if (parentDiv) {
                    const parentText = parentDiv.textContent?.trim();
                    if (parentText && parentText !== title) {
                      parentTitle = parentText;
                      break;
                    }
                  }
                }

                if (!parentTitle) {
                  const parentText = parentNode.querySelector(':scope > text');
                  if (parentText) {
                    const parentTextContent = parentText.textContent?.trim();
                    if (parentTextContent && parentTextContent !== title) {
                      parentTitle = parentTextContent;
                      break;
                    }
                  }
                }

                parentNode = parentNode.parentElement;
              }

              // 从映射中获取子节点数量
              const childrenCount = nodeChildrenCountMap.get(title) || 0;

              onNodeClick({
                title,
                type,
                parentTitle,
                childrenCount
              });
            }
          } catch (error) {
            console.warn('Node click handler error:', error);
          }
        };

        clickHandlerRef.current = clickHandler;
        // 使用 capture 阶段，确保在 markmap 之前处理事件
        svgRef.current.addEventListener('click', clickHandler, true);
      }
    }, [markdown, onNodeClick, chapters, courseName]);

    useEffect(() => {
      return () => {
        if (svgRef.current && clickHandlerRef.current) {
          svgRef.current.removeEventListener('click', clickHandlerRef.current, true);
        }
        // markmap.destroy() 不会清除 d3-timer 上已排队的 zoom transition; 当 SVG 在卸载后
        // 离开 DOM, 仍可能被 timer 唤醒并调用 d3-zoom defaultExtent. defaultExtent 读取
        // svg.width.baseVal.value, 若 SVG 只有 CSS 尺寸 (width: 100%), 离 DOM 后相对长度
        // 解析失败抛 NotSupportedError. 这里把当前像素尺寸固化为属性, 让后续唤醒能拿到具体值.
        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            svgRef.current.setAttribute('width', String(rect.width));
            svgRef.current.setAttribute('height', String(rect.height));
          }
        }
        if (markmapRef.current) {
          markmapRef.current.destroy();
          markmapRef.current = null;
        }
      };
    }, []);

    return (
      <Box
        w="100%"
        minH="645px"
        bg={THEME_COLORS.bg}
        borderRadius="16px"
        border="1px solid"
        borderColor="gray.200"
        position="relative"
        overflow="hidden"
        _hover={{
          borderColor: 'gray.300',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}
        transition="all 0.2s ease"
      >
        <svg ref={svgRef} style={{ width: '100%', height: '100%', minHeight: '645px' }} />
      </Box>
    );
  }
);

CourseMarkmap.displayName = 'CourseMarkmap';
