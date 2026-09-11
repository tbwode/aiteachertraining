import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  consumeAvatarFlashMessage,
  getStoredAvatarRecords,
  mergeTeacherAvatarCards,
  updateStoredAvatarStatus
} from '../../aiTeacher/avatar/avatarStorage';
import type { AvatarCard, SuggestionItem, StudentTodo, TabKey } from '../constants';
import { initialAvatars, initialStudents, initialSuggestions } from '../constants';
import {
  getAiTeacherStats,
  getAiTeacherSuggestions,
  getAiTeacherTodos,
  getAiAvatarList,
  updateAiAvatarStatus,
  batchMarkSuggestionsRead,
  remindAvatarStudents,
  deleteAiAvatar
} from '@/teacher/api/aiTeacher';
import type { AiSuggestion, TodoStudent, AiAvatarVO } from '@/teacher/types/aiTeacher';
import { useAuth } from '@/app/components/auth/AuthProvider';

/**
 * 将API返回的建议数据转换为前端格式
 */
function convertSuggestions(apiSuggestions: AiSuggestion[]): SuggestionItem[] {
  return apiSuggestions.map((item) => {
    const type =
      item.suggestionType === 1 ? 'news' : item.suggestionType === 2 ? 'optimization' : 'graph';
    const fallback =
      initialSuggestions.find((suggestion) => suggestion.id === String(item.id)) ??
      initialSuggestions.find((suggestion) => suggestion.type === type);

    return {
      id: String(item.id),
      type,
      title: item.title,
      description: item.content,
      read: item.isRead === 1,
      action: item.suggestionType === 3 ? 'adopt' : 'read',
      relatedCourseName: item.relatedCourseName,
      publishTime: item.publishTime,
      priority: item.priority ?? fallback?.priority ?? 'medium',
      confidence: item.confidence ?? fallback?.confidence ?? 86,
      sourceLabel: item.sourceLabel ?? fallback?.sourceLabel ?? 'AI 教学分析',
      evidenceList: item.evidenceList ?? fallback?.evidenceList ?? [item.content],
      impactSummary: item.impactSummary ?? fallback?.impactSummary ?? item.content,
      targetAudience: item.targetAudience ?? fallback?.targetAudience ?? '当前授课班级',
      expectedOutcome: item.expectedOutcome ?? fallback?.expectedOutcome ?? '课程教学效果持续改善',
      recommendedActions: item.recommendedActions ??
        fallback?.recommendedActions ?? ['查看详情并结合课程计划进行处理']
    };
  });
}

/**
 * 将API返回的待办学生数据转换为前端格式
 */
function convertTodoStudents(apiStudents: TodoStudent[]): StudentTodo[] {
  return apiStudents.map((item) => {
    const id = `${item.studentId}-${item.avatarId}`;
    const fallback = initialStudents.find((student) => student.id === id) ?? initialStudents[0];

    return {
      id,
      studentId: item.studentId, // 保存真实的学生ID
      name: item.studentName,
      className: item.className,
      course: item.courseName, // 修正：使用 courseName 而不是 avatarName
      avatarId: item.avatarId, // 保存AI分身ID
      progress: item.progress,
      delayDays: item.lagDays,
      reminded: item.isReminded === 1,
      studyHours: item.studyHours,
      lastStudyTimeDesc: item.lastStudyTimeDesc,
      lagReasonList: item.lagReasonList,
      riskLevel:
        item.riskLevel ??
        (item.progress < 40 ? 'critical' : item.progress < 60 ? 'high' : 'medium'),
      riskType: item.riskType ?? fallback?.riskType ?? '进度滞后',
      riskScore: item.riskScore ?? fallback?.riskScore ?? Math.min(95, 100 - item.progress + 25),
      progressGap: item.progressGap ?? fallback?.progressGap ?? Math.max(6, 70 - item.progress),
      uncompletedTaskCount:
        item.uncompletedTaskCount ?? fallback?.uncompletedTaskCount ?? item.lagReasonList.length,
      riskSignalList: item.riskSignalList ?? fallback?.riskSignalList ?? item.lagReasonList,
      weakKnowledgePoints: item.weakKnowledgePoints ?? fallback?.weakKnowledgePoints ?? [],
      recommendedActions: item.recommendedActions ??
        fallback?.recommendedActions ?? ['发送学习提醒', '指派针对性练习']
    };
  });
}

