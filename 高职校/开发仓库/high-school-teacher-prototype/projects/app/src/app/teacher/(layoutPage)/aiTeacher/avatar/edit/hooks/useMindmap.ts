import type { MindmapNode } from '../constants';

export function useMindmap(
  mindmapData: MindmapNode | null,
  setMindmapData: (data: MindmapNode | null) => void
) {
  const toggleNode = (id: string) => {
    if (!mindmapData) return;

    const toggleInTree = (node: MindmapNode): MindmapNode => {
      if (node.id === id) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(toggleInTree)
        };
      }
      return node;
    };

    setMindmapData(toggleInTree(mindmapData));
  };

  const expandAll = () => {
    if (!mindmapData) return;

    const expandInTree = (node: MindmapNode): MindmapNode => {
      const newNode = { ...node, expanded: true };
      if (node.children) {
        newNode.children = node.children.map(expandInTree);
      }
      return newNode;
    };

    setMindmapData(expandInTree(mindmapData));
  };

  const collapseAll = () => {
    if (!mindmapData) return;

    const collapseInTree = (node: MindmapNode): MindmapNode => {
      const newNode = { ...node };
      if (node.type === 'knowledge') {
        newNode.expanded = false;
      }
      if (node.children) {
        newNode.children = node.children.map(collapseInTree);
      }
      return newNode;
    };

    setMindmapData(collapseInTree(mindmapData));
  };

  return {
    toggleNode,
    expandAll,
    collapseAll
  };
}
