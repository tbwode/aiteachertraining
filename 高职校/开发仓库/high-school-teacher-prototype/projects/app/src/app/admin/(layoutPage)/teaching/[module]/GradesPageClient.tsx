'use client';

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons';
import {
  postGradePageList,
  postGradeCreate,
  postGradeUpdate,
  postGradeDelete
} from '@/api/admin/teaching/grades';
import type { GradeItem } from '@/types/api/admin/teaching/grades';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import { useTranslation } from 'react-i18next';

// 使用 API 类型 GradeItem

type GradeFormState = {
  name: string;
  description: string;
  sort: number;
};

type FormErrors = {
  name: string;
};

type FormTouched = {
  name: boolean;
};

const pageSize = 10;

const defaultFormState: GradeFormState = {
  name: '',
  description: '',
  sort: 0
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    if ('msg' in error && typeof error.msg === 'string' && error.msg.trim()) {
      return error.msg;
    }

    if ('message' in error && typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  }

  return undefined;
};

export default function GradesPageClient() {
  const toast = useToast();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const isI18nReady = useAdminPageI18n(['grades']);
  const { t } = useTranslation('admin', { keyPrefix: 'grades' });
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingGrade, setEditingGrade] = useState<GradeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GradeItem | null>(null);
  const [formState, setFormState] = useState<GradeFormState>(defaultFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({ name: '' });
  const [formTouched, setFormTouched] = useState<FormTouched>({ name: false });

  const safeCurrentPage = Math.min(currentPage, totalPages);

  // 加载年级列表数据
  const loadGradeList = useCallback(
    async (page: number = currentPage) => {
      setLoading(true);
      try {
        const res = await postGradePageList({
          current: page,
          size: pageSize,
          name: searchText.trim()
        });

        if (res) {
          setGrades(res.records);
          setTotal(res.total);
          setTotalPages(res.pages || 1);

          // 如果当前页超过总页数，调整到最后一页
          if (page > (res.pages || 1)) {
            setCurrentPage(res.pages || 1);
          }
        }
      } catch (error) {
        toast({
          title: t('messages.loadFailed'),
          description: getErrorMessage(error),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      } finally {
        setLoading(false);
      }
    },
    [currentPage, searchText, t, toast]
  );

  // 初始加载和分页/搜索变化时重新加载
  useEffect(() => {
    if (!isI18nReady) return;
    loadGradeList();
  }, [isI18nReady, loadGradeList]);

  const openCreateModal = () => {
    setEditingGrade(null);
    setFormState(defaultFormState);
    setFormErrors({ name: '' });
    setFormTouched({ name: false });
    editModal.onOpen();
  };

  const openEditModal = (grade: GradeItem) => {
    setEditingGrade(grade);
    setFormState({
      name: grade.name,
      description: grade.description || '',
      sort: grade.sort ?? 0
    });
    setFormErrors({ name: '' });
    setFormTouched({ name: false });
    editModal.onOpen();
  };

  const openDeleteModal = (grade: GradeItem) => {
    setDeleteTarget(grade);
    deleteModal.onOpen();
  };

  const closeEditModal = () => {
    setEditingGrade(null);
    setFormState(defaultFormState);
    editModal.onClose();
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    deleteModal.onClose();
  };

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();

    // 表单校验
    const errors: FormErrors = { name: '' };
    let hasError = false;

    if (!formState.name.trim()) {
      errors.name = t('messages.nameRequired');
      hasError = true;
    }

    setFormErrors(errors);
    setFormTouched({ name: true });

    if (hasError) {
      return;
    }

    try {
      if (editingGrade) {
        // 编辑模式
        await postGradeUpdate({
          id: editingGrade.id,
          name: formState.name.trim(),
          description: formState.description.trim(),
          sort: formState.sort
        });

        toast({
          title: t('messages.updatedTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
      } else {
        // 新增模式
        await postGradeCreate({
          name: formState.name.trim(),
          description: formState.description.trim(),
          sort: formState.sort
        });

        toast({
          title: t('messages.createdTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
        setCurrentPage(1);
      }

      await loadGradeList(editingGrade ? currentPage : 1);
      closeEditModal();
    } catch (error) {
      toast({
        title: t('messages.operateFailed'),
        description: getErrorMessage(error),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    try {
      await postGradeDelete({ id: deleteTarget.id });

      toast({
        title: t('messages.deletedTitle'),
        status: 'success',
        duration: 2500,
        isClosable: true
      });
      await loadGradeList();
      closeDeleteModal();
    } catch (error) {
      toast({
        title: t('messages.deleteFailed'),
        description: getErrorMessage(error),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };
  if (!isI18nReady) return null;
  return (
    <Box className="grades-page" borderRadius="16px" bgColor="#fff" padding="20px">
      <Box overflow="hidden">
        {/* 顶部操作栏 */}
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
            <InputGroup maxW={{ base: 'full', md: '260px' }}>
              <InputLeftElement pointerEvents="none" h="36px">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                h="36px"
                fontSize="13px"
                placeholder={t('filters.searchPlaceholder')}
                rounded="md"
                bg="white"
                borderColor="blackAlpha.200"
              />
            </InputGroup>

            <Text color="gray.500" fontSize="13px">
              {t('pagination.totalGrades', { value: total })}
            </Text>
          </Flex>

          <Button
            leftIcon={<AddIcon />}
            h="36px"
            px={8}
            alignSelf={{ base: 'flex-start', xl: 'center' }}
            rounded="md"
            color="white"
            fontSize="13px"
            fontWeight="600"
            bg="#2D2D2D"
            _hover={{ bg: '#1F1F1F' }}
            onClick={openCreateModal}
          >
            {t('actions.create')}
          </Button>
        </Flex>

        {/* 表格 */}
        <Box overflowX="auto">
          <Table
            variant="simple"
            sx={{ tableLayout: 'fixed', minWidth: '960px' }}
            borderRadius={'8px 8px 0 0'}
          >
            <Thead bg="#FAFAFA" h="44px">
              <Tr>
                <Th
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  // w="80px"
                >
                  {t('table.index')}
                </Th>
                <Th px={5} color="#333333" fontSize="14px" fontWeight="600" textTransform="none">
                  {t('table.name')}
                </Th>
                <Th
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  // w="120px"
                >
                  {t('table.classCount')}
                </Th>
                <Th
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  // w="120px"
                >
                  {t('table.studentCount')}
                </Th>
                <Th
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  // w="140px"
                >
                  {t('table.updatedTime')}
                </Th>
                <Th px={5} color="#333333" fontSize="14px" fontWeight="600" textTransform="none">
                  {t('table.remark')}
                </Th>
                <Th
                  px={5}
                  color="#333333"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  textAlign="center"
                  // w="180px"
                >
                  {t('table.actions')}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={7} py={16} borderColor="blackAlpha.50">
                    <Flex justify="center" align="center" gap={3}>
                      <Spinner size="md" color="gray.400" />
                      <Text fontSize="14px" color="gray.500">
                        {t('states.loading')}
                      </Text>
                    </Flex>
                  </Td>
                </Tr>
              ) : grades.length > 0 ? (
                grades.map((grade, index) => (
                  <Tr key={grade.id} _hover={{ bg: '#FCFCFC' }} borderBottom="1px solid #E5E5E5">
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {(safeCurrentPage - 1) * pageSize + index + 1}
                    </Td>
                    <Td
                      px={5}
                      py={3.5}
                      borderColor="blackAlpha.50"
                      fontSize="14px"
                      color="#4E5969"
                      fontWeight="500"
                    >
                      {grade.name}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {grade.clazzCount}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {grade.studentCount}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {grade.updateTime?.slice(0, 10)}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50" fontSize="14px" color="#4E5969">
                      {grade.description}
                    </Td>
                    <Td px={5} py={3.5} borderColor="blackAlpha.50">
                      <Flex justify="center" gap={2}>
                        <Button
                          size="14px"
                          h="28px"
                          // minW="54px"
                          px={8}
                          py={4}
                          variant="outline"
                          rounded="md"
                          fontSize="12px"
                          fontWeight="500"
                          borderColor="blackAlpha.300"
                          bg="white"
                          // leftIcon={<EditIcon boxSize={3.2} />}
                          onClick={() => openEditModal(grade)}
                        >
                          {t('actions.edit')}
                        </Button>
                        <Button
                          size="14px"
                          h="28px"
                          // minW="54px"
                          px={8}
                          py={4}
                          variant="outline"
                          rounded="md"
                          fontSize="12px"
                          fontWeight="500"
                          color="#C8000B"
                          borderColor="#F53F3F"
                          bg="white"
                          _hover={{ bg: '#FFF5F5' }}
                          // leftIcon={<DeleteIcon boxSize={3.2} />}
                          onClick={() => {
                            if ((grade.clazzCount || 0) > 0) {
                              toast({
                                title: t('delete.blockedTitle'),
                                description: t('delete.blockedDescription', {
                                  count: grade.clazzCount || 0
                                }),
                                status: 'warning',
                                duration: 2500,
                                isClosable: true
                              });
                            } else {
                              openDeleteModal(grade);
                            }
                          }}
                        >
                          {t('actions.delete')}
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
                        {t('empty.title')}
                      </Text>
                      <Text fontSize="12px">{t('empty.description')}</Text>
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
            {t('pagination.total', { value: total })}
          </Text>
          <Flex align="center" gap={2}>
            <IconButton
              aria-label={String(t('pagination.prev'))}
              icon={<ChevronLeftIcon boxSize={6} />}
              variant="outline"
              size="sm"
              rounded="md"
              borderColor="blackAlpha.200"
              isDisabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            />
            <Text minW="120px" textAlign="center" fontSize="14px" color="gray.600">
              {t('pagination.pageInfo', { page: safeCurrentPage, total: totalPages })}
            </Text>
            <IconButton
              aria-label={String(t('pagination.next'))}
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
      <Modal isOpen={editModal.isOpen} onClose={closeEditModal} isCentered>
        <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
        <ModalContent
          maxW="496px"
          w="496px"
          minH="400px"
          rounded="24px"
          overflow="hidden"
          bg="white"
          boxShadow="0 24px 80px rgba(15, 23, 42, 0.16)"
        >
          <ModalHeader fontSize="16px" fontWeight="600" padding="16px 32px" color={'#333333'}>
            {editingGrade ? t('modal.editTitle') : t('modal.createTitle')}
          </ModalHeader>
          <ModalCloseButton
            top="16px"
            color="gray.700"
            _hover={{ bg: 'transparent', color: 'gray.900' }}
          />
          <Box borderTopWidth="1px" borderColor="#ECECEC" />
          <form onSubmit={handleSave}>
            <ModalBody px={8} pt={6} pb={8}>
              <Flex direction="column" gap={6}>
                <FormControl isInvalid={formTouched.name && !!formErrors.name}>
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('form.name')}{' '}
                    <Text as="span" color="#E53E3E">
                      *
                    </Text>
                  </FormLabel>
                  <Input
                    value={formState.name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    onBlur={() => setFormTouched((prev) => ({ ...prev, name: true }))}
                    placeholder={t('form.namePlaceholder')}
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

                <FormControl>
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('form.remark')}
                  </FormLabel>
                  <Textarea
                    rows={4}
                    value={formState.description}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder={t('form.remarkPlaceholder')}
                    h="92px"
                    minH="92px"
                    px={4}
                    py={3.5}
                    borderRadius="8px"
                    borderColor="#E7E7E7"
                    bg="white"
                    fontSize="16px"
                    resize="none"
                    _placeholder={{ color: '#A0AEC0' }}
                  />
                </FormControl>
                <FormControl mt={4}>
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('form.sort')}
                  </FormLabel>
                  <Input
                    type="number"
                    min={0}
                    max={9999}
                    value={formState.sort}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        sort: parseInt(e.target.value) || 0
                      }))
                    }
                    placeholder={t('form.sortPlaceholder')}
                    h="46px"
                    px={4}
                    borderRadius="8px"
                    borderColor="#E7E7E7"
                    bg="white"
                    fontSize="16px"
                    _placeholder={{ color: '#A0AEC0' }}
                  />
                  <Text mt={1} fontSize="12px" color="gray.500">
                    {t('form.sortHint')}
                  </Text>
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
                {t('actions.cancel')}
              </Button>
              <Button
                type="submit"
                width="68px"
                h="36px"
                rounded="12px"
                bg="#3A3A3A"
                color="white"
                fontSize="16px"
                fontWeight="600"
                _hover={{ bg: '#262626' }}
                isDisabled={!formState.name.trim()}
              >
                {t('actions.save')}
              </Button>
            </ModalFooter>
          </form>
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
                {t('delete.title')}
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
              {t('delete.description', { name: deleteTarget?.name || '' })}
            </Text>
            <Text mt={4} fontSize="14px" lineHeight="1.75" color="#999999">
              {t('delete.notice')}
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
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              width="68px"
              h="36px"
              rounded="12px"
              bg="#333333"
              color="#FFFFFF"
              fontSize="14px"
              fontWeight="600"
              _hover={{ bg: '#1A1A1A' }}
            >
              {t('actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