/**
 * 将API返回的AI分身数据转换为前端格式
 */
function convertAvatars(apiAvatars: AiAvatarVO[]): AvatarCard[] {
  // 预定义的颜色方案
  const colorSchemes = [
    {
      heroBg: 'linear-gradient(135deg, #FEE2E2 0%, #FED7AA 100%)',
      heroText: 'AI',
      accentColor: '#C83E3E',
      coverageBg: '#EFF6FF',
      coverageColor: '#2563EB'
    },
    {
      heroBg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      heroText: 'CS',
      accentColor: '#FAAD14',
      coverageBg: '#FFFBEB',
      coverageColor: '#B45309'
    },
    {
      heroBg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
      heroText: 'DB',
      accentColor: '#52C41A',
      coverageBg: '#F0FDF4',
      coverageColor: '#15803D'
    },
    {
      heroBg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
      heroText: 'WEB',
      accentColor: '#1677FF',
      coverageBg: '#EFF6FF',
      coverageColor: '#1D4ED8'
    }
  ];

  return apiAvatars.map((item, index) => {
    const colorScheme = colorSchemes[index % colorSchemes.length];

    // 提取班级和专业列表
    const classNames =
      item.classList && item.classList.length > 0 ? item.classList.map((c) => c.className) : [];
    const majorNames =
      item.majorList && item.majorList.length > 0 ? item.majorList.map((m) => m.majorName) : [];

    const hasClasses = classNames.length > 0;
    const hasMajors = majorNames.length > 0;

    // 生成课程简称（取前两个字符）
    const heroText = item.courseName?.substring(0, 2).toUpperCase() ?? '';

    // 如果有 coverUrl，使用图片背景；否则使用渐变色背景
    const heroBg = item.coverUrl
      ? `url(${item.coverUrl})`
      : item.status === 2
        ? 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)'
        : colorScheme.heroBg;

    return {
      id: String(item.id),
      title: item.courseName,
      status: item.status === 0 ? 'pending' : item.status === 1 ? 'running' : 'expired',
      studentScale: item.status === 0 ? '--' : `${item.studentCount}人`,
      interactions: item.status === 0 ? '--' : String(item.todayInteractionCount),
      coverageLabel: hasClasses ? '覆盖班级' : hasMajors ? '学员专业' : '覆盖范围',
      coverageText: hasClasses ? classNames.join('、') : hasMajors ? majorNames.join('、') : '暂无',
      coverageBg: item.status === 2 ? '#F3F4F6' : colorScheme.coverageBg,
      coverageColor: item.status === 2 ? '#6B7280' : colorScheme.coverageColor,
      heroBg,
      heroText: heroText || colorScheme.heroText,
      accentColor: item.status === 2 ? '#6B7280' : colorScheme.accentColor
    };
  });
}

