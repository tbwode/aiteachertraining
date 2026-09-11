'use client';

/** AI视频课首页：三种创作模式 + 创作链路说明 + 我的项目 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AspectRatio, Box, Flex, Grid, Tag, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Captions,
  FileText,
  LayoutTemplate,
  Layers3,
  Mic2,
  Play,
  Presentation,
  Sparkles,
  WandSparkles
} from 'lucide-react';
import Button from '@/app/components/ui/Button';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import { ModeCard } from './components/ModeCard';
import { ProjectList } from './components/ProjectList';
import { TemplateVideoDialog } from './components/TemplateVideoDialog';
import { useProjectList } from './hooks/useProjectList';
import { AI_VIDEO_PRIMARY, PAGE_MAX_WIDTH } from './constants';

const WORKFLOW_FEATURES = [
  { icon: Layers3, title: 'AI 智能分镜', description: '自动拆解知识点与镜头节奏' },
  { icon: Mic2, title: '自然讲解配音', description: '多音色、语速与情感可调' },
  { icon: Captions, title: '字幕与成片', description: '自动断句，可继续精修导出' }
] as const;

export default function AiVideoHomePage() {
  const isI18nReady = useTeacherPageI18n(['aiVideo']);
  const { t } = useTranslation('teacher');
  const router = useRouter();
  const { projects, isLoading, refresh } = useProjectList();
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  if (!isI18nReady) return null;

  return (
    <Box
      bg="linear-gradient(180deg, #FFF7F7 0px, #F7F8FA 330px)"
      minH="calc(100vh - 64px)"
      py={{ base: 5, md: 8 }}
    >
      <VStack
        align="stretch"
        maxW={PAGE_MAX_WIDTH}
        mx="auto"
        px={{ base: 4, md: 6 }}
        spacing={{ base: 6, md: 8 }}
      >
        <Box
          borderRadius={{ base: '20px', md: '24px' }}
          bg="linear-gradient(118deg, #241E38 0%, #3A294D 46%, #741925 100%)"
          color="white"
          overflow="hidden"
          position="relative"
          px={{ base: 5, md: 8, lg: 10 }}
          py={{ base: 7, md: 9 }}
          boxShadow="0 18px 48px rgba(72, 24, 39, 0.18)"
        >
          <Box
            position="absolute"
            w="260px"
            h="260px"
            borderRadius="full"
            bg="rgba(232,60,74,.16)"
            top="-150px"
            right="-50px"
          />
          <Box
            position="absolute"
            w="180px"
            h="180px"
            borderRadius="full"
            border="1px solid rgba(255,255,255,.12)"
            bottom="-110px"
            left="38%"
          />
          <Grid
            templateColumns={{
              base: '1fr',
              lg: 'minmax(0, 1.25fr) minmax(330px, .75fr)'
            }}
            gap={{ base: 8, lg: 12 }}
            alignItems="center"
            position="relative"
          >
            <Box>
              <Tag borderRadius="full" bg="whiteAlpha.200" color="white" px={3} py={1} mb={4}>
                <Sparkles size={12} style={{ marginRight: 6 }} /> AI 课程视频创作中心
              </Tag>
              <Text
                fontSize={{ base: '28px', md: '36px' }}
                lineHeight="1.2"
                fontWeight={750}
                letterSpacing="-0.02em"
              >
                从教学素材到精彩视频
                <Text as="span" display="block" color="#FFB9BE">
                  让 AI 完成繁琐制作
                </Text>
              </Text>
              <Text
                mt={4}
                maxW="620px"
                fontSize={{ base: '13px', md: '15px' }}
                lineHeight="1.8"
                color="whiteAlpha.800"
              >
                支持文本、PPT/文档和模板三种创作方式，自动完成教学脚本、分镜、配音与字幕，生成后仍可逐镜头编辑。
              </Text>
              <Flex mt={6} gap={3} flexWrap="wrap">
                <Button
                  variant="primary"
                  bg="white"
                  color="#7A1722"
                  borderColor="white"
                  _hover={{ bg: '#FFF1F0', borderColor: '#FFF1F0' }}
                  rightIcon={<ArrowRight size={15} />}
                  onClick={() => router.push('/teacher/ai-video/create/text')}
                >
                  开始创作
                </Button>
                <Flex align="center" gap={2} px={3} color="whiteAlpha.700" fontSize="12px">
                  <WandSparkles size={14} /> Mock 原型 · 全流程可体验
                </Flex>
              </Flex>
            </Box>

            <Box
              bg="rgba(255,255,255,.09)"
              border="1px solid rgba(255,255,255,.14)"
              borderRadius="18px"
              p={4}
              backdropFilter="blur(12px)"
            >
              <AspectPreview />
            </Box>
          </Grid>
        </Box>

        <Box>
          <Flex
            align={{ base: 'flex-start', md: 'flex-end' }}
            justify="space-between"
            direction={{ base: 'column', md: 'row' }}
            gap={2}
            mb={4}
          >
            <Box>
              <Text fontSize="18px" fontWeight={700} color="#1D2129">
                选择创作方式
              </Text>
              <Text fontSize="13px" color="#86909C" mt={1}>
                从已有内容出发，选择最适合当前备课素材的生成链路
              </Text>
            </Box>
            <Text fontSize="12px" color="#A0A7B4">
              三种方式均可进入统一分镜编辑工作台
            </Text>
          </Flex>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={5}>
            <ModeCard
              icon={<FileText size={24} />}
              eyebrow="FROM IDEA"
              title={t('aiVideo.home.mode.text.title')}
              description="输入课程主题、教学目标或完整讲稿，AI 自动规划内容结构与镜头。"
              steps={['输入主题', '生成分镜', '精修导出']}
              accent="#C8000B"
              accentBg="#FFF1F0"
              actionLabel="从文本开始创作"
              onClick={() => router.push('/teacher/ai-video/create/text')}
            />
            <ModeCard
              icon={<Presentation size={24} />}
              eyebrow="FROM COURSEWARE"
              title={t('aiVideo.home.mode.ppt.title')}
              description="上传 PPT、Word 或 PDF，智能提取页面内容并生成逐页讲解视频。"
              steps={['上传解析', '配置讲解', '预览编辑']}
              accent="#5B57D1"
              accentBg="#F0EFFF"
              actionLabel="上传课件或文档"
              onClick={() => router.push('/teacher/ai-video/create/ppt')}
            />
            <ModeCard
              icon={<LayoutTemplate size={24} />}
              eyebrow="FROM TEMPLATE"
              title={t('aiVideo.home.mode.template.title')}
              description="从空白画布自由搭建，或使用教学模板快速替换内容与讲解素材。"
              steps={['选择起点', '替换内容', '精修导出']}
              accent="#147D64"
              accentBg="#EAF8F3"
              actionLabel="从空白或模板创建"
              onClick={() => setIsTemplateOpen(true)}
            />
          </Grid>
        </Box>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
          {WORKFLOW_FEATURES.map(({ icon: Icon, title, description }, index) => (
            <Flex
              key={title}
              align="center"
              gap={3}
              bg="white"
              border="1px solid #ECEEF2"
              borderRadius="14px"
              px={4}
              py={3}
            >
              <Flex
                w="36px"
                h="36px"
                flexShrink={0}
                borderRadius="11px"
                bg={index === 0 ? '#FFF1F0' : index === 1 ? '#F0EFFF' : '#EAF8F3'}
                color={index === 0 ? AI_VIDEO_PRIMARY : index === 1 ? '#5B57D1' : '#147D64'}
                align="center"
                justify="center"
              >
                <Icon size={18} />
              </Flex>
              <Box>
                <Text fontSize="13px" fontWeight={650} color="#1D2129">
                  {title}
                </Text>
                <Text fontSize="11px" color="#86909C" mt={0.5}>
                  {description}
                </Text>
              </Box>
            </Flex>
          ))}
        </Grid>

        <VStack align="stretch" spacing={4} pb={6}>
          <Flex align="center" gap={3}>
            <Text fontSize="18px" fontWeight={700} color="#1D2129">
              {t('aiVideo.home.project.title')}
            </Text>
            {!isLoading && projects.length > 0 ? (
              <Tag borderRadius="full" bg="#F2F3F5" color="#86909C">
                {t('aiVideo.home.project.count', { count: projects.length })}
              </Tag>
            ) : null}
          </Flex>
          <ProjectList projects={projects} isLoading={isLoading} onChanged={() => void refresh()} />
        </VStack>
      </VStack>
      <TemplateVideoDialog isOpen={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} />
    </Box>
  );
}

function AspectPreview() {
  return (
    <Box>
      <AspectRatio ratio={16 / 9} borderRadius="13px" overflow="hidden" bg="#11131A">
        <Box
          position="relative"
          bgImage="url('/media/ai-video/shot-3.jpg')"
          bgSize="cover"
          bgPosition="center"
        >
          <Box
            position="absolute"
            inset={0}
            bg="linear-gradient(90deg, rgba(13,16,25,.72), rgba(13,16,25,.06))"
          />
          <Box position="absolute" left={5} top="50%" transform="translateY(-50%)" maxW="65%">
            <Text fontSize="10px" color="#FFB9BE" fontWeight={700}>
              工业机器人实训课
            </Text>
            <Text fontSize="17px" color="white" fontWeight={700} mt={1}>
              TCP 标定方法
            </Text>
            <Flex mt={3} align="center" gap={2} color="whiteAlpha.700" fontSize="9px">
              <Flex
                w="24px"
                h="24px"
                borderRadius="full"
                bg="white"
                color="#7A1722"
                align="center"
                justify="center"
              >
                <Play size={10} fill="currentColor" />
              </Flex>
              02:18 · 6 个教学镜头
            </Flex>
          </Box>
          <Tag
            position="absolute"
            top={3}
            right={3}
            bg="blackAlpha.600"
            color="white"
            borderRadius="full"
            fontSize="9px"
          >
            AI 生成
          </Tag>
        </Box>
      </AspectRatio>
      <Flex mt={3} gap={2}>
        {['脚本', '画面', '配音', '字幕', '成片'].map((label, index) => (
          <Flex key={label} flex="1" direction="column" gap={1.5}>
            <Box h="3px" borderRadius="full" bg={index < 4 ? '#FF737D' : 'whiteAlpha.300'} />
            <Text
              fontSize="9px"
              color={index < 4 ? 'whiteAlpha.800' : 'whiteAlpha.500'}
              textAlign="center"
            >
              {label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
