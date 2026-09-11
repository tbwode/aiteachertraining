'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode, type SVGProps } from 'react';
import { Box, Flex, Image, Spinner, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import Empty from '@/app/components/ui/Empty';
import { useAuth } from '@/app/components/auth';
import { getStudentCourseDetail } from '@/api/student/student';
import {
  postStudentNotificationPage,
  postStudentNotificationRead,
  postStudentNotificationReadAll,
  postStudentNotificationUnreadNum
} from '@/student/api/notice';
import {
  StudentNotificationModuleCodeEnum,
  StudentNotificationReadStatusEnum,
  StudentNotificationTypeCodeEnum,
  type NotificationExtensionParams,
  type StudentNotificationRecord
} from '@/student/types/notice';

const PAGE_SIZE = 10;
const ACTIVE_COLOR = '#D7000F';

// ─── 通知类型图标 ───

type IconProps = SVGProps<SVGSVGElement>;

function BookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 19.5V6.5A2.5 2.5 0 0 1 6.5 4H20v13H6.5A2.5 2.5 0 0 0 4 19.5Z" />
      <path d="M8 8h8" />
      <path d="M8 12h5" />
    </svg>
  );
}

function StudyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M6 10.5V15l6 3 6-3v-4.5" />
    </svg>
  );
}

function MessageIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function ShieldNoticeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
      <path d="M9.5 12h5" />
      <path d="M12 9.5v5" />
    </svg>
  );
}

function BellNoticeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function HomeworkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14h6" />
      <path d="M9 18h4" />
    </svg>
  );
}

function ResourceIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function AppCenterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function GroupIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WorksheetIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h2" />
      <path d="M14 13h2" />
      <path d="M8 17h2" />
      <path d="M14 17h2" />
    </svg>
  );
}

function TeamIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 2L2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function ChevronLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// ─── 类型 Tab 配置 ───

type TabValue = 'all' | 'unread' | StudentNotificationTypeCodeEnum;

type NoticeTypeTabConfig = {
  type: StudentNotificationTypeCodeEnum;
  Icon: (props: IconProps) => JSX.Element;
};

type NoticeModuleTabConfig = {
  type: StudentNotificationModuleCodeEnum;
  Icon: (props: IconProps) => JSX.Element;
};

const noticeTypeTabs: NoticeTypeTabConfig[] = [
  // { type: StudentNotificationTypeCodeEnum.HOMEWORK, Icon: HomeworkIcon },
  // { type: StudentNotificationTypeCodeEnum.RESOURCE, Icon: ResourceIcon },
  // { type: StudentNotificationTypeCodeEnum.STUDENT_HOMEWORK, Icon: HomeworkIcon },
  // { type: StudentNotificationTypeCodeEnum.APP_CENTER, Icon: AppCenterIcon },
  // { type: StudentNotificationTypeCodeEnum.APP_CENTER_NEWS, Icon: AppCenterIcon },
  // { type: StudentNotificationTypeCodeEnum.RESOURCE_NEWS, Icon: ResourceIcon },
  // { type: StudentNotificationTypeCodeEnum.GROUP, Icon: GroupIcon },
  // { type: StudentNotificationTypeCodeEnum.WORKSHEET, Icon: WorksheetIcon },
  // { type: StudentNotificationTypeCodeEnum.TEAM, Icon: TeamIcon },
  { type: StudentNotificationTypeCodeEnum.COURSE, Icon: StudyIcon }
];