export function useTeacherHome() {
  const toast = useToast();
  const { t } = useTranslation('teacher');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(initialSuggestions);
  const [students, setStudents] = useState<StudentTodo[]>(initialStudents);
  const [avatars, setAvatars] = useState<AvatarCard[]>(initialAvatars);
  const [statsData, setStatsData] = useState({
    courseCount: 0,
    aiAvatarCount: 0,
    todayInteractionCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentTodo | null>(null);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [remindStudent, setRemindStudent] = useState<StudentTodo | null>(null);
  const [isRemindModalOpen, setIsRemindModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AvatarCard | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cancelPublishTarget, setCancelPublishTarget] = useState<AvatarCard | null>(null);
  const [isCancelPublishOpen, setIsCancelPublishOpen] = useState(false);

  // 加载首页数据
  const loadHomeData = useCallback(async () => {
    const teacherId = user?.teacherId;

    if (!teacherId) {
      console.error('useTeacherHome - teacherId 不存在');
      toast({
        title: '用户信息错误',
        description: '未找到教师ID，请重新登录',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('useTeacherHome - 调用API, teacherId:', teacherId);

      // 并行请求所有数据
      const [stats, suggestionList, todoList, avatarList] = await Promise.all([
        getAiTeacherStats({ teacherId }),
        getAiTeacherSuggestions({ teacherId }),
        getAiTeacherTodos({ teacherId }),
        getAiAvatarList({ teacherId })
      ]);

      console.log('useTeacherHome - API返回数据:', {
        stats,
        suggestionList,
        todoList,
        avatarList
      });

      // 更新统计数据
      setStatsData(stats);

      // Mock 原型保留足够样本，避免稀疏接口数据降低演示完整度。
      const convertedSuggestions = convertSuggestions(suggestionList);
      setSuggestions(
        convertedSuggestions.length >= initialSuggestions.length
          ? convertedSuggestions
          : initialSuggestions
      );

      const convertedStudents = convertTodoStudents(todoList.list);
      setStudents(
        convertedStudents.length >= initialStudents.length ? convertedStudents : initialStudents
      );

      // 更新AI分身列表
      setAvatars(convertAvatars(avatarList));

      console.log('useTeacherHome - 数据加载成功');
    } catch (error) {
      console.error('useTeacherHome - 加载首页数据失败:', error);
      toast({
        title: '加载数据失败',
        description: '请刷新页面重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user?.teacherId]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  useEffect(() => {
    const storedRecords = getStoredAvatarRecords(user?.id);
    if (storedRecords.length > 0) {
      setAvatars((current) => mergeTeacherAvatarCards(current, storedRecords));
    }

    const flash = consumeAvatarFlashMessage();
    if (flash) {
      toast({
        title: flash.translationKey,
        status: flash.status,
        duration: 2200,
        isClosable: true,
        position: 'top'
      });
    }
  }, [toast, user?.id]);

  const newsSuggestions = suggestions.filter((item) => item.type === 'news');
  const optimizationSuggestions = suggestions.filter((item) => item.type === 'optimization');
  const graphSuggestions = suggestions.filter((item) => item.type === 'graph');

  const unremindedCount = useMemo(
    () => students.filter((student) => !student.reminded).length,
    [students]
  );

  const visibleAvatars = useMemo(() => {
    if (activeTab === 'all') {
      return avatars;
    }

    return avatars.filter((avatar) => avatar.status === activeTab);
  }, [activeTab, avatars]);

  const showPlaceholderToast = (title: string) => {
    toast({
      title,
      status: 'info',
      duration: 1800,
      isClosable: true,
      position: 'top'
    });
  };

  const updateSuggestion = (id: string) => {
    setSuggestions((list) =>
      list.map((item) =>
        item.id === id
          ? {
              ...item,
              read: true
            }
          : item
      )
    );
  };

  const handleSuggestionAction = async (id: string) => {
    const current = suggestions.find((item) => item.id === id);
    if (!current || current.read) {
      return;
    }

    // 从 store 中获取 teacherId
    const teacherId = user?.teacherId;

    if (!teacherId) {
      console.error('handleSuggestionAction - teacherId 不存在');
      return;
    }

    try {
      // 调用批量标记已读API（传入单个ID的数组）
      await batchMarkSuggestionsRead({
        teacherId,
        suggestionIds: [Number(id)]
      });

      // 更新本地状态
      updateSuggestion(id);

      toast({
        title:
          current.action === 'adopt' ? t('home.toasts.adopted') : t('home.toasts.markedAsRead'),
        status: 'success',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
    } catch (error: any) {
      console.error('handleSuggestionAction - 标记已读失败:', error);
      const errorMessage = error?.message || error?.msg || t('home.toasts.operationFailedDesc');
      toast({
        title: t('home.toasts.operationFailed'),
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const handleMarkAllNewsRead = async () => {
    // 获取所有未读的前沿资讯ID
    const unreadNewsIds = suggestions
      .filter((item) => item.type === 'news' && !item.read)
      .map((item) => Number(item.id));

    if (unreadNewsIds.length === 0) {
      return;
    }

    // 从 store 中获取 teacherId
    const teacherId = user?.teacherId;

    if (!teacherId) {
      console.error('handleMarkAllNewsRead - teacherId 不存在');
      return;
    }

    try {
      // 调用批量标记已读API
      await batchMarkSuggestionsRead({
        teacherId,
        suggestionIds: unreadNewsIds
      });

      // 更新本地状态
      setSuggestions((list) =>
        list.map((item) =>
          item.type === 'news'
            ? {
                ...item,
                read: true
              }
            : item
        )
      );

      toast({
        title: t('home.toasts.allNewsMarkedAsRead'),
        status: 'success',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
    } catch (error: any) {
      console.error('handleMarkAllNewsRead - 批量标记已读失败:', error);
      const errorMessage = error?.message || error?.msg || t('home.toasts.operationFailedDesc');
      toast({
        title: t('home.toasts.operationFailed'),
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const handleRemindStudent = async (id: string) => {
    const currentStudent = students.find((item) => item.id === id);
    if (!currentStudent || currentStudent.reminded) {
      return;
    }

    // 检查是否有必要的ID
    if (!currentStudent.studentId || !currentStudent.avatarId) {
      toast({
        title: '提醒失败',
        description: '学生信息不完整',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    // 从 store 中获取 teacherId
    const teacherId = user?.teacherId;

    if (!teacherId) {
      console.error('handleRemindStudent - teacherId 不存在');
      toast({
        title: '提醒失败',
        description: '用户信息错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    try {
      await remindAvatarStudents({
        avatarId: currentStudent.avatarId,
        studentIds: [currentStudent.studentId],
        teacherId
      });

      setStudents((list) =>
        list.map((item) =>
          item.id === id
            ? {
                ...item,
                reminded: true
              }
            : item
        )
      );

      toast({
        title: `已向 ${currentStudent.name} 发送提醒`,
        status: 'success',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      console.error('handleRemindStudent - 提醒失败:', error);
      toast({
        title: '提醒失败',
        description: error instanceof Error ? error.message : '发送提醒失败，请重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const handleOpenRemindModal = () => {
    if (selectedStudent) {
      setRemindStudent(selectedStudent);
      setIsRemindModalOpen(true);
    }
  };

  const handleConfirmRemind = async () => {
    if (remindStudent) {
      setIsRemindModalOpen(false);
      await handleRemindStudent(remindStudent.id);
      setRemindStudent(null);
    }
  };

  const handleCloseRemindModal = () => {
    setIsRemindModalOpen(false);
    setRemindStudent(null);
  };

  const handleBatchProcess = async () => {
    if (unremindedCount === 0) {
      return;
    }

    const unremindedStudents = students.filter((student) => !student.reminded);

    // 按 avatarId 分组
    const groupedByAvatar = unremindedStudents.reduce(
      (acc, student) => {
        if (student.avatarId && student.studentId) {
          if (!acc[student.avatarId]) {
            acc[student.avatarId] = [];
          }
          acc[student.avatarId].push(student.studentId);
        }
        return acc;
      },
      {} as Record<number, number[]>
    );

    // 从 store 中获取 teacherId
    const teacherId = user?.teacherId;

    if (!teacherId) {
      console.error('handleBatchProcess - teacherId 不存在');
      toast({
        title: '批量提醒失败',
        description: '用户信息错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    try {
      // 批量提醒每个 avatar 下的学生
      await Promise.all(
        Object.entries(groupedByAvatar).map(([avatarId, studentIds]) =>
          remindAvatarStudents({
            avatarId: Number(avatarId),
            studentIds,
            teacherId
          })
        )
      );

      setStudents((list) => list.map((item) => ({ ...item, reminded: true })));

      toast({
        title: `批量提醒已发送，共 ${unremindedCount} 位学生`,
        status: 'success',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      console.error('handleBatchProcess - 批量提醒失败:', error);
      toast({
        title: '批量提醒失败',
        description: error instanceof Error ? error.message : '批量提醒失败，请重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const handleViewStudent = (student: StudentTodo) => {
    setSelectedStudent(student);
    setIsStudentDetailOpen(true);
  };

  const handleCloseStudentDetail = () => {
    setIsStudentDetailOpen(false);
    setSelectedStudent(null);
  };

  const doTogglePublish = async (currentAvatar: AvatarCard) => {
    const teacherId = user?.teacherId;
    if (!teacherId) {
      console.error('doTogglePublish - teacherId 不存在');
      return;
    }

    const id = currentAvatar.id;
    const isPublishing = currentAvatar.status !== 'running';
    const newStatus = isPublishing ? 1 : 0;

    try {
      await updateAiAvatarStatus({
        id: Number(id),
        status: newStatus,
        teacherId
      });

      setAvatars((list) =>
        list.map((item) => {
          if (item.id !== id) {
            return item;
          }

          if (item.status === 'running') {
            return {
              ...item,
              status: 'pending'
            };
          }

          return {
            ...item,
            status: 'running'
          };
        })
      );

      const nextStatus = currentAvatar.status === 'running' ? 'pending' : 'running';
      updateStoredAvatarStatus(id, nextStatus, user?.id);

      const message =
        currentAvatar.status === 'running'
          ? '已取消发布'
          : currentAvatar.status === 'expired'
            ? '已重新发布'
            : '发布成功';

      toast({
        title: message,
        status: 'success',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });
    } catch (error: any) {
      console.error('doTogglePublish - 更新状态失败:', error);
      const errorMessage = error?.message || error?.msg || '请稍后重试';
      toast({
        title: '操作失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const handleTogglePublish = (id: string) => {
    const currentAvatar = avatars.find((item) => item.id === id);
    if (!currentAvatar) {
      return;
    }

    if (currentAvatar.status === 'running') {
      setCancelPublishTarget(currentAvatar);
      setIsCancelPublishOpen(true);
    } else {
      doTogglePublish(currentAvatar);
    }
  };

  const handleConfirmCancelPublish = async () => {
    if (!cancelPublishTarget) {
      return;
    }
    setIsCancelPublishOpen(false);
    try {
      await doTogglePublish(cancelPublishTarget);
    } finally {
      setCancelPublishTarget(null);
    }
  };

  const handleCloseCancelPublish = () => {
    setIsCancelPublishOpen(false);
    setCancelPublishTarget(null);
  };

  const handleDeleteClick = (id: string) => {
    const target = avatars.find((item) => item.id === id);
    if (!target) {
      return;
    }
    setDeleteTarget(target);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const teacherId = user?.teacherId;
    if (!teacherId) {
      console.error('handleConfirmDelete - teacherId 不存在');
      return;
    }

    try {
      await deleteAiAvatar({
        id: Number(deleteTarget.id),
        teacherId
      });

      toast({
        title: '删除成功',
        status: 'success',
        duration: 1800,
        isClosable: true,
        position: 'top'
      });

      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error: any) {
      console.error('handleConfirmDelete - 删除失败:', error);
      const errorMessage = error?.message || error?.msg || '请稍后重试';
      toast({
        title: '删除失败',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    try {
      await loadHomeData();
    } catch (error) {
      console.error('handleConfirmDelete - 刷新列表失败:', error);
      toast({
        title: '删除成功，但刷新列表失败',
        description: '请刷新页面查看最新数据',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  return {
    activeTab,
    setActiveTab,
    suggestions,
    newsSuggestions,
    optimizationSuggestions,
    graphSuggestions,
    students,
    unremindedCount,
    avatars,
    visibleAvatars,
    statsData,
    isLoading,
    selectedStudent,
    isStudentDetailOpen,
    remindStudent,
    isRemindModalOpen,
    showPlaceholderToast,
    handleSuggestionAction,
    handleMarkAllNewsRead,
    handleRemindStudent,
    handleBatchProcess,
    handleViewStudent,
    handleCloseStudentDetail,
    handleOpenRemindModal,
    handleConfirmRemind,
    handleCloseRemindModal,
    handleTogglePublish,
    deleteTarget,
    isDeleteModalOpen,
    handleDeleteClick,
    handleConfirmDelete,
    handleCloseDeleteModal,
    cancelPublishTarget,
    isCancelPublishOpen,
    handleConfirmCancelPublish,
    handleCloseCancelPublish
  };
}
