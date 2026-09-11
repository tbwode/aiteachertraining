'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ReactNode, SVGProps } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Select from '@/app/components/ui/Select';
import SvgIcon from '@/app/components/ui/SvgIcon';
import {
  joinAvatarStudy,
  postCourseSquarePage,
  postStudentMajorList,
  postStudentMajorListCategories,
  postStudentSemesterList
} from '@/api/student/student';
import { AITeacherPageClient } from '../../components/AITeacherPageClient';
import { useStudentAuthStore } from '@/student/store/auth';
import { studentProfileTokens } from '@/theme/designTokens';
import type { CoursePlazaCard, CoursePlazaOption, CoursePlazaPaginationItem } from '../types';
import {
  defaultCoursePlazaFilters,
  mapCourseSquareCard,
  type CoursePlazaFilters,
  type CoursePlazaSortType
} from '../types';

const PAGE_SIZE = 8;

const cardStyle = {
  bg: studentProfileTokens.card.bg,
  border: '1px solid #F2F4F7',
  borderRadius: '16px',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)'
} as const;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
};

const buildCourseDetailUrl = (course: CoursePlazaCard) => {
  const searchParams = new URLSearchParams({
    avatarId: String(course.avatarId),
    courseId: String(course.courseId),
    teachingTaskId: String(course.teachingTaskId),
    majorName: course.majorName,
    teacherName: course.teacherName,
    hours: String(course.hours)
  });

  return `/student/course-detail?${searchParams.toString()}`;
};

const buildPaginationItems = (current: number, pages: number): CoursePlazaPaginationItem[] => {
  if (pages <= 1) return [{ type: 'page', value: 1 }];

  const pageSet = new Set<number>([1, pages, current - 1, current, current + 1]);
  const pageNumbers = Array.from(pageSet)
    .filter((page) => page >= 1 && page <= pages)
    .sort((a, b) => a - b);

  const items: CoursePlazaPaginationItem[] = [];

  pageNumbers.forEach((page, index) => {
    const previous = pageNumbers[index - 1];
    if (previous !== undefined && page - previous > 1) {
      items.push({ type: 'ellipsis', value: `ellipsis-${previous}-${page}` });
    }
    items.push({ type: 'page', value: page });
  });

  return items;
};