const noticeModuleTabs: NoticeModuleTabConfig[] = [
  { type: StudentNotificationModuleCodeEnum.HOMEWORK_DEADLINE, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.HOMEWORK_SUBMIT, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.AI_CORRECTION_PROGRESS, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.AI_CORRECTION_COMPLETE, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.STUDENT_CORRECTION_SUBMIT, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.STUDENT_CORRECTION_COMPLETE, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.RESOURCE_REJECTION, Icon: ResourceIcon },
  { type: StudentNotificationModuleCodeEnum.STUDENT_HOMEWORK_PUBLISHED, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.STUDENT_HOMEWORK_SUBMITTED, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.STUDENT_HOMEWORK_REVIEWED, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.STUDENT_HOMEWORK_OVERDUE, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.SHARE_APP_INVITE, Icon: AppCenterIcon },
  { type: StudentNotificationModuleCodeEnum.STUDENT_HOMEWORK_UPDATE_SU, Icon: HomeworkIcon },
  { type: StudentNotificationModuleCodeEnum.RESOURCE_REVIEW_NO_PASS, Icon: ResourceIcon },
  { type: StudentNotificationModuleCodeEnum.APP_CENTER_NEWS, Icon: AppCenterIcon },
  { type: StudentNotificationModuleCodeEnum.RESOURCE_NEWS, Icon: ResourceIcon },
  { type: StudentNotificationModuleCodeEnum.GROUP_EXTERNAL_APPLICATION_RI, Icon: GroupIcon },
  { type: StudentNotificationModuleCodeEnum.GROUP_EXTERNAL_APPLICATION_AI, Icon: GroupIcon },
  { type: StudentNotificationModuleCodeEnum.GROUP_RESOURCE_REMOVED, Icon: GroupIcon },
  { type: StudentNotificationModuleCodeEnum.GROUP_EXTERNAL_APPLICATION_TK, Icon: GroupIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_WORKSHEET_PUBLISHED, Icon: WorksheetIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_WORKSHEET_STRUCTURE, Icon: WorksheetIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_WORKSHEET_TASK_LATE, Icon: WorksheetIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_WORKSHEET_TASK_24LA1, Icon: WorksheetIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_WORKSHEET_TASK_URGE, Icon: WorksheetIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_WORKSHEET_TASK_CORR, Icon: WorksheetIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_WORKSHEET_TASK_REOR, Icon: WorksheetIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_TEAM_JOIN, Icon: TeamIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_TEAM_LEADER, Icon: TeamIcon },
  { type: StudentNotificationModuleCodeEnum.SUTDENT_TEAM_CORRECTION, Icon: TeamIcon },
  { type: StudentNotificationModuleCodeEnum.AI_ADMINISTRATION_NOTICE, Icon: ShieldNoticeIcon },
  { type: StudentNotificationModuleCodeEnum.STUDY_REMIND, Icon: StudyIcon },
  { type: StudentNotificationModuleCodeEnum.SELECT_SUCCESS, Icon: BellNoticeIcon }
];

// ─── 工具函数 ───

function isNoticeRead(notice: StudentNotificationRecord) {
  return notice.readStatus === StudentNotificationReadStatusEnum.READ;
}

function formatFriendlyTime(timeStr?: string): string {
  if (!timeStr) return '--';
  const date = dayjs(timeStr);
  if (!date.isValid()) return '--';

  const now = dayjs();
  const diffDays = now.startOf('day').diff(date.startOf('day'), 'day');

  if (diffDays === 0) return `今天 ${date.format('HH:mm')}`;
  if (diffDays === 1) return `昨天 ${date.format('HH:mm')}`;
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  return date.format('YYYY-MM-DD HH:mm');
}

function getTypeIcon(typeCode?: string) {
  const tab = noticeTypeTabs.find((t) => t.type === typeCode);
  return tab ? tab.Icon : BellNoticeIcon;
}

function getExtensionParamString(
  extensionParams: NotificationExtensionParams | undefined,
  key: string
) {
  const value = extensionParams?.[key];
  if (value === null || value === undefined) return '';
  return String(value);
}

function buildStudyRemindCourseDetailUrl(params: {
  avatarId: string | number;
  courseId: string | number;
  teachingTaskId: string | number;
  majorName?: string;
  teacherName?: string;
  hours?: number;
}) {
  const searchParams = new URLSearchParams({
    avatarId: String(params.avatarId),
    courseId: String(params.courseId),
    teachingTaskId: String(params.teachingTaskId),
    majorName: params.majorName || '',
    teacherName: params.teacherName || '',
    hours: params.hours != null ? String(params.hours) : ''
  });

  return `/student/course-detail?${searchParams.toString()}`;
}

// ─── 分页工具 ───

type PaginationItem = { type: 'page' | 'ellipsis'; value: number | string };

