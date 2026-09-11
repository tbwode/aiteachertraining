import { Box, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { AiAvatarDetailVO } from '@/teacher/types/aiTeacher';
import { CourseMarkmap } from '@/components/CourseMarkmap';
import type { ChapterVO } from '@/types/api/student/student';

type TabIntroductionProps = {
  detailTitle: string;
  avatarDetail: AiAvatarDetailVO | null;
};

/**
 * 将AiAvatarChapterVO转换为ChapterVO格式
 */
function convertToChapterVO(chapter: any): ChapterVO {
  return {
    chapterId: chapter.id,
    title: chapter.title,
    sortOrder: chapter.sortOrder,
    knowledgePoints: Array.isArray(chapter.knowledgePoints)
      ? chapter.knowledgePoints.map((kp: any) => {
          if (typeof kp === 'string') {
            return { name: kp };
          }
          return { id: kp.id, name: kp.name, sortOrder: kp.sortOrder };
        })
      : [],
    children: chapter.children ? chapter.children.map(convertToChapterVO) : []
  };
}

export function TabIntroduction({ detailTitle, avatarDetail }: TabIntroductionProps) {
  const { t } = useTranslation('teacher');

  return (
    <VStack spacing={6} align="stretch">
      {/* 课程介绍 */}
      <Box bg="white" borderRadius="20px" boxShadow="0 2px 12px rgba(0,0,0,0.08)" p={6}>
        <Text fontSize="lg" fontWeight={600} color="gray.800" mb={4}>
          {t('aiTeacher.avatar.detail.intro.title')}
        </Text>
        {avatarDetail?.description ? (
          <VStack align="flex-start" spacing={4} color="gray.600" lineHeight="1.8">
            <Text whiteSpace="pre-wrap">{avatarDetail.description}</Text>
          </VStack>
        ) : (
          <Text color="gray.400" fontSize="sm">
            {t('aiTeacher.avatar.common.fallback.none')}
          </Text>
        )}
      </Box>

      {/* 知识图谱 */}
      {avatarDetail?.chapterList && avatarDetail.chapterList.length > 0 && (
        <Box bg="white" borderRadius="20px" boxShadow="0 2px 12px rgba(0,0,0,0.08)" p={6}>
          <Text fontSize="lg" fontWeight={600} color="gray.800" mb={4}>
            {t('aiTeacher.avatar.detail.graph.title')}
          </Text>
          <CourseMarkmap
            courseName={detailTitle}
            chapters={avatarDetail.chapterList.map(convertToChapterVO)}
          />
        </Box>
      )}
    </VStack>
  );
}
