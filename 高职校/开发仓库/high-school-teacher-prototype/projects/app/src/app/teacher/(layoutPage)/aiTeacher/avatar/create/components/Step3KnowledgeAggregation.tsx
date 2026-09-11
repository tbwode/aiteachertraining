import {
  Box,
  Checkbox,
  Collapse,
  Flex,
  HStack,
  IconButton,
  Text,
  VStack,
  useDisclosure
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AvatarWizardDraft } from '../../avatarStorage';
import { CARD_SHADOW, PRIMARY_COLOR } from '../constants';
import UploadResourceModal from './Step2TeachingPath/UploadResourceModal';

const getResourceCategories = (t: (key: string) => string) =>
  [
    { key: 'doc', label: t('aiTeacher.avatar.create.step3.resourceCategories.doc'), icon: '📄' },
    {
      key: 'video',
      label: t('aiTeacher.avatar.create.step3.resourceCategories.video'),
      icon: '🎬'
    },
    {
      key: 'image',
      label: t('aiTeacher.avatar.create.step3.resourceCategories.image'),
      icon: '🖼️'
    },
    { key: 'audio', label: t('aiTeacher.avatar.create.step3.resourceCategories.audio'), icon: '🎵' }
  ] as const;

type Step3Props = {
  draft: AvatarWizardDraft;
  isLoadingResources: boolean;
  onToggleResource: (
    resourceId: string,
    resourceInfo?: {
      fileKey: string;
      fileName: string;
      category: string;
      chapterIndex: number;
      sectionIndex: number;
      chapterName: string;
      sectionName: string;
    }
  ) => void;
  onUpdateDraft: (updater: (current: AvatarWizardDraft) => AvatarWizardDraft) => void;
};

// 资源推荐数据结构
type ResourceItem = {
  fileKey: string;
  fileName: string;
  knowledgePoints: string[];
  category?: string; // doc, video, image, audio
};

type SectionData = {
  sectionId: string;
  sectionName: string;
  resources: ResourceItem[];
};

type ChapterData = {
  chapterId: string;
  chapterName: string;
  sections: SectionData[];
};

