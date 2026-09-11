'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  AspectRatio,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  Grid,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Radio,
  RadioGroup,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack
} from '@chakra-ui/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  Check,
  ClipboardCheck,
  FileSliders,
  MousePointerClick,
  Pause,
  Play,
  Presentation,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Video,
  Wrench
} from 'lucide-react';
import type {
  MockArtifact,
  MockCampusArtifact,
  MockInteractiveArtifact,
  MockLessonArtifact,
  MockPracticeArtifact,
  MockQuizArtifact,
  MockSlidesArtifact,
  MockSlide,
  MockStandardsArtifact,
  MockVideoArtifact
} from '../mockSkillConversation';

const toneMap: Record<
  MockSlide['tone'],
  { accent: string; soft: string; gradient: string; marker: string }
> = {
  red: {
    accent: '#C8000B',
    soft: '#FFF1F0',
    gradient: 'linear-gradient(135deg, #FFF7F5 0%, #FFFFFF 58%, #FFE7E4 100%)',
    marker: '#E52531'
  },
  blue: {
    accent: '#1D4ED8',
    soft: '#EFF6FF',
    gradient: 'linear-gradient(135deg, #F5F9FF 0%, #FFFFFF 55%, #E7F0FF 100%)',
    marker: '#3B82F6'
  },
  teal: {
    accent: '#0F766E',
    soft: '#F0FDFA',
    gradient: 'linear-gradient(135deg, #F2FFFC 0%, #FFFFFF 55%, #DDF8F1 100%)',
    marker: '#14B8A6'
  },
  amber: {
    accent: '#B45309',
    soft: '#FFFBEB',
    gradient: 'linear-gradient(135deg, #FFFDF5 0%, #FFFFFF 55%, #FFF2C7 100%)',
    marker: '#F59E0B'
  }
};

function SlidesPreview({ artifact }: { artifact: MockSlidesArtifact }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [artifact.id]);

  const slide = artifact.slides[currentIndex];
  const tone = toneMap[slide.tone];

  return (
    <Grid templateColumns={{ base: '1fr', md: '118px minmax(0, 1fr)' }} gap={4} minH={0}>
      <Flex
        direction={{ base: 'row', md: 'column' }}
        gap={2}
        overflowX={{ base: 'auto', md: 'hidden' }}
        overflowY={{ base: 'hidden', md: 'auto' }}
        maxH={{ base: '82px', md: '520px' }}
        pr={{ base: 0, md: 1 }}
        pb={{ base: 1, md: 0 }}
      >
        {artifact.slides.map((item, index) => {
          const active = index === currentIndex;
          return (
            <Box
              as="button"
              type="button"
              key={item.id}
              onClick={() => setCurrentIndex(index)}
              w={{ base: '118px', md: '100%' }}
              minW={{ base: '118px', md: 0 }}
              textAlign="left"
              border="2px solid"
              borderColor={active ? '#C8000B' : '#E2E8F0'}
              borderRadius="9px"
              bg="white"
              p={2}
              _focusVisible={{ outline: 'none', boxShadow: '0 0 0 3px rgba(200,0,11,.16)' }}
            >
              <Text fontSize="9px" color="#94A3B8">
                {String(item.page).padStart(2, '0')}
              </Text>
              <Text mt={1} fontSize="10px" fontWeight={700} color="#334155" noOfLines={2}>
                {item.title}
              </Text>
            </Box>
          );
        })}
      </Flex>

      <Flex direction="column" minW={0}>
        <Box
          role="region"
          aria-label={`第 ${slide.page} 页幻灯片`}
          position="relative"
          overflow="hidden"
          borderRadius={{ base: '14px', md: '18px' }}
          border="1px solid #E2E8F0"
          bg={tone.gradient}
          minH={{ base: '360px', md: '500px' }}
          p={{ base: 6, md: 10 }}
          boxShadow="0 16px 45px rgba(15,23,42,.10)"
        >
          <Box
            position="absolute"
            right="-70px"
            top="-90px"
            w="240px"
            h="240px"
            borderRadius="full"
            border={`42px solid ${tone.soft}`}
            opacity={0.78}
          />
          <Box
            position="absolute"
            left="-40px"
            bottom="-60px"
            w="150px"
            h="150px"
            borderRadius="36px"
            bg={tone.soft}
            transform="rotate(24deg)"
          />

          <Flex position="relative" zIndex={1} direction="column" h="100%">
            <Flex align="center" justify="space-between" gap={4}>
              <Text fontSize="11px" color={tone.accent} fontWeight={800} letterSpacing="0.12em">
                {slide.kicker}
              </Text>
              <Text fontSize="11px" color="#94A3B8">
                {slide.page} / {artifact.slides.length}
              </Text>
            </Flex>
            <Box w="42px" h="4px" borderRadius="full" bg={tone.marker} mt={5} />
            <Text
              as="h3"
              mt={{ base: 7, md: 10 }}
              maxW="700px"
              fontSize={{ base: '27px', md: '40px' }}
              lineHeight="1.18"
              fontWeight={900}
              letterSpacing="-0.03em"
              color="#0F172A"
            >
              {slide.title}
            </Text>
            <Text
              mt={4}
              maxW="660px"
              fontSize={{ base: '13px', md: '16px' }}
              color="#64748B"
              lineHeight="1.75"
            >
              {slide.subtitle}
            </Text>
            <Grid
              mt="auto"
              pt={8}
              templateColumns={{ base: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }}
              gap={3}
            >
              {slide.bullets.map((bullet, index) => (
                <Flex
                  key={bullet}
                  align="flex-start"
                  gap={2}
                  bg="rgba(255,255,255,.78)"
                  border="1px solid rgba(226,232,240,.9)"
                  borderRadius="11px"
                  p={3}
                >
                  <Flex
                    w="20px"
                    h="20px"
                    align="center"
                    justify="center"
                    flexShrink={0}
                    borderRadius="7px"
                    bg={tone.soft}
                    color={tone.accent}
                    fontSize="10px"
                    fontWeight={800}
                  >
                    {index + 1}
                  </Flex>
                  <Text fontSize="11px" color="#334155" lineHeight="1.55">
                    {bullet}
                  </Text>
                </Flex>
              ))}
            </Grid>
          </Flex>
        </Box>

        <Flex mt={4} align="center" justify="space-between" gap={3}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ArrowLeft size={14} />}
            isDisabled={currentIndex === 0}
            onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
          >
            上一页
          </Button>
          <Text fontSize="11px" color="#64748B">
            当前第 {currentIndex + 1} 页
          </Text>
          <Button
            type="button"
            size="sm"
            color="white"
            bg="#C8000B"
            rightIcon={<ArrowRight size={14} />}
            isDisabled={currentIndex === artifact.slides.length - 1}
            _hover={{ bg: '#A50008' }}
            onClick={() =>
              setCurrentIndex((value) => Math.min(artifact.slides.length - 1, value + 1))
            }
          >
            下一页
          </Button>
        </Flex>
      </Flex>
    </Grid>
  );
}

