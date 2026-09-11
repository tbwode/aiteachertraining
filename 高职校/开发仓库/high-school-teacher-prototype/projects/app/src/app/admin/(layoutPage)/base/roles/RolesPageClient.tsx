'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Flex,
  Tooltip,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Input,
  useToast,
  Spinner,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons';
import { postRolePageList, postRoleDelete, postRoleUpdateStatus } from '@/api/admin/teaching/roles';
import type { RoleVO } from '@/types/api/admin/teaching/roles';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import RoleModal from './components/RoleModal';

const pageSize = 10;

// 状态映射：1-启用，2-禁用
const getStatusMap = (
  t: (key: string) => string
): Record<number, { label: string; color: string; bg: string; dotColor: string }> => ({
  1: {
    label: t('base.roles.status.enabled'),
    color: '#00A870',
    bg: '#E6F9F0',
    dotColor: '#00A870'
  },
  2: {
    label: t('base.roles.status.disabled'),
    color: '#F53F3F',
    bg: '#FFF1F0',
    dotColor: '#F53F3F'
  }
});

export default function RolesPageClient() {
  const { t } = useTranslation('admin');
  useAdminPageI18n(['base']);
  const toast = useToast();
  const [roles, setRoles] = useState<RoleVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 删除相关
  const deleteModal = useDisclosure();
  const [deletingRole, setDeletingRole] = useState<RoleVO | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 状态变更相关
  const statusModal = useDisclosure();
  const [statusRole, setStatusRole] = useState<RoleVO | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // 角色编辑/新增弹窗相关
  const roleModal = useDisclosure();
  const [editingRoleId, setEditingRoleId] = useState<string>('');

  // 加载角色列表
  const loadRoleList = useCallback(async () => {
    setLoading(true);
    try {
      const params: { name?: string; current: number; size: number } = {
        current: currentPage,
        size: pageSize
      };
      if (searchKeyword.trim()) {
        params.name = searchKeyword.trim();
      }
      const res = await postRolePageList(params);
      setRoles(res.records || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || 1);
    } catch (error) {
      toast({
        title: t('base.roles.messages.loadFailed'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchKeyword, toast]);

  useEffect(() => {
    loadRoleList();
  }, [loadRoleList]);

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadRoleList();
  };

  // 重置
  const handleReset = () => {
    setSearchKeyword('');
    setCurrentPage(1);
  };

  // 删除相关
  const handleDeleteClick = (role: RoleVO) => {
    setDeletingRole(role);
    deleteModal.onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!deletingRole?.id) return;
    setDeleting(true);
    try {
      await postRoleDelete({ id: deletingRole.id });
      toast({
        title: t('base.roles.messages.deleteSuccess'),
        status: 'success',
        duration: 2500,
        isClosable: true
      });
      loadRoleList();
      deleteModal.onClose();
    } catch (error) {
      toast({
        title: t('base.roles.messages.deleteFailed'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setDeleting(false);
      setDeletingRole(null);
    }
  };

  // 状态变更相关
  const handleStatusClick = (role: RoleVO) => {
    setStatusRole(role);
    statusModal.onOpen();
  };

  const handleConfirmStatusChange = async () => {
    if (!statusRole?.id) return;
    setUpdatingStatus(true);
    try {
      await postRoleUpdateStatus({ id: statusRole.id });
      toast({
        title: t('base.roles.messages.operationSuccess'),
        status: 'success',
        duration: 2500,
        isClosable: true
      });
      loadRoleList();
      statusModal.onClose();
    } catch (error) {
      toast({
        title: t('base.roles.messages.operationFailed'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setUpdatingStatus(false);
      setStatusRole(null);
    }
  };

  // 渲染权限范围
  const renderAuthorityNames = (role: RoleVO) => {
    const names = role.authorityNames?.length ? role.authorityNames : role.menuNames || [];
    if (!names.length) return '-';
    const displayText = names.length === 1 ? names[0] : `${names[0]}等`;
    return (
      <Tooltip label={names.join('、')} hasArrow placement="top">
        <Box maxW="240px" noOfLines={1}>
          {displayText}
        </Box>
      </Tooltip>
    );
  };

  // 渲染角色说明
  const renderInfo = (info?: string) => {
    const text = info || '-';
    const short = text.length > 20 ? `${text.slice(0, 20)}...` : text;
    return (
      <Tooltip label={text} hasArrow placement="top">
        <Box maxW="200px" noOfLines={1}>
          {short}
        </Box>
      </Tooltip>
    );
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingRoleId('');
    roleModal.onOpen();
  };

  // 打开编辑弹窗
  const handleEdit = (role: RoleVO) => {
    setEditingRoleId(role.id || '');
    roleModal.onOpen();
  };

  // 弹窗关闭回调
  const handleModalClose = () => {
    roleModal.onClose();
    setEditingRoleId('');
  };

  // 弹窗成功回调
  const handleModalSuccess = () => {
    loadRoleList();
  };

  return (
    <Box p={6} bgColor="#fff" borderRadius="16px">
      {/* 搜索栏 */}
      <Flex justify="space-between" align="center" mb={6}>
        <Flex align="center" gap={3}>
          <Text fontSize="14px" color="#1D2129">
            {t('base.roles.search.label')}
          </Text>
          <Input
            w="320px"
            h="36px"
            placeholder={t('base.roles.search.placeholder')}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            bg="#F2F3F5"
            border="none"
            _focus={{ border: 'none', boxShadow: 'none' }}
            _hover={{ bg: '#F2F3F5' }}
          />
        </Flex>
        <Flex gap={3}>
          <Button
            w="80px"
            h="36px"
            borderRadius="8px"
            bg="#F2F3F5"
            color="#4E5969"
            border="none"
            _hover={{ bg: '#E5E6EB' }}
            onClick={handleReset}
          >
            {t('base.roles.actions.reset')}
          </Button>
          <Button
            w="80px"
            h="36px"
            bg="#2D2D2D"
            color="white"
            borderRadius="8px"
            fontSize="14px"
            fontWeight="600"
            _hover={{ bg: '#1F1F1F' }}
            leftIcon={<SearchIcon boxSize={3} />}
            onClick={handleSearch}
          >
            {t('base.roles.actions.search')}
          </Button>
          <Button
            w="100px"
            h="36px"
            bg="#2D2D2D"
            color="white"
            borderRadius="8px"
            fontSize="14px"
            fontWeight="600"
            _hover={{ bg: '#1F1F1F' }}
            leftIcon={<AddIcon boxSize={3} />}
            onClick={handleAdd}
          >
            {t('base.roles.add')}
          </Button>
        </Flex>
      </Flex>

      {/* 表格 */}
      <Box overflowX="auto">
        <Table
          variant="simple"
          sx={{ tableLayout: 'fixed', minWidth: '900px' }}
          borderRadius={'8px 8px 0 0'}
        >
          <Thead bg="#F9FAFB" h="44px">
            <Tr>
              <Th
                px={5}
                color="#333333"
                fontSize="14px"
                fontWeight="600"
                textTransform="none"
                w="150px"
              >
                {t('base.roles.table.name')}
              </Th>
              <Th
                px={5}
                color="#333333"
                fontSize="14px"
                fontWeight="600"
                textTransform="none"
                w="250px"
              >
                {t('base.roles.table.scope')}
              </Th>
              <Th
                px={5}
                color="#333333"
                fontSize="14px"
                fontWeight="600"
                textTransform="none"
                w="200px"
              >
                {t('base.roles.table.description')}
              </Th>
              <Th
                px={5}
                color="#333333"
                fontSize="14px"
                fontWeight="600"
                textTransform="none"
                w="100px"
              >
                {t('base.roles.table.status')}
              </Th>
              <Th
                px={5}
                color="#333333"
                fontSize="14px"
                fontWeight="600"
                textTransform="none"
                textAlign="center"
                w="280px"
              >
                {t('base.roles.table.actions')}
              </Th>
            </Tr>
          </Thead>
          <Tbody bg="white">
            {loading ? (
              <Tr>
                <Td colSpan={5} py={16} borderColor="blackAlpha.50">
                  <Flex direction="column" align="center" gap={2} color="gray.500">
                    <Spinner size="md" />
                    <Text fontSize="14px" fontWeight="600">
                      {t('base.roles.loading')}
                    </Text>
                  </Flex>
                </Td>
              </Tr>
            ) : roles.length > 0 ? (
              roles.map((role) => {
                const statusStyle = getStatusMap(t)[role.status || 1] || getStatusMap(t)[1];
                const isSystem = role.source === 1;
                return (
                  <Tr key={role.id} _hover={{ bg: '#F7F8FA' }} borderBottom="1px solid #E5E6EB">
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {role.name}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {renderAuthorityNames(role)}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {renderInfo(role.info)}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50">
                      <Flex align="center" gap={1.5}>
                        <Box
                          as="span"
                          display="inline-block"
                          w="6px"
                          h="6px"
                          bg={statusStyle.dotColor}
                          borderRadius="full"
                        />
                        <Text fontSize="14px" color={statusStyle.color} fontWeight="500">
                          {statusStyle.label}
                        </Text>
                      </Flex>
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50">
                      <Flex justify="center" gap={2}>
                        {/* 编辑按钮 */}
                        <Button
                          minW="72px"
                          px={3}
                          h="30px"
                          flexShrink={0}
                          variant="outline"
                          borderColor="#2D2D2D"
                          color="#2D2D2D"
                          bg="white"
                          borderRadius="6px"
                          fontSize="14px"
                          fontWeight="500"
                          _hover={{ bg: '#F5F5F5' }}
                          onClick={() => handleEdit(role)}
                        >
                          {t('base.roles.actions.edit')}
                        </Button>

                        {/* 启用/禁用按钮 */}
                        {!isSystem && (
                          <>
                            {role.status === 2 ? (
                              <Button
                                minW="72px"
                                px={3}
                                h="30px"
                                flexShrink={0}
                                variant="outline"
                                borderColor="#00A870"
                                color="#00A870"
                                bg="white"
                                borderRadius="6px"
                                fontSize="14px"
                                fontWeight="500"
                                _hover={{ bg: '#E6F9F0' }}
                                onClick={() => handleStatusClick(role)}
                              >
                                {t('base.roles.actions.enable')}
                              </Button>
                            ) : (
                              <Button
                                minW="72px"
                                px={3}
                                h="30px"
                                flexShrink={0}
                                variant="outline"
                                borderColor="#F53F3F"
                                color="#F53F3F"
                                bg="white"
                                borderRadius="6px"
                                fontSize="14px"
                                fontWeight="500"
                                _hover={{ bg: '#FFF1F0' }}
                                onClick={() => handleStatusClick(role)}
                              >
                                {t('base.roles.actions.disable')}
                              </Button>
                            )}
                          </>
                        )}

                        {/* 删除按钮 */}
                        {!isSystem && (
                          <Button
                            minW="72px"
                            px={6}
                            h="30px"
                            flexShrink={0}
                            variant="outline"
                            borderColor="#D1D5DB"
                            color="#4E5969"
                            bg="white"
                            borderRadius="6px"
                            fontSize="14px"
                            fontWeight="500"
                            _hover={{ bg: '#FAFAFA' }}
                            onClick={() => handleDeleteClick(role)}
                          >
                            {t('base.roles.actions.delete')}
                          </Button>
                        )}
                      </Flex>
                    </Td>
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan={5} py={16} borderColor="blackAlpha.50">
                  <Flex direction="column" align="center" gap={2} color="gray.500">
                    <Text fontSize="14px" fontWeight="600">
                      {t('base.roles.empty.title')}
                    </Text>
                    <Text fontSize="12px">{t('base.roles.empty.subtitle')}</Text>
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
        px={{ base: 4, md: 5 }}
        py={3.5}
        borderTopWidth="1px"
        borderColor="blackAlpha.100"
        bg="white"
        gap={3}
        wrap="wrap"
      >
        <Text color="gray.500" fontSize="14px">
          {t('base.roles.pagination.total', { total })}
        </Text>
        <Flex align="center" gap={2}>
          <IconButton
            aria-label={t('base.roles.pagination.prev')}
            icon={<ChevronLeftIcon boxSize={6} />}
            variant="outline"
            size="sm"
            rounded="md"
            borderColor="blackAlpha.200"
            isDisabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          />
          <Text minW="120px" textAlign="center" fontSize="12px" color="gray.600">
            {t('base.roles.pagination.pageInfo', { current: currentPage, total: totalPages })}
          </Text>
          <IconButton
            aria-label={t('base.roles.pagination.next')}
            icon={<ChevronRightIcon boxSize={6} />}
            variant="outline"
            size="sm"
            rounded="md"
            borderColor="blackAlpha.200"
            isDisabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          />
        </Flex>
      </Flex>

      {/* 删除确认弹窗 */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent rounded="16px" maxW="400px">
          <ModalHeader
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            py={4}
            px={5}
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <Text fontSize="16px" fontWeight="600">
              {t('base.roles.delete.title')}
            </Text>
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody py={5} px={5}>
            <Text fontSize="14px" color="gray.600">
              {t('base.roles.delete.content')}
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
              {t('base.roles.actions.cancel')}
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
              {t('base.roles.actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 状态变更确认弹窗 */}
      <Modal isOpen={statusModal.isOpen} onClose={statusModal.onClose} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent rounded="16px" maxW="400px">
          <ModalHeader
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            py={4}
            px={5}
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <Text fontSize="16px" fontWeight="600">
              {statusRole?.status === 2
                ? t('base.roles.status.enableTitle')
                : t('base.roles.status.disableTitle')}
            </Text>
            <ModalCloseButton />
          </ModalHeader>
          <ModalBody py={5} px={5}>
            <Text fontSize="14px" color="gray.600">
              {statusRole?.status === 2
                ? t('base.roles.status.enableContent')
                : t('base.roles.status.disableContent')}
            </Text>
          </ModalBody>
          <ModalFooter py={4} px={5} borderTop="1px solid" borderColor="gray.100" gap={3}>
            <Button
              h="40px"
              px={6}
              variant="outline"
              borderRadius="8px"
              onClick={statusModal.onClose}
            >
              {t('base.roles.actions.cancel')}
            </Button>
            <Button
              h="40px"
              px={6}
              bg={statusRole?.status === 2 ? '#00A870' : '#F53F3F'}
              color="white"
              borderRadius="8px"
              fontWeight="500"
              _hover={{ bg: statusRole?.status === 2 ? '#008F5D' : '#E03C3C' }}
              onClick={handleConfirmStatusChange}
              isLoading={updatingStatus}
            >
              {statusRole?.status === 2
                ? t('base.roles.actions.confirmEnable')
                : t('base.roles.actions.confirmDisable')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 角色编辑/新增弹窗 */}
      <RoleModal
        isOpen={roleModal.isOpen}
        onClose={handleModalClose}
        roleId={editingRoleId}
        onSuccess={handleModalSuccess}
      />
    </Box>
  );
}