export function Step3KnowledgeAggregation({
  draft,
  isLoadingResources,
  onToggleResource,
  onUpdateDraft
}: Step3Props) {
  const { t } = useTranslation('teacher');

  const RESOURCE_CATEGORIES = useMemo(() => getResourceCategories(t), [t]);

  // 展开的章节索引（右侧缺失章节列表，默认全部展开）
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // 添加资源弹窗状态
  const {
    isOpen: isAddResourceOpen,
    onOpen: onAddResourceOpen,
    onClose: onAddResourceClose
  } = useDisclosure();
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(-1);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(-1);

  // 解析资源推荐数据
  const resourceData = useMemo<ChapterData[]>(() => {
    if (!draft.resourceRecommendations) {
      return [];
    }

    try {
      const parsed =
        typeof draft.resourceRecommendations === 'string'
          ? JSON.parse(draft.resourceRecommendations)
          : draft.resourceRecommendations;

      const data = parsed?.data || [];

      return data;
    } catch (error) {
      console.error('解析资源推荐数据失败:', error);
      return [];
    }
  }, [draft.resourceRecommendations]);

  // 解析大纲数据
  const syllabusTree = useMemo(() => {
    if (!draft.syllabusTree) {
      return null;
    }
    try {
      return typeof draft.syllabusTree === 'string'
        ? JSON.parse(draft.syllabusTree)
        : draft.syllabusTree;
    } catch {
      return null;
    }
  }, [draft.syllabusTree]);

  // 按章分组的缺失节数据
  type MissingSection = {
    sectionName: string;
    status: string;
    chapterIndex: number;
    sectionIndex: number;
  };

  type MissingChapterGroup = {
    chapterName: string;
    chapterIndex: number;
    sections: MissingSection[];
  };

  const missingChapterGroups = useMemo<MissingChapterGroup[]>(() => {
    if (!draft.matchAnalysisResult?.chapters) {
      return [];
    }

    const groups: MissingChapterGroup[] = [];

    draft.matchAnalysisResult.chapters.forEach((chapter: any, chapterIndex: number) => {
      const sections =
        chapter.sections && Array.isArray(chapter.sections)
          ? chapter.sections
          : [{ section_name: '综合内容', status: chapter.status }];

      const missingSections = sections
        .map((section: any, sectionIndex: number) => ({
          sectionName: section.section_name,
          status: section.status || '未覆盖',
          chapterIndex,
          sectionIndex
        }))
        .filter((s: MissingSection) => s.status !== '已覆盖');

      if (missingSections.length > 0) {
        groups.push({
          chapterName: chapter.chapter_name,
          chapterIndex,
          sections: missingSections
        });
      }
    });

    return groups;
  }, [draft.matchAnalysisResult]);

  // 数据加载后默认全部展开
  useEffect(() => {
    if (missingChapterGroups.length > 0) {
      setExpandedChapters(new Set(missingChapterGroups.map((_, i) => i)));
    }
  }, [missingChapterGroups]);

  // 锚点滚动：节内容区域的 ref
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeSectionKey, setActiveSectionKey] = useState<string>('');

  const scrollToSection = (chapterIndex: number, sectionIndex: number) => {
    const key = `${chapterIndex}-${sectionIndex}`;
    const el = sectionRefs.current.get(key);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSectionKey(key);
    }
  };

  // 切换章节展开
  const toggleChapter = (index: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 获取某节的知识点列表
  const getKnowledgePoints = (chapterName: string, sectionName: string): string[] => {
    if (!syllabusTree?.chapters) {
      return [];
    }
    const chapter = syllabusTree.chapters.find((c: any) => c.chapter_name === chapterName);
    if (!chapter?.sections) {
      return [];
    }
    const section = chapter.sections.find((s: any) => s.section_name === sectionName);
    return section?.topics || [];
  };

  // 按分类分组资源
  const groupResourcesByCategory = (resources: ResourceItem[]) => {
    const groups: Record<string, ResourceItem[]> = {
      doc: [],
      video: [],
      image: [],
      audio: []
    };

    resources.forEach((resource) => {
      const ext = resource.fileName.split('.').pop()?.toLowerCase() || '';
      let category = resource.category;

      if (!category) {
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
          category = 'video';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
          category = 'image';
        } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) {
          category = 'audio';
        } else {
          category = 'doc';
        }
      }

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(resource);
    });

    return groups;
  };

  // 添加资源弹窗章节标题
  const [resourceModalChapterTitle, setResourceModalChapterTitle] = useState('');

  // 打开添加资源弹窗
  const handleOpenAddResource = (chapterIndex: number, sectionIndex: number) => {
    const chapter = draft.matchAnalysisResult?.chapters?.[chapterIndex];
    const section = chapter?.sections?.[sectionIndex];
    if (!section) return;
    const title = `${chapter?.chapter_name || ''}：${section.section_name}`;
    setResourceModalChapterTitle(title);
    setActiveChapterIndex(chapterIndex);
    setActiveSectionIndex(sectionIndex);
    onAddResourceOpen();
  };

  // 确认添加资源
  const handleConfirmAddResource = (
    resources: Array<{
      id: string;
      title: string;
      fileKey?: string;
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
    }>
  ) => {
    if (resources.length === 0 || activeChapterIndex < 0 || activeSectionIndex < 0) {
      return;
    }

    const currentResult = draft.matchAnalysisResult
      ? JSON.parse(JSON.stringify(draft.matchAnalysisResult))
      : null;
    if (!currentResult?.chapters) {
      return;
    }

    const chapter = currentResult.chapters[activeChapterIndex];
    const section = chapter?.sections?.[activeSectionIndex];
    if (!section) {
      return;
    }

    // 初始化 covered_files
    if (!section.covered_files) {
      section.covered_files = [];
    }

    // 添加资源
    // AI主讲课和数字课件 fileKey 为 null，文件路径传给 fileUrl；其他类型传递 fileKey
    resources.forEach((res) => {
      const hasFileKey = res.fileKey !== null && res.fileKey !== undefined;
      section.covered_files.push({
        fileName: res.fileName || res.title,
        fileUrl: hasFileKey ? res.fileUrl || '' : res.fileUrl || '',
        fileKey: hasFileKey ? res.fileKey : null,
        fileType: res.fileType || 'other'
      });
    });

    // 更新状态
    if (section.status === '未覆盖') {
      section.status = '部分覆盖';
    }

    onUpdateDraft((current) => ({
      ...current,
      matchAnalysisResult: currentResult,
      updatedAt: new Date().toISOString()
    }));
  };

  // 删除已添加的资源
  const handleRemoveAddedResource = (
    chapterIndex: number,
    sectionIndex: number,
    fileIndex: number
  ) => {
    const currentResult = draft.matchAnalysisResult
      ? JSON.parse(JSON.stringify(draft.matchAnalysisResult))
      : null;
    if (!currentResult?.chapters) {
      return;
    }

    const section = currentResult.chapters[chapterIndex]?.sections?.[sectionIndex];
    if (!section?.covered_files) {
      return;
    }

    // 获取要删除的文件信息，用于后续取消勾选
    const removedFile = section.covered_files[fileIndex];

    section.covered_files = section.covered_files.filter(
      (_: any, idx: number) => idx !== fileIndex
    );

    // 如果删完了，恢复状态
    if (section.covered_files.length === 0 && section.status === '部分覆盖') {
      section.status = '未覆盖';
    }

    // 同步取消对应的推荐资源勾选
    const removedFileKey = removedFile?.fileKey;
    const removedChapterName = currentResult.chapters[chapterIndex]?.chapter_name;
    const removedSectionName =
      currentResult.chapters[chapterIndex]?.sections?.[sectionIndex]?.section_name;

    const nextSelectedResourceIds = removedFileKey
      ? draft.selectedResourceIds.filter((id) => {
          const parts = id.split('-');
          const idChapterIndex = parseInt(parts[0], 10);
          const idSectionIndex = parseInt(parts[1], 10);
          const idFileKey = parts[2];
          return !(
            idChapterIndex === chapterIndex &&
            idSectionIndex === sectionIndex &&
            idFileKey === removedFileKey
          );
        })
      : draft.selectedResourceIds;

    const nextSelectedRecommendedResources = removedFileKey && removedChapterName && removedSectionName
      ? (draft.selectedRecommendedResources || []).filter(
          (r) =>
            !(
              r.chapterName === removedChapterName &&
              r.sectionName === removedSectionName &&
              r.fileKey === removedFileKey
            )
        )
      : draft.selectedRecommendedResources;

    onUpdateDraft((current) => ({
      ...current,
      matchAnalysisResult: currentResult,
      selectedResourceIds: nextSelectedResourceIds,
      selectedRecommendedResources: nextSelectedRecommendedResources,
      updatedAt: new Date().toISOString()
    }));
  };

  // 获取某章节某节的已添加资源（从matchAnalysisResult + 已勾选推荐资源）
  const getAddedResources = (chapterIndex: number, sectionIndex: number) => {
    const chapter = draft.matchAnalysisResult?.chapters?.[chapterIndex];
    const section = chapter?.sections?.[sectionIndex];
    const coveredFiles = (section as any)?.covered_files || [];
    // 合并已勾选的推荐资源
    const selectedResources =
      draft.selectedRecommendedResources?.filter(
        (r) => r.chapterIndex === chapterIndex && r.sectionIndex === sectionIndex
      ) || [];
    return [
      ...coveredFiles,
      ...selectedResources.map((r) => ({ fileName: r.fileName, fileKey: r.fileKey }))
    ];
  };

  // 获取某章节某节的推荐资源（从resourceRecommendations）
  // 显示前按「完整文件名」去重：只要归一化后的文件名相同即视为重复（即便 fileKey 不同），只保留第一个。
  // 归一化会清除零宽字符、统一全角空格/字母数字、合并空白并转小写，避免隐藏字符差异导致同名资源未被去重。
  const getRecommendedResources = (chapterIndex: number, sectionIndex: number): ResourceItem[] => {
    const chapter = resourceData[chapterIndex];
    const section = chapter?.sections[sectionIndex];
    const resources = section?.resources || [];

    // 归一化文件名：清除零宽字符 → 全角转半角 → 合并空白 → 去首尾空格 → 转小写
    const normalizeFileName = (raw: string) => {
      return raw
        .replace(/[​-‍﻿]/g, '') // 移除零宽空格等不可见字符
        .normalize('NFKC') // 全角字符（空格/字母/数字/括号）归一化为半角
        .replace(/\s+/g, ' ') // 合并连续空白为单个空格
        .trim()
        .toLowerCase();
    };

    const seen = new Set<string>();
    return resources.filter((resource) => {
      const dedupKey = normalizeFileName(resource.fileName || '');
      if (seen.has(dedupKey)) {
        return false;
      }
      seen.add(dedupKey);
      return true;
    });
  };

  if (!draft.analysisCompleted) {
    return (
      <Box bg="white" borderRadius="20px" p={{ base: 5, md: 8 }} boxShadow={CARD_SHADOW}>
        <Text fontSize="lg" fontWeight={600} color="gray.800" mb={6}>
          {t('aiTeacher.avatar.create.step3.title')}
        </Text>
        <Box textAlign="center" py={12}>
          <Text fontSize="sm" color="gray.500">
            {t('aiTeacher.avatar.create.step3.analysisRequired')}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      borderRadius="20px"
      boxShadow={CARD_SHADOW}
      position="relative"
      overflow="hidden"
    >
      <Flex align="stretch">
        {/* 左侧缺失章节目录导航 */}
        <Box
          w="320px"
          flexShrink={0}
          borderRight="1px solid"
          borderColor="gray.200"
          overflowY="auto"
          maxH="calc(100vh - 240px)"
        >
          <Flex
            align="center"
            justify="space-between"
            p={4}
            borderBottom="1px solid"
            borderColor="gray.200"
          >
            <Text fontWeight={600} color="gray.800">
              缺失章节
            </Text>
          </Flex>
          <Box p={2}>
            <VStack align="stretch" spacing={1}>
              {missingChapterGroups.map((group, groupIndex) => {
                const isExpanded = expandedChapters.has(groupIndex);
                return (
                  <Box key={groupIndex}>
                    <Flex
                      align="center"
                      gap={2}
                      p={2}
                      borderRadius="lg"
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      role="group"
                      onClick={() => {
                        toggleChapter(groupIndex);
                        const firstSection = group.sections[0];
                        if (firstSection) {
                          scrollToSection(firstSection.chapterIndex, firstSection.sectionIndex);
                        }
                      }}
                    >
                      <ChevronRightIcon
                        w={4}
                        h={4}
                        color="gray.400"
                        transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
                        transition="transform 0.2s"
                      />
                      <Box
                        as="span"
                        fontSize="sm"
                        color={isExpanded ? PRIMARY_COLOR : 'gray.400'}
                      >
                        {isExpanded ? '📂' : '📁'}
                      </Box>
                      <Text fontSize="sm" color="gray.700" flex="1" noOfLines={1}>
                        {group.chapterName}
                      </Text>
                      <Box
                        as="span"
                        fontSize="xs"
                        bg={isExpanded ? 'rgba(200,62,62,0.1)' : 'gray.100'}
                        color={isExpanded ? PRIMARY_COLOR : 'gray.500'}
                        px={1.5}
                        py={0.5}
                        borderRadius="md"
                      >
                        {group.sections.length}
                      </Box>
                    </Flex>
                    <Collapse in={isExpanded} animateOpacity>
                      <VStack pl={8} spacing={0} align="stretch">
                        {group.sections.map((section) => {
                          const key = `${section.chapterIndex}-${section.sectionIndex}`;
                          const isActive = activeSectionKey === key;
                          return (
                            <Flex
                              key={key}
                              align="center"
                              gap={2}
                              p={2}
                              borderRadius="lg"
                              cursor="pointer"
                              bg={isActive ? '#FEF2F2' : 'transparent'}
                              borderLeft={
                                isActive
                                  ? `3px solid ${PRIMARY_COLOR}`
                                  : '3px solid transparent'
                              }
                              _hover={{ bg: '#F0F7FF' }}
                              onClick={() =>
                                scrollToSection(section.chapterIndex, section.sectionIndex)
                              }
                            >
                              <Box as="span" fontSize="sm" color="gray.400">
                                📄
                              </Box>
                              <Text fontSize="sm" color="gray.700" flex="1" noOfLines={1}>
                                {section.sectionName}
                              </Text>
                            </Flex>
                          );
                        })}
                      </VStack>
                    </Collapse>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        </Box>

        {/* 右侧内容 */}
        <Box flex={1} overflowY="auto" maxH="calc(100vh - 240px)">
          {/* 标题区 */}
          <Box px={8} pt={6} pb={4}>
        <HStack spacing={2} mb={1}>
          <Box w="4px" h="16px" borderRadius="2px" bg={PRIMARY_COLOR} />
          <Text fontSize="lg" fontWeight={600} color="gray.800">
            {t('aiTeacher.avatar.create.step3.resourceMatch')}
          </Text>
        </HStack>
        <Text fontSize="16px" fontWeight={500} color="#1D2129" lineHeight="22px" mt="14px">
          {t('aiTeacher.avatar.create.step3.coursewareMatch')}
        </Text>
      </Box>

      {/* 缺失章节统计 */}
      <Box px={8} pb={4}>
        <Box w="full" px={3} py={1} border="1px solid" borderColor="#F2F3F5" borderRadius="8px">
          <Text fontSize="14px" color="#1D2129" lineHeight="22px">
            {t('aiTeacher.avatar.create.step3.missingCount', {
              count: missingChapterGroups.reduce((sum, g) => sum + g.sections.length, 0)
            })}
          </Text>
        </Box>
      </Box>

      {/* 缺失章节列表 */}
      <Box px={8} pb={8}>
        <VStack align="stretch" spacing={4}>
          {missingChapterGroups.map((chapterGroup, chapterGroupIndex) => {
            const isExpanded = expandedChapters.has(chapterGroupIndex);

            return (
              <Box
                key={chapterGroupIndex}
                border="1px solid"
                borderColor="#F2F3F5"
                borderRadius="12px"
                overflow="hidden"
              >
                {/* 章标题行 */}
                <Flex
                  align="center"
                  justify="space-between"
                  py={3}
                  px={4}
                  cursor="pointer"
                  _hover={{ bg: '#FAFAFA' }}
                  onClick={() => toggleChapter(chapterGroupIndex)}
                >
                  <HStack spacing={2}>
                    {/* 章节图标 */}
                    <Box w="24px" h="24px" flexShrink={0}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 36 36"
                        fill="none"
                      >
                        <circle
                          cx="18"
                          cy="18"
                          r="18"
                          fill="url(#paint0_linear_1628_13324)"
                          fillOpacity="0.1"
                        />
                        <path
                          d="M16.5872 25.9761H12.5991C11.4978 25.9761 10.605 25.0833 10.605 23.982L10.6051 12.0175C10.6051 10.9162 11.4978 10.0234 12.5991 10.0234H21.5728C22.6741 10.0234 23.5669 10.9162 23.5669 12.0175V17.5013M19.5787 23.1512L21.4066 24.9791L25.3948 20.9908M14.0949 14.0116H20.0772M14.0949 17.0027H17.5846"
                          stroke="url(#paint1_linear_1628_13324)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <defs>
                          <linearGradient
                            id="paint0_linear_1628_13324"
                            x1="18"
                            y1="0"
                            x2="18"
                            y2="36"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#FF4D4D" />
                            <stop offset="1" stopColor="#FFA34D" />
                          </linearGradient>
                          <linearGradient
                            id="paint1_linear_1628_13324"
                            x1="17.9999"
                            y1="10.0234"
                            x2="17.9999"
                            y2="25.9761"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stopColor="#FF4D4D" />
                            <stop offset="1" stopColor="#FFA94D" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </Box>
                    <Text fontSize="14px" fontWeight={500} color="#333333">
                      {chapterGroup.chapterName}
                    </Text>
                  </HStack>
                </Flex>

                {/* 展开内容：该章下所有缺失的节 */}
                <Collapse in={isExpanded} animateOpacity>
                  <Box pt={2} pb={4} px={4}>
                    <VStack align="stretch" spacing={4}>
                      {chapterGroup.sections.map((section) => {
                        const knowledgePoints = getKnowledgePoints(
                          chapterGroup.chapterName,
                          section.sectionName
                        );
                        const recommendedResources = getRecommendedResources(
                          section.chapterIndex,
                          section.sectionIndex
                        );
                        const addedResources = getAddedResources(
                          section.chapterIndex,
                          section.sectionIndex
                        );
                        const hasAddedResources = addedResources.length > 0;
                        const resourceGroups = groupResourcesByCategory(recommendedResources);

                        return (
                          <Box
                            key={`${section.chapterIndex}-${section.sectionIndex}`}
                            ref={(el) => {
                              if (el) {
                                sectionRefs.current.set(
                                  `${section.chapterIndex}-${section.sectionIndex}`,
                                  el
                                );
                              }
                            }}
                            p={3}
                            border="1px solid"
                            borderColor="#F2F3F5"
                            borderRadius="12px"
                          >
                            {/* 节标题 */}
                            <Flex align="center" justify="space-between" gap={2} mb={3}>
                              <HStack spacing={2}>
                                <Box w="5px" h="5px" borderRadius="full" bg={PRIMARY_COLOR} />
                                <Text fontSize="13px" color="#4E5969">
                                  {section.sectionName}
                                </Text>
                              </HStack>
                              <HStack spacing={2}>
                                <Box px={2} py={0.5} bg="rgba(213, 73, 65, 0.1)" borderRadius="4px">
                                  <Text fontSize="12px" color="#D54941" fontWeight={500}>
                                    {t('aiTeacher.avatar.create.step3.status.missing')}
                                  </Text>
                                </Box>
                                <Flex
                                  align="center"
                                  gap={1}
                                  px={2}
                                  py={0.5}
                                  border="1px solid"
                                  borderColor={PRIMARY_COLOR}
                                  borderRadius="4px"
                                  color={PRIMARY_COLOR}
                                  cursor="pointer"
                                  _hover={{ bg: 'rgba(200,62,62,0.04)' }}
                                  onClick={() =>
                                    handleOpenAddResource(
                                      section.chapterIndex,
                                      section.sectionIndex
                                    )
                                  }
                                >
                                  <Text fontSize="12px" lineHeight="1">+</Text>
                                  <Text fontSize="12px">
                                    {t('aiTeacher.avatar.create.step3.addFromWorkspace')}
                                  </Text>
                                </Flex>
                              </HStack>
                            </Flex>

                            {/* 已添加资源标签 */}
                            {hasAddedResources && (
                              <HStack
                                spacing={1}
                                color="#2BA471"
                                mb={3}
                                px={2}
                                py={1}
                                bg="rgba(43, 164, 113, 0.08)"
                                borderRadius="4px"
                                w="fit-content"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 14 14"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M7 0.5C3.41015 0.5 0.5 3.41015 0.5 7C0.5 10.5899 3.41015 13.5 7 13.5C10.5899 13.5 13.5 10.5899 13.5 7C13.5 3.41015 10.5899 0.5 7 0.5ZM10.1464 5.64645L6.14645 9.64645C5.95118 9.84171 5.63466 9.84171 5.43934 9.64645L3.85355 8.06066C3.65829 7.8654 3.65829 7.54888 3.85355 7.35355C4.04882 7.15829 4.3654 7.15829 4.56066 7.35355L5.79289 8.58579L9.43934 4.93934C9.6346 4.74408 9.95118 4.74408 10.1464 4.93934C10.3417 5.1346 10.3417 5.45118 10.1464 5.64645Z"
                                    fill="#2BA471"
                                  />
                                </svg>
                                <Text fontSize="12px">
                                  {t('aiTeacher.avatar.create.step3.addedResources')}
                                </Text>
                              </HStack>
                            )}

                            {/* 已添加的资源（含已勾选推荐资源） */}
                            {hasAddedResources && (
                              <VStack align="stretch" spacing={2} mb={4}>
                                {addedResources.map((file: any, fileIndex: number) => {
                                  // 判断是否为已勾选推荐资源（有 fileKey 且匹配 selectedRecommendedResources）
                                  const isSelectedResource =
                                    draft.selectedRecommendedResources?.some(
                                      (r) =>
                                        r.chapterIndex === section.chapterIndex &&
                                        r.sectionIndex === section.sectionIndex &&
                                        r.fileKey === file.fileKey
                                    ) ?? false;
                                  return (
                                    <Flex
                                      key={fileIndex}
                                      align="center"
                                      justify="space-between"
                                      py={2}
                                      px={3}
                                      bg="#F7F8FA"
                                      borderRadius="8px"
                                    >
                                      <HStack spacing={2}>
                                        <Flex
                                          w="20px"
                                          h="20px"
                                          borderRadius="4px"
                                          bg="#4A90E2"
                                          align="center"
                                          justify="center"
                                          flexShrink={0}
                                        >
                                          <Text fontSize="10px" color="white">
                                            📄
                                          </Text>
                                        </Flex>
                                        <Text fontSize="13px" color="#4E5969" noOfLines={1}>
                                          {file.fileName}
                                        </Text>
                                      </HStack>
                                      <IconButton
                                        aria-label="delete"
                                        icon={
                                          <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                          >
                                            <path
                                              d="M4 4L12 12M12 4L4 12"
                                              stroke="#86909C"
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                            />
                                          </svg>
                                        }
                                        size="xs"
                                        variant="ghost"
                                        color="gray.400"
                                        minW="20px"
                                        h="20px"
                                        _hover={{ color: 'red.500' }}
                                        onClick={() => {
                                          if (isSelectedResource) {
                                            // 删除已勾选推荐资源：找到正确的 resourceId 并取消勾选
                                            const matchedId = draft.selectedResourceIds.find(
                                              (id) => {
                                                const parts = id.split('-');
                                                return (
                                                  parseInt(parts[0], 10) === section.chapterIndex &&
                                                  parseInt(parts[1], 10) === section.sectionIndex &&
                                                  parts[2] === file.fileKey
                                                );
                                              }
                                            );
                                            if (matchedId) {
                                              onToggleResource(matchedId, {
                                                fileKey: file.fileKey,
                                                fileName: file.fileName,
                                                category: 'doc',
                                                chapterIndex: section.chapterIndex,
                                                sectionIndex: section.sectionIndex,
                                                chapterName: chapterGroup.chapterName,
                                                sectionName: section.sectionName
                                              });
                                            }
                                          } else {
                                            // 删除 Step2 添加的课件资源
                                            handleRemoveAddedResource(
                                              section.chapterIndex,
                                              section.sectionIndex,
                                              fileIndex
                                            );
                                          }
                                        }}
                                      />
                                    </Flex>
                                  );
                                })}
                              </VStack>
                            )}

                            {/* 推荐资源按分类展示 */}
                            <VStack align="stretch" spacing={4}>
                              {RESOURCE_CATEGORIES.map((category) => {
                                const categoryResources = resourceGroups[category.key] || [];
                                const hasResources = categoryResources.length > 0;

                                if (!hasResources) {
                                  return null;
                                }

                                return (
                                  <Box key={category.key}>
                                    <Text fontSize="13px" fontWeight={500} color="#333333" mb={2}>
                                      {category.label}
                                    </Text>
                                    <VStack align="stretch" spacing={2}>
                                      {categoryResources.map((resource, resourceIndex) => {
                                        const resourceId = `${section.chapterIndex}-${section.sectionIndex}-${resource.fileKey}-${resourceIndex}`;
                                        const isSelected =
                                          draft.selectedResourceIds.includes(resourceId);

                                        return (
                                          <Flex
                                            key={resourceId}
                                            align="center"
                                            gap={2}
                                            p={2}
                                            bg="#F7F8FA"
                                            borderRadius="8px"
                                            cursor="pointer"
                                            _hover={{ bg: '#F2F3F5' }}
                                            onClick={() =>
                                              onToggleResource(resourceId, {
                                                fileKey: resource.fileKey,
                                                fileName: resource.fileName,
                                                category: category.key,
                                                chapterIndex: section.chapterIndex,
                                                sectionIndex: section.sectionIndex,
                                                chapterName: chapterGroup.chapterName,
                                                sectionName: section.sectionName
                                              })
                                            }
                                          >
                                            <Box
                                              onClick={(e) => e.stopPropagation()}
                                              display="flex"
                                              alignItems="center"
                                            >
                                              <Checkbox
                                                isChecked={isSelected}
                                                colorScheme="red"
                                                iconColor="white"
                                                sx={{
                                                  '& .chakra-checkbox__control': {
                                                    bg: isSelected
                                                      ? '#c8000b !important'
                                                      : 'transparent',
                                                    borderColor: isSelected
                                                      ? '#c8000b !important'
                                                      : '#C9CDD4'
                                                  }
                                                }}
                                                onChange={() =>
                                                  onToggleResource(resourceId, {
                                                    fileKey: resource.fileKey,
                                                    fileName: resource.fileName,
                                                    category: category.key,
                                                    chapterIndex: section.chapterIndex,
                                                    sectionIndex: section.sectionIndex,
                                                    chapterName: chapterGroup.chapterName,
                                                    sectionName: section.sectionName
                                                  })
                                                }
                                              />
                                            </Box>
                                            <Flex
                                              w="20px"
                                              h="20px"
                                              borderRadius="4px"
                                              bg="#E8F0FE"
                                              align="center"
                                              justify="center"
                                              flexShrink={0}
                                            >
                                              <Text fontSize="10px">{category.icon}</Text>
                                            </Flex>
                                            <Text
                                              fontSize="13px"
                                              color="#4E5969"
                                              flex="1"
                                              noOfLines={1}
                                            >
                                              {resource.fileName}
                                            </Text>
                                          </Flex>
                                        );
                                      })}
                                    </VStack>
                                  </Box>
                                );
                              })}
                            </VStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                </Collapse>
              </Box>
            );
          })}

          {missingChapterGroups.length === 0 && (
            <Box p={6} bg="green.50" borderRadius="lg" textAlign="center">
              <Text fontSize="sm" color="green.700">
                {t('aiTeacher.avatar.create.step3.allCoveredShort')}
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      {/* 添加资源弹窗 */}
      <UploadResourceModal
        isOpen={isAddResourceOpen}
        onClose={onAddResourceClose}
        onConfirm={handleConfirmAddResource}
        chapterTitle={resourceModalChapterTitle}
      />

      {/* 加载中遮罩 */}
      {isLoadingResources && (
        <Flex
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(255, 255, 255, 0.95)"
          backdropFilter="blur(4px)"
          align="center"
          justify="center"
          zIndex={1000}
          direction="column"
        >
          <Box
            as="span"
            display="inline-block"
            w="56px"
            h="56px"
            border="4px solid"
            borderColor="#FFE0E0"
            borderTopColor="#C8000B"
            borderRadius="full"
            animation="spin 1s linear infinite"
            mb={4}
            sx={{
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
          <Text fontSize="lg" fontWeight={600} color="gray.800" mb={2}>
            {t('aiTeacher.avatar.create.step3.resources.analyzing')}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {t('aiTeacher.avatar.create.step3.resources.analyzingDesc')}
          </Text>
        </Flex>
      )}
    </Box>
  </Flex>
</Box>
  );
}