function LessonPreview({ artifact }: { artifact: MockLessonArtifact }) {
  return (
    <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 1.35fr) minmax(280px, .65fr)' }} gap={4}>
      <Box border="1px solid #E2E8F0" borderRadius="14px" bg="white" overflow="hidden">
        <Flex px={5} py={4} align="center" justify="space-between" bg="#EFF6FF">
          <HStack color="#1D4ED8" spacing={2}>
            <BookOpenCheck size={17} />
            <Text fontSize="13px" fontWeight={800}>
              课堂活动时间轴
            </Text>
          </HStack>
          <Badge colorScheme="blue">45 分钟</Badge>
        </Flex>
        <VStack spacing={0} align="stretch">
          {artifact.timeline.map((item, index) => (
            <Grid
              key={item.time}
              templateColumns={{ base: '82px minmax(0, 1fr)', md: '92px 120px 1fr 1fr' }}
              gap={3}
              px={5}
              py={4}
              borderTop={index === 0 ? undefined : '1px solid #E8EDF3'}
              alignItems="start"
            >
              <Text fontSize="10px" color="#2563EB" fontWeight={800}>
                {item.time}
              </Text>
              <Text fontSize="11px" color="#1E293B" fontWeight={800}>
                {item.stage}
              </Text>
              <Box display={{ base: 'none', md: 'block' }}>
                <Text fontSize="9px" color="#94A3B8">
                  教师活动
                </Text>
                <Text mt={1} fontSize="10px" color="#475569" lineHeight="1.65">
                  {item.teacherActivity}
                </Text>
              </Box>
              <Box display={{ base: 'none', md: 'block' }}>
                <Text fontSize="9px" color="#94A3B8">
                  学生活动
                </Text>
                <Text mt={1} fontSize="10px" color="#475569" lineHeight="1.65">
                  {item.studentActivity}
                </Text>
              </Box>
            </Grid>
          ))}
        </VStack>
      </Box>

      <VStack spacing={4} align="stretch">
        <Box border="1px solid #DBEAFE" borderRadius="14px" bg="#F8FBFF" p={5}>
          <Text fontSize="12px" fontWeight={800} color="#1E3A8A">
            三维教学目标
          </Text>
          <VStack mt={3} spacing={2.5} align="stretch">
            {artifact.objectives.map((objective, index) => (
              <Flex key={objective} gap={2} align="flex-start">
                <Flex
                  w="20px"
                  h="20px"
                  flexShrink={0}
                  align="center"
                  justify="center"
                  borderRadius="6px"
                  bg="#DBEAFE"
                  color="#1D4ED8"
                  fontSize="9px"
                  fontWeight={800}
                >
                  {index + 1}
                </Flex>
                <Text fontSize="10px" color="#475569" lineHeight="1.65">
                  {objective}
                </Text>
              </Flex>
            ))}
          </VStack>
        </Box>
        <Box border="1px solid #E2E8F0" borderRadius="14px" bg="white" p={5}>
          <Text fontSize="12px" fontWeight={800} color="#334155">
            板书结构
          </Text>
          <VStack mt={3} spacing={2} align="stretch">
            {artifact.blackboard.map((item) => (
              <Text key={item} px={3} py={2} borderRadius="8px" bg="#F8FAFC" fontSize="10px">
                {item}
              </Text>
            ))}
          </VStack>
          <Divider my={4} />
          <Text fontSize="12px" fontWeight={800} color="#334155">
            评价构成
          </Text>
          <Flex mt={3} gap={2} wrap="wrap">
            {artifact.assessments.map((item) => (
              <Text
                key={item}
                px={2.5}
                py={1.5}
                borderRadius="full"
                bg="#FFF1F0"
                color="#B3121B"
                fontSize="9px"
              >
                {item}
              </Text>
            ))}
          </Flex>
        </Box>
      </VStack>
    </Grid>
  );
}

