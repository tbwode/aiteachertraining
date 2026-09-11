'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Select as ChakraSelect,
  SimpleGrid,
  Text,
  Textarea,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RepeatIcon,
  SearchIcon
} from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import {
  postTenantMajorAdd,
  postTenantMajorDelete,
  postTenantMajorDetail,
  postTenantMajorListCategories,
  postTenantMajorPage,
  postTenantMajorUpdate
} from '@/api/admin/teaching/majors';
import type {
  MajorCategoryVO,
  TenantMajorDetailResponse,
  TenantMajorQueryRequest,
  TenantMajorRequest,
  TenantMajorVO
} from '@/types/api/admin/teaching/majors';
import AppSelect from '@/app/components/ui/Select';
import TableAdmin, { type TableAdminColumn } from '@/components/TableAdmin';

type MajorFormState = {
  code: string;
  name: string;
  categoryId: string;
  duration: string;
  desc: string;
  status: '启用' | '停用';
  sortOrder: number;
};

const pageSize = 10;
const durationOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;
const defaultFormState: MajorFormState = {
  code: '',
  name: '',
  categoryId: '',
  duration: '',
  desc: '',
  status: '启用',
  sortOrder: 0
};

const getErrorMessage = (error: any) => error?.message || error?.msg || '操作失败，请稍后重试';
const getStatusText = (status?: number): MajorFormState['status'] =>
  status === 0 ? '停用' : '启用';

