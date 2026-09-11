'use client';

import { ChevronDownIcon, CloseIcon, InfoOutlineIcon, WarningIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState, type RefObject } from 'react';
import Image from 'next/image';
import type { AvatarWizardDraft, CourseOption } from '../../avatarStorage';
import {
  QUIZ_METHOD_OPTIONS,
  REPORT_DIMENSION_OPTIONS,
  WEIGHT_LEVELS,
  WEIGHT_LABELS
} from '../../avatarStorage';
import { CARD_SHADOW, PRIMARY_COLOR } from '../constants';

type Step1Props = {
  draft: AvatarWizardDraft;
  selectedCourse: CourseOption | null;
  availableClasses: string[];
  courseOptions: CourseOption[];
  isLoadingCourses: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onCourseChange: (courseId: string) => void;
  onImageUpload: (file?: File) => void;
  onClassToggle: (className: string) => void;
  onMultiCheckboxToggle: (key: 'quizMethods' | 'reportDimensions', value: string) => void;
  onUpdateDraft: (updater: (current: AvatarWizardDraft) => AvatarWizardDraft) => void;
  onAiGenerateCover: () => void;
};

export function Step1ClassConfig({
  draft,
  selectedCourse,
  availableClasses,
  courseOptions,
  isLoadingCourses,
  fileInputRef,
  onCourseChange,
  onImageUpload,
  onClassToggle,
  onMultiCheckboxToggle,
  onUpdateDraft,
  onAiGenerateCover
}: Step1Props) {
  const { t } = useTranslation('teacher');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setIsCourseOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Box bg="white" borderRadius="20px" p={{ base: 5, md: 8 }} boxShadow={CARD_SHADOW}>
      <Text fontSize="lg" fontWeight={600} color="gray.800" mb={6}>
        {t('aiTeacher.avatar.create.step1.title')}
      </Text>

      <VStack spacing={6} align="stretch">
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight={600} color="gray.700">
            {t('aiTeacher.avatar.create.step1.courseSelect.label')}
          </FormLabel>
          <Box position="relative" ref={courseDropdownRef}>
            <Flex
              align="center"
              justify="space-between"
              h="40px"
              px={4}
              border="1px solid"
              borderColor={isCourseOpen ? PRIMARY_COLOR : 'gray.200'}
              borderRadius="lg"
              bg="white"
              cursor={isLoadingCourses ? 'not-allowed' : 'pointer'}
              onClick={() => !isLoadingCourses && setIsCourseOpen(!isCourseOpen)}
              transition="all 0.2s"
              _hover={!isLoadingCourses ? { borderColor: 'gray.300' } : undefined}
              role="combobox"
              aria-expanded={isCourseOpen}
              tabIndex={isLoadingCourses ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  !isLoadingCourses && setIsCourseOpen(!isCourseOpen);
                }
              }}
            >
              <Text fontSize="sm" color={draft.courseId ? 'gray.800' : 'gray.400'} noOfLines={1}>
                {isLoadingCourses
                  ? t('aiTeacher.avatar.common.fallback.loading')
                  : selectedCourse
                    ? `${selectedCourse.title}（${t('aiTeacher.avatar.common.units.hours', { count: selectedCourse.hours })}）[${t(`aiTeacher.avatar.common.courseType.${selectedCourse.type}`)}]`
                    : t('aiTeacher.avatar.create.step1.courseSelect.placeholder')}
              </Text>
              {isLoadingCourses ? (
                <Spinner size="sm" color="gray.400" />
              ) : (
                <ChevronDownIcon
                  boxSize={4}
                  color="gray.400"
                  transform={isCourseOpen ? 'rotate(180deg)' : undefined}
                  transition="transform 0.2s"
                />
              )}
            </Flex>

            {isCourseOpen && (
              <Box
                position="absolute"
                top="calc(100% + 4px)"
                left={0}
                right={0}
                zIndex={10}
                bg="white"
                borderRadius="lg"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                border="1px solid"
                borderColor="gray.100"
                maxH="280px"
                overflowY="auto"
                py={2}
              >
                {Array.from(new Set(courseOptions.map((course) => course.semester))).map(
                  (semester) => (
                    <Box key={semester}>
                      <Text fontSize="xs" fontWeight={600} color="gray.500" px={4} py={2}>
                        {semester}
                      </Text>
                      {courseOptions
                        .filter((course) => course.semester === semester)
                        .map((course) => {
                          const isSelected = course.id === draft.courseId;
                          return (
                            <Flex
                              key={course.id}
                              align="center"
                              px={4}
                              py={2.5}
                              cursor="pointer"
                              bg={isSelected ? 'gray.50' : 'transparent'}
                              _hover={{ bg: 'gray.50' }}
                              onClick={() => {
                                onCourseChange(course.id);
                                setIsCourseOpen(false);
                              }}
                            >
                              <Text
                                fontSize="sm"
                                color={isSelected ? PRIMARY_COLOR : 'gray.700'}
                                fontWeight={isSelected ? 500 : 400}
                              >
                                {course.title}（
                                {t('aiTeacher.avatar.common.units.hours', {
                                  count: course.hours
                                })}
                                ）[ {t(`aiTeacher.avatar.common.courseType.${course.type}`)}]
                              </Text>
                            </Flex>
                          );
                        })}
                    </Box>
                  )
                )}
              </Box>
            )}
          </Box>
          <Text fontSize="xs" color="gray.400" mt={1}>
            {t('aiTeacher.avatar.create.step1.courseSelect.helpText')}
          </Text>
        </FormControl>

        {selectedCourse && (
          <Box p={4} bg="gray.50" borderRadius="lg">
            <Text fontSize="sm" fontWeight={600} color="gray.700" mb={2}>
              {t('aiTeacher.avatar.create.step1.courseSelect.selectedInfo')}
            </Text>
            <Text fontSize="sm" color="gray.600">
              {t('aiTeacher.avatar.create.step1.courseSelect.courseName')}
              <Text as="span" fontWeight={600} color="gray.800">
                {selectedCourse.title}
              </Text>
            </Text>
            <Text fontSize="sm" color="gray.600" mt={1}>
              {t('aiTeacher.avatar.create.step1.courseSelect.courseHours', {
                hours: selectedCourse.hours
              })}
              　{t('aiTeacher.avatar.create.step1.courseSelect.courseType')}
              <Badge
                ml={2}
                bg={selectedCourse.type === 'required' ? 'rgba(200,62,62,0.1)' : 'green.100'}
                color={selectedCourse.type === 'required' ? PRIMARY_COLOR : 'green.700'}
              >
                {t(`aiTeacher.avatar.common.courseType.${selectedCourse.type}`)}
              </Badge>
            </Text>
          </Box>
        )}

        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight={600} color="gray.700">
            {t('aiTeacher.avatar.create.step1.courseImage.label')}
          </FormLabel>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {/* 上传图片 */}
            <Box
              position="relative"
              border={draft.courseImagePreview ? undefined : '1px dashed'}
              borderColor="gray.200"
              bg={draft.courseImagePreview ? undefined : '#fafafa'}
              borderRadius="14px"
              h="180px"
              overflow="hidden"
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
              _hover={
                draft.courseImagePreview
                  ? { opacity: 0.95 }
                  : { borderColor: PRIMARY_COLOR, bg: 'rgba(200,62,62,0.02)' }
              }
            >
              {draft.courseImagePreview ? (
                <>
                  <Box
                    as="img"
                    src={draft.courseImagePreview}
                    alt={t('aiTeacher.avatar.create.step1.courseImage.alt')}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                  <Flex position="absolute" inset={0} align="center" justify="center">
                    <Flex
                      as="button"
                      aria-label={t('aiTeacher.avatar.detail.catalog.preview')}
                      px="12px"
                      h="32px"
                      borderRadius="full"
                      bg="blackAlpha.500"
                      color="white"
                      align="center"
                      justify="center"
                      cursor="pointer"
                      fontSize="13px"
                      _hover={{ bg: 'blackAlpha.700' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPreviewOpen(true);
                      }}
                    >
                      {t('aiTeacher.avatar.detail.catalog.preview')}
                    </Flex>
                  </Flex>
                  <Flex
                    as="button"
                    aria-label={t('aiTeacher.avatar.create.step1.courseImage.removeAriaLabel')}
                    position="absolute"
                    top={2}
                    right={2}
                    w="28px"
                    h="28px"
                    borderRadius="full"
                    bg="blackAlpha.600"
                    color="white"
                    align="center"
                    justify="center"
                    cursor="pointer"
                    _hover={{ bg: 'blackAlpha.700' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateDraft((current) => ({
                        ...current,
                        courseImagePreview: '',
                        courseImageName: '',
                        updatedAt: new Date().toISOString()
                      }));
                    }}
                  >
                    <CloseIcon boxSize={3} />
                  </Flex>
                </>
              ) : (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  h="full"
                  gap="16px"
                  px="16px"
                >
                  <Flex
                    w="60px"
                    h="60px"
                    borderRadius="full"
                    bg="rgba(200,62,62,0.08)"
                    align="center"
                    justify="center"
                  >
                    <Image
                      src="/images/avatar/upload-cover.png"
                      width={60}
                      height={60}
                      alt={t('aiTeacher.avatar.create.step1.courseImage.uploadCoverAlt')}
                      unoptimized
                      style={{ borderRadius: '50%' }}
                    />
                  </Flex>
                  <Flex direction="column" align="center" gap="10px">
                    <Text fontSize="14px" fontWeight={500} color="#333">
                      {t('aiTeacher.avatar.create.step1.courseImage.uploadHint')}
                    </Text>
                    <Text fontSize="12px" color="#86909c">
                      {t('aiTeacher.avatar.create.step1.courseImage.uploadSpec')}
                    </Text>
                  </Flex>
                </Flex>
              )}
            </Box>

            {/* AI 生成封面 */}
            <Box
              borderRadius="14px"
              h="180px"
              cursor="pointer"
              onClick={onAiGenerateCover}
              _hover={{ opacity: 0.9 }}
              bg="linear-gradient(97deg, rgba(255,171,97,0.05) 18%, rgba(255,128,155,0.05) 58%, rgba(255,88,88,0.05) 95%)"
            >
              <Flex
                direction="column"
                align="center"
                justify="center"
                h="full"
                gap="16px"
                px="16px"
              >
                <Flex
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg="rgba(200,62,62,0.08)"
                  align="center"
                  justify="center"
                >
                  <Image
                    src="/images/avatar/ai-cover.png"
                    width={60}
                    height={60}
                    alt={t('aiTeacher.avatar.create.step1.courseImage.aiCoverAlt')}
                    unoptimized
                    style={{ borderRadius: '50%' }}
                  />
                </Flex>
                <Flex direction="column" align="center" gap="10px">
                  <Text fontSize="14px" fontWeight={500} color="#C8000B">
                    {t('aiTeacher.avatar.create.step1.courseImage.aiGenerateHint')}
                  </Text>
                  <Text fontSize="12px" color="#86909c">
                    {t('aiTeacher.avatar.create.step1.courseImage.aiGenerateSpec')}
                  </Text>
                </Flex>
              </Flex>
            </Box>
          </SimpleGrid>
          {draft.courseImageName && (
            <Text fontSize="xs" color="gray.500" mt={2}>
              {draft.courseImageName}
            </Text>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            display="none"
            onChange={(e) => onImageUpload(e.target.files?.[0])}
          />
        </FormControl>

        <Box>
          <Box mb={6}>
            <Text fontSize="sm" fontWeight={600} color="gray.700" mb={4}>
              {t('aiTeacher.avatar.create.step1.attachmentConfig.weightsTitle')}
            </Text>
            <VStack spacing={4} align="stretch">
              {(
                [
                  [
                    'knowledge',
                    t('aiTeacher.avatar.create.step1.attachmentConfig.weights.knowledge')
                  ],
                  ['ability', t('aiTeacher.avatar.create.step1.attachmentConfig.weights.ability')],
                  ['quality', t('aiTeacher.avatar.create.step1.attachmentConfig.weights.quality')]
                ] as const
              ).map(([key, label]) => {
                const levels = t(
                  `aiTeacher.avatar.create.step1.attachmentConfig.weightLevels.${key}`,
                  {
                    returnObjects: true
                  }
                ) as string[];
                const currentLevel = draft.weights[key];

                return (
                  <Box key={key} p={4} bg="gray.50" borderRadius="lg">
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="sm" fontWeight={600} color="gray.700">
                        {label}
                      </Text>
                      <Text fontSize="sm" color={PRIMARY_COLOR} fontWeight={600}>
                        {levels[currentLevel]}
                      </Text>
                    </Flex>
                    <Flex justify="space-between" fontSize="xs" color="gray.400" mb={2} px={1}>
                      {levels.map((level) => (
                        <Text key={level}>{level}</Text>
                      ))}
                    </Flex>
                    <Input
                      type="range"
                      min={0}
                      max={3}
                      step={1}
                      value={currentLevel}
                      px={0}
                      border="none"
                      h="8px"
                      bg="gray.200"
                      borderRadius="full"
                      sx={{
                        '&::-webkit-slider-thumb': {
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          bg: PRIMARY_COLOR,
                          width: '16px',
                          height: '16px',
                          borderRadius: 'full',
                          cursor: 'pointer'
                        },
                        '&::-moz-range-thumb': {
                          bg: PRIMARY_COLOR,
                          width: '16px',
                          height: '16px',
                          borderRadius: 'full',
                          cursor: 'pointer',
                          border: 'none'
                        }
                      }}
                      onChange={(e) =>
                        onUpdateDraft((current) => ({
                          ...current,
                          weights: {
                            ...current.weights,
                            [key]: Number(e.target.value)
                          },
                          updatedAt: new Date().toISOString()
                        }))
                      }
                    />
                  </Box>
                );
              })}
            </VStack>
          </Box>

          <VStack align="stretch" spacing={6}>
            <Box>
              <Text fontSize="sm" fontWeight={600} color="gray.700" mb={3}>
                {t('aiTeacher.avatar.create.step1.attachmentConfig.quizMethods')}
              </Text>
              <Flex gap={3} flexWrap="wrap">
                {QUIZ_METHOD_OPTIONS.map((item) => {
                  const isChecked = draft.quizMethods.includes(item);
                  return (
                    <Flex
                      key={item}
                      align="center"
                      gap={2}
                      px={4}
                      py={2.5}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor={isChecked ? PRIMARY_COLOR : 'gray.200'}
                      bg="white"
                      cursor="pointer"
                      onClick={() => onMultiCheckboxToggle('quizMethods', item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onMultiCheckboxToggle('quizMethods', item);
                        }
                      }}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={isChecked}
                      transition="all 0.2s"
                      _hover={{ borderColor: isChecked ? PRIMARY_COLOR : 'gray.300' }}
                    >
                      <Checkbox
                        isChecked={isChecked}
                        pointerEvents="none"
                        tabIndex={-1}
                        colorScheme="red"
                      />
                      <Text fontSize="sm" color={isChecked ? 'gray.800' : 'gray.500'}>
                        {t(`aiTeacher.avatar.common.quizMethods.${item}`)}
                      </Text>
                    </Flex>
                  );
                })}
              </Flex>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight={600} color="gray.700" mb={3}>
                {t('aiTeacher.avatar.create.step1.attachmentConfig.reportDimensions')}
              </Text>
              <Flex gap={3} flexWrap="wrap">
                {REPORT_DIMENSION_OPTIONS.map((item) => {
                  const isChecked = draft.reportDimensions.includes(item);
                  return (
                    <Flex
                      key={item}
                      align="center"
                      gap={2}
                      px={4}
                      py={2.5}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor={isChecked ? PRIMARY_COLOR : 'gray.200'}
                      bg="white"
                      cursor="pointer"
                      onClick={() => onMultiCheckboxToggle('reportDimensions', item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onMultiCheckboxToggle('reportDimensions', item);
                        }
                      }}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={isChecked}
                      transition="all 0.2s"
                      _hover={{ borderColor: isChecked ? PRIMARY_COLOR : 'gray.300' }}
                    >
                      <Checkbox
                        isChecked={isChecked}
                        pointerEvents="none"
                        tabIndex={-1}
                        colorScheme="red"
                      />
                      <Text fontSize="sm" color={isChecked ? 'gray.800' : 'gray.500'}>
                        {t(`aiTeacher.avatar.common.reportDimensions.${item}`)}
                      </Text>
                    </Flex>
                  );
                })}
              </Flex>
            </Box>
          </VStack>
        </Box>

        {selectedCourse?.type !== 'optional' && (
          <FormControl isRequired>
            <FormLabel fontSize="sm" fontWeight={600} color="gray.700">
              {t('aiTeacher.avatar.common.coverage.classAndMajor')}
            </FormLabel>
            {!selectedCourse ? (
              <Box
                p={8}
                bg="gray.50"
                borderRadius="lg"
                border="2px dashed"
                borderColor="gray.200"
                textAlign="center"
              >
                <InfoOutlineIcon color="gray.300" boxSize={6} mb={3} />
                <Text fontSize="sm" color="gray.500">
                  {t('aiTeacher.avatar.create.step1.coverage.selectCourseFirst')}
                </Text>
              </Box>
            ) : availableClasses.length === 0 ? (
              <Box p={8} bg="gray.50" borderRadius="lg" textAlign="center">
                <WarningIcon color="gray.400" boxSize={6} mb={3} />
                <Text fontSize="sm" color="gray.500">
                  {t('aiTeacher.avatar.create.step1.coverage.allOccupied')}
                </Text>
              </Box>
            ) : (
              <Box p={4} bg="gray.50" borderRadius="lg">
                <Text fontSize="xs" color="gray.500" mb={3}>
                  {t('aiTeacher.avatar.create.step1.coverage.requiredHint')}
                </Text>
                <Flex gap={3} flexWrap="wrap">
                  {availableClasses.map((className) => (
                    <Box
                      key={className}
                      as="label"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      px={3}
                      py={2}
                      bg="white"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={
                        draft.coverageClasses.includes(className) ? PRIMARY_COLOR : 'gray.200'
                      }
                      cursor="pointer"
                      _hover={{ borderColor: PRIMARY_COLOR }}
                    >
                      <Checkbox
                        colorScheme="red"
                        isChecked={draft.coverageClasses.includes(className)}
                        onChange={() => onClassToggle(className)}
                      />
                      <Text fontSize="sm" color="gray.700">
                        {className}
                      </Text>
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}
          </FormControl>
        )}

        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight={600} color="gray.700">
            {t('aiTeacher.avatar.common.time.range')}
          </FormLabel>
          <HStack spacing={4} align="flex-end">
            <Box flex="1">
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('aiTeacher.avatar.common.time.start')}
              </Text>
              <Input
                type="date"
                value={draft.startDate}
                cursor="pointer"
                sx={{
                  '&::-webkit-calendar-picker-indicator': {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    padding: 0,
                    cursor: 'pointer',
                    opacity: 0
                  }
                }}
                onChange={(e) =>
                  onUpdateDraft((current) => ({
                    ...current,
                    startDate: e.target.value,
                    updatedAt: new Date().toISOString()
                  }))
                }
              />
            </Box>
            <Text color="gray.400" pb={2}>
              {t('aiTeacher.avatar.common.time.to')}
            </Text>
            <Box flex="1">
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('aiTeacher.avatar.common.time.end')}
              </Text>
              <Input
                type="date"
                value={draft.endDate}
                cursor="pointer"
                sx={{
                  '&::-webkit-calendar-picker-indicator': {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    padding: 0,
                    cursor: 'pointer',
                    opacity: 0
                  }
                }}
                onChange={(e) =>
                  onUpdateDraft((current) => ({
                    ...current,
                    endDate: e.target.value,
                    updatedAt: new Date().toISOString()
                  }))
                }
              />
            </Box>
          </HStack>
        </FormControl>
      </VStack>

      {/* 图片预览 */}
      {isPreviewOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.800"
          zIndex={1500}
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={4}
          onClick={() => setIsPreviewOpen(false)}
        >
          <Box position="relative" maxW="800px" w="full">
            <Flex
              as="button"
              aria-label={t('aiTeacher.avatar.common.actions.close')}
              position="absolute"
              top="-40px"
              right={0}
              w="28px"
              h="28px"
              borderRadius="full"
              bg="whiteAlpha.200"
              color="white"
              align="center"
              justify="center"
              cursor="pointer"
              _hover={{ bg: 'whiteAlpha.300' }}
              onClick={(e) => {
                e.stopPropagation();
                setIsPreviewOpen(false);
              }}
            >
              <CloseIcon boxSize={3} />
            </Flex>
            <Box
              as="img"
              src={draft.courseImagePreview}
              w="full"
              maxH="80vh"
              objectFit="contain"
              borderRadius="lg"
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
