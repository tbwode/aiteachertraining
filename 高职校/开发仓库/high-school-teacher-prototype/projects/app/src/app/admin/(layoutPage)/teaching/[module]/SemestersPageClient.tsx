'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  Checkbox,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Grid,
  GridItem,
  CloseButton,
  Spinner
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@chakra-ui/icons';
import {
  postSemesterPageList,
  postSemesterCreate,
  postSemesterUpdate,
  postSemesterDelete
} from '@/api/admin/teaching/semesters';
import type { SemesterItem } from '@/types/api/admin/teaching/semesters';
import DatePicker from '@/components/common/DatePicker';

const pageSize = 10;

const initialFormData = {
  name: '',
  year: '',
  type: 1,
  startDate: '',
  endDate: '',
  isCurrent: 0
};

type FormErrors = {
  name?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
};

type FormTouched = {
  name?: boolean;
  year?: boolean;
  startDate?: boolean;
  endDate?: boolean;
};

export default function SemestersPageClient() {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const setCurrentModal = useDisclosure();

  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingSemester, setEditingSemester] = useState<SemesterItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SemesterItem | null>(null);
  const [setCurrentTarget, setSetCurrentTarget] = useState<SemesterItem | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formTouched, setFormTouched] = useState<FormTouched>({});

  const safeCurrentPage = Math.min(currentPage, totalPages);

  // 检查表单是否有效（必填字段都已填写）
  const isFormValid =
    formData.name.trim() && formData.year.trim() && formData.startDate && formData.endDate;

  // 表单验证
  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = t('teaching.semesters.messages.nameRequired');
    }
    if (!formData.year.trim()) {
      errors.year = t('teaching.semesters.messages.yearRequired');
    }
    if (!formData.startDate) {
      errors.startDate = t('teaching.semesters.messages.startDateRequired');
    }
    if (!formData.endDate) {
      errors.endDate = t('teaching.semesters.messages.endDateRequired');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 加载学期列表
  const loadSemesterList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postSemesterPageList({
        current: currentPage,
        size: pageSize
      });
      if (res) {
        setSemesters(res.records || []);
        setTotal(res.total || 0);
        // 使用返回的 pages 更新总页数
        if (res.pages) {
          setTotalPages(res.pages);
        }
      }
    } catch (error) {
      toast({
        title: t('teaching.semesters.messages.loadListError'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, toast]);

  // 初始加载
  useEffect(() => {
    loadSemesterList();
  }, [loadSemesterList]);

  const handleSetCurrent = (semester: SemesterItem) => {
    setSetCurrentTarget(semester);
    setCurrentModal.onOpen();
  };

  const confirmSetCurrent = async () => {
    if (!setCurrentTarget) return;

    try {
      await postSemesterUpdate({
        id: parseInt(setCurrentTarget.id),
        name: setCurrentTarget.name,
        year: setCurrentTarget.year,
        type: setCurrentTarget.type,
        startDate: setCurrentTarget.startDate,
        endDate: setCurrentTarget.endDate,
        isCurrent: 1
      });

      toast({
        title: t('teaching.semesters.messages.setCurrentSuccess'),
        description: t('teaching.semesters.messages.setCurrentDescription', {
          name: setCurrentTarget.name
        }),
        status: 'success',
        duration: 2500,
        isClosable: true
      });

      loadSemesterList();
      setCurrentModal.onClose();
      setSetCurrentTarget(null);
    } catch (error) {
      toast({
        title: t('teaching.semesters.messages.operationError'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };

  const openCreateModal = () => {
    setEditingSemester(null);
    setFormData(initialFormData);
    setFormErrors({});
    setFormTouched({});
    editModal.onOpen();
  };

  const openEditModal = (semester: SemesterItem) => {
    setEditingSemester(semester);
    setFormData({
      name: semester.name,
      year: semester.year,
      type: semester.type,
      startDate: semester.startDate,
      endDate: semester.endDate,
      isCurrent: semester.isCurrent
    });
    setFormErrors({});
    setFormTouched({});
    editModal.onOpen();
  };

  const openDeleteModal = (semester: SemesterItem) => {
    // 当前学期不能删除
    if (semester.isCurrent === 1) {
      toast({
        title: t('teaching.semesters.messages.currentCannotDeleteTitle'),
        status: 'warning',
        duration: 2500,
        isClosable: true
      });
      return;
    }
    setDeleteTarget(semester);
    deleteModal.onOpen();
  };

  const closeEditModal = () => {
    setEditingSemester(null);
    setFormData(initialFormData);
    setFormErrors({});
    setFormTouched({});
    editModal.onClose();
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    deleteModal.onClose();
  };

  const closeSetCurrentModal = () => {
    setSetCurrentTarget(null);
    setCurrentModal.onClose();
  };

  const handleSave = async () => {
    // 标记所有字段为已触摸
    setFormTouched({
      name: true,
      year: true,
      startDate: true,
      endDate: true
    });

    if (!validateForm()) {
      return;
    }

    try {
      if (editingSemester) {
        await postSemesterUpdate({
          id: parseInt(editingSemester.id),
          name: formData.name.trim(),
          year: formData.year,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isCurrent: formData.isCurrent
        });

        toast({
          title: t('teaching.semesters.messages.updatedTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
      } else {
        await postSemesterCreate({
          name: formData.name.trim(),
          year: formData.year,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isCurrent: formData.isCurrent
        });

        toast({
          title: t('teaching.semesters.messages.createdTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
        setCurrentPage(1);
      }

      loadSemesterList();
      closeEditModal();
    } catch (error: any) {
      toast({
        title: error.msg,
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await postSemesterDelete({ id: parseInt(deleteTarget.id) });

      toast({
        title: t('teaching.semesters.messages.deletedTitle'),
        status: 'success',
        duration: 2500,
        isClosable: true
      });

      loadSemesterList();
      closeDeleteModal();
    } catch (error: any) {
      toast({
        title: t('teaching.semesters.messages.deleteError'),
        description: error.msg,
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };

  return (
    <Box className="semesters-page" borderRadius="16px" bgColor="#fff" padding="20px">
      <Box overflow="hidden">
        {/* 顶部栏 */}
        <Flex py={4} align="center" justify="space-between" gap={3} borderRadius={0}>
          <Text fontSize="14px" color="#4E5969">
            {t('teaching.semesters.totalCount', { total })}
          </Text>

          <Button
            leftIcon={<AddIcon />}
            h="36px"
            px={4}
            rounded="md"
            color="white"
            fontSize="13px"
            fontWeight="600"
            bg="#2D2D2D"
            _hover={{ bg: '#1F1F1F' }}
            onClick={openCreateModal}
          >
            {t('teaching.semesters.actions.create')}
          </Button>
        </Flex>

        {/* 表格 */}
        <Box overflowX="auto">
          <Table
            variant="simple"
            sx={{
              tableLayout: 'fixed',
              minWidth: '900px',
              borderCollapse: 'collapse'
            }}
          >
            <Thead bg="#FAFAFA">
              <Tr>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="200px"
                >
                  {t('teaching.semesters.table.name')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="120px"
                >
                  {t('teaching.semesters.table.year')}
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
                  {t('teaching.semesters.table.type')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="120px"
                >
                  {t('teaching.semesters.table.startDate')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="120px"
                >
                  {t('teaching.semesters.table.endDate')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="120px"
                >
                  {t('teaching.semesters.table.isCurrent')}
                </Th>
                <Th
                  h="44px"
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  textAlign="center"
                  w="180px"
                >
                  {t('teaching.semesters.table.actions')}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr borderBottom="1px solid #E5E5E5">
                  <Td colSpan={7} py={16} borderColor="blackAlpha.50">
                    <Flex justify="center" align="center" gap={3}>
                      <Spinner size="md" color="gray.400" />
                      <Text fontSize="14px" color="gray.500">
                        {t('teaching.semesters.loading')}
                      </Text>
                    </Flex>
                  </Td>
                </Tr>
              ) : semesters.length > 0 ? (
                semesters.map((semester) => (
                  <Tr key={semester.id} _hover={{ bg: '#FCFCFC' }} borderBottom="1px solid #E5E5E5">
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {semester.name}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {semester.year}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {semester.type === 1
                        ? t('teaching.semesters.table.firstSemester')
                        : t('teaching.semesters.table.secondSemester')}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {semester.startDate}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {semester.endDate}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px">
                      {semester.isCurrent === 1 ? (
                        <Badge
                          bg="#E8FFEA"
                          color="#00B42A"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="14px"
                          fontWeight="500"
                        >
                          <Box
                            as="span"
                            display="inline-block"
                            w="6px"
                            h="6px"
                            bg="#00B42A"
                            borderRadius="full"
                            mr={1}
                          />
                          {t('teaching.semesters.status.current')}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          h="24px"
                          // px={3}
                          variant="outline"
                          rounded="md"
                          fontSize="14px"
                          fontWeight="500"
                          color="#C8000B"
                          borderColor="#C8000B"
                          bg="white"
                          _hover={{ bg: '#FFF5F5' }}
                          onClick={() => handleSetCurrent(semester)}
                        >
                          {t('teaching.semesters.actions.setCurrent')}
                        </Button>
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
                          fontSize="14px"
                          fontWeight="500"
                          borderColor="blackAlpha.300"
                          bg="white"
                          onClick={() => openEditModal(semester)}
                        >
                          {t('teaching.semesters.actions.edit')}
                        </Button>
                        <Button
                          size="sm"
                          h="28px"
                          minW="54px"
                          px={3}
                          variant="outline"
                          rounded="md"
                          fontSize="14px"
                          fontWeight="500"
                          color={semester.isCurrent === 1 ? '#9CA3AF' : '#C8000B'}
                          borderColor={semester.isCurrent === 1 ? '#E5E7EB' : '#F53F3F'}
                          bg="white"
                          _hover={semester.isCurrent === 1 ? {} : { bg: '#FFF5F5' }}
                          isDisabled={semester.isCurrent === 1}
                          title={
                            semester.isCurrent === 1
                              ? t('teaching.semesters.delete.currentCannotDelete')
                              : t('teaching.semesters.actions.delete')
                          }
                          onClick={() => openDeleteModal(semester)}
                        >
                          {t('teaching.semesters.actions.delete')}
                        </Button>
                      </Flex>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={7} py={16} borderColor="blackAlpha.50">
                    <Flex direction="column" align="center" gap={2} color="gray.500">
                      <Text fontSize="14px" fontWeight="600">
                        {t('teaching.semesters.empty.title')}
                      </Text>
                      <Text fontSize="12px">{t('teaching.semesters.empty.description')}</Text>
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
            {t('teaching.semesters.pagination.total', { total })}
          </Text>
          <Flex align="center" gap={2}>
            <IconButton
              aria-label={t('teaching.semesters.pagination.prev')}
              icon={<ChevronLeftIcon boxSize={6} />}
              variant="outline"
              size="sm"
              rounded="md"
              borderColor="blackAlpha.200"
              isDisabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            />
            <Text minW="120px" textAlign="center" fontSize="14px" color="gray.600">
              {t('teaching.semesters.pagination.pageInfo', { page: safeCurrentPage, totalPages })}
            </Text>
            <IconButton
              aria-label={t('teaching.semesters.pagination.next')}
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
      <Modal isOpen={editModal.isOpen} onClose={closeEditModal} size="lg">
        <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="16px" overflow="hidden">
          <ModalHeader
            fontSize="16px"
            fontWeight="600"
            borderBottom="1px"
            borderColor="#ECECEC"
            py={4}
            px={6}
          >
            <Flex justify="space-between" align="center">
              <Text>
                {editingSemester
                  ? t('teaching.semesters.modal.editTitle')
                  : t('teaching.semesters.modal.createTitle')}
              </Text>
              <CloseButton onClick={closeEditModal} size="sm" />
            </Flex>
          </ModalHeader>
          <ModalBody py={6} px={6}>
            <Flex direction="column" gap={5}>
              {/* 学期名称 */}
              <FormControl isInvalid={formTouched.name && !!formErrors.name}>
                <FormLabel fontSize="14px" fontWeight="500" color="#333333" mb={2}>
                  {t('teaching.semesters.form.name')}{' '}
                  <Text as="span" color="#E53E3E">
                    *
                  </Text>
                </FormLabel>
                <Input
                  placeholder={t('teaching.semesters.form.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) {
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  onBlur={() => setFormTouched((prev) => ({ ...prev, name: true }))}
                  h="46px"
                  borderRadius="8px"
                  borderColor="#E7E7E7"
                  bg="white"
                  fontSize="16px"
                  _placeholder={{ color: '#A0AEC0' }}
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                />
                <FormErrorMessage>{formErrors.name}</FormErrorMessage>
              </FormControl>

              {/* 学年和学期 */}
              <Grid templateColumns="1fr 1fr" gap={4}>
                <GridItem>
                  <FormControl isInvalid={formTouched.year && !!formErrors.year}>
                    <FormLabel fontSize="14px" fontWeight="500" color="#333333" mb={2}>
                      {t('teaching.semesters.form.year')}{' '}
                      <Text as="span" color="#E53E3E">
                        *
                      </Text>
                    </FormLabel>
                    <Input
                      placeholder={t('teaching.semesters.form.yearPlaceholder')}
                      value={formData.year}
                      onChange={(e) => {
                        setFormData({ ...formData, year: e.target.value });
                        if (formErrors.year) {
                          setFormErrors((prev) => ({ ...prev, year: undefined }));
                        }
                      }}
                      onBlur={() => setFormTouched((prev) => ({ ...prev, year: true }))}
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="16px"
                      _placeholder={{ color: '#A0AEC0' }}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    />
                    <FormErrorMessage>{formErrors.year}</FormErrorMessage>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="14px" fontWeight="500" color="#333333" mb={2}>
                      {t('teaching.semesters.form.type')}{' '}
                      <Text as="span" color="#E53E3E">
                        *
                      </Text>
                    </FormLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="16px"
                      iconColor="gray.400"
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    >
                      <option value={1}>{t('teaching.semesters.table.firstSemester')}</option>
                      <option value={2}>{t('teaching.semesters.table.secondSemester')}</option>
                    </Select>
                  </FormControl>
                </GridItem>
              </Grid>

              {/* 开始日期和结束日期 */}
              <Grid templateColumns="1fr 1fr" gap={4}>
                <GridItem>
                  <FormControl isInvalid={formTouched.startDate && !!formErrors.startDate}>
                    <FormLabel fontSize="14px" fontWeight="500" color="#333333" mb={2}>
                      {t('teaching.semesters.form.startDate')}{' '}
                      <Text as="span" color="#E53E3E">
                        *
                      </Text>
                    </FormLabel>
                    <DatePicker
                      value={formData.startDate}
                      onChange={(value) => {
                        setFormData({ ...formData, startDate: value });
                        if (formErrors.startDate) {
                          setFormErrors((prev) => ({ ...prev, startDate: undefined }));
                        }
                      }}
                      onBlur={() => setFormTouched((prev) => ({ ...prev, startDate: true }))}
                      h="46px"
                      placeholder={t('teaching.semesters.form.startDatePlaceholder')}
                    />
                    <FormErrorMessage>{formErrors.startDate}</FormErrorMessage>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isInvalid={formTouched.endDate && !!formErrors.endDate}>
                    <FormLabel fontSize="14px" fontWeight="500" color="#333333" mb={2}>
                      {t('teaching.semesters.form.endDate')}{' '}
                      <Text as="span" color="#E53E3E">
                        *
                      </Text>
                    </FormLabel>
                    <DatePicker
                      value={formData.endDate}
                      onChange={(value) => {
                        setFormData({ ...formData, endDate: value });
                        if (formErrors.endDate) {
                          setFormErrors((prev) => ({ ...prev, endDate: undefined }));
                        }
                      }}
                      onBlur={() => setFormTouched((prev) => ({ ...prev, endDate: true }))}
                      h="46px"
                      placeholder={t('teaching.semesters.form.endDatePlaceholder')}
                    />
                    <FormErrorMessage>{formErrors.endDate}</FormErrorMessage>
                  </FormControl>
                </GridItem>
              </Grid>

              {/* 设为当前学期复选框 */}
              <Checkbox
                isChecked={formData.isCurrent === 1}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked ? 1 : 0 })}
                colorScheme="gray"
                iconColor="white"
                sx={{
                  '& .chakra-checkbox__control': {
                    w: '18px',
                    h: '18px',
                    borderRadius: '4px',
                    borderWidth: '1px',
                    borderColor: '#D1D5DB',
                    _checked: {
                      bg: '#333333',
                      borderColor: '#333333'
                    }
                  }
                }}
              >
                <Text fontSize="14px" color="#333333">
                  {t('teaching.semesters.form.isCurrent')}
                </Text>
              </Checkbox>
            </Flex>
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor="#ECECEC" py={4} px={6} gap={3}>
            <Button
              variant="outline"
              h="36px"
              width="68px"
              rounded="12px"
              fontSize="16px"
              fontWeight="500"
              borderColor="#3A3A3A"
              bg="white"
              color="#333333"
              onClick={closeEditModal}
            >
              {t('teaching.semesters.actions.cancel')}
            </Button>
            <Button
              h="36px"
              width="68px"
              rounded="12px"
              fontSize="16px"
              fontWeight="600"
              bg={'#3A3A3A'}
              disabled={!isFormValid}
              color="white"
              _hover={{ bg: '#262626' }}
              cursor={isFormValid ? 'pointer' : 'not-allowed'}
              onClick={() => isFormValid && handleSave()}
            >
              {t('teaching.semesters.actions.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 设为当前学期确认弹窗 */}
      <Modal isOpen={setCurrentModal.isOpen} onClose={closeSetCurrentModal} size="md">
        <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="16px" overflow="hidden">
          <ModalHeader
            fontSize="16px"
            fontWeight="600"
            borderBottom="1px"
            borderColor="#ECECEC"
            py={4}
            px={6}
          >
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="full"
                  bg="#22C55E"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <CheckIcon w="12px" h="12px" color="white" />
                </Box>
                <Text>{t('teaching.semesters.modal.setCurrentTitle')}</Text>
              </Flex>
              <CloseButton onClick={closeSetCurrentModal} size="sm" />
            </Flex>
          </ModalHeader>
          <ModalBody py={6} px={6}>
            <Text fontSize="14px" color="#333333">
              {t('teaching.semesters.setCurrent.confirmMessage', { name: setCurrentTarget?.name })}
            </Text>
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor="#ECECEC" py={4} px={6} gap={3}>
            <Button
              variant="outline"
              h="36px"
              // width="68px"
              rounded="12px"
              fontSize="14px"
              fontWeight="500"
              borderColor="#3A3A3A"
              bg="white"
              color="#333333"
              onClick={closeSetCurrentModal}
            >
              {t('teaching.semesters.actions.cancel')}
            </Button>
            <Button
              h="36px"
              // width="68px"
              rounded="12px"
              fontSize="14px"
              fontWeight="600"
              bg="#333333"
              color="white"
              _hover={{ bg: '#1A1A1A' }}
              onClick={confirmSetCurrent}
            >
              {t('teaching.semesters.actions.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal isOpen={deleteModal.isOpen} onClose={closeDeleteModal} size="md">
        <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="16px" overflow="hidden">
          <ModalHeader
            fontSize="16px"
            fontWeight="600"
            borderBottom="1px"
            borderColor="#ECECEC"
            py={4}
            px={6}
          >
            <Flex justify="space-between" align="center">
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
                <Text>{t('teaching.semesters.delete.title')}</Text>
              </Flex>
              <CloseButton onClick={closeDeleteModal} size="sm" />
            </Flex>
          </ModalHeader>
          <ModalBody py={6} px={6}>
            <Text fontSize="14px" lineHeight="1.75" color="#333333">
              {t('teaching.semesters.delete.description', { name: deleteTarget?.name || '' })}
            </Text>
            <Text fontSize="14px" lineHeight="1.75" color="#999999" mt={4}>
              {t('teaching.semesters.delete.confirmDescription')}
            </Text>
          </ModalBody>
          <ModalFooter borderTop="1px" borderColor="#ECECEC" py={4} px={6} gap={3}>
            <Button
              variant="outline"
              h="36px"
              // width="68px"
              rounded="12px"
              fontSize="14px"
              fontWeight="500"
              borderColor="#3A3A3A"
              bg="white"
              color="#333333"
              onClick={closeDeleteModal}
            >
              {t('teaching.semesters.actions.cancel')}
            </Button>
            <Button
              h="36px"
              // width="68px"
              rounded="12px"
              fontSize="14px"
              fontWeight="600"
              bg="#333333"
              color="white"
              _hover={{ bg: '#1A1A1A' }}
              onClick={handleDelete}
            >
              {t('teaching.semesters.actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