export function CoursePlazaPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation('student');
  const emptyCategoryOptions = useMemo<CoursePlazaOption[]>(
    () => [{ label: t('coursePlaza.filters.allCategory'), value: '' }],
    [t]
  );
  const emptyMajorOptions = useMemo<CoursePlazaOption[]>(
    () => [{ label: t('coursePlaza.filters.allMajor'), value: '' }],
    [t]
  );
  const emptySemesterOptions = useMemo<CoursePlazaOption[]>(
    () => [{ label: t('coursePlaza.filters.allSemester'), value: '' }],
    [t]
  );
  const sortOptions = useMemo<CoursePlazaOption[]>(
    () => [
      { label: t('coursePlaza.filters.sortOptions.students'), value: '1' },
      { label: t('coursePlaza.filters.sortOptions.latest'), value: '2' }
    ],
    [t]
  );
  const studentId = useStudentAuthStore((state) => state.userInfo?.studentId);
  const [filters, setFilters] = useState<CoursePlazaFilters>(defaultCoursePlazaFilters);
  const deferredKeyword = useDeferredValue(filters.keyword);
  const [currentPage, setCurrentPage] = useState(1);
  const [courses, setCourses] = useState<CoursePlazaCard[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState('');
  const [joiningCourseId, setJoiningCourseId] = useState<number | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<CoursePlazaOption[]>(emptyCategoryOptions);
  const [majorOptions, setMajorOptions] = useState<CoursePlazaOption[]>(emptyMajorOptions);
  const [semesterOptions, setSemesterOptions] = useState<CoursePlazaOption[]>(emptySemesterOptions);

  useEffect(() => {
    let active = true;

    const loadFilters = async () => {
      setBootstrapping(true);

      const [categoryResult, semesterResult] = await Promise.allSettled([
        postStudentMajorListCategories(),
        postStudentSemesterList()
      ]);

      if (!active) return;

      if (categoryResult.status === 'fulfilled') {
        const nextOptions = categoryResult.value.map((item) => ({
          label: item.name || t('coursePlaza.fallbacks.unnamedCategory'),
          value: String(item.id || '')
        }));
        setCategoryOptions([...emptyCategoryOptions, ...nextOptions.filter((item) => item.value)]);
      } else {
        setCategoryOptions(emptyCategoryOptions);
      }

      if (semesterResult.status === 'fulfilled') {
        const nextOptions = semesterResult.value.map((item) => ({
          label: item.name || t('coursePlaza.fallbacks.unnamedSemester'),
          value: String(item.id || '')
        }));
        setSemesterOptions([...emptySemesterOptions, ...nextOptions.filter((item) => item.value)]);
      } else {
        setSemesterOptions(emptySemesterOptions);
      }

      setBootstrapping(false);
    };

    loadFilters();

    return () => {
      active = false;
    };
  }, [emptyCategoryOptions, emptySemesterOptions, t]);

  useEffect(() => {
    let active = true;

    const loadMajors = async () => {
      try {
        const result = await postStudentMajorList({
          categoryId: filters.categoryId ? Number(filters.categoryId) : undefined
        });

        if (!active) return;

        const nextOptions = result.map((item) => ({
          label: item.name || t('coursePlaza.fallbacks.unnamedMajor'),
          value: String(item.id || '')
        }));
        setMajorOptions([...emptyMajorOptions, ...nextOptions.filter((item) => item.value)]);
      } catch {
        if (!active) return;
        setMajorOptions(emptyMajorOptions);
      }
    };

    loadMajors();

    return () => {
      active = false;
    };
  }, [emptyMajorOptions, filters.categoryId, t]);

  useEffect(() => {
    if (!studentId) {
      setCourses([]);
      setTotal(0);
      setPages(1);
      setLoading(false);
      setError(t('coursePlaza.feedback.missingStudent'));
      return;
    }

    let active = true;

    const loadCourses = async () => {
      try {
        setLoading(true);
        setError('');

        const result = await postCourseSquarePage({
          current: currentPage,
          size: PAGE_SIZE,
          searchKey: deferredKeyword.trim() || undefined,
          studentId,
          categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
          majorId: filters.majorId ? Number(filters.majorId) : undefined,
          semesterId: filters.semesterId ? Number(filters.semesterId) : undefined,
          sortType: Number(filters.sortType) as 1 | 2
        });

        if (!active) return;

        setCourses((result.records || []).map(mapCourseSquareCard));
        setTotal(Number(result.total ?? 0));
        setPages(Math.max(1, Number(result.pages ?? 1)));
      } catch (error) {
        if (!active) return;
        setCourses([]);
        setTotal(0);
        setPages(1);
        setError(getErrorMessage(error, t('coursePlaza.feedback.loadError')));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, [
    currentPage,
    deferredKeyword,
    filters.categoryId,
    filters.majorId,
    filters.semesterId,
    filters.sortType,
    refreshIndex,
    studentId,
    t
  ]);

  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, pages),
    [currentPage, pages]
  );

  const handleFilterChange = <K extends keyof CoursePlazaFilters>(
    key: K,
    value: CoursePlazaFilters[K]
  ) => {
    setCurrentPage(1);
    setFilters((prev) => ({
      ...prev,
      ...(key === 'categoryId' ? { majorId: '' } : {}),
      [key]: value
    }));
  };

  const handleResetFilters = () => {
    setCurrentPage(1);
    setFilters(defaultCoursePlazaFilters);
  };

  const handleOpenCourse = (course: CoursePlazaCard) => {
    router.push(buildCourseDetailUrl(course));
  };

  const handleJoinCourse = async (course: CoursePlazaCard) => {
    if (!studentId) {
      toast({
        title: t('coursePlaza.feedback.missingStudent'),
        status: 'error'
      });
      return;
    }

    try {
      setJoiningCourseId(course.courseId);
      await joinAvatarStudy({
        avatarId: course.avatarId
      });
      toast({
        title: t('coursePlaza.feedback.joinSuccess'),
        status: 'success'
      });
      setRefreshIndex((value) => value + 1);
    } catch (error) {
      toast({
        title: getErrorMessage(error, t('coursePlaza.feedback.joinError')),
        status: 'error'
      });
    } finally {
      setJoiningCourseId(null);
    }
  };

  return (
    <Box pb="28px" maxW="1128px">
      <Box mb="32px">
        <AITeacherPageClient showExploreBanner={false} />
      </Box>

      <Flex align="center" gap="8px" mb="16px">
        <LayoutGridIcon width="20px" height="20px" color="#C83E3E" />
        <Text fontSize="18px" fontWeight={600} color="#1F2937">
          {t('coursePlaza.electiveTitle')}
        </Text>
      </Flex>

      <Flex
        direction={{ base: 'column', lg: 'row' }}
        gap={{ base: '12px', lg: '14px' }}
        align={{ base: 'stretch', lg: 'center' }}
        mb="18px"
      >
        <Box position="relative" flex="1" maxW={{ base: '100%', lg: '664px' }}>
          <Input
            value={filters.keyword}
            onChange={(event) => handleFilterChange('keyword', event.target.value)}
            placeholder={t('coursePlaza.searchPlaceholder')}
            rightIcon={<SearchIcon width="16px" height="16px" />}
            h="40px"
            minH="40px"
            borderRadius="10px"
            borderColor="#E5E7EB"
            color="#1F2937"
            _placeholder={{ color: '#9CA3AF' }}
            _hover={{ borderColor: '#D1D5DB' }}
            _focusVisible={{
              borderColor: '#D7000F',
              boxShadow: '0 0 0 1px #D7000F'
            }}
          />
        </Box>

        <Flex
          flexWrap={{ base: 'wrap', lg: 'nowrap' }}
          gap={{ base: '10px', lg: '12px' }}
          align="center"
          flexShrink={0}
        >
          <Select
            value={filters.categoryId}
            onChange={(value) => handleFilterChange('categoryId', value)}
            w="104px"
            minW="104px"
            h="40px"
            options={categoryOptions}
            placeholder={t('coursePlaza.filters.allCategory')}
          />

          <Select
            value={filters.majorId}
            onChange={(value) => handleFilterChange('majorId', value)}
            w="104px"
            minW="104px"
            h="40px"
            options={majorOptions}
            placeholder={t('coursePlaza.filters.allMajor')}
          />

          <Select
            value={filters.semesterId}
            onChange={(value) => handleFilterChange('semesterId', value)}
            w="104px"
            minW="104px"
            h="40px"
            options={semesterOptions}
            placeholder={t('coursePlaza.filters.allSemester')}
          />

          <Button
            h="40px"
            minW="120px"
            px="18px"
            borderRadius="10px"
            border="1px solid #1F2937"
            bg="#FFFFFF"
            color="#111827"
            fontSize="13px"
            fontWeight={500}
            leftIcon={<ResetIcon width="14px" height="14px" />}
            _hover={{ bg: '#F9FAFB' }}
            onClick={handleResetFilters}
          >
            {t('coursePlaza.resetFilters')}
          </Button>
        </Flex>
      </Flex>

      <Flex
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap="12px"
        mb="16px"
      >
        <Text fontSize="14px" color="#374151">
          {t('coursePlaza.resultCount', { count: total })}
        </Text>

        <Select
          value={filters.sortType}
          onChange={(value) => handleFilterChange('sortType', value as CoursePlazaSortType)}
          w="117px"
          options={sortOptions}
          placeholder={t('coursePlaza.filters.sortOptions.latest')}
        />
      </Flex>

      {bootstrapping || loading ? (
        <CoursePlazaLoadingState />
      ) : error ? (
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
              bg="#D7000F"
              color="#FFFFFF"
              _hover={{ bg: '#BF000D' }}
              onClick={() => setRefreshIndex((value) => value + 1)}
            >
              {t('coursePlaza.feedback.retry')}
            </Button>
          </Flex>
        </Box>
      ) : courses.length === 0 ? (
        <Box
          minH="278px"
          w="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          <Flex direction="column" align="center" justify="center" gap="16px">
            <SvgIcon
              src="/imgs/app/student/nodata.svg"
              alt={t('coursePlaza.feedback.noDataAlt')}
              width="220px"
              height="220px"
              objectFit="contain"
            />
          </Flex>
        </Box>
      ) : (
        <>
          <SimpleGrid columns={4} spacing="14px">
            {courses.map((course) => (
              <CourseCard
                key={`${course.courseId}-${course.teachingTaskId}`}
                course={course}
                joining={joiningCourseId === course.courseId}
                onJoin={handleJoinCourse}
                onOpen={handleOpenCourse}
              />
            ))}
          </SimpleGrid>

          <Flex justify="center" align="center" gap="6px" mt="24px">
            <IconPageButton
              ariaLabel={t('coursePlaza.pagination.previous')}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                  onClick={() => setCurrentPage(item.value)}
                >
                  {item.value}
                </PageButton>
              )
            )}

            <IconPageButton
              ariaLabel={t('coursePlaza.pagination.next')}
              disabled={currentPage >= pages}
              onClick={() => setCurrentPage((page) => Math.min(pages, page + 1))}
            >
              <ChevronRightIcon width="14px" height="14px" />
            </IconPageButton>
          </Flex>
        </>
      )}
    </Box>
  );
}

