'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
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
  Stack,
  Text,
  Textarea,
  useDisclosure,
  useRadio,
  useRadioGroup,
  useToast
} from '@chakra-ui/react';
import {
  AddIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon
} from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import {
  postTenantCourseAdd,
  postTenantCourseDelete,
  postTenantCourseDetail,
  postTenantCoursePage,
  postTenantCourseToggleStatus,
  postTenantCourseUpdate
} from '@/api/admin/teaching/courses';
import { postTenantMajorList } from '@/api/admin/teaching/majors';
import type {
  TenantCourseDetailResponse,
  TenantCourseQueryRequest,
  TenantCourseRequest,
  TenantCourseVO
} from '@/types/api/admin/teaching/courses';
import type { TenantMajorSimpleVO } from '@/types/api/admin/teaching/majors';
import AppSelect from '@/app/components/ui/Select';
import TableAdmin, { type TableAdminColumn } from '@/components/TableAdmin';

type CourseFormState = {
  code: string;
  name: string;
  type: string;
  tenantMajorId: string;
  hours: string;
  description: string;
  status: string;
};

type StatusBadgeStyle = {
  bg: string;
  color: string;
  dotColor: string;
};

const pageSize = 10;
const defaultFormState: CourseFormState = {
  code: '',
  name: '',
  type: '1',
  tenantMajorId: '',
  hours: '',
  description: '',
  status: '1'
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }

    if ('msg' in error && typeof error.msg === 'string' && error.msg.trim()) {
      return error.msg;
    }
  }

  return '请求失败，请稍后重试';
};

const CustomRadioCard = (props: any) => {
  const { getInputProps, getRadioProps, state } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label" cursor="pointer">
      <input {...input} />
      <Flex {...checkbox} alignItems="center" gap={2}>
        <Flex
          w="22px"
          h="22px"
          borderRadius="full"
          borderWidth="1.5px"
          borderColor="#E2E7F0"
          align="center"
          justify="center"
          bg="white"
          transition="all 0.2s"
          _checked={{
            bg: '#333333',
            borderColor: '#333333',
            color: 'white'
          }}
        >
          {state.isChecked && <CheckIcon w={3} h={3} />}
        </Flex>
        <Text fontSize="16px" color="#333333">
          {props.children}
        </Text>
      </Flex>
    </Box>
  );
};

const CustomTypeCard = (props: any) => {
  const { getInputProps, getRadioProps, state } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  const isRequired = props.value === '1';
  const selectedStyle = isRequired
    ? {
        border: '1px solid #EEB2B5',
        bg: '#FFECED',
        color: '#C8000B'
      }
    : {
        bg: '#F7F8FA',
        color: '#333333',
        border: '1px solid transparent'
      };

  const unselectedStyle = {
    bg: 'white',
    border: '1px solid #E6E6E6',
    color: '#333333'
  };

  return (
    <Box as="label" cursor="pointer" flex="1">
      <input {...input} />
      <Flex
        {...checkbox}
        h="46px"
        align="center"
        justify="center"
        borderRadius="8px"
        fontSize="16px"
        fontWeight="500"
        transition="all 0.2s"
        {...(state.isChecked ? selectedStyle : unselectedStyle)}
        _checked={selectedStyle}
      >
        {props.children}
      </Flex>
    </Box>
  );
};