export default function MajorsPageClient() {
  const isI18nReady = useAdminPageI18n(['teaching']);
  const { t } = useTranslation('admin', { keyPrefix: 'teaching' });
  const toast = useToast();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [majors, setMajors] = useState<TenantMajorVO[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<MajorCategoryVO[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMajor, setEditingMajor] = useState<TenantMajorVO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantMajorVO | null>(null);
  const [formState, setFormState] = useState<MajorFormState>(defaultFormState);
  const [total, setTotal] = useState(0);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentFormCode = editingMajor?.code || formState.code;

  const fillFormState = useCallback(
    (major?: Partial<TenantMajorVO | TenantMajorDetailResponse>) => {
      setFormState({
        code: major?.code || '',
        name: major?.name || '',
        categoryId: major?.categoryId !== undefined ? String(major.categoryId) : '',
        duration: major?.duration !== undefined ? String(major.duration) : '',
        desc: major?.description || '',
        status: getStatusText(major?.status),
        sortOrder: major?.sortOrder || 0
      });
    },
    []
  );

  const buildPageRequest = useCallback(
    (page: number): TenantMajorQueryRequest => ({
      current: page,
      size: pageSize,
      searchKey: searchText.trim() || undefined,
      categoryId: categoryFilter ? Number(categoryFilter) : undefined,
      status: statusFilter ? Number(statusFilter) : undefined
    }),
    [categoryFilter, searchText, statusFilter]
  );

  const fetchMajors = useCallback(
    async (page: number = currentPage) => {
      setIsListLoading(true);
      try {
        const res = await postTenantMajorPage(buildPageRequest(page));
        setMajors(res.records || []);
        setTotal(res.total || 0);
      } catch (error: any) {
        toast({
          title: getErrorMessage(error),
          status: 'error',
          position: 'top',
          duration: 2500,
          isClosable: true
        });
      } finally {
        setIsListLoading(false);
      }
    },
    [buildPageRequest, currentPage, toast]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await postTenantMajorListCategories();
      setCategoryOptions(res || []);
    } catch (error: any) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!isI18nReady) return;
    fetchCategories();
  }, [fetchCategories, isI18nReady]);

  useEffect(() => {
    if (!isI18nReady) return;
    fetchMajors(currentPage);
  }, [currentPage, fetchMajors, isI18nReady]);

  const resetFilters = () => {
    setCategoryFilter('');
    setStatusFilter('');
    setSearchText('');
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    // 新增时由后端自动生成编码，这里只清空表单。
    setEditingMajor(null);
    setFormState(defaultFormState);
    editModal.onOpen();
  };

  const openEditModal = async (major: TenantMajorVO) => {
    if (!major.id) return;

    // 先用列表数据回填，再补充详情，减少弹窗等待感。
    setEditingMajor(major);
    fillFormState(major);
    editModal.onOpen();

    try {
      const detail = await postTenantMajorDetail({ id: major.id });
      fillFormState(detail);
    } catch (error: any) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
    }
  };

  const openDeleteModal = (major: TenantMajorVO) => {
    setDeleteTarget(major);
    deleteModal.onOpen();
  };

  const closeEditModal = () => {
    setEditingMajor(null);
    setFormState(defaultFormState);
    editModal.onClose();
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    deleteModal.onClose();
  };

  const handleQueryChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleSearch = async () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      return;
    }
    await fetchMajors(1);
  };

  const buildMajorRequest = (): TenantMajorRequest | null => {
    if (!formState.name || !formState.categoryId || !formState.duration) {
      return null;
    }

    return {
      ...(editingMajor?.id ? { id: editingMajor.id } : {}),
      ...(formState.code ? { code: formState.code } : {}),
      name: formState.name,
      categoryId: Number(formState.categoryId),
      duration: Number(formState.duration),
      description: formState.desc,
      status: formState.status === '启用' ? 1 : 0,
      sortOrder: formState.sortOrder
    };
  };

  const handleSave = async () => {
    const payload = buildMajorRequest();
    if (!payload) {
      toast({
        title: t('majors.messages.validationTitle'),
        description: t('majors.messages.validationDescription'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    // 校验名称：必填，2-100个字符，不能全为空格
    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      toast({
        title: t('majors.messages.validationTitle'),
        description: t('majors.messages.nameRequiredError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast({
        title: t('majors.messages.validationTitle'),
        description: t('majors.messages.nameLengthError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    // 校验学制：1-10年整数
    const durationNum = Number(formState.duration);
    if (!formState.duration || isNaN(durationNum) || durationNum < 1 || durationNum > 10) {
      toast({
        title: t('majors.messages.validationTitle'),
        description: t('majors.messages.durationRangeError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    // 校验编码格式：ZY-XXX
    if (formState.code && !/^ZY-[A-Z0-9]+$/i.test(formState.code)) {
      toast({
        title: t('majors.messages.validationTitle'),
        description: t('majors.messages.codeFormatError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    // 校验编码唯一性 (前端初步校验)
    const isDuplicate = majors.some((m) => m.code === formState.code && m.id !== editingMajor?.id);
    if (formState.code && isDuplicate) {
      toast({
        title: t('majors.messages.validationTitle'),
        description: t('majors.messages.codeDuplicateError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMajor?.id) {
        await postTenantMajorUpdate(payload);
        toast({
          title: t('majors.messages.updatedTitle'),
          status: 'success',
          position: 'top',
          duration: 2500,
          isClosable: true
        });
      } else {
        await postTenantMajorAdd(payload);
        toast({
          title: t('majors.messages.createdTitle'),
          status: 'success',
          position: 'top',
          duration: 2500,
          isClosable: true
        });
      }

      closeEditModal();
      if (!editingMajor && currentPage !== 1) {
        setCurrentPage(1);
      } else {
        await fetchMajors(editingMajor ? currentPage : 1);
      }
    } catch (error: any) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      await postTenantMajorDelete({ id: deleteTarget.id });
      toast({
        title: t('majors.messages.deletedTitle'),
        status: 'success',
        position: 'top',
        duration: 2500,
        isClosable: true
      });

      closeDeleteModal();
      const shouldFallbackPage = majors.length === 1 && currentPage > 1;
      if (shouldFallbackPage) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await fetchMajors(currentPage);
      }
    } catch (error: any) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 统一维护表格列配置，便于复用 TableAdmin（API 设计参考 antd Table）。
  const tableColumns = useMemo<TableAdminColumn<TenantMajorVO>[]>(
    () => [
      {
        key: 'code',
        title: t('majors.table.code'),
        dataIndex: 'code',
        render: (value) => (
          <Text fontSize="12px" color="gray.700">
            {value ? String(value) : '--'}
          </Text>
        )
      },
      {
        key: 'name',
        title: t('majors.table.name'),
        dataIndex: 'name',
        render: (value) => (
          <Text fontSize="12px" color="gray.800">
            {value ? String(value) : '--'}
          </Text>
        )
      },
      {
        key: 'category',
        title: t('majors.table.category'),
        dataIndex: 'categoryName',
        render: (value) => (
          <Badge
            padding={`0 8px`}
            rounded="6px"
            bg="#F5F5F5"
            color="#333"
            fontSize="12px"
            fontWeight="500"
            height={`27px`}
            lineHeight={`27px`}
          >
            {value ? String(value) : '--'}
          </Badge>
        )
      },
      {
        key: 'duration',
        title: t('majors.table.duration'),
        dataIndex: 'duration',
        render: (value) => (
          <Text fontSize="12px" color="gray.700">
            {t('majors.table.durationValue', { value: typeof value === 'number' ? value : 0 })}
          </Text>
        )
      },
      {
        key: 'status',
        title: t('majors.table.status'),
        dataIndex: 'status',
        render: (value) => {
          const status = typeof value === 'number' ? value : undefined;

          return (
            <Badge
              px={2}
              py={0.5}
              rounded="full"
              fontSize="11px"
              fontWeight="600"
              bg={status === 0 ? '#FFF1F0' : '#EDF9EC'}
              color={status === 0 ? '#F04438' : '#3BAA2B'}
            >
              {status === 0 ? t('majors.status.inactive') : t('majors.status.active')}
            </Badge>
          );
        }
      },
      {
        key: 'classCount',
        title: t('majors.table.classCount'),
        dataIndex: 'classCount',
        render: (value) => (
          <Text fontSize="12px" color="gray.700">
            {typeof value === 'number' ? value : 0}
          </Text>
        )
      },
      {
        key: 'actions',
        title: t('majors.table.actions'),
        align: 'center',
        render: (_, record) => (
          <Flex justify="center" gap={2}>
            <Button
              padding={0}
              h="30px"
              minH="30px"
              minW="54px"
              variant="outline"
              rounded="md"
              fontSize="12px"
              fontWeight="500"
              borderColor="#333"
              color="#333"
              bg="white"
              onClick={() => void openEditModal(record)}
            >
              {t('majors.actions.edit')}
            </Button>
            <Button
              padding={0}
              h="30px"
              minH="30px"
              minW="54px"
              variant="outline"
              rounded="md"
              fontSize="12px"
              fontWeight="500"
              color="#C8000B"
              borderColor="#C8000B"
              bg="white"
              _hover={{ bg: '#FFF5F5' }}
              onClick={() => openDeleteModal(record)}
            >
              {t('majors.actions.delete')}
            </Button>
          </Flex>
        )
      }
    ],
    [openDeleteModal, openEditModal, t]
  );

  if (!isI18nReady) {
    return null;
  }

  return (
    <Box
      className="majors-page"
      borderRadius={'16px'}
      bgColor={'#fff'}
      padding={'20px'}
      display="flex"
      flexDirection="column"
      flex="1"
      minH="0"
    >
      {/* 让筛选区、表格区、分页区形成纵向弹性布局，表格区域自动占满剩余高度。 */}
      <Box overflow="hidden" flex="1" minH="0" display="flex" flexDirection="column">
        <Flex
          py={4}
          align={{ base: 'stretch', xl: 'center' }}
          justify="space-between"
          gap={3}
          direction={{ base: 'column', xl: 'row' }}
          borderRadius={0}
          flexShrink={0}
        >
          <Flex
            flex="1"
            align={{ base: 'stretch', md: 'center' }}
            gap={3}
            wrap="wrap"
            direction={{ base: 'column', md: 'row' }}
          >
            <ChakraSelect
              value={categoryFilter}
              onChange={(e) => handleQueryChange(setCategoryFilter, e.target.value)}
              w={{ base: 'full', md: '168px' }}
              h="40px"
              fontSize="13px"
              bg="white"
              borderColor="blackAlpha.200"
              rounded="md"
            >
              <option value="">{t('majors.filters.categoryPlaceholder')}</option>
              {categoryOptions.map((item, index) => (
                <option key={item.id ?? `${item.name}-${index}`} value={String(item.id ?? '')}>
                  {item.name || '--'}
                </option>
              ))}
            </ChakraSelect>

            <ChakraSelect
              value={statusFilter}
              onChange={(e) => handleQueryChange(setStatusFilter, e.target.value)}
              w={{ base: 'full', md: '140px' }}
              h="40px"
              fontSize="13px"
              bg="white"
              borderColor="blackAlpha.200"
              rounded="md"
            >
              <option value="">{t('majors.filters.statusPlaceholder')}</option>
              <option value="1">{t('majors.status.active')}</option>
              <option value="0">{t('majors.status.inactive')}</option>
            </ChakraSelect>

            <InputGroup maxW={{ base: 'full', md: '220px' }}>
              <InputRightElement pointerEvents="none" h="36px">
                <SearchIcon color="#4E5969" />
              </InputRightElement>
              <Input
                value={searchText}
                onChange={(e) => handleQueryChange(setSearchText, e.target.value)}
                onBlur={handleSearch}
                h="40px"
                fontSize="13px"
                placeholder={t('majors.filters.searchPlaceholder')}
                rounded="md"
                bg="white"
                borderColor="blackAlpha.200"
              />
            </InputGroup>

            <Button
              h="40px"
              px={4}
              variant="outline"
              rounded="md"
              fontSize="13px"
              fontWeight="500"
              borderColor="#333"
              padding={`7px 20px`}
              onClick={resetFilters}
            >
              {t('majors.actions.reset')}
            </Button>
          </Flex>

          <Button
            leftIcon={<AddIcon />}
            h="36px"
            px={4}
            alignSelf={{ base: 'flex-start', xl: 'center' }}
            rounded="md"
            color="white"
            fontSize="13px"
            fontWeight="600"
            bg="#2D2D2D"
            _hover={{ bg: '#1F1F1F' }}
            onClick={openCreateModal}
          >
            {t('majors.actions.create')}
          </Button>
        </Flex>

        {/* 表格滚动区占满筛选区与分页区之间的剩余高度。 */}
        <Box flex="1" minH="0" display="flex" flexDirection="column" overflow="hidden">
          <TableAdmin<TenantMajorVO>
            columns={tableColumns}
            dataSource={majors}
            rowKey={(record) => record.id ?? `${record.code ?? 'major'}-${record.name ?? 'item'}`}
            loading={isListLoading && majors.length === 0}
            scroll={{ x: '960px' }}
            locale={{
              loadingText: '加载中...',
              emptyText: (
                <Flex direction="column" align="center" gap={2} color="gray.500">
                  <Text fontSize="14px" fontWeight="600">
                    {t('majors.empty.title')}
                  </Text>
                  <Text fontSize="12px">{t('majors.empty.description')}</Text>
                </Flex>
              )
            }}
          />
        </Box>

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
          flexShrink={0}
        >
          <Text color="gray.500" fontSize="12px">
            {t('majors.pagination.total', { value: total })}
          </Text>
          <Flex align="center" gap={2}>
            <IconButton
              aria-label={t('majors.pagination.prev')}
              icon={<ChevronLeftIcon w={'12px'} h={'12px'} />}
              variant="outline"
              w="32px"
              h="32px"
              minW="32px"
              minH="32px"
              rounded="md"
              border="1px solid #E7E7E7"
              isDisabled={safeCurrentPage === 1 || isListLoading}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            />
            <Text minW="120px" textAlign="center" fontSize="14px" color="#4E5969">
              {t('majors.pagination.pageInfo', {
                page: safeCurrentPage,
                total: totalPages
              })}
            </Text>
            <IconButton
              aria-label={t('majors.pagination.next')}
              icon={<ChevronRightIcon w={'12px'} h={'12px'} />}
              variant="outline"
              w="32px"
              h="32px"
              minW="32px"
              minH="32px"
              rounded="md"
              border="1px solid #E7E7E7"
              isDisabled={safeCurrentPage >= totalPages || isListLoading}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            />
          </Flex>
        </Flex>
      </Box>

      <Modal isOpen={editModal.isOpen} onClose={closeEditModal} isCentered scrollBehavior="inside">
        <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
        <ModalContent
          maxW="496px"
          w="496px"
          minH="min(664px, calc(100vh - 40px))"
          maxH="calc(100vh - 40px)"
          display="flex"
          flexDirection="column"
          rounded="24px"
          overflow="hidden"
          bg="white"
          boxShadow="0 24px 80px rgba(15, 23, 42, 0.16)"
        >
          <ModalHeader fontSize="16px" fontWeight="600" padding="16px 32px">
            {editingMajor ? t('majors.modal.editTitle') : t('majors.modal.createTitle')}
          </ModalHeader>
          <ModalCloseButton
            top="16px"
            color="gray.700"
            _hover={{ bg: 'transparent', color: 'gray.900' }}
          />
          <Box borderTopWidth="1px" borderColor="#ECECEC" />
          <ModalBody px={8} pt={6} pb={8} overflowY="auto">
            <Flex direction="column" gap={6}>
              <FormControl>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('majors.form.code')}
                </FormLabel>
                <Input
                  isReadOnly={!!editingMajor}
                  value={formState.code}
                  onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder={t('majors.form.codePlaceholder')}
                  h="46px"
                  px={4}
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg={editingMajor ? 'gray.50' : 'white'}
                  fontSize="18px"
                  color="#444444"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('majors.form.name')}
                </FormLabel>
                <Input
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('majors.form.namePlaceholder')}
                  maxLength={100}
                  h="46px"
                  px={4}
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  _placeholder={{ color: '#A0AEC0' }}
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('majors.form.category')}
                  </FormLabel>
                  <AppSelect
                    value={formState.categoryId}
                    onChange={(value) => setFormState((prev) => ({ ...prev, categoryId: value }))}
                    options={categoryOptions
                      .filter((item) => item.id !== undefined && item.id !== null)
                      .map((item) => ({
                        value: String(item.id),
                        label: item.name || '--'
                      }))}
                    placeholder={t('majors.form.categoryPlaceholder')}
                    h="46px"
                    w="100%"
                    borderRadius="14px"
                    borderColor="#E6E6E6"
                    bg="white"
                    fontSize="16px"
                    menuMaxH="240px"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('majors.form.duration')}
                  </FormLabel>
                  <AppSelect
                    value={formState.duration}
                    onChange={(value) => setFormState((prev) => ({ ...prev, duration: value }))}
                    options={durationOptions.map((item) => ({
                      value: item,
                      label: t('majors.table.durationValue', { value: item })
                    }))}
                    placeholder={t('majors.form.durationPlaceholder')}
                    h="46px"
                    w="100%"
                    borderRadius="14px"
                    borderColor="#E6E6E6"
                    bg="white"
                    fontSize="16px"
                    menuMaxH="240px"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('majors.form.description')}
                </FormLabel>
                <Textarea
                  rows={4}
                  value={formState.desc}
                  onChange={(e) => setFormState((prev) => ({ ...prev, desc: e.target.value }))}
                  placeholder={t('majors.form.descriptionPlaceholder')}
                  h="92px"
                  minH="92px"
                  px={4}
                  py={3.5}
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  resize="none"
                  _placeholder={{ color: '#A0AEC0' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel mb={3} fontSize="14px" fontWeight="500" color="#333333">
                  {t('majors.form.status')}
                </FormLabel>
                <RadioGroup
                  value={formState.status}
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: value as MajorFormState['status']
                    }))
                  }
                >
                  <Flex gap={8} align="center">
                    <Radio value="启用" size="lg" colorScheme="gray">
                      <Text fontSize="16px" fontWeight="500" color="#333333">
                        {t('majors.status.active')}
                      </Text>
                    </Radio>
                    <Radio value="停用" size="lg" colorScheme="gray">
                      <Text fontSize="16px" fontWeight="500" color="#333333">
                        {t('majors.status.inactive')}
                      </Text>
                    </Radio>
                  </Flex>
                </RadioGroup>
              </FormControl>
            </Flex>
          </ModalBody>
          <ModalFooter px={8} pb={8} pt={0} gap={3} justifyContent="flex-end">
            <Button
              variant="outline"
              onClick={closeEditModal}
              width="68px"
              h="36px"
              rounded="12px"
              borderColor="#3A3A3A"
              bg="white"
              fontSize="16px"
              fontWeight="500"
              color="#333333"
            >
              {t('majors.actions.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isSubmitting}
              minWidth="68px"
              h="36px"
              rounded="12px"
              bg="#3A3A3A"
              color="white"
              fontSize="16px"
              fontWeight="600"
              _hover={{ bg: '#262626' }}
            >
              {t('majors.actions.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={closeDeleteModal} isCentered>
        <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
        <ModalContent
          maxW="496px"
          w="496px"
          rounded="24px"
          overflow="hidden"
          bg="white"
          boxShadow="0 24px 80px rgba(15, 23, 42, 0.16)"
        >
          <ModalHeader padding="16px 32px">
            <Flex align="center" gap={4}>
              <Flex
                w="24px"
                h="24px"
                align="center"
                justify="center"
                rounded="full"
                bg="#FF4D4F"
                color="white"
                fontSize="18px"
                fontWeight="700"
                lineHeight="1"
              >
                i
              </Flex>
              <Text fontSize="14px" fontWeight="600" color="#333333">
                {t('majors.delete.title')}
              </Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton
            top="16px"
            right="16px"
            color="gray.700"
            _hover={{ bg: 'transparent', color: 'gray.900' }}
          />
          <Box borderTopWidth="1px" borderColor="#ECECEC" />
          <ModalBody px={8} pt={8} pb={6}>
            <Text fontSize="14px" lineHeight="1.75" color="#333333">
              {t('majors.delete.description', { name: deleteTarget?.name || '' })}
            </Text>
          </ModalBody>
          <ModalFooter px={8} pb={8} pt={2} gap={3} justifyContent="flex-end">
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              width="68px"
              h="36px"
              rounded="12px"
              borderColor="#3A3A3A"
              bg="white"
              fontSize="14px"
              fontWeight="500"
              color="#333333"
            >
              {t('majors.actions.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              isLoading={isDeleting}
              minWidth="68px"
              h="36px"
              rounded="12px"
              bg="#3A3A3A"
              color="white"
              fontSize="14px"
              fontWeight="600"
              _hover={{ bg: '#262626' }}
            >
              {t('majors.actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
