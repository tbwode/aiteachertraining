'use client';

/** PPT/文档转视频：上传解析、统一生成配置、进入逐页分镜编辑器。 */
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Collapse, Flex, Grid, Tag, Text, useToast, VStack } from '@chakra-ui/react';
import { FileCheck2, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import {
  createPptProject,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_DIGITAL_HUMAN_CONFIG,
  DEFAULT_DIGITAL_HUMAN_PLACEMENT,
  DEFAULT_SUBTITLE_CONFIG,
  deleteProject,
  getProject,
  mockParsePptFile
} from '@/teacher/api/aiVideo';
import type {
  AiVideoDuration,
  AiVideoProject,
  AiVideoStyle,
  AiVideoVoice,
  PptScriptMode
} from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY, CARD_SHADOW } from '../../constants';
import { UploadStep, type UploadedPptFile } from '../../components/ppt/UploadStep';
import { PreviewEditStep } from '../../components/ppt/editor/PreviewEditStep';
import {
  CreatorControlBar,
  CreatorFlowHeader,
  CreatorTemplateStrip,
  type CreatorPresenter
} from '../../components/CreatorSetup';

const SCRIPT_MODES: Array<{ key: PptScriptMode; label: string; description: string }> = [
  { key: 'concise', label: '精简讲解', description: '聚焦页面要点，适合微课与复习' },
  { key: 'detailed', label: '详细授课', description: '补充案例与衔接，适合完整课堂' },
  { key: 'formal', label: '正式汇报', description: '表达严谨，适合教学成果汇报' },
  { key: 'minimal', label: '极简字幕', description: '保留标题与关键词，突出原始课件' }
];

const TEMPLATE_OPTIONS = [
  'simpleCourseware',
  'realistic',
  'corporate',
  'documentary'
] as const;

