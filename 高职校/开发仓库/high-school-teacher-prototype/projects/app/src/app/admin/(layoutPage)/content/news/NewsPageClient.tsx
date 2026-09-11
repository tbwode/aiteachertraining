'use client';

import { useCallback, useEffect, useState } from 'react';
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
  Badge,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import {
  getNewsPage,
  deleteNews,
  updateNewsStatus,
  updateNewsTopStatus
} from '@/api/admin/teaching/news';
import type { NewsVO } from '@/types/api/admin/teaching/news';
import { ENewsStatus } from '@/types/api/admin/teaching/news';
import type { ENewsType, ENewsLevel } from '@/types/api/admin/teaching/news';
import SearchBar from './components/SearchBar';

const pageSize = 10;

// 资讯类型映射 - 动态获取
const getNewsTypeMap = (t: (key: string) => string): Record<number, string> => ({
  1: t('content.news.type.notice'),
  2: t('content.news.type.news'),
  3: t('content.news.type.policy'),
  4: t('content.news.type.teaching'),
  5: t('content.news.type.exchange'),
  6: t('content.news.type.achievement'),
  7: t('content.news.type.honor')
});

// 归属层级映射 - 动态获取
const getLevelMap = (t: (key: string) => string): Record<number, string> => ({
  1: t('content.news.level.school'),
  2: t('content.news.level.group')
});

