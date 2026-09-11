'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import {
  Box,
  Button,
  Flex,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { getNewsPage, deleteNews } from '@/api/admin/teaching/news';
import type { NewsVO } from '@/types/api/admin/teaching/news';
import { ENewsStatus } from '@/types/api/admin/teaching/news';

const pageSize = 10;

// 资讯类型映射
const getNewsTypeMap = (t: (key: string) => string): Record<number, string> => ({
  1: t('content.news.type.notice'),
  2: t('content.news.type.news'),
  3: t('content.news.type.policy'),
  4: t('content.news.type.teaching'),
  5: t('content.news.type.exchange'),
  6: t('content.news.type.achievement'),
  7: t('content.news.type.honor')
});

export default function DraftsPage() {
  const { t } = useTranslation('admin');
  useAdminPageI18n(['content']);
  const router = useRouter();
  const toast = useToast();
  const [news, setNews] = useState<NewsVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 删除弹窗
  const deleteModal = useDisclosure();
  const [deletingNews, setDeletingNews] = useState<NewsVO | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 加载草稿列表
  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNewsPage({
        current: currentPage,
        size: pageSize,
        status: ENewsStatus.DRAFT
      });
      setNews(res.records || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || 1);
    } catch (error) {
      toast({
        title: t('content.news.drafts.messages.loadFailed'),
        status: 'error',
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, t, toast]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // 删除
  const handleDeleteClick = (item: NewsVO) => {
    setDeletingNews(item);
    deleteModal.onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!deletingNews?.id) return;
    setDeleting(true);
    try {
      await deleteNews({ id: deletingNews.id });
      toast({
        title: t('content.news.drafts.messages.deleteSuccess'),
        status: 'success',
        duration: 2000
      });
      loadDrafts();
      deleteModal.onClose();
    } catch (error) {
      toast({
        title: t('content.news.drafts.messages.deleteFailed'),
        status: 'error',
        duration: 2000
      });
    } finally {
      setDeleting(false);
    }
  };

  // 编辑草稿
  const handleEdit = (id: string) => {
    router.push(`/admin/content/news/edit?id=${id}`);
  };

  // 返回资讯列表
  const handleBack = () => {
    router.push('/admin/content/news');
  };

  // 获取资讯类型映射
  const newsTypeMap = getNewsTypeMap(t);

  return (
    <Box p={6} bg="white" borderRadius="8px">
      {/* 返回标题 */}
      <Box borderBottom="1px solid #C8000B" pb={4} mb={6}>
        <Flex align="center" gap={4}>
          <Flex
            fontSize="16px"
            color="#C8000B"
            fontWeight="400"
            cursor="pointer"
            align="center"
            onClick={handleBack}
          >
            <ChevronLeftIcon boxSize={5} />
            <Text>{t('content.news.drafts.back')}</Text>
          </Flex>
          <Text color="#303133" fontSize="20px" fontWeight="bold">
            {t('content.news.drafts.title')}
          </Text>
        </Flex>
      </Box>

      {/* 表格 */}
      <Box overflowX="auto">
        <Table
          variant="simple"
          sx={{ tableLayout: 'fixed', minWidth: '800px', th: { textTransform: 'none' } }}
        >
          <Thead bg="#F7F8FA">
            <Tr>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                w="300px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.drafts.table.title')}
              </Th>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                w="120px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.drafts.table.type')}
              </Th>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                w="150px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.drafts.table.createTime')}
              </Th>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                w="150px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.drafts.table.updateTime')}
              </Th>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                textAlign="center"
                w="200px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.drafts.table.actions')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={5} py={16} borderBottom="1px solid #E5E6EB">
                  <Flex direction="column" align="center" gap={2} color="gray.500">
                    <Spinner size="md" />
                    <Text fontSize="14px" fontWeight="600">
                      {t('content.news.loading')}
                    </Text>
                  </Flex>
                </Td>
              </Tr>
            ) : news.length > 0 ? (
              news.map((item) => (
                <Tr key={item.id} _hover={{ bg: '#F7F8FA' }}>
                  <Td
                    px={4}
                    py={3.5}
                    borderBottom="1px solid #E5E6EB"
                    fontSize="14px"
                    color="#1D2129"
                    noOfLines={1}
                  >
                    {item.title || '-'}
                  </Td>
                  <Td px={4} py={3.5} borderBottom="1px solid #E5E6EB">
                    <Box
                      w="64px"
                      lineHeight="27px"
                      textAlign="center"
                      bg="#F2F3F5"
                      borderRadius="2px"
                      color="#1D2129"
                      fontSize="12px"
                    >
                      {newsTypeMap[item.newsType] || '-'}
                    </Box>
                  </Td>
                  <Td
                    px={4}
                    py={3.5}
                    borderBottom="1px solid #E5E6EB"
                    fontSize="14px"
                    color="#1D2129"
                  >
                    {item.createTime ? dayjs(item.createTime).format('YYYY-MM-DD HH:mm') : '-'}
                  </Td>
                  <Td
                    px={4}
                    py={3.5}
                    borderBottom="1px solid #E5E6EB"
                    fontSize="14px"
                    color="#1D2129"
                  >
                    {item.updateTime ? dayjs(item.updateTime).format('YYYY-MM-DD HH:mm') : '-'}
                  </Td>
                  <Td px={4} py={3.5} borderBottom="1px solid #E5E6EB">
                    <Flex justify="center" gap={2}>
                      <Button
                        w="72px"
                        h="32px"
                        variant="outline"
                        borderColor="#7D4DFF"
                        color="#7D4DFF"
                        bg="white"
                        borderRadius="6px"
                        fontSize="13px"
                        _hover={{ bg: '#F5F0FF' }}
                        onClick={() => handleEdit(item.id)}
                      >
                        {t('content.news.drafts.edit')}
                      </Button>
                      <Button
                        w="72px"
                        h="32px"
                        variant="outline"
                        borderColor="#D1D5DB"
                        color="#4E5969"
                        bg="white"
                        borderRadius="6px"
                        fontSize="13px"
                        _hover={{ bg: '#FAFAFA' }}
                        onClick={() => handleDeleteClick(item)}
                      >
                        {t('content.news.drafts.delete')}
                      </Button>
                    </Flex>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={5} py={16} borderBottom="1px solid #E5E6EB">
                  <Flex direction="column" align="center" gap={2} color="gray.500">
                    <Text fontSize="14px" fontWeight="600">
                      {t('content.news.drafts.empty')}
                    </Text>
                  </Flex>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* 分页 */}
      <Flex
        justify="space-between"
        align="center"
        px={4}
        py={3.5}
        borderTopWidth="1px"
        borderColor="blackAlpha.100"
      >
        <Text color="gray.500" fontSize="14px">
          {t('content.news.pagination.total', { total })}
        </Text>
        <Flex align="center" gap={2}>
          <Button
            variant="outline"
            size="sm"
            isDisabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            {t('content.news.pagination.prev')}
          </Button>
          <Text minW="120px" textAlign="center" fontSize="14px" color="gray.600">
            {t('content.news.pagination.pageInfo', { page: currentPage, totalPages })}
          </Text>
          <Button
            variant="outline"
            size="sm"
            isDisabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            {t('content.news.pagination.next')}
          </Button>
        </Flex>
      </Flex>

      {/* 删除确认弹窗 */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent rounded="16px" maxW="400px">
          <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="gray.100">
            <Text fontSize="16px" fontWeight="600">
              {t('content.news.drafts.modal.deleteTitle')}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5} px={5}>
            <Text fontSize="14px" color="gray.600">
              {t('content.news.drafts.modal.deleteConfirm')}
            </Text>
          </ModalBody>
          <ModalFooter py={4} px={5} borderTop="1px solid" borderColor="gray.100" gap={3}>
            <Button
              h="40px"
              px={6}
              variant="outline"
              borderRadius="8px"
              onClick={deleteModal.onClose}
            >
              {t('content.news.drafts.modal.cancel')}
            </Button>
            <Button
              h="40px"
              px={6}
              bg="#F53F3F"
              color="white"
              borderRadius="8px"
              fontWeight="500"
              _hover={{ bg: '#E03C3C' }}
              onClick={handleConfirmDelete}
              isLoading={deleting}
            >
              {t('content.news.drafts.modal.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