function InteractivePreview({ artifact }: { artifact: MockInteractiveArtifact }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const progress = Math.round((completed.length / artifact.modules.length) * 100);

  useEffect(() => setCompleted([]), [artifact.id]);

  return (
    <Grid templateColumns={{ base: '1fr', md: '260px minmax(0, 1fr)' }} gap={4}>
      <Box border="1px solid #BAE6FD" borderRadius="14px" p={4} bg="#F0F9FF">
        <HStack color="#0369A1" spacing={2}>
          <MousePointerClick size={17} />
          <Text fontSize="13px" fontWeight={800}>
            课堂互动控制台
          </Text>
        </HStack>
        <Text mt={2} fontSize="10px" color="#64748B">
          {artifact.launchMode}
        </Text>
        <Box mt={5}>
          <Flex justify="space-between" mb={2}>
            <Text fontSize="10px" color="#0369A1" fontWeight={700}>
              课堂完成进度
            </Text>
            <Text fontSize="10px" color="#0369A1">
              {progress}%
            </Text>
          </Flex>
          <Progress value={progress} size="sm" colorScheme="blue" borderRadius="full" />
        </Box>
        <Text
          mt={5}
          p={3}
          borderRadius="10px"
          bg="white"
          fontSize="10px"
          color="#475569"
          lineHeight="1.65"
        >
          教师点击右侧模块即可模拟投放；完成后会记录到本地课堂进度。
        </Text>
      </Box>
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={3}>
        {artifact.modules.map((module, index) => {
          const done = completed.includes(module.id);
          return (
            <Box
              key={module.id}
              border="1px solid"
              borderColor={done ? '#7DD3FC' : '#E2E8F0'}
              borderRadius="14px"
              p={4}
              bg={done ? '#F0F9FF' : 'white'}
            >
              <Flex align="center" justify="space-between" gap={3}>
                <Flex
                  w="28px"
                  h="28px"
                  borderRadius="9px"
                  bg="#E0F2FE"
                  color="#0284C7"
                  align="center"
                  justify="center"
                  fontSize="11px"
                  fontWeight={900}
                >
                  {index + 1}
                </Flex>
                <Badge colorScheme={done ? 'green' : 'gray'}>
                  {done ? '已投放' : module.duration}
                </Badge>
              </Flex>
              <Text mt={3} fontSize="12px" fontWeight={800} color="#1E293B">
                {module.title}
              </Text>
              <Text mt={2} fontSize="10px" color="#475569" lineHeight="1.65">
                {module.interaction}
              </Text>
              <Text mt={2} p={2.5} borderRadius="8px" bg="#F8FAFC" fontSize="9px" color="#64748B">
                反馈：{module.feedback}
              </Text>
              <Button
                mt={3}
                w="100%"
                size="sm"
                variant={done ? 'outline' : 'solid'}
                color={done ? '#0284C7' : 'white'}
                bg={done ? 'white' : '#0284C7'}
                _hover={{ bg: done ? '#F0F9FF' : '#0369A1' }}
                onClick={() =>
                  setCompleted((current) =>
                    done ? current.filter((id) => id !== module.id) : [...current, module.id]
                  )
                }
              >
                {done ? '撤回投放' : '模拟投放'}
              </Button>
            </Box>
          );
        })}
      </Grid>
    </Grid>
  );
}

