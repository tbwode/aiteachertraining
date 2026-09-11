'use client';

/**
 * AI视频课 项目工作台
 * 按 project.status 状态机渲染：draft→分镜编辑 / queued|generating→生成进度 /
 * failed→失败兜底 / success→预览下载
 * （静态导出约束：项目 id 通过 query 传递 /teacher/ai-video/project?id=xxx）
 */
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Flex, Spinner, Text } from '@chakra-ui/react';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import Empty from '@/app/components/ui/Empty';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import { StoryboardEditor } from '../components/StoryboardEditor';
import { GenerateProgress } from '../components/GenerateProgress';
import { VideoResult } from '../components/VideoResult';
import { PreviewEditStep } from '../components/ppt/editor/PreviewEditStep';
import { useProjectDetail } from '../hooks/useProjectDetail';
import { AI_VIDEO_PRIMARY, PAGE_MAX_WIDTH } from '../constants';

function AiVideoProjectContent() {
  const isI18nReady = useTeacherPageI18n(['aiVideo']);
  const { t } = useTranslation('teacher');
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const { project, isLoading, notFound, setProject } = useProjectDetail(id);

  if (!isI18nReady) return null;

  // 成片工作台为全屏编辑器版式（自带顶栏/时间轴），脱离常规容器
  if (!isLoading && project?.status === 'success') {
    return <VideoResult project={project} onProjectChange={setProject} />;
  }

  // 文本与模板入口在分镜准备完成后统一进入 Leadde 式可视化编辑器：
  // 左侧片段、中间画布、右侧工具与底部口播稿，提交后就地进入合成进度。
  if (
    !isLoading &&
    project?.status === 'draft' &&
    (project.mode === 'text' || project.mode === 'template') &&
    project.storyboardPending !== true
  ) {
    return (
      <PreviewEditStep
        project={project}
        pages={[]}
        onBack={() => router.push('/teacher/ai-video')}
        startReady
        onSubmitted={setProject}
      />
    );
  }

  return (
    <Box bg="gray.50" minH="calc(100vh - 64px)" py={8}>
      <Box maxW={PAGE_MAX_WIDTH} mx="auto" px={6}>
        <Button
          size="sm"
          variant="outline"
          bg="white"
          color="gray.600"
          leftIcon={<ChevronLeft size={15} />}
          onClick={() => router.push('/teacher/ai-video')}
          mb={5}
        >
          {t('aiVideo.workspace.back')}
        </Button>

        {isLoading ? (
          <Flex justify="center" py={24}>
            <Spinner size="lg" color={AI_VIDEO_PRIMARY} />
          </Flex>
        ) : notFound || !project ? (
          <Box bg="white" borderRadius="16px">
            <Empty
              title={t('aiVideo.workspace.notFound')}
              action={
                <Button
                  variant="primary"
                  bg={AI_VIDEO_PRIMARY}
                  borderColor={AI_VIDEO_PRIMARY}
                  onClick={() => router.push('/teacher/ai-video')}
                >
                  {t('aiVideo.workspace.back')}
                </Button>
              }
            />
          </Box>
        ) : (
          <>
            <Text fontSize="sm" color="gray.400" mb={4}>
              {project.title}
            </Text>
            {project.status === 'draft' ? (
              <StoryboardEditor project={project} onProjectChange={setProject} />
            ) : (
              <GenerateProgress project={project} onProjectChange={setProject} />
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

export default function AiVideoProjectPage() {
  return (
    <Suspense fallback={null}>
      <AiVideoProjectContent />
    </Suspense>
  );
}
