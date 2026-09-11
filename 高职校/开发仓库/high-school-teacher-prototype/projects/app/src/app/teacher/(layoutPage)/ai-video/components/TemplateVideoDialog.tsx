'use client';

/** 模板视频选择器：参考 Leadde 的「从空白开始 + 模板库」创建分流。 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AspectRatio,
  Box,
  Flex,
  Grid,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Tab,
  TabList,
  Tabs,
  Tag,
  Text,
  useToast
} from '@chakra-ui/react';
import { Clock3, LayoutTemplate, Plus, Sparkles } from 'lucide-react';
import { createTemplateProject } from '@/teacher/api/aiVideo';
import type { AiVideoStyle } from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG } from '../constants';

type TemplateCategory = '全部' | '推荐' | '通用教育' | '实训教学' | '知识讲解' | '校园宣传';
type TemplateScope = 'mine' | 'public';

type VideoTemplate = {
  id: string;
  name: string;
  category: Exclude<TemplateCategory, '全部' | '推荐'>;
  scope: TemplateScope;
  cover: string;
  style: AiVideoStyle;
  duration: string;
  description: string;
  recommended?: boolean;
};

const CATEGORIES: TemplateCategory[] = [
  '全部',
  '推荐',
  '通用教育',
  '实训教学',
  '知识讲解',
  '校园宣传'
];

const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'modern-course',
    name: '现代课程讲解',
    category: '通用教育',
    scope: 'public',
    cover: '/media/ai-video/style-simpleCourseware-16x9.jpg',
    style: 'simpleCourseware',
    duration: '2–4 分钟',
    description: '标题区、知识卡片与教师讲解位',
    recommended: true
  },
  {
    id: 'skill-demo',
    name: '技能操作示范',
    category: '实训教学',
    scope: 'public',
    cover: '/media/ai-video/style-realistic-16x9.jpg',
    style: 'realistic',
    duration: '3–5 分钟',
    description: '步骤特写、安全提示与正误对照',
    recommended: true
  },
  {
    id: 'tech-explain',
    name: '科技原理解析',
    category: '知识讲解',
    scope: 'public',
    cover: '/media/ai-video/style-tech-16x9.jpg',
    style: 'tech',
    duration: '2–3 分钟',
    description: '结构示意、重点高亮与动态标注'
  },
  {
    id: 'documentary-class',
    name: '工匠人物故事',
    category: '校园宣传',
    scope: 'public',
    cover: '/media/ai-video/style-documentary-16x9.jpg',
    style: 'documentary',
    duration: '3–5 分钟',
    description: '纪实镜头、人物字幕与章节过渡'
  },
  {
    id: 'knowledge-talk',
    name: '知识点口播',
    category: '知识讲解',
    scope: 'public',
    cover: '/media/ai-video/style-knowledgeTalk-16x9.jpg',
    style: 'knowledgeTalk',
    duration: '1–2 分钟',
    description: '数字人口播、关键词字幕与案例卡片',
    recommended: true
  },
  {
    id: 'campus-brief',
    name: '校园资讯简报',
    category: '校园宣传',
    scope: 'public',
    cover: '/media/ai-video/style-corporate-16x9.jpg',
    style: 'corporate',
    duration: '1–3 分钟',
    description: '新闻标题、校园素材与信息条'
  },
  {
    id: 'my-robot-training',
    name: '机器人实训复盘',
    category: '实训教学',
    scope: 'mine',
    cover: '/media/ai-video/shot-3.jpg',
    style: 'realistic',
    duration: '4 分钟',
    description: '我的模板 · 分组实训与评价总结'
  },
  {
    id: 'my-safety-course',
    name: '实训安全微课',
    category: '通用教育',
    scope: 'mine',
    cover: '/media/ai-video/shot-4.jpg',
    style: 'simpleCourseware',
    duration: '3 分钟',
    description: '我的模板 · 安全规范与随堂检查'
  }
];

type TemplateVideoDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function TemplateVideoDialog({ isOpen, onClose }: TemplateVideoDialogProps) {
  const router = useRouter();
  const toast = useToast();
  const [scope, setScope] = useState<TemplateScope>('public');
  const [category, setCategory] = useState<TemplateCategory>('全部');
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const templates = useMemo(
    () =>
      VIDEO_TEMPLATES.filter(
        (template) =>
          template.scope === scope &&
          (category === '全部' ||
            (category === '推荐' && template.recommended) ||
            template.category === category)
      ),
    [category, scope]
  );

  const createProject = async (template?: VideoTemplate) => {
    if (creatingId) return;
    const id = template?.id ?? 'blank';
    setCreatingId(id);
    try {
      const { project } = await createTemplateProject({
        templateId: template?.id ?? null,
        templateName: template?.name,
        coverUrl: template?.cover,
        category: template?.category,
        params: {
          ratio: '16:9',
          duration: template ? 'compact' : 'smart',
          style: template?.style ?? 'simpleCourseware'
        }
      });
      onClose();
      router.push(`/teacher/ai-video/project?id=${project.id}`);
    } catch {
      setCreatingId(null);
      toast({
        title: '创建失败，请稍后重试',
        status: 'error',
        duration: 2400,
        position: 'top'
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={creatingId ? () => undefined : onClose}
      size="6xl"
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="20px" overflow="hidden" mx={{ base: 3, md: 6 }} maxH="88vh">
        <ModalHeader px={{ base: 5, md: 7 }} pt={6} pb={0}>
          <Flex align="center" gap={3} pr={8}>
            <Flex
              w="40px"
              h="40px"
              borderRadius="12px"
              bg={AI_VIDEO_PRIMARY_BG}
              color={AI_VIDEO_PRIMARY}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <LayoutTemplate size={20} />
            </Flex>
            <Box>
              <Text fontSize="18px" color="#1D2129" fontWeight={700}>
                创建模板视频
              </Text>
              <Text fontSize="12px" color="#86909C" fontWeight={400} mt={0.5}>
                从空白画布开始，或选择一个模板快速替换教学内容
              </Text>
            </Box>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top={6} right={6} borderRadius="full" aria-label="关闭模板选择器" />

        <ModalBody px={{ base: 5, md: 7 }} py={6}>
          <Tabs
            index={scope === 'mine' ? 0 : 1}
            onChange={(index) => {
              setScope(index === 0 ? 'mine' : 'public');
              setCategory('全部');
            }}
            variant="unstyled"
          >
            <TabList gap={1} mb={4} bg="#F2F3F5" borderRadius="12px" p={1} w="fit-content">
              {['我的模板', '公共模板'].map((label) => (
                <Tab
                  key={label}
                  px={5}
                  py={2}
                  borderRadius="9px"
                  fontSize="13px"
                  color="#4E5969"
                  _selected={{
                    bg: 'white',
                    color: AI_VIDEO_PRIMARY,
                    boxShadow: '0 1px 4px rgba(0,0,0,.08)'
                  }}
                  _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
                >
                  {label}
                </Tab>
              ))}
            </TabList>
          </Tabs>

          <Flex gap={2} flexWrap="wrap" mb={5} role="group" aria-label="模板分类">
            {CATEGORIES.map((item) => {
              const selected = category === item;
              return (
                <Box
                  key={item}
                  as="button"
                  type="button"
                  px={3.5}
                  py={1.5}
                  borderRadius="full"
                  border="1px solid"
                  borderColor={selected ? AI_VIDEO_PRIMARY : '#E5E6EB'}
                  bg={selected ? AI_VIDEO_PRIMARY_BG : 'white'}
                  color={selected ? AI_VIDEO_PRIMARY : '#4E5969'}
                  fontSize="12px"
                  fontWeight={selected ? 600 : 400}
                  onClick={() => setCategory(item)}
                  aria-pressed={selected}
                  _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
                >
                  {item}
                </Box>
              );
            })}
          </Flex>

          <Grid
            templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
            gap={4}
          >
            <Box
              as="button"
              type="button"
              minH="224px"
              borderRadius="14px"
              border="1.5px dashed"
              borderColor="#C9CDD4"
              bg="#FAFBFC"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={3}
              color="#4E5969"
              transition="all .18s"
              onClick={() => void createProject()}
              isDisabled={Boolean(creatingId)}
              _hover={{
                borderColor: AI_VIDEO_PRIMARY,
                color: AI_VIDEO_PRIMARY,
                bg: AI_VIDEO_PRIMARY_BG
              }}
              _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
            >
              {creatingId === 'blank' ? (
                <Spinner size="sm" color={AI_VIDEO_PRIMARY} />
              ) : (
                <Flex
                  w="42px"
                  h="42px"
                  borderRadius="12px"
                  bg="white"
                  border="1px solid #E5E6EB"
                  align="center"
                  justify="center"
                >
                  <Plus size={20} />
                </Flex>
              )}
              <Box textAlign="center">
                <Text fontSize="14px" fontWeight={650}>
                  从空白开始
                </Text>
                <Text fontSize="11px" color="#86909C" mt={1}>
                  自由添加场景、素材与数字人
                </Text>
              </Box>
            </Box>

            {templates.map((template) => {
              const isCreating = creatingId === template.id;
              return (
                <Box
                  key={template.id}
                  as="button"
                  type="button"
                  textAlign="left"
                  borderRadius="14px"
                  border="1px solid #ECEEF2"
                  bg="white"
                  overflow="hidden"
                  position="relative"
                  transition="all .18s"
                  onClick={() => void createProject(template)}
                  isDisabled={Boolean(creatingId)}
                  _hover={{
                    transform: 'translateY(-2px)',
                    borderColor: '#B9BDC7',
                    boxShadow: '0 8px 22px rgba(0,0,0,.1)'
                  }}
                  _focusVisible={{ boxShadow: `0 0 0 3px ${AI_VIDEO_PRIMARY_BG}` }}
                  aria-label={`使用模板：${template.name}`}
                >
                  <AspectRatio ratio={16 / 9} bg="#F2F3F5">
                    <Box position="relative">
                      <TemplateThumbnail template={template} />
                      <Flex
                        position="absolute"
                        inset={0}
                        bg="blackAlpha.400"
                        opacity={isCreating ? 1 : 0}
                        align="center"
                        justify="center"
                        color="white"
                        transition="opacity .18s"
                        _groupHover={{ opacity: 1 }}
                      >
                        {isCreating ? <Spinner size="sm" /> : null}
                      </Flex>
                      {template.recommended ? (
                        <Tag
                          position="absolute"
                          top={2}
                          left={2}
                          size="sm"
                          borderRadius="full"
                          bg="rgba(200,0,11,.9)"
                          color="white"
                          fontSize="10px"
                        >
                          <Sparkles size={10} style={{ marginRight: 4 }} /> 推荐
                        </Tag>
                      ) : null}
                    </Box>
                  </AspectRatio>
                  <Box p={3.5}>
                    <Flex align="center" justify="space-between" gap={2}>
                      <Text fontSize="14px" fontWeight={650} color="#1D2129" noOfLines={1}>
                        {template.name}
                      </Text>
                      <Flex color="#A0A7B4" fontSize="10px" align="center" gap={1} flexShrink={0}>
                        <Clock3 size={11} /> {template.duration}
                      </Flex>
                    </Flex>
                    <Text fontSize="11px" color="#86909C" mt={1.5} noOfLines={1}>
                      {template.description}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </Grid>

          {!templates.length ? (
            <Flex minH="140px" align="center" justify="center" color="#86909C" fontSize="13px">
              当前分类暂无模板，可切换分类或从空白开始
            </Flex>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

const TEMPLATE_ACCENTS = ['#C8000B', '#5B57D1', '#1677A3', '#D06B1B', '#147D64', '#7B3FB1'];
const TEMPLATE_AVATARS = [
  '/media/ai-video/avatar-xiayouyou.svg',
  '/media/ai-video/avatar-luyumo.svg',
  '/media/ai-video/avatar-bailuwei.svg',
  '/media/ai-video/avatar-chenzhiyue.svg'
];

function TemplateThumbnail({ template }: { template: VideoTemplate }) {
  const index = VIDEO_TEMPLATES.findIndex((item) => item.id === template.id);
  const accent = TEMPLATE_ACCENTS[Math.max(0, index) % TEMPLATE_ACCENTS.length];
  const avatar = TEMPLATE_AVATARS[Math.max(0, index) % TEMPLATE_AVATARS.length];

  return (
    <Box
      position="relative"
      w="100%"
      h="100%"
      overflow="hidden"
      bgImage={`linear-gradient(115deg, rgba(20,24,35,.3), rgba(20,24,35,.04)), url('${template.cover}')`}
      bgSize="cover"
      bgPosition="center"
      aria-hidden="true"
    >
      <Box
        position="absolute"
        left="6%"
        top="50%"
        transform="translateY(-50%)"
        w="56%"
        bg="rgba(255,255,255,.92)"
        borderLeft="4px solid"
        borderColor={accent}
        borderRadius="4px 10px 10px 4px"
        px={3}
        py={2.5}
        boxShadow="0 8px 22px rgba(0,0,0,.12)"
        zIndex={1}
      >
        <Text fontSize="8px" fontWeight={700} color={accent} letterSpacing=".08em">
          {template.category}
        </Text>
        <Text fontSize="12px" fontWeight={750} color="#1D2129" mt={1} noOfLines={2}>
          {template.name}
        </Text>
      </Box>
      <Image
        src={avatar}
        alt=""
        position="absolute"
        right="0"
        bottom="-8%"
        h="98%"
        maxW="48%"
        objectFit="contain"
        objectPosition="bottom right"
        filter="drop-shadow(-5px 8px 10px rgba(0,0,0,.16))"
      />
      <Box
        position="absolute"
        left="6%"
        bottom="7%"
        w="24%"
        h="3px"
        borderRadius="full"
        bg={accent}
        opacity={0.7}
      />
    </Box>
  );
}
