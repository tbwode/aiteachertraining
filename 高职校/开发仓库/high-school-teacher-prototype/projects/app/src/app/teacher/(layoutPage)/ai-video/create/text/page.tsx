'use client';

/** 文本生成视频：输入主题或讲稿，配置模板/数字人/配音后进入统一分镜编辑器。 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Collapse,
  Divider,
  Flex,
  Grid,
  Input,
  Tag,
  Text,
  Textarea,
  useToast,
  VStack
} from '@chakra-ui/react';
import { Lightbulb, Monitor, Smartphone, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import type { AiVideoParams, AiVideoVoice } from '@/teacher/types/aiVideo';
import {
  createTextProject,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_DIGITAL_HUMAN_CONFIG,
  DEFAULT_DIGITAL_HUMAN_PLACEMENT,
  findSensitiveWord,
  isTopicTooShort,
  updateProjectConfig
} from '@/teacher/api/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  CARD_SHADOW,
  DEFAULT_AI_VIDEO_PARAMS,
  NOTES_MAX_LENGTH,
  PROMPT_EXAMPLE_KEYS,
  RATIO_OPTIONS,
  STYLE_TEMPLATES_BY_RATIO
} from '../../constants';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
  CreatorControlBar,
  CreatorFlowHeader,
  CreatorTemplateStrip,
  type CreatorPresenter
} from '../../components/CreatorSetup';

export default function AiVideoCreateTextPage() {
  const isI18nReady = useTeacherPageI18n(['aiVideo']);
  const { t } = useTranslation('teacher');
  const router = useRouter();
  const toast = useToast();

  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [params, setParams] = useState<AiVideoParams>({ ...DEFAULT_AI_VIDEO_PARAMS });
  const [voice, setVoice] = useState<AiVideoVoice>('femaleClear');
  const [presenter, setPresenter] = useState<CreatorPresenter>('yunshu');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isShortModalOpen, setIsShortModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isI18nReady) return null;

  const patchParams = (patch: Partial<AiVideoParams>) =>
    setParams((prev) => ({ ...prev, ...patch }));

  const handleRatioChange = (ratio: AiVideoParams['ratio']) => {
    if (ratio === '1:1') return;
    setParams((prev) => {
      const group = STYLE_TEMPLATES_BY_RATIO[ratio];
      return {
        ...prev,
        ratio,
        style: group.includes(prev.style) ? prev.style : group[0]
      };
    });
  };

  const doCreate = async (allowShort: boolean) => {
    setIsSubmitting(true);
    try {
      const { project } = await createTextProject({ topic, notes, params, allowShort });
      await updateProjectConfig(project.id, {
        audio: { ...DEFAULT_AUDIO_CONFIG, voice },
        digitalHuman: {
          ...DEFAULT_DIGITAL_HUMAN_CONFIG,
          enabled: presenter !== 'none',
          avatar: presenter === 'none' ? 'yunshu' : presenter,
          mode: 'halfBody',
          placement: { ...DEFAULT_DIGITAL_HUMAN_PLACEMENT }
        }
      });
      router.push(`/teacher/ai-video/project?id=${project.id}`);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      toast({
        title:
          code === 'MODERATION'
            ? t('aiVideo.create.moderationMessage')
            : t('aiVideo.create.createFailed'),
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    const fullText = `${topic}\n${notes}`;
    if (findSensitiveWord(fullText)) {
      toast({
        title: t('aiVideo.create.moderationMessage'),
        status: 'error',
        duration: 3000,
        position: 'top'
      });
      return;
    }
    if (isTopicTooShort(topic)) {
      setIsShortModalOpen(true);
      return;
    }
    void doCreate(false);
  };

  const styleOptions =
    STYLE_TEMPLATES_BY_RATIO[params.ratio === '9:16' ? '9:16' : '16:9'];

  return (
    <Box
      bg="linear-gradient(180deg, #FFF8F8 0px, #F7F8FA 360px)"
      minH="calc(100vh - 64px)"
      py={{ base: 5, md: 8 }}
    >
      <VStack align="stretch" maxW="1040px" mx="auto" px={{ base: 4, md: 6 }} spacing={6}>
        <CreatorFlowHeader active="text" />

        <Box
          bg="white"
          borderRadius={{ base: '16px', md: '20px' }}
          border="1px solid"
          borderColor="#E5E6EB"
          boxShadow={CARD_SHADOW}
          p={{ base: 4, md: 5 }}
          transition="border-color 0.15s"
          _focusWithin={{ borderColor: '#D6A0A4' }}
        >
          <Flex align="center" justify="space-between" gap={3} mb={2}>
            <Flex align="center" gap={2}>
              <Sparkles size={15} color={AI_VIDEO_PRIMARY} />
              <Text fontSize="13px" fontWeight={650} color="#1D2129">
                描述你想制作的教学视频
              </Text>
            </Flex>
            <Flex
              as="button"
              type="button"
              align="center"
              gap={1}
              px={2.5}
              py={1.5}
              borderRadius="full"
              color="#4E5969"
              bg="#F5F6F7"
              fontSize="11px"
              onClick={() => {
                setTopic(t('aiVideo.create.examples.example1.topic'));
                setNotes(t('aiVideo.create.examples.example1.notes'));
              }}
              _hover={{ color: AI_VIDEO_PRIMARY, bg: AI_VIDEO_PRIMARY_BG }}
            >
              <Lightbulb size={12} /> 给我灵感
            </Flex>
          </Flex>

          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="输入视频主题，例如：工业机器人 TCP 标定方法"
            variant="unstyled"
            fontSize={{ base: '16px', md: '18px' }}
            fontWeight={650}
            color="#1D2129"
            py={2}
            _placeholder={{ color: '#A9ADB5', fontWeight: 500 }}
            aria-label="视频主题"
          />
          <Divider my={2} borderColor="#F0F1F3" />
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value.slice(0, NOTES_MAX_LENGTH))}
            placeholder="输入课程目标、完整讲稿或补充要求。AI 会据此规划章节、分镜和口播稿……"
            variant="unstyled"
            rows={7}
            resize="none"
            fontSize="13px"
            lineHeight="1.8"
            color="#4E5969"
            _placeholder={{ color: '#A9ADB5' }}
            aria-label="教学内容与生成要求"
          />
          <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
            <Text fontSize="11px" color="#A0A7B4">
              可粘贴完整讲稿，也可以只输入主题让 AI 自动扩写
            </Text>
            <Text
              fontSize="11px"
              color={notes.length >= NOTES_MAX_LENGTH ? 'red.500' : '#A0A7B4'}
              fontFamily="mono"
            >
              {notes.length} / {NOTES_MAX_LENGTH}
            </Text>
          </Flex>

          <Collapse in={advancedOpen} animateOpacity>
            <Box mt={4} pt={4} borderTop="1px dashed #E5E6EB">
              <Flex align="center" justify="space-between" mb={3} gap={2}>
                <Text fontSize="12px" fontWeight={650} color="#4E5969">
                  视频画幅
                </Text>
                <Text fontSize="11px" color="#A0A7B4">
                  模板将随画幅自动匹配
                </Text>
              </Flex>
              <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 180px)' }} gap={2}>
                {RATIO_OPTIONS.filter((ratio) => ratio !== '1:1').map((ratio) => {
                  const selected = params.ratio === ratio;
                  return (
                    <Flex
                      key={ratio}
                      as="button"
                      type="button"
                      align="center"
                      gap={2}
                      px={3}
                      py={2.5}
                      borderRadius="10px"
                      border="1px solid"
                      borderColor={selected ? AI_VIDEO_PRIMARY : '#E5E6EB'}
                      bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
                      color={selected ? AI_VIDEO_PRIMARY : '#4E5969'}
                      fontSize="12px"
                      fontWeight={selected ? 600 : 400}
                      onClick={() => handleRatioChange(ratio)}
                      aria-pressed={selected}
                    >
                      {ratio === '16:9' ? <Monitor size={15} /> : <Smartphone size={15} />}
                      {ratio === '16:9' ? '横屏 16:9 · 课程讲解' : '竖屏 9:16 · 知识短视频'}
                    </Flex>
                  );
                })}
              </Grid>
            </Box>
          </Collapse>

          <CreatorControlBar
            style={params.style}
            ratio={params.ratio === '9:16' ? '9:16' : '16:9'}
            duration={params.duration}
            voice={voice}
            presenter={presenter}
            onStyleChange={(style) => patchParams({ style })}
            onDurationChange={(duration) => patchParams({ duration })}
            onVoiceChange={setVoice}
            onPresenterChange={setPresenter}
            advancedOpen={advancedOpen}
            onAdvanced={() => setAdvancedOpen((open) => !open)}
            onSubmit={handleSubmit}
            submitDisabled={isSubmitting || !topic.trim()}
            isSubmitting={isSubmitting}
          />
        </Box>

        <Flex align="center" gap={2} flexWrap="wrap" px={1}>
          <Text fontSize="11px" color="#A0A7B4" flexShrink={0}>
            试试这些教学主题：
          </Text>
          {PROMPT_EXAMPLE_KEYS.map((key) => (
            <Tag
              key={key}
              as="button"
              type="button"
              size="sm"
              borderRadius="full"
              bg="white"
              color="#4E5969"
              cursor="pointer"
              border="1px solid"
              borderColor="#ECEEF2"
              _hover={{ bg: AI_VIDEO_PRIMARY_BG, color: AI_VIDEO_PRIMARY }}
              onClick={() => {
                setTopic(t(`aiVideo.create.examples.${key}.topic`));
                setNotes(t(`aiVideo.create.examples.${key}.notes`));
              }}
            >
              {t(`aiVideo.create.examples.${key}.topic`)}
            </Tag>
          ))}
        </Flex>

        <CreatorTemplateStrip
          options={styleOptions}
          selected={params.style}
          ratio={params.ratio === '9:16' ? '9:16' : '16:9'}
          onChange={(style) => patchParams({ style })}
        />
      </VStack>

      <ConfirmModal
        isOpen={isShortModalOpen}
        onClose={() => setIsShortModalOpen(false)}
        onConfirm={() => {
          setIsShortModalOpen(false);
          void doCreate(true);
        }}
        title={t('aiVideo.create.tooShortTitle')}
        message={t('aiVideo.create.tooShortMessage')}
        confirmText={t('aiVideo.create.tooShortConfirm')}
        cancelText={t('aiVideo.common.cancel')}
      />
    </Box>
  );
}
