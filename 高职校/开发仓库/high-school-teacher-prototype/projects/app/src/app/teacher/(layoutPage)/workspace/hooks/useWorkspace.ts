import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  getAiTeacherTeachingContent,
  getAiTeacherCourseOverview,
  getAiTeacherSuggestions,
  batchMarkSuggestionsRead
} from '@/teacher/api/aiTeacher';
import type {
  TeachingContentVO,
  TeachingContentCourseVO,
  CourseOverviewVO,
  AiSuggestion
} from '@/teacher/types/aiTeacher';
import { useAuth } from '@/app/components/auth/AuthProvider';
import type { WorkspaceTabKey } from '../constants';

const NEWS_SUGGESTION_TYPE = 1;

export function useWorkspace() {
  const toast = useToast();
  const router = useRouter();
  const { t } = useTranslation('teacher');
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<WorkspaceTabKey>('teaching-content');

  // 授课内容
  const [teachingContent, setTeachingContent] = useState<TeachingContentVO>({
    courseCount: 0,
    courses: []
  });
  const [isTeachingLoading, setIsTeachingLoading] = useState(false);
  const [selectedTeachingTaskId, setSelectedTeachingTaskId] = useState<number | null>(null);

  // 课程教学概况(按 teachingTaskId 缓存)
  const [overviewCache, setOverviewCache] = useState<Record<number, CourseOverviewVO>>({});
  const [overviewLoadingTaskId, setOverviewLoadingTaskId] = useState<number | null>(null);

  // AI 资讯
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [newsDetail, setNewsDetail] = useState<AiSuggestion | null>(null);
  const [isNewsListOpen, setIsNewsListOpen] = useState(false);
  const [isMarkingAllNewsRead, setIsMarkingAllNewsRead] = useState(false);

  const teacherId = user?.teacherId;

  const loadTeachingContent = useCallback(async () => {
    if (!teacherId) return;
    setIsTeachingLoading(true);
    try {
      const data = await getAiTeacherTeachingContent({ teacherId });
      setTeachingContent(data || { courseCount: 0, courses: [] });
      if (data?.courses?.length) {
        setSelectedTeachingTaskId((prev) => prev ?? data.courses[0].teachingTaskId);
      }
    } catch (error) {
      console.error('useWorkspace - loadTeachingContent 失败:', error);
    } finally {
      setIsTeachingLoading(false);
    }
  }, [teacherId]);

  const loadCourseOverview = useCallback(
    async (teachingTaskId: number) => {
      if (overviewCache[teachingTaskId]) return;
      setOverviewLoadingTaskId(teachingTaskId);
      try {
        const data = await getAiTeacherCourseOverview({ teachingTaskId });
        setOverviewCache((prev) => ({ ...prev, [teachingTaskId]: data }));
      } catch (error) {
        console.error('useWorkspace - loadCourseOverview 失败:', error);
      } finally {
        setOverviewLoadingTaskId((curr) => (curr === teachingTaskId ? null : curr));
      }
    },
    [overviewCache]
  );

  // 按当前选中课程的 tenantCourseId 拉取资讯;tenantCourseId 为空时不带该参数(返回全部)
  const loadSuggestions = useCallback(
    async (tenantCourseId?: number) => {
      if (!teacherId) return;
      setIsNewsLoading(true);
      try {
        const list = await getAiTeacherSuggestions({ teacherId, tenantCourseId });
        setSuggestions(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('useWorkspace - loadSuggestions 失败:', error);
      } finally {
        setIsNewsLoading(false);
      }
    },
    [teacherId]
  );

  useEffect(() => {
    loadTeachingContent();
  }, [loadTeachingContent]);

  useEffect(() => {
    if (selectedTeachingTaskId == null) return;
    loadCourseOverview(selectedTeachingTaskId);
  }, [selectedTeachingTaskId, loadCourseOverview]);

  const selectedCourse = useMemo<TeachingContentCourseVO | null>(() => {
    if (selectedTeachingTaskId == null) return null;
    return teachingContent.courses.find((c) => c.teachingTaskId === selectedTeachingTaskId) ?? null;
  }, [teachingContent.courses, selectedTeachingTaskId]);

  // 选中课程变化时(含初始化时选中默认课程)按其 tenantCourseId 重新拉取资讯
  // 默认课程未就绪前不请求,确保首次请求即带上默认课程的 tenantCourseId
  useEffect(() => {
    const tenantCourseId = selectedCourse?.tenantCourseId;
    if (tenantCourseId == null) return;
    loadSuggestions(tenantCourseId);
  }, [selectedCourse?.tenantCourseId, loadSuggestions]);

  // AI 资讯:后端已按 tenantCourseId 过滤,前端仅保留 news 类型过滤
  const currentNews = useMemo(
    () => suggestions.filter((s) => s.suggestionType === NEWS_SUGGESTION_TYPE),
    [suggestions]
  );

  // 卡片最多展示 4 条
  const currentNewsTop2 = useMemo(() => currentNews.slice(0, 4), [currentNews]);
  // 弹窗内最多展示 9 条
  const currentNewsTop9 = useMemo(() => currentNews.slice(0, 9), [currentNews]);

  const currentOverview = useMemo<CourseOverviewVO | null>(() => {
    if (selectedTeachingTaskId == null) return null;
    return overviewCache[selectedTeachingTaskId] ?? null;
  }, [overviewCache, selectedTeachingTaskId]);

  const handleSelectTeachingTask = useCallback((teachingTaskId: number) => {
    setSelectedTeachingTaskId(teachingTaskId);
  }, []);

  const handleMarkNewsRead = useCallback(
    async (id: number) => {
      if (!teacherId) return;
      try {
        await batchMarkSuggestionsRead({ teacherId, suggestionIds: [id] });
        setSuggestions((list) =>
          list.map((item) => (item.id === id ? { ...item, isRead: 1 } : item))
        );
        toast({
          title: t('workspace.toasts.marked_read'),
          status: 'success',
          duration: 1500,
          position: 'top'
        });
      } catch (error) {
        console.error('useWorkspace - handleMarkNewsRead 失败:', error);
        toast({
          title: t('workspace.toasts.mark_read_failed'),
          status: 'error',
          duration: 2000,
          position: 'top'
        });
      }
    },
    [teacherId, toast, t]
  );

  const openNewsList = useCallback(() => setIsNewsListOpen(true), []);
  const closeNewsList = useCallback(() => setIsNewsListOpen(false), []);

  const handleMarkAllNewsRead = useCallback(async () => {
    if (!teacherId) return;
    const unreadIds = currentNewsTop9.filter((item) => item.isRead !== 1).map((item) => item.id);
    if (unreadIds.length === 0) return;
    setIsMarkingAllNewsRead(true);
    try {
      await batchMarkSuggestionsRead({ teacherId, suggestionIds: unreadIds });
      const unreadSet = new Set(unreadIds);
      setSuggestions((list) =>
        list.map((item) => (unreadSet.has(item.id) ? { ...item, isRead: 1 } : item))
      );
      toast({
        title: t('workspace.toasts.marked_all_read'),
        status: 'success',
        duration: 1500,
        position: 'top'
      });
    } catch (error) {
      console.error('useWorkspace - handleMarkAllNewsRead 失败:', error);
      toast({
        title: t('workspace.toasts.mark_read_failed'),
        status: 'error',
        duration: 2000,
        position: 'top'
      });
    } finally {
      setIsMarkingAllNewsRead(false);
    }
  }, [teacherId, currentNewsTop9, toast, t]);

  const showComingSoon = useCallback(() => {
    toast({
      title: t('workspace.toasts.coming_soon'),
      status: 'info',
      duration: 1500,
      position: 'top'
    });
  }, [toast, t]);

  const handleStartClass = useCallback(() => {
    if (!selectedCourse) return;
    if (selectedCourse.latestAvatarId != null) {
      router.push(`/teacher/aiTeacher/avatar/detail?id=${selectedCourse.latestAvatarId}`);
    } else {
      router.push('/teacher/aiTeacher/avatar/create');
    }
  }, [router, selectedCourse]);

  return {
    user,
    activeTab,
    setActiveTab,

    teachingContent,
    isTeachingLoading,
    selectedTeachingTaskId,
    selectedCourse,
    handleSelectTeachingTask,

    currentOverview,
    isOverviewLoading: overviewLoadingTaskId !== null,

    currentNews,
    currentNewsTop2,
    currentNewsTop9,
    isNewsLoading,
    newsDetail,
    setNewsDetail,
    handleMarkNewsRead,

    isNewsListOpen,
    openNewsList,
    closeNewsList,
    handleMarkAllNewsRead,
    isMarkingAllNewsRead,

    showComingSoon,
    handleStartClass
  };
}
