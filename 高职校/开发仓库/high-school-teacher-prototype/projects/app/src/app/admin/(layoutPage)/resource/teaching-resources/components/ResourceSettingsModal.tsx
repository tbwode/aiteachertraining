'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Flex,
  Text,
  Button,
  Input,
  IconButton,
  Box,
  Switch,
  Tooltip,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, CloseIcon } from '@chakra-ui/icons';
import {
  addResourceType,
  updateResourceType,
  deleteResourceType,
  getResourceTypeList
} from '@/api/admin/resource-center/teaching-resource';
import type { ResourceTypeVO } from '@/types/api/admin/resource-center/teaching-resource';

type ResourceSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ResourceSettingsModal({ isOpen, onClose }: ResourceSettingsModalProps) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const [types, setTypes] = useState<ResourceTypeVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  // 新增分类弹窗状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // 编辑保存状态
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [updatingTypeId, setUpdatingTypeId] = useState<number | null>(null);

  // 删除确认弹窗状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<ResourceTypeVO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 删除被阻止提示弹窗状态
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedType, setBlockedType] = useState<ResourceTypeVO | null>(null);
  const [blockedCount, setBlockedCount] = useState(0);

  const fetchTypeList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getResourceTypeList();
      setTypes(list);
    } catch {
      toast({ title: t('resource.settingsModal.fetchFailed'), status: 'error', duration: 2000 });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  // 弹窗打开时加载资源类型列表
  useEffect(() => {
    if (isOpen) {
      void fetchTypeList();
    }
  }, [fetchTypeList, isOpen]);

  const handleEdit = (type: ResourceTypeVO) => {
    setEditingId(type.id);
    setEditingName(type.name);
  };

  const handleSave = async () => {
    if (!editingId || !editingName.trim()) return;

    setIsSavingEdit(true);
    try {
      await updateResourceType({ id: Number(editingId), name: editingName.trim() });
      toast({ title: t('resource.settingsModal.editSuccess'), status: 'success', duration: 1500 });
      setTypes(types.map((t) => (t.id === editingId ? { ...t, name: editingName.trim() } : t)));
      setEditingId(null);
      setEditingName('');
    } catch {
      toast({ title: t('resource.settingsModal.editFailed'), status: 'error', duration: 2000 });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleToggleStatus = async (type: ResourceTypeVO) => {
    setUpdatingTypeId(type.id);
    const nextStatus = type.status === 1 ? 0 : 1;
    try {
      await updateResourceType({
        id: type.id,
        name: type.name,
        status: nextStatus,
        sortOrder: type.sortOrder
      });
      setTypes((current) =>
        current.map((item) => (item.id === type.id ? { ...item, status: nextStatus } : item))
      );
      toast({
        title: nextStatus === 1 ? '分类已启用' : '分类已停用',
        description: '教师端资源广场将同步更新',
        status: 'success',
        duration: 1500
      });
    } catch {
      toast({ title: '分类状态更新失败', status: 'error', duration: 2000 });
    } finally {
      setUpdatingTypeId(null);
    }
  };

  const handleMoveType = async (type: ResourceTypeVO, direction: -1 | 1) => {
    const sorted = [...types].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = sorted.findIndex((item) => item.id === type.id);
    const target = sorted[currentIndex + direction];
    if (!target) return;
    setUpdatingTypeId(type.id);
    try {
      await Promise.all([
        updateResourceType({
          id: type.id,
          name: type.name,
          status: type.status,
          sortOrder: target.sortOrder
        }),
        updateResourceType({
          id: target.id,
          name: target.name,
          status: target.status,
          sortOrder: type.sortOrder
        })
      ]);
      setTypes(
        sorted
          .map((item) => {
            if (item.id === type.id) return { ...item, sortOrder: target.sortOrder };
            if (item.id === target.id) return { ...item, sortOrder: type.sortOrder };
            return item;
          })
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
      toast({ title: '分类排序已更新', status: 'success', duration: 1200 });
    } catch {
      toast({ title: '分类排序更新失败', status: 'error', duration: 2000 });
    } finally {
      setUpdatingTypeId(null);
    }
  };

  const handleOpenAddModal = () => {
    setNewTypeName('');
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewTypeName('');
  };

  const handleAdd = async () => {
    const name = newTypeName.trim();
    if (!name) return;

    setIsAdding(true);
    try {
      await addResourceType({ name });
      toast({ title: t('resource.settingsModal.addSuccess'), status: 'success', duration: 1500 });
      await fetchTypeList();
      setIsAddModalOpen(false);
      setNewTypeName('');
    } catch (error: any) {
      const errorMsg = error?.msg || t('resource.settingsModal.addFailed');
      toast({ title: errorMsg, status: 'error', duration: 2000 });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteClick = (type: ResourceTypeVO) => {
    setDeletingType(type);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingType) return;

    setIsDeleting(true);
    try {
      const result = await deleteResourceType(Number(deletingType.id));
      if (result.success) {
        toast({
          title: t('resource.settingsModal.deleteSuccess'),
          status: 'success',
          duration: 1500
        });
        setTypes(types.filter((t) => t.id !== deletingType.id));
        setIsDeleteModalOpen(false);
        setDeletingType(null);
      } else {
        setBlockedType(deletingType);
        setBlockedCount(result.referencedCount);
        setIsDeleteModalOpen(false);
        setDeletingType(null);
        setIsBlockedModalOpen(true);
      }
    } catch {
      toast({ title: t('resource.settingsModal.deleteFailed'), status: 'error', duration: 2000 });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingType(null);
  };

  const handleCloseBlockedModal = () => {
    setIsBlockedModalOpen(false);
    setBlockedType(null);
    setBlockedCount(0);
  };

  return (
    <>
      {/* 主弹窗 - 资源设置 */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="12px" maxW="480px">
          <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
            <Flex justify="space-between" align="center">
              <Text fontSize="16px" fontWeight="500" color="#1D2129">
                {t('resource.settingsModal.title')}
              </Text>
              <IconButton
                aria-label={t('resource.actions.close')}
                icon={<CloseIcon w={3} h={3} />}
                variant="ghost"
                size="sm"
                onClick={onClose}
                color="#86909C"
                _hover={{ bg: 'transparent', color: '#4E5969' }}
              />
            </Flex>
          </ModalHeader>

          <ModalBody py={4} px={5}>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="14px" fontWeight="500" color="#1D2129">
                {t('resource.settingsModal.categoryConfig')}
              </Text>
              <Button
                size="xs"
                h="28px"
                px={3}
                borderRadius="4px"
                bg="#2D2D2D"
                color="white"
                fontSize="12px"
                fontWeight="400"
                onClick={handleOpenAddModal}
                _hover={{ bg: '#1F1F1F' }}
              >
                {t('resource.settingsModal.addCategory')}
              </Button>
            </Flex>

            <Box maxH="320px" overflowY="auto">
              {loading ? (
                <Flex justify="center" align="center" py={8}>
                  <Spinner size="md" color="#C8000B" mr={2} />
                  <Text fontSize="14px" color="#86909C">
                    {t('resource.table.loading')}
                  </Text>
                </Flex>
              ) : types.length === 0 ? (
                <Flex justify="center" align="center" py={8}>
                  <Text fontSize="14px" color="#86909C">
                    {t('resource.settingsModal.noTypes')}
                  </Text>
                </Flex>
              ) : (
                [...types]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((type, typeIndex, sortedTypes) => (
                    <Flex
                      key={type.id}
                      justify="space-between"
                      align="center"
                      py={3}
                      borderBottom="1px solid #F5F5F5"
                      _last={{ borderBottom: 'none' }}
                    >
                      {editingId === type.id ? (
                        <Flex gap={2} flex={1} align="center">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            h="32px"
                            fontSize="14px"
                            borderColor="#E5E6EB"
                            borderRadius="4px"
                            autoFocus
                          />
                          <Button
                            size="xs"
                            h="28px"
                            bg="#2D2D2D"
                            color="white"
                            onClick={handleSave}
                            isLoading={isSavingEdit}
                            loadingText={t('resource.settingsModal.saving')}
                            isDisabled={isSavingEdit}
                            _hover={{ bg: '#1F1F1F' }}
                          >
                            {t('resource.settingsModal.save')}
                          </Button>
                          <Button
                            size="xs"
                            h="28px"
                            variant="outline"
                            borderColor="#D9D9D9"
                            onClick={handleCancelEdit}
                            isDisabled={isSavingEdit}
                          >
                            {t('resource.actions.cancel')}
                          </Button>
                        </Flex>
                      ) : (
                        <>
                          <Box>
                            <Text fontSize="14px" color="#1D2129" fontWeight={500}>
                              {type.name}
                            </Text>
                            <Text
                              mt={0.5}
                              fontSize="11px"
                              color={type.status === 1 ? '#067647' : '#98A2B3'}
                            >
                              {type.status === 1 ? '已启用 · 教师端可见' : '已停用 · 教师端隐藏'}
                            </Text>
                          </Box>
                          <Flex gap={1} align="center">
                            <Tooltip label={type.status === 1 ? '停用分类' : '启用分类'} hasArrow>
                              <Box px={1.5}>
                                <Switch
                                  aria-label={`${type.status === 1 ? '停用' : '启用'}${type.name}`}
                                  size="sm"
                                  colorScheme="red"
                                  isChecked={type.status === 1}
                                  isDisabled={updatingTypeId === type.id}
                                  onChange={() => void handleToggleStatus(type)}
                                />
                              </Box>
                            </Tooltip>
                            <Tooltip label="上移" hasArrow>
                              <IconButton
                                aria-label={`上移${type.name}`}
                                icon={<ChevronUpIcon boxSize={4} />}
                                variant="ghost"
                                size="sm"
                                minW="28px"
                                h="28px"
                                isDisabled={typeIndex === 0 || updatingTypeId === type.id}
                                onClick={() => void handleMoveType(type, -1)}
                              />
                            </Tooltip>
                            <Tooltip label="下移" hasArrow>
                              <IconButton
                                aria-label={`下移${type.name}`}
                                icon={<ChevronDownIcon boxSize={4} />}
                                variant="ghost"
                                size="sm"
                                minW="28px"
                                h="28px"
                                isDisabled={
                                  typeIndex === sortedTypes.length - 1 || updatingTypeId === type.id
                                }
                                onClick={() => void handleMoveType(type, 1)}
                              />
                            </Tooltip>
                            {/* 编辑图标 */}
                            <IconButton
                              aria-label={t('resource.actions.edit')}
                              icon={
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#C8000B"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 20h9"></path>
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                              }
                              variant="ghost"
                              size="sm"
                              minW="24px"
                              h="24px"
                              onClick={() => handleEdit(type)}
                              _hover={{ bg: 'transparent' }}
                            />
                            {/* 删除图标 */}
                            <IconButton
                              aria-label={t('resource.actions.delete')}
                              icon={
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#86909C"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              }
                              variant="ghost"
                              size="sm"
                              minW="24px"
                              h="24px"
                              onClick={() => handleDeleteClick(type)}
                              _hover={{ bg: 'transparent' }}
                            />
                          </Flex>
                        </>
                      )}
                    </Flex>
                  ))
              )}
            </Box>

            <Text fontSize="12px" color="#86909C" mt={3}>
              {t('resource.settingsModal.note')}
            </Text>
          </ModalBody>

          <ModalFooter
            py={4}
            px={5}
            borderTop="1px solid"
            borderColor="#F0F0F0"
            justifyContent="flex-end"
            gap={2}
          >
            <Button
              h="36px"
              px={5}
              borderRadius="6px"
              borderColor="#D9D9D9"
              variant="outline"
              bg="white"
              color="#4E5969"
              fontSize="14px"
              fontWeight="400"
              onClick={onClose}
              _hover={{ borderColor: '#2D2D2D', color: '#2D2D2D' }}
            >
              {t('resource.actions.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 新增分类弹窗 */}
      <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} size="sm" isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="12px" maxW="400px">
          <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
            <Flex justify="space-between" align="center">
              <Text fontSize="16px" fontWeight="500" color="#1D2129">
                {t('resource.settingsModal.addModalTitle')}
              </Text>
              <IconButton
                aria-label={t('resource.actions.close')}
                icon={<CloseIcon w={3} h={3} />}
                variant="ghost"
                size="sm"
                onClick={handleCloseAddModal}
                color="#86909C"
                _hover={{ bg: 'transparent', color: '#4E5969' }}
              />
            </Flex>
          </ModalHeader>

          <ModalBody py={4} px={5}>
            <Text fontSize="14px" color="#4E5969" mb={3}>
              {t('resource.settingsModal.addModalText')}
            </Text>
            <Input
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value.slice(0, 10))}
              h="40px"
              fontSize="14px"
              borderColor="#E5E6EB"
              borderRadius="6px"
              autoFocus
              placeholder=""
            />
          </ModalBody>

          <ModalFooter py={4} px={5} justifyContent="flex-end" gap={2}>
            <Button
              h="36px"
              px={5}
              borderRadius="6px"
              borderColor="#D9D9D9"
              variant="outline"
              bg="white"
              color="#4E5969"
              fontSize="14px"
              fontWeight="400"
              onClick={handleCloseAddModal}
              _hover={{ borderColor: '#2D2D2D', color: '#2D2D2D' }}
            >
              {t('resource.actions.cancel')}
            </Button>
            <Button
              h="36px"
              px={5}
              borderRadius="6px"
              bg="#2D2D2D"
              color="white"
              fontSize="14px"
              fontWeight="400"
              onClick={handleAdd}
              isLoading={isAdding}
              loadingText={t('resource.settingsModal.saving')}
              isDisabled={!newTypeName.trim() || isAdding}
              _hover={{ bg: '#1F1F1F' }}
            >
              {t('resource.actions.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认/提示弹窗 */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCancelDelete} size="sm" isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="12px" maxW="400px">
          <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                {/* 红色感叹号图标 */}
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="full"
                  bg="#F53F3F"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="12px" color="white" fontWeight="600">
                    !
                  </Text>
                </Box>
                <Text fontSize="16px" fontWeight="500" color="#1D2129">
                  {t('resource.settingsModal.deleteConfirmTitle')}
                </Text>
              </Flex>
              <IconButton
                aria-label={t('resource.actions.close')}
                icon={<CloseIcon w={3} h={3} />}
                variant="ghost"
                size="sm"
                onClick={handleCancelDelete}
                color="#86909C"
                _hover={{ bg: 'transparent', color: '#4E5969' }}
              />
            </Flex>
          </ModalHeader>

          <ModalBody py={4} px={5}>
            {deletingType ? (
              <Text fontSize="14px" color="#4E5969">
                {t('resource.settingsModal.deleteConfirmText', { name: deletingType.name })}
              </Text>
            ) : null}
          </ModalBody>

          <ModalFooter py={4} px={5} justifyContent="flex-end" gap={2}>
            <Button
              h="36px"
              px={5}
              borderRadius="6px"
              borderColor="#D9D9D9"
              variant="outline"
              bg="white"
              color="#4E5969"
              fontSize="14px"
              fontWeight="400"
              onClick={handleCancelDelete}
              isDisabled={isDeleting}
              _hover={{ borderColor: '#2D2D2D', color: '#2D2D2D' }}
            >
              {t('resource.actions.cancel')}
            </Button>
            <Button
              h="36px"
              px={5}
              borderRadius="6px"
              bg="#2D2D2D"
              color="white"
              fontSize="14px"
              fontWeight="400"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              loadingText={t('resource.settingsModal.deleting')}
              isDisabled={isDeleting}
              _hover={{ bg: '#1F1F1F' }}
            >
              {t('resource.actions.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除被阻止提示弹窗 */}
      <Modal isOpen={isBlockedModalOpen} onClose={handleCloseBlockedModal} size="sm" isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="12px" maxW="400px">
          <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                {/* 红色感叹号图标 */}
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="full"
                  bg="#F53F3F"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="12px" color="white" fontWeight="600">
                    !
                  </Text>
                </Box>
                <Text fontSize="16px" fontWeight="500" color="#1D2129">
                  {t('resource.settingsModal.deleteBlockedTitle')}
                </Text>
              </Flex>
              <IconButton
                aria-label={t('resource.actions.close')}
                icon={<CloseIcon w={3} h={3} />}
                variant="ghost"
                size="sm"
                onClick={handleCloseBlockedModal}
                color="#86909C"
                _hover={{ bg: 'transparent', color: '#4E5969' }}
              />
            </Flex>
          </ModalHeader>

          <ModalBody py={4} px={5}>
            {blockedType ? (
              <Text fontSize="14px" color="#4E5969">
                {t('resource.settingsModal.deleteBlockedText', {
                  name: blockedType.name,
                  count: blockedCount
                })}
              </Text>
            ) : null}
          </ModalBody>

          <ModalFooter py={4} px={5} justifyContent="flex-end" gap={2}>
            <Button
              h="36px"
              px={5}
              borderRadius="6px"
              borderColor="#D9D9D9"
              variant="outline"
              bg="white"
              color="#4E5969"
              fontSize="14px"
              fontWeight="400"
              onClick={handleCloseBlockedModal}
              _hover={{ borderColor: '#2D2D2D', color: '#2D2D2D' }}
            >
              {t('resource.actions.cancel')}
            </Button>
            <Button
              h="36px"
              px={5}
              borderRadius="6px"
              bg="#2D2D2D"
              color="white"
              fontSize="14px"
              fontWeight="400"
              onClick={handleCloseBlockedModal}
              _hover={{ bg: '#1F1F1F' }}
            >
              {t('resource.actions.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
