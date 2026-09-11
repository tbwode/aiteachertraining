'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import {
  Alert,
  AlertIcon,
  Box,
  Flex,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tag,
  VStack
} from '@chakra-ui/react';
import { BookOpenText, Bot, ChevronLeft, Network, Save, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import { PRIMARY_COLOR } from './constants';
import { useAvatarEdit } from './hooks/useAvatarEdit';
import { TabBasicInfo } from './components/TabBasicInfo';
import { TabChapters } from './components/TabChapters';
import { TabMindmap } from './components/TabMindmap';
import { SaveConfirmModal } from './components/SaveConfirmModal';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';

function AvatarEditContent() {
  const { t } = useTranslation('teacher');
  const isI18nReady = useTeacherPageI18n(['aiTeacher']);
  const {
    avatarId,
    tabIndex,
    storedRecord,
    storedCourse,
    avatarDetail,
    isLoading,
    formData,
    setFormData,
    chapters,
    setChapters,
    selectedSection,
    setSelectedSection,
    handleSave,
    handleClassToggle,
    handleCoverUrlChange,
    confirmModalOpen,
    confirmMaterials,
    handleConfirmSave,
    handleCloseConfirmModal
  } = useAvatarEdit();

  // 等待 i18n 资源加载完成
  if (!isI18nReady) {
    return (
      <Flex minH="400px" align="center" justify="center">
        <Spinner size="lg" color={PRIMARY_COLOR} />
      </Flex>
    );
  }

  // 显示加载状态
  if (isLoading) {
    return (
      <Box maxW="1280px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
        <Text>{t('aiTeacher.avatar.common.fallback.loading')}</Text>
      </Box>
    );
  }

  const editTabs = [
    { key: 'base', label: t('aiTeacher.avatar.edit.tabs.base'), icon: Settings2 },
    { key: 'chapters', label: t('aiTeacher.avatar.edit.tabs.chapters'), icon: BookOpenText },
    { key: 'graph', label: t('aiTeacher.avatar.edit.tabs.graph'), icon: Network }
  ] as const;
  const detailHref = avatarId
    ? `/teacher/aiTeacher/avatar/detail?id=${avatarId}`
    : '/teacher/aiTeacher/avatar/detail';
  const currentStatus =
    storedRecord?.status === 'pending'
      ? t('aiTeacher.avatar.edit.alert.pendingEditable')
      : t('aiTeacher.avatar.edit.alert.runningEditable');

  return (
    <Box
      bg="linear-gradient(180deg, #FFF7F7 0px, #F7F8FA 320px)"
      minH="calc(100vh - 64px)"
      py={{ base: 4, md: 7 }}
    >
      <VStack align="stretch" maxW="1280px" mx="auto" px={{ base: 4, md: 6 }} spacing={5}>
        <Button
          as={Link}
          href={detailHref}
          variant="ghost"
          leftIcon={<ChevronLeft size={18} aria-hidden="true" />}
          alignSelf="flex-start"
          minH="44px"
          px={2}
          color="#4E5969"
          _hover={{ color: PRIMARY_COLOR, bg: 'white' }}
        >
          {t('aiTeacher.avatar.edit.back')}
        </Button>

        <Box
          as="section"
          aria-labelledby="avatar-edit-title"
          bg="white"
          border="1px solid #E5E6EB"
          borderRadius={{ base: '18px', md: '22px' }}
          boxShadow="0 10px 32px rgba(31,35,41,0.07)"
          p={{ base: 4, md: 6 }}
        >
          <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
            <Flex align="center" gap={4} minW={0}>
              <Flex
                w={{ base: '44px', md: '52px' }}
                h={{ base: '44px', md: '52px' }}
                flexShrink={0}
                align="center"
                justify="center"
                borderRadius="15px"
                bg="#FFF1F0"
                color={PRIMARY_COLOR}
              >
                <Bot size={25} aria-hidden="true" />
              </Flex>
              <Box minW={0}>
                <Text
                  id="avatar-edit-title"
                  as="h1"
                  fontSize={{ base: '21px', md: '26px' }}
                  fontWeight={750}
                  color="#1D2129"
                >
                  {t('aiTeacher.avatar.edit.pageTitle', '编辑 AI 教师分身')}
                </Text>
                <Text fontSize="12px" color="#86909C" mt={1} noOfLines={1}>
                  {avatarDetail?.courseName || formData.name}
                </Text>
              </Box>
            </Flex>
            <Tag
              borderRadius="full"
              bg={storedRecord?.status === 'pending' ? '#FFF7E6' : '#EAF8F3'}
              color={storedRecord?.status === 'pending' ? '#AD6800' : '#147D64'}
              px={3}
              py={1}
              fontSize="11px"
            >
              <Box
                w="6px"
                h="6px"
                borderRadius="full"
                bg={storedRecord?.status === 'pending' ? '#F59E0B' : '#22A06B'}
                mr={2}
              />
              {currentStatus}
            </Tag>
          </Flex>

          <Alert
            status="warning"
            mt={5}
            borderRadius="13px"
            bg="#FFF8E8"
            border="1px solid #FFE2A8"
            color="#805200"
            fontSize="12px"
          >
            <AlertIcon color="#D97706" />
            {t(
              'aiTeacher.avatar.edit.notice',
              '修改后请保存，已发布分身将在下次对话时使用新配置。'
            )}
          </Alert>
        </Box>

        <Tabs index={tabIndex} colorScheme="red" variant="unstyled">
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
              minW={{ base: 'max-content', md: '100%' }}
            >
              {editTabs.map(({ key, label, icon: Icon }) => (
                <Tab
                  key={key}
                  as={Link}
                  href={`/teacher/aiTeacher/avatar/edit?tab=${key}${avatarId ? `&id=${avatarId}` : ''}`}
                  minH="44px"
                  flex={{ base: '0 0 auto', md: 1 }}
                  gap={2}
                  color="#646A73"
                  fontSize="13px"
                  fontWeight={500}
                  borderRadius="12px"
                  px={{ base: 5, md: 6 }}
                  _selected={{ color: PRIMARY_COLOR, bg: '#FFF1F0', fontWeight: 650 }}
                  _hover={{ color: '#1D2129', bg: '#F7F8FA' }}
                  _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,.14)' }}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Tab>
              ))}
            </TabList>
          </Box>

          <TabPanels>
            <TabPanel px={0} py={5}>
              <TabBasicInfo
                formData={formData}
                setFormData={setFormData}
                storedCourse={storedCourse}
                avatarDetail={avatarDetail}
                onClassToggle={handleClassToggle}
                onCoverUrlChange={handleCoverUrlChange}
              />
            </TabPanel>

            <TabPanel px={0} py={5}>
              <TabChapters
                chapters={chapters}
                selectedSection={selectedSection}
                onSectionSelect={setSelectedSection}
                onChaptersChange={setChapters}
                avatarDetail={avatarDetail}
              />
            </TabPanel>

            <TabPanel px={0} py={5}>
              <TabMindmap
                courseName={
                  avatarDetail?.courseName ||
                  formData.name ||
                  t('aiTeacher.avatar.common.fallback.unnamedCourse')
                }
                chapters={avatarDetail?.chapterList || []}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Flex
          justify="flex-end"
          gap={3}
          bg="white"
          border="1px solid #E5E6EB"
          borderRadius="16px"
          boxShadow="0 6px 20px rgba(31,35,41,0.05)"
          p={{ base: 3, md: 4 }}
        >
          <Button
            as={Link}
            href="/teacher/ai-teacher"
            variant="secondary"
            flex={{ base: 1, md: '0 0 auto' }}
            minW={{ md: '120px' }}
            h="44px"
          >
            {t('aiTeacher.avatar.common.actions.cancel')}
          </Button>
          <Button
            leftIcon={<Save size={16} aria-hidden="true" />}
            flex={{ base: 1, md: '0 0 auto' }}
            minW={{ md: '140px' }}
            h="44px"
            onClick={handleSave}
          >
            {t('aiTeacher.avatar.edit.actions.save')}
          </Button>
        </Flex>

        <SaveConfirmModal
          isOpen={confirmModalOpen}
          onClose={handleCloseConfirmModal}
          materials={confirmMaterials}
          onConfirm={handleConfirmSave}
        />
      </VStack>
    </Box>
  );
}

export default function AvatarEditPage() {
  const { t } = useTranslation('teacher');

  return (
    <Suspense fallback={<Box p={6}>{t('aiTeacher.avatar.common.fallback.loading')}</Box>}>
      <AvatarEditContent />
    </Suspense>
  );
}
