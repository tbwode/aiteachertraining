'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import {
  getDraftPage,
  deleteResource,
  getResourceDetail,
  type MyResourceVO
} from '@/api/teacher/resource/my-resources';
import { FileIcon } from '../FileIcon';

// 文件大小格式化
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export interface DraftBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditDraft: (detail: any) => void;
}

export default function DraftBoxModal({ isOpen, onClose, onEditDraft }: DraftBoxModalProps) {
  const { t } = useTranslation('teacher');
  useTeacherPageI18n(['profile']);
  const toast = useToast();

  const [drafts, setDrafts] = useState<MyResourceVO[]>([]);
  const [draftLoading, setDraftLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<MyResourceVO | null>(null);
  const [deletingResource, setDeletingResource] = useState(false);

  // 获取草稿列表
  const fetchDrafts = useCallback(async () => {
    setDraftLoading(true);
    try {
      const res = await getDraftPage({ current: 1, size: 20 });
      const list = (res as any).records || (res as any) || [];
      setDrafts(Array.isArray(list) ? list : []);
    } catch (error: any) {
      const errorMsg = error?.msg || error?.message || t('profile.myResources.draftBox.loadError');
      toast({ title: errorMsg, status: 'error', duration: 2000, position: 'top' });
    } finally {
      setDraftLoading(false);
    }
  }, [toast]);

  // 弹窗打开时加载草稿
  useEffect(() => {
    if (isOpen) {
      fetchDrafts();
    }
  }, [isOpen, fetchDrafts]);

  // 处理编辑草稿
  const handleEditDraft = useCallback(
    async (draft: MyResourceVO) => {
      try {
        const detail = await getResourceDetail(draft.id);
        onEditDraft(detail);
      } catch (error: any) {
        const errorMsg =
          error?.msg || error?.message || t('profile.myResources.draftBox.detailError');
        toast({ title: errorMsg, status: 'error', duration: 2000, position: 'top' });
      }
    },
    [onEditDraft, toast]
  );

  // 处理删除草稿
  const handleDeleteDraft = useCallback(async () => {
    if (!draftToDelete) return;
    setDeletingResource(true);
    try {
      await deleteResource(draftToDelete.id);
      setDrafts((prev) => prev.filter((d) => d.id !== draftToDelete.id));
      toast({
        title: t('profile.myResources.draftBox.deleteSuccess'),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    } catch (error: any) {
      const errorMsg =
        error?.msg || error?.message || t('profile.myResources.draftBox.deleteError');
      toast({ title: errorMsg, status: 'error', duration: 2000, position: 'top' });
    } finally {
      setDeletingResource(false);
      setDeleteConfirmOpen(false);
      setDraftToDelete(null);
    }
  }, [draftToDelete, toast]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" />
        <ModalContent borderRadius="12px" overflow="hidden" w="700px" maxW="90vw" maxH="80vh">
          <ModalHeader
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            py={4}
            px={5}
            borderBottom="1px solid #F0F0F0"
            fontSize="16px"
            fontWeight={600}
            color="#1D2129"
          >
            {t('profile.myResources.draftBox.title')}
            <IconButton
              aria-label={t('profile.myResources.modal.close')}
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              }
              size="sm"
              variant="ghost"
              color="#86909C"
              _hover={{ color: '#1D2129', bg: 'transparent' }}
              onClick={onClose}
            />
          </ModalHeader>
          <ModalBody py={4} px={5} maxH="calc(80vh - 140px)" overflowY="auto">
            {/* 提示信息 */}
            <Flex align="center" gap={2} p={3} bg="#F7F8FA" borderRadius="6px" mb={4}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M7.99935 2.66732C5.06602 2.66732 2.66602 5.06732 2.66602 8.00065C2.66602 10.934 5.06602 13.334 7.99935 13.334C10.9327 13.334 13.3327 10.934 13.3327 8.00065C13.3327 5.06732 10.9327 2.66732 7.99935 2.66732ZM7.99935 4.00065C10.1993 4.00065 11.9993 5.80065 11.9993 8.00065C11.9993 10.2007 10.1993 12.0007 7.99935 12.0007C5.79935 12.0007 3.99935 10.2007 3.99935 8.00065C3.99935 5.80065 5.79935 4.00065 7.99935 4.00065ZM8.66602 6.66732V5.33398H7.33268V6.66732H8.66602ZM8.66602 10.6673V7.33398H7.33268V10.6673H8.66602Z"
                  fill="#4E5969"
                />
              </svg>
              <Text fontSize="13px" color="#86909C">
                {t('profile.myResources.draftBox.tip')}
              </Text>
            </Flex>
            {draftLoading ? (
              <Flex justify="center" align="center" gap={2} py={16}>
                <Spinner size="md" color="#C8000B" />
                <Text color="gray.500">{t('profile.myResources.draftBox.loading')}</Text>
              </Flex>
            ) : drafts.length === 0 ? (
              <Flex direction="column" align="center" gap={2} color="gray.500" py={16}>
                <Text fontSize="14px" fontWeight={600}>
                  {t('profile.myResources.draftBox.emptyTitle')}
                </Text>
                <Text fontSize="12px">{t('profile.myResources.draftBox.emptyDescription')}</Text>
              </Flex>
            ) : (
              drafts.map((draft) => (
                <Box
                  key={draft.id}
                  border="1px solid #e5e7eb"
                  borderRadius="8px"
                  p={3}
                  mb={3}
                  _last={{ mb: 0 }}
                >
                  <Flex align="center" gap={3}>
                    {/* 文件图标 */}
                    <Box flexShrink={0} w="40px" h="40px">
                      <FileIcon fileName={draft.fileName} />
                    </Box>
                    {/* 文件信息 */}
                    <Box flex={1} minW="200px">
                      <Text fontSize="14px" fontWeight={500} color="#1D2129">
                        {draft.fileName}
                      </Text>
                      <Text fontSize="12px" color="#86909C" mt={0.5}>
                        {t('profile.myResources.draftBox.savedAt')} {draft.createTime || '-'} |{' '}
                        {draft.fileUrl
                          ? `${t('profile.myResources.draftBox.fileSize')}: ${formatFileSize(draft.fileSize)}`
                          : t('profile.myResources.draftBox.notUploaded')}
                      </Text>
                    </Box>
                    {/* 操作按钮 - 图标按钮 */}
                    <Flex gap={2} flexShrink={0}>
                      <IconButton
                        aria-label={t('profile.myResources.draftBox.edit')}
                        icon={
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#C8000B"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        }
                        size="sm"
                        variant="ghost"
                        _hover={{ bg: 'transparent' }}
                        onClick={() => handleEditDraft(draft)}
                      />
                      <IconButton
                        aria-label={t('profile.myResources.draftBox.delete')}
                        icon={
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#86909C"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        }
                        size="sm"
                        variant="ghost"
                        _hover={{ bg: 'transparent' }}
                        onClick={() => {
                          setDraftToDelete(draft);
                          setDeleteConfirmOpen(true);
                        }}
                      />
                    </Flex>
                  </Flex>
                </Box>
              ))
            )}
          </ModalBody>
          <ModalFooter justifyContent="flex-end" py={4} px={5} borderTop="1px solid #F0F0F0">
            <Button
              variant="outline"
              borderColor="#2D2D2D"
              color="#2D2D2D"
              bg="white"
              px={5}
              h="36px"
              fontSize="14px"
              borderRadius="6px"
              _hover={{ bg: '#F5F5F5' }}
              onClick={onClose}
            >
              {t('profile.myResources.draftBox.cancel')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        size="sm"
        isCentered
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" />
        <ModalContent
          borderRadius="8px"
          overflow="hidden"
          w="400px"
          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
        >
          <ModalBody py={5} px={5}>
            <Flex direction="column" align="flex-start">
              {/* 标题行 */}
              <Flex align="center" gap={2} mb={3}>
                {/* 问号图标 */}
                <Flex
                  w="20px"
                  h="20px"
                  borderRadius="full"
                  border="1.5px solid #C8000B"
                  align="center"
                  justify="center"
                >
                  <Text fontSize="12px" color="#C8000B" fontWeight={600} lineHeight="1">
                    ?
                  </Text>
                </Flex>
                <Text fontSize="15px" fontWeight={600} color="#1D2129">
                  {t('profile.myResources.draftBox.deleteConfirmTitle')}
                </Text>
              </Flex>
              {/* 提示信息 */}
              <Text fontSize="14px" color="#4E5969" mb={5} ml="28px">
                {t('profile.myResources.draftBox.deleteConfirmContent', {
                  name: draftToDelete?.fileName
                })}
              </Text>
              {/* 按钮 */}
              <Flex gap={2} justify="flex-end" w="100%">
                <Button
                  variant="outline"
                  borderColor="#E5E6EB"
                  color="#4E5969"
                  bg="white"
                  px={4}
                  h="32px"
                  fontSize="13px"
                  borderRadius="4px"
                  _hover={{ borderColor: '#C8000B', color: '#C8000B' }}
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  {t('profile.myResources.draftBox.cancel')}
                </Button>
                <Button
                  bg="#C8000B"
                  color="white"
                  px={4}
                  h="32px"
                  fontSize="13px"
                  borderRadius="4px"
                  _hover={{ bg: '#b03030' }}
                  isLoading={deletingResource}
                  loadingText={t('profile.myResources.draftBox.deleting')}
                  onClick={handleDeleteDraft}
                >
                  {t('profile.myResources.draftBox.confirm')}
                </Button>
              </Flex>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
