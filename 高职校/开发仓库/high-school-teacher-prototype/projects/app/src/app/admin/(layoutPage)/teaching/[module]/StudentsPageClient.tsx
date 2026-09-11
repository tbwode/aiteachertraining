'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Select,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Grid,
  GridItem,
  Spinner,
  Divider,
  ModalCloseButton
} from '@chakra-ui/react';
import {
  AddIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  SearchIcon,
  DeleteIcon,
  DownloadIcon,
  AttachmentIcon
} from '@chakra-ui/icons';
import type { StudentItem, StudentPageRequest } from '@/types/api/admin/teaching/students';
import {
  postStudentPageList,
  postStudentCreate,
  postStudentUpdate,
  postStudentDelete,
  getStudentDownloadTemplate,
  postStudentImport
} from '@/api/admin/teaching/students';
import { postClassList } from '@/api/admin/teaching/classes';
import type { ClassListItem } from '@/types/api/admin/teaching/classes';
import { postTenantMajorList } from '@/api/admin/teaching/majors';
import { postGradeList } from '@/api/admin/teaching/grades';
import type { TenantMajorSimpleVO } from '@/types/api/admin/teaching/majors';
import type { GradeListItem } from '@/types/api/admin/teaching/grades';
import DatePicker from '@/components/common/DatePicker';

const pageSize = 10;

// 状态映射 - 动态获取，使用函数以便访问 t
const getStatusMap = (
  t: (key: string) => string
): Record<number, { label: string; bg: string; color: string; dotColor: string }> => ({
  1: {
    label: t('teaching.students.status.active'),
    bg: '#DCFCE7',
    color: '#166534',
    dotColor: '#22C55E'
  },
  2: {
    label: t('teaching.students.status.graduated'),
    bg: '#F3F4F6',
    color: '#6B7280',
    dotColor: '#9CA3AF'
  },
  3: {
    label: t('teaching.students.status.suspended'),
    bg: '#FEF3C7',
    color: '#92400E',
    dotColor: '#F59E0B'
  }
});

// 性别映射 - 动态获取
const getGenderMap = (t: (key: string) => string): Record<number, string> => ({
  0: t('teaching.students.gender.secret'),
  1: t('teaching.students.gender.male'),
  2: t('teaching.students.gender.female')
});

// 状态选项 - 动态获取
const getStatusOptions = (t: (key: string) => string) => [
  { id: 1, name: t('teaching.students.status.active') },
  { id: 2, name: t('teaching.students.status.graduated') },
  { id: 3, name: t('teaching.students.status.suspended') }
];

