import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDisclosure, useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTeacherI18n } from '@/app/teacher/components/TeacherI18nProvider';
import type { StudentData } from '../constants';
import { studentsData } from '../mockData';
import { getCourseOptionById, getStoredAvatarRecordById } from '../../avatarStorage';
import { getAiAvatarDetail, getAvatarStudentsStats } from '@/teacher/api/aiTeacher';
import { getAvatarStudentsPage, remindAvatarStudents } from '@/api/ai-avatar-students';
import type {
  AiAvatarDetailVO,
  AvatarStudentVO,
  AvatarStudentsStatsResponse
} from '@/teacher/types/aiTeacher';

/**
 * 将API返回的学生数据转换为前端StudentData格式
 */
function convertApiStudentToStudentData(apiStudent: AvatarStudentVO): StudentData {
  // 判断学习状态
  // API: 0-未开始，1-正常，2-滞后，3-已完成
  // 前端: 'not-started' | 'learning' | 'lagging' | 'completed' | 'normal'
  let status: StudentData['status'] = 'not-started';

  switch (apiStudent.status) {
    case 0:
      status = 'not-started'; // 未开始
      break;
    case 1:
      status = 'normal'; // 正常学习中
      break;
    case 2:
      status = 'lagging'; // 滞后
      break;
    case 3:
      status = 'completed'; // 已完成
      break;
    default:
      status = 'not-started';
  }

  // 格式化最后学习时间为相对时间
  const formatLastStudy = (time: string) => {
    if (!time) return '从未学习';

    try {
      const lastTime = new Date(time);
      const now = new Date();
      const diffMs = now.getTime() - lastTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSeconds < 60) {
        return '刚刚';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
      } else if (diffHours < 24) {
        return `${diffHours}小时前`;
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks}周前`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months}个月前`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years}年前`;
      }
    } catch (error) {
      console.error('时间格式化失败:', error);
      return time; // 如果格式化失败，返回原始时间
    }
  };

  return {
    id: String(apiStudent.studentId),
    studentId: apiStudent.studentId, // 保存真实的学生ID
    name: apiStudent.studentName || '未命名',
    classId: apiStudent.classId, // 保存班级ID
    className: apiStudent.className || '未分配班级',
    progress: apiStudent.progress,
    studyHours: apiStudent.studyHours,
    lastStudy: formatLastStudy(apiStudent.lastLearnTime),
    status,
    reminded: apiStudent.isReminded === 1
  };
}

export function useAvatarDetail() {
  const toast = useToast();
  const { t } = useTranslation('teacher');
  const searchParams = useSearchParams();
  const { ensureSections, locale } = useTeacherI18n();

  // 确保 aiTeacher 资源已加载，当语言切换时重新加载
  useEffect(() => {
    ensureSections(['aiTeacher']);
  }, [ensureSections, locale]);
  const avatarId = searchParams?.get('id') || '';

  // TODO: 从用户状态管理中获取真实的 teacherId
  const teacherId = 1;

  const storedRecord = useMemo(
    () => (avatarId ? getStoredAvatarRecordById(avatarId) : null),
    [avatarId]
  );

  const storedCourse = useMemo(
    () => (storedRecord ? getCourseOptionById(storedRecord.courseId) : null),
    [storedRecord]
  );

  // API数据状态
  const [avatarDetail, setAvatarDetail] = useState<AiAvatarDetailVO | null>(null);
  const [studentsStats, setStudentsStats] = useState<AvatarStudentsStatsResponse | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [remindStudent, setRemindStudent] = useState<StudentData | null>(null);
  const [conversationStudent, setConversationStudent] = useState<StudentData | null>(null);

  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isRemindOpen, onOpen: onRemindOpen, onClose: onRemindClose } = useDisclosure();
  const {
    isOpen: isConversationOpen,
    onOpen: onConversationOpen,
    onClose: onConversationClose
  } = useDisclosure();

  // 加载AI分身详情
  useEffect(() => {
    if (!avatarId) return;

    const loadAvatarDetail = async () => {
      try {
        const detail = await getAiAvatarDetail({ id: Number(avatarId) });
        setAvatarDetail(detail);
      } catch (error) {
        console.error('加载AI分身详情失败:', error);
      }
    };

    loadAvatarDetail();
  }, [avatarId]);

  // 加载学生统计数据
  useEffect(() => {
    if (!avatarId) return;

    const loadStudentsStats = async () => {
      try {
        const stats = await getAvatarStudentsStats({ avatarId: Number(avatarId) });
        setStudentsStats(stats);
      } catch (error) {
        console.error('加载学生统计失败:', error);
      }
    };

    loadStudentsStats();
  }, [avatarId]);

  // 加载学生列表
  useEffect(() => {
    if (!avatarId) return;

    const loadStudents = async () => {
      setIsLoading(true);
      try {
        const response = await getAvatarStudentsPage({
          avatarId: Number(avatarId),
          pageNum: currentPage,
          pageSize,
          searchKey: searchText || undefined // 使用 searchKey 而不是 keyword
        });

        // 过滤掉无效的学生数据（studentId为空或studentName为空）
        const validStudents = response.records.filter(
          (student) => student.studentId && student.studentName
        );

        const convertedStudents = validStudents.map(convertApiStudentToStudentData);
        setStudents(convertedStudents);
        setTotal(response.total);
      } catch (error) {
        console.error('加载学生列表失败:', error);
        toast({
          title: t('aiTeacher.avatar.detail.students.toasts.loadStudentsFailed'),
          description: t('aiTeacher.avatar.detail.students.toasts.loadStudentsFailedDesc'),
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, [avatarId, currentPage, pageSize, searchText, toast]);

  // 前端过滤（班级筛选）
  const filteredStudents = students.filter((student) => {
    const matchClass = selectedClass === 'all' || student.className === selectedClass;
    return matchClass;
  });

  const handleViewStudent = (student: StudentData) => {
    setSelectedStudent(student);
    onDetailOpen();
  };

  const handleRemindClick = (student: StudentData) => {
    setRemindStudent(student);
    onRemindOpen();
  };

  const handleViewConversation = (student: StudentData) => {
    setConversationStudent(student);
    onConversationOpen();
  };

  const handleConversationClose = () => {
    onConversationClose();
    setConversationStudent(null);
  };

  const handleConfirmRemind = async () => {
    if (!remindStudent || !remindStudent.studentId) {
      toast({
        title: t('aiTeacher.avatar.detail.students.toasts.remindFailed'),
        description: t('aiTeacher.avatar.detail.students.toasts.remindFailedIncomplete'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      onRemindClose();
      setRemindStudent(null);
      return;
    }

    try {
      await remindAvatarStudents({
        avatarId: Number(avatarId),
        studentIds: [remindStudent.studentId],
        teacherId
      });

      // 乐观更新：将该学生的 reminded 置为 true
      setStudents((prev) =>
        prev.map((s) => (s.id === remindStudent.id ? { ...s, reminded: true } : s))
      );

      toast({
        title: `已向 ${remindStudent.name} 发送学习提醒`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });

      onRemindClose();
      setRemindStudent(null);
    } catch (error) {
      console.error('提醒失败:', error);
      toast({
        title: t('aiTeacher.avatar.detail.students.toasts.remindFailed'),
        description:
          error instanceof Error
            ? error.message
            : t('aiTeacher.avatar.detail.students.toasts.remindFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      onRemindClose();
      setRemindStudent(null);
    }
  };

  const handleModalRemind = () => {
    if (selectedStudent) {
      onDetailClose();
      setRemindStudent(selectedStudent);
      onRemindOpen();
    }
  };

  return {
    avatarId,
    teacherId,
    storedRecord,
    storedCourse,
    avatarDetail,
    studentsStats,
    isLoading,
    searchText,
    setSearchText,
    selectedClass,
    setSelectedClass,
    selectedStudent,
    remindStudent,
    students, // 完整的学生列表（用于提取班级选项）
    filteredStudents,
    currentPage,
    setCurrentPage,
    pageSize,
    total,
    isDetailOpen,
    onDetailClose,
    isRemindOpen,
    onRemindClose,
    isConversationOpen,
    conversationStudent,
    handleViewStudent,
    handleRemindClick,
    handleConfirmRemind,
    handleModalRemind,
    handleViewConversation,
    handleConversationClose
  };
}
