'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  HStack,
  Text,
  Badge,
  Spinner,
  Flex,
  VStack
} from '@chakra-ui/react';
import {
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ClipboardCheck,
  LibraryBig,
  Network,
  Pencil,
  UsersRound,
  Wrench
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import { PRIMARY_COLOR } from './constants';
import { TabMindmap } from '../edit/components/TabMindmap';
import { useAvatarDetail } from './hooks/useAvatarDetail';
import { AvatarHeader } from './components/AvatarHeader';
import { TabCatalog } from './components/TabCatalog';
import { TabStudents } from './components/TabStudents';
import { TabQuestionBank } from './components/questionBank/TabQuestionBank';
import { TabQuizManage } from './components/quiz/TabQuizManage';
import { TabCourseSummary } from './components/courseSummary/TabCourseSummary';
import { TabTrainingManage } from './components/training/TabTrainingManage';
import { buildChapterTree, buildSeedQuestions } from './components/questionBank/mockData';
import type { Question } from './components/questionBank/types';
import { StudentDetailModal } from './components/StudentDetailModal';
import { RemindModal } from './components/RemindModal';
import { ConversationModal } from './components/ConversationModal';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';

function AvatarDetailContent() {
  const { t } = useTranslation('teacher');
  const isI18nReady = useTeacherPageI18n(['aiTeacher']);
  const {
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
    students,
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
  } = useAvatarDetail();

  // 题库章节树与题目提升到页面级：题库管理与测验管理共享
  const questionChapterTree = useMemo(
    () => buildChapterTree(avatarDetail?.chapterList || []),
    [avatarDetail?.chapterList]
  );
  const [bankQuestions, setBankQuestions] = useState<Question[]>(() =>
    buildSeedQuestions(questionChapterTree)
  );
  useEffect(() => {
    setBankQuestions((prev) =>
      prev.length === 0 && questionChapterTree.length > 0
        ? buildSeedQuestions(questionChapterTree)
        : prev
    );
  }, [questionChapterTree]);

  // 等待 i18n 资源加载完成
  if (!isI18nReady) {
    return (
      <Flex minH="400px" align="center" justify="center">
        <Spinner size="lg" color={PRIMARY_COLOR} />
      </Flex>
    );
  }

  const detailTitle =
    avatarDetail?.courseName ??
    storedRecord?.title ??
    t('aiTeacher.avatar.common.fallback.unnamedCourse');
  const detailTabs = [
    { label: t('aiTeacher.avatar.detail.tabs.catalog'), icon: BookOpenText },
    { label: t('aiTeacher.avatar.detail.tabs.graph'), icon: Network },
    { label: t('aiTeacher.avatar.detail.tabs.questionBank'), icon: LibraryBig },
    { label: t('aiTeacher.avatar.detail.tabs.quiz'), icon: ClipboardCheck },
    { label: t('aiTeacher.avatar.detail.tabs.training'), icon: Wrench },
    { label: t('aiTeacher.avatar.detail.tabs.courseSummary'), icon: BarChart3 },
    {
      label: t('aiTeacher.avatar.detail.tabs.students'),
      icon: UsersRound,
      count: studentsStats?.totalCount ?? 0
    }
  ];

  return (
    <Box
      bg="linear-gradient(180deg, #FFF7F7 0px, #F7F8FA 320px)"
      minH="calc(100vh - 64px)"
      py={{ base: 4, md: 7 }}
    >
      <VStack align="stretch" maxW="1280px" mx="auto" px={{ base: 4, md: 6 }} spacing={5}>
        <Flex align="center" justify="space-between" gap={3}>
          <Button
            as={Link}
            href="/teacher/ai-teacher"
            variant="ghost"
            leftIcon={<ChevronLeft size={18} aria-hidden="true" />}
            minH="44px"
            px={2}
            color="#4E5969"
            _hover={{ color: PRIMARY_COLOR, bg: 'white' }}
          >
            {t('aiTeacher.avatar.detail.back')}
          </Button>
          <Button
            as={Link}
            href={`/teacher/aiTeacher/avatar/edit?tab=base&id=${avatarId}`}
            variant="secondary"
            leftIcon={<Pencil size={16} aria-hidden="true" />}
            minH="44px"
            bg="white"
          >
            {t('aiTeacher.avatar.common.actions.edit')}
          </Button>
        </Flex>

        <AvatarHeader
          storedRecord={storedRecord}
          storedCourse={storedCourse}
          avatarDetail={avatarDetail}
        />

        <Tabs colorScheme="red" variant="unstyled" isLazy>
          <Box
            bg="white"
            border="1px solid #E5E6EB"
            borderRadius="16px"
            boxShadow="0 6px 20px rgba(31,35,41,0.05)"
            p="5px"
            overflowX="auto"
            sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}
          >
            <TabList
              borderBottom="none"
              gap={1}
              w="max-content"
              minW={{ base: 'max-content', lg: '100%' }}
            >
              {detailTabs.map(({ label, icon: Icon, count }) => (
                <Tab
                  key={label}
                  minH="44px"
                  flex={{ base: '0 0 auto', lg: 1 }}
                  gap={2}
                  color="#646A73"
                  fontSize="13px"
                  fontWeight={500}
                  borderRadius="12px"
                  px={{ base: 4, md: 5 }}
                  _selected={{ color: PRIMARY_COLOR, bg: '#FFF1F0', fontWeight: 650 }}
                  _hover={{ color: '#1D2129', bg: '#F7F8FA' }}
                  _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,.14)' }}
                >
                  <Icon size={16} aria-hidden="true" />
                  <Text whiteSpace="nowrap">{label}</Text>
                  {count !== undefined ? (
                    <Badge
                      bg={PRIMARY_COLOR}
                      color="white"
                      borderRadius="full"
                      px={2}
                      fontSize="10px"
                    >
                      {count}
                    </Badge>
                  ) : null}
                </Tab>
              ))}
            </TabList>
          </Box>

          <TabPanels>
            <TabPanel px={0} py={5}>
              <TabCatalog avatarDetail={avatarDetail} />
            </TabPanel>

            <TabPanel px={0} py={5}>
              <TabMindmap
                courseName={
                  avatarDetail?.courseName || t('aiTeacher.avatar.common.fallback.unnamedCourse')
                }
                chapters={avatarDetail?.chapterList || []}
              />
            </TabPanel>

            <TabPanel px={0} py={5}>
              <TabQuestionBank
                chapterTree={questionChapterTree}
                questions={bankQuestions}
                onQuestionsChange={setBankQuestions}
              />
            </TabPanel>

            <TabPanel px={0} py={5}>
              <TabQuizManage
                avatarDetail={avatarDetail}
                chapterTree={questionChapterTree}
                bank={bankQuestions}
              />
            </TabPanel>

            <TabPanel px={0} py={5}>
              <TabTrainingManage avatarDetail={avatarDetail} />
            </TabPanel>

            <TabPanel px={0} py={5}>
              <TabCourseSummary
                avatarId={avatarId}
                courseName={avatarDetail?.courseName || detailTitle}
                chapterTree={questionChapterTree}
                classList={avatarDetail?.classList}
              />
            </TabPanel>

            <TabPanel px={0} py={5}>
              <TabStudents
                avatarId={avatarId}
                teacherId={teacherId}
                searchText={searchText}
                setSearchText={setSearchText}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                filteredStudents={filteredStudents}
                allStudents={students}
                studentsStats={studentsStats}
                isLoading={isLoading}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                total={total}
                onViewStudent={handleViewStudent}
                onViewConversation={handleViewConversation}
                onRemindClick={handleRemindClick}
                classList={avatarDetail?.classList}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <StudentDetailModal
          isOpen={isDetailOpen}
          onClose={onDetailClose}
          student={selectedStudent}
          detailTitle={detailTitle}
          avatarId={Number(avatarId) || 901}
          onRemind={handleModalRemind}
        />

        <RemindModal
          isOpen={isRemindOpen}
          onClose={onRemindClose}
          student={remindStudent}
          onConfirm={handleConfirmRemind}
        />

        <ConversationModal
          isOpen={isConversationOpen}
          onClose={handleConversationClose}
          avatarId={avatarId}
          avatarName={avatarDetail?.courseName ?? detailTitle}
          courseName={avatarDetail?.courseName ?? detailTitle}
          student={conversationStudent}
        />
      </VStack>
    </Box>
  );
}

export default function AvatarDetailPage() {
  const { t } = useTranslation('teacher');

  return (
    <Suspense fallback={<Box p={6}>{t('aiTeacher.avatar.common.fallback.loading')}</Box>}>
      <AvatarDetailContent />
    </Suspense>
  );
}