function buildPaginationItems(current: number, pages: number): PaginationItem[] {
  if (pages <= 1) return [{ type: 'page', value: 1 }];

  const pageSet = new Set<number>([1, pages, current - 1, current, current + 1]);
  const pageNumbers = Array.from(pageSet)
    .filter((page) => page >= 1 && page <= pages)
    .sort((a, b) => a - b);

  const items: PaginationItem[] = [];

  pageNumbers.forEach((page, index) => {
    const previous = pageNumbers[index - 1];
    if (previous !== undefined && page - previous > 1) {
      items.push({ type: 'ellipsis', value: `ellipsis-${previous}-${page}` });
    }
    items.push({ type: 'page', value: page });
  });

  return items;
}

// ─── 主组件 ───

export function NoticeListPageClient() {
  const { t } = useTranslation('student');
  const { user } = useAuth();
  const receiverId = Number(user?.id);
  const hasValidReceiverId = Number.isFinite(receiverId) && receiverId > 0;

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [notifications, setNotifications] = useState<StudentNotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [readingNoticeId, setReadingNoticeId] = useState<number | null>(null);
  const [unreadNum, setUnreadNum] = useState(0);

  const { runAsync: fetchUnreadNum } = useRequest2(postStudentNotificationUnreadNum, {
    errorToast: ''
  });
  const { runAsync: markRead } = useRequest2(
    (notificationId: number) => postStudentNotificationRead({ notificationId, receiverId }),
    { errorToast: '' }
  );
  const { runAsync: markAllRead, loading: isMarkingAllRead } = useRequest2(
    postStudentNotificationReadAll,
    { errorToast: '' }
  );

  // 加载列表数据
  useEffect(() => {
    if (!hasValidReceiverId) {
      setNotifications([]);
      setTotal(0);
      setPages(1);
      setLoading(false);
      setError('');
      return;
    }

    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const params: Record<string, unknown> = {
          current: currentPage,
          size: PAGE_SIZE,
          receiverId,
          descs: 'notificationTime'
        };

        if (activeTab === 'unread') {
          params.readStatus = StudentNotificationReadStatusEnum.UNREAD;
        } else if (activeTab !== 'all') {
          params.typeCode = activeTab;
        }

        const result = await postStudentNotificationPage(
          params as Parameters<typeof postStudentNotificationPage>[0]
        );

        if (!active) return;

        setNotifications(result.records || []);
        setTotal(Number(result.total ?? 0));
        setPages(Math.max(1, Number(result.pages ?? 1)));
      } catch {
        if (!active) return;
        setNotifications([]);
        setTotal(0);
        setPages(1);
        setError(t('noticeList.loadError'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [currentPage, activeTab, refreshIndex, hasValidReceiverId, receiverId, t]);

  // 获取未读数量
  useEffect(() => {
    if (!hasValidReceiverId) {
      setUnreadNum(0);
      return;
    }
    fetchUnreadNum()
      .then((num) => {
        setUnreadNum(Number(num) ?? 0);
      })
      .catch(() => {
        setUnreadNum(0);
      });
  }, [refreshIndex, hasValidReceiverId, fetchUnreadNum]);

  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, pages),
    [currentPage, pages]
  );

  const handleTabChange = useCallback((tab: TabValue) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleReadNotice = useCallback(
    async (notice: StudentNotificationRecord) => {
      if (isNoticeRead(notice)) return;
      setReadingNoticeId(notice.id);
      try {
        await markRead(notice.id);
        setNotifications((list) =>
          list.map((item) =>
            item.id === notice.id
              ? { ...item, readStatus: StudentNotificationReadStatusEnum.READ }
              : item
          )
        );
        setUnreadNum((n) => Math.max(0, n - 1));
        // 触发全局事件，通知 StudentLayout 刷新未读数量
        window.dispatchEvent(new CustomEvent('student-notification-read'));
      } finally {
        setReadingNoticeId(null);
      }
    },
    [markRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    setNotifications((list) =>
      list.map((item) => ({ ...item, readStatus: StudentNotificationReadStatusEnum.READ }))
    );
    setRefreshIndex((v) => v + 1);
    // 触发全局事件，通知 StudentLayout 刷新未读数量
    window.dispatchEvent(new CustomEvent('student-notification-read'));
  }, [markAllRead]);

  const tabConfigs: { key: TabValue; label: string }[] = useMemo(
    () => [
      { key: 'all', label: t('noticeList.filterAll') },
      { key: 'unread', label: t('noticeList.filterUnread') },
      ...noticeTypeTabs.map((tab) => ({
        key: tab.type as TabValue,
        label: t(`noticeList.typeLabels.${tab.type}`)
      }))
    ],
    [t]
  );

  return (
    <Box pb="28px" maxW="1128px">
      {/* 标题区 */}
      <Flex align="center" justify="space-between" mb="16px" minH="48px">
        <Flex align="center" gap="8px">
          <Image src="/imgs/app/student/notice.svg" alt="" w="54px" h="54px" />
          <Text fontSize="22px" lineHeight="1.1" fontWeight={700} color="#C8000B" ml="10px">
            {t('noticeList.title')}
          </Text>
        </Flex>
        <Button
          h="32px"
          px="16px"
          borderRadius="8px"
          bg="transparent"
          boxShadow="none"
          color="#333"
          border="1px solid #333"
          fontSize="13px"
          fontWeight={500}
          leftIcon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4.12479 6.18718L10.312 0L11.1369 0.824958L4.12479 7.8371L0 3.71231L0.824958 2.88735L4.12479 6.18718Z"
                fill="#333333"
              />
            </svg>
          }
          _hover={{ borderColor: '#333' }}
          _active={{ borderColor: '#333' }}
          onClick={() => void handleMarkAllRead()}
          isLoading={isMarkingAllRead}
          loadingText={t('noticeList.reading')}
        >
          {t('noticeList.markAllRead')}
        </Button>
      </Flex>

      {/* Tab 导航 */}
      <Flex gap="8px" mb="16px">
        {tabConfigs.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = (tab.key === 'all' || tab.key === 'unread') && unreadNum > 0;
          return (
            <Box
              key={tab.key}
              as="button"
              type="button"
              px="16px"
              py="8px"
              borderRadius="12px"
              fontSize="14px"
              fontWeight={500}
              color={isActive ? ACTIVE_COLOR : '#4E5969'}
              bg={isActive ? '#FFF1F0' : 'transparent'}
              whiteSpace="nowrap"
              cursor="pointer"
              border="none"
              transition="all 0.2s ease"
              _hover={{
                bg: isActive ? '#FFE8E6' : '#E8EBF0',
                color: isActive ? ACTIVE_COLOR : '#333'
              }}
              onClick={() => handleTabChange(tab.key)}
            >
              <Flex align="center" gap="4px">
                {tab.label}
                {showBadge && (
                  <Box
                    minW="18px"
                    h="18px"
                    px="5px"
                    borderRadius="9px"
                    bg={isActive ? '#FFF' : '#FFECED'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    ml="5px"
                  >
                    <Text fontSize="11px" fontWeight={600} color="#C8000B" lineHeight="1">
                      {unreadNum > 99 ? '99+' : unreadNum}
                    </Text>
                  </Box>
                )}
              </Flex>
            </Box>
          );
        })}
      </Flex>

      {/* 加载中 */}
      {loading ? (
        <Box minH="278px" w="100%" display="flex" alignItems="center" justifyContent="center">
          <Flex direction="column" align="center" gap="12px" color="#6B7280">
            <Spinner color={ACTIVE_COLOR} thickness="3px" />
            <Text fontSize="14px">{t('common.loading')}</Text>
          </Flex>
        </Box>
      ) : error ? (
        /* 错误状态 */
        <Box
          minH="278px"
          w="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          px="24px"
        >
          <Flex direction="column" align="center" gap="12px">
            <Text fontSize="14px" color="#6B7280">
              {error}
            </Text>
            <Button
              h="38px"
              px="20px"
              borderRadius="10px"
              bg={ACTIVE_COLOR}
              color="#FFFFFF"
              _hover={{ bg: '#BF000D' }}
              onClick={() => setRefreshIndex((v) => v + 1)}
            >
              {t('noticeList.retry')}
            </Button>
          </Flex>
        </Box>
      ) : notifications.length === 0 ? (
        /* 空状态 */
        <Empty imageSize={140} />
      ) : (
        <>
          {/* 通知列表 */}
          <Flex direction="column" gap="15px" bg="#fff" p="20px" borderRadius="16px">
            {notifications.map((notice) => (
              <NoticeCardItem
                key={notice.id}
                notice={notice}
                isReading={readingNoticeId === notice.id}
                onMarkRead={handleReadNotice}
                t={t}
              />
            ))}
          </Flex>

          {/* 分页 */}
          {pages > 1 && (
            <Flex justify="center" align="center" gap="6px" mt="24px">
              <IconPageButton
                ariaLabel={t('noticeList.pagination.previous')}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeftIcon width="14px" height="14px" />
              </IconPageButton>

              {paginationItems.map((item) =>
                item.type === 'ellipsis' ? (
                  <Text key={item.value} mx="6px" fontSize="12px" color="#9CA3AF">
                    ...
                  </Text>
                ) : (
                  <PageButton
                    key={item.value}
                    active={item.value === currentPage}
                    onClick={() => setCurrentPage(item.value as number)}
                  >
                    {item.value as number}
                  </PageButton>
                )
              )}

              <IconPageButton
                ariaLabel={t('noticeList.pagination.next')}
                disabled={currentPage >= pages}
                onClick={() => setCurrentPage((p) => Math.min(pages, p + 1))}
              >
                <ChevronRightIcon width="14px" height="14px" />
              </IconPageButton>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
}

// ─── 通知卡片 ───

function NoticeCardItem({
  notice,
  isReading,
  onMarkRead,
  t
}: {
  notice: StudentNotificationRecord;
  isReading: boolean;
  onMarkRead: (notice: StudentNotificationRecord) => Promise<void>;
  t: ReturnType<typeof useTranslation<'student'>>['t'];
}) {
  const router = useRouter();
  const read = isNoticeRead(notice);
  const isStudyRemindNotice = notice.moduleCode === StudentNotificationModuleCodeEnum.STUDY_REMIND;
  const isSelectSuccessNotice =
    notice.moduleCode === StudentNotificationModuleCodeEnum.SELECT_SUCCESS;
  const shouldShowBottomAction = isStudyRemindNotice || isSelectSuccessNotice;
  const matchedModuleTab = noticeModuleTabs.find((item) => item.type === notice.moduleCode);
  const matchedModuleCode = matchedModuleTab?.type;
  const NoticeIcon = matchedModuleTab?.Icon || getTypeIcon(notice.typeCode);
  const friendlyTime = formatFriendlyTime(notice.notificationTime || notice.createTime);
  const displayTitle = matchedModuleCode
    ? t(`noticeList.moduleLabels.${matchedModuleCode}` as const)
    : notice.title || t('noticeList.defaultTitle');
  const bottomActionLabel = isStudyRemindNotice
    ? t('noticeList.startStudy')
    : t('noticeList.viewDetailText');
  const [navigating, setNavigating] = useState(false);
  const { toast } = useToast();
  const handleBottomActionClick = async () => {
    if (isReading || navigating) return;

    setNavigating(true);
    try {
      // 从 extensionParams 获取 avatarId，调用详情接口拿到完整字段
      const avatarId = getExtensionParamString(notice.extensionParams, 'avatarId');
      const courseId = getExtensionParamString(notice.extensionParams, 'courseId');
      const teachingTaskId = getExtensionParamString(notice.extensionParams, 'teachingTaskId');

      const detail = await getStudentCourseDetail({
        avatarId: Number(avatarId)
      });

      if (!detail || !detail.courseName) {
        toast({ status: 'warning', title: '课程不存在' });
        return;
      }

      if (!read) {
        await onMarkRead(notice);
      }

      router.push(
        buildStudyRemindCourseDetailUrl({
          avatarId: detail.avatarId ?? avatarId,
          courseId: detail.courseId ?? courseId,
          teachingTaskId: detail.teachingTaskId ?? teachingTaskId,
          majorName: detail.majorName,
          teacherName: detail.teacherName,
          hours: detail.hours
        })
      );
    } catch (err) {
      console.error('获取课程详情失败:', err);
    } finally {
      setNavigating(false);
    }
  };

  return (
    <Box
      bg="#F7F8FA"
      borderRadius="12px"
      p="16px"
      transition="box-shadow 0.2s ease"
      _hover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
    >
      <Flex gap="12px" align="center">
        {/* 左侧图标 */}
        <Flex
          w="40px"
          h="40px"
          borderRadius="12px"
          bg="#FFF1F0"
          color={ACTIVE_COLOR}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <NoticeIcon width="20px" height="20px" />
        </Flex>

        {/* 内容 */}
        <Box flex="1" minW={0}>
          {/* 标题行 */}
          <Flex align="center" justify="space-between" gap="8px" mb="4px">
            <Flex align="center" gap="6px" minW={0}>
              <Text fontSize="15px" fontWeight={600} color="#333" noOfLines={1}>
                {displayTitle}
              </Text>
              {!read && <Box w="6px" h="6px" rounded="full" bg={ACTIVE_COLOR} flexShrink={0} />}
            </Flex>
            <Text fontSize="12px" color="#86909C" flexShrink={0}>
              {friendlyTime}
            </Text>
          </Flex>

          {/* 正文 + 标记已读 */}
          <Flex align="flex-end" justify="space-between">
            <Text
              fontSize="14px"
              lineHeight="22px"
              color="#86909C"
              noOfLines={2}
              flex={1}
              mr="12px"
            >
              {notice.content || '--'}
            </Text>

            {!shouldShowBottomAction && !read && (
              <Text
                fontSize="13px"
                color={ACTIVE_COLOR}
                cursor="pointer"
                fontWeight={500}
                flexShrink={0}
                _hover={{ textDecoration: 'underline' }}
                onClick={() => void onMarkRead(notice)}
              >
                {isReading ? t('noticeList.reading') : t('noticeList.markRead')}
              </Text>
            )}
          </Flex>
        </Box>
      </Flex>

      {shouldShowBottomAction && (
        <Flex
          as="button"
          type="button"
          mt="12px"
          w="100%"
          borderRadius="12px"
          bg="#FFF"
          px="58px"
          py="12px"
          align="center"
          justify="center"
          gap="4px"
          color={ACTIVE_COLOR}
          border="none"
          cursor={navigating || isReading ? 'not-allowed' : 'pointer'}
          opacity={navigating || isReading ? 0.6 : 1}
          transition="all 0.2s ease"
          _hover={{ bg: navigating || isReading ? '#FFF' : '#FFF5F5' }}
          _active={{ bg: navigating || isReading ? '#FFF' : '#FFE8E6' }}
          onClick={() => void handleBottomActionClick()}
        >
          {navigating ? <Spinner size="xs" color={ACTIVE_COLOR} mr="4px" /> : null}
          <Text fontSize="14px" fontWeight={500} color={ACTIVE_COLOR}>
            {navigating ? t('common.loading') : bottomActionLabel}
          </Text>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M6 12L10 8L6 4"
              stroke="#C8000B"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Flex>
      )}
    </Box>
  );
}

// ─── 分页组件 ───

function PageButton({
  children,
  active,
  onClick
}: {
  children: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      minW="42px"
      h="36px"
      px="0"
      borderRadius="10px"
      bg={active ? '#D7000F' : 'transparent'}
      color={active ? '#FFFFFF' : '#6B7280'}
      fontSize="14px"
      fontWeight={600}
      boxShadow="none"
      border="1px solid #F2F4F7"
      _hover={{ bg: active ? '#D7000F' : '#F3F4F6' }}
      _active={{ bg: active ? '#C00' : '#E5E7EB' }}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function IconPageButton({
  children,
  disabled,
  ariaLabel,
  onClick
}: {
  children: ReactNode;
  disabled: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <Button
      aria-label={ariaLabel}
      minW="36px"
      h="36px"
      px="0"
      borderRadius="8px"
      bg="transparent"
      color={disabled ? '#D1D5DB' : '#6B7280'}
      _hover={{ bg: disabled ? 'transparent' : '#F3F4F6' }}
      isDisabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
