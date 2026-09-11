'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AddIcon } from '@chakra-ui/icons';
import { Box, Flex, Grid, Text, Spinner, Image, Tag, VStack } from '@chakra-ui/react';
import {
  ArrowRight,
  BookOpenText,
  Bot,
  Clock3,
  MessagesSquare,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import { MetricCard } from './components/MetricCard';
import { SectionCard } from './components/SectionCard';
import { AISuggestions } from './components/AISuggestions';
import { StudentTodoList } from './components/StudentTodoList';
import { StudentDetailModal } from './components/StudentDetailModal';
import { SuggestionDetailModal } from './components/SuggestionDetailModal';
import { RemindModal } from './components/RemindModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CancelPublishModal } from './components/CancelPublishModal';
import { AvatarCardList } from './components/AvatarCardList';
import { useTeacherHome } from './hooks/useTeacherHome';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import { useAuth } from '@/app/components/auth/AuthProvider';
import type { SuggestionItem } from './constants';

export default function TeacherHomePage() {
  const isI18nReady = useTeacherPageI18n(['home']);
  const { t } = useTranslation('teacher');
  const { user } = useAuth();
  const {
    activeTab,
    setActiveTab,
    newsSuggestions,
    optimizationSuggestions,
    graphSuggestions,
    students,
    unremindedCount,
    visibleAvatars,
    statsData,
    isLoading,
    selectedStudent,
    isStudentDetailOpen,
    remindStudent,
    isRemindModalOpen,
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
  } = useTeacherHome();

  // 建议详情弹窗状态
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionItem | null>(null);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);

  // 处理建议项点击
  const handleItemClick = (suggestion: SuggestionItem) => {
    setSelectedSuggestion(suggestion);
    setIsSuggestionModalOpen(true);
  };

  // 关闭建议详情弹窗
  const handleCloseSuggestionModal = () => {
    setIsSuggestionModalOpen(false);
    setSelectedSuggestion(null);
  };

  if (!isI18nReady) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  return (
    <Box
      bg="linear-gradient(180deg, #FFF7F7 0px, #F7F8FA 360px)"
      minH="calc(100vh - 64px)"
      py={{ base: 5, md: 8 }}
    >
      <VStack
        align="stretch"
        maxW="1240px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        spacing={{ base: 6, md: 8 }}
      >
        <Box
          as="section"
          aria-labelledby="avatar-hero-title"
          position="relative"
          overflow="hidden"
          borderRadius={{ base: '20px', md: '24px' }}
          bg="linear-gradient(118deg, #211E36 0%, #3D2948 48%, #751A26 100%)"
          color="white"
          boxShadow="0 18px 48px rgba(72, 24, 39, 0.18)"
          px={{ base: 5, md: 8, lg: 10 }}
          py={{ base: 7, md: 9 }}
        >
          <Box
            position="absolute"
            w="280px"
            h="280px"
            borderRadius="full"
            bg="rgba(232,60,74,.16)"
            top="-170px"
            right="-30px"
            aria-hidden="true"
          />
          <Box
            position="absolute"
            w="170px"
            h="170px"
            borderRadius="full"
            border="1px solid rgba(255,255,255,.12)"
            bottom="-105px"
            left="38%"
            aria-hidden="true"
          />

          <Grid
            position="relative"
            templateColumns={{ base: '1fr', md: 'minmax(0, 1.25fr) minmax(260px, .75fr)' }}
            gap={{ base: 6, md: 10 }}
            alignItems="center"
          >
            <Box>
              <Tag borderRadius="full" bg="whiteAlpha.200" color="white" px={3} py={1} mb={4}>
                <Sparkles size={13} style={{ marginRight: 6 }} aria-hidden="true" />
                {t('home.hero.eyebrow', {
                  name: user?.name || t('home.teacher_default_name')
                })}
              </Tag>
              <Text
                id="avatar-hero-title"
                as="h1"
                fontSize={{ base: '28px', md: '36px' }}
                lineHeight="1.2"
                fontWeight={750}
                letterSpacing="-0.02em"
              >
                {t('home.hero.title')}
                <Text as="span" display="block" color="#FFB9BE">
                  {t('home.hero.title_accent')}
                </Text>
              </Text>
              <Text
                mt={4}
                maxW="640px"
                fontSize={{ base: '13px', md: '15px' }}
                lineHeight="1.8"
                color="whiteAlpha.800"
              >
                {t('home.hero.description')}
              </Text>
              <Flex mt={6} gap={3} flexWrap="wrap">
                <Button
                  as={Link}
                  href="/teacher/aiTeacher/avatar/create"
                  bg="white"
                  color="#741925"
                  borderColor="white"
                  _hover={{ bg: '#FFF1F0', borderColor: '#FFF1F0' }}
                  rightIcon={<ArrowRight size={15} aria-hidden="true" />}
                >
                  {t('home.actions.create_avatar')}
                </Button>
                <Button
                  as="a"
                  href="#avatar-center"
                  variant="secondary"
                  bg="transparent"
                  color="white"
                  borderColor="whiteAlpha.500"
                  _hover={{ bg: 'whiteAlpha.200', color: 'white', borderColor: 'whiteAlpha.700' }}
                >
                  {t('home.hero.view_avatars')}
                </Button>
              </Flex>
            </Box>

            <Flex
              display={{ base: 'none', md: 'flex' }}
              minH="190px"
              align="flex-end"
              justify="center"
              position="relative"
              bg="rgba(255,255,255,.08)"
              border="1px solid rgba(255,255,255,.14)"
              borderRadius="20px"
              overflow="hidden"
              backdropFilter="blur(12px)"
            >
              <Box position="absolute" top={4} left={4} right={4}>
                <Flex justify="space-between" align="center">
                  <Tag size="sm" borderRadius="full" bg="rgba(64,211,151,.18)" color="#A8F0D0">
                    <Box w="6px" h="6px" borderRadius="full" bg="#40D397" mr={2} />
                    {t('home.hero.running')}
                  </Tag>
                  <ShieldCheck size={18} color="#FFCCD0" aria-hidden="true" />
                </Flex>
              </Box>
              <Image
                src="/imgs/teacher/home/welcome-avatar.svg"
                alt=""
                w="142px"
                h="auto"
                position="relative"
                zIndex={1}
              />
              <Box position="absolute" right={4} bottom={4} textAlign="right">
                <Text fontSize="12px" color="whiteAlpha.700">
                  {t('home.hero.on_duty')}
                </Text>
                <Text fontSize="14px" fontWeight={700} mt={1}>
                  {t('home.hero.always_online')}
                </Text>
              </Box>
            </Flex>
          </Grid>
        </Box>

        <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap={{ base: 2, md: 4 }}>
          <MetricCard
            label={t('home.metrics.my_courses')}
            value={String(statsData.courseCount)}
            suffix={t('home.metrics.courses_suffix')}
            icon={BookOpenText}
            accent="#2C7A7B"
            accentBg="#E6FFFA"
          />
          <MetricCard
            label={t('home.metrics.ai_avatars')}
            value={String(statsData.aiAvatarCount)}
            suffix={t('home.metrics.avatars_suffix')}
            icon={Bot}
            accent="#6B46C1"
            accentBg="#FAF5FF"
          />
          <MetricCard
            label={t('home.metrics.today_interactions')}
            value={String(statsData.todayInteractionCount)}
            suffix={t('home.metrics.interactions_suffix')}
            icon={MessagesSquare}
            accent="#C53030"
            accentBg="#FFF5F5"
          />
        </Grid>

        <Box as="section" aria-labelledby="teaching-insight-title">
          <Flex
            align={{ base: 'flex-start', md: 'flex-end' }}
            justify="space-between"
            direction={{ base: 'column', md: 'row' }}
            gap={2}
            mb={4}
          >
            <Box>
              <Text
                id="teaching-insight-title"
                as="h2"
                fontSize="18px"
                fontWeight={700}
                color="#1D2129"
              >
                {t('home.insights.title')}
              </Text>
              <Text fontSize="13px" color="#86909C" mt={1}>
                {t('home.insights.description')}
              </Text>
            </Box>
            <Flex align="center" gap={2} color="#86909C" fontSize="12px" aria-live="polite">
              {isLoading ? <Spinner size="xs" /> : <Clock3 size={14} aria-hidden="true" />}
              {isLoading ? t('home.insights.loading') : t('home.insights.updated')}
            </Flex>
          </Flex>

          <Grid templateColumns={{ base: 'minmax(0, 1fr)', xl: '1.05fr .95fr' }} gap={5}>
            <SectionCard title={t('home.sections.ai_suggestions')} contentHeight="510px">
              <AISuggestions
                newsSuggestions={newsSuggestions}
                optimizationSuggestions={optimizationSuggestions}
                graphSuggestions={graphSuggestions}
                onAction={handleSuggestionAction}
                onMarkAllNewsRead={handleMarkAllNewsRead}
                onItemClick={handleItemClick}
              />
            </SectionCard>

            <SectionCard title={t('home.sections.today_todos')} contentHeight="510px">
              <StudentTodoList
                students={students}
                unremindedCount={unremindedCount}
                onRemind={handleRemindStudent}
                onBatchProcess={handleBatchProcess}
                onViewStudent={handleViewStudent}
              />
            </SectionCard>
          </Grid>
        </Box>

        <Box
          id="avatar-center"
          as="section"
          aria-labelledby="avatar-center-title"
          scrollMarginTop="84px"
        >
          <Flex
            align={{ base: 'stretch', md: 'flex-end' }}
            justify="space-between"
            gap={4}
            mb={4}
            flexDir={{ base: 'column', md: 'row' }}
          >
            <Box>
              <Text
                id="avatar-center-title"
                as="h2"
                fontSize="18px"
                fontWeight={700}
                color="#1D2129"
              >
                {t('home.sections.my_courses_and_avatars')}
              </Text>
              <Text fontSize="13px" color="#86909C" mt={1}>
                {t('home.avatar_list.description')}
              </Text>
            </Box>
            <Button
              as={Link}
              href="/teacher/aiTeacher/avatar/create"
              leftIcon={<AddIcon aria-hidden="true" />}
              alignSelf={{ base: 'flex-start', md: 'auto' }}
            >
              {t('home.actions.create_avatar')}
            </Button>
          </Flex>

          <AvatarCardList
            activeTab={activeTab}
            onTabChange={setActiveTab}
            avatars={visibleAvatars}
            onTogglePublish={handleTogglePublish}
            onDelete={handleDeleteClick}
          />
        </Box>
      </VStack>

      {/* 学生详情弹窗 */}
      <StudentDetailModal
        isOpen={isStudentDetailOpen}
        onClose={handleCloseStudentDetail}
        student={selectedStudent}
        onOpenRemindModal={handleOpenRemindModal}
      />

      {/* 提醒确认弹窗 */}
      <RemindModal
        isOpen={isRemindModalOpen}
        onClose={handleCloseRemindModal}
        student={remindStudent}
        onConfirm={handleConfirmRemind}
      />

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        avatarTitle={deleteTarget?.title || ''}
        onConfirm={handleConfirmDelete}
      />

      {/* 取消发布确认弹窗 */}
      <CancelPublishModal
        isOpen={isCancelPublishOpen}
        onClose={handleCloseCancelPublish}
        avatarTitle={cancelPublishTarget?.title || ''}
        onConfirm={handleConfirmCancelPublish}
      />

      {/* 建议详情弹窗 */}
      <SuggestionDetailModal
        isOpen={isSuggestionModalOpen}
        onClose={handleCloseSuggestionModal}
        suggestion={selectedSuggestion}
        onAction={handleSuggestionAction}
      />
    </Box>
  );
}
