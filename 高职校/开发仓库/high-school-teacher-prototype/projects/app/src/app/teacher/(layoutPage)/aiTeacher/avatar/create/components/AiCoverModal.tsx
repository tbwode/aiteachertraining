'use client';

import { CloseIcon } from '@chakra-ui/icons';
import { keyframes } from '@emotion/react';
import { Box, Button, Flex, HStack, Input, Text, useToast } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PRIMARY_COLOR } from '../constants';
import { generateCourseCover } from '@/teacher/api/aiCover';
import { uploadFileByUrl } from '@/teacher/api/file';

type StyleOption = {
  id: string;
  label: string;
  image: string;
};

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'modern',
    label: '现代感',
    image: '/imgs/ai-cover-styles/modern.png'
  },
  {
    id: 'tech',
    label: '科技感',
    image: '/imgs/ai-cover-styles/tech.png'
  },
  {
    id: 'nature',
    label: '自然',
    image: '/imgs/ai-cover-styles/nature.png'
  },
  {
    id: 'minimal',
    label: '简约',
    image: '/imgs/ai-cover-styles/minimal.png'
  }
];

type CoverOption = {
  id: string;
  label: string;
  image: string;
};

type AiCoverModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseName?: string;
  onSelectCover?: (coverUrl: string) => void;
};

