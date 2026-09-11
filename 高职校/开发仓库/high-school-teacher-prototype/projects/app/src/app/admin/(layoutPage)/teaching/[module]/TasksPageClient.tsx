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
  SimpleGrid,
  Text,
  Tooltip,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import MultipleSelect from '@fastgpt/web/components/common/MySelect/MultipleSelect';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import { postClassList } from '@/api/admin/teaching/classes';
import { postTenantCourseList } from '@/api/admin/teaching/courses';
import { postSemesterList } from '@/api/admin/teaching/semesters';
import {
  postTeachingTaskAdd,
  postTeachingTaskDelete,
  postTeachingTaskDetail,
  postTeachingTaskPage,
  postTeachingTaskUpdate,
  postTeachingTaskUpdateStatus
} from '@/api/admin/teaching/tasks';
import { postTeacherList } from '@/api/admin/teaching/teachers';
import type { ClassListItem } from '@/types/api/admin/teaching/classes';
import type { TenantCourseVO } from '@/types/api/admin/teaching/courses';
import type { SemesterListItem } from '@/types/api/admin/teaching/semesters';
import type {
  TeachingTaskDetailResponse,
  TeachingTaskQueryRequest,
  TeachingTaskVO
} from '@/types/api/admin/teaching/tasks';
import type { TeacherListItem } from '@/types/api/admin/teaching/teachers';
import AppSelect from '@/app/components/ui/Select';
import TableAdmin, { type TableAdminColumn } from '@/components/TableAdmin';

type TaskStatus = 'not_started' | 'in_progress' | 'completed';
type CourseType = 'required' | 'elective';

type TeachingTaskItem = {
  id: number;
  code: string;
  name: string;
  teacher: string;
  teacherId?: number;
  course: string;
  tenantCourseId?: number;
  courseType: CourseType;
  typeTone: 'blue' | 'orange';
  className: string;
  classIds?: number[];
  semester: string;
  semesterId?: number;
  status: TaskStatus;
};

type TaskFormState = {
  name: string;
  teacher: string;
  teacherId?: number;
  course: string;
  tenantCourseId?: number;
  className: string;
  classIds?: number[];
  semester: string;
  semesterId?: number;
  courseType?: CourseType;
  status: TaskStatus;
  code: string;
};

type StatusBadgeStyle = {
  bg: string;
  color: string;
  dotColor: string;
};

type SelectOptionItem = {
  id: string;
  label: string;
};

