'use client';

/**
 * AI视频课 - 图片转视频
 * 多图上传 / 素材排序 / 单镜头旁白与动效 / 全局画幅与音色 / Mock 分镜生成
 */
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AspectRatio,
  Box,
  Flex,
  Grid,
  IconButton,
  Image as ChakraImage,
  Input,
  Select,
  Tag,
  Text,
  Textarea,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ImagePlus,
  Monitor,
  MoveHorizontal,
  Play,
  Smartphone,
  Sparkles,
  Trash2,
  UploadCloud,
  WandSparkles
} from 'lucide-react';
import Button from '@/app/components/ui/Button';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import { createImageProject, DEFAULT_AUDIO_CONFIG } from '@/teacher/api/aiVideo';
import type {
  AiVideoParams,
  AiVideoRatio,
  AiVideoVoice,
  ImageVideoSourceItem
} from '@/teacher/types/aiVideo';
import {
  AI_VIDEO_PRIMARY,
  AI_VIDEO_PRIMARY_BG,
  AI_VIDEO_PRIMARY_HOVER,
  CARD_SHADOW
} from '../../constants';

const MAX_IMAGES = 8;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const DEMO_IMAGES: ImageVideoSourceItem[] = [
  {
    id: 'demo-1',
    name: '01-课程导入.jpg',
    src: '/media/ai-video/shot-1.jpg',
    narration: '同学们好，今天我们将走进工业机器人工作站，学习 TCP 标定的核心方法。',
    duration: 5,
    motion: 'zoomIn'
  },
  {
    id: 'demo-2',
    name: '02-原理讲解.jpg',
    src: '/media/ai-video/shot-2.jpg',
    narration: 'TCP 是工具中心点，它决定了机器人末端执行器的精准定位能力。',
    duration: 8,
    motion: 'panLeft'
  },
  {
    id: 'demo-3',
    name: '03-操作示范.jpg',
    src: '/media/ai-video/shot-3.jpg',
    narration: '标定时要依次记录不同姿态下的接触点，并检查各组数据是否稳定。',
    duration: 8,
    motion: 'panRight'
  },
  {
    id: 'demo-4',
    name: '04-课堂总结.jpg',
    src: '/media/ai-video/shot-4.jpg',
    narration: '最后，请根据误差结果完成自检，并在实训记录单中填写标定数据。',
    duration: 5,
    motion: 'zoomIn'
  }
];

const MOTIONS: Array<{
  value: ImageVideoSourceItem['motion'];
  label: string;
  description: string;
}> = [
  { value: 'none', label: '静态', description: '保持画面' },
  { value: 'zoomIn', label: '推进', description: '缓慢放大' },
  { value: 'panLeft', label: '左移', description: '平滑左移' },
  { value: 'panRight', label: '右移', description: '平滑右移' }
];

const VOICES: Array<{ value: AiVideoVoice; label: string }> = [
  { value: 'femaleClear', label: '女声·清亮' },
  { value: 'femaleGentle', label: '女声·亲和' },
  { value: 'maleDeep', label: '男声·沉稳' },
  { value: 'maleEnergetic', label: '男声·活力' }
];