export function AiCoverModal({
  isOpen,
  onClose,
  defaultCourseName = '',
  onSelectCover
}: AiCoverModalProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const [courseName, setCourseName] = useState(defaultCourseName);
  const [theme, setTheme] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverSlots, setCoverSlots] = useState<(CoverOption | null)[] | null>(null);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCourseName(defaultCourseName);
      setTheme('');
      setSelectedStyle('modern');
      setIsGenerating(false);
      setCoverSlots(null);
      setSelectedCoverId(null);
      abortControllerRef.current = new AbortController();
    } else {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    }
  }, [isOpen, defaultCourseName]);

  const handleGenerate = async () => {
    if (!courseName.trim()) {
      toast({
        title: t('aiTeacher.avatar.create.aiCoverModal.validation.courseNameRequired'),
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setIsGenerating(true);
    setCoverSlots([null, null, null, null]);
    setSelectedCoverId(null);

    const selectedStyleLabel = STYLE_OPTIONS.find((s) => s.id === selectedStyle)?.label ?? '现代感';

    const styleConfigs = Array.from({ length: 4 }, (_, i) => ({
      id: `cover-${i + 1}`,
      label: t(`aiTeacher.avatar.create.aiCoverModal.cover${i + 1}`),
      styleLabel: selectedStyleLabel
    }));

    const controller = abortControllerRef.current ?? undefined;

    const requestOne = async (
      cfg: (typeof styleConfigs)[number],
      index: number
    ): Promise<CoverOption | null> => {
      if (controller?.signal.aborted) return null;
      try {
        const imageUrl = await generateCourseCover(
          {
            courseName,
            courseTheme: theme || courseName,
            styleType: cfg.styleLabel
          },
          controller
        );
        const cover = { id: cfg.id, label: cfg.label, image: imageUrl };
        setCoverSlots((prev) => {
          if (!prev) return prev;
          const next = [...prev];
          next[index] = cover;
          return next;
        });
        return cover;
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
          return null;
        }
        console.error(`[AiCover] 风格 "${cfg.styleLabel}" 生成失败:`, err);
        const fallback = STYLE_OPTIONS.find((s) => s.label === cfg.styleLabel)?.image || '';
        const cover = { id: cfg.id, label: cfg.label, image: fallback };
        setCoverSlots((prev) => {
          if (!prev) return prev;
          const next = [...prev];
          next[index] = cover;
          return next;
        });
        return cover;
      }
    };

    try {
      const results = await Promise.all(styleConfigs.map((cfg, i) => requestOne(cfg, i)));
      const hasAny = results.some((r) => r !== null);
      if (!hasAny) {
        // 全部被取消
        setIsGenerating(false);
        setCoverSlots(null);
        return;
      }
      // 自动选中第一个成功的
      const firstSuccess = results.find((r) => r !== null);
      if (firstSuccess) {
        setSelectedCoverId(firstSuccess.id);
      }
      setIsGenerating(false);
    } catch (err) {
      setIsGenerating(false);
      setCoverSlots(null);
      toast({
        title: t('aiTeacher.avatar.create.aiCoverModal.generateFailed'),
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const handleSelectCover = async () => {
    const selected = coverSlots?.find((c) => c !== null && c.id === selectedCoverId);
    if (!selected || !onSelectCover) return;

    try {
      const result = await uploadFileByUrl(selected.image);
      onSelectCover(result.fileUrl);
      toast({
        title: t('aiTeacher.avatar.create.aiCoverModal.coverApplied'),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      onClose();
    } catch {
      toast({
        title: t('aiTeacher.avatar.create.aiCoverModal.generateFailed'),
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  const hasAnyCover = coverSlots?.some((c) => c !== null) ?? false;

  if (!isOpen) {
    return null;
  }

  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.600"
      zIndex={1400}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Box
        bg="white"
        borderRadius="24px"
        boxShadow="xl"
        w="full"
        maxW="496px"
        maxH="90vh"
        position="relative"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        {/* 标题栏 */}
        <Flex
          justify="space-between"
          align="center"
          h="64px"
          minH="64px"
          px="32px"
          py="16px"
          borderBottom="1px solid"
          borderColor="#e7e7e7"
        >
          <Text fontSize="16px" fontWeight={600} color="#333">
            {t('aiTeacher.avatar.create.aiCoverModal.title')}
          </Text>
          <Flex
            as="button"
            aria-label={t('aiTeacher.avatar.create.closeConfirm.cancel')}
            w="22px"
            h="22px"
            align="center"
            justify="center"
            cursor="pointer"
            color="gray.400"
            _hover={{ color: 'gray.600' }}
            onClick={onClose}
          >
            <CloseIcon boxSize="14px" />
          </Flex>
        </Flex>

        {/* 内容区域 */}
        <Flex direction="column" gap="20px" p="22px" pt="20px" flex={1} overflowY="auto">
          {/* 课程名称 */}
          <Box>
            <Text fontSize="14px" fontWeight={500} color="#333" mb="8px">
              {t('aiTeacher.avatar.create.aiCoverModal.courseNameLabel')}
            </Text>
            <Input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder={t('aiTeacher.avatar.create.aiCoverModal.courseNamePlaceholder')}
              h="46px"
              bg="white"
              borderColor="#e7e7e7"
              borderRadius="8px"
              fontSize="14px"
              color="#333"
              _focus={{ borderColor: PRIMARY_COLOR, boxShadow: `0 0 0 1px ${PRIMARY_COLOR}` }}
            />
          </Box>

          {/* 课程主题/风格 */}
          <Box>
            <Text fontSize="14px" fontWeight={500} color="#333" mb="8px">
              {t('aiTeacher.avatar.create.aiCoverModal.themeLabel')}
            </Text>
            <Input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder={t('aiTeacher.avatar.create.aiCoverModal.themePlaceholder')}
              h="46px"
              borderColor="#e7e7e7"
              borderRadius="8px"
              fontSize="14px"
              isDisabled={isGenerating}
              _focus={{ borderColor: PRIMARY_COLOR, boxShadow: `0 0 0 1px ${PRIMARY_COLOR}` }}
            />
          </Box>

          {/* 选择风格 */}
          <Box>
            <Text fontSize="14px" fontWeight={500} color="#333" mb="8px">
              {t('aiTeacher.avatar.create.aiCoverModal.styleLabel')}
            </Text>
            <HStack spacing="12px" justify="flex-start">
              {STYLE_OPTIONS.map((style) => (
                <Box
                  key={style.id}
                  position="relative"
                  w="104px"
                  h="104px"
                  borderRadius="16px"
                  overflow="hidden"
                  cursor={isGenerating ? 'not-allowed' : 'pointer'}
                  border="2px solid"
                  borderColor={selectedStyle === style.id ? '#C8000B' : 'transparent'}
                  opacity={isGenerating ? 0.5 : 1}
                  onClick={() => {
                    if (!isGenerating) setSelectedStyle(style.id);
                  }}
                  _hover={isGenerating ? {} : { opacity: 0.9 }}
                >
                  <Box
                    w="full"
                    h="full"
                    bgImage={`url(${style.image})`}
                    bgSize="cover"
                    bgPosition="center"
                  />
                  {/* 底部渐变遮罩 */}
                  <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    h="37px"
                    bg="linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))"
                  />
                  {/* 文字标签 */}
                  <Text
                    position="absolute"
                    bottom="6px"
                    left={0}
                    right={0}
                    textAlign="center"
                    color="white"
                    fontSize="14px"
                    fontWeight={400}
                  >
                    {style.label}
                  </Text>
                </Box>
              ))}
            </HStack>
          </Box>

          {/* 生成结果 / 占位 */}
          {coverSlots && (
            <Box>
              <Text fontSize="14px" fontWeight={500} color="#333" mb="8px">
                {t('aiTeacher.avatar.create.aiCoverModal.selectCover')}
              </Text>
              <Flex wrap="wrap" gap="12px">
                {coverSlots.map((cover, idx) => (
                  <Box
                    key={cover ? cover.id : `slot-${idx}`}
                    w="calc(50% - 6px)"
                    borderRadius="14px"
                    overflow="hidden"
                    cursor={cover ? 'pointer' : 'default'}
                    border="2px solid"
                    borderColor={selectedCoverId === cover?.id ? '#C8000B' : '#f2f3f5'}
                    bg="white"
                    onClick={() => cover && setSelectedCoverId(cover.id)}
                    _hover={cover ? { opacity: 0.9 } : {}}
                  >
                    {cover ? (
                      <>
                        <Box as="img" src={cover.image} w="full" h="99px" objectFit="cover" />
                        <Flex align="center" justify="center" h="44px">
                          <Text fontSize="14px" color="#333">
                            {cover.label}
                          </Text>
                        </Flex>
                      </>
                    ) : (
                      <Box h="143px" position="relative" overflow="hidden" bg="#f2f3f5">
                        <Box
                          position="absolute"
                          inset={0}
                          bg="linear-gradient(90deg, #f2f3f5 25%, #e7e7e7 50%, #f2f3f5 75%)"
                          bgSize="200% 100%"
                          animation={`${shimmer} 1.5s ease-in-out infinite`}
                        />
                        {/* 骨架屏模拟结构 */}
                        <Flex position="relative" direction="column" h="full" p="8px" gap="8px">
                          {/* 图片区域骨架 */}
                          <Box flex={1} bg="whiteAlpha.600" borderRadius="6px" />
                          {/* 文字区域骨架 */}
                          <Flex justify="center" align="center" h="36px">
                            <Box w="48px" h="12px" bg="whiteAlpha.600" borderRadius="4px" />
                          </Flex>
                        </Flex>
                      </Box>
                    )}
                  </Box>
                ))}
              </Flex>
            </Box>
          )}
        </Flex>

        {/* 底部按钮 */}
        <Flex justify="flex-end" gap="8px" px="22px" pb="22px" minH="60px" flexShrink={0}>
          <Button
            variant="outline"
            borderColor="#f2f3f5"
            color="#333"
            borderRadius="12px"
            px="20px"
            py="7px"
            fontSize="14px"
            fontWeight={400}
            _hover={{ bg: 'gray.50' }}
            onClick={onClose}
          >
            {t('aiTeacher.avatar.create.aiCoverModal.cancel')}
          </Button>
          {hasAnyCover ? (
            <Button
              bg={PRIMARY_COLOR}
              color="white"
              borderRadius="12px"
              px="20px"
              py="7px"
              fontSize="14px"
              fontWeight={400}
              _hover={{ bg: '#b03030' }}
              onClick={handleSelectCover}
            >
              {t('aiTeacher.avatar.create.aiCoverModal.useCover')}
            </Button>
          ) : (
            <Button
              bg={PRIMARY_COLOR}
              color="white"
              borderRadius="12px"
              px="20px"
              py="7px"
              fontSize="14px"
              fontWeight={400}
              _hover={{ bg: '#b03030' }}
              onClick={handleGenerate}
              isDisabled={isGenerating}
              leftIcon={
                isGenerating ? (
                  <Box
                    as="svg"
                    viewBox="0 0 24 24"
                    w="16px"
                    h="16px"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    animation={`${spin} 1s linear infinite`}
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </Box>
                ) : undefined
              }
            >
              {isGenerating
                ? t('aiTeacher.avatar.create.aiCoverModal.generating')
                : t('aiTeacher.avatar.create.aiCoverModal.generate')}
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
