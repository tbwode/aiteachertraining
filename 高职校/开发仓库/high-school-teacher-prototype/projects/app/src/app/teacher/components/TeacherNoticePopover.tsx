'use client';

import { useCallback, useEffect, useMemo, useState, type SVGProps } from 'react';
import { Box, Button, Flex, Spinner, Text, VStack, type BoxProps } from '@chakra-ui/react';
import dayjs from 'dayjs';
import MyPopover from '@fastgpt/web/components/common/MyPopover';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useTranslation } from 'react-i18next';
import SvgIcon from '@/app/components/ui/SvgIcon';
import { useAuth } from '@/app/components/auth';
import {
  postTeacherNotificationPage,
  postTeacherNotificationRead,
  postTeacherNotificationReadAll,
  postTeacherNotificationUnreadNum
} from '@/teacher/api/notice';
import {
  TeacherNotificationReadStatusEnum,
  TeacherNotificationTypeCodeEnum,
  type TeacherNotificationRecord
} from '@/teacher/types/notice';

const NOTICE_PAGE_SIZE = 50;
const NOTICE_PANEL_WIDTH = '480px';
const NOTICE_PANEL_HEIGHT = '360px';
const NOTICE_ACTIVE_COLOR = '#7D4DFF';
const NOTICE_ACTIVE_BG = '#F2EDFF';

type TeacherNoticePopoverProps = {
  accentColor: string;
} & BoxProps;

type NoticeTypeIconProps = SVGProps<SVGSVGElement>;

function BookIcon(props: NoticeTypeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 19.5V6.5A2.5 2.5 0 0 1 6.5 4H20v13H6.5A2.5 2.5 0 0 0 4 19.5Z" />
      <path d="M8 8h8" />
      <path d="M8 12h5" />
    </svg>
  );
}

function StudyIcon(props: NoticeTypeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M6 10.5V15l6 3 6-3v-4.5" />
    </svg>
  );
}

function MessageIcon(props: NoticeTypeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function ShieldNoticeIcon(props: NoticeTypeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
      <path d="M9.5 12h5" />
      <path d="M12 9.5v5" />
    </svg>
  );
}