function imageId() {
  return `image_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** 压缩上传图片，避免 Mock 数据写入 localStorage 时超过浏览器容量。 */
async function readCompressedImage(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  return new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      const scale = Math.min(1, 960 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.76));
    };
    image.onerror = () => resolve(raw);
    image.src = raw;
  });
}

export default function AiVideoCreateImagesPage() {
  const isI18nReady = useTeacherPageI18n(['aiVideo']);
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<ImageVideoSourceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('工业机器人 TCP 标定微课');
  const [ratio, setRatio] = useState<AiVideoRatio>('16:9');
  const [voice, setVoice] = useState<AiVideoVoice>('femaleClear');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = images.find((item) => item.id === selectedId) ?? images[0] ?? null;
  const totalDuration = useMemo(
    () => images.reduce((total, item) => total + item.duration, 0),
    [images]
  );

  if (!isI18nReady) return null;

  const patchSelected = (patch: Partial<ImageVideoSourceItem>) => {
    if (!selected) return;
    setImages((current) =>
      current.map((item) => (item.id === selected.id ? { ...item, ...patch } : item))
    );
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const remaining = MAX_IMAGES - images.length;
    const candidates = Array.from(fileList).slice(0, Math.max(0, remaining));
    const invalid = candidates.find(
      (file) => !file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE
    );
    if (invalid) {
      toast({
        title: '请上传 JPG、PNG 或 WebP 图片，单张不超过 10MB',
        status: 'warning',
        duration: 2600,
        position: 'top'
      });
    }
    const valid = candidates.filter(
      (file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE
    );
    const next = await Promise.all(
      valid.map(async (file, index) => ({
        id: imageId(),
        name: file.name,
        src: await readCompressedImage(file),
        narration: `请为画面 ${images.length + index + 1} 补充教学旁白。`,
        duration: 5,
        motion: 'zoomIn' as const
      }))
    );
    if (!next.length) return;
    setImages((current) => [...current, ...next]);
    setSelectedId(next[0].id);
    if (fileList.length > remaining) {
      toast({
        title: `单个项目最多上传 ${MAX_IMAGES} 张图片`,
        status: 'info',
        duration: 2200,
        position: 'top'
      });
    }
  };

  const loadDemo = () => {
    const demo = DEMO_IMAGES.map((item) => ({ ...item, id: `${item.id}-${Date.now()}` }));
    setImages(demo);
    setSelectedId(demo[0].id);
    toast({ title: '已载入 4 张教学示例素材', status: 'success', duration: 1800 });
  };

  const moveSelected = (offset: -1 | 1) => {
    if (!selected) return;
    setImages((current) => {
      const index = current.findIndex((item) => item.id === selected.id);
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeSelected = () => {
    if (!selected) return;
    setImages((current) => {
      const index = current.findIndex((item) => item.id === selected.id);
      const next = current.filter((item) => item.id !== selected.id);
      setSelectedId(next[Math.min(index, next.length - 1)]?.id ?? null);
      return next;
    });
  };

  const handleCreate = async () => {
    if (images.length < 2 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const params: AiVideoParams = {
        ratio,
        duration: totalDuration > 60 ? 'balanced' : 'compact',
        style: 'simpleCourseware'
      };
      const { project } = await createImageProject({
        title,
        images,
        params,
        audio: { ...DEFAULT_AUDIO_CONFIG, voice, bgm: 'freeLight' }
      });
      router.push(`/teacher/ai-video/project?id=${project.id}`);
    } catch (error) {
      toast({
        title:
          (error as { code?: string }).code === 'MODERATION'
            ? '内容不符合平台规范，请调整后重试'
            : '生成失败，请稍后重试',
        status: 'error',
        duration: 2600,
        position: 'top'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      bg="linear-gradient(180deg, #FFF7F7 0px, #F7F8FA 260px)"
      minH="calc(100vh - 64px)"
      py={{ base: 5, lg: 8 }}
    >
      <VStack align="stretch" maxW="1180px" mx="auto" px={{ base: 4, md: 6 }} spacing={6}>
        <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={4}>
          <Box>
            <Button
              size="sm"
              variant="outline"
              bg="white"
              color="gray.600"
              leftIcon={<ChevronLeft size={15} />}
              onClick={() => router.push('/teacher/ai-video')}
              mb={4}
            >
              返回 AI 视频课
            </Button>
            <Flex align="center" gap={2} mb={1}>
              <Text fontSize={{ base: '22px', md: '26px' }} fontWeight={700} color="#1D2129">
                图片转视频
              </Text>
              <Tag bg={AI_VIDEO_PRIMARY_BG} color={AI_VIDEO_PRIMARY} borderRadius="full">
                AI 镜头编排
              </Tag>
            </Flex>
            <Text fontSize="14px" color="#6B7280">
              上传教学图片，按讲解顺序编排画面，AI 自动生成旁白、字幕与镜头动效
            </Text>
          </Box>
          <Flex display={{ base: 'none', md: 'flex' }} align="center" gap={2} color="#86909C">
            {['上传素材', '编排镜头', '生成分镜'].map((step, index) => (
              <Flex key={step} align="center" gap={2}>
                <Flex
                  w="26px"
                  h="26px"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  bg={images.length ? AI_VIDEO_PRIMARY : index === 0 ? AI_VIDEO_PRIMARY : 'white'}
                  color={images.length || index === 0 ? 'white' : '#86909C'}
                  fontSize="12px"
                  fontWeight={700}
                  border="1px solid"
                  borderColor={images.length || index === 0 ? AI_VIDEO_PRIMARY : '#E5E6EB'}
                >
                  {images.length && index === 0 ? <Check size={13} /> : index + 1}
                </Flex>
                <Text fontSize="12px" fontWeight={index === 1 && images.length ? 600 : 400}>
                  {step}
                </Text>
                {index < 2 ? <Box w="22px" h="1px" bg="#DADDE3" /> : null}
              </Flex>
            ))}
          </Flex>
        </Flex>

        <Grid
          templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 380px' }}
          gap={6}
          alignItems="start"
        >
          <VStack align="stretch" spacing={5}>
            <Box
              bg="white"
              borderRadius="18px"
              border="1px solid #ECEEF2"
              boxShadow={CARD_SHADOW}
              p={{ base: 4, md: 6 }}
            >
              <Flex justify="space-between" align="center" mb={4} gap={4}>
                <Box>
                  <Text fontSize="16px" fontWeight={650} color="#1D2129">
                    1. 添加教学图片
                  </Text>
                  <Text fontSize="12px" color="#86909C" mt={1}>
                    建议按授课顺序上传 2–8 张，支持 JPG、PNG、WebP
                  </Text>
                </Box>
                <Button
                  size="sm"
                  variant="outline"
                  bg="white"
                  color="#4E5969"
                  onClick={loadDemo}
                  leftIcon={<Sparkles size={14} />}
                >
                  载入示例
                </Button>
              </Flex>

              <Flex
                as="button"
                type="button"
                w="100%"
                minH="150px"
                direction="column"
                align="center"
                justify="center"
                gap={3}
                borderRadius="14px"
                border="2px dashed"
                borderColor={isDragOver ? AI_VIDEO_PRIMARY : '#D9DEE7'}
                bg={isDragOver ? AI_VIDEO_PRIMARY_BG : '#FAFBFC'}
                cursor={images.length >= MAX_IMAGES ? 'not-allowed' : 'pointer'}
                opacity={images.length >= MAX_IMAGES ? 0.6 : 1}
                transition="all 0.18s"
                _hover={{ borderColor: images.length < MAX_IMAGES ? AI_VIDEO_PRIMARY : '#D9DEE7' }}
                _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
                onClick={() => images.length < MAX_IMAGES && inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (images.length < MAX_IMAGES) setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  void handleFiles(event.dataTransfer.files);
                }}
                aria-label="上传教学图片"
              >
                <Flex
                  w="48px"
                  h="48px"
                  borderRadius="14px"
                  bg={AI_VIDEO_PRIMARY_BG}
                  color={AI_VIDEO_PRIMARY}
                  align="center"
                  justify="center"
                >
                  <UploadCloud size={23} />
                </Flex>
                <Box textAlign="center">
                  <Text fontSize="14px" fontWeight={600} color="#4E5969">
                    拖拽图片到此处，或点击上传
                  </Text>
                  <Text fontSize="12px" color="#A0A7B4" mt={1}>
                    已添加 {images.length}/{MAX_IMAGES} 张 · 单张不超过 10MB
                  </Text>
                </Box>
              </Flex>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(event) => void handleFiles(event.target.files)}
              />
            </Box>

            <Box
              bg="white"
              borderRadius="18px"
              border="1px solid #ECEEF2"
              boxShadow={CARD_SHADOW}
              p={{ base: 4, md: 6 }}
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Box>
                  <Text fontSize="16px" fontWeight={650} color="#1D2129">
                    2. 编排镜头
                  </Text>
                  <Text fontSize="12px" color="#86909C" mt={1}>
                    选择画面后设置旁白、时长和镜头运动
                  </Text>
                </Box>
                <Tag borderRadius="full" bg="#F2F3F5" color="#4E5969">
                  <MoveHorizontal size={12} style={{ marginRight: 5 }} /> 共 {totalDuration} 秒
                </Tag>
              </Flex>

              {images.length ? (
                <Grid
                  templateColumns={{
                    base: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)'
                  }}
                  gap={3}
                >
                  {images.map((item, index) => {
                    const active = selected?.id === item.id;
                    return (
                      <Box
                        key={item.id}
                        as="button"
                        type="button"
                        textAlign="left"
                        borderRadius="12px"
                        overflow="hidden"
                        border="2px solid"
                        borderColor={active ? AI_VIDEO_PRIMARY : '#ECEEF2'}
                        bg="white"
                        transition="all 0.15s"
                        _hover={{ borderColor: active ? AI_VIDEO_PRIMARY : '#C9CDD4' }}
                        _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
                        onClick={() => setSelectedId(item.id)}
                        aria-pressed={active}
                        aria-label={`编辑第 ${index + 1} 个画面：${item.name}`}
                      >
                        <AspectRatio ratio={16 / 9}>
                          <ChakraImage src={item.src} alt="" objectFit="cover" />
                        </AspectRatio>
                        <Flex px={3} py={2} align="center" gap={2}>
                          <Flex
                            w="20px"
                            h="20px"
                            borderRadius="6px"
                            bg={active ? AI_VIDEO_PRIMARY : '#F2F3F5'}
                            color={active ? 'white' : '#4E5969'}
                            align="center"
                            justify="center"
                            fontSize="11px"
                            fontWeight={700}
                            flexShrink={0}
                          >
                            {index + 1}
                          </Flex>
                          <Box minW={0} flex="1">
                            <Text fontSize="11px" fontWeight={600} color="#4E5969" noOfLines={1}>
                              {item.name}
                            </Text>
                            <Text fontSize="10px" color="#A0A7B4">
                              {item.duration}s ·{' '}
                              {MOTIONS.find((motion) => motion.value === item.motion)?.label}
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                    );
                  })}
                </Grid>
              ) : (
                <Flex
                  minH="180px"
                  direction="column"
                  align="center"
                  justify="center"
                  color="#A0A7B4"
                >
                  <ImagePlus size={34} strokeWidth={1.5} />
                  <Text fontSize="13px" mt={3}>
                    上传图片后，可在这里编排讲解顺序
                  </Text>
                </Flex>
              )}
            </Box>
          </VStack>

          <Box
            bg="white"
            borderRadius="18px"
            border="1px solid #ECEEF2"
            boxShadow={CARD_SHADOW}
            p={{ base: 4, md: 5 }}
            position={{ base: 'static', xl: 'sticky' }}
            top="84px"
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Box>
                <Text fontSize="16px" fontWeight={650} color="#1D2129">
                  镜头设置
                </Text>
                <Text fontSize="11px" color="#A0A7B4" mt={1}>
                  {selected ? selected.name : '请先添加并选择图片'}
                </Text>
              </Box>
              <Flex gap={1}>
                <IconButton
                  aria-label="画面前移"
                  icon={<ArrowLeft size={15} />}
                  size="sm"
                  variant="ghost"
                  isDisabled={!selected || images[0]?.id === selected.id}
                  onClick={() => moveSelected(-1)}
                />
                <IconButton
                  aria-label="画面后移"
                  icon={<ArrowRight size={15} />}
                  size="sm"
                  variant="ghost"
                  isDisabled={!selected || images.at(-1)?.id === selected.id}
                  onClick={() => moveSelected(1)}
                />
                <IconButton
                  aria-label="删除当前画面"
                  icon={<Trash2 size={15} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  isDisabled={!selected}
                  onClick={removeSelected}
                />
              </Flex>
            </Flex>

            <AspectRatio
              ratio={ratio === '9:16' ? 9 / 16 : 16 / 9}
              maxH="310px"
              mx="auto"
              borderRadius="14px"
              overflow="hidden"
              bg="#15171C"
            >
              {selected ? (
                <Box position="relative">
                  <ChakraImage
                    src={selected.src}
                    alt={`当前画面：${selected.name}`}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                  <Box
                    position="absolute"
                    inset={0}
                    bg="linear-gradient(180deg, transparent 55%, rgba(0,0,0,.66) 100%)"
                  />
                  <Flex
                    position="absolute"
                    top={3}
                    left={3}
                    px={2}
                    py={1}
                    borderRadius="full"
                    bg="rgba(0,0,0,.5)"
                    color="white"
                    fontSize="10px"
                    align="center"
                    gap={1}
                  >
                    <Play size={10} fill="currentColor" /> 镜头预览
                  </Flex>
                  <Text
                    position="absolute"
                    left={4}
                    right={4}
                    bottom={4}
                    color="white"
                    fontSize="12px"
                    textAlign="center"
                    textShadow="0 1px 4px rgba(0,0,0,.7)"
                    noOfLines={2}
                  >
                    {selected.narration}
                  </Text>
                </Box>
              ) : (
                <Flex direction="column" align="center" justify="center" color="whiteAlpha.500">
                  <ImagePlus size={32} />
                  <Text fontSize="12px" mt={2}>
                    等待添加画面
                  </Text>
                </Flex>
              )}
            </AspectRatio>

            <VStack align="stretch" spacing={4} mt={5}>
              <Box>
                <Text
                  as="label"
                  htmlFor="image-video-title"
                  fontSize="12px"
                  fontWeight={600}
                  color="#4E5969"
                >
                  视频名称
                </Text>
                <Input
                  id="image-video-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  mt={2}
                  size="sm"
                  borderRadius="9px"
                  bg="#FAFBFC"
                  focusBorderColor={AI_VIDEO_PRIMARY}
                />
              </Box>

              <Box>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text
                    as="label"
                    htmlFor="image-narration"
                    fontSize="12px"
                    fontWeight={600}
                    color="#4E5969"
                  >
                    画面旁白
                  </Text>
                  <Text fontSize="10px" color="#A0A7B4">
                    {selected?.narration.length ?? 0}/180
                  </Text>
                </Flex>
                <Textarea
                  id="image-narration"
                  value={selected?.narration ?? ''}
                  onChange={(event) =>
                    patchSelected({ narration: event.target.value.slice(0, 180) })
                  }
                  isDisabled={!selected}
                  rows={3}
                  resize="none"
                  borderRadius="9px"
                  bg="#FAFBFC"
                  fontSize="12px"
                  focusBorderColor={AI_VIDEO_PRIMARY}
                  placeholder="描述该画面的教学讲解内容"
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight={600} color="#4E5969" mb={2}>
                  停留时长
                </Text>
                <Grid
                  templateColumns="repeat(3, 1fr)"
                  gap={2}
                  role="group"
                  aria-label="画面停留时长"
                >
                  {[3, 5, 8].map((duration) => (
                    <Button
                      key={duration}
                      size="sm"
                      variant="outline"
                      bg={selected?.duration === duration ? AI_VIDEO_PRIMARY_BG : 'white'}
                      color={selected?.duration === duration ? AI_VIDEO_PRIMARY : '#4E5969'}
                      borderColor={selected?.duration === duration ? AI_VIDEO_PRIMARY : '#E5E6EB'}
                      isDisabled={!selected}
                      onClick={() => patchSelected({ duration })}
                    >
                      {duration} 秒
                    </Button>
                  ))}
                </Grid>
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight={600} color="#4E5969" mb={2}>
                  镜头动效
                </Text>
                <Grid templateColumns="repeat(4, 1fr)" gap={2} role="group" aria-label="镜头动效">
                  {MOTIONS.map((motion) => {
                    const active = selected?.motion === motion.value;
                    return (
                      <Box
                        key={motion.value}
                        as="button"
                        type="button"
                        py={2}
                        px={1}
                        borderRadius="9px"
                        border="1px solid"
                        borderColor={active ? AI_VIDEO_PRIMARY : '#E5E6EB'}
                        bg={active ? AI_VIDEO_PRIMARY_BG : 'white'}
                        color={active ? AI_VIDEO_PRIMARY : '#4E5969'}
                        isDisabled={!selected}
                        onClick={() => patchSelected({ motion: motion.value })}
                        aria-pressed={active}
                        _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
                      >
                        <Text fontSize="11px" fontWeight={600}>
                          {motion.label}
                        </Text>
                        <Text fontSize="9px" opacity={0.7}>
                          {motion.description}
                        </Text>
                      </Box>
                    );
                  })}
                </Grid>
              </Box>

              <Grid templateColumns="1fr 1fr" gap={3}>
                <Box>
                  <Text fontSize="12px" fontWeight={600} color="#4E5969" mb={2}>
                    视频画幅
                  </Text>
                  <Flex gap={2}>
                    {(['16:9', '9:16'] as AiVideoRatio[]).map((value) => (
                      <IconButton
                        key={value}
                        aria-label={value === '16:9' ? '横屏 16 比 9' : '竖屏 9 比 16'}
                        icon={value === '16:9' ? <Monitor size={15} /> : <Smartphone size={15} />}
                        size="sm"
                        flex="1"
                        variant="outline"
                        bg={ratio === value ? AI_VIDEO_PRIMARY_BG : 'white'}
                        color={ratio === value ? AI_VIDEO_PRIMARY : '#4E5969'}
                        borderColor={ratio === value ? AI_VIDEO_PRIMARY : '#E5E6EB'}
                        onClick={() => setRatio(value)}
                      />
                    ))}
                  </Flex>
                </Box>
                <Box>
                  <Text
                    as="label"
                    htmlFor="image-video-voice"
                    fontSize="12px"
                    fontWeight={600}
                    color="#4E5969"
                    mb={2}
                    display="block"
                  >
                    配音音色
                  </Text>
                  <Select
                    id="image-video-voice"
                    value={voice}
                    onChange={(event) => setVoice(event.target.value as AiVideoVoice)}
                    size="sm"
                    borderRadius="9px"
                    focusBorderColor={AI_VIDEO_PRIMARY}
                  >
                    {VOICES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </Box>
              </Grid>

              <Button
                variant="primary"
                bg={AI_VIDEO_PRIMARY}
                borderColor={AI_VIDEO_PRIMARY}
                _hover={{ bg: AI_VIDEO_PRIMARY_HOVER, borderColor: AI_VIDEO_PRIMARY_HOVER }}
                leftIcon={isSubmitting ? undefined : <WandSparkles size={16} />}
                isLoading={isSubmitting}
                loadingText="正在生成分镜"
                isDisabled={images.length < 2 || !title.trim()}
                onClick={() => void handleCreate()}
                minH="44px"
              >
                生成视频分镜 · {images.length || 0} 个画面
              </Button>
              <Text fontSize="10px" color="#A0A7B4" textAlign="center" aria-live="polite">
                {images.length < 2
                  ? '至少添加 2 张图片后即可生成'
                  : `预计成片 ${totalDuration} 秒，生成后可继续精修`}
              </Text>
            </VStack>
          </Box>
        </Grid>
      </VStack>
    </Box>
  );
}
