'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Badge,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { postTenantMajorListCategories, postTenantMajorList } from '@/api/admin/teaching/majors';
import { postGradeList } from '@/api/admin/teaching/grades';
import { postTeacherList } from '@/api/admin/teaching/teachers';
import {
  postClassPageList,
  postClassCreate,
  postClassUpdate,
  postClassDelete,
  postClassDetail
} from '@/api/admin/teaching/classes';
import type { GradeListItem } from '@/types/api/admin/teaching/grades';
import type { MajorCategoryVO, TenantMajorSimpleVO } from '@/types/api/admin/teaching/majors';
import type { ClassItem, ClassPageRequest } from '@/types/api/admin/teaching/classes';
import type { TeacherListItem } from '@/types/api/admin/teaching/teachers';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';

type FilterState = {
  categoryId: string;
  majorId: string;
  gradeId: string;
  status: string;
};

type ClassFormState = {
  name: string;
  categoryId: string;
  majorId: string;
  gradeId: string;
  teacherId: string;
  status: number;
};

type FormErrors = {
  name: string;
  categoryId: string;
  majorId: string;
  gradeId: string;
  teacherId: string;
};

type FormTouched = {
  name: boolean;
  categoryId: boolean;
  majorId: boolean;
  gradeId: boolean;
};

const pageSize = 10;

const defaultFilters: FilterState = {
  categoryId: '',
  majorId: '',
  gradeId: '',
  status: ''
};

const defaultFormState: ClassFormState = {
  name: '',
  categoryId: '',
  majorId: '',
  gradeId: '',
  teacherId: '',
  status: 1
};

