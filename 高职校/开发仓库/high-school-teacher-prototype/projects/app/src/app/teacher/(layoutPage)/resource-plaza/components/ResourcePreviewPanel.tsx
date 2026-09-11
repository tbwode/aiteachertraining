'use client';

import { useState } from 'react';
import {
  AspectRatio,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Progress,
  Stack,
  Text
} from '@chakra-ui/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
  Pause,
  Play,
  Volume2
} from 'lucide-react';
import type { PlazaResourceVO } from '@/api/teacher/resource/resource-plaza';
import { getCategoryStyle } from './resourceVisuals';

export default function ResourcePreviewPanel({ resource }: { resource: PlazaResourceVO }) {
  const [playing, setPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [slide, setSlide] = useState(1);
  const style = getCategoryStyle(resource.categoryId);
  const format = resource.fileFormat.toLowerCase();

  if (format === 'mp4' || format === 'video') {
    return (
      <Box bg="#101828" borderRadius="16px" overflow="hidden" color="white">
        <AspectRatio ratio={16 / 9}>
          <Flex
            position="relative"
            direction="column"
            align="center"
            justify="center"
            bg="radial-gradient(circle at 55% 30%, #344054 0%, #101828 62%)"
          >
            <Box
              position="absolute"
              top={5}
              left={5}
              px={3}
              py={1.5}
              borderRadius="999px"
              bg="blackAlpha.500"
              fontSize="11px"
            >
              校本微课 · {resource.duration || '12:36'}
            </Box>
            <Button
              aria-label={playing ? '暂停视频' : '播放视频'}
              w="72px"
              h="72px"
              p={0}
              borderRadius="50%"
              bg="rgba(255,255,255,.16)"
              color="white"
              backdropFilter="blur(8px)"
              onClick={() => setPlaying((value) => !value)}
              _hover={{ bg: 'rgba(255,255,255,.24)', transform: 'scale(1.05)' }}
            >
              {playing ? (
                <Pause size={28} fill="currentColor" aria-hidden="true" />
              ) : (
                <Play size={30} fill="currentColor" aria-hidden="true" />
              )}
            </Button>
            <Text mt={4} fontSize="14px" fontWeight={600}>
              {playing ? '正在演示故障诊断流程' : '点击播放原型视频'}
            </Text>
            {playing && (
              <Text mt={1} color="whiteAlpha.600" fontSize="12px">
                此处为 Mock 播放效果
              </Text>
            )}
          </Flex>
        </AspectRatio>
        <Flex px={5} py={3} align="center" gap={3}>
          <Volume2 size={16} aria-hidden="true" />
          <Progress
            flex="1"
            value={playing ? 38 : 8}
            size="xs"
            borderRadius="999px"
            colorScheme="red"
            bg="whiteAlpha.300"
          />
          <Text fontSize="11px" color="whiteAlpha.700">
            04:32 / {resource.duration || '12:36'}
          </Text>
        </Flex>
      </Box>
    );
  }

  if (format === 'html' || format === 'interactive') {
    const steps = ['识别系统部件', '观察数据流', '完成故障判断'];
    return (
      <Box
        border="1px solid"
        borderColor="#D0D5DD"
        borderRadius="16px"
        overflow="hidden"
        bg="#F8FAFC"
      >
        <Flex px={5} py={3} bg="#182230" color="white" align="center" justify="space-between">
          <HStack spacing={2}>
            <MousePointerClick size={17} aria-hidden="true" />
            <Text fontSize="13px" fontWeight={700}>
              互动资源预览
            </Text>
          </HStack>
          <Text fontSize="11px" color="whiteAlpha.700">
            步骤 {activeStep + 1} / {steps.length}
          </Text>
        </Flex>
        <Grid
          minH={{ base: '360px', md: '470px' }}
          templateColumns={{ base: '1fr', md: '220px 1fr' }}
        >
          <Stack
            p={4}
            spacing={2}
            bg="white"
            borderRight={{ md: '1px solid #EAECF0' }}
            borderBottom={{ base: '1px solid #EAECF0', md: 'none' }}
          >
            {steps.map((step, index) => (
              <Button
                key={step}
                justifyContent="flex-start"
                h="44px"
                px={3}
                variant="ghost"
                borderRadius="10px"
                bg={activeStep === index ? '#FFF1F0' : 'transparent'}
                color={activeStep === index ? '#B4232D' : '#475467'}
                fontSize="12px"
                leftIcon={
                  activeStep > index ? <CheckCircle2 size={16} aria-hidden="true" /> : undefined
                }
                onClick={() => setActiveStep(index)}
              >
                {index + 1}. {step}
              </Button>
            ))}
          </Stack>
          <Flex
            p={{ base: 5, md: 8 }}
            direction="column"
            align="center"
            justify="center"
            textAlign="center"
          >
            <Flex
              w="92px"
              h="92px"
              borderRadius="26px"
              align="center"
              justify="center"
              bg={style.bg}
              color={style.color}
              boxShadow={`0 18px 42px ${style.glow}`}
            >
              <MousePointerClick size={42} aria-hidden="true" />
            </Flex>
            <Text mt={6} color="#182230" fontSize="20px" fontWeight={800}>
              {steps[activeStep]}
            </Text>
            <Text mt={2} maxW="460px" color="#667085" fontSize="13px" lineHeight="1.8">
              {activeStep === 0 && '点击仿真图中的部件，查看名称、功能和关联知识点。'}
              {activeStep === 1 && '选择不同工况，对比电压、温度、SOC 和故障码的动态变化。'}
              {activeStep === 2 && '根据已给数据选择诊断结论，系统会即时反馈操作路径。'}
            </Text>
            <Button
              mt={6}
              bg="#B4232D"
              color="white"
              borderRadius="10px"
              onClick={() => setActiveStep((value) => (value + 1) % steps.length)}
              _hover={{ bg: '#8F1D26' }}
            >
              完成当前步骤
            </Button>
          </Flex>
        </Grid>
      </Box>
    );
  }

  if (format === 'ppt' || format === 'pptx') {
    return (
      <Box
        border="1px solid"
        borderColor="#D0D5DD"
        borderRadius="16px"
        overflow="hidden"
        bg="#EEF1F5"
      >
        <Flex
          minH={{ base: '360px', md: '480px' }}
          p={{ base: 4, md: 8 }}
          align="center"
          justify="center"
        >
          <Box
            w="100%"
            maxW="720px"
            aspectRatio={16 / 9}
            bg="white"
            borderRadius="8px"
            boxShadow="0 16px 40px rgba(15,23,42,.16)"
            p={{ base: 6, md: 10 }}
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              right="-60px"
              top="-70px"
              w="220px"
              h="220px"
              bg={style.glow}
              opacity={0.55}
              borderRadius="50%"
            />
            <Text position="relative" color={style.color} fontSize="12px" fontWeight={700}>
              教学课件 · {slide}/24
            </Text>
            <Text
              position="relative"
              mt={5}
              maxW="78%"
              color="#182230"
              fontSize={{ base: '22px', md: '34px' }}
              fontWeight={800}
              lineHeight="1.3"
            >
              {resource.title}
            </Text>
            <Box position="relative" mt={7} w="66%" h="8px" bg={style.bg} borderRadius="999px">
              <Box w={`${48 + slide}%`} maxW="90%" h="100%" bg={style.color} borderRadius="999px" />
            </Box>
            <Text
              position="absolute"
              left={{ base: 6, md: 10 }}
              bottom={{ base: 5, md: 8 }}
              color="#667085"
              fontSize="12px"
            >
              {resource.courseName}
            </Text>
          </Box>
        </Flex>
        <Flex
          px={4}
          py={3}
          bg="white"
          borderTop="1px solid"
          borderColor="#D0D5DD"
          justify="center"
          align="center"
          gap={3}
        >
          <Button
            aria-label="上一页幻灯片"
            size="sm"
            variant="ghost"
            isDisabled={slide <= 1}
            onClick={() => setSlide((value) => Math.max(1, value - 1))}
          >
            <ChevronLeft size={18} />
          </Button>
          <Text minW="62px" textAlign="center" color="#475467" fontSize="12px">
            {slide} / 24
          </Text>
          <Button
            aria-label="下一页幻灯片"
            size="sm"
            variant="ghost"
            isDisabled={slide >= 24}
            onClick={() => setSlide((value) => Math.min(24, value + 1))}
          >
            <ChevronRight size={18} />
          </Button>
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      border="1px solid"
      borderColor="#D0D5DD"
      borderRadius="16px"
      overflow="hidden"
      bg="#E9EDF2"
    >
      <Flex
        minH={{ base: '420px', md: '560px' }}
        p={{ base: 4, md: 7 }}
        align="flex-start"
        justify="center"
        overflow="hidden"
      >
        <Box
          w="100%"
          maxW="720px"
          minH="520px"
          bg="white"
          boxShadow="0 14px 34px rgba(15,23,42,.15)"
          px={{ base: 6, md: 12 }}
          py={{ base: 8, md: 11 }}
        >
          <Text color={style.color} fontSize="11px" fontWeight={800} letterSpacing=".08em">
            {resource.categoryName} · 校本资源
          </Text>
          <Text
            mt={4}
            color="#182230"
            fontSize={{ base: '22px', md: '28px' }}
            fontWeight={800}
            lineHeight="1.4"
          >
            {resource.title}
          </Text>
          <Text mt={2} color="#667085" fontSize="12px">
            {resource.courseName} · {resource.uploaderName}
          </Text>
          <Box mt={7} h="1px" bg="#EAECF0" />
          <Stack mt={7} spacing={4} color="#475467" fontSize="13px" lineHeight="2">
            <Text fontWeight={700} color="#344054">
              一、学习目标
            </Text>
            <Text>
              掌握本资源对应的核心知识、标准操作流程和故障分析方法，并能在典型工作情境中完成任务。
            </Text>
            <Text fontWeight={700} color="#344054">
              二、任务要求
            </Text>
            <Text>
              1. 根据操作规范完成课前安全检查；
              <br />
              2. 记录关键数据并识别异常信号；
              <br />
              3. 形成诊断结论与复核记录。
            </Text>
            <Text fontWeight={700} color="#344054">
              三、评价要点
            </Text>
            <Text>按安全规范、操作过程、诊断逻辑和任务成果四个维度进行综合评价。</Text>
          </Stack>
        </Box>
      </Flex>
      <Flex
        px={4}
        py={3}
        bg="white"
        borderTop="1px solid"
        borderColor="#D0D5DD"
        justify="space-between"
        align="center"
      >
        <Text color="#667085" fontSize="11px">
          {format.toUpperCase()} 原型预览
        </Text>
        <Text color="#98A2B3" fontSize="11px">
          第 1 页 / 共 8 页
        </Text>
      </Flex>
    </Box>
  );
}
