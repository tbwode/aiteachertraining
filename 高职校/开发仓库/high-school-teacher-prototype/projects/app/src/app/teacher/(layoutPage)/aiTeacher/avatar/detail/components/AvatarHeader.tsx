import { Box, Flex, Grid, HStack, Image, Tag, Text } from '@chakra-ui/react';
import { BookOpenText, CalendarDays, MessageCircleMore, Network, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AiAvatarChapterVO, AiAvatarDetailVO } from '@/teacher/types/aiTeacher';

type AvatarHeaderProps = {
  storedRecord: any;
  storedCourse: any;
  avatarDetail: AiAvatarDetailVO | null;
};

function countKnowledgePoints(chapters: AiAvatarChapterVO[]): number {
  return chapters.reduce(
    (total, chapter) =>
      total + (chapter.knowledgePoints?.length || 0) + countKnowledgePoints(chapter.children || []),
    0
  );
}

export function AvatarHeader({ storedRecord, storedCourse, avatarDetail }: AvatarHeaderProps) {
  const { t } = useTranslation('teacher');
  const detailTitle =
    avatarDetail?.courseName ??
    storedRecord?.title ??
    t('aiTeacher.avatar.common.fallback.unnamedCourse');

  const getStatusInfo = (status?: number) => {
    if (status === 1) {
      return {
        label: t('aiTeacher.avatar.common.status.running'),
        color: '#147D64',
        bg: '#EAF8F3',
        dot: '#22A06B'
      };
    }
    if (status === 2) {
      return {
        label: t('aiTeacher.avatar.common.status.expired'),
        color: '#646A73',
        bg: '#F2F3F5',
        dot: '#86909C'
      };
    }
    return {
      label: t('aiTeacher.avatar.common.status.pending'),
      color: '#AD6800',
      bg: '#FFF7E6',
      dot: '#F59E0B'
    };
  };

  const formatDate = (dateStr?: string) => (dateStr ? dateStr.split(' ')[0] : '');
  const statusInfo = getStatusInfo(avatarDetail?.status);
  const detailSemester = avatarDetail?.semesterName ?? storedRecord?.semester ?? '2024秋季';
  const startDate = formatDate(avatarDetail?.startTime) || storedRecord?.startDate || '2026-03-01';
  const endDate = formatDate(avatarDetail?.endTime) || storedRecord?.endDate || '2026-07-01';
  const detailDateRange = t('aiTeacher.avatar.common.time.dateRange', {
    start: startDate,
    end: endDate
  });

  const getCoverageText = () => {
    if (avatarDetail) {
      const selectedClasses = (avatarDetail.classList || []).filter(
        (item) => item.isSelected !== false
      );
      if (selectedClasses.length > 0) {
        return t('aiTeacher.avatar.detail.header.coverageClasses', {
          classes: selectedClasses.map((item) => item.className).join('、'),
          count: selectedClasses.length
        });
      }
      if (avatarDetail.majorList?.length > 0) {
        return t('aiTeacher.avatar.detail.header.coverageMajors', {
          majors: avatarDetail.majorList.map((item) => item.majorName).join('、')
        });
      }
    }

    if (storedRecord) {
      if (storedRecord.courseType === 'optional') {
        return t('aiTeacher.avatar.detail.header.coverageMajors', {
          majors:
            storedCourse?.majors?.join('、') ??
            t('aiTeacher.avatar.common.coverage.autoMajorAggregate')
        });
      }
      return t('aiTeacher.avatar.detail.header.coverageClasses', {
        classes: storedRecord.coverageClasses?.join('、') || '--',
        count: storedRecord.coverageClasses?.length || 0
      });
    }

    return t('aiTeacher.avatar.common.fallback.none');
  };

  const detailHeroBg = storedCourse?.heroBg ?? 'linear-gradient(135deg, #FEE2E2 0%, #FED7AA 100%)';
  const detailHeroText = storedCourse?.heroText ?? '课';
  const studentCount = avatarDetail?.studentCount ?? storedRecord?.studentCount ?? 0;
  const interactionCount = avatarDetail?.todayInteractionCount ?? storedRecord?.interactions ?? 0;
  const knowledgeCount = countKnowledgePoints(avatarDetail?.chapterList || []);

  const metrics = [
    {
      label: t('aiTeacher.avatar.detail.header.students', '覆盖学生'),
      value: studentCount,
      suffix: '人',
      icon: UsersRound,
      color: '#147D64',
      bg: '#EAF8F3'
    },
    {
      label: t('aiTeacher.avatar.detail.header.interactions', '今日互动'),
      value: interactionCount,
      suffix: '次',
      icon: MessageCircleMore,
      color: '#C8000B',
      bg: '#FFF1F0'
    },
    {
      label: t('aiTeacher.avatar.detail.header.knowledgePoints', '知识点'),
      value: knowledgeCount,
      suffix: '个',
      icon: Network,
      color: '#6B46C1',
      bg: '#FAF5FF'
    }
  ];

  return (
    <Box
      as="section"
      aria-labelledby="avatar-detail-title"
      bg="white"
      border="1px solid #E5E6EB"
      borderRadius={{ base: '18px', md: '22px' }}
      boxShadow="0 10px 32px rgba(31,35,41,0.07)"
      p={{ base: 4, md: 6 }}
    >
      <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 5, md: 6 }} align="stretch">
        <Box
          position="relative"
          w={{ base: '100%', md: '252px' }}
          h={{ base: '176px', md: '168px' }}
          borderRadius="16px"
          overflow="hidden"
          bg={avatarDetail?.coverUrl ? '#F2F3F5' : detailHeroBg}
          flexShrink={0}
        >
          {avatarDetail?.coverUrl ? (
            <Image
              src={avatarDetail.coverUrl}
              alt={detailTitle}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          ) : (
            <Flex w="100%" h="100%" align="center" justify="center">
              <Text fontSize="52px" fontWeight={800} color="rgba(200,62,62,0.22)">
                {detailHeroText}
              </Text>
            </Flex>
          )}
          <Box
            position="absolute"
            inset={0}
            bg="linear-gradient(180deg, transparent 50%, rgba(20,22,30,.26))"
          />
          <Tag
            position="absolute"
            left={3}
            bottom={3}
            borderRadius="full"
            bg="rgba(255,255,255,.92)"
            color="#4E5969"
            fontSize="11px"
          >
            <BookOpenText size={13} style={{ marginRight: 6 }} aria-hidden="true" />
            AI 课程分身
          </Tag>
        </Box>

        <Flex direction="column" flex="1" minW={0}>
          <Flex align="flex-start" justify="space-between" gap={3} flexWrap="wrap">
            <Box minW={0}>
              <Tag
                borderRadius="full"
                bg={statusInfo.bg}
                color={statusInfo.color}
                fontSize="11px"
                mb={2}
              >
                <Box w="6px" h="6px" borderRadius="full" bg={statusInfo.dot} mr={2} />
                {statusInfo.label}
              </Tag>
              <Text
                id="avatar-detail-title"
                as="h1"
                fontSize={{ base: '23px', md: '28px' }}
                lineHeight="1.3"
                fontWeight={750}
                color="#1D2129"
              >
                {detailTitle}
              </Text>
            </Box>
          </Flex>

          <Flex mt={3} gap={{ base: 2, md: 5 }} color="#646A73" flexWrap="wrap">
            <HStack spacing={1.5}>
              <CalendarDays size={14} aria-hidden="true" />
              <Text fontSize="12px">{detailSemester}</Text>
            </HStack>
            <HStack spacing={1.5}>
              <CalendarDays size={14} aria-hidden="true" />
              <Text fontSize="12px">{detailDateRange}</Text>
            </HStack>
          </Flex>

          <Text mt={3} fontSize="12px" color="#646A73" noOfLines={2} title={getCoverageText()}>
            {getCoverageText()}
          </Text>

          {avatarDetail?.description ? (
            <Text mt={2} fontSize="12px" lineHeight="1.65" color="#86909C" noOfLines={2}>
              {avatarDetail.description}
            </Text>
          ) : null}
        </Flex>
      </Flex>

      <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap={{ base: 2, md: 3 }} mt={5}>
        {metrics.map(({ label, value, suffix, icon: Icon, color, bg }) => (
          <Flex
            key={label}
            align="center"
            gap={{ base: 2, md: 3 }}
            bg="#F7F8FA"
            borderRadius="13px"
            p={{ base: 2.5, md: 3 }}
            minW={0}
          >
            <Flex
              display={{ base: 'none', sm: 'flex' }}
              w="34px"
              h="34px"
              flexShrink={0}
              borderRadius="10px"
              bg={bg}
              color={color}
              align="center"
              justify="center"
            >
              <Icon size={17} aria-hidden="true" />
            </Flex>
            <Box minW={0}>
              <Text fontSize="10px" color="#86909C" noOfLines={1}>
                {label}
              </Text>
              <Text
                fontSize={{ base: '16px', md: '18px' }}
                fontWeight={700}
                color="#1D2129"
                noOfLines={1}
              >
                {value}
                <Text as="span" ml={1} fontSize="10px" color="#86909C" fontWeight={400}>
                  {suffix}
                </Text>
              </Text>
            </Box>
          </Flex>
        ))}
      </Grid>
    </Box>
  );
}