const pageSize = 10;
const defaultFormState: TaskFormState = {
  name: '',
  teacher: '',
  course: '',
  className: '',
  semester: '',
  status: 'not_started',
  code: ''
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

const parseOptionalId = (value: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

function mapApiStatusToUIStatus(status?: 0 | 1 | 2): TaskStatus {
  if (status === 1) return 'in_progress';
  if (status === 2) return 'completed';
  return 'not_started';
}

function mapUIStatusToApiStatus(status: TaskStatus): 0 | 1 | 2 {
  if (status === 'in_progress') return 1;
  if (status === 'completed') return 2;
  return 0;
}

function mapApiCourseTypeToUIType(courseType?: 1 | 2): CourseType {
  return courseType === 2 ? 'elective' : 'required';
}

function getTaskTypeTone(courseName: string, courseType: CourseType): TeachingTaskItem['typeTone'] {
  if (courseType === 'required') {
    return 'blue';
  }

  return ['人工智能', '物联网'].includes(courseName) ? 'orange' : 'blue';
}

function mapTaskVOToItem(task: TeachingTaskVO): TeachingTaskItem | null {
  if (!task.id) {
    return null;
  }

  const courseType = mapApiCourseTypeToUIType(task.courseType);
  const courseName = task.courseName || '';

  return {
    id: task.id,
    code: task.taskCode || '--',
    name: task.name || '--',
    teacher: task.teacherName || '--',
    teacherId: task.teacherId,
    course: courseName || '--',
    tenantCourseId: task.tenantCourseId,
    courseType,
    typeTone: getTaskTypeTone(courseName, courseType),
    className: task.classNames?.join('、') || '',
    classIds: task.classIds,
    semester: task.semesterName || '--',
    semesterId: task.semesterId,
    status: mapApiStatusToUIStatus(task.status)
  };
}

export default function TasksPageClient() {
  const isI18nReady = useAdminPageI18n(['teaching']);
  const { t } = useTranslation('admin');
  const toast = useToast();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();

  const [tasks, setTasks] = useState<TeachingTaskItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [semesters, setSemesters] = useState<SemesterListItem[]>([]);
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [courses, setCourses] = useState<TenantCourseVO[]>([]);
  const [semesterFilter, setSemesterFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<TeachingTaskItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeachingTaskItem | null>(null);
  const [formState, setFormState] = useState<TaskFormState>(defaultFormState);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentFormCode = editingTask?.code || '--';
  const selectedCourseValue =
    formState.tenantCourseId !== undefined ? String(formState.tenantCourseId) : '';
  const selectedTeacherValue = formState.teacherId !== undefined ? String(formState.teacherId) : '';
  const selectedClassValue =
    formState.classIds?.[0] !== undefined ? String(formState.classIds[0]) : '';
  const selectedSemesterValue =
    formState.semesterId !== undefined ? String(formState.semesterId) : '';

  const selectedCourseType = useMemo(() => formState.courseType || '', [formState.courseType]);
  const teacherSelectOptions = useMemo<SelectOptionItem[]>(() => {
    const baseOptions = teachers.map((item) => ({
      id: item.id,
      label: item.name || '--'
    }));

    if (
      selectedTeacherValue &&
      !baseOptions.some((item) => item.id === selectedTeacherValue) &&
      formState.teacher
    ) {
      return [{ id: selectedTeacherValue, label: formState.teacher }, ...baseOptions];
    }

    return baseOptions;
  }, [formState.teacher, selectedTeacherValue, teachers]);

  const semesterSelectOptions = useMemo<SelectOptionItem[]>(() => {
    const baseOptions = semesters.map((item) => ({
      id: item.id,
      label: item.name || '--'
    }));

    if (
      selectedSemesterValue &&
      !baseOptions.some((item) => item.id === selectedSemesterValue) &&
      formState.semester
    ) {
      return [{ id: selectedSemesterValue, label: formState.semester }, ...baseOptions];
    }

    return baseOptions;
  }, [formState.semester, selectedSemesterValue, semesters]);

  const classSelectOptions = useMemo<SelectOptionItem[]>(() => {
    const baseOptions = classes.map((item) => ({
      id: item.id,
      label: item.name || '--'
    }));

    if (
      selectedClassValue &&
      !baseOptions.some((item) => item.id === selectedClassValue) &&
      formState.className
    ) {
      return [{ id: selectedClassValue, label: formState.className }, ...baseOptions];
    }

    return baseOptions;
  }, [classes, formState.className, selectedClassValue]);

  const courseSelectOptions = useMemo<SelectOptionItem[]>(() => {
    const baseOptions = courses
      .filter((item) => item.id !== undefined)
      .map((item) => ({
        id: String(item.id),
        label: item.name || '--'
      }));

    if (
      selectedCourseValue &&
      !baseOptions.some((item) => item.id === selectedCourseValue) &&
      formState.course
    ) {
      return [{ id: selectedCourseValue, label: formState.course }, ...baseOptions];
    }

    return baseOptions;
  }, [courses, formState.course, selectedCourseValue]);

  const getStatusText = useCallback(
    (status: TaskStatus) => {
      if (status === 'in_progress') {
        return t('teaching.tasks.status.inProgress');
      }

      if (status === 'completed') {
        return t('teaching.tasks.status.completed');
      }

      return t('teaching.tasks.status.notStarted');
    },
    [t]
  );

  const getStatusStyle = useCallback((status: TaskStatus): StatusBadgeStyle => {
    if (status === 'in_progress') {
      return {
        bg: '#F3E8FF',
        color: '#7C3AED',
        dotColor: '#7C3AED'
      };
    }

    if (status === 'completed') {
      return {
        bg: '#EAFBEA',
        color: '#22C55E',
        dotColor: '#22C55E'
      };
    }

    return {
      bg: '#F1F5F9',
      color: '#64748B',
      dotColor: '#64748B'
    };
  }, []);

  const fillFormState = useCallback((task?: Partial<TeachingTaskDetailResponse> | null) => {
    setFormState({
      name: task?.name ?? '',
      teacher: task?.teacherName ?? '',
      teacherId: task?.teacherId,
      course: task?.courseName ?? '',
      tenantCourseId: task?.tenantCourseId,
      className: task?.classNames?.join('、') ?? '',
      classIds: task?.classIds,
      semester: task?.semesterName ?? '',
      semesterId: task?.semesterId,
      courseType: task?.courseType ? mapApiCourseTypeToUIType(task.courseType) : undefined,
      status: mapApiStatusToUIStatus(task?.status),
      code: task?.taskCode ?? ''
    });
  }, []);

  const fillFormStateFromItem = useCallback((task: TeachingTaskItem) => {
    setFormState({
      name: task.name,
      teacher: task.teacher,
      teacherId: task.teacherId,
      course: task.course,
      tenantCourseId: task.tenantCourseId,
      className: task.className,
      classIds: task.classIds,
      semester: task.semester,
      semesterId: task.semesterId,
      courseType: task.courseType,
      status: task.status,
      code: task.code === '--' ? '' : task.code
    });
  }, []);

  const buildPageRequest = useCallback(
    (page: number): TeachingTaskQueryRequest => ({
      current: page,
      size: pageSize,
      searchKey: searchText.trim() || undefined,
      courseType: typeFilter ? (typeFilter === 'elective' ? 2 : 1) : undefined,
      semesterId: parseOptionalId(semesterFilter),
      teacherId: parseOptionalId(teacherFilter),
      tenantCourseId: parseOptionalId(courseFilter)
    }),
    [courseFilter, searchText, semesterFilter, teacherFilter, typeFilter]
  );

  const fetchTasks = useCallback(
    async (page: number = currentPage) => {
      setIsListLoading(true);

      try {
        const response = await postTeachingTaskPage(buildPageRequest(page));
        const list = (response.records || [])
          .map(mapTaskVOToItem)
          .filter((item): item is TeachingTaskItem => item !== null);

        setTasks(list);
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

  const fetchOptions = useCallback(async () => {
    setIsOptionsLoading(true);

    try {
      // 并行加载教师、学期、班级下拉数据，保证筛选和表单选项一致。
      const [teacherList, semesterList, classList, courseList] = await Promise.all([
        postTeacherList({ type: 1 }),
        postSemesterList(),
        postClassList({}),
        postTenantCourseList()
      ]);

      setTeachers(teacherList || []);
      setSemesters(semesterList || []);
      setClasses(classList || []);
      setCourses(courseList || []);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setIsOptionsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isI18nReady) {
      return;
    }

    void fetchTasks(currentPage);
  }, [currentPage, fetchTasks, isI18nReady]);

  useEffect(() => {
    if (!isI18nReady) {
      return;
    }

    void fetchOptions();
  }, [fetchOptions, isI18nReady]);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormState(defaultFormState);
    editModal.onOpen();
  };

  const openEditModal = async (task: TeachingTaskItem) => {
    setEditingTask(task);
    fillFormStateFromItem(task);
    editModal.onOpen();
    setIsDetailLoading(true);

    try {
      const detail = await postTeachingTaskDetail({ id: task.id });
      fillFormState(detail);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openDeleteModal = (task: TeachingTaskItem) => {
    setDeleteTarget(task);
    deleteModal.onOpen();
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setFormState(defaultFormState);
    setIsDetailLoading(false);
    editModal.onClose();
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    deleteModal.onClose();
  };

  const handleSave = async () => {
    if (isSubmitting) {
      return;
    }

    const name = formState.name.trim();
    const teacherId = formState.teacherId;
    const tenantCourseId = formState.tenantCourseId;
    const semesterId = formState.semesterId;
    const courseType: 1 | 2 | undefined =
      formState.courseType === 'elective' ? 2 : formState.courseType === 'required' ? 1 : undefined;
    const classIds = (formState.classIds || []).filter((id) => Number.isFinite(id));

    // 新增/编辑都复用一套前端校验，减少无效请求。
    if (!name) {
      toast({
        title: '任务名称不能为空',
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    if (!teacherId) {
      toast({
        title: '请选择教师',
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    if (!tenantCourseId) {
      toast({
        title: '请选择课程',
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    if (!semesterId) {
      toast({
        title: '请选择学期',
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    if (!courseType) {
      toast({
        title: '课程类型无效，请重新选择课程',
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    if (courseType === 1 && classIds.length === 0) {
      toast({
        title: '必修课请至少选择一个班级',
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    // 格式校验：RW-{年份}-{4位序号}
    if (formState.code && !/^RW-\d{4}-\d{4}$/.test(formState.code)) {
      toast({
        title: t('teaching.tasks.messages.codeFormatError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    // 唯一性校验 (前端初步校验)
    const isDuplicate = tasks.some((t) => t.code === formState.code && t.id !== editingTask?.id);
    if (isDuplicate) {
      toast({
        title: t('teaching.tasks.messages.codeDuplicateError'),
        status: 'warning',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name,
        teacherId,
        tenantCourseId,
        semesterId,
        courseType,
        classIds: courseType === 1 ? classIds : [],
        taskCode: formState.code || undefined,
        status: mapUIStatusToApiStatus(formState.status)
      };

      if (editingTask?.id) {
        await postTeachingTaskUpdate({
          id: editingTask.id,
          ...payload
        });

        toast({
          title: '教学任务已更新',
          status: 'success',
          position: 'top',
          duration: 2500,
          isClosable: true
        });
      } else {
        await postTeachingTaskAdd(payload);

        toast({
          title: '教学任务创建成功',
          status: 'success',
          position: 'top',
          duration: 2500,
          isClosable: true
        });
      }

      closeEditModal();

      const targetPage = editingTask ? safeCurrentPage : 1;
      if (!editingTask && safeCurrentPage !== 1) {
        setCurrentPage(1);
      }
      await fetchTasks(targetPage);
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
      await postTeachingTaskDelete({ id: deleteTarget.id });

      toast({
        title: t('teaching.tasks.messages.deletedTitle'),
        status: 'success',
        position: 'top',
        duration: 2500,
        isClosable: true
      });

      closeDeleteModal();

      const nextPage =
        safeCurrentPage > 1 && tasks.length === 1 ? safeCurrentPage - 1 : safeCurrentPage;
      if (nextPage !== safeCurrentPage) {
        setCurrentPage(nextPage);
      } else {
        await fetchTasks(nextPage);
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

  const updateTaskStatus = async (taskId: number, status: TaskStatus) => {
    setUpdatingStatusId(taskId);

    try {
      await postTeachingTaskUpdateStatus({
        id: taskId,
        status: mapUIStatusToApiStatus(status)
      });

      toast({
        title:
          status === 'in_progress'
            ? t('teaching.tasks.messages.startedTitle')
            : t('teaching.tasks.messages.completedTitle'),
        status: 'success',
        position: 'top',
        duration: 2500,
        isClosable: true
      });

      await fetchTasks(safeCurrentPage);
    } catch (error) {
      toast({
        title: getErrorMessage(error),
        status: 'error',
        position: 'top',
        duration: 2500,
        isClosable: true
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleStart = async (taskId: number) => {
    await updateTaskStatus(taskId, 'in_progress');
  };

  const handleComplete = async (taskId: number) => {
    await updateTaskStatus(taskId, 'completed');
  };

  // 统一维护表格列配置，便于复用 TableAdmin（API 设计参考 antd Table）。
  const tableColumns = useMemo<TableAdminColumn<TeachingTaskItem>[]>(
    () => [
      {
        key: 'code',
        title: t('teaching.tasks.table.code'),
        dataIndex: 'code',
        render: (value) => (
          <Text fontSize="12px" color="#64748B">
            {String(value ?? '--')}
          </Text>
        )
      },
      {
        key: 'name',
        title: t('teaching.tasks.table.name'),
        render: (_, record) => (
          <Flex align="center" gap={2} minW="0">
            <Tooltip label={record.name} placement="top" hasArrow>
              <Text
                fontSize="13px"
                fontWeight="700"
                color="#3A3A3A"
                minW="91px"
                maxW="91px"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {record.name}
              </Text>
            </Tooltip>
            <Badge
              flexShrink={0}
              px={2.5}
              py={0.75}
              rounded="10px"
              bg={record.typeTone === 'blue' ? '#EEF4FF' : '#FFF3E8'}
              color={record.typeTone === 'blue' ? '#2563EB' : '#EA7A16'}
              fontSize="12px"
              fontWeight="600"
            >
              {record.courseType === 'required'
                ? t('teaching.tasks.type.required')
                : t('teaching.tasks.type.elective')}
            </Badge>
          </Flex>
        )
      },
      {
        key: 'teacher',
        title: t('teaching.tasks.table.teacher'),
        dataIndex: 'teacher',
        render: (value) => (
          <Text fontSize="12px" color="#64748B">
            {String(value ?? '--')}
          </Text>
        )
      },
      {
        key: 'course',
        title: t('teaching.tasks.table.course'),
        dataIndex: 'course',
        render: (value) => (
          <Text fontSize="12px" color="#64748B">
            {String(value ?? '--')}
          </Text>
        )
      },
      {
        key: 'classOrType',
        title: t('teaching.tasks.table.classOrType'),
        render: (_, record) =>
          record.className ? (
            <Text fontSize="12px" color="#64748B">
              {record.className}
            </Text>
          ) : (
            <Text fontSize="12px" color="#EA7A16" fontWeight="600">
              选修课
            </Text>
          )
      },
      {
        key: 'semester',
        title: t('teaching.tasks.table.semester'),
        dataIndex: 'semester',
        render: (value) => (
          <Text fontSize="12px" color="#64748B">
            {String(value ?? '--')}
          </Text>
        )
      },
      {
        key: 'status',
        title: t('teaching.tasks.table.status'),
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
        title: t('teaching.tasks.table.actions'),
        align: 'center',
        width: '300px',
        onCell: () => ({ py: '14px', w: '300px' }),
        render: (_, record) => {
          const isUpdating = updatingStatusId === record.id;

          return (
            <Flex justify="left" gap={2} wrap="wrap">
              {record.status === 'not_started' ? (
                <Button
                  padding={`0 26px`}
                  h="30px"
                  minH="30px"
                  minW="54px"
                  variant="outline"
                  rounded="md"
                  fontSize="12px"
                  fontWeight="500"
                  borderColor="#6D2DE4"
                  color="#6D2DE4"
                  bg="white"
                  _hover={{ bg: '#FAF5FF' }}
                  isLoading={isUpdating}
                  onClick={() => void handleStart(record.id)}
                >
                  {t('teaching.tasks.actions.start')}
                </Button>
              ) : null}

              {record.status === 'in_progress' ? (
                <Button
                  padding={`0 26px`}
                  h="30px"
                  minH="30px"
                  minW="54px"
                  variant="outline"
                  rounded="md"
                  fontSize="12px"
                  fontWeight="500"
                  borderColor="#00B42A"
                  color="#00B42A"
                  bg="white"
                  _hover={{ bg: '#F0FDF4' }}
                  isLoading={isUpdating}
                  onClick={() => void handleComplete(record.id)}
                >
                  {t('teaching.tasks.actions.complete')}
                </Button>
              ) : null}

              <Button
                padding={`0 26px`}
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
                {t('teaching.tasks.actions.edit')}
              </Button>
              <Button
                padding={`0 26px`}
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
                {t('teaching.tasks.actions.delete')}
              </Button>
            </Flex>
          );
        }
      }
    ],
    [
      getStatusStyle,
      getStatusText,
      handleComplete,
      handleStart,
      openDeleteModal,
      openEditModal,
      t,
      updatingStatusId
    ]
  );

  if (!isI18nReady) {
    return null;
  }

  return (
    <Box
      className="tasks-page"
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
          align={{ base: 'stretch', lg: 'center' }}
          justify="space-between"
          gap={3}
          direction={{ base: 'column', lg: 'row' }}
          flexShrink={0}
        >
          <Flex
            flex="1"
            align={{ base: 'stretch', md: 'center' }}
            gap={3}
            wrap="wrap"
            direction={{ base: 'column', md: 'row' }}
          >
            <AppSelect
              value={semesterFilter}
              isDisabled={isOptionsLoading}
              onChange={(value) => {
                setSemesterFilter(value);
                setCurrentPage(1);
              }}
              options={semesters
                .filter((item) => item.id !== undefined)
                .map((item) => ({
                  value: String(item.id),
                  label: item.name || '--'
                }))}
              placeholder={t('teaching.tasks.filters.semesterPlaceholder')}
              w={{ base: 'full', md: '149px' }}
              h="40px"
              fontSize="14px"
              bg="white"
              borderColor="#E5E7EB"
              borderRadius="14px"
              color={semesterFilter ? '#334155' : '#64748B'}
              menuMaxH="240px"
            />

            <AppSelect
              value={teacherFilter}
              isDisabled={isOptionsLoading}
              onChange={(value) => {
                setTeacherFilter(value);
                setCurrentPage(1);
              }}
              options={teachers
                .filter((item) => item.id !== undefined)
                .map((item) => ({
                  value: String(item.id),
                  label: item.name || '--'
                }))}
              placeholder={t('teaching.tasks.filters.teacherPlaceholder')}
              w={{ base: 'full', md: '149px' }}
              h="40px"
              fontSize="14px"
              bg="white"
              borderColor="#E5E7EB"
              borderRadius="14px"
              color={teacherFilter ? '#334155' : '#64748B'}
              menuMaxH="240px"
            />

            <AppSelect
              value={courseFilter}
              isDisabled={isOptionsLoading}
              onChange={(value) => {
                setCourseFilter(value);
                setCurrentPage(1);
              }}
              options={courses
                .filter((item) => item.id !== undefined)
                .map((item) => ({
                  value: String(item.id),
                  label: item.name || '--'
                }))}
              placeholder={t('teaching.tasks.filters.coursePlaceholder')}
              w={{ base: 'full', md: '149px' }}
              h="40px"
              fontSize="14px"
              bg="white"
              borderColor="#E5E7EB"
              borderRadius="14px"
              color={courseFilter ? '#334155' : '#64748B'}
              menuMaxH="240px"
            />

            <AppSelect
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
              options={[
                {
                  value: 'required',
                  label: t('teaching.tasks.type.required')
                },
                {
                  value: 'elective',
                  label: t('teaching.tasks.type.elective')
                }
              ]}
              placeholder={t('teaching.tasks.filters.typePlaceholder')}
              w={{ base: 'full', md: '149px' }}
              h="40px"
              fontSize="14px"
              bg="white"
              borderColor="#E5E7EB"
              borderRadius="14px"
              color={typeFilter ? '#334155' : '#64748B'}
              menuMaxH="240px"
            />

            <InputGroup w={{ base: 'full', md: '274px' }} minW={{ base: 'full', md: '274px' }}>
              <Input
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                h="40px"
                pr="44px"
                fontSize="14px"
                placeholder={t('teaching.tasks.filters.searchPlaceholder')}
                bg="white"
                borderColor="#E5E7EB"
                borderRadius="14px"
                color="#334155"
                _placeholder={{ color: '#94A3B8' }}
              />
              <InputRightElement h="40px" pointerEvents="none" color="#64748B">
                <SearchIcon />
              </InputRightElement>
            </InputGroup>
          </Flex>

          <Button
            leftIcon={<AddIcon />}
            h="40px"
            w={{ base: 'full', md: '140px' }}
            minW={{ base: 'full', md: '140px' }}
            px={4}
            alignSelf={{ base: 'stretch', lg: 'center' }}
            borderRadius="14px"
            color="white"
            fontSize="14px"
            fontWeight="600"
            bg="#2D2D2D"
            _hover={{ bg: '#1F1F1F' }}
            onClick={openCreateModal}
          >
            {t('teaching.tasks.actions.create')}
          </Button>
        </Flex>
        <Box flex="1" minH="0" display="flex" flexDirection="column" overflow="hidden">
          <TableAdmin<TeachingTaskItem>
            columns={tableColumns}
            dataSource={tasks}
            rowKey="id"
            loading={isListLoading}
            scroll={{ x: '1320px' }}
            headerCellProps={{ h: '50px' }}
            bodyCellProps={{ py: '19px' }}
            locale={{
              loadingText: '加载中...',
              emptyText: (
                <Flex direction="column" align="center" gap={2} color="gray.500">
                  <Text fontSize="14px" fontWeight="600">
                    {t('teaching.tasks.empty.title')}
                  </Text>
                  <Text fontSize="12px">{t('teaching.tasks.empty.description')}</Text>
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
            {t('teaching.tasks.pagination.total', { value: total })}
          </Text>
          <Flex align="center" gap={2}>
            <IconButton
              aria-label={t('teaching.tasks.pagination.prev')}
              icon={<ChevronLeftIcon w={'12px'} h={'12px'} />}
              variant="outline"
              w="32px"
              h="32px"
              minW="32px"
              minH="32px"
              rounded="md"
              border="1px solid #E7E7E7"
              isDisabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            />
            <Text minW="120px" textAlign="center" fontSize="14px" color="#4E5969">
              {t('teaching.tasks.pagination.pageInfo', {
                page: safeCurrentPage,
                total: totalPages
              })}
            </Text>
            <IconButton
              aria-label={t('teaching.tasks.pagination.next')}
              icon={<ChevronRightIcon w={'12px'} h={'12px'} />}
              variant="outline"
              w="32px"
              h="32px"
              minW="32px"
              minH="32px"
              rounded="md"
              border="1px solid #E7E7E7"
              isDisabled={safeCurrentPage >= totalPages}
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
          top={'5vh'}
        >
          <ModalHeader fontSize="16px" fontWeight="600" padding="16px 32px">
            {editingTask ? t('teaching.tasks.modal.editTitle') : '新增教学任务'}
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
                  {t('teaching.tasks.form.code')}
                </FormLabel>
                <InputGroup>
                  <Input
                    isReadOnly={!!editingTask}
                    value={formState.code}
                    onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
                    h="46px"
                    px={4}
                    pr="44px"
                    borderRadius="14px"
                    borderColor="#E6E6E6"
                    bg={editingTask ? 'gray.50' : 'white'}
                    fontSize="18px"
                    color="#444444"
                    placeholder={t('teaching.tasks.form.codePlaceholder')}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.tasks.form.name')}
                </FormLabel>
                <Input
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t('teaching.tasks.form.namePlaceholder')}
                  h="46px"
                  px={4}
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  color="#333333"
                  _placeholder={{ color: '#A0AEC0' }}
                  isDisabled={isDetailLoading}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.tasks.form.teacher')}
                </FormLabel>
                <AppSelect
                  value={selectedTeacherValue}
                  onChange={(value) => {
                    const selected = teacherSelectOptions.find((item) => item.id === value);
                    setFormState((prev) => ({
                      ...prev,
                      teacherId: parseOptionalId(value),
                      teacher: selected?.label || ''
                    }));
                  }}
                  options={teacherSelectOptions.map((item) => ({
                    value: item.id,
                    label: item.label
                  }))}
                  placeholder={t('teaching.tasks.form.teacherPlaceholder')}
                  h="46px"
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  color={selectedTeacherValue ? '#333333' : '#A0AEC0'}
                  isDisabled={isDetailLoading || isOptionsLoading}
                  menuMaxH="240px"
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('teaching.tasks.form.course')}
                  </FormLabel>
                  <AppSelect
                    value={selectedCourseValue}
                    onChange={(value) => {
                      const selected = courses.find((item) => String(item.id) === value);
                      const selectedCourseId = parseOptionalId(value);
                      const apiCourseType = selected?.type;
                      const uICourseType =
                        apiCourseType === 1 || apiCourseType === 2
                          ? mapApiCourseTypeToUIType(apiCourseType as 1 | 2)
                          : undefined;

                      setFormState((prev) => ({
                        ...prev,
                        course: selected?.name || '',
                        tenantCourseId: selectedCourseId,
                        courseType: uICourseType,
                        className: '',
                        classIds: []
                      }));
                    }}
                    options={courseSelectOptions.map((item) => ({
                      value: item.id,
                      label: item.label
                    }))}
                    placeholder={t('teaching.tasks.form.coursePlaceholder')}
                    h="46px"
                    borderRadius="14px"
                    borderColor="#E6E6E6"
                    bg="white"
                    fontSize="16px"
                    color={selectedCourseValue ? '#333333' : '#A0AEC0'}
                    isDisabled={isDetailLoading || isOptionsLoading}
                    menuMaxH="240px"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('teaching.tasks.form.courseType')}
                  </FormLabel>
                  <AppSelect
                    value={selectedCourseType}
                    options={[
                      {
                        value: 'required',
                        label: t('teaching.tasks.type.required')
                      },
                      {
                        value: 'elective',
                        label: t('teaching.tasks.type.elective')
                      }
                    ]}
                    placeholder={t('teaching.tasks.form.courseTypePlaceholder')}
                    h="46px"
                    px={1}
                    borderRadius="14px"
                    borderColor="#E6E6E6"
                    bg="white"
                    fontSize="16px"
                    color={selectedCourseType ? '#333333' : '#A0AEC0'}
                    isDisabled={true}
                    menuMaxH="240px"
                  />
                </FormControl>
              </SimpleGrid>

              {formState.courseType !== 'elective' && (
                <FormControl isRequired>
                  <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                    {t('teaching.tasks.form.className')}
                  </FormLabel>
                  <MultipleSelect
                    h="46px"
                    maxH="46px"
                    borderRadius="14px"
                    borderColor="#E6E6E6"
                    bg="white"
                    fontSize="16px"
                    color={formState.classIds?.length ? '#333333' : '#A0AEC0'}
                    isDisabled={isDetailLoading || isOptionsLoading}
                    placeholder={t('teaching.tasks.form.classNamePlaceholder')}
                    list={classes.map((item) => ({
                      label: item.name || '--',
                      value: Number(item.id)
                    }))}
                    value={formState.classIds || []}
                    onSelect={(vals) => {
                      const selectedNames = classes
                        .filter((item) => vals.includes(Number(item.id)))
                        .map((item) => item.name || '--');

                      setFormState((prev) => ({
                        ...prev,
                        className: selectedNames.join('、'),
                        classIds: vals
                      }));
                    }}
                  />
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.tasks.form.semester')}
                </FormLabel>
                <AppSelect
                  value={selectedSemesterValue}
                  onChange={(value) =>
                    setFormState((prev) => {
                      const selected = semesterSelectOptions.find((item) => item.id === value);

                      return {
                        ...prev,
                        semesterId: parseOptionalId(value),
                        semester: selected?.label || ''
                      };
                    })
                  }
                  options={semesterSelectOptions.map((item) => ({
                    value: item.id,
                    label: item.label
                  }))}
                  placeholder={t('teaching.tasks.form.semesterPlaceholder')}
                  h="46px"
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  color={selectedSemesterValue ? '#333333' : '#A0AEC0'}
                  isDisabled={isDetailLoading || isOptionsLoading}
                  menuMaxH="240px"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel mb={2.5} fontSize="14px" fontWeight="500" color="#333333">
                  {t('teaching.tasks.form.status')}
                </FormLabel>
                <AppSelect
                  value={formState.status}
                  onChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: value as TaskStatus
                    }))
                  }
                  options={[
                    {
                      value: 'not_started',
                      label: t('teaching.tasks.status.notStarted')
                    },
                    {
                      value: 'in_progress',
                      label: t('teaching.tasks.status.inProgress')
                    },
                    {
                      value: 'completed',
                      label: t('teaching.tasks.status.completed')
                    }
                  ]}
                  h="46px"
                  borderRadius="14px"
                  borderColor="#E6E6E6"
                  bg="white"
                  fontSize="16px"
                  color="#333333"
                  menuMaxH="240px"
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
            >
              {t('teaching.tasks.actions.cancel')}
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
              isLoading={isSubmitting || isDetailLoading}
            >
              {t('teaching.tasks.actions.save')}
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
                {t('teaching.tasks.delete.title')}
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
              {t('teaching.tasks.delete.description', { name: deleteTarget?.name || '' })}
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
              {t('teaching.tasks.actions.cancel')}
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
              _hover={{ bg: '#262626' }}
              isLoading={isDeleting}
            >
              {t('teaching.tasks.actions.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
