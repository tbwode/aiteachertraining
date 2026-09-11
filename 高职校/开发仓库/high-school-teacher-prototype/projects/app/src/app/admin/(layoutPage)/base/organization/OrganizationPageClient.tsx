'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Collapse,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  IconButton,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { ChevronRightIcon, CloseIcon, CheckIcon } from '@chakra-ui/icons';
import type { DeptItem } from '@/types/api/admin/teaching/depts';
import type { TenantType } from '@/types/api/admin/teaching/tenant';
import {
  postDeptList,
  createDept,
  updateDept,
  deleteDept,
  sortDept
} from '@/api/admin/teaching/depts';
import { getTenantDetail, updateTenantDetail } from '@/api/admin/teaching/tenant';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';

// 拖拽手柄图标组件
const DragHandle = () => (
  <Box
    display="flex"
    flexDirection="column"
    gap="2px"
    cursor="grab"
    _active={{ cursor: 'grabbing' }}
    px={1}
  >
    <Box w="8px" h="2px" bg="#86909C" borderRadius="1px" />
    <Box w="8px" h="2px" bg="#86909C" borderRadius="1px" />
  </Box>
);

// 查找节点
const findNode = (depts: DeptItem[], id: string): DeptItem | null => {
  for (const dept of depts) {
    if (dept.id === id) return dept;
    if (dept.children) {
      const found = findNode(dept.children, id);
      if (found) return found;
    }
  }
  return null;
};

// 查找父节点
const findParent = (depts: DeptItem[], childId: string): DeptItem | null => {
  for (const dept of depts) {
    if (dept.children?.some((child) => child.id === childId)) return dept;
    if (dept.children) {
      const found = findParent(dept.children, childId);
      if (found) return found;
    }
  }
  return null;
};

// 检查是否是后代节点
const isDescendant = (parent: DeptItem, childId: string): boolean => {
  if (!parent.children) return false;
  for (const child of parent.children) {
    if (child.id === childId || isDescendant(child, childId)) return true;
  }
  return false;
};

// 获取节点在兄弟中的索引
const getNodeIndex = (siblings: DeptItem[], id: string): number => {
  return siblings.findIndex((s) => s.id === id);
};

// 构建用于排序API的扁平化列表（只包含id、parentId、sort）
const buildSortList = (
  depts: DeptItem[],
  parentId: string = '0',
  result: Array<{ id: string; parentId: string; sort: number }> = []
): typeof result => {
  depts.forEach((dept, index) => {
    result.push({
      id: dept.id,
      parentId: parentId,
      sort: index
    });
    if (dept.children && dept.children.length > 0) {
      buildSortList(dept.children, dept.id, result);
    }
  });
  return result;
};

// 递归获取所有节点ID
const getAllNodeIds = (depts: DeptItem[]): string[] => {
  const ids: string[] = [];
  depts.forEach((dept) => {
    ids.push(dept.id);
    if (dept.children && dept.children.length > 0) {
      ids.push(...getAllNodeIds(dept.children));
    }
  });
  return ids;
};

// ============ 部门树节点组件（递归） ============
interface TreeNodeItemProps {
  node: DeptItem;
  level: number;
  index: number;
  parentId: string;
  siblings: DeptItem[];
  expandedIds: string[];
  onToggleExpand: (id: string) => void;
  editingId: string | null;
  addingParentId: string | null;
  newDeptName: string;
  onNewDeptNameChange: (value: string) => void;
  onStartAdd: (parentId: string) => void;
  onStartEdit: (node: DeptItem) => void;
  onConfirmAdd: (parentId: string) => void;
  onConfirmEdit: (node: DeptItem) => void;
  onCancel: () => void;
  onDelete: (node: DeptItem) => void;
  // 拖拽相关
  dragNodeId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
  onDragStart: (nodeId: string) => void;
  onDragOver: (e: React.DragEvent, node: DeptItem, index: number, siblings: DeptItem[]) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  // 国际化
  t: (key: string, options?: Record<string, unknown>) => string;
}