function VideoPreview({ artifact }: { artifact: MockVideoArtifact }) {
  const [playing, setPlaying] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);
  const chapter = artifact.chapters[chapterIndex];

  useEffect(() => {
    setPlaying(false);
    setChapterIndex(0);
  }, [artifact.id]);

  return (
    <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 1.45fr) minmax(300px, .55fr)' }} gap={4}>
      <Box>
        <AspectRatio
          ratio={16 / 9}
          borderRadius="16px"
          overflow="hidden"
          boxShadow="0 18px 44px rgba(15,23,42,.18)"
        >
          <Flex
            position="relative"
            direction="column"
            align="center"
            justify="center"
            bg="linear-gradient(135deg,#111827 0%,#312E81 56%,#9F1239 100%)"
            color="white"
          >
            <Box
              position="absolute"
              inset={0}
              opacity={0.18}
              bgImage="radial-gradient(circle at 20% 20%, white 0 1px, transparent 1px)"
              bgSize="22px 22px"
            />
            <Flex
              position="relative"
              w="66px"
              h="66px"
              borderRadius="full"
              bg="whiteAlpha.300"
              backdropFilter="blur(8px)"
              align="center"
              justify="center"
            >
              <IconButton
                aria-label={playing ? '暂停视频' : '播放视频'}
                icon={playing ? <Pause size={24} /> : <Play size={24} />}
                variant="ghost"
                color="white"
                borderRadius="full"
                _hover={{ bg: 'whiteAlpha.300' }}
                onClick={() => setPlaying((value) => !value)}
              />
            </Flex>
            <Text
              position="relative"
              mt={5}
              fontSize="18px"
              fontWeight={900}
              textAlign="center"
              px={6}
            >
              {chapter.title}
            </Text>
            <Text
              position="relative"
              mt={2}
              maxW="580px"
              px={6}
              textAlign="center"
              fontSize="11px"
              color="whiteAlpha.800"
            >
              {chapter.visual}
            </Text>
            <Text position="absolute" left={5} bottom={4} fontSize="10px" color="whiteAlpha.800">
              {playing ? '正在播放 Mock 视频' : '视频已暂停'} · {artifact.duration}
            </Text>
            <Badge position="absolute" right={5} top={4} colorScheme="pink">
              {artifact.ratio}
            </Badge>
          </Flex>
        </AspectRatio>
        <Box mt={4} p={4} border="1px solid #FBCFE8" borderRadius="13px" bg="#FDF2F8">
          <Text fontSize="10px" fontWeight={800} color="#9D174D">
            教师旁白
          </Text>
          <Text mt={1.5} fontSize="11px" color="#831843" lineHeight="1.7">
            “{chapter.narration}”
          </Text>
        </Box>
      </Box>
      <Box border="1px solid #E2E8F0" borderRadius="14px" bg="white" p={4}>
        <Text fontSize="12px" fontWeight={800} color="#1E293B">
          分镜章节
        </Text>
        <VStack mt={3} spacing={2} align="stretch">
          {artifact.chapters.map((item, index) => (
            <Button
              key={item.id}
              h="auto"
              py={3}
              px={3}
              justifyContent="flex-start"
              textAlign="left"
              variant="ghost"
              border="1px solid"
              borderColor={chapterIndex === index ? '#F9A8D4' : '#E2E8F0'}
              bg={chapterIndex === index ? '#FDF2F8' : 'white'}
              onClick={() => setChapterIndex(index)}
            >
              <Box>
                <Text fontSize="9px" color="#DB2777">
                  {item.time}
                </Text>
                <Text mt={1} fontSize="11px" fontWeight={800} color="#334155">
                  {item.title}
                </Text>
              </Box>
            </Button>
          ))}
        </VStack>
        <Flex mt={4} gap={2} wrap="wrap">
          {artifact.subtitleHighlights.map((item) => (
            <Text
              key={item}
              px={2}
              py={1}
              borderRadius="6px"
              bg="#F1F5F9"
              fontSize="9px"
              color="#475569"
            >
              字幕 · {item}
            </Text>
          ))}
        </Flex>
      </Box>
    </Grid>
  );
}

function StandardsPreview({ artifact }: { artifact: MockStandardsArtifact }) {
  return (
    <Box>
      <Flex
        mb={4}
        p={5}
        border="1px solid #FDE68A"
        borderRadius="14px"
        bg="#FFFBEB"
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Box>
          <HStack spacing={2} color="#B45309">
            <BadgeCheck size={18} />
            <Text fontSize="13px" fontWeight={800}>
              {artifact.standardName}
            </Text>
          </HStack>
          <Text mt={2} fontSize="10px" color="#78716C">
            Mock 对齐结果已覆盖任务要求中的核心知识、操作与安全能力。
          </Text>
        </Box>
        <Box minW={{ base: '100%', md: '220px' }}>
          <Flex justify="space-between" mb={2}>
            <Text fontSize="10px" color="#92400E" fontWeight={700}>
              标准覆盖率
            </Text>
            <Text fontSize="13px" color="#B45309" fontWeight={900}>
              {artifact.coverage}%
            </Text>
          </Flex>
          <Progress value={artifact.coverage} size="sm" colorScheme="orange" borderRadius="full" />
        </Box>
      </Flex>
      <Box border="1px solid #E2E8F0" borderRadius="14px" overflowX="auto" bg="white">
        <Grid
          templateColumns="86px minmax(130px,.8fr) minmax(200px,1.4fr) 80px"
          bg="#F8FAFC"
          px={4}
          py={3}
          gap={3}
          fontSize="10px"
          fontWeight={800}
          color="#64748B"
        >
          <Text>标准编码</Text>
          <Text>岗位能力点</Text>
          <Text>达成证据</Text>
          <Text textAlign="right">评价等级</Text>
        </Grid>
        {artifact.items.map((item, index) => (
          <Grid
            key={item.code}
            templateColumns="86px minmax(130px,.8fr) minmax(200px,1.4fr) 80px"
            px={4}
            py={4}
            gap={3}
            borderTop={index === 0 ? undefined : '1px solid #E8EDF3'}
            alignItems="center"
          >
            <Text fontFamily="mono" fontSize="10px" color="#B45309" fontWeight={800}>
              {item.code}
            </Text>
            <Text fontSize="11px" color="#1E293B" fontWeight={700}>
              {item.ability}
            </Text>
            <Text fontSize="10px" color="#64748B" lineHeight="1.6">
              {item.evidence}
            </Text>
            <Text textAlign="right" fontSize="10px" color="#047857" fontWeight={800}>
              {item.level}
            </Text>
          </Grid>
        ))}
      </Box>
    </Box>
  );
}