export default function NewsPageClient() {
  const { t } = useTranslation('admin');
  useAdminPageI18n(['content']);
  const router = useRouter();
  const toast = useToast();

  // 获取映射数据
  const newsTypeMap = getNewsTypeMap((key: string) => t(key));
  const levelMap = getLevelMap((key: string) => t(key));
  const [news, setNews] = useState<NewsVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState<{
    searchKey?: string;
    newsType?: ENewsType;
    status?: ENewsStatus;
    level?: ENewsLevel;
    createTimeStart?: string;
    createTimeEnd?: string;
    updateTimeStart?: string;
    updateTimeEnd?: string;
    publishTimeStart?: string;
    publishTimeEnd?: string;
  }>({});

  // 删除弹窗
  const deleteModal = useDisclosure();
  const [deletingNews, setDeletingNews] = useState<NewsVO | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 发布/取消发布弹窗
  const publishModal = useDisclosure();
  const [publishNews, setPublishNews] = useState<NewsVO | null>(null);
  const [publishing, setPublishing] = useState(false);

  // 置顶/取消置顶弹窗
  const topModal = useDisclosure();
  const [topNews, setTopNews] = useState<NewsVO | null>(null);
  const [topAction, setTopAction] = useState<'top' | 'untop'>('top');
  const [topping, setTopping] = useState(false);

  // 加载资讯列表
  const loadNewsList = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        current: currentPage,
        size: pageSize,
        ...searchParams
      };

      const res = await getNewsPage(params);
      setNews(res.records || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || 1);
    } catch (error) {
      toast({
        title: t('content.news.messages.loadFailed'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchParams, toast, t]);

  useEffect(() => {
    loadNewsList();
  }, [loadNewsList]);

  // 搜索
  const handleSearch = (params: {
    searchKey?: string;
    newsType?: ENewsType;
    status?: ENewsStatus;
    level?: ENewsLevel;
    createTimeStart?: string;
    createTimeEnd?: string;
    updateTimeStart?: string;
    updateTimeEnd?: string;
    publishTimeStart?: string;
    publishTimeEnd?: string;
  }) => {
    setCurrentPage(1);
    setSearchParams(params);
  };

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
      toast({ title: t('content.news.messages.deleteSuccess'), status: 'success', duration: 2000 });
      loadNewsList();
      deleteModal.onClose();
    } catch (error) {
      toast({ title: t('content.news.messages.deleteFailed'), status: 'error', duration: 2000 });
    } finally {
      setDeleting(false);
    }
  };

  // 发布/取消发布
  const handlePublishClick = (item: NewsVO) => {
    setPublishNews(item);
    publishModal.onOpen();
  };

  const handleConfirmPublish = async () => {
    if (!publishNews?.id) return;
    setPublishing(true);
    try {
      const newStatus =
        publishNews.status === ENewsStatus.PUBLISHED
          ? ENewsStatus.UNPUBLISHED
          : ENewsStatus.PUBLISHED;
      await updateNewsStatus({ id: publishNews.id, status: newStatus });
      toast({
        title:
          publishNews.status === ENewsStatus.PUBLISHED
            ? t('content.news.messages.unpublishSuccess')
            : t('content.news.messages.publishSuccess'),
        status: 'success',
        duration: 2000
      });
      loadNewsList();
      publishModal.onClose();
    } catch (error) {
      toast({ title: t('content.news.messages.operationFailed'), status: 'error', duration: 2000 });
    } finally {
      setPublishing(false);
    }
  };

  // 置顶/取消置顶
  const handleTopClick = (item: NewsVO, action: 'top' | 'untop') => {
    setTopNews(item);
    setTopAction(action);
    topModal.onOpen();
  };

  const handleConfirmTop = async () => {
    if (!topNews?.id) return;
    setTopping(true);
    try {
      await updateNewsTopStatus({ id: topNews.id, isTop: topAction === 'top' ? 1 : 0 });
      toast({
        title:
          topAction === 'top'
            ? t('content.news.messages.topSuccess')
            : t('content.news.messages.untopSuccess'),
        status: 'success',
        duration: 2000
      });
      loadNewsList();
      topModal.onClose();
    } catch (error) {
      toast({ title: t('content.news.messages.operationFailed'), status: 'error', duration: 2000 });
    } finally {
      setTopping(false);
    }
  };

  // 渲染状态标签
  const renderStatus = (status: number) => {
    const isPublished = status === ENewsStatus.PUBLISHED;
    return (
      <Flex
        align="center"
        justify="center"
        w="72px"
        h="24px"
        borderRadius="50px"
        bg={isPublished ? '#E8FFEA' : '#FFE9E9'}
      >
        <Box w="4px" h="4px" borderRadius="50%" bg={isPublished ? '#00B42A' : '#F53F3F'} mr="4px" />
        <Text fontSize="14px" color={isPublished ? '#00B42A' : '#F53F3F'} fontWeight="500">
          {isPublished ? t('content.news.status.published') : t('content.news.status.unpublished')}
        </Text>
      </Flex>
    );
  };

  // 渲染资讯类型标签
  const renderNewsType = (type: number) => (
    <Box
      w="64px"
      lineHeight="27px"
      textAlign="center"
      bg="#F2F3F5"
      borderRadius="2px"
      color="#1D2129"
      fontSize="12px"
    >
      {newsTypeMap[type] || '-'}
    </Box>
  );

  // 渲染标题（带tooltip）
  const renderTitle = (title?: string) => {
    if (!title) return '-';
    if (title.length <= 15) return title;
    return (
      <Tooltip placement="top" label={title}>
        <Box maxW="240px" noOfLines={1}>
          {title}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box p={6} bg={'#fff'} borderRadius={'8px'}>
      {/* 顶部标题和按钮 */}
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="20px" fontWeight="bold" color="#333">
          {t('content.news.title')}
        </Text>
        <Flex gap={3}>
          <Button
            variant="outline"
            colorScheme="gray"
            size="sm"
            w="100px"
            h="36px"
            border="1px solid #C8000B"
            borderRadius="6px"
            color="#C8000B"
            _hover={{ bg: '#FFF0F0' }}
            onClick={() => router.push('/admin/content/news/drafts')}
          >
            {t('content.news.actions.drafts')}
          </Button>
          <Button
            size="sm"
            w="100px"
            h="36px"
            borderRadius="6px"
            bg="#2D2D2D"
            color="white"
            _hover={{ bg: '#1F1F1F' }}
            leftIcon={<AddIcon boxSize={3} />}
            onClick={() => router.push('/admin/content/news/edit')}
          >
            {t('content.news.actions.add')}
          </Button>
        </Flex>
      </Flex>

      {/* 搜索栏 */}
      <Box mb={6}>
        <SearchBar onSearch={handleSearch} />
      </Box>

      {/* 表格 */}
      <Box overflowX="auto">
        <Table
          variant="simple"
          sx={{ tableLayout: 'fixed', minWidth: '1200px', th: { textTransform: 'none' } }}
        >
          <Thead bg="#F7F8FA">
            <Tr>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                w="240px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.table.title')}
              </Th>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                w="80px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.table.level')}
              </Th>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                w="100px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.table.creator')}
              </Th>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                w="100px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.table.type')}
              </Th>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                w="100px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.table.status')}
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
                {t('content.news.table.createTime')}
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
                {t('content.news.table.updateTime')}
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
                {t('content.news.table.publishTime')}
              </Th>
              <Th
                h="44px"
                px={4}
                color="#1D2129"
                fontSize="14px"
                fontWeight="500"
                textAlign="center"
                w="360px"
                borderBottom="1px solid #E5E6EB"
              >
                {t('content.news.table.actions')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={9} py={16} borderBottom="1px solid #E5E6EB">
                  <Flex direction="column" align="center" gap={2} color="gray.500">
                    <Spinner size="md" />
                    <Text fontSize="14px" fontWeight="600">
                      {t('content.news.loading')}
                    </Text>
                  </Flex>
                </Td>
              </Tr>
            ) : news.length > 0 ? (
              news.map((item) => {
                const isPublished = item.status === ENewsStatus.PUBLISHED;
                const isTop = item.isTop === 1;
                return (
                  <Tr key={item.id} _hover={{ bg: '#F7F8FA' }}>
                    <Td
                      px={4}
                      py={3.5}
                      borderBottom="1px solid #E5E6EB"
                      fontSize="14px"
                      color="#1D2129"
                    >
                      {renderTitle(item.title)}
                    </Td>
                    <Td
                      px={4}
                      py={3.5}
                      borderBottom="1px solid #E5E6EB"
                      fontSize="14px"
                      color="#1D2129"
                    >
                      {levelMap[item.level] || '-'}
                    </Td>
                    <Td
                      px={4}
                      py={3.5}
                      borderBottom="1px solid #E5E6EB"
                      fontSize="14px"
                      color="#1D2129"
                    >
                      {item.creatorName || '-'}
                    </Td>
                    <Td px={4} py={3.5} borderBottom="1px solid #E5E6EB">
                      {renderNewsType(item.newsType)}
                    </Td>
                    <Td px={4} py={3.5} borderBottom="1px solid #E5E6EB">
                      {renderStatus(item.status)}
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
                    <Td
                      px={4}
                      py={3.5}
                      borderBottom="1px solid #E5E6EB"
                      fontSize="14px"
                      color="#1D2129"
                    >
                      {item.publishTime ? dayjs(item.publishTime).format('YYYY-MM-DD HH:mm') : '-'}
                    </Td>
                    <Td px={4} py={3.5} borderBottom="1px solid #E5E6EB">
                      <Flex justify="center" gap={2}>
                        {/* 编辑 */}
                        <Button
                          w="72px"
                          h="32px"
                          flexShrink={0}
                          variant="outline"
                          borderColor="#C8000B"
                          color="#C8000B"
                          bg="white"
                          borderRadius="6px"
                          fontSize="13px"
                          fontWeight="500"
                          _hover={{ bg: '#FFF0F0' }}
                          onClick={() => router.push(`/admin/content/news/edit?id=${item.id}`)}
                        >
                          {t('content.news.actions.edit')}
                        </Button>

                        {/* 发布/取消发布 */}
                        {isPublished ? (
                          <Button
                            w="72px"
                            h="32px"
                            flexShrink={0}
                            variant="outline"
                            borderColor="#F53F3F"
                            color="#F53F3F"
                            bg="white"
                            borderRadius="6px"
                            fontSize="13px"
                            fontWeight="500"
                            _hover={{ bg: '#FFF1F0' }}
                            onClick={() => handlePublishClick(item)}
                          >
                            {t('content.news.actions.unpublish')}
                          </Button>
                        ) : (
                          <Button
                            w="72px"
                            h="32px"
                            flexShrink={0}
                            variant="outline"
                            borderColor="#00B42A"
                            color="#00B42A"
                            bg="white"
                            borderRadius="6px"
                            fontSize="13px"
                            fontWeight="500"
                            _hover={{ bg: '#E8FFEA' }}
                            onClick={() => handlePublishClick(item)}
                          >
                            {t('content.news.actions.publish')}
                          </Button>
                        )}

                        {/* 置顶/取消置顶 - 仅已发布显示 */}
                        {isPublished &&
                          (isTop ? (
                            <Button
                              w="84px"
                              h="32px"
                              flexShrink={0}
                              variant="outline"
                              borderColor="#D1D5DB"
                              color="#4E5969"
                              bg="white"
                              borderRadius="6px"
                              fontSize="13px"
                              fontWeight="500"
                              _hover={{ bg: '#FAFAFA' }}
                              onClick={() => handleTopClick(item, 'untop')}
                            >
                              {t('content.news.actions.untop')}
                            </Button>
                          ) : (
                            <Button
                              w="72px"
                              h="32px"
                              flexShrink={0}
                              variant="outline"
                              borderColor="#D1D5DB"
                              color="#4E5969"
                              bg="white"
                              borderRadius="6px"
                              fontSize="13px"
                              fontWeight="500"
                              _hover={{ bg: '#FAFAFA' }}
                              onClick={() => handleTopClick(item, 'top')}
                            >
                              {t('content.news.actions.top')}
                            </Button>
                          ))}

                        {/* 删除 */}
                        <Button
                          w="72px"
                          h="32px"
                          flexShrink={0}
                          variant="outline"
                          borderColor="#D1D5DB"
                          color="#4E5969"
                          bg="white"
                          borderRadius="6px"
                          fontSize="13px"
                          fontWeight="500"
                          _hover={{ bg: '#FAFAFA' }}
                          onClick={() => handleDeleteClick(item)}
                        >
                          {t('content.news.actions.delete')}
                        </Button>
                      </Flex>
                    </Td>
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan={9} py={16} borderBottom="1px solid #E5E6EB">
                  <Flex direction="column" align="center" gap={2} color="gray.500">
                    <Text fontSize="14px" fontWeight="600">
                      {t('content.news.empty.title')}
                    </Text>
                    <Text fontSize="12px">{t('content.news.empty.description')}</Text>
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
        bg="white"
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
              {t('content.news.modal.deleteTitle')}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5} px={5}>
            <Text fontSize="14px" color="gray.600">
              {t('content.news.modal.deleteConfirm')}
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
              {t('content.news.actions.cancel')}
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
              {t('content.news.actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 发布/取消发布确认弹窗 */}
      <Modal isOpen={publishModal.isOpen} onClose={publishModal.onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent rounded="16px" maxW="400px">
          <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="gray.100">
            <Text fontSize="16px" fontWeight="600">
              {publishNews?.status === ENewsStatus.PUBLISHED
                ? t('content.news.modal.unpublishTitle')
                : t('content.news.modal.publishTitle')}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5} px={5}>
            <Text fontSize="14px" color="gray.600">
              {publishNews?.status === ENewsStatus.PUBLISHED
                ? t('content.news.modal.unpublishConfirm')
                : t('content.news.modal.publishConfirm')}
            </Text>
          </ModalBody>
          <ModalFooter py={4} px={5} borderTop="1px solid" borderColor="gray.100" gap={3}>
            <Button
              h="40px"
              px={6}
              variant="outline"
              borderRadius="8px"
              onClick={publishModal.onClose}
            >
              {t('content.news.actions.cancel')}
            </Button>
            <Button
              h="40px"
              px={6}
              bg={publishNews?.status === ENewsStatus.PUBLISHED ? '#F53F3F' : '#00B42A'}
              color="white"
              borderRadius="8px"
              fontWeight="500"
              _hover={{ bg: publishNews?.status === ENewsStatus.PUBLISHED ? '#E03C3C' : '#009926' }}
              onClick={handleConfirmPublish}
              isLoading={publishing}
            >
              {publishNews?.status === ENewsStatus.PUBLISHED
                ? t('content.news.actions.confirmUnpublish')
                : t('content.news.actions.confirmPublish')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 置顶/取消置顶确认弹窗 */}
      <Modal isOpen={topModal.isOpen} onClose={topModal.onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent rounded="16px" maxW="400px">
          <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="gray.100">
            <Text fontSize="16px" fontWeight="600">
              {topAction === 'top'
                ? t('content.news.modal.topTitle')
                : t('content.news.modal.untopTitle')}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5} px={5}>
            <Text fontSize="14px" color="gray.600">
              {topAction === 'top'
                ? t('content.news.modal.topConfirm')
                : t('content.news.modal.untopConfirm')}
            </Text>
          </ModalBody>
          <ModalFooter py={4} px={5} borderTop="1px solid" borderColor="gray.100" gap={3}>
            <Button h="40px" px={6} variant="outline" borderRadius="8px" onClick={topModal.onClose}>
              {t('content.news.actions.cancel')}
            </Button>
            <Button
              h="40px"
              px={6}
              bg="#2D2D2D"
              color="white"
              borderRadius="8px"
              fontWeight="500"
              _hover={{ bg: '#1F1F1F' }}
              onClick={handleConfirmTop}
              isLoading={topping}
            >
              {topAction === 'top'
                ? t('content.news.actions.confirmTop')
                : t('content.news.actions.confirmUntop')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