export default function CoursesPageClient() {
  const isI18nReady = useAdminPageI18n(['teaching']);
  const { t } = useTranslation('admin');
  const toast = useToast();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [courses, setCourses] = useState<TenantCourseVO[]>([]);
  const [majorOptions, setMajorOptions] = useState<TenantMajorSimpleVO[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [majorFilter, setMajorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editingCourse, setEditingCourse] = useState<TenantCourseVO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantCourseVO | null>(null);
  const [formState, setFormState] = useState<CourseFormState>(defaultFormState);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'status',
    value: formState.status,
    onChange: (value) => setFormState((prev) => ({ ...prev, status: value }))
  });

  const { getRadioProps: getTypeRadioProps } = useRadioGroup({
    name: 'type',
    value: formState.type,
    onChange: (value) => setFormState((prev) => ({ ...prev, type: value }))
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentFormCode = editingCourse?.code || formState.code || '--';

  const getStatusText = useCallback(
    (status?: number) => {
      if (status === 1) {
        return t('teaching.courses.status.enabled');
      }

      if (status === 0) {
        return t('teaching.courses.status.disabled');
      }

      return '--';
    },
    [t]
  );

  const getStatusStyle = useCallback((status?: number): StatusBadgeStyle => {
    if (status === 1) {
      return {
        bg: '#EAFBEA',
        color: '#22C55E',
        dotColor: '#22C55E'
      };
    }

    if (status === 0) {
      return {
        bg: '#F1F5F9',
        color: '#64748B',
        dotColor: '#64748B'
      };
    }

    return {
      bg: '#F8FAFC',
      color: '#94A3B8',
      dotColor: '#94A3B8'
    };
  }, []);

  const getCourseTypeText = useCallback(
    (type?: number) =>
      type === 2 ? t('teaching.courses.type.elective') : t('teaching.courses.type.required'),
    [t]
  );

  const fillFormState = useCallback(
    (course?: Partial<TenantCourseVO | TenantCourseDetailResponse> | null) => {
      setFormState({
        code: course?.code ?? '',
        name: course?.name ?? '',
        type: course?.type !== undefined ? String(course.type) : '1',
        tenantMajorId: course?.tenantMajorId !== undefined ? String(course.tenantMajorId) : '',
        hours: course?.hours !== undefined ? String(course.hours) : '',
        description: course?.description ?? '',
        status: course?.status !== undefined ? String(course.status) : '1'
      });
    },
    []
  );

  const buildPageRequest = useCallback(
    (page: number): TenantCourseQueryRequest => ({
      current: page,
      size: pageSize,
      searchKey: searchText.trim() || undefined,
      type: typeFilter ? Number(typeFilter) : undefined,
      tenantMajorId: majorFilter ? Number(majorFilter) : undefined,
      status: statusFilter ? Number(statusFilter) : undefined
    }),
    [majorFilter, searchText, statusFilter, typeFilter]
  );

  const fetchCourses = useCallback(
    async (page: number = currentPage) => {
      setIsListLoading(true);

      try {
        const response = await postTenantCoursePage(buildPageRequest(page));
        setCourses(response.records || []);
        setTotal(response.total || 0);
      } catch (error) {
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

  const fetchMajorOptions = useCallback(async () => {
    try {
      const response = await postTenantMajorList({});
      setMajorOptions(response || []);
    } catch (error) {
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
    if (!isI18nReady) {
      return;
    }

    void fetchMajorOptions();
  }, [fetchMajorOptions, isI18nReady]);

  useEffect(() => {
    if (!isI18nReady) {
      return;
    }

    void fetchCourses(currentPage);
  }, [currentPage, fetchCourses, isI18nReady]);

  const openCreateModal = () => {
    setEditingCourse(null);
    fillFormState();
    editModal.onOpen();
  };

  const openEditModal = async (course: TenantCourseVO) => {
    if (!course.id) {
      return;
    }

    setEditingCourse(course);
    fillFormState(course);
    editModal.onOpen();

    try {
      const detail = await postTenantCourseDetail({ id: course.id });
      fillFormState(detail);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
    }
  };

  const openDeleteModal = (course: TenantCourseVO) => {
    setDeleteTarget(course);
    deleteModal.onOpen();
  };

  const closeEditModal = () => {
    setEditingCourse(null);
    setFormState(defaultFormState);
    editModal.onClose();
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    deleteModal.onClose();
  };

  const buildCourseRequest = (): TenantCourseRequest | null => {
    const name = formState.name.trim();
    const type = Number(formState.type);
    const tenantMajorId = Number(formState.tenantMajorId);
    const hours = Number(formState.hours);
    const status = Number(formState.status);

    if (!name || Number.isNaN(type) || Number.isNaN(hours) || Number.isNaN(status)) {
      toast({
        title: t('teaching.courses.messages.validationTitle'),
        description: t('teaching.courses.messages.validationDescription'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return null;
    }

    // 1. 课程名称：2-100个字符，不能全为空格
    if (name.length < 2 || name.length > 100) {
      toast({
        title: t('teaching.courses.messages.validationTitle'),
        description: t('teaching.courses.messages.nameLengthError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return null;
    }

    // 2. 课程编号：KC-{序号} 格式
    if (formState.code && !/^KC-[A-Z0-9]+$/i.test(formState.code)) {
      toast({
        title: t('teaching.courses.messages.validationTitle'),
        description: t('teaching.courses.messages.codeFormatError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return null;
    }

    // 3. 课时：1-200 整数
    if (!Number.isInteger(hours) || hours < 1 || hours > 200) {
      toast({
        title: t('teaching.courses.messages.validationTitle'),
        description: t('teaching.courses.messages.hoursRangeError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return null;
    }

    // 校验编码唯一性 (前端初步校验)
    const isDuplicate = courses.some(
      (c) => c.code === formState.code && c.id !== editingCourse?.id
    );
    if (isDuplicate) {
      toast({
        title: t('teaching.courses.messages.validationTitle'),
        description: t('teaching.courses.messages.codeDuplicateError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return null;
    }

    const payload: TenantCourseRequest = {
      ...(editingCourse?.id ? { id: editingCourse.id } : {}),
      ...(formState.code ? { code: formState.code } : {}),
      name,
      type,
      hours,
      tenantMajorId:
        formState.tenantMajorId && !Number.isNaN(tenantMajorId) ? tenantMajorId : undefined,
      description: formState.description.trim() || undefined,
      status
    };

    return payload;
  };

  const handleSave = async () => {
    const payload = buildCourseRequest();

    if (!payload) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCourse?.id) {
        await postTenantCourseUpdate(payload);
      } else {
        await postTenantCourseAdd(payload);
      }

      toast({
        title: editingCourse
          ? t('teaching.courses.messages.updatedTitle')
          : t('teaching.courses.messages.createdTitle'),
        status: 'success',
        position: 'top',
        duration: 2500,
        isClosable: true
      });

      closeEditModal();

      if (!editingCourse && safeCurrentPage !== 1) {
        setCurrentPage(1);
      } else {
        await fetchCourses(editingCourse ? safeCurrentPage : 1);
      }
    } catch (error) {
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
    if (!deleteTarget?.id) {
      return;
    }

    setIsDeleting(true);

    try {
      await postTenantCourseDelete({ id: deleteTarget.id });

      toast({
        title: t('teaching.courses.messages.deletedTitle'),
        status: 'success',
        position: 'top',
        duration: 2500,
        isClosable: true
      });

      closeDeleteModal();

      const nextPage =
        safeCurrentPage > 1 && courses.length === 1 ? safeCurrentPage - 1 : safeCurrentPage;
      if (nextPage !== safeCurrentPage) {
        setCurrentPage(nextPage);
      } else {
        await fetchCourses(nextPage);
      }
    } catch (error) {
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

  const handleToggleStatus = async (course: TenantCourseVO) => {
    if (!course.id) {
      return;
    }

    const targetStatus = course.status === 1 ? 0 : 1;
    setTogglingId(course.id);

    try {
      await postTenantCourseToggleStatus({
        id: course.id,
        status: targetStatus
      });

      toast({
        title: targetStatus === 1 ? '课程已启用' : '课程已停用',
        status: 'success',
        position: 'top',
        duration: 2500,
        isClosable: true
      });

      await fetchCourses(safeCurrentPage);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setTogglingId(null);
    }
  };

  // 统一维护表格列配置，便于复用 TableAdmin（API 设计参考 antd Table）。
  const tableColumns = useMemo<TableAdminColumn<TenantCourseVO>[]>(
    () => [
      {
        key: 'code',
        title: t('teaching.courses.table.code'),
        dataIndex: 'code',
        render: (value) => (
          <Text fontSize="12px" color="#64748B">
            {value ? String(value) : '--'}
          </Text>
        )
      },
      {
        key: 'name',
        title: t('teaching.courses.table.name'),
        dataIndex: 'name',
        render: (value) => <Box>{value ? String(value) : '--'}</Box>
      },
      {
        key: 'type',
        title: t('teaching.courses.table.type'),
        dataIndex: 'type',
        render: (value) => (
          <Text fontSize="12px" color="#64748B">
            {getCourseTypeText(typeof value === 'number' ? value : undefined)}
          </Text>
        )
      },
      {
        key: 'major',
        title: t('teaching.courses.table.major'),
        dataIndex: 'majorName',
        render: (value) => (
          <Text fontSize="12px" color="#64748B">
            {value ? String(value) : t('teaching.courses.table.noMajor')}
          </Text>
        )
      },
      {
        key: 'hours',
        title: t('teaching.courses.table.hours'),
        dataIndex: 'hours',
        render: (value) => (
          <Text fontSize="12px" color="#64748B">
            {typeof value === 'number' ? value : '--'}
          </Text>
        )
      },
      {
        key: 'status',
        title: t('teaching.courses.table.status'),
        render: (_, record) => {
          const statusStyle = getStatusStyle(record.status);

          return (
            <Badge
              display="inline-flex"
              alignItems="center"
              gap={1.5}
              px={3}
              py={1}
              rounded="full"
              bg={statusStyle.bg}
              color={statusStyle.color}
              fontSize="12px"
              fontWeight="600"
            >
              <Box w="5px" h="5px" borderRadius="full" bg={statusStyle.dotColor} />
              {getStatusText(record.status)}
            </Badge>
          );
        }
      },
      {
        key: 'actions',
        title: t('teaching.courses.table.actions'),
        align: 'center',
        render: (_, record) => (
          <Flex justify="center" gap={2} wrap="wrap">
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
              _hover={{ bg: '#F8FAFC' }}
              isLoading={togglingId === record.id}
              onClick={() => void handleToggleStatus(record)}
            >
              {record.status === 1 ? '停用' : '启用'}
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
              borderColor="#333"
              color="#333"
              bg="white"
              _hover={{ bg: '#F8FAFC' }}
              onClick={() => void openEditModal(record)}
            >
              {t('teaching.courses.actions.edit')}
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
              {t('teaching.courses.actions.delete')}
            </Button>
          </Flex>
        )
      }
    ],
    [
      getCourseTypeText,
      getStatusStyle,
      getStatusText,
      handleToggleStatus,
      openDeleteModal,
      openEditModal,
      t,
      togglingId
    ]
  );

  if (!isI18nReady) {
    return null;
  }

  return (
    <Box
      className="courses-page"
      borderRadius="16px"
      bg="white"
      p={{ base: 4, md: 5 }}
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
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              w={{ base: 'full', md: '182px' }}
              h="40px"
              fontSize="14px"
              bg="white"
              borderColor="#E5E7EB"
              borderRadius="14px"
              color={typeFilter ? '#334155' : '#64748B'}
            >
              <option value="">{t('teaching.courses.filters.typePlaceholder')}</option>
              <option value="1">{t('teaching.courses.type.required')}</option>
              <option value="2">{t('teaching.courses.type.elective')}</option>
            </ChakraSelect>

            <ChakraSelect
              value={majorFilter}
              onChange={(e) => {
                setMajorFilter(e.target.value);
                setCurrentPage(1);
              }}
              w={{ base: 'full', md: '182px' }}
              h="40px"
              fontSize="14px"
              bg="white"
              borderColor="#E5E7EB"
              borderRadius="14px"
              color={majorFilter ? '#334155' : '#64748B'}
            >
              <option value="">{t('teaching.courses.filters.majorPlaceholder')}</option>
              {majorOptions.map((item) => (
                <option key={item.id ?? item.name} value={item.id ? String(item.id) : ''}>
                  {item.name || '--'}
                </option>
              ))}
            </ChakraSelect>

            <ChakraSelect
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              w={{ base: 'full', md: '182px' }}
              h="40px"
              fontSize="14px"
              bg="white"
              borderColor="#E5E7EB"
              borderRadius="14px"
              color={statusFilter ? '#334155' : '#64748B'}
            >
              <option value="">{t('teaching.courses.filters.statusPlaceholder')}</option>
              <option value="1">{t('teaching.courses.status.enabled')}</option>
              <option value="0">{t('teaching.courses.status.disabled')}</option>
            </ChakraSelect>

            <InputGroup maxW={{ base: 'full', md: '340px' }}>
              <Input
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                h="40px"
                pr="44px"
                fontSize="14px"
                placeholder={t('teaching.courses.filters.searchPlaceholder')}
                bg="white"
                borderColor="#E5E7EB"
                borderRadius="14px"
                color="#334155"
                _placeholder={{ color: '#94A3B8' }}
              />
              <InputRightElement h="48px" pointerEvents="none" color="#4E5969">
                <SearchIcon />
              </InputRightElement>
            </InputGroup>
          </Flex>

          <Button
            leftIcon={<AddIcon />}
            h="40px"
            alignSelf={{ base: 'stretch', xl: 'center' }}
            borderRadius="14px"
            color="white"
            fontSize="14px"
            fontWeight="600"
            bg="#2D2D2D"
            _hover={{ bg: '#1F1F1F' }}
            onClick={openCreateModal}
          >
            {t('teaching.courses.actions.create')}
          </Button>
        </Flex>

        <Box flex="1" minH="0" display="flex" flexDirection="column" overflow="hidden">
          <TableAdmin<TenantCourseVO>
            columns={tableColumns}
            dataSource={courses}
            rowKey="id"
            loading={isListLoading && courses.length === 0}
            scroll={{ x: '1180px' }}
            locale={{
              loadingText: '加载中...',
              emptyText: (
                <Flex direction="column" align="center" gap={2} color="gray.500">
                  <Text fontSize="14px" fontWeight="600">
                    {t('teaching.courses.empty.title')}
                  </Text>
                  <Text fontSize="12px">{t('teaching.courses.empty.description')}</Text>
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
            {t('teaching.courses.pagination.total', { value: total })}
          </Text>
          <Flex align="center" gap={2}>
            <IconButton
              aria-label={t('teaching.courses.pagination.prev')}
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
              {t('teaching.courses.pagination.pageInfo', {
                page: safeCurrentPage,
                total: totalPages
              })}
            </Text>
            <IconButton
              aria-label={t('teaching.courses.pagination.next')}
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
          rounded="24px"
          overflow="hidden"
          bg="white"
          boxShadow="0 24px 80px rgba(15, 23, 42, 0.16)"
          display="flex"
          flexDirection="column"
          top={'5vh'}
        >
          <ModalHeader fontSize="16px" fontWeight="600" padding="16px 32px">
            {editingCourse
              ? t('teaching.courses.modal.editTitle')
              : t('teaching.courses.modal.createTitle')}
          </ModalHeader>
          <ModalCloseButton
            top="16px"
            color="#3F3F46"
            _hover={{ bg: 'transparent', color: '#111827' }}
          />
          <Box borderTopWidth="1px" borderColor="#ECECEC" />
          <ModalBody px={8} pt={6} pb={8} overflowY="auto" flex="1">
            <Flex direction="column" gap={6}>
              <Flex gap={6}>
                <FormControl flex="1">
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('teaching.courses.form.code')}
                  </FormLabel>
                  <Input
                    isReadOnly={!!editingCourse}
                    value={formState.code}
                    onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder={t('teaching.courses.form.codePlaceholder')}
                    h="46px"
                    px={4}
                    borderRadius="14px"
                    borderColor="#E6E6E6"
                    bg={editingCourse ? 'gray.50' : 'white'}
                    fontSize="18px"
                    color="#444444"
                  />
                </FormControl>

                <FormControl isRequired flex="1">
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('teaching.courses.form.status')}
                  </FormLabel>
                  <Flex h="46px" alignItems="center">
                    <Stack direction="row" spacing={6}>
                      {[
                        { label: t('teaching.courses.status.enabled'), value: '1' },
                        { label: t('teaching.courses.status.disabled'), value: '0' }
                      ].map((item) => (
                        <CustomRadioCard key={item.value} {...getRadioProps({ value: item.value })}>
                          {item.label}
                        </CustomRadioCard>
                      ))}
                    </Stack>
                  </Flex>
                </FormControl>
              </Flex>

              <FormControl isRequired>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.courses.form.name')}
                </FormLabel>
                <Input
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('teaching.courses.form.namePlaceholder')}
                  maxLength={100}
                  h="46px"
                  px={4}
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  color="#333333"
                  _placeholder={{ color: '#A0AEC0' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.courses.form.type')}
                </FormLabel>
                <Flex gap={3}>
                  {[
                    { label: t('teaching.courses.type.required'), value: '1' },
                    { label: t('teaching.courses.type.elective'), value: '2' }
                  ].map((item) => (
                    <CustomTypeCard key={item.value} {...getTypeRadioProps({ value: item.value })}>
                      {item.label}
                    </CustomTypeCard>
                  ))}
                </Flex>
              </FormControl>

              <FormControl>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.courses.form.major')}
                </FormLabel>
                <AppSelect
                  value={formState.tenantMajorId}
                  onChange={(value) => setFormState((prev) => ({ ...prev, tenantMajorId: value }))}
                  options={majorOptions
                    .filter((item) => item.id !== undefined && item.id !== null)
                    .map((item) => ({
                      value: String(item.id),
                      label: item.name || '--'
                    }))}
                  placeholder={t('teaching.courses.form.majorPlaceholder')}
                  h="46px"
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  menuMaxH="240px"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.courses.form.hours')}
                </FormLabel>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  step="1"
                  value={formState.hours}
                  onChange={(e) => setFormState((prev) => ({ ...prev, hours: e.target.value }))}
                  placeholder={t('teaching.courses.form.hoursPlaceholder')}
                  h="46px"
                  px={4}
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  color="#333333"
                  _placeholder={{ color: '#A0AEC0' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.courses.form.description')}
                </FormLabel>
                <Textarea
                  rows={4}
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder={t('teaching.courses.form.descriptionPlaceholder')}
                  h="92px"
                  minH="92px"
                  px={4}
                  py={3.5}
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  resize="none"
                  color="#333333"
                  _placeholder={{ color: '#A0AEC0' }}
                />
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
              isDisabled={isSubmitting}
            >
              {t('teaching.courses.actions.cancel')}
            </Button>
            <Button
              onClick={() => void handleSave()}
              width="68px"
              h="36px"
              rounded="12px"
              bg="#3A3A3A"
              color="white"
              fontSize="16px"
              fontWeight="600"
              _hover={{ bg: '#262626' }}
              isLoading={isSubmitting}
            >
              {t('teaching.courses.actions.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={closeDeleteModal} isCentered>
        <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
        <ModalContent
          maxW="496px"
          w="496px"
          maxH="calc(100vh - 96px)"
          rounded="24px"
          overflow="hidden"
          bg="white"
          boxShadow="0 24px 80px rgba(15, 23, 42, 0.16)"
          display="flex"
          flexDirection="column"
        >
          <ModalHeader padding="16px 32px">
            <Flex align="center" gap={4}>
              <Flex
                w="24px"
                h="24px"
                align="center"
                justify="center"
                borderRadius="full"
                bg="#FF4D4F"
                color="white"
                fontSize="18px"
                fontWeight="700"
                lineHeight="1"
              >
                i
              </Flex>
              <Text fontSize="14px" fontWeight="600" color="#333333">
                {t('teaching.courses.delete.title')}
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
          <ModalBody px={8} pt={8} pb={6} overflowY="auto" flex="1">
            <Text fontSize="14px" lineHeight="1.75" color="#333333">
              {t('teaching.courses.delete.description', { name: deleteTarget?.name || '' })}
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
              isDisabled={isDeleting}
            >
              {t('teaching.courses.actions.cancel')}
            </Button>
            <Button
              onClick={() => void handleDelete()}
              width="68px"
              h="36px"
              rounded="12px"
              bg="#3A3A3A"
              color="white"
              fontSize="14px"
              fontWeight="600"
              isLoading={isDeleting}
              _hover={{ bg: '#262626' }}
            >
              {t('teaching.courses.actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