function ClockIcon(props: NoticeTypeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function RefreshIcon(props: NoticeTypeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function BellNoticeIcon(props: NoticeTypeIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

type NoticeTabConfig = {
  type: TeacherNotificationTypeCodeEnum;
  color: string;
};

type NoticeCardProps = {
  title: string;
  content: string;
  time: string;
  showUnreadDot?: boolean;
  actionButton?: React.ReactNode;
};

const noticeTabConfigs: NoticeTabConfig[] = [
  // {
  //   type: TeacherNotificationTypeCodeEnum.COURSE,
  //   color: '#3182CE'
  // },
  // {
  //   type: TeacherNotificationTypeCodeEnum.COURSE_STUDY,
  //   color: '#0891B2'
  // },
  // {
  //   type: TeacherNotificationTypeCodeEnum.AI_REPLY,
  //   color: '#805AD5'
  // },
  // {
  //   type: TeacherNotificationTypeCodeEnum.SYSTEM,
  //   color: '#E53E3E'
  // },
  // {
  //   type: TeacherNotificationTypeCodeEnum.COURSE_DEADLINE,
  //   color: '#DD6B20'
  // },
  // {
  //   type: TeacherNotificationTypeCodeEnum.COURSE_UPDATE,
  //   color: '#38A169'
  // },
  {
    type: TeacherNotificationTypeCodeEnum.STUDY_REMIND,
    color: '#319795'
  }
];

const DEFAULT_NOTICE_TYPE = noticeTabConfigs[0]?.type ?? TeacherNotificationTypeCodeEnum.COURSE;

function formatNoticeTime(notice: TeacherNotificationRecord) {
  const value = dayjs(notice.notificationTime || notice.createTime);

  return value.isValid() ? value.format('YYYY-MM-DD HH:mm') : '--';
}

function isNoticeRead(notice: TeacherNotificationRecord) {
  return notice.readStatus === TeacherNotificationReadStatusEnum.READ;
}

function NoticeCard({
  title,
  content,
  time,
  showUnreadDot = false,
  actionButton
}: NoticeCardProps) {
  return (
    <Box bg="#F8FAFC" borderRadius="12px" px="16px" py="10px" mb="10px">
      <Flex justifyContent="space-between" borderBottom="1px solid #FFF" mb="10px" gap={3}>
        <Flex alignItems="center" minW={0}>
          {showUnreadDot && (
            <Text color="red.500" fontSize="14px" fontWeight="bold" mr="5px" flexShrink={0}>
              *
            </Text>
          )}
          <Text fontSize="14px" fontWeight="bold" mb="4px" color="#1D2129" noOfLines={1}>
            {title}
          </Text>
        </Flex>
        {actionButton}
      </Flex>

      <Text fontSize="14px" lineHeight="28px" pb="6px" px="5px" color="#4E5969">
        {content}
      </Text>
      <Text fontSize="12px" color="#86909C">
        {time}
      </Text>
    </Box>
  );
}

export function TeacherNoticePopover({ accentColor, ...props }: TeacherNoticePopoverProps) {
  const { t } = useTranslation('teacher');
  const { user } = useAuth();
  const [selectedType, setSelectedType] =
    useState<TeacherNotificationTypeCodeEnum>(DEFAULT_NOTICE_TYPE);
  const [notifications, setNotifications] = useState<TeacherNotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readingNoticeId, setReadingNoticeId] = useState<number | null>(null);

  const receiverId = Number(user?.id);
  const hasValidReceiverId = Number.isFinite(receiverId) && receiverId > 0;

  const { runAsync: fetchUnreadSummary } = useRequest2(postTeacherNotificationUnreadNum, {
    errorToast: ''
  });
  const { runAsync: fetchNotifications, loading: isLoadingNotifications } = useRequest2(
    (type: TeacherNotificationTypeCodeEnum) =>
      postTeacherNotificationPage({
        current: 1,
        size: NOTICE_PAGE_SIZE,
        receiverId,
        typeCode: type,
        descs: 'notificationTime'
      }),
    {
      errorToast: ''
    }
  );
  const { runAsync: markNotificationAsRead, loading: isMarkingRead } = useRequest2(
    (notificationId: number) =>
      postTeacherNotificationRead({
        notificationId,
        receiverId
      }),
    {
      errorToast: ''
    }
  );
  const { runAsync: markAllNotificationAsRead, loading: isMarkingAllRead } = useRequest2(
    postTeacherNotificationReadAll,
    {
      errorToast: ''
    }
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!hasValidReceiverId) {
      setUnreadCount(0);
      return 0;
    }

    const count = await fetchUnreadSummary();
    setUnreadCount(count || 0);
    return count || 0;
  }, [fetchUnreadSummary, hasValidReceiverId]);

  const refreshNotificationData = useCallback(
    async (type = selectedType) => {
      if (!hasValidReceiverId) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const [count, pageData] = await Promise.all([fetchUnreadSummary(), fetchNotifications(type)]);
      setUnreadCount(count || 0);
      setNotifications(pageData?.records || []);
    },
    [fetchNotifications, fetchUnreadSummary, hasValidReceiverId, selectedType]
  );

  useEffect(() => {
    void refreshUnreadCount();

    if (!hasValidReceiverId) return;

    const timer = window.setInterval(() => {
      void refreshUnreadCount();
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasValidReceiverId, refreshUnreadCount]);

  const handleTypeChange = useCallback(
    (type: TeacherNotificationTypeCodeEnum) => {
      setSelectedType(type);
      void refreshNotificationData(type);
    },
    [refreshNotificationData]
  );

  const handleReadNotice = useCallback(
    async (notice: TeacherNotificationRecord) => {
      if (isNoticeRead(notice)) return;

      setReadingNoticeId(notice.id);

      try {
        await markNotificationAsRead(notice.id);

        setNotifications((list) =>
          list.map((item) =>
            item.id === notice.id
              ? { ...item, readStatus: TeacherNotificationReadStatusEnum.READ }
              : item
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } finally {
        setReadingNoticeId(null);
      }
    },
    [markNotificationAsRead]
  );

  const handleReadAll = useCallback(async () => {
    if (unreadCount <= 0) return;

    await markAllNotificationAsRead();

    setNotifications((list) =>
      list.map((item) => ({
        ...item,
        readStatus: TeacherNotificationReadStatusEnum.READ
      }))
    );
    setUnreadCount(0);

    void refreshNotificationData(selectedType);
  }, [markAllNotificationAsRead, refreshNotificationData, selectedType, unreadCount]);

  const unreadBadgeText = useMemo(() => {
    if (unreadCount <= 0) return '';
    if (unreadCount > 99) return '99+';

    return String(unreadCount);
  }, [unreadCount]);

  const renderNoticeTab = useCallback(
    (tab: NoticeTabConfig, index: number) => {
      const isActive = selectedType === tab.type;

      return (
        <Flex
          key={tab.type}
          mt={index === 0 ? '0' : '10px'}
          align="center"
          justifyContent="flex-start"
          gap={3}
          cursor="pointer"
          onClick={() => handleTypeChange(tab.type)}
          bg={isActive ? NOTICE_ACTIVE_BG : 'transparent'}
          h="36px"
          px="10px"
          borderRadius="md"
          transition="all 0.2s ease"
        >
          <Box
            color={isActive ? NOTICE_ACTIVE_COLOR : tab.color}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            {tab.type === TeacherNotificationTypeCodeEnum.COURSE && (
              <BookIcon width="18px" height="18px" />
            )}
            {tab.type === TeacherNotificationTypeCodeEnum.COURSE_STUDY && (
              <StudyIcon width="18px" height="18px" />
            )}
            {tab.type === TeacherNotificationTypeCodeEnum.AI_REPLY && (
              <MessageIcon width="18px" height="18px" />
            )}
            {tab.type === TeacherNotificationTypeCodeEnum.SYSTEM && (
              <ShieldNoticeIcon width="18px" height="18px" />
            )}
            {tab.type === TeacherNotificationTypeCodeEnum.COURSE_DEADLINE && (
              <ClockIcon width="18px" height="18px" />
            )}
            {tab.type === TeacherNotificationTypeCodeEnum.COURSE_UPDATE && (
              <RefreshIcon width="18px" height="18px" />
            )}
            {tab.type === TeacherNotificationTypeCodeEnum.STUDY_REMIND && (
              <BellNoticeIcon width="18px" height="18px" />
            )}
          </Box>
          <Text
            fontSize="15px"
            color={isActive ? NOTICE_ACTIVE_COLOR : '#4E5969'}
            fontWeight={isActive ? '500' : '400'}
            lineHeight="1"
            display="flex"
            alignItems="center"
          >
            {t(`layout.notificationTypeLabels.${tab.type}`)}
          </Text>
        </Flex>
      );
    },
    [handleTypeChange, selectedType, t]
  );

  const renderLoading = () => (
    <Box display="flex" justifyContent="center" alignItems="center" h="100%">
      <Spinner size="lg" color={accentColor} />
    </Box>
  );

  const renderEmpty = (message: string) => (
    <Box display="flex" justifyContent="center" alignItems="center" h="100%">
      <Text fontSize="md" color="gray.500">
        {message}
      </Text>
    </Box>
  );

  const renderNoticeContent = () => {
    if (isLoadingNotifications) {
      return renderLoading();
    }

    if (notifications.length === 0) {
      return renderEmpty(t('layout.notificationEmpty'));
    }

    return notifications.map((notice) => {
      const read = isNoticeRead(notice);

      return (
        <NoticeCard
          key={notice.id}
          title={notice.title || t('layout.notificationDefaultTitle')}
          content={notice.content || '--'}
          time={formatNoticeTime(notice)}
          showUnreadDot={!read}
          actionButton={
            !read ? (
              <Text
                color={NOTICE_ACTIVE_COLOR}
                fontWeight={600}
                cursor="pointer"
                flexShrink={0}
                onClick={() => {
                  void handleReadNotice(notice);
                }}
              >
                {isMarkingRead && readingNoticeId === notice.id
                  ? t('layout.notificationReading')
                  : t('layout.notificationMarkRead')}
              </Text>
            ) : undefined
          }
        />
      );
    });
  };

  const content = (
    <Box display="flex">
      <Box w="150px" h="100%" borderRight="1px solid #E5E7EB" pr="12px">
        {noticeTabConfigs.map(renderNoticeTab)}
      </Box>

      <Box flex="1" h="100%" pl="16px">
        <Flex justify="space-between" align="center" mb="10px" gap={3}>
          <Text fontSize="14px" color="#86909C">
            {t('layout.notificationUnreadSummary', { count: unreadCount })}
          </Text>

          <Flex align="center" gap={3} flexShrink={0}>
            <Button
              size="xs"
              variant="ghost"
              colorScheme="purple"
              onClick={() => {
                void handleReadAll();
              }}
              isDisabled={unreadCount <= 0}
              isLoading={isMarkingAllRead}
            >
              {t('layout.notificationMarkAllRead')}
            </Button>
          </Flex>
        </Flex>

        <Box overflowY="auto" minH="50px">
          {renderNoticeContent()}
        </Box>
      </Box>
    </Box>
  );

  return (
    <MyPopover
      Trigger={
        <Box
          as="button"
          type="button"
          position="relative"
          p={2}
          rounded="full"
          color="gray.600"
          transition="background-color 0.2s ease, color 0.2s ease"
          _hover={{ bg: 'gray.100', color: accentColor }}
          aria-label={t('layout.notificationButton')}
          {...props}
        >
          <SvgIcon src="/imgs/teacher/login/ring.svg" alt="消息通知" width="20px" height="20px" />
          {unreadCount > 0 && (
            <Flex
              position="absolute"
              top="2px"
              right="0"
              minW="18px"
              h="18px"
              px={1}
              borderRadius="full"
              align="center"
              justify="center"
              bg={accentColor}
              color="white"
              fontSize="10px"
              fontWeight="bold"
              lineHeight="1"
              boxShadow="0 0 0 2px white"
            >
              {unreadBadgeText}
            </Flex>
          )}
        </Box>
      }
      trigger="click"
      placement="bottom-end"
      offset={[0, 12]}
      closeOnBlur
      hasArrow={false}
      w={NOTICE_PANEL_WIDTH}
      borderRadius="12px"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="0px 3px 10.1px 0px rgba(0, 0, 0, 0.11)"
      p="12px"
      bg="white"
      onOpenFunc={() => {
        void refreshNotificationData(selectedType);
      }}
    >
      {() => content}
    </MyPopover>
  );
}

export default TeacherNoticePopover;