export default function ClassesPageClient() {
  const isI18nReady = useAdminPageI18n(['teaching']);
  const { t } = useTranslation();
  const toast = useToast();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // 大类和专业列表
  const [categories, setCategories] = useState<MajorCategoryVO[]>([]);
  const [majors, setMajors] = useState<TenantMajorSimpleVO[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingMajors, setLoadingMajors] = useState(false);

  // 年级列表
  const [grades, setGrades] = useState<GradeListItem[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // 教师列表
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // 弹窗内专业列表（级联选择）
  const [modalMajors, setModalMajors] = useState<TenantMajorSimpleVO[]>([]);
  const [loadingModalMajors, setLoadingModalMajors] = useState(false);

  // 弹窗状态
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [formState, setFormState] = useState<ClassFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: '',
    categoryId: '',
    majorId: '',
    gradeId: '',
    teacherId: ''
  });
  const [formTouched, setFormTouched] = useState<FormTouched>({
    name: false,
    categoryId: false,
    majorId: false,
    gradeId: false
  });

  // 加载班级列表
  const loadClassList = useCallback(async () => {
    setLoading(true);
    try {
      const params: ClassPageRequest = {
        current: currentPage,
        size: pageSize,
        categoryId: filters.categoryId ? parseInt(filters.categoryId) : undefined,
        majorId: filters.majorId ? parseInt(filters.majorId) : undefined,
        gradeId: filters.gradeId ? parseInt(filters.gradeId) : undefined,
        status: filters.status ? parseInt(filters.status) : undefined
      };
      const res = await postClassPageList(params);
      if (res) {
        setClasses(res.records || []);
        setTotal(res.total || 0);
        setTotalPages(res.pages || 1);

        // 如果当前页超过总页数，调整到最后一页
        if (currentPage > (res.pages || 1)) {
          setCurrentPage(res.pages || 1);
        }
      }
    } catch (error) {
      toast({
        title: t('teaching.classes.messages.loadListError'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.categoryId, filters.majorId, filters.gradeId, filters.status, toast]);

  // 初始加载
  useEffect(() => {
    loadClassList();
  }, [loadClassList]);

  // 获取大类列表
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await postTenantMajorListCategories();
        setCategories(res || []);
      } catch (error) {
        toast({
          title: t('teaching.classes.messages.loadCategoriesError'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [toast]);

  // 根据所选大类获取专业列表
  useEffect(() => {
    const loadMajors = async () => {
      if (!filters.categoryId) {
        setMajors([]);
        return;
      }
      setLoadingMajors(true);
      try {
        const categoryId = parseInt(filters.categoryId);
        const res = await postTenantMajorList({ categoryId });
        setMajors(res || []);
      } catch (error) {
        toast({
          title: t('teaching.classes.messages.loadMajorsError'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      } finally {
        setLoadingMajors(false);
      }
    };
    loadMajors();
  }, [filters.categoryId, toast]);

  // 获取年级列表
  useEffect(() => {
    const loadGrades = async () => {
      setLoadingGrades(true);
      try {
        const res = await postGradeList();
        setGrades(res || []);
      } catch (error) {
        toast({
          title: t('teaching.classes.messages.loadGradesError'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      } finally {
        setLoadingGrades(false);
      }
    };
    loadGrades();
  }, [toast]);

  const safeCurrentPage = currentPage;

  const handleSearch = () => {
    setCurrentPage(1);
    loadClassList();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setEditingClass(null);
    setFormState(defaultFormState);
    setFormErrors({ name: '', categoryId: '', majorId: '', gradeId: '', teacherId: '' });
    setFormTouched({ name: false, categoryId: false, majorId: false, gradeId: false });
    editModal.onOpen();
  };

  const openEditModal = async (classItem: ClassItem) => {
    setEditingClass(classItem);
    editModal.onOpen();

    // 调用班级详情接口
    try {
      const detail = await postClassDetail({ id: parseInt(classItem.id) });
      setFormState({
        name: detail.name,
        categoryId: String(detail.categoryId),
        majorId: String(detail.majorId),
        gradeId: String(detail.gradeId),
        teacherId: detail.teacherId ? String(detail.teacherId) : '',
        status: detail.status
      });
    } catch (error) {
      toast({
        title: t('teaching.classes.messages.loadDetailError'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
      // 使用列表数据作为回退
      setFormState({
        name: classItem.name,
        categoryId: String(classItem.categoryId),
        majorId: String(classItem.majorId),
        gradeId: String(classItem.gradeId),
        teacherId: classItem.teacherId ? String(classItem.teacherId) : '',
        status: classItem.status
      });
    }
    setFormErrors({ name: '', categoryId: '', majorId: '', gradeId: '', teacherId: '' });
    setFormTouched({ name: false, categoryId: false, majorId: false, gradeId: false });
  };

  const openDeleteModal = (classItem: ClassItem) => {
    setDeleteTarget(classItem);
    deleteModal.onOpen();
  };

  const closeEditModal = () => {
    setEditingClass(null);
    setFormState(defaultFormState);
    setFormErrors({ name: '', categoryId: '', majorId: '', gradeId: '', teacherId: '' });
    setFormTouched({ name: false, categoryId: false, majorId: false, gradeId: false });
    editModal.onClose();
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    deleteModal.onClose();
  };

  // 加载教师列表
  useEffect(() => {
    const loadTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const res = await postTeacherList({ type: 1 }); // 1-教师
        setTeachers(res || []);
      } catch (error) {
        toast({
          title: t('teaching.classes.messages.loadTeachersError'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      } finally {
        setLoadingTeachers(false);
      }
    };
    loadTeachers();
  }, [toast]);

  // 弹窗内根据大类加载专业
  useEffect(() => {
    const loadModalMajors = async () => {
      if (!formState.categoryId) {
        setModalMajors([]);
        return;
      }
      setLoadingModalMajors(true);
      try {
        const categoryId = parseInt(formState.categoryId);
        const res = await postTenantMajorList({ categoryId });
        setModalMajors(res || []);
      } catch (error) {
        toast({
          title: t('teaching.classes.messages.loadMajorsError'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      } finally {
        setLoadingModalMajors(false);
      }
    };
    loadModalMajors();
  }, [formState.categoryId, toast]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      name: '',
      categoryId: '',
      majorId: '',
      gradeId: '',
      teacherId: ''
    };
    let hasError = false;

    if (!formState.name.trim()) {
      errors.name = t('teaching.classes.messages.nameRequiredError');
      hasError = true;
    }
    if (!formState.categoryId) {
      errors.categoryId = t('teaching.classes.form.categoryPlaceholder');
      hasError = true;
    }
    if (!formState.majorId) {
      errors.majorId = t('teaching.classes.form.majorPlaceholder');
      hasError = true;
    }
    if (!formState.gradeId) {
      errors.gradeId = t('teaching.classes.form.gradePlaceholder');
      hasError = true;
    }

    setFormErrors(errors);
    setFormTouched({ name: true, categoryId: true, majorId: true, gradeId: true });
    return !hasError;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editingClass) {
        await postClassUpdate({
          id: parseInt(editingClass.id),
          name: formState.name.trim(),
          categoryId: parseInt(formState.categoryId),
          majorId: parseInt(formState.majorId),
          gradeId: parseInt(formState.gradeId),
          teacherId: formState.teacherId ? parseInt(formState.teacherId) : 0,
          status: formState.status
        });
        toast({
          title: t('teaching.classes.messages.updatedTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
      } else {
        await postClassCreate({
          name: formState.name.trim(),
          categoryId: parseInt(formState.categoryId),
          majorId: parseInt(formState.majorId),
          gradeId: parseInt(formState.gradeId),
          teacherId: formState.teacherId ? parseInt(formState.teacherId) : undefined,
          status: formState.status
        });
        toast({
          title: t('teaching.classes.messages.createdTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
        setCurrentPage(1);
      }
      loadClassList();
      closeEditModal();
    } catch (error: any) {
      toast({
        title: t('teaching.classes.messages.operationError'),
        description: error.msg,
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await postClassDelete({ id: parseInt(deleteTarget.id) });
      toast({
        title: t('teaching.classes.messages.deletedTitle'),
        status: 'success',
        duration: 2500,
        isClosable: true
      });
      loadClassList();
      closeDeleteModal();
    } catch (error: any) {
      toast({
        title: t('teaching.classes.messages.deleteError'),
        description: error.msg,
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };
  if (!isI18nReady) return null;
  return (
    <Box className="classes-page" borderRadius="16px" bgColor="#fff" padding="20px">
      <Box overflow="hidden">
        {/* 顶部筛选栏 */}
        <Flex
          py={4}
          align={{ base: 'stretch', xl: 'center' }}
          justify="space-between"
          gap={3}
          direction={{ base: 'column', xl: 'row' }}
          borderRadius={0}
        >
          <Flex
            flex="1"
            align={{ base: 'stretch', md: 'center' }}
            gap={3}
            wrap="wrap"
            direction={{ base: 'column', md: 'row' }}
          >
            {/* 大类筛选 */}
            <Select
              value={filters.categoryId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, categoryId: e.target.value, majorId: '' }))
              }
              h="36px"
              fontSize="13px"
              w={{ base: 'full', md: '160px' }}
              rounded="md"
              bg="white"
              borderColor="blackAlpha.200"
              iconColor="gray.500"
              disabled={loadingCategories}
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
            >
              <option value="">{t('teaching.classes.filters.allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </Select>

            {/* 专业筛选 */}
            <Select
              value={filters.majorId}
              onChange={(e) => setFilters((prev) => ({ ...prev, majorId: e.target.value }))}
              h="36px"
              fontSize="13px"
              w={{ base: 'full', md: '160px' }}
              rounded="md"
              bg="white"
              borderColor="blackAlpha.200"
              iconColor="gray.500"
              disabled={loadingMajors}
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
            >
              <option value="">
                {!filters.categoryId
                  ? t('teaching.classes.filters.allMajors')
                  : t('teaching.classes.form.majorPlaceholder')}
              </option>
              {majors.map((major) => (
                <option key={major.id} value={String(major.id)}>
                  {major.name}
                </option>
              ))}
            </Select>

            {/* 年级筛选 */}
            <Select
              value={filters.gradeId}
              onChange={(e) => setFilters((prev) => ({ ...prev, gradeId: e.target.value }))}
              h="36px"
              fontSize="13px"
              w={{ base: 'full', md: '140px' }}
              rounded="md"
              bg="white"
              borderColor="blackAlpha.200"
              iconColor="gray.500"
              disabled={loadingGrades}
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
            >
              <option value="">{t('teaching.classes.filters.allGrades')}</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </Select>

            {/* 状态筛选 */}
            <Select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              h="36px"
              fontSize="13px"
              w={{ base: 'full', md: '140px' }}
              rounded="md"
              bg="white"
              borderColor="blackAlpha.200"
              iconColor="gray.500"
              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
            >
              <option value="">{t('teaching.classes.filters.allStatuses')}</option>
              <option value="1">{t('teaching.classes.statusOptions.active')}</option>
              <option value="2">Graduated</option>
            </Select>

            {/* 查询按钮 */}
            <Button
              h="36px"
              px={6}
              rounded="md"
              color="white"
              fontSize="13px"
              fontWeight="600"
              bg="#2D2D2D"
              _hover={{ bg: '#1F1F1F' }}
              onClick={handleSearch}
            >
              {t('teaching.classes.messages.search')}
            </Button>

            {/* 重置按钮 */}
            <Button
              h="36px"
              px={6}
              rounded="md"
              fontSize="13px"
              fontWeight="600"
              variant="outline"
              borderColor="blackAlpha.300"
              onClick={handleReset}
            >
              {t('teaching.classes.actions.reset')}
            </Button>
          </Flex>

          {/* 新增班级按钮 */}
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
            {t('teaching.classes.actions.create')}
          </Button>
        </Flex>

        {/* 表格 */}
        <Box overflowX="auto">
          <Table variant="simple" sx={{ tableLayout: 'fixed', minWidth: '1100px' }}>
            <Thead bg="#FAFAFA">
              <Tr>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="140px"
                >
                  {t('teaching.classes.table.code')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="180px"
                >
                  {t('teaching.classes.table.name')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="160px"
                >
                  {t('teaching.classes.table.major')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="100px"
                >
                  {t('teaching.classes.table.grade')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="100px"
                >
                  {t('teaching.classes.table.teacher')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="80px"
                >
                  {t('teaching.classes.table.studentCount')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="80px"
                >
                  {t('teaching.classes.table.status')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  textAlign="center"
                  w="140px"
                >
                  {t('teaching.classes.table.actions')}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={8} py={16} borderColor="blackAlpha.50">
                    <Flex justify="center" align="center" gap={3}>
                      <Spinner size="md" color="gray.400" />
                      <Text fontSize="14px" color="gray.500">
                        {t('teaching.classes.loading')}
                      </Text>
                    </Flex>
                  </Td>
                </Tr>
              ) : classes.length > 0 ? (
                classes.map((classItem) => (
                  <Tr
                    key={classItem.id}
                    _hover={{ bg: '#FCFCFC' }}
                    borderBottom="1px solid #E5E5E5"
                  >
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {classItem.code}
                    </Td>
                    <Td
                      px={5}
                      py={3.5}
                      borderColor="blackAlpha.50"
                      fontSize="14px"
                      color="#4E5969"
                      fontWeight="500"
                    >
                      {classItem.name}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {classItem.majorName}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {classItem.gradeName}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {classItem.teacherName || '-'}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {classItem.studentCount || 0}
                      {t('teaching.classes.table.studentUnit', {
                        count: classItem.studentCount || 0
                      })}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px">
                      {classItem.status === 1 ? (
                        <Badge
                          bg="#DCFCE7"
                          color="#166534"
                          px={2.5}
                          py={0.5}
                          borderRadius="full"
                          fontSize="12px"
                          fontWeight="500"
                        >
                          <Box
                            as="span"
                            display="inline-block"
                            w="6px"
                            h="6px"
                            bg="#22C55E"
                            borderRadius="full"
                            mr={1.5}
                          />
                          {t('teaching.classes.statusLabels.active')}
                        </Badge>
                      ) : (
                        <Badge
                          bg="#F3F4F6"
                          color="#6B7280"
                          px={2.5}
                          py={0.5}
                          borderRadius="full"
                          fontSize="12px"
                          fontWeight="500"
                        >
                          <Box
                            as="span"
                            display="inline-block"
                            w="6px"
                            h="6px"
                            bg="#9CA3AF"
                            borderRadius="full"
                            mr={1.5}
                          />
                          {t('teaching.classes.statusLabels.graduated')}
                        </Badge>
                      )}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50">
                      <Flex justify="center" gap={2}>
                        <Button
                          size="sm"
                          h="28px"
                          minW="54px"
                          px={3}
                          variant="outline"
                          rounded="md"
                          fontSize="12px"
                          fontWeight="500"
                          borderColor="blackAlpha.300"
                          bg="white"
                          onClick={() => openEditModal(classItem)}
                        >
                          {t('teaching.classes.actions.edit')}
                        </Button>
                        <Button
                          size="sm"
                          h="28px"
                          minW="54px"
                          px={3}
                          variant="outline"
                          rounded="md"
                          fontSize="12px"
                          fontWeight="500"
                          color="#C8000B"
                          borderColor="#F53F3F"
                          bg="white"
                          _hover={{ bg: '#FFF5F5' }}
                          onClick={() => openDeleteModal(classItem)}
                        >
                          {t('teaching.classes.actions.delete')}
                        </Button>
                      </Flex>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={8} py={16} borderColor="blackAlpha.50">
                    <Flex direction="column" align="center" gap={2} color="gray.500">
                      <Text fontSize="14px" fontWeight="600">
                        {t('teaching.classes.empty.title')}
                      </Text>
                      <Text fontSize="12px">{t('teaching.classes.empty.description')}</Text>
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
            {t('teaching.classes.pagination.total', { value: total })}
          </Text>
          <Flex align="center" gap={2}>
            <IconButton
              aria-label={t('teaching.classes.pagination.prev')}
              icon={<ChevronLeftIcon boxSize={6} />}
              variant="outline"
              size="sm"
              rounded="md"
              borderColor="blackAlpha.200"
              isDisabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            />
            <Text minW="120px" textAlign="center" fontSize="14px" color="gray.600">
              {t('teaching.classes.pagination.pageInfo', {
                page: safeCurrentPage,
                total: totalPages
              })}
            </Text>
            <IconButton
              aria-label={t('teaching.classes.pagination.next')}
              icon={<ChevronRightIcon boxSize={6} />}
              variant="outline"
              size="sm"
              rounded="md"
              borderColor="blackAlpha.200"
              isDisabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            />
          </Flex>
        </Flex>
      </Box>

      {/* 新增/编辑弹窗 */}
      <Modal isOpen={editModal.isOpen} onClose={closeEditModal} isCentered size="lg">
        <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
        <ModalContent
          rounded="24px"
          overflow="hidden"
          bg="white"
          boxShadow="0 24px 80px rgba(15, 23, 42, 0.16)"
        >
          <ModalHeader fontSize="16px" fontWeight="600" padding="16px 32px" color="#333333">
            {editingClass
              ? t('teaching.classes.modal.editTitle')
              : t('teaching.classes.modal.createTitle')}
          </ModalHeader>
          <ModalCloseButton
            top="16px"
            color="gray.700"
            _hover={{ bg: 'transparent', color: 'gray.900' }}
          />
          <Box borderTopWidth="1px" borderColor="#ECECEC" />
          <ModalBody px={8} pt={6} pb={8} maxH={'550px'} overflow={'auto'}>
            <Flex direction="column" gap={6}>
              {/* 班级编码 */}
              <FormControl>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.classes.table.code')}
                </FormLabel>
                <Input
                  value={
                    editingClass ? editingClass.code : t('teaching.classes.options.autoGenerated')
                  }
                  isReadOnly
                  h="46px"
                  px={4}
                  borderRadius="8px"
                  borderColor="#E7E7E7"
                  bg="gray.50"
                  fontSize="16px"
                  color="gray.500"
                />
              </FormControl>

              {/* 班级名称 */}
              <FormControl isInvalid={formTouched.name && !!formErrors.name}>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.classes.form.name')}{' '}
                  <Text as="span" color="#E53E3E">
                    *
                  </Text>
                </FormLabel>
                <Input
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  onBlur={() => setFormTouched((prev) => ({ ...prev, name: true }))}
                  placeholder={t('teaching.classes.form.namePlaceholder')}
                  h="46px"
                  px={4}
                  borderRadius="8px"
                  borderColor="#E7E7E7"
                  bg="white"
                  fontSize="16px"
                  _placeholder={{ color: '#A0AEC0' }}
                />
                <FormErrorMessage>{formErrors.name}</FormErrorMessage>
              </FormControl>

              {/* 所属大类 */}
              <FormControl isInvalid={formTouched.categoryId && !!formErrors.categoryId}>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.classes.form.category')}{' '}
                  <Text as="span" color="#E53E3E">
                    *
                  </Text>
                </FormLabel>
                <Select
                  value={formState.categoryId}
                  onChange={(e) => {
                    const categoryId = e.target.value;
                    setFormState((prev) => ({
                      ...prev,
                      categoryId: categoryId,
                      majorId: '' // 切换大类时清空专业选择
                    }));
                  }}
                  onBlur={() => setFormTouched((prev) => ({ ...prev, categoryId: true }))}
                  h="46px"
                  borderRadius="8px"
                  borderColor="#E7E7E7"
                  bg="white"
                  fontSize="16px"
                  iconColor="gray.400"
                  disabled={loadingCategories}
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                >
                  <option value="">{t('teaching.classes.form.categoryPlaceholder')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{formErrors.categoryId}</FormErrorMessage>
              </FormControl>

              {/* 专业 */}
              <FormControl isInvalid={formTouched.majorId && !!formErrors.majorId}>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.classes.form.major')}{' '}
                  <Text as="span" color="#E53E3E">
                    *
                  </Text>
                </FormLabel>
                <Select
                  value={formState.majorId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, majorId: e.target.value }))}
                  onBlur={() => setFormTouched((prev) => ({ ...prev, majorId: true }))}
                  h="46px"
                  borderRadius="8px"
                  borderColor="#E7E7E7"
                  bg="white"
                  fontSize="16px"
                  iconColor="gray.400"
                  disabled={!formState.categoryId || loadingModalMajors}
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                  placeholder={
                    loadingModalMajors
                      ? t('teaching.classes.options.loading')
                      : !formState.categoryId
                        ? t('teaching.classes.options.selectCategoryFirst')
                        : t('teaching.classes.options.select')
                  }
                >
                  {modalMajors.map((major) => (
                    <option key={major.id} value={String(major.id)}>
                      {major.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{formErrors.majorId}</FormErrorMessage>
              </FormControl>

              {/* 年级 */}
              <FormControl isInvalid={formTouched.gradeId && !!formErrors.gradeId}>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.classes.table.grade')}{' '}
                  <Text as="span" color="#E53E3E">
                    *
                  </Text>
                </FormLabel>
                <Select
                  value={formState.gradeId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, gradeId: e.target.value }))}
                  onBlur={() => setFormTouched((prev) => ({ ...prev, gradeId: true }))}
                  h="46px"
                  borderRadius="8px"
                  borderColor="#E7E7E7"
                  bg="white"
                  fontSize="16px"
                  iconColor="gray.400"
                  disabled={loadingGrades}
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                >
                  <option value="">{t('teaching.classes.form.gradePlaceholder')}</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{formErrors.gradeId}</FormErrorMessage>
              </FormControl>

              {/* 班主任 */}
              <FormControl>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.classes.form.teacher')}
                </FormLabel>
                <Select
                  value={formState.teacherId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, teacherId: e.target.value }))}
                  h="46px"
                  borderRadius="8px"
                  borderColor="#E7E7E7"
                  bg="white"
                  fontSize="16px"
                  iconColor="gray.400"
                  disabled={loadingTeachers}
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                  placeholder={t('teaching.classes.form.teacherPlaceholder')}
                >
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* 状态 */}
              <FormControl mt={4}>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.classes.form.status')}
                </FormLabel>
                <Flex gap={4}>
                  <Checkbox
                    isChecked={formState.status === 1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormState((prev) => ({ ...prev, status: e.target.checked ? 1 : 2 }))
                    }
                    sx={{
                      '& .chakra-checkbox__control': {
                        w: '18px',
                        h: '18px',
                        borderRadius: '50%',
                        borderWidth: '1px',
                        borderColor: '#D1D5DB',
                        _checked: {
                          bg: '#333333',
                          borderColor: '#333333'
                        }
                      }
                    }}
                  >
                    {t('teaching.classes.statusLabels.active')}
                  </Checkbox>
                  <Checkbox
                    isChecked={formState.status === 2}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormState((prev) => ({ ...prev, status: e.target.checked ? 2 : 1 }))
                    }
                    sx={{
                      '& .chakra-checkbox__control': {
                        w: '18px',
                        h: '18px',
                        borderRadius: '50%',
                        borderWidth: '1px',
                        borderColor: '#D1D5DB',
                        _checked: {
                          bg: '#333333',
                          borderColor: '#333333'
                        }
                      }
                    }}
                  >
                    {t('teaching.classes.statusLabels.graduated')}
                  </Checkbox>
                </Flex>
              </FormControl>
            </Flex>
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor="#ECECEC" py={4} px={6} gap={3}>
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
              {t('teaching.classes.actions.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              width="68px"
              h="36px"
              rounded="12px"
              bg="#3A3A3A"
              color="white"
              fontSize="16px"
              fontWeight="600"
              _hover={{ bg: '#262626' }}
              isDisabled={
                !formState.name.trim() ||
                !formState.categoryId ||
                !formState.majorId ||
                !formState.gradeId
              }
            >
              {t('teaching.classes.actions.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认弹窗 */}
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
          <ModalHeader padding="16px 32px" fontSize="16px" fontWeight="600" color="#333333">
            {t('teaching.classes.delete.title')}
          </ModalHeader>
          <ModalCloseButton
            top="16px"
            right="16px"
            color="gray.700"
            _hover={{ bg: 'transparent', color: 'gray.900' }}
          />
          <Box borderTopWidth="1px" borderColor="#ECECEC" />
          <ModalBody px={8} pt={6} pb={6}>
            {/* 警告提示 */}
            <Flex align="center" gap={2} mb={4}>
              <Box as="span" color="#FF4D4F" fontSize="18px">
                ⚠️
              </Box>
              <Text fontSize="14px" lineHeight="1.75" color="#333333">
                {t('teaching.classes.delete.confirm', { name: deleteTarget?.name || '' })}
              </Text>
            </Flex>

            {/* 提示文字 */}
            <Text fontSize="14px" lineHeight="1.75" color="#999999" mb={4}>
              {t('teaching.classes.delete.confirmDescription')}
            </Text>

            {/* 学生数量提示 */}
            {(deleteTarget?.studentCount || 0) > 0 ? (
              <Flex gap={3} align="flex-start" mb={3}>
                <Box as="span" color="#FF4D4F" fontSize="16px" fontWeight="bold">
                  ×
                </Box>
                <Text fontSize="14px" lineHeight="1.6" color="#333333">
                  {t('teaching.classes.delete.hasStudents', {
                    count: deleteTarget?.studentCount || 0
                  })}
                </Text>
              </Flex>
            ) : null}
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor="#ECECEC" py={4} px={6} gap={3}>
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              h="36px"
              px={4}
              rounded="8px"
              borderColor="#D9D9D9"
              bg="white"
              fontSize="14px"
              fontWeight="500"
              color="#333333"
              _hover={{ bg: '#F5F5F5' }}
            >
              {t('teaching.classes.actions.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              isDisabled={Boolean((deleteTarget?.studentCount || 0) > 0)}
              h="36px"
              px={4}
              rounded="8px"
              bg={(deleteTarget?.studentCount || 0) > 0 ? '#C9C9C9' : '#333333'}
              color="#FFFFFF"
              fontSize="14px"
              fontWeight="500"
              _hover={{ bg: (deleteTarget?.studentCount || 0) > 0 ? '#C9C9C9' : '#444444' }}
            >
              {t('teaching.classes.actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