export default function StudentsPageClient() {
  const { t, i18n } = useTranslation('admin');
  const toast = useToast();

  // 获取映射数据
  const statusMap = getStatusMap((key: string) => t(key));
  const genderMap = getGenderMap((key: string) => t(key));
  const statusOptions = getStatusOptions((key: string) => t(key));
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const importModal = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 列表数据
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 筛选条件
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<number | ''>('');

  // 编辑/新增弹窗状态
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    gender: 1 as 0 | 1 | 2,
    enrollmentDate: '',
    majorId: '',
    clazzId: '',
    status: 1 as 1 | 2 | 3,
    phone: '',
    idCard: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // 删除状态
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 专业和年级/班级列表
  const [majorList, setMajorList] = useState<TenantMajorSimpleVO[]>([]);
  const [gradeList, setGradeList] = useState<GradeListItem[]>([]);
  const [classList, setClassList] = useState<ClassListItem[]>([]);
  const [majorsLoading, setMajorsLoading] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);

  // 弹窗内班级列表（根据专业联动）
  const [modalClassList, setModalClassList] = useState<ClassListItem[]>([]);
  const [modalClassesLoading, setModalClassesLoading] = useState(false);

  // 批量导入相关状态
  const [importing, setImporting] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
  const [importUploadPercent, setImportUploadPercent] = useState(0);

  // 加载班级列表（根据专业筛选）
  const loadClassList = async (majorId?: number) => {
    setClassesLoading(true);
    try {
      const res = await postClassList(majorId ? { majorId } : {});
      if (Array.isArray(res)) {
        setClassList(res);
      }
    } catch (error) {
      console.error('加载班级列表失败:', error);
    } finally {
      setClassesLoading(false);
    }
  };

  // 加载专业列表
  const loadMajorList = async () => {
    setMajorsLoading(true);
    try {
      const res = await postTenantMajorList({});
      if (Array.isArray(res)) {
        setMajorList(res);
      }
    } catch (error) {
      toast({
        title: t('teaching.students.messages.loadMajorsError'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setMajorsLoading(false);
    }
  };

  // 加载年级/班级列表
  const loadGradeList = async () => {
    setGradesLoading(true);
    try {
      const res = await postGradeList({});
      if (Array.isArray(res)) {
        setGradeList(res);
      }
    } catch (error) {
      toast({
        title: t('teaching.students.messages.loadGradesError'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setGradesLoading(false);
    }
  };

  // 初始加载专业、年级和班级列表
  useEffect(() => {
    loadMajorList();
    loadGradeList();
    loadClassList(); // 加载所有班级
  }, []);

  // 测试：尝试修改 navigator.language 来影响日期选择器语言
  useEffect(() => {
    const currentLang = i18n.language;
    const targetLang = currentLang === 'zh-CN' ? 'zh-CN' : 'en-US';

    // 打印修改前的值
    console.log('Before - navigator.language:', navigator.language);
    console.log('Before - navigator.languages:', navigator.languages);

    try {
      // 强制修改 navigator.language
      Object.defineProperty(navigator, 'language', {
        get: function () {
          return targetLang;
        },
        configurable: true,
        enumerable: true
      });

      // 同时修改 languages 数组
      Object.defineProperty(navigator, 'languages', {
        get: function () {
          return [targetLang, targetLang.split('-')[0]];
        },
        configurable: true,
        enumerable: true
      });

      console.log('After - navigator.language:', navigator.language);
      console.log('After - navigator.languages:', navigator.languages);
      console.log('修改成功，请测试日期选择器是否跟随变化');
    } catch (e) {
      console.error('修改 navigator.language 失败:', e);
    }
  }, [i18n.language]);

  // 专业筛选变化时，重新加载班级列表并清空已选班级
  useEffect(() => {
    if (selectedMajor) {
      loadClassList(Number(selectedMajor));
    } else {
      loadClassList(); // 加载所有班级
    }
    setSelectedClass(''); // 清空已选班级
  }, [selectedMajor]);

  // 加载学生列表
  const loadStudentList = useCallback(async () => {
    setLoading(true);
    try {
      // 构建请求参数
      const params: StudentPageRequest = {
        current: currentPage,
        size: pageSize
      };

      // 搜索关键字
      if (searchKeyword) {
        params.searchKey = searchKeyword;
      }

      // 班级筛选
      if (selectedClass) {
        params.clazzId = Number(selectedClass);
      }

      // 专业筛选
      if (selectedMajor) {
        params.majorId = Number(selectedMajor);
      }

      // 状态筛选
      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const res = await postStudentPageList(params);
      // 直接使用 API 返回的数据
      setStudents(res.records || []);
      setTotalPages(res.pages || 1);
      setTotal(res.total || 0);
    } catch (error) {
      toast({
        title: t('teaching.students.messages.loadListError'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchKeyword, selectedClass, selectedMajor, selectedStatus, toast]);

  // 初始加载和筛选条件变化时重新加载
  useEffect(() => {
    loadStudentList();
  }, [loadStudentList]);

  // 表单验证
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = t('teaching.students.messages.codeRequired');
    }
    if (!formData.name.trim()) {
      errors.name = t('teaching.students.messages.nameRequired');
    }
    if (!formData.majorId) {
      errors.majorId = t('teaching.students.messages.majorRequired');
    }
    if (!formData.clazzId) {
      errors.clazzId = t('teaching.students.messages.classRequired');
    }
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      errors.phone = t('teaching.students.messages.phoneInvalid');
    }
    if (formData.idCard && !/^\d{17}[\dXx]$/.test(formData.idCard)) {
      errors.idCard = t('teaching.students.messages.idCardInvalid');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      gender: 1,
      enrollmentDate: '',
      majorId: '',
      clazzId: '',
      status: 1,
      phone: '',
      idCard: ''
    });
    setFormErrors({});
    setFormTouched({});
    setEditingStudent(null);
    setModalClassList([]); // 清空弹窗内班级列表
  };

  // 打开新增弹窗
  const handleAdd = () => {
    resetForm();
    setModalClassList([]); // 清空弹窗内班级列表
    editModal.onOpen();
  };

  // 打开编辑弹窗
  const handleEdit = (student: StudentItem) => {
    setEditingStudent(student);
    setFormData({
      code: student.code,
      name: student.name,
      gender: student.gender as 0 | 1 | 2,
      enrollmentDate: student.enrollmentDate || '',
      majorId: student.majorId?.toString() || '',
      clazzId: student.clazzId?.toString() || '',
      status: student.status as 1 | 2 | 3,
      phone: student.phone || '',
      idCard: student.idCard || ''
    });
    // 加载该学生所在专业的班级列表
    if (student.majorId) {
      loadModalClassList(student.majorId);
    }
    setFormErrors({});
    setFormTouched({});
    editModal.onOpen();
  };

  // 保存学生
  const handleSave = async () => {
    setFormTouched({
      code: true,
      name: true,
      majorId: true,
      clazzId: true,
      phone: !!formData.phone,
      idCard: !!formData.idCard
    });

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        gender: formData.gender,
        enrollmentDate: formData.enrollmentDate || undefined,
        majorId: Number(formData.majorId),
        clazzId: Number(formData.clazzId),
        status: formData.status,
        phone: formData.phone || undefined,
        idCard: formData.idCard || undefined
      };

      if (editingStudent) {
        await postStudentUpdate({ ...payload, id: Number(editingStudent.id) });
        toast({
          title: t('teaching.students.messages.updatedTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
      } else {
        await postStudentCreate(payload);
        toast({
          title: t('teaching.students.messages.createdTitle'),
          status: 'success',
          duration: 2500,
          isClosable: true
        });
      }

      editModal.onClose();
      resetForm();
      loadStudentList();
    } catch (error: any) {
      toast({
        title: editingStudent
          ? t('teaching.students.messages.updateError')
          : t('teaching.students.messages.createError'),
        description: error.msg,
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setSaving(false);
    }
  };

  // 加载弹窗内的班级列表（根据专业）
  const loadModalClassList = async (majorId?: number) => {
    setModalClassesLoading(true);
    try {
      const res = await postClassList(majorId ? { majorId } : {});
      if (Array.isArray(res)) {
        setModalClassList(res);
      }
    } catch (error) {
      console.error('加载班级列表失败:', error);
    } finally {
      setModalClassesLoading(false);
    }
  };

  // 处理表单字段变化
  const handleFieldChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // 如果修改了专业，清空班级选择
      if (field === 'majorId') {
        newData.clazzId = '';
        loadModalClassList(value ? Number(value) : undefined);
      }
      return newData;
    });
    setFormTouched((prev) => ({ ...prev, [field]: true }));
    // 清除对应字段的错误
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 打开删除确认弹窗
  const handleDeleteClick = (student: StudentItem) => {
    setDeletingStudent(student);
    deleteModal.onOpen();
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;

    setDeleting(true);
    try {
      await postStudentDelete({ id: Number(deletingStudent.id) });
      toast({
        title: t('teaching.students.messages.deletedTitle'),
        status: 'success',
        duration: 2500,
        isClosable: true
      });
      deleteModal.onClose();
      setDeletingStudent(null);
      loadStudentList();
    } catch (error: any) {
      toast({
        title: t('teaching.students.messages.deleteError'),
        description: error.msg || t('teaching.common.error.retry'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setDeleting(false);
    }
  };

  // 导入相关函数
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 验证文件类型
  const validateImportFile = (file: File): boolean => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return true;
    } else {
      toast({
        title: t('teaching.students.messages.importFormatError'),
        description: t('teaching.students.messages.importFormatDesc'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
      return false;
    }
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateImportFile(file)) {
      setSelectedImportFile(file);
      setImporting(false);
      setImportUploadPercent(0);
      // 不清除错误信息，让用户能看到之前的错误
    }
  };

  // 删除已选文件
  const handleDeleteImportFile = () => {
    if (importing) return;
    setSelectedImportFile(null);
    setImportErrorMsg(null);
    setImportUploadPercent(0);
    setImporting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 关闭导入弹窗时重置状态
  const handleCloseImportModal = () => {
    setSelectedImportFile(null);
    setImportErrorMsg(null);
    setImportUploadPercent(0);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    importModal.onClose();
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!selectedImportFile) {
      toast({
        title: t('teaching.students.messages.selectFileFirst'),
        status: 'warning',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    setImporting(true);
    setImportUploadPercent(0);

    try {
      const res = await postStudentImport(selectedImportFile);

      const errMsgs = res?.errMsgs;
      const hasErrors = errMsgs && errMsgs.length > 0;

      if (!hasErrors) {
        setImportUploadPercent(100);
        toast({
          title: res?.msg || t('teaching.students.messages.importSuccess'),
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        setSelectedImportFile(null);
        setImporting(false);
        handleCloseImportModal();
        loadStudentList();
      } else {
        const errorMessages = errMsgs?.join('\n') || t('teaching.students.messages.importFailed');
        setImportErrorMsg(errorMessages);
        setImporting(false);
        toast({
          title: t('teaching.students.messages.importFailedCheck'),
          status: 'error',
          duration: 2500,
          isClosable: true
        });
      }
    } catch (error: any) {
      const errMsg = error?.msg || error?.message || t('teaching.students.messages.importFailed');
      setImportErrorMsg(errMsg);
      setImporting(false);
      setImportUploadPercent(0);
      toast({
        title: t('teaching.students.messages.importFailed'),
        description: errMsg,
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };

  // 下载模板
  const handleDownloadTemplate = async () => {
    try {
      const blob = await getStudentDownloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = t('teaching.students.import.templateFilename');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t('teaching.students.messages.downloadTemplateSuccess'),
        status: 'success',
        duration: 2500,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: t('teaching.students.messages.downloadTemplateError'),
        description: error instanceof Error ? error.message : t('teaching.common.error.retry'),
        status: 'error',
        duration: 2500,
        isClosable: true
      });
    }
  };

  return (
    <Box className="students-page" borderRadius="16px" bgColor="#fff" padding="20px">
      <Box overflow="hidden">
        {/* 筛选栏 */}
        <Flex py={4} align="center" justify="space-between" gap={3} wrap="wrap">
          <Flex gap={3} flex={1} wrap="wrap">
            {/* 班级筛选 */}
            <Select
              placeholder={t('teaching.students.filters.allClasses')}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              w="140px"
              h="40px"
              fontSize="14px"
              borderColor="gray.200"
              borderRadius="8px"
              isDisabled={classesLoading}
            >
              {classList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </Select>

            {/* 专业筛选 */}
            <Select
              placeholder={t('teaching.students.filters.allMajors')}
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              w="140px"
              h="40px"
              fontSize="14px"
              borderColor="gray.200"
              borderRadius="8px"
              isDisabled={majorsLoading}
            >
              {majorList.map((major) => (
                <option key={major.id} value={major.id}>
                  {major.name}
                </option>
              ))}
            </Select>

            {/* 年级筛选 */}
            <Select
              placeholder={t('teaching.students.filters.allGrades')}
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              w="140px"
              h="40px"
              fontSize="14px"
              borderColor="gray.200"
              borderRadius="8px"
            >
              <option value="2023">2023{t('teaching.students.filters.gradeSuffix')}</option>
              <option value="2024">2024{t('teaching.students.filters.gradeSuffix')}</option>
            </Select>

            {/* 状态筛选 */}
            <Select
              placeholder={t('teaching.students.filters.allStatuses')}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value ? Number(e.target.value) : '')}
              w="140px"
              h="40px"
              fontSize="14px"
              borderColor="gray.200"
              borderRadius="8px"
            >
              {statusOptions.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>

            {/* 搜索框 */}
            <InputGroup w="240px">
              <Input
                placeholder={t('teaching.students.filters.searchPlaceholder')}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                h="40px"
                fontSize="14px"
                borderColor="gray.200"
                borderRadius="8px"
                _focus={{ borderColor: '#2D2D2D', boxShadow: 'none' }}
              />
              <InputRightElement h="40px">
                <SearchIcon color="gray.400" boxSize={4} />
              </InputRightElement>
            </InputGroup>

            {/* 批量导入按钮 */}
            <Button
              h="40px"
              px={4}
              variant="outline"
              borderColor="gray.300"
              borderRadius="8px"
              fontSize="14px"
              fontWeight="500"
              color="gray.700"
              onClick={importModal.onOpen}
            >
              {t('teaching.students.actions.batchImport')}
            </Button>
          </Flex>

          {/* 新增学生按钮 */}
          <Button
            leftIcon={<AddIcon />}
            h="40px"
            px={4}
            rounded="md"
            color="white"
            fontSize="14px"
            fontWeight="500"
            bg="#2D2D2D"
            _hover={{ bg: '#1F1F1F' }}
            onClick={handleAdd}
            isLoading={saving}
          >
            {t('teaching.students.actions.create')}
          </Button>
        </Flex>

        {/* 新增/编辑弹窗 */}
        <Modal
          isOpen={editModal.isOpen}
          onClose={() => {
            editModal.onClose();
            resetForm();
          }}
          size="2xl"
        >
          <ModalOverlay />
          <ModalContent rounded="24px" borderColor="#ECECEC">
            <ModalHeader
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              py={4}
              px={6}
              borderBottom="1px solid"
              borderColor="gray.100"
            >
              <Text fontSize="18px" fontWeight="600">
                {editingStudent
                  ? t('teaching.students.modal.editTitle')
                  : t('teaching.students.modal.createTitle')}
              </Text>
              <IconButton
                aria-label={t('teaching.common.close')}
                icon={<CloseIcon boxSize={3} />}
                size="sm"
                variant="ghost"
                onClick={() => {
                  editModal.onClose();
                  resetForm();
                }}
              />
            </ModalHeader>
            <ModalBody py={6} px={6}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {/* 学号 */}
                <GridItem>
                  <FormControl isInvalid={formTouched.code && !!formErrors.code}>
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.students.form.code')}{' '}
                      <Text as="span" color="#E53E3E">
                        *
                      </Text>
                    </FormLabel>
                    <Input
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="14px"
                      placeholder={t('teaching.students.form.codePlaceholder')}
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value)}
                      _placeholder={{ color: '#A0AEC0' }}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    />
                    <FormErrorMessage fontSize="12px">{formErrors.code}</FormErrorMessage>
                  </FormControl>
                </GridItem>

                {/* 姓名 */}
                <GridItem>
                  <FormControl isInvalid={formTouched.name && !!formErrors.name}>
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.students.form.name')}{' '}
                      <Text as="span" color="#E53E3E">
                        *
                      </Text>
                    </FormLabel>
                    <Input
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="14px"
                      placeholder={t('teaching.students.form.namePlaceholder')}
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      _placeholder={{ color: '#A0AEC0' }}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    />
                    <FormErrorMessage fontSize="12px">{formErrors.name}</FormErrorMessage>
                  </FormControl>
                </GridItem>

                {/* 性别 */}
                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.students.form.gender')}{' '}
                      <Text as="span" color="gray.400" fontSize="12px">
                        ({t('teaching.common.optional')})
                      </Text>
                    </FormLabel>
                    <Select
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="14px"
                      value={formData.gender}
                      onChange={(e) => handleFieldChange('gender', Number(e.target.value))}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    >
                      {Object.keys(genderMap).map((key) => (
                        <option key={key} value={Number(key)}>
                          {genderMap[Number(key)]}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>

                {/* 入学时间 */}
                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.students.form.enrollmentDate')}{' '}
                      <Text as="span" color="gray.400" fontSize="12px">
                        ({t('teaching.common.optional')})
                      </Text>
                    </FormLabel>
                    <DatePicker
                      value={formData.enrollmentDate}
                      onChange={(value) => handleFieldChange('enrollmentDate', value)}
                      placeholder={t('teaching.students.form.enrollmentDatePlaceholder')}
                      h="46px"
                      borderRadius="8px"
                    />
                  </FormControl>
                </GridItem>

                {/* 专业 */}
                <GridItem>
                  <FormControl isInvalid={formTouched.majorId && !!formErrors.majorId}>
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.students.form.major')}{' '}
                      <Text as="span" color="#E53E3E">
                        *
                      </Text>
                    </FormLabel>
                    <Select
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="14px"
                      placeholder={t('teaching.students.form.majorPlaceholder')}
                      value={formData.majorId}
                      onChange={(e) => handleFieldChange('majorId', e.target.value)}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    >
                      {majorList.map((major) => (
                        <option key={major.id} value={major.id}>
                          {major.name}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage fontSize="12px">{formErrors.majorId}</FormErrorMessage>
                  </FormControl>
                </GridItem>

                {/* 班级 */}
                <GridItem>
                  <FormControl isInvalid={formTouched.clazzId && !!formErrors.clazzId}>
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.students.form.className')}{' '}
                      <Text as="span" color="#E53E3E">
                        *
                      </Text>
                    </FormLabel>
                    <Select
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="14px"
                      placeholder={
                        formData.majorId
                          ? t('teaching.students.form.classPlaceholder')
                          : t('teaching.students.form.selectMajorFirst')
                      }
                      value={formData.clazzId}
                      onChange={(e) => handleFieldChange('clazzId', e.target.value)}
                      isDisabled={!formData.majorId || modalClassesLoading}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    >
                      {modalClassList.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage fontSize="12px">{formErrors.clazzId}</FormErrorMessage>
                  </FormControl>
                </GridItem>

                {/* 状态 */}
                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.students.form.status')}{' '}
                      <Text as="span" color="#E53E3E">
                        *
                      </Text>
                    </FormLabel>
                    <Select
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="14px"
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', Number(e.target.value))}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    >
                      <option value={1}>{t('teaching.students.status.active')}</option>
                      <option value={2}>{t('teaching.students.status.graduated')}</option>
                      <option value={3}>{t('teaching.students.status.suspended')}</option>
                    </Select>
                  </FormControl>
                </GridItem>

                {/* 手机号 */}
                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.students.form.phone')}
                    </FormLabel>
                    <Input
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="14px"
                      placeholder={t('teaching.students.form.phonePlaceholder')}
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      _placeholder={{ color: '#A0AEC0' }}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    />
                  </FormControl>
                </GridItem>

                {/* 身份证号 */}
                <GridItem colSpan={2}>
                  <FormControl>
                    <FormLabel fontSize="14px" fontWeight="500" mb={1.5}>
                      {t('teaching.students.form.idCard')}
                    </FormLabel>
                    <Input
                      h="46px"
                      borderRadius="8px"
                      borderColor="#E7E7E7"
                      bg="white"
                      fontSize="14px"
                      placeholder={t('teaching.students.form.idCardPlaceholder')}
                      value={formData.idCard}
                      onChange={(e) => handleFieldChange('idCard', e.target.value)}
                      _placeholder={{ color: '#A0AEC0' }}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                    />
                  </FormControl>
                </GridItem>
              </Grid>
            </ModalBody>
            <ModalFooter py={4} px={6} borderTop="1px solid" borderColor="gray.100" gap={3}>
              <Button
                h="40px"
                px={6}
                variant="outline"
                borderColor="gray.300"
                borderRadius="8px"
                fontSize="14px"
                fontWeight="500"
                onClick={() => {
                  editModal.onClose();
                  resetForm();
                }}
              >
                {t('teaching.students.actions.cancel')}
              </Button>
              <Button
                h="40px"
                px={6}
                bg="#2D2D2D"
                color="white"
                borderRadius="8px"
                fontSize="14px"
                fontWeight="500"
                _hover={{ bg: '#1F1F1F' }}
                onClick={handleSave}
                isLoading={saving}
                isDisabled={
                  !formData.code.trim() ||
                  !formData.name.trim() ||
                  !formData.majorId ||
                  !formData.clazzId
                }
              >
                {t('teaching.students.actions.save')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 批量导入弹窗 - ImportPanel 风格 */}
        <Modal
          isOpen={importModal.isOpen}
          onClose={handleCloseImportModal}
          // size="xl"
          isCentered
        >
          <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
          <ModalContent maxW="600px" rounded="16px">
            <ModalHeader fontSize="16px" fontWeight="600" borderBottom="1px solid #E7E7E7" py={4}>
              {t('teaching.students.modal.importTitle')}
            </ModalHeader>
            <ModalCloseButton top={4} right={4} />
            <ModalBody py={6} px={8}>
              {/* 隐藏的文件输入 */}
              <input
                id="studentFileInput"
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
              />

              {/* 步骤1：下载模板 */}
              <Flex align="center" mb={4} bg="#F9F9F9" p={4} borderRadius="8px" gap={3}>
                <Flex
                  bg="#3366ff"
                  color="#fff"
                  borderRadius="full"
                  w="32px"
                  h="32px"
                  flexShrink={0}
                  align="center"
                  justify="center"
                  fontSize="14px"
                  fontWeight="600"
                >
                  1
                </Flex>
                <Text flex={1} fontSize="14px" color="#333" wordBreak="break-word">
                  {t('teaching.students.import.step1')}
                </Text>
                <Button
                  colorScheme="primary.5"
                  onClick={handleDownloadTemplate}
                  borderRadius="2px"
                  minW="120px"
                  h="32px"
                  fontSize="14px"
                  flexShrink={0}
                  leftIcon={<DownloadIcon boxSize={4} />}
                >
                  {t('teaching.students.actions.downloadTemplate')}
                </Button>
              </Flex>

              {/* 步骤2：选择文件 */}
              <Flex align="center" mb={4} bg="#F9F9F9" p={4} borderRadius="8px" gap={3}>
                <Flex
                  bg="#3366ff"
                  color="#fff"
                  borderRadius="full"
                  w="32px"
                  h="32px"
                  flexShrink={0}
                  align="center"
                  justify="center"
                  fontSize="14px"
                  fontWeight="600"
                >
                  2
                </Flex>
                <Text flex={1} fontSize="14px" color="#333" wordBreak="break-word">
                  {t('teaching.students.import.step2')}
                </Text>
                <Button
                  colorScheme="primary.5"
                  onClick={triggerFileSelect}
                  borderRadius="2px"
                  minW="120px"
                  h="32px"
                  fontSize="14px"
                  flexShrink={0}
                  isDisabled={importing}
                >
                  {t('teaching.students.actions.selectFile')}
                </Button>
              </Flex>

              {/* 已选文件显示 */}
              {selectedImportFile && (
                <Box
                  display="flex"
                  border="1px solid #E5E7EB"
                  borderRadius="8px"
                  p={3}
                  position="relative"
                  mb={4}
                >
                  <AttachmentIcon boxSize={10} mr={3} color="green.500" />
                  <Box flex="1">
                    <Flex align="center" mb={1}>
                      <Text flex={1} fontSize="14px" fontWeight="500" color="#333">
                        {selectedImportFile.name}
                      </Text>
                    </Flex>
                    <Text fontSize="12px" color="gray.500">
                      {t('teaching.students.import.fileSize', {
                        size: (selectedImportFile.size / 1024).toFixed(2)
                      })}
                    </Text>
                  </Box>
                  {!importing && (
                    <IconButton
                      aria-label={t('teaching.students.import.deleteFile')}
                      icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      color="#3366ff"
                      position="absolute"
                      right={2}
                      top={2}
                      onClick={handleDeleteImportFile}
                    />
                  )}
                </Box>
              )}

              {/* 错误信息显示 */}
              {importErrorMsg && (
                <Box
                  mt={4}
                  color="red.500"
                  maxH="200px"
                  overflowY="auto"
                  bg="red.50"
                  p={3}
                  borderRadius="8px"
                >
                  {importErrorMsg.split('\n').map((errMsg, index) => (
                    <Text key={index} fontSize="13px" mb={1}>
                      {index + 1}. {errMsg}
                    </Text>
                  ))}
                </Box>
              )}

              {/* 底部提示和按钮 */}
              <Flex align="center" mt={6}>
                <Text flex={1} color="orange.500" fontSize="14px">
                  {t('teaching.students.import.warning')}
                </Text>
                <Button variant="outline" onClick={handleCloseImportModal} mr={2} h="36px" px={4}>
                  {t('teaching.students.actions.cancel')}
                </Button>
                <Button
                  colorScheme="primary.5"
                  onClick={handleConfirmImport}
                  isDisabled={!selectedImportFile || importing}
                  isLoading={importing}
                  loadingText={t('teaching.students.import.importing')}
                  h="36px"
                  px={4}
                >
                  {t('teaching.students.actions.confirmImport')}
                </Button>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
        {/* 删除确认弹窗 */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => {
            deleteModal.onClose();
            setDeletingStudent(null);
          }}
          size="xl"
        >
          <ModalOverlay />
          <ModalContent rounded="24px" borderColor="#ECECEC">
            <ModalHeader
              display="flex"
              alignItems="center"
              gap={2}
              py={4}
              px={6}
              borderBottom="1px solid"
              borderColor="gray.100"
            >
              <Text fontSize="18px" fontWeight="600">
                {t('teaching.students.delete.title', { name: deletingStudent?.name })}
              </Text>
              <IconButton
                aria-label={t('teaching.common.close')}
                icon={<CloseIcon boxSize={3} />}
                size="sm"
                variant="ghost"
                ml="auto"
                onClick={() => {
                  deleteModal.onClose();
                  setDeletingStudent(null);
                }}
              />
            </ModalHeader>
            <ModalBody py={6} px={6}>
              <Flex direction="column" gap={2}>
                <Flex fontSize="14px" color="gray.700">
                  <Text>{t('teaching.students.table.code')}：</Text>
                  <Text>{deletingStudent?.code}</Text>
                </Flex>
                <Flex fontSize="14px" color="gray.700">
                  <Text>{t('teaching.students.table.className')}：</Text>
                  <Text>{deletingStudent?.majorName}</Text>
                  <Text>{deletingStudent?.clazzName}</Text>
                </Flex>
                <Text fontSize="14px" mt={2}>
                  {t('teaching.students.delete.warning')}
                </Text>
              </Flex>
            </ModalBody>
            <ModalFooter py={4} px={6} borderTop="1px solid" borderColor="gray.100" gap={3}>
              <Button
                h="40px"
                px={6}
                variant="outline"
                borderColor="gray.300"
                borderRadius="8px"
                fontSize="14px"
                fontWeight="500"
                onClick={() => {
                  deleteModal.onClose();
                  setDeletingStudent(null);
                }}
              >
                {t('teaching.students.actions.cancel')}
              </Button>
              <Button
                h="40px"
                px={6}
                bg="#333333"
                color="#FFFFFF"
                borderRadius="8px"
                fontSize="14px"
                fontWeight="500"
                _hover={{ bg: '#444444' }}
                onClick={handleConfirmDelete}
                isLoading={deleting}
              >
                {t('teaching.students.actions.confirmDelete')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 表格 */}
        <Box overflowX="auto">
          <Table variant="simple" sx={{ tableLayout: 'fixed', minWidth: '1000px' }}>
            <Thead bg="#FAFAFA">
              <Tr>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="120px"
                >
                  {t('teaching.students.table.code')}
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="100px"
                >
                  {t('teaching.students.table.name')}
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="80px"
                >
                  {t('teaching.students.table.gender')}
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="140px"
                >
                  {t('teaching.students.table.className')}
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="160px"
                >
                  {t('teaching.students.table.major')}
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="100px"
                >
                  {t('teaching.students.table.status')}
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  w="140px"
                >
                  {t('teaching.students.table.phone')}
                </Th>
                <Th
                  h="44px"
                  px={4}
                  color="gray.600"
                  fontSize="14px"
                  fontWeight="600"
                  textTransform="none"
                  textAlign="center"
                  w="180px"
                >
                  {t('teaching.students.table.actions')}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={8} py={16} borderColor="blackAlpha.50">
                    <Flex direction="column" align="center" gap={2} color="gray.500">
                      <Spinner size="md" />
                      <Text fontSize="14px" fontWeight="600">
                        {t('teaching.students.loading')}
                      </Text>
                    </Flex>
                  </Td>
                </Tr>
              ) : students.length > 0 ? (
                students.map((student) => {
                  const statusStyle = statusMap[student.status] || statusMap[1];
                  return (
                    <Tr
                      key={student.id}
                      _hover={{ bg: '#FCFCFC' }}
                      borderBottom="1px solid #E5E6EB"
                    >
                      <Td
                        px={4}
                        py={3.5}
                        borderColor="blackAlpha.50"
                        fontSize="14px"
                        color="gray.700"
                      >
                        {student.code}
                      </Td>
                      <Td
                        px={4}
                        py={3.5}
                        borderColor="blackAlpha.50"
                        fontSize="14px"
                        color="gray.700"
                      >
                        {student.name}
                      </Td>
                      <Td
                        px={4}
                        py={3.5}
                        borderColor="blackAlpha.50"
                        fontSize="14px"
                        color="gray.700"
                      >
                        {genderMap[student.gender] || t('teaching.common.dash')}
                      </Td>
                      <Td
                        px={4}
                        py={3.5}
                        borderColor="blackAlpha.50"
                        fontSize="14px"
                        color="gray.700"
                      >
                        {student.clazzName}
                      </Td>
                      <Td
                        px={4}
                        py={3.5}
                        borderColor="blackAlpha.50"
                        fontSize="14px"
                        color="gray.700"
                      >
                        {student.majorName}
                      </Td>
                      <Td px={4} py={3.5} borderColor="blackAlpha.50" fontSize="14px">
                        <Badge
                          bg={statusStyle.bg}
                          color={statusStyle.color}
                          px={2}
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
                            bg={statusStyle.dotColor}
                            borderRadius="full"
                            mr={1}
                          />
                          {statusStyle.label}
                        </Badge>
                      </Td>
                      <Td
                        px={4}
                        py={3.5}
                        borderColor="blackAlpha.50"
                        fontSize="14px"
                        color="gray.700"
                      >
                        {student.phone}
                      </Td>
                      <Td px={4} py={3.5} borderColor="blackAlpha.50">
                        <Flex justify="center" gap={2}>
                          <Button
                            size="sm"
                            h="32px"
                            minW="60px"
                            px={3}
                            variant="outline"
                            rounded="md"
                            fontSize="14px"
                            fontWeight="500"
                            borderColor="blackAlpha.300"
                            bg="white"
                            onClick={() => handleEdit(student)}
                          >
                            {t('teaching.students.actions.edit')}
                          </Button>
                          <Button
                            size="sm"
                            h="32px"
                            minW="60px"
                            px={3}
                            variant="outline"
                            rounded="md"
                            fontSize="14px"
                            fontWeight="500"
                            color="#F04438"
                            borderColor="#F5B4AE"
                            bg="white"
                            _hover={{ bg: '#FFF5F5' }}
                            onClick={() => handleDeleteClick(student)}
                          >
                            {t('teaching.students.actions.delete')}
                          </Button>
                        </Flex>
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={8} py={16} borderColor="blackAlpha.50">
                    <Flex direction="column" align="center" gap={2} color="gray.500">
                      <Text fontSize="14px" fontWeight="600">
                        {t('teaching.students.empty.title')}
                      </Text>
                      <Text fontSize="12px">{t('teaching.students.empty.description')}</Text>
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
            {t('teaching.students.pagination.total', { total })}
          </Text>
          <Flex align="center" gap={2}>
            <IconButton
              aria-label={t('teaching.students.pagination.prev')}
              icon={<ChevronLeftIcon boxSize={6} />}
              variant="outline"
              size="sm"
              rounded="md"
              borderColor="blackAlpha.200"
              isDisabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            />
            <Text minW="120px" textAlign="center" fontSize="12px" color="gray.600">
              {t('teaching.students.pagination.pageInfo', { page: currentPage, totalPages })}
            </Text>
            <IconButton
              aria-label={t('teaching.students.pagination.next')}
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
      </Box>
    </Box>
  );
}