function AiVideoCreatePptContent() {
  const isI18nReady = useTeacherPageI18n(['aiVideo']);
  const { t } = useTranslation('teacher');
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [file, setFile] = useState<UploadedPptFile | null>(null);
  const [pages, setPages] = useState<ReturnType<typeof mockParsePptFile>>([]);
  const [parseDone, setParseDone] = useState(false);
  const [template, setTemplate] = useState<AiVideoStyle>('simpleCourseware');
  const [voice, setVoice] = useState<AiVideoVoice>('femaleClear');
  const [duration, setDuration] = useState<AiVideoDuration>('smart');
  const [scriptMode, setScriptMode] = useState<PptScriptMode>('concise');
  const [presenter, setPresenter] = useState<CreatorPresenter>('yunshu');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [project, setProject] = useState<AiVideoProject | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadedProject, setLoadedProject] = useState<AiVideoProject | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!editId) return;
    let active = true;
    void getProject(editId).then((found) => {
      if (!active) return;
      if (found && found.mode === 'ppt') setLoadedProject(found);
      else setLoadFailed(true);
    });
    return () => {
      active = false;
    };
  }, [editId]);

  if (!isI18nReady) return null;

  if (editId) {
    if (loadedProject) {
      return (
        <PreviewEditStep
          project={loadedProject}
          pages={
            loadedProject.sourceFileName
              ? mockParsePptFile(loadedProject.sourceFileName).filter((page) => !page.blank)
              : []
          }
          onBack={() => router.push('/teacher/ai-video')}
          startReady
        />
      );
    }
    if (loadFailed) {
      router.replace('/teacher/ai-video/create/ppt');
      return null;
    }
    return null;
  }

  const handleUploadSuccess = (uploaded: UploadedPptFile) => {
    setFile(uploaded);
    setPages(mockParsePptFile(uploaded.name));
    setParseDone(false);
  };

  const handleEnterPreview = async () => {
    if (!file || !parseDone || isCreating) return;
    setIsCreating(true);
    try {
      if (project) await deleteProject(project.id);
      const { project: created } = await createPptProject({
        fileName: file.name,
        pages,
        params: { ratio: '16:9', duration, style: template },
        audio: { ...DEFAULT_AUDIO_CONFIG, voice },
        subtitle: { ...DEFAULT_SUBTITLE_CONFIG },
        digitalHuman: {
          ...DEFAULT_DIGITAL_HUMAN_CONFIG,
          enabled: presenter !== 'none',
          avatar: presenter === 'none' ? 'yunshu' : presenter,
          mode: 'halfBody',
          placement: { ...DEFAULT_DIGITAL_HUMAN_PLACEMENT }
        },
        digitalHumanDisabledPages: [],
        pptConfig: {
          scriptMode,
          pageDuration: 'auto',
          customDuration: 5,
          transition: 'smooth',
          transitionGap: 1,
          resolution: '1080p',
          quality: 'medium',
          frameRate: 25,
          watermark: false,
          emotion: 'warm',
          smartAvoid: true,
          layout: 'leftDh'
        }
      });
      setProject(created);
    } catch {
      toast({
        title: t('aiVideo.ppt.createFailed'),
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (project) {
    return (
      <PreviewEditStep
        project={project}
        pages={pages.filter((page) => !page.blank)}
        onBack={() => setProject(null)}
      />
    );
  }

  return (
    <Box
      bg="linear-gradient(180deg, #F8F7FF 0px, #F7F8FA 360px)"
      minH="calc(100vh - 64px)"
      py={{ base: 5, md: 8 }}
    >
      <VStack align="stretch" maxW="1040px" mx="auto" px={{ base: 4, md: 6 }} spacing={6}>
        <CreatorFlowHeader active="ppt" />

        <Box
          bg="white"
          borderRadius={{ base: '16px', md: '20px' }}
          border="1px solid #E5E6EB"
          boxShadow={CARD_SHADOW}
          p={{ base: 4, md: 5 }}
        >
          <Flex align="center" justify="space-between" gap={3} mb={4} flexWrap="wrap">
            <Flex align="center" gap={2}>
              <FileText size={16} color={AI_VIDEO_PRIMARY} />
              <Box>
                <Text fontSize="13px" fontWeight={650} color="#1D2129">
                  上传课件或教学文档
                </Text>
                <Text fontSize="11px" color="#A0A7B4" mt={0.5}>
                  自动识别页面结构、原文、图表与动画，逐页生成讲解分镜
                </Text>
              </Box>
            </Flex>
            <Flex gap={2} flexWrap="wrap">
              <Tag borderRadius="full" bg="#F2F3F5" color="#4E5969" fontSize="10px">
                PPTX · PDF · DOCX · TXT
              </Tag>
              <Tag borderRadius="full" bg="#ECF8F3" color="#147D64" fontSize="10px">
                <ShieldCheck size={10} style={{ marginRight: 4 }} /> 本地 Mock 解析
              </Tag>
            </Flex>
          </Flex>

          <UploadStep
            pages={pages}
            onSuccess={handleUploadSuccess}
            onParseDone={() => setParseDone(true)}
          />

          <Collapse in={advancedOpen} animateOpacity>
            <Box mt={4} pt={4} borderTop="1px dashed #E5E6EB">
              <Flex align="center" gap={2} mb={3}>
                <Sparkles size={14} color={AI_VIDEO_PRIMARY} />
                <Text fontSize="12px" fontWeight={650} color="#4E5969">
                  讲解脚本模式
                </Text>
              </Flex>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={2}>
                {SCRIPT_MODES.map((item) => {
                  const selected = item.key === scriptMode;
                  return (
                    <Flex
                      key={item.key}
                      as="button"
                      type="button"
                      direction="column"
                      align="flex-start"
                      textAlign="left"
                      px={3}
                      py={2.5}
                      borderRadius="10px"
                      border="1px solid"
                      borderColor={selected ? AI_VIDEO_PRIMARY : '#E5E6EB'}
                      bg={selected ? '#FFF1F0' : 'white'}
                      onClick={() => setScriptMode(item.key)}
                      aria-pressed={selected}
                    >
                      <Text
                        fontSize="12px"
                        fontWeight={650}
                        color={selected ? AI_VIDEO_PRIMARY : '#4E5969'}
                      >
                        {item.label}
                      </Text>
                      <Text fontSize="11px" color="#A0A7B4" mt={0.5}>
                        {item.description}
                      </Text>
                    </Flex>
                  );
                })}
              </Grid>
            </Box>
          </Collapse>

          <CreatorControlBar
            style={template}
            ratio="16:9"
            duration={duration}
            voice={voice}
            presenter={presenter}
            onStyleChange={setTemplate}
            onDurationChange={setDuration}
            onVoiceChange={setVoice}
            onPresenterChange={setPresenter}
            advancedOpen={advancedOpen}
            onAdvanced={() => setAdvancedOpen((open) => !open)}
            onSubmit={() => void handleEnterPreview()}
            submitDisabled={!parseDone || isCreating}
            isSubmitting={isCreating}
            submitLabel={parseDone ? '生成逐页分镜' : '上传并解析后生成'}
          />
        </Box>

        <Flex
          align={{ base: 'flex-start', md: 'center' }}
          gap={3}
          direction={{ base: 'column', md: 'row' }}
          px={1}
          color="#86909C"
          fontSize="11px"
        >
          <Flex align="center" gap={1.5}>
            <FileCheck2 size={13} /> 上传并智能解析
          </Flex>
          <Text color="#C9CDD4">→</Text>
          <Text>选择模板、数字人与讲解方式</Text>
          <Text color="#C9CDD4">→</Text>
          <Text>逐页编辑口播稿与画面</Text>
          <Text color="#C9CDD4">→</Text>
          <Text>合成并导出成片</Text>
        </Flex>

        <CreatorTemplateStrip
          options={[...TEMPLATE_OPTIONS]}
          selected={template}
          ratio="16:9"
          onChange={setTemplate}
        />
      </VStack>
    </Box>
  );
}

export default function AiVideoCreatePptPage() {
  return (
    <Suspense fallback={null}>
      <AiVideoCreatePptContent />
    </Suspense>
  );
}
