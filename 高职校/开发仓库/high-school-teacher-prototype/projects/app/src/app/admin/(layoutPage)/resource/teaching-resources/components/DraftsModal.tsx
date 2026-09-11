'use client';

import { useState, useEffect } from 'react';
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
  IconButton,
  Box,
  Button,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import {
  getDraftList,
  deleteDraftResource,
  getResourceDetail
} from '@/api/admin/resource-center/teaching-resource';
import type { DraftItem, ResourceVO } from '@/types/api/admin/resource-center/teaching-resource';
import { FileIcon } from '@/app/teacher/(layoutPage)/profile/components/FileIcon';

type DraftsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (draft: ResourceVO) => void;
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function DraftsModal({ isOpen, onClose, onEdit }: DraftsModalProps) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState<DraftItem | null>(null);

  // 弹窗打开时加载草稿箱列表
  useEffect(() => {
    if (isOpen) {
      fetchDraftList();
    }
  }, [isOpen]);

  const fetchDraftList = async () => {
    setLoading(true);
    try {
      const list = await getDraftList();
      setDrafts(list || []);
    } catch {
      toast({ title: t('resource.draftsModal.fetchFailed'), status: 'error', duration: 2000 });
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (draft: DraftItem) => {
    setDeletingDraft(draft);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDraft) return;
    try {
      await deleteDraftResource(deletingDraft.id);
      setDrafts(drafts.filter((d) => d.id !== deletingDraft.id));
      toast({ title: t('resource.draftsModal.deleteSuccess'), status: 'success', duration: 2000 });
    } catch {
      toast({ title: t('resource.draftsModal.deleteFailed'), status: 'error', duration: 2000 });
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingDraft(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingDraft(null);
  };

  const handleEditClick = async (draft: DraftItem) => {
    try {
      const detail = await getResourceDetail(draft.id);
      onEdit?.(detail);
      onClose();
    } catch {
      toast({
        title: t('resource.draftsModal.fetchDetailFailed'),
        status: 'error',
        duration: 2000
      });
    }
  };

  return (
    <>
      {/* 草稿箱主弹窗 */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="12px" maxW="560px" maxH="80vh">
          <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
            <Flex justify="space-between" align="center">
              <Text fontSize="16px" fontWeight="500" color="#1D2129">
                {t('resource.draftsModal.title')}
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

          <ModalBody py={3} px={5} maxH="400px" overflowY="auto">
            {loading ? (
              <Flex justify="center" align="center" py={16}>
                <Spinner size="md" color="#C8000B" mr={2} />
                <Text fontSize="14px" color="#86909C">
                  {t('resource.table.loading')}
                </Text>
              </Flex>
            ) : drafts.length === 0 ? (
              <Flex justify="center" align="center" py={16}>
                <Text fontSize="14px" color="#86909C">
                  {t('resource.draftsModal.noDrafts')}
                </Text>
              </Flex>
            ) : (
              drafts.map((draft) => {
                return (
                  <Flex
                    key={draft.id}
                    justify="space-between"
                    align="center"
                    py={4}
                    px={4}
                    my={3}
                    borderRadius="8px"
                    border="1px solid #E5E6EB"
                    bg="white"
                  >
                    <Flex gap={4} align="center" flex={1}>
                      <FileIcon fileName={draft.fileName} />
                      <Box>
                        <Text fontSize="14px" color="#1D2129" fontWeight="500">
                          {draft.fileName}
                        </Text>
                        <Text fontSize="12px" color="#86909C" mt={1}>
                          {t('resource.draftsModal.savedAt')} {draft.createTime} &nbsp;&nbsp;
                          {t('resource.draftsModal.fileSize')}{' '}
                          {draft.fileSize
                            ? formatFileSize(draft.fileSize)
                            : t('resource.draftsModal.pendingUpload')}
                        </Text>
                      </Box>
                    </Flex>
                    <Flex gap={2} align="center">
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
                        minW="28px"
                        h="28px"
                        onClick={() => handleEditClick(draft)}
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
                        minW="28px"
                        h="28px"
                        onClick={() => handleDeleteClick(draft)}
                        _hover={{ bg: 'transparent' }}
                      />
                    </Flex>
                  </Flex>
                );
              })
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 删除确认弹窗 */}
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
                  {t('resource.draftsModal.deleteConfirmTitle')}
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
            <Text fontSize="14px" color="#4E5969">
              {t('resource.draftsModal.deleteConfirmText')}
            </Text>
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