const TreeNodeItem = ({
  node,
  level,
  index,
  parentId,
  siblings,
  expandedIds,
  onToggleExpand,
  editingId,
  addingParentId,
  newDeptName,
  onNewDeptNameChange,
  onStartAdd,
  onStartEdit,
  onConfirmAdd,
  onConfirmEdit,
  onCancel,
  onDelete,
  dragNodeId,
  dropTargetId,
  dropPosition,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  t
}: TreeNodeItemProps) => {
  const isExpanded = expandedIds.includes(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isEditing = editingId === node.id;
  const isAdding = addingParentId === node.id;
  const isDragging = dragNodeId === node.id;
  const isTopLevel = level === 0;

  const isDropTarget = dropTargetId === node.id;

  return (
    <Box mb={2}>
      {/* 上方放置线 */}
      {isDropTarget && dropPosition === 'before' && (
        <Box h="3px" bg="#1677ff" borderRadius="2px" my="2px" />
      )}

      {/* 节点行 */}
      <Flex
        align="center"
        h="40px"
        px={3}
        border="1px solid"
        borderColor={isDropTarget && dropPosition === 'inside' ? '#1677ff' : '#E5E6EB'}
        borderRadius="6px"
        bg={isDropTarget && dropPosition === 'inside' ? 'rgba(22, 119, 255, 0.05)' : 'white'}
        opacity={isDragging ? 0.4 : 1}
        transition="all 0.15s"
        draggable={!isEditing}
        onDragStart={() => onDragStart(node.id)}
        onDragOver={(e) => onDragOver(e, node, index, siblings)}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        cursor={isEditing ? 'default' : 'grab'}
        _hover={{ borderColor: isEditing ? '#E5E6EB' : '#1677ff' }}
      >
        {/* 拖拽手柄 */}
        <DragHandle />

        {/* 展开箭头 */}
        <Box
          w="16px"
          h="16px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor={hasChildren ? 'pointer' : 'default'}
          onClick={() => hasChildren && onToggleExpand(node.id)}
          transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
          transition="transform 0.2s"
          ml={1}
        >
          {hasChildren && <ChevronRightIcon boxSize={4} color="#86909C" />}
        </Box>

        {/* 名称/编辑框 */}
        {isEditing ? (
          <Flex flex={1} align="center" gap={2} ml={2}>
            <Input
              size="sm"
              value={newDeptName}
              onChange={(e) => onNewDeptNameChange(e.target.value)}
              placeholder={t('base.organization.placeholder.deptName')}
              autoFocus
              flex={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirmEdit(node);
                if (e.key === 'Escape') onCancel();
              }}
            />
            <IconButton
              aria-label={t('roles.actions.confirm')}
              icon={<CheckIcon boxSize={3} />}
              size="xs"
              colorScheme="green"
              onClick={() => onConfirmEdit(node)}
            />
            <IconButton
              aria-label={t('roles.actions.cancel')}
              icon={<CloseIcon boxSize={3} />}
              size="xs"
              variant="ghost"
              onClick={onCancel}
            />
          </Flex>
        ) : (
          <>
            <Text fontSize="14px" color="#1D2129" fontWeight={500} ml={2} flex={1} isTruncated>
              {node.name}
            </Text>
            <Text fontSize="14px" color="#86909C" mr={4}>
              ({node.deptUserNum || 0})
            </Text>
          </>
        )}

        {/* 操作按钮 */}
        {!isEditing && (
          <Flex gap={4} flexShrink={0}>
            {isTopLevel ? (
              <Text
                fontSize="14px"
                color="#1677ff"
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
                onClick={() => onStartAdd(node.id)}
              >
                {t('base.organization.addSubDept')}
              </Text>
            ) : (
              <>
                <Text
                  fontSize="14px"
                  color="#1677ff"
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => onStartEdit(node)}
                >
                  {t('base.organization.actions.edit')}
                </Text>
                <Text
                  fontSize="14px"
                  color="#ff4d4f"
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => onDelete(node)}
                >
                  {t('base.organization.actions.delete')}
                </Text>
                <Text
                  fontSize="14px"
                  color="#1677ff"
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() => onStartAdd(node.id)}
                >
                  {t('base.organization.addSubDept')}
                </Text>
              </>
            )}
          </Flex>
        )}
      </Flex>

      {/* 下方放置线 */}
      {isDropTarget && dropPosition === 'after' && (
        <Box h="3px" bg="#1677ff" borderRadius="2px" my="2px" />
      )}

      {/* 子节点 */}
      <Collapse in={isExpanded} animateOpacity>
        <Box mt={2}>
          {/* 添加子部门输入框 - 显示在子节点列表最前面 */}
          {isAdding && (
            <Flex
              align="center"
              h="40px"
              px={3}
              mb={2}
              ml="24px"
              bg="#F7F8FA"
              border="1px solid #E5E6EB"
              borderRadius="6px"
              gap={2}
            >
              <DragHandle />
              <Box w="16px" />
              <Input
                size="sm"
                value={newDeptName}
                onChange={(e) => onNewDeptNameChange(e.target.value)}
                placeholder={t('base.organization.placeholder.deptName')}
                autoFocus
                flex={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirmAdd(node.id);
                  if (e.key === 'Escape') onCancel();
                }}
              />
              <IconButton
                aria-label={t('roles.actions.confirm')}
                icon={<CheckIcon boxSize={3} />}
                size="xs"
                colorScheme="green"
                onClick={() => onConfirmAdd(node.id)}
              />
              <IconButton
                aria-label={t('roles.actions.cancel')}
                icon={<CloseIcon boxSize={3} />}
                size="xs"
                variant="ghost"
                onClick={onCancel}
              />
            </Flex>
          )}

          {node.children?.map((child, childIndex) => (
            <Box key={child.id} pl="24px">
              <TreeNodeItem
                node={child}
                level={level + 1}
                index={childIndex}
                parentId={node.id}
                siblings={node.children || []}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                editingId={editingId}
                addingParentId={addingParentId}
                newDeptName={newDeptName}
                onNewDeptNameChange={onNewDeptNameChange}
                onStartAdd={onStartAdd}
                onStartEdit={onStartEdit}
                onConfirmAdd={onConfirmAdd}
                onConfirmEdit={onConfirmEdit}
                onCancel={onCancel}
                onDelete={onDelete}
                dragNodeId={dragNodeId}
                dropTargetId={dropTargetId}
                dropPosition={dropPosition}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                t={t}
              />
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

// ============ 主页面组件 ============
export default function OrganizationPageClient() {
  const { t } = useTranslation('admin');
  const ad = useAdminPageI18n(['base']);
  const toast = useToast();

  // 组织名称
  const [orgName, setOrgName] = useState('');
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [tenantId, setTenantId] = useState<string>('');
  const [tenantDetail, setTenantDetail] = useState<TenantType | null>(null);

  // 部门树
  const [deptList, setDeptList] = useState<DeptItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteNode, setDeleteNode] = useState<DeptItem | null>(null);
  const [loading, setLoading] = useState(false);

  // 拖拽状态 - 参考 rc-tree 简化设计
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  // 加载租户详情（组织名称）
  const loadTenantDetail = useCallback(async () => {
    try {
      const res = await getTenantDetail();
      if (res) {
        setOrgName(res.name || '');
        setTenantId(res.id || '');
        // 保存完整的租户信息，用于后续更新
        setTenantDetail(res);
      }
    } catch (error) {
      toast({
        title: t('base.organization.messages.loadTenantFailed'),
        status: 'error',
        duration: 2000
      });
    }
  }, [toast]);

  // 加载部门列表
  const loadDeptList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await postDeptList();
      const list = res || [];
      setDeptList(list);
      // 默认展开所有节点
      const allIds = getAllNodeIds(list);
      setExpandedIds(allIds);
    } catch (error) {
      toast({
        title: t('base.organization.messages.loadDeptFailed'),
        status: 'error',
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 页面加载时获取数据
  useEffect(() => {
    loadTenantDetail();
    loadDeptList();
  }, [loadTenantDetail, loadDeptList]);

  // 展开/折叠
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  // 组织名称编辑
  const handleStartEditName = () => {
    setEditNameValue(orgName);
    setIsEditNameModalOpen(true);
  };

  const handleConfirmEditName = async () => {
    const trimmed = editNameValue.trim();
    if (!trimmed) {
      toast({
        title: t('base.organization.messages.nameRequired'),
        status: 'error',
        duration: 2000
      });
      return;
    }
    if (trimmed.length > 30) {
      toast({
        title: t('base.organization.messages.nameMaxLength'),
        status: 'error',
        duration: 2000
      });
      return;
    }
    if (!tenantDetail) {
      toast({
        title: t('base.organization.messages.tenantNotLoaded'),
        status: 'error',
        duration: 2000
      });
      return;
    }
    try {
      await updateTenantDetail({
        id: tenantDetail.id,
        name: trimmed,
        fullName: tenantDetail.fullName,
        domain: tenantDetail.domain,
        industry: tenantDetail.industry,
        avatar: tenantDetail.avatar,
        avatarUrl: tenantDetail.avatarUrl,
        backgroundImg: tenantDetail.backgroundImg,
        backgroundImgUrl: tenantDetail.backgroundImgUrl,
        functionBackgroundImg: tenantDetail.functionBackgroundImg,
        functionBackgroundImgUrl: tenantDetail.functionBackgroundImgUrl,
        fullNameImg: tenantDetail.fullNameImg,
        fullNameImgUrl: tenantDetail.fullNameImgUrl,
        sidebarImg: tenantDetail.sidebarImg,
        sidebarImgUrl: tenantDetail.sidebarImgUrl,
        homepageBackgroundImg: tenantDetail.homepageBackgroundImg,
        homepageBackgroundImgUrl: tenantDetail.homepageBackgroundImgUrl
      });
      setOrgName(trimmed);
      setIsEditNameModalOpen(false);
      toast({
        title: t('base.organization.messages.updateNameSuccess'),
        status: 'success',
        duration: 2000
      });
      // 刷新租户详情
      loadTenantDetail();
    } catch (error) {
      toast({
        title: t('base.organization.messages.updateNameFailed'),
        status: 'error',
        duration: 2000
      });
    }
  };

  // 部门操作
  const handleStartAdd = (parentId: string) => {
    setAddingParentId(parentId);
    setEditingId(null);
    setNewDeptName('');
    // 自动展开父节点，以便看到输入框
    setExpandedIds((prev) => (prev.includes(parentId) ? prev : [...prev, parentId]));
  };

  const handleStartEdit = (node: DeptItem) => {
    setEditingId(node.id);
    setAddingParentId(null);
    setNewDeptName(node.name);
  };

  const handleCancel = () => {
    setEditingId(null);
    setAddingParentId(null);
    setNewDeptName('');
  };

  // 添加部门
  const handleConfirmAdd = async (parentId: string) => {
    if (!newDeptName.trim()) {
      toast({
        title: t('base.organization.messages.deptNameRequired'),
        status: 'error',
        duration: 2000
      });
      return;
    }
    if (newDeptName.length < 2 || newDeptName.length > 20) {
      toast({
        title: t('base.organization.messages.deptNameLength'),
        status: 'error',
        duration: 2000
      });
      return;
    }
    try {
      await createDept({
        name: newDeptName.trim(),
        parentId: parentId
      });
      toast({
        title: t('base.organization.messages.addDeptSuccess'),
        status: 'success',
        duration: 2000
      });
      handleCancel();
      loadDeptList(); // 刷新列表
    } catch (error) {
      toast({
        title: t('base.organization.messages.addDeptFailed'),
        status: 'error',
        duration: 2000
      });
    }
  };

  // 编辑部门
  const handleConfirmEdit = async (node: DeptItem) => {
    if (!newDeptName.trim()) {
      toast({
        title: t('base.organization.messages.deptNameRequired'),
        status: 'error',
        duration: 2000
      });
      return;
    }
    if (newDeptName.length < 2 || newDeptName.length > 20) {
      toast({
        title: t('base.organization.messages.deptNameLength'),
        status: 'error',
        duration: 2000
      });
      return;
    }
    try {
      await updateDept({
        id: node.id,
        name: newDeptName.trim(),
        parentId: node.parentId
      });
      toast({
        title: t('base.organization.messages.editDeptSuccess'),
        status: 'success',
        duration: 2000
      });
      handleCancel();
      loadDeptList(); // 刷新列表
    } catch (error) {
      toast({
        title: t('base.organization.messages.editDeptFailed'),
        status: 'error',
        duration: 2000
      });
    }
  };

  const handleDelete = (node: DeptItem) => {
    setDeleteNode(node);
    setDeleteModalOpen(true);
  };

  // 删除部门
  const handleConfirmDelete = async () => {
    if (!deleteNode) return;
    try {
      await deleteDept({ id: deleteNode.id });
      toast({
        title: t('base.organization.messages.deleteDeptSuccess'),
        status: 'success',
        duration: 2000
      });
      setDeleteModalOpen(false);
      setDeleteNode(null);
      loadDeptList(); // 刷新列表
    } catch (error) {
      toast({
        title: t('base.organization.messages.deleteDeptFailed'),
        status: 'error',
        duration: 2000
      });
    }
  };

  // ============ 拖拽逻辑 - 参考 rc-tree 设计 ============

  // 拖拽开始
  const handleDragStart = useCallback((nodeId: string) => {
    setDragNodeId(nodeId);
  }, []);

  // 拖拽经过 - 计算放置位置
  const handleDragOver = useCallback(
    (e: React.DragEvent, targetNode: DeptItem, targetIndex: number, targetSiblings: DeptItem[]) => {
      e.preventDefault();

      if (!dragNodeId || dragNodeId === targetNode.id) {
        setDropTargetId(null);
        setDropPosition(null);
        return;
      }

      const dragNode = findNode(deptList, dragNodeId);
      if (!dragNode) return;

      // 禁止将父节点拖入子节点
      if (isDescendant(dragNode, targetNode.id)) {
        setDropTargetId(null);
        setDropPosition(null);
        return;
      }

      // 计算鼠标在目标元素中的相对位置
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mouseY = e.clientY;
      const height = rect.height;
      const relativeY = mouseY - rect.top;

      // 获取拖拽节点和目标节点的父节点
      const dragParent = findParent(deptList, dragNodeId);
      const targetParent = findParent(deptList, targetNode.id);
      const dragParentId = dragParent?.id || 'root';
      const targetParentId = targetParent?.id || 'root';
      const isSameLevel = dragParentId === targetParentId;

      let position: 'before' | 'after' | 'inside';

      // 垂直三分法判断位置
      if (relativeY < height * 0.3) {
        // 上半部分：放置到目标之前
        position = 'before';
      } else if (relativeY > height * 0.7) {
        // 下半部分：放置到目标之后
        position = 'after';
      } else {
        // 中间部分
        if (isSameLevel) {
          // 同级：中间转为 before/after（根据鼠标在上半还是下半）
          position = relativeY < height * 0.5 ? 'before' : 'after';
        } else {
          // 不同级：可以成为子节点
          position = 'inside';
        }
      }

      setDropTargetId(targetNode.id);
      setDropPosition(position);
    },
    [dragNodeId, deptList]
  );

  // 放置
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const targetId = dropTargetId;
      const position = dropPosition;

      // 重置状态
      setDropTargetId(null);
      setDropPosition(null);
      const draggingId = dragNodeId;
      setDragNodeId(null);

      if (!draggingId || !targetId || !position) return;
      if (draggingId === targetId) return;

      // 深拷贝树
      const newTree = JSON.parse(JSON.stringify(deptList)) as DeptItem[];

      // 找到相关节点
      const dragNode = findNode(newTree, draggingId);
      const targetNode = findNode(newTree, targetId);
      if (!dragNode || !targetNode) return;

      // 禁止将父节点拖入子节点
      if (isDescendant(dragNode, targetId)) {
        toast({
          title: t('base.organization.messages.dragParentToChild'),
          status: 'warning',
          duration: 2000
        });
        return;
      }

      // 找到拖拽节点在原始树中的父节点和索引
      const dragParent = findParent(newTree, draggingId);
      const dragSiblings = dragParent ? dragParent.children! : newTree;
      const dragIndex = getNodeIndex(dragSiblings, draggingId);

      // 找到目标节点在原始树中的父节点和索引
      const targetParent = findParent(newTree, targetId);
      const targetSiblings = targetParent ? targetParent.children! : newTree;
      const targetIdx = getNodeIndex(targetSiblings, targetId);

      // 记录原始状态用于比较
      const originalParentId = dragParent?.id || 'root';

      // 从原位置移除
      dragSiblings.splice(dragIndex, 1);

      let newParentId: string;
      let insertIndex: number;

      if (position === 'inside') {
        // 成为目标节点的子节点
        newParentId = targetNode.id;
        if (!targetNode.children) targetNode.children = [];
        insertIndex = targetNode.children.length;
        targetNode.children.push({ ...dragNode, parentId: targetNode.id });
        // 展开目标节点
        setExpandedIds((prev) => (prev.includes(targetNode.id) ? prev : [...prev, targetNode.id]));
      } else if (position === 'before') {
        // 插入到目标节点之前
        newParentId = targetParent?.id || 'root';
        insertIndex = targetIdx;
        targetSiblings.splice(insertIndex, 0, { ...dragNode, parentId: targetNode.parentId });
      } else {
        // after - 插入到目标节点之后
        newParentId = targetParent?.id || 'root';
        insertIndex = targetIdx + 1;
        targetSiblings.splice(insertIndex, 0, { ...dragNode, parentId: targetNode.parentId });
      }

      // 检查是否真的改变了位置
      const parentChanged = originalParentId !== newParentId;
      const indexChanged =
        originalParentId === newParentId &&
        (position === 'before' ? dragIndex !== insertIndex : dragIndex !== insertIndex - 1);

      if (!parentChanged && !indexChanged) {
        // 位置没有实际变化，不调用 API
        return;
      }

      // 先更新UI
      setDeptList(newTree);

      // 调用排序接口
      try {
        const sortList = buildSortList(newTree);
        await sortDept({ param: newTree });
        if (position === 'inside') {
          toast({
            title: t('base.organization.messages.moveToChild', {
              name: dragNode.name,
              parent: targetNode.name
            }),
            status: 'success',
            duration: 2000
          });
        } else {
          toast({
            title: t('base.organization.messages.sortSuccess'),
            status: 'success',
            duration: 2000
          });
        }
      } catch (error) {
        toast({
          title: t('base.organization.messages.sortFailed'),
          status: 'error',
          duration: 2000
        });
        // 失败时重新加载列表
        loadDeptList();
      }
    },
    [dragNodeId, dropTargetId, dropPosition, deptList, toast, loadDeptList]
  );

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setDragNodeId(null);
    setDropTargetId(null);
    setDropPosition(null);
  }, []);
  if (!ad) return null;
  return (
    <Box p={6} mx="auto">
      <Box bg="white" borderRadius="12px" boxShadow="0 2px 8px rgba(0,0,0,0.08)" p={8}>
        {/* 页面标题 */}
        <Text fontSize="20px" fontWeight="bold" color="#1D2129" mb={8}>
          {t('base.organization.title')}
        </Text>

        {/* 组织名称 */}
        <Box mb={6} w="415px">
          <Flex align="center" mb={2}>
            <Text fontSize="14px" color="#1D2129">
              {t('base.organization.orgName')}
            </Text>
            <Text color="#F53F3F" ml="4px">
              *
            </Text>
          </Flex>
          <Flex
            bg="#F7F8FA"
            borderRadius="8px"
            h="40px"
            px={4}
            align="center"
            justify="space-between"
          >
            <Text fontSize="14px" color="#1D2129">
              {orgName}
            </Text>
            <Text
              fontSize="14px"
              color="#1677ff"
              cursor="pointer"
              _hover={{ textDecoration: 'underline' }}
              onClick={handleStartEditName}
            >
              {t('base.organization.actions.edit')}
            </Text>
          </Flex>
        </Box>

        {/* 组织架构 */}
        <Box>
          <Text fontSize="14px" color="#1D2129" mb={3}>
            {t('base.organization.orgStructure')}
          </Text>
          <Box p={4} minH="400px" border="1px solid #E5E6EB" borderRadius="8px" bg="white">
            {loading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner />
              </Flex>
            ) : (
              <Box>
                {deptList.map((dept, index) => (
                  <TreeNodeItem
                    key={dept.id}
                    node={dept}
                    level={0}
                    index={index}
                    parentId="root"
                    siblings={deptList}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                    editingId={editingId}
                    addingParentId={addingParentId}
                    newDeptName={newDeptName}
                    onNewDeptNameChange={setNewDeptName}
                    onStartAdd={handleStartAdd}
                    onStartEdit={handleStartEdit}
                    onConfirmAdd={handleConfirmAdd}
                    onConfirmEdit={handleConfirmEdit}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                    dragNodeId={dragNodeId}
                    dropTargetId={dropTargetId}
                    dropPosition={dropPosition}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    t={t}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* 删除弹窗 */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('base.organization.deleteModal.title')}</ModalHeader>
          <ModalBody>
            <Text fontSize="14px" color="#4E5969">
              {t('base.organization.deleteModal.content')}
            </Text>
            <Text fontSize="14px" color="#1D2129" mt={2} fontWeight="500">
              {t('base.organization.deleteModal.confirm', { name: deleteNode?.name })}
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              {t('base.organization.actions.cancel')}
            </Button>
            <Button colorScheme="red" onClick={handleConfirmDelete}>
              {t('base.organization.actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 编辑名称弹窗 */}
      <Modal isOpen={isEditNameModalOpen} onClose={() => setIsEditNameModalOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent maxW="500px">
          <ModalHeader
            fontSize="16px"
            fontWeight="500"
            color="#1D2129"
            borderBottom="1px solid #E5E6EB"
            py={4}
          >
            {t('base.organization.editNameModal.title')}
          </ModalHeader>
          <ModalBody py={6}>
            <Flex align="center" mb={3}>
              <Text fontSize="14px" color="#4E5969">
                {t('base.organization.orgName')}
              </Text>
              <Text color="#F53F3F" ml="4px">
                *
              </Text>
            </Flex>
            <Input
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              placeholder={t('base.organization.placeholder.orgName')}
              bg="#F2F3F5"
              border="none"
              h="40px"
              fontSize="14px"
              autoFocus
            />
          </ModalBody>
          <ModalFooter borderTop="1px solid #E5E6EB" gap={3}>
            <Button variant="outline" onClick={() => setIsEditNameModalOpen(false)}>
              {t('base.organization.actions.cancel')}
            </Button>
            <Button colorScheme="blue" onClick={handleConfirmEditName}>
              {t('base.organization.actions.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