function CoursePlazaLoadingState() {
  return (
    <>
      <SimpleGrid columns={4} spacing="14px">
        {Array.from({ length: PAGE_SIZE }).map((_, index) => (
          <Box
            key={`course-plaza-skeleton-${index}`}
            overflow="hidden"
            minH="248px"
            bg="#FFFFFF"
            borderRadius="16px"
            boxShadow="0 5px 8.8px 0 rgba(0, 0, 0, 0.05)"
          >
            <Skeleton h="144px" borderRadius="14px" m="8px 8px 0" />

            <Box p="10px 12px 12px">
              <Skeleton h="20px" borderRadius="8px" mb="7px" />
              <Skeleton h="18px" borderRadius="8px" mb="12px" w="68%" />
              <Skeleton h="28px" borderRadius="10px" mb="10px" />
              <Skeleton h="40px" borderRadius="12px" />
            </Box>
          </Box>
        ))}
      </SimpleGrid>

      <Flex justify="center" align="center" gap="6px" mt="24px">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton
            key={`course-plaza-pagination-skeleton-${index}`}
            w="28px"
            h="28px"
            borderRadius="8px"
          />
        ))}
      </Flex>
    </>
  );
}

function CourseCard({
  course,
  joining,
  onJoin,
  onOpen
}: {
  course: CoursePlazaCard;
  joining: boolean;
  onJoin: (course: CoursePlazaCard) => Promise<void>;
  onOpen: (course: CoursePlazaCard) => void;
}) {
  const { t } = useTranslation('student');
  const isRequiredJoined = course.courseType === 1 && !course.isEnrolled;
  const actionLabel = course.isEnrolled
    ? t('coursePlaza.actions.continueStudy')
    : isRequiredJoined
      ? t('coursePlaza.actions.joined')
      : t('coursePlaza.actions.joinLearning');
  const actionVariant = course.isEnrolled ? 'next' : isRequiredJoined ? 'danger' : 'primary';

  const handleAction = () => {
    if (course.isEnrolled || isRequiredJoined) {
      onOpen(course);
      return;
    }
    void onJoin(course);
  };

  return (
    <Box
      overflow="hidden"
      minH="248px"
      bg="#FFFFFF"
      borderRadius="16px"
      boxShadow="0 5px 8.8px 0 rgba(0, 0, 0, 0.05)"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 20px rgba(17, 24, 39, 0.10)'
      }}
    >
      <Box
        position="relative"
        h="144px"
        bg="linear-gradient(135deg, #EEF2FF 0%, #F9FAFB 100%)"
        borderRadius="14px"
        cursor="pointer"
        m="8px 8px 0"
        overflow="hidden"
        onClick={() => onOpen(course)}
      >
        {course.coverUrl ? (
          <Box
            as="img"
            src={course.coverUrl}
            alt={course.courseName}
            w="100%"
            h="100%"
            objectFit="cover"
            bg="#F8FAFC"
          />
        ) : null}

        {course.isEnrolled ? (
          <Box
            position="absolute"
            top="9px"
            right="10px"
            px="7px"
            py="2px"
            borderRadius="999px"
            bg="#FDECEE"
            color="#D7000F"
            fontSize="10px"
            fontWeight={600}
            lineHeight="16px"
          >
            {t('coursePlaza.badges.enrolled')}
          </Box>
        ) : null}
      </Box>

      <Box p="10px 12px 12px">
        <Text
          fontSize="18px"
          fontWeight={600}
          color="#1D2129"
          lineHeight="20px"
          mb="5px"
          noOfLines={1}
          cursor="pointer"
          onClick={() => onOpen(course)}
        >
          {course.courseName}
        </Text>

        <Text fontSize="14px" color="#86909C" lineHeight="18px" mb="12px" noOfLines={1}>
          {course.categoryName} - {course.majorName}
        </Text>

        <Flex
          h="28px"
          border="1px solid #EEF2F6"
          borderRadius="10px"
          align="center"
          justify="space-between"
          px="10px"
          mb="10px"
          color="#98A2B3"
          fontSize="11px"
        >
          <Flex align="center" gap="4px" minW={0}>
            <UserIcon width="12px" height="12px" />
            <Text noOfLines={1}>{course.teacherName}</Text>
          </Flex>

          <Flex align="center" gap="4px">
            <UsersIcon width="12px" height="12px" />
            <Text>{t('coursePlaza.labels.studentCount', { value: course.studentCount })}</Text>
          </Flex>
        </Flex>

        <Button
          w="100%"
          variant={actionVariant}
          isLoading={joining}
          loadingText={t('coursePlaza.feedback.processing')}
          onClick={handleAction}
        >
          {actionLabel}
        </Button>
      </Box>
    </Box>
  );
}

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
      minW="28px"
      h="28px"
      px="0"
      borderRadius="8px"
      bg={active ? '#2F3136' : 'transparent'}
      color={active ? '#FFFFFF' : '#6B7280'}
      fontSize="12px"
      fontWeight={500}
      _hover={{ bg: active ? '#2F3136' : '#F3F4F6' }}
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
      minW="28px"
      h="28px"
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

function CoursePlazaHeroIcon() {
  const { t } = useTranslation('student');

  return (
    <Box w="72px" h="72px" flexShrink={0}>
      <SvgIcon
        src="/imgs/app/student/CoursePlazaHero.svg"
        alt={t('coursePlaza.title')}
        width="72px"
        height="72px"
        objectFit="contain"
      />
    </Box>
  );
}

function LayoutGridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ResetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20 11a8 8 0 1 1-2.34-5.66L20 8" />
      <path d="M20 4v4h-4" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
