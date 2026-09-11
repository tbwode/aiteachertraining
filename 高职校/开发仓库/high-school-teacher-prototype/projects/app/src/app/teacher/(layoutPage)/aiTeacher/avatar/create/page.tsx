'use client';

import {
  ArrowBackIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoOutlineIcon,
  CloseIcon
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Spinner,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { StepIndicator } from './components/StepIndicator';
import { Step1ClassConfig } from './components/Step1ClassConfig';
import { Step2TeachingPath } from './components/Step2TeachingPath';
import { Step3KnowledgeAggregation } from './components/Step3KnowledgeAggregation';
import { AiCoverModal } from './components/AiCoverModal';
import { useAvatarWizard } from './hooks/useAvatarWizard';
import { PRIMARY_COLOR } from './constants';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import { clearStoredWizardDraft } from '../avatarStorage';
import { useAuth } from '@/app/components/auth/AuthProvider';

export default function AvatarCreatePage() {
  const { t } = useTranslation('teacher');
  const isI18nReady = useTeacherPageI18n(['aiTeacher']);
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const syllabusInputRef = useRef<HTMLInputElement | null>(null);
  const coursewareInputRef = useRef<HTMLInputElement | null>(null);

  const {
    isOpen: isExitConfirmOpen,
    onOpen: onExitConfirmOpen,
    onClose: onExitConfirmClose
  } = useDisclosure();

  const {
    isOpen: isCloseConfirmOpen,
    onOpen: onCloseConfirmOpen,
    onClose: onCloseConfirmClose
  } = useDisclosure();

  const {
    isOpen: isAiCoverModalOpen,
    onOpen: onAiCoverModalOpen,
    onClose: onAiCoverModalClose
  } = useDisclosure();

  const {
    draft,
    currentStep,
    setCurrentStep,
    isMatching,
    isAnalyzing,
    isLoadingResources,
    isUploadingCourseware,
    isParsingCourseware,
    selectedCourse,
    availableClasses,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    courseOptions,
    isLoadingCourses,
    editingTextbookId,
    textbookInput,
    updateDraft,
    handleCourseChange,
    handleImageUpload,
    handleClassToggle,
    handleMultiCheckboxToggle,
    saveDraftAndExit,
    proceedToNextStep,
    handleSyllabusUpload,
    handleCoursewareUpload,
    handleRemoveCourseware,
    startMatching,
    handleToggleResource,
    handleStartCreateTextbook,
    handleSubmitTextbook,
    handleDeleteTextbook,
    handleCancelEdit,
    handleTextbookInputChange,
    publishAvatar,
    saveAsPending
  } = useAvatarWizard({ courseIdFromUrl: courseIdFromUrl || undefined });

  // 等待 i18n 资源加载完成
  if (!isI18nReady) {
    return (
      <Flex minH="400px" align="center" justify="center">
        <Spinner size="lg" color={PRIMARY_COLOR} />
      </Flex>
    );
  }

  return (
    <Box maxW="1280px" mx="auto" px={{ base: 4, md: 6 }}>
      <Flex justify="space-between" align="center" mb={8}>
        <Text fontSize="2xl" fontWeight={600} color="gray.800">
          {t('aiTeacher.avatar.create.title')}
        </Text>
        <Flex
          as="button"
          w="32px"
          h="32px"
          borderRadius="md"
          align="center"
          justify="center"
          bg="white"
          border="1px solid"
          borderColor="gray.300"
          color="gray.600"
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
          onClick={onCloseConfirmOpen}
        >
          <CloseIcon boxSize="12px" />
        </Flex>
      </Flex>

      <Box mb={8}>
        <StepIndicator currentStep={currentStep} />
      </Box>

      <Box mb={6}>
        {currentStep === 1 && (
          <Step1ClassConfig
            draft={draft}
            selectedCourse={selectedCourse}
            availableClasses={availableClasses}
            courseOptions={courseOptions}
            isLoadingCourses={isLoadingCourses}
            fileInputRef={fileInputRef}
            onCourseChange={handleCourseChange}
            onImageUpload={handleImageUpload}
            onClassToggle={handleClassToggle}
            onMultiCheckboxToggle={handleMultiCheckboxToggle}
            onUpdateDraft={updateDraft}
            onAiGenerateCover={() => {
              if (!selectedCourse?.title) {
                toast({
                  title: t('aiTeacher.avatar.create.aiCoverModal.validation.courseRequired'),
                  status: 'warning',
                  duration: 2000,
                  isClosable: true,
                  position: 'top'
                });
                return;
              }
              onAiCoverModalOpen();
            }}
          />
        )}
        {currentStep === 2 && (
          <Step2TeachingPath
            draft={draft}
            isMatching={isMatching}
            isAnalyzing={isAnalyzing}
            isUploadingCourseware={isUploadingCourseware}
            isParsingCourseware={isParsingCourseware}
            syllabusInputRef={syllabusInputRef}
            coursewareInputRef={coursewareInputRef}
            onSyllabusUpload={handleSyllabusUpload}
            onCoursewareUpload={handleCoursewareUpload}
            onRemoveCourseware={handleRemoveCourseware}
            onStartMatching={startMatching}
            onUpdateDraft={updateDraft}
          />
        )}
        {currentStep === 3 && (
          <Step3KnowledgeAggregation
            draft={draft}
            isLoadingResources={isLoadingResources}
            onToggleResource={handleToggleResource}
            onUpdateDraft={updateDraft}
          />
        )}
      </Box>

      <Flex justify="space-between" gap={4} flexWrap="wrap">
        <Button
          variant="outline"
          bg="white"
          borderColor="gray.300"
          color="gray.700"
          _hover={{ bg: 'gray.50' }}
          onClick={
            currentStep === 1 ? onExitConfirmOpen : () => setCurrentStep((currentStep - 1) as any)
          }
          leftIcon={currentStep === 1 ? <ArrowBackIcon /> : <ChevronLeftIcon />}
        >
          {currentStep === 1
            ? t('aiTeacher.avatar.common.actions.cancel')
            : t('aiTeacher.avatar.common.actions.previous')}
        </Button>

        <HStack spacing={3}>
          {currentStep < 3 ? (
            <Button
              bg={isStep1Valid || isStep2Valid ? 'gray.800' : 'gray.300'}
              color="white"
              _hover={{ bg: 'gray.700' }}
              onClick={proceedToNextStep}
              rightIcon={<ChevronRightIcon />}
              isDisabled={currentStep === 1 ? !isStep1Valid : !isStep2Valid}
            >
              {t('aiTeacher.avatar.common.actions.next')}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                bg="white"
                borderColor="#333333"
                color="#333333"
                borderRadius="8px"
                _hover={{ bg: 'gray.50' }}
                onClick={saveAsPending}
              >
                {t('aiTeacher.avatar.common.actions.saveDraft')}
              </Button>
              <Button
                bg="#333333"
                color="white"
                borderRadius="8px"
                _hover={{ bg: '#1a1a1a' }}
                onClick={publishAvatar}
                isDisabled={!isStep3Valid}
              >
                {t('aiTeacher.avatar.common.actions.publish')}
              </Button>
            </>
          )}
        </HStack>
      </Flex>

      {isExitConfirmOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={1400}
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={4}
        >
          <Box bg="white" borderRadius="xl" boxShadow="xl" maxW="420px" w="full" p={6}>
            <HStack spacing={3} mb={4}>
              <Flex
                w="40px"
                h="40px"
                borderRadius="full"
                bg="rgba(200,62,62,0.08)"
                align="center"
                justify="center"
              >
                <InfoOutlineIcon color={PRIMARY_COLOR} />
              </Flex>
              <Text fontSize="lg" fontWeight={600} color="gray.800">
                {t('aiTeacher.avatar.create.exitConfirm.title')}
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.600" mb={6}>
              {t('aiTeacher.avatar.create.exitConfirm.description')}
            </Text>
            <Flex justify="flex-end" gap={3}>
              <Button variant="outline" onClick={onExitConfirmClose}>
                {t('aiTeacher.avatar.create.exitConfirm.continueEditing')}
              </Button>
              <Button
                bg={PRIMARY_COLOR}
                color="white"
                _hover={{ bg: PRIMARY_COLOR }}
                onClick={saveDraftAndExit}
              >
                {t('aiTeacher.avatar.create.exitConfirm.saveAndExit')}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {isCloseConfirmOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={1400}
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={4}
        >
          <Box bg="white" borderRadius="xl" boxShadow="xl" maxW="420px" w="full" p={6}>
            <HStack spacing={3} mb={4}>
              <Flex
                w="40px"
                h="40px"
                borderRadius="full"
                bg="rgba(200,62,62,0.08)"
                align="center"
                justify="center"
              >
                <InfoOutlineIcon color={PRIMARY_COLOR} />
              </Flex>
              <Text fontSize="lg" fontWeight={600} color="gray.800">
                {t('aiTeacher.avatar.create.closeConfirm.title')}
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.600" mb={6}>
              {t('aiTeacher.avatar.create.closeConfirm.description')}
            </Text>
            <Flex justify="flex-end" gap={3}>
              <Button variant="outline" onClick={onCloseConfirmClose}>
                {t('aiTeacher.avatar.create.closeConfirm.cancel')}
              </Button>
              <Button
                bg={PRIMARY_COLOR}
                color="white"
                _hover={{ bg: PRIMARY_COLOR }}
                onClick={() => {
                  clearStoredWizardDraft(user?.id);
                  onCloseConfirmClose();
                  window.location.href = '/teacher/ai-teacher';
                }}
              >
                {t('aiTeacher.avatar.create.closeConfirm.confirm')}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      <AiCoverModal
        isOpen={isAiCoverModalOpen}
        onClose={onAiCoverModalClose}
        defaultCourseName={selectedCourse?.title || ''}
        onSelectCover={(coverUrl) =>
          updateDraft((current) => ({
            ...current,
            courseImagePreview: coverUrl,
            courseImageUrl: coverUrl,
            courseImageName: t('aiTeacher.avatar.create.step1.courseImage.aiGeneratedName'),
            updatedAt: new Date().toISOString()
          }))
        }
      />
    </Box>
  );
}