function QuizPreview({ artifact }: { artifact: MockQuizArtifact }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [artifact.id]);

  const score = useMemo(
    () =>
      artifact.questions.reduce(
        (total, question) => total + (answers[question.id] === question.answerId ? 1 : 0),
        0
      ),
    [answers, artifact.questions]
  );
  const complete = artifact.questions.every((question) => Boolean(answers[question.id]));

  return (
    <Box maxW="780px" mx="auto">
      <Flex
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={3}
        mb={5}
        p={4}
        borderRadius="14px"
        bg={submitted ? '#F0FDF4' : '#FAF5FF'}
        border={submitted ? '1px solid #BBF7D0' : '1px solid #E9D5FF'}
      >
        <Box>
          <Text fontSize="13px" fontWeight={800} color="#1E293B">
            {submitted
              ? `测验完成：答对 ${score} / ${artifact.questions.length} 题`
              : '随堂诊断测验'}
          </Text>
          <Text mt={1} fontSize="11px" color="#64748B">
            {submitted
              ? '已显示正确答案与解析，可重新作答。'
              : `已作答 ${Object.keys(answers).length} / ${artifact.questions.length} 题`}
          </Text>
        </Box>
        {submitted && (
          <Badge
            colorScheme={score === artifact.questions.length ? 'green' : 'orange'}
            px={3}
            py={1.5}
            borderRadius="full"
          >
            得分 {Math.round((score / artifact.questions.length) * 100)}
          </Badge>
        )}
      </Flex>

      <VStack spacing={4} align="stretch">
        {artifact.questions.map((question, index) => {
          const selected = answers[question.id];
          const correct = selected === question.answerId;
          return (
            <Box
              key={question.id}
              border="1px solid #E2E8F0"
              borderRadius="14px"
              p={{ base: 4, md: 5 }}
              bg="white"
            >
              <Flex gap={3} align="flex-start">
                <Flex
                  w="26px"
                  h="26px"
                  borderRadius="8px"
                  bg="#FFF1F0"
                  color="#C8000B"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  fontSize="11px"
                  fontWeight={800}
                >
                  {index + 1}
                </Flex>
                <Box flex="1">
                  <Text fontSize="13px" fontWeight={700} color="#1E293B" lineHeight="1.65">
                    {question.stem}
                  </Text>
                  <RadioGroup
                    mt={3}
                    value={selected || ''}
                    onChange={(value) => {
                      if (!submitted)
                        setAnswers((current) => ({ ...current, [question.id]: value }));
                    }}
                  >
                    <VStack align="stretch" spacing={2}>
                      {question.options.map((option) => {
                        const isAnswer = option.id === question.answerId;
                        const isSelected = option.id === selected;
                        const optionBg =
                          submitted && isAnswer
                            ? '#F0FDF4'
                            : submitted && isSelected && !isAnswer
                              ? '#FFF1F0'
                              : '#F8FAFC';
                        const optionBorder =
                          submitted && isAnswer
                            ? '#86EFAC'
                            : submitted && isSelected && !isAnswer
                              ? '#FDA4AF'
                              : '#E2E8F0';
                        return (
                          <Radio
                            key={option.id}
                            value={option.id}
                            isDisabled={submitted}
                            px={3}
                            py={2.5}
                            border="1px solid"
                            borderColor={optionBorder}
                            borderRadius="10px"
                            bg={optionBg}
                            colorScheme="red"
                          >
                            <Text as="span" fontSize="12px" color="#475569">
                              {option.id.toUpperCase()}. {option.label}
                            </Text>
                          </Radio>
                        );
                      })}
                    </VStack>
                  </RadioGroup>
                  {submitted && (
                    <Box mt={3} p={3} borderRadius="10px" bg={correct ? '#F0FDF4' : '#FFF7ED'}>
                      <HStack spacing={2} color={correct ? '#15803D' : '#C2410C'}>
                        {correct ? <Check size={14} /> : <AlertTriangle size={14} />}
                        <Text fontSize="11px" fontWeight={700}>
                          {correct ? '回答正确' : `正确答案：${question.answerId.toUpperCase()}`}
                        </Text>
                      </HStack>
                      <Text mt={1.5} fontSize="11px" color="#64748B" lineHeight="1.65">
                        {question.explanation}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Flex>
            </Box>
          );
        })}
      </VStack>

      <Flex mt={5} justify="flex-end" gap={3}>
        {submitted ? (
          <Button
            type="button"
            leftIcon={<RotateCcw size={15} />}
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
          >
            重新作答
          </Button>
        ) : (
          <Button
            type="button"
            bg="#C8000B"
            color="white"
            isDisabled={!complete}
            _hover={{ bg: '#A50008' }}
            onClick={() => setSubmitted(true)}
          >
            提交并查看结果
          </Button>
        )}
      </Flex>
    </Box>
  );
}

function PracticePreview({ artifact }: { artifact: MockPracticeArtifact }) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    setCompletedSteps([]);
  }, [artifact.id]);

  const progress = Math.round((completedSteps.length / artifact.steps.length) * 100);

  return (
    <Tabs colorScheme="red" variant="soft-rounded" isLazy>
      <TabList overflowX="auto" pb={2} gap={2}>
        <Tab fontSize="12px">任务说明</Tab>
        <Tab fontSize="12px">操作步骤</Tab>
        <Tab fontSize="12px">评价标准</Tab>
      </TabList>
      <TabPanels mt={3}>
        <TabPanel px={0}>
          <Grid
            templateColumns={{ base: '1fr', md: 'minmax(0, 1.2fr) minmax(260px, .8fr)' }}
            gap={4}
          >
            <Box border="1px solid #E2E8F0" borderRadius="14px" p={5} bg="white">
              <HStack color="#0F766E" spacing={2}>
                <Wrench size={17} />
                <Text fontSize="13px" fontWeight={800}>
                  任务目标
                </Text>
              </HStack>
              <Text mt={3} fontSize="13px" color="#475569" lineHeight="1.8">
                {artifact.objective}
              </Text>
              <Divider my={4} />
              <Text fontSize="12px" fontWeight={700} color="#334155">
                设备与工具
              </Text>
              <Flex mt={3} gap={2} wrap="wrap">
                {artifact.equipment.map((item) => (
                  <Text
                    key={item}
                    fontSize="10px"
                    color="#475569"
                    bg="#F1F5F9"
                    px={2.5}
                    py={1.5}
                    borderRadius="full"
                  >
                    {item}
                  </Text>
                ))}
              </Flex>
            </Box>
            <Box border="1px solid #FED7AA" borderRadius="14px" p={5} bg="#FFF7ED">
              <HStack color="#C2410C" spacing={2}>
                <ShieldCheck size={17} />
                <Text fontSize="13px" fontWeight={800}>
                  安全红线
                </Text>
              </HStack>
              <VStack mt={3} spacing={3} align="stretch">
                {artifact.safetyNotes.map((note, index) => (
                  <Flex key={note} gap={2} align="flex-start">
                    <Flex
                      w="19px"
                      h="19px"
                      flexShrink={0}
                      borderRadius="6px"
                      bg="#FFEDD5"
                      color="#C2410C"
                      align="center"
                      justify="center"
                      fontSize="10px"
                      fontWeight={800}
                    >
                      {index + 1}
                    </Flex>
                    <Text fontSize="11px" color="#7C2D12" lineHeight="1.65">
                      {note}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </Grid>
        </TabPanel>
        <TabPanel px={0}>
          <Box mb={4} p={4} border="1px solid #CCFBF1" borderRadius="13px" bg="#F0FDFA">
            <Flex align="center" justify="space-between" gap={3} mb={2}>
              <Text fontSize="12px" fontWeight={800} color="#115E59">
                实训进度
              </Text>
              <Text fontSize="11px" color="#0F766E">
                {completedSteps.length} / {artifact.steps.length} 步
              </Text>
            </Flex>
            <Progress
              value={progress}
              size="sm"
              borderRadius="full"
              colorScheme="teal"
              bg="#CCFBF1"
            />
          </Box>
          <VStack spacing={3} align="stretch">
            {artifact.steps.map((step, index) => {
              const checked = completedSteps.includes(step.id);
              return (
                <Flex
                  key={step.id}
                  border="1px solid"
                  borderColor={checked ? '#99F6E4' : '#E2E8F0'}
                  borderRadius="13px"
                  p={4}
                  gap={3}
                  bg={checked ? '#F0FDFA' : 'white'}
                >
                  <Checkbox
                    colorScheme="teal"
                    isChecked={checked}
                    alignSelf="flex-start"
                    mt={0.5}
                    onChange={() =>
                      setCompletedSteps((current) =>
                        checked ? current.filter((id) => id !== step.id) : [...current, step.id]
                      )
                    }
                    aria-label={`完成步骤：${step.title}`}
                  />
                  <Box flex="1">
                    <Flex align="center" justify="space-between" gap={3}>
                      <Text fontSize="12px" fontWeight={800} color="#1E293B">
                        {index + 1}. {step.title}
                      </Text>
                      <Text
                        fontSize="10px"
                        color="#64748B"
                        bg="#F1F5F9"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        {step.duration}
                      </Text>
                    </Flex>
                    <Text mt={1.5} fontSize="11px" color="#64748B" lineHeight="1.65">
                      {step.detail}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
          </VStack>
        </TabPanel>
        <TabPanel px={0}>
          <Box border="1px solid #E2E8F0" borderRadius="14px" overflow="hidden" bg="white">
            <Grid
              templateColumns="140px minmax(0, 1fr) 74px"
              bg="#F8FAFC"
              px={4}
              py={3}
              fontSize="11px"
              fontWeight={800}
              color="#475569"
            >
              <Text>评价维度</Text>
              <Text>评价说明</Text>
              <Text textAlign="right">分值</Text>
            </Grid>
            {artifact.rubrics.map((rubric, index) => (
              <Grid
                key={rubric.dimension}
                templateColumns="140px minmax(0, 1fr) 74px"
                px={4}
                py={4}
                borderTop={index === 0 ? undefined : '1px solid #E2E8F0'}
                alignItems="center"
              >
                <Text fontSize="12px" fontWeight={700} color="#1E293B">
                  {rubric.dimension}
                </Text>
                <Text fontSize="11px" color="#64748B">
                  {rubric.description}
                </Text>
                <Text textAlign="right" fontSize="13px" fontWeight={800} color="#C8000B">
                  {rubric.score} 分
                </Text>
              </Grid>
            ))}
            <Flex px={4} py={3} bg="#FFF1F0" align="center" justify="space-between">
              <Text fontSize="12px" fontWeight={800} color="#1E293B">
                总分
              </Text>
              <Text fontSize="16px" fontWeight={900} color="#C8000B">
                100 分
              </Text>
            </Flex>
          </Box>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

const campusDomainTheme: Record<
  MockCampusArtifact['domain'],
  { accent: string; soft: string; border: string; gradient: string; icon: typeof Building2 }
> = {
  'school-affairs': {
    accent: '#B3121B',
    soft: '#FFF1F0',
    border: '#FDDBD6',
    gradient: 'linear-gradient(135deg,#FFF7F5 0%,#FFFFFF 55%,#FFE8E4 100%)',
    icon: Building2
  },
  procurement: {
    accent: '#6D28D9',
    soft: '#F5F3FF',
    border: '#DDD6FE',
    gradient: 'linear-gradient(135deg,#F7F5FF 0%,#FFFFFF 55%,#EDE9FE 100%)',
    icon: ShoppingCart
  },
  logistics: {
    accent: '#0F766E',
    soft: '#F0FDFA',
    border: '#99F6E4',
    gradient: 'linear-gradient(135deg,#F0FDFA 0%,#FFFFFF 55%,#CCFBF1 100%)',
    icon: Wrench
  },
  meeting: {
    accent: '#1D4ED8',
    soft: '#EFF6FF',
    border: '#BFDBFE',
    gradient: 'linear-gradient(135deg,#EFF6FF 0%,#FFFFFF 55%,#DBEAFE 100%)',
    icon: CalendarCheck
  }
};

const campusMetricTones: Record<
  MockCampusArtifact['metrics'][number]['tone'],
  { color: string; bg: string; border: string }
> = {
  red: { color: '#B3121B', bg: '#FFF1F0', border: '#FDDBD6' },
  purple: { color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  teal: { color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  blue: { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  amber: { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  green: { color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' }
};

const campusStatusTone: Record<
  MockCampusArtifact['records'][number]['status'],
  { color: string; bg: string }
> = {
  已完成: { color: '#047857', bg: '#ECFDF5' },
  进行中: { color: '#1D4ED8', bg: '#EFF6FF' },
  待补充: { color: '#B45309', bg: '#FFFBEB' },
  待确认: { color: '#B3121B', bg: '#FFF1F0' }
};

function CampusPreview({ artifact }: { artifact: MockCampusArtifact }) {
  const theme = campusDomainTheme[artifact.domain];
  const DomainIcon = theme.icon;

  return (
    <VStack spacing={4} align="stretch">
      <Flex
        as="section"
        aria-label={`${artifact.domainLabel}结果摘要`}
        position="relative"
        overflow="hidden"
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        gap={4}
        p={{ base: 5, md: 6 }}
        border="1px solid"
        borderColor={theme.border}
        borderRadius="16px"
        bg={theme.gradient}
      >
        <Box
          position="absolute"
          right="-48px"
          top="-64px"
          w="180px"
          h="180px"
          borderRadius="full"
          border={`34px solid ${theme.soft}`}
          opacity={0.8}
        />
        <HStack position="relative" spacing={3} align="flex-start" maxW="760px">
          <Flex
            w="40px"
            h="40px"
            flexShrink={0}
            align="center"
            justify="center"
            borderRadius="12px"
            bg="white"
            color={theme.accent}
            boxShadow="0 6px 18px rgba(15,23,42,.08)"
          >
            <DomainIcon size={19} />
          </Flex>
          <Box>
            <HStack spacing={2} wrap="wrap">
              <Text as="h3" fontSize="14px" fontWeight={900} color="#0F172A">
                {artifact.domainLabel}智能处理结果
              </Text>
              <Badge color="white" bg={theme.accent} borderRadius="full" px={2}>
                Mock 数据
              </Badge>
            </HStack>
            <Text mt={2} fontSize="11px" color="#475569" lineHeight="1.75">
              {artifact.overview}
            </Text>
          </Box>
        </HStack>
      </Flex>

      <Grid
        as="section"
        aria-label="关键数据"
        templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }}
        gap={3}
      >
        {artifact.metrics.map((metric) => {
          const tone = campusMetricTones[metric.tone];
          return (
            <Box
              key={metric.label}
              p={4}
              border="1px solid"
              borderColor={tone.border}
              borderRadius="13px"
              bg={tone.bg}
            >
              <Text fontSize="10px" color="#64748B" fontWeight={700}>
                {metric.label}
              </Text>
              <Text
                mt={1}
                fontSize={{ base: '20px', md: '23px' }}
                fontWeight={900}
                color={tone.color}
              >
                {metric.value}
              </Text>
              <Text mt={1} fontSize="9px" color="#64748B">
                {metric.note}
              </Text>
            </Box>
          );
        })}
      </Grid>

      <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 1.4fr) minmax(280px, .6fr)' }} gap={4}>
        <Box
          as="section"
          aria-label="智能处理结果"
          border="1px solid #E2E8F0"
          borderRadius="14px"
          bg="white"
          overflow="hidden"
        >
          <Flex px={5} py={4} align="center" justify="space-between" bg="#F8FAFC">
            <Text fontSize="12px" fontWeight={800} color="#1E293B">
              智能处理结果
            </Text>
            <Text fontSize="9px" color="#64748B">
              共 {artifact.records.length} 项
            </Text>
          </Flex>
          <VStack spacing={0} align="stretch">
            {artifact.records.map((record, index) => {
              const statusTone = campusStatusTone[record.status];
              return (
                <Box
                  key={`${record.category}-${record.title}`}
                  px={5}
                  py={4}
                  borderTop={index === 0 ? undefined : '1px solid #E8EDF3'}
                >
                  <Flex align="flex-start" justify="space-between" gap={3}>
                    <Box minW={0}>
                      <Text fontSize="9px" color={theme.accent} fontWeight={800}>
                        {record.category}
                      </Text>
                      <Text mt={1} fontSize="12px" color="#1E293B" fontWeight={800}>
                        {record.title}
                      </Text>
                    </Box>
                    <Text
                      flexShrink={0}
                      px={2}
                      py={1}
                      borderRadius="full"
                      bg={statusTone.bg}
                      color={statusTone.color}
                      fontSize="9px"
                      fontWeight={800}
                    >
                      {record.status}
                    </Text>
                  </Flex>
                  <Text mt={2} fontSize="10px" color="#64748B" lineHeight="1.65">
                    {record.detail}
                  </Text>
                  <Text mt={2} fontSize="9px" color="#94A3B8">
                    责任人：{record.owner}
                  </Text>
                </Box>
              );
            })}
          </VStack>
        </Box>

        <Box
          as="section"
          aria-label="执行检查清单"
          border="1px solid"
          borderColor={theme.border}
          borderRadius="14px"
          bg={theme.soft}
          p={5}
        >
          <HStack spacing={2} color={theme.accent}>
            <ShieldCheck size={17} />
            <Text fontSize="12px" fontWeight={800}>
              执行检查清单
            </Text>
          </HStack>
          <VStack mt={4} spacing={3} align="stretch">
            {artifact.checklist.map((item) => (
              <Flex key={item} gap={2.5} align="flex-start">
                <Flex
                  w="19px"
                  h="19px"
                  flexShrink={0}
                  align="center"
                  justify="center"
                  borderRadius="6px"
                  bg="white"
                  color={theme.accent}
                >
                  <Check size={12} />
                </Flex>
                <Text fontSize="10px" color="#475569" lineHeight="1.65">
                  {item}
                </Text>
              </Flex>
            ))}
          </VStack>
        </Box>
      </Grid>

      <Box
        as="section"
        aria-label="下一步行动"
        border="1px solid #E2E8F0"
        borderRadius="14px"
        bg="white"
        overflow="hidden"
      >
        <Text px={5} py={4} bg="#F8FAFC" fontSize="12px" fontWeight={800} color="#1E293B">
          下一步行动
        </Text>
        {artifact.nextActions.map((action, index) => (
          <Grid
            key={action.task}
            templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) 160px 110px' }}
            gap={3}
            alignItems="center"
            px={5}
            py={3.5}
            borderTop={index === 0 ? undefined : '1px solid #E8EDF3'}
          >
            <Text fontSize="11px" fontWeight={700} color="#334155">
              {action.task}
            </Text>
            <Text fontSize="10px" color="#64748B">
              {action.owner}
            </Text>
            <Text fontSize="10px" color={theme.accent} fontWeight={800}>
              {action.due}
            </Text>
          </Grid>
        ))}
      </Box>
    </VStack>
  );
}

const artifactTitle = (artifact: MockArtifact | null) => {
  if (!artifact) return '';
  if (artifact.type === 'lesson') return '教案预览';
  if (artifact.type === 'slides') return '幻灯片预览';
  if (artifact.type === 'interactive') return '互动课件预览';
  if (artifact.type === 'video') return '视频课件预览';
  if (artifact.type === 'quiz') return '测验预览';
  if (artifact.type === 'practice') return '实训内容预览';
  if (artifact.type === 'campus') return `${artifact.domainLabel}结果预览`;
  return '技能标准对齐预览';
};

const artifactIcon = (artifact: MockArtifact | null) => {
  if (!artifact) return Presentation;
  if (artifact.type === 'lesson') return BookOpenCheck;
  if (artifact.type === 'slides') return Presentation;
  if (artifact.type === 'interactive') return MousePointerClick;
  if (artifact.type === 'video') return Video;
  if (artifact.type === 'quiz') return ClipboardCheck;
  if (artifact.type === 'practice') return FileSliders;
  if (artifact.type === 'campus') return campusDomainTheme[artifact.domain].icon;
  return BadgeCheck;
};

export default function ArtifactPreviewModal({
  artifact,
  isOpen,
  onClose
}: {
  artifact: MockArtifact | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const PreviewIcon = artifactIcon(artifact);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside" isCentered>
      <ModalOverlay bg="rgba(15,23,42,.48)" backdropFilter="blur(5px)" />
      <ModalContent mx={{ base: 3, md: 6 }} maxH="92vh" borderRadius="18px" overflow="hidden">
        <ModalHeader borderBottom="1px solid #E2E8F0" py={4}>
          <HStack spacing={3} pr={8}>
            <Flex
              w="34px"
              h="34px"
              align="center"
              justify="center"
              borderRadius="10px"
              bg="#FFF1F0"
              color="#C8000B"
            >
              <PreviewIcon size={17} />
            </Flex>
            <Box minW={0}>
              <Text fontSize="15px" fontWeight={800} color="#0F172A">
                {artifactTitle(artifact)}
              </Text>
              <Text fontSize="10px" fontWeight={400} color="#94A3B8" noOfLines={1}>
                {artifact?.title}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton top="15px" right="16px" aria-label="关闭预览" />
        <ModalBody bg="#F8FAFC" px={{ base: 4, md: 6 }} py={5}>
          {artifact?.type === 'lesson' && <LessonPreview artifact={artifact} />}
          {artifact?.type === 'slides' && <SlidesPreview artifact={artifact} />}
          {artifact?.type === 'interactive' && <InteractivePreview artifact={artifact} />}
          {artifact?.type === 'video' && <VideoPreview artifact={artifact} />}
          {artifact?.type === 'quiz' && <QuizPreview artifact={artifact} />}
          {artifact?.type === 'practice' && <PracticePreview artifact={artifact} />}
          {artifact?.type === 'standards' && <StandardsPreview artifact={artifact} />}
          {artifact?.type === 'campus' && <CampusPreview artifact={artifact} />}
        </ModalBody>
        <ModalFooter borderTop="1px solid #E2E8F0" py={3}>
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            返回对话
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
