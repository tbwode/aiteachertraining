import { CheckIcon, ChevronDownIcon, ChevronRightIcon, RepeatIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Collapse,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
  Tooltip,
  VStack,
  useDisclosure
} from '@chakra-ui/react';
import type { RefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { AvatarWizardDraft } from '../../avatarStorage';
import { CARD_SHADOW, MAX_COURSEWARE_FILES, PRIMARY_COLOR } from '../constants';
import UploadResourceModal from './Step2TeachingPath/UploadResourceModal';
import EditChapterModal, {
  type EditModalType,
  type EditModalMode,
  type OpenMode
} from './Step2TeachingPath/EditChapterModal';
import DeleteConfirmModal, { type DeleteType } from './Step2TeachingPath/DeleteConfirmModal';

// 渲染开放模式标签
function OpenModeBadge({ openMode, openTime }: { openMode?: string; openTime?: string }) {
  if (openMode === 'scheduled' && openTime) {
    return (
      <Text fontSize="11px" color="#86909C" flexShrink={0}>
        {openTime.replace('T', ' ').slice(0, 16)}
      </Text>
    );
  }
  if (openMode === 'prerequisite') {
    return (
      <Text fontSize="11px" color="#C8000B" flexShrink={0}>
        完成前置章节学习
      </Text>
    );
  }
  return null;
}

// 后端返回的状态常量（固定中文）
const STATUS_COVERED = '已覆盖';
const STATUS_PARTIAL = '部分覆盖';
const STATUS_UNCOVERED = '未覆盖';

// AI返回的大纲数据结构
type SyllabusTree = {
  course_name: string;
  chapters: Array<{
    chapter_name: string;
    openMode?: 'unlimited' | 'scheduled' | 'prerequisite';
    openTime?: string;
    sections: Array<{
      section_name: string;
      openMode?: 'unlimited' | 'scheduled' | 'prerequisite';
      openTime?: string;
      topics?: string[];
    }>;
  }>;
};

type Step2Props = {
  draft: AvatarWizardDraft;
  isMatching: boolean;
  isAnalyzing: boolean; // AI 分析大纲中
  isUploadingCourseware: boolean; // 课件上传中
  isParsingCourseware: boolean; // 课件解析中
  syllabusInputRef: RefObject<HTMLInputElement>;
  coursewareInputRef: RefObject<HTMLInputElement>;
  onSyllabusUpload: (file?: File) => void;
  onCoursewareUpload: (files: FileList | null) => void;
  onRemoveCourseware: (fileId: string) => void;
  onStartMatching: () => void;
  onUpdateDraft: (updater: (current: AvatarWizardDraft) => AvatarWizardDraft) => void;
};

export function Step2TeachingPath({
  draft,
  isMatching,
  isAnalyzing,
  isUploadingCourseware,
  isParsingCourseware,
  syllabusInputRef,
  coursewareInputRef,
  onSyllabusUpload,
  onCoursewareUpload,
  onRemoveCourseware,
  onStartMatching,
  onUpdateDraft
}: Step2Props) {
  const { t } = useTranslation('teacher');

  // 左侧教学大纲展开的章节索引（默认全部展开）
  const [expandedSyllabusChapters, setExpandedSyllabusChapters] = useState<Set<number>>(new Set());
  // 右侧匹配分析展开的章节索引（默认全部展开）
  const [expandedMatchChapters, setExpandedMatchChapters] = useState<Set<number>>(new Set());

  // 编辑弹窗状态（章/节共用）
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const [modalType, setModalType] = useState<EditModalType>('chapter');
  const [modalMode, setModalMode] = useState<EditModalMode>('add');
  const [modalChapterIndex, setModalChapterIndex] = useState<number>(-1);
  const [modalSectionIndex, setModalSectionIndex] = useState<number>(-1);
  const [modalInput, setModalInput] = useState('');
  const [modalOpenMode, setModalOpenMode] = useState<OpenMode>('unlimited');
  const [modalOpenTime, setModalOpenTime] = useState<string>('');

  // 删除确认弹窗状态
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose
  } = useDisclosure();
  const [deleteType, setDeleteType] = useState<DeleteType>('chapter');
  const [deleteChapterIndex, setDeleteChapterIndex] = useState<number>(-1);
  const [deleteSectionIndex, setDeleteSectionIndex] = useState<number>(-1);

  // 上传资源弹窗状态
  const {
    isOpen: isResourceModalOpen,
    onOpen: onResourceModalOpen,
    onClose: onResourceModalClose
  } = useDisclosure();
  const [resourceModalChapterTitle, setResourceModalChapterTitle] = useState('');
  const [resourceModalSectionIndex, setResourceModalSectionIndex] = useState<number>(-1);
  const [resourceModalChapterIndex, setResourceModalChapterIndex] = useState<number>(-1);

  // 解析大纲数据（优先使用真实数据，否则使用模拟数据）
  const syllabusData = useMemo(() => {
    if (draft.syllabusTree) {
      try {
        // syllabusTree 可能是字符串或对象
        const tree =
          typeof draft.syllabusTree === 'string'
            ? (JSON.parse(draft.syllabusTree) as SyllabusTree)
            : (draft.syllabusTree as SyllabusTree);

        return tree;
      } catch (error) {
        console.error('Failed to parse syllabus data:', error);
        return null;
      }
    }

    // 使用模拟数据展示
    // return MOCK_SYLLABUS_TREE as SyllabusTree;
    return null;
  }, [draft.syllabusTree]);

  // 计算知识模块数量
  const moduleCount = useMemo(() => {
    if (!syllabusData) {
      return 0;
    }
    return syllabusData.chapters.reduce((total, chapter) => total + chapter.sections.length, 0);
  }, [syllabusData]);

  // 数据加载后默认全部展开
  useEffect(() => {
    if (syllabusData?.chapters) {
      setExpandedSyllabusChapters(new Set(syllabusData.chapters.map((_, i) => i)));
    }
  }, [syllabusData]);

  // 切换左侧教学大纲章节展开状态
  const toggleSyllabusChapter = (index: number) => {
    setExpandedSyllabusChapters((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 切换右侧匹配分析章节展开状态
  const toggleMatchChapter = (index: number) => {
    setExpandedMatchChapters((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 打开添加章节弹窗（在指定位置后插入，-1 表示在末尾添加）
  const handleOpenAddChapter = (insertAfterIndex: number = -1) => {
    setModalType('chapter');
    setModalMode('add');
    setModalChapterIndex(insertAfterIndex);
    setModalSectionIndex(-1);
    setModalInput('');
    setModalOpenMode('unlimited');
    setModalOpenTime('');
    onModalOpen();
  };

  // 打开编辑章节弹窗
  const handleOpenEditChapter = (chapterIndex: number) => {
    if (!syllabusData) return;
    const chapter = syllabusData.chapters[chapterIndex];
    if (!chapter) return;
    setModalType('chapter');
    setModalMode('edit');
    setModalChapterIndex(chapterIndex);
    setModalSectionIndex(-1);
    setModalInput(chapter.chapter_name);
    setModalOpenMode((chapter as any).openMode || 'unlimited');
    setModalOpenTime(chapter.openTime || '');
    onModalOpen();
  };

  // 打开添加节弹窗
  const handleOpenAddSection = (chapterIndex: number) => {
    setModalType('section');
    setModalMode('add');
    setModalChapterIndex(chapterIndex);
    setModalSectionIndex(-1);
    setModalInput('');
    setModalOpenMode('unlimited');
    setModalOpenTime('');
    onModalOpen();
  };

  // 打开编辑节弹窗
  const handleOpenEditSection = (chapterIndex: number, sectionIndex: number) => {
    if (!syllabusData) return;
    const section = syllabusData.chapters[chapterIndex]?.sections[sectionIndex];
    if (!section) return;
    setModalType('section');
    setModalMode('edit');
    setModalChapterIndex(chapterIndex);
    setModalSectionIndex(sectionIndex);
    setModalInput(section.section_name);
    setModalOpenMode((section as any).openMode || 'unlimited');
    setModalOpenTime(section.openTime || '');
    onModalOpen();
  };

  // 确认编辑弹窗
  const handleConfirmModal = ({ name, openMode, openTime }: { name: string; openMode?: OpenMode; openTime?: string }) => {
    const currentTree: SyllabusTree = syllabusData
      ? { ...syllabusData, chapters: [...syllabusData.chapters] }
      : { course_name: draft.title || '', chapters: [] };

    // 同步更新匹配结果
    const currentMatchResult = displayMatchResult
      ? JSON.parse(JSON.stringify(displayMatchResult))
      : null;

    if (modalType === 'chapter') {
      if (modalMode === 'add') {
        const newChapter: SyllabusTree['chapters'][0] = { chapter_name: name, openMode, openTime, sections: [] };
        if (modalChapterIndex >= 0 && modalChapterIndex < currentTree.chapters.length) {
          currentTree.chapters.splice(modalChapterIndex + 1, 0, newChapter);
        } else {
          currentTree.chapters.push(newChapter);
        }
        const newIndex =
          modalChapterIndex >= 0 ? modalChapterIndex + 1 : currentTree.chapters.length - 1;
        setExpandedSyllabusChapters((prev) => new Set([...prev, newIndex]));

        // 同步在匹配结果对应位置插入新章
        if (currentMatchResult) {
          const newMatchChapter = {
            chapter_name: name,
            openMode,
            openTime,
            sections: [],
            status: STATUS_UNCOVERED
          };
          if (modalChapterIndex >= 0 && modalChapterIndex < currentMatchResult.chapters.length) {
            currentMatchResult.chapters.splice(modalChapterIndex + 1, 0, newMatchChapter);
          } else {
            currentMatchResult.chapters.push(newMatchChapter);
          }
        }
      } else if (modalMode === 'edit' && modalChapterIndex >= 0) {
        currentTree.chapters[modalChapterIndex] = {
          ...currentTree.chapters[modalChapterIndex],
          chapter_name: name,
          openMode,
          openTime
        };

        // 同步更新匹配结果中的章名称
        if (currentMatchResult?.chapters?.[modalChapterIndex]) {
          currentMatchResult.chapters[modalChapterIndex].chapter_name = name;
          currentMatchResult.chapters[modalChapterIndex].openMode = openMode;
          currentMatchResult.chapters[modalChapterIndex].openTime = openTime;
        }
      }
    } else if (modalType === 'section') {
      const chapter = currentTree.chapters[modalChapterIndex];
      if (!chapter) return;
      if (modalMode === 'add') {
        chapter.sections = [...chapter.sections, { section_name: name, openMode, openTime }];

        // 同步在匹配结果对应章下插入新节
        if (currentMatchResult?.chapters?.[modalChapterIndex]) {
          const matchChapter = currentMatchResult.chapters[modalChapterIndex];
          if (!matchChapter.sections) {
            matchChapter.sections = [];
          }
          matchChapter.sections.push({
            section_name: name,
            openMode,
            openTime,
            status: STATUS_UNCOVERED,
            covered_files: []
          });
        }
      } else if (modalMode === 'edit' && modalSectionIndex >= 0) {
        chapter.sections = chapter.sections.map((s, idx) =>
          idx === modalSectionIndex ? { ...s, section_name: name, openMode, openTime } : s
        );

        // 同步更新匹配结果中的节名称
        if (currentMatchResult?.chapters?.[modalChapterIndex]?.sections?.[modalSectionIndex]) {
          currentMatchResult.chapters[modalChapterIndex].sections[modalSectionIndex].section_name =
            name;
          currentMatchResult.chapters[modalChapterIndex].sections[modalSectionIndex].openMode =
            openMode;
          currentMatchResult.chapters[modalChapterIndex].sections[modalSectionIndex].openTime =
            openTime;
        }
      }
    }

    onUpdateDraft((current) => ({
      ...current,
      syllabusTree: JSON.stringify(currentTree),
      matchAnalysisResult: currentMatchResult || current.matchAnalysisResult,
      updatedAt: new Date().toISOString()
    }));

    onModalClose();
  };

  // 打开删除章节确认
  const handleOpenDeleteChapter = (chapterIndex: number) => {
    setDeleteType('chapter');
    setDeleteChapterIndex(chapterIndex);
    setDeleteSectionIndex(-1);
    onDeleteModalOpen();
  };

  // 打开删除节确认
  const handleOpenDeleteSection = (chapterIndex: number, sectionIndex: number) => {
    setDeleteType('section');
    setDeleteChapterIndex(chapterIndex);
    setDeleteSectionIndex(sectionIndex);
    onDeleteModalOpen();
  };

  // 打开上传资源弹窗
  const handleOpenResourceModal = (chapterIndex: number, sectionIndex: number) => {
    if (!syllabusData) return;
    const chapter = displayMatchResult?.chapters?.[chapterIndex];
    const section = chapter?.sections?.[sectionIndex];
    if (!section) return;
    const title = `${chapter?.chapter_name || ''}：${section.section_name}`;
    setResourceModalChapterTitle(title);
    setResourceModalChapterIndex(chapterIndex);
    setResourceModalSectionIndex(sectionIndex);
    onResourceModalOpen();
  };

  // 确认添加资源
  const handleConfirmResource = (
    resources: Array<{
      id: string;
      title: string;
      fileKey?: string;
      fileName?: string;
      fileUrl?: string;
      fileType?: string;
    }>
  ) => {
    if (resources.length === 0) return;
    // 将选中的资源添加到对应节的 covered_files 中
    const currentTree = displayMatchResult ? JSON.parse(JSON.stringify(displayMatchResult)) : null;
    if (!currentTree || resourceModalChapterIndex < 0 || resourceModalSectionIndex < 0) return;

    const chapter = currentTree.chapters?.[resourceModalChapterIndex];
    const section = chapter?.sections?.[resourceModalSectionIndex];
    if (!section) return;

    // 初始化 covered_files 数组
    if (!section.covered_files) {
      section.covered_files = [];
    }

    // 添加选中的资源到 covered_files
    // AI主讲课和数字课件 fileKey 为 null，文件路径传给 fileUrl；其他类型传递 fileKey
    resources.forEach((res) => {
      const hasFileKey = res.fileKey !== null && res.fileKey !== undefined;
      section.covered_files.push({
        fileName: res.fileName || res.title,
        fileUrl: res.fileUrl || '',
        fileKey: hasFileKey ? res.fileKey : null,
        fileType: res.fileType || 'other'
      });
    });

    // 更新状态为"已覆盖"或"部分覆盖"
    if (section.status === STATUS_UNCOVERED) {
      section.status = STATUS_PARTIAL;
    }

    // 更新 draft
    onUpdateDraft((current) => ({
      ...current,
      matchAnalysisResult: currentTree,
      updatedAt: new Date().toISOString()
    }));
  };

  // 删除知识匹配结果中某节下的某个文件
  const handleRemoveMatchFile = (chapterIndex: number, sectionIndex: number, fileIndex: number) => {
    const currentTree = draft.matchAnalysisResult
      ? JSON.parse(JSON.stringify(draft.matchAnalysisResult))
      : null;
    if (!currentTree) return;

    const chapter = currentTree.chapters?.[chapterIndex];
    const section = chapter?.sections?.[sectionIndex];
    if (!section || !section.covered_files) return;

    // 移除指定文件
    section.covered_files.splice(fileIndex, 1);

    // 如果移除后文件为空，且状态是"已覆盖"或"部分覆盖"，降级为"未覆盖"
    if (section.covered_files.length === 0) {
      if (section.status === STATUS_COVERED || section.status === STATUS_PARTIAL) {
        section.status = STATUS_UNCOVERED;
      }
    }

    // 更新 draft
    onUpdateDraft((current) => ({
      ...current,
      matchAnalysisResult: currentTree,
      updatedAt: new Date().toISOString()
    }));
  };

  // 判断章下是否有课件（通过匹配结果检查）
  const hasChapterCourseware = (chapterIndex: number): boolean => {
    if (!displayMatchResult?.chapters?.[chapterIndex]) return false;
    const chapter = displayMatchResult.chapters[chapterIndex];
    if (chapter.sections && Array.isArray(chapter.sections)) {
      return chapter.sections.some(
        (section: any) => section.covered_files && section.covered_files.length > 0
      );
    }
    // 无 sections 的章，检查章级别的 covered_files
    return chapter.covered_files && chapter.covered_files.length > 0;
  };

  // 判断节下是否有课件（通过匹配结果检查）
  const hasSectionCourseware = (chapterIndex: number, sectionIndex: number): boolean => {
    if (!displayMatchResult?.chapters?.[chapterIndex]) return false;
    const chapter = displayMatchResult.chapters[chapterIndex];
    if (chapter.sections && Array.isArray(chapter.sections)) {
      const section = chapter.sections[sectionIndex];
      return section?.covered_files && section.covered_files.length > 0;
    }
    return false;
  };

  // 确认删除
  const handleConfirmDelete = () => {
    const currentTree: SyllabusTree = syllabusData
      ? { ...syllabusData, chapters: [...syllabusData.chapters] }
      : { course_name: draft.title || '', chapters: [] };

    // 同步更新匹配结果
    const currentMatchResult = displayMatchResult
      ? JSON.parse(JSON.stringify(displayMatchResult))
      : null;

    if (deleteType === 'chapter' && deleteChapterIndex >= 0) {
      currentTree.chapters.splice(deleteChapterIndex, 1);
      // 同步更新左侧展开状态
      setExpandedSyllabusChapters((prev) => {
        const next = new Set<number>();
        prev.forEach((idx) => {
          if (idx < deleteChapterIndex) {
            next.add(idx);
          } else if (idx > deleteChapterIndex) {
            next.add(idx - 1);
          }
        });
        return next;
      });

      // 同步删除匹配结果中对应章
      if (currentMatchResult?.chapters) {
        currentMatchResult.chapters.splice(deleteChapterIndex, 1);
      }
    } else if (deleteType === 'section' && deleteChapterIndex >= 0 && deleteSectionIndex >= 0) {
      const chapter = currentTree.chapters[deleteChapterIndex];
      if (chapter) {
        chapter.sections = chapter.sections.filter((_, idx) => idx !== deleteSectionIndex);
      }

      // 同步删除匹配结果中对应节
      if (currentMatchResult?.chapters?.[deleteChapterIndex]?.sections) {
        const matchChapter = currentMatchResult.chapters[deleteChapterIndex];
        matchChapter.sections = matchChapter.sections.filter(
          (_: any, idx: number) => idx !== deleteSectionIndex
        );
      }
    }

    onUpdateDraft((current) => ({
      ...current,
      syllabusTree: JSON.stringify(currentTree),
      matchAnalysisResult: currentMatchResult || current.matchAnalysisResult,
      updatedAt: new Date().toISOString()
    }));

    onDeleteModalClose();
  };

  // 使用真实数据
  const displayCoursewareFiles = draft.coursewareFiles;

  const displayAnalysisCompleted = draft.analysisCompleted;
  const displayMatchResult = draft.matchAnalysisResult;

  // 匹配结果数据加载后默认全部展开
  useEffect(() => {
    const chapters = displayMatchResult?.chapters;
    if (chapters) {
      setExpandedMatchChapters(new Set(chapters.map((_: any, i: number) => i)));
    }
  }, [displayMatchResult]);

  return (
    <Flex gap={6} direction="row" align="stretch" h="calc(100vh - 280px)">
      {/* 左侧：教学大纲 */}
      <Box
        w="356px"
        flexShrink={0}
        bg="white"
        borderRadius="16px"
        boxShadow={CARD_SHADOW}
        overflow="hidden"
        display="flex"
        flexDirection="column"
        h="full"
        position="relative"
      >
        {/* 固定头部：标题 + 课程信息 */}
        <Box px={5} pt={5} pb={4} flexShrink={0}>
          {/* 标题 */}
          <Flex align="center" gap="9px" mb={4}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
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
            <Text fontWeight={500} color="#333333" fontSize="16px">
              {t('aiTeacher.avatar.create.step2.syllabus.title')}
            </Text>
          </Flex>

          {/* 课程名称与统计 */}
          {syllabusData && (
            <Box
              p="12px"
              bg="linear-gradient(180deg, rgba(255, 77, 77, 0.05) 0%, rgba(255, 163, 77, 0.05) 100%)"
              borderRadius="12px"
              mb="12px"
              position="relative"
            >
              <Flex align="center" justify="space-between" mb="8px">
                <Text fontWeight={500} color="#333333" fontSize="16px">
                  {syllabusData.course_name ||
                    draft.title ||
                    t('aiTeacher.avatar.common.fallback.unnamedCourse')}
                </Text>
                <Box
                  as="span"
                  cursor="pointer"
                  flexShrink={0}
                  display="flex"
                  alignItems="center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAddChapter();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                  >
                    <g opacity="0.9">
                      <path
                        d="M19.5672 15.9992H16M16 15.9992H12.4329M16 15.9992V19.5664M16 15.9992L16 12.432M25.5125 15.9998C25.5125 21.2534 21.2537 25.5123 16 25.5123C10.7464 25.5123 6.48755 21.2534 6.48755 15.9998C6.48755 10.7462 10.7464 6.4873 16 6.4873C21.2537 6.4873 25.5125 10.7462 25.5125 15.9998Z"
                        stroke="#C8000B"
                        strokeWidth="2.24"
                        strokeLinecap="round"
                      />
                    </g>
                  </svg>
                </Box>
              </Flex>
              <HStack spacing="10px" fontSize="14px" color="#86909C" lineHeight="22px">
                <HStack spacing="6px">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M8.8037 15.02V4.18574M8.8037 15.02L7.75935 13.9539C7.16961 13.3519 6.37012 13.0137 5.53611 13.0137H2.90681C2.47263 13.0137 2.12134 12.6544 2.12134 12.2111V3.78447C2.12134 3.34124 2.47331 2.98193 2.9075 2.98193H5.92883C6.76284 2.98193 7.56269 3.32015 8.15243 3.92217L8.8037 4.58701L9.45498 3.92217C10.0447 3.32015 10.8446 2.98193 11.6786 2.98193H15.093C15.5272 2.98193 15.8792 3.34124 15.8792 3.78447V12.2111C15.8792 12.6544 15.5272 13.0137 15.093 13.0137H12.0717C11.2376 13.0137 10.4378 13.3519 9.84806 13.9539L8.8037 15.02Z"
                      stroke="#86909C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <Text>
                    {t('aiTeacher.avatar.create.step2.syllabus.chapters', {
                      count: syllabusData.chapters?.length || 0
                    })}
                  </Text>
                </HStack>
                <HStack spacing="6px">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M13.05 9.13069L16.2 10.7453L9.00005 14.4359L1.80005 10.7453L5.00762 9.10118M9.00005 3.56396L16.2 7.25452L9.00005 10.9451L1.80005 7.25452L9.00005 3.56396Z"
                      stroke="#86909C"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <Text>
                    {t('aiTeacher.avatar.create.step2.syllabus.sections', { count: moduleCount })}
                  </Text>
                </HStack>
                <HStack spacing="6px">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                  >
                    <path
                      d="M7.5 0C11.6423 0 15 3.35775 15 7.5C15 11.6423 11.6423 15 7.5 15C3.35775 15 0 11.6423 0 7.5C0 3.35775 3.35775 0 7.5 0ZM7.5 1.5C5.9087 1.5 4.38258 2.13214 3.25736 3.25736C2.13214 4.38258 1.5 5.9087 1.5 7.5C1.5 9.0913 2.13214 10.6174 3.25736 11.7426C4.38258 12.8679 5.9087 13.5 7.5 13.5C9.0913 13.5 10.6174 12.8679 11.7426 11.7426C12.8679 10.6174 13.5 9.0913 13.5 7.5C13.5 5.9087 12.8679 4.38258 11.7426 3.25736C10.6174 2.13214 9.0913 1.5 7.5 1.5ZM7.5 3C7.6837 3.00002 7.861 3.06747 7.99828 3.18954C8.13556 3.31161 8.22326 3.47981 8.24475 3.66225L8.25 3.75V7.1895L10.2803 9.21975C10.4148 9.35472 10.4929 9.53583 10.4987 9.72629C10.5045 9.91675 10.4376 10.1023 10.3116 10.2452C10.1855 10.3881 10.0098 10.4777 9.82015 10.4958C9.63045 10.5139 9.44099 10.4591 9.29025 10.3425L9.21975 10.2803L6.96975 8.03025C6.85319 7.91359 6.77832 7.76175 6.75675 7.59825L6.75 7.5V3.75C6.75 3.55109 6.82902 3.36032 6.96967 3.21967C7.11032 3.07902 7.30109 3 7.5 3Z"
                      fill="#86909C"
                    />
                  </svg>
                  <Text>
                    {t('aiTeacher.avatar.create.step2.syllabus.hours', { count: draft.hours || 0 })}
                  </Text>
                </HStack>
              </HStack>
            </Box>
          )}
        </Box>

        {/* 可滚动列表区域 */}
        <Box px={5} pb={4} overflowY="auto" flex="1">
          {/* 渲染大纲章节 */}
          {syllabusData ? (
            <VStack align="stretch" spacing="8px">
              {syllabusData.chapters.map((chapter, chapterIndex) => {
                const isExpanded = expandedSyllabusChapters.has(chapterIndex);
                return (
                  <Box
                    key={chapterIndex}
                    bg="white"
                    borderRadius="12px"
                    border="1px solid #F2F3F5"
                    overflow="hidden"
                  >
                    {/* 章标题 */}
                    <Flex
                      align="center"
                      justify="space-between"
                      px="12px"
                      py="10px"
                      cursor="pointer"
                      onClick={() => toggleSyllabusChapter(chapterIndex)}
                    >
                      <HStack spacing="6px" flex={1} minW={0}>
                        {isExpanded ? (
                          <ChevronDownIcon color="#86909C" boxSize={5} flexShrink={0} />
                        ) : (
                          <ChevronRightIcon color="#86909C" boxSize={5} flexShrink={0} />
                        )}
                        <Text
                          fontWeight={500}
                          fontSize="14px"
                          color="#333333"
                          noOfLines={1}
                          title={chapter.chapter_name}
                        >
                          {chapter.chapter_name}
                        </Text>
                        <OpenModeBadge openMode={chapter.openMode} openTime={chapter.openTime} />
                      </HStack>
                      <HStack spacing="2px">
                        <IconButton
                          aria-label="edit"
                          icon={
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <path
                                d="M10.3867 15.2191L10.9215 14.6197C11.5777 13.8843 12.755 13.9799 13.2839 14.8116C13.7767 15.5863 14.8472 15.7332 15.5304 15.1198L16.4998 14.2494M3.50049 15.3827L6.64615 14.7489C6.81314 14.7152 6.96647 14.633 7.08689 14.5125L14.1288 7.46679C14.4664 7.12898 14.4661 6.58142 14.1282 6.2439L12.6365 4.75386C12.2988 4.41648 11.7515 4.41671 11.414 4.75438L4.37139 11.8008C4.2512 11.9211 4.16914 12.0741 4.13546 12.2408L3.50049 15.3827Z"
                                stroke="#86909C"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          }
                          size="xs"
                          variant="ghost"
                          color="gray.400"
                          minW="28px"
                          h="28px"
                          _hover={{ color: 'gray.600', bg: 'rgba(0,0,0,0.04)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditChapter(chapterIndex);
                          }}
                        />
                        <IconButton
                          aria-label="add"
                          icon={
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <g opacity="0.9">
                                <path
                                  d="M13.4795 9.99939H10M10 9.99939H6.52055M10 9.99939V13.4789M10 9.99939V6.52051M16.5703 9.99984C16.5703 13.5808 13.5808 16.5704 10 16.5704C6.41915 16.5704 3.42969 13.5808 3.42969 9.99984C3.42969 6.41889 6.41915 3.42969 10 3.42969C13.5808 3.42969 16.5703 6.41889 16.5703 9.99984Z"
                                  stroke="#86909C"
                                  strokeWidth="1.4"
                                  strokeLinecap="round"
                                />
                              </g>
                            </svg>
                          }
                          size="xs"
                          variant="ghost"
                          color="gray.400"
                          minW="28px"
                          h="28px"
                          _hover={{ color: 'gray.600', bg: 'rgba(0,0,0,0.04)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddSection(chapterIndex);
                          }}
                        />
                        <Tooltip
                          label={t('aiTeacher.avatar.edit.chapters.deleteChapterWithCourseware')}
                          isDisabled={!hasChapterCourseware(chapterIndex)}
                          placement="top"
                        >
                          <IconButton
                            aria-label="delete"
                            icon={
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 20 20"
                                fill="none"
                              >
                                <path
                                  d="M5.11108 6.44118H14.8889M8.16664 4.5H11.8333M8.77775 12.9118V9.02941M11.2222 12.9118V9.02941M12.1389 15.5H7.86108C7.18607 15.5 6.63886 14.9206 6.63886 14.2059L6.35983 7.11517C6.34536 6.74756 6.62292 6.44118 6.97041 6.44118H13.0295C13.377 6.44118 13.6546 6.74756 13.6401 7.11517L13.3611 14.2059C13.3611 14.9206 12.8139 15.5 12.1389 15.5Z"
                                  stroke="#86909C"
                                  strokeWidth="1.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            }
                            size="xs"
                            variant="ghost"
                            color="gray.400"
                            minW="28px"
                            h="28px"
                            _hover={{ color: 'red.500', bg: 'rgba(0,0,0,0.04)' }}
                            isDisabled={hasChapterCourseware(chapterIndex)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteChapter(chapterIndex);
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>

                    {/* 节列表 */}
                    <Collapse in={isExpanded} animateOpacity>
                      <VStack align="stretch" spacing="6px" pb="10px" px="12px">
                        {chapter.sections.map((section, sectionIndex) => (
                          <Flex
                            key={sectionIndex}
                            px="12px"
                            py="10px"
                            align="center"
                            justify="space-between"
                            borderRadius="8px"
                            bg="#F7F8FA"
                          >
                            <HStack spacing="8px" flex={1} minW={0}>
                              <Box
                                w="5px"
                                h="5px"
                                borderRadius="full"
                                bg="#C8000B"
                                flexShrink={0}
                              />
                              <Text
                                fontSize="13px"
                                color="#4E5969"
                                noOfLines={1}
                                title={section.section_name}
                              >
                                {section.section_name}
                              </Text>
                              <OpenModeBadge openMode={section.openMode} openTime={section.openTime} />
                            </HStack>
                            <HStack spacing="2px">
                              <IconButton
                                aria-label="edit"
                                icon={
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                  >
                                    <path
                                      d="M10.3867 15.2191L10.9215 14.6197C11.5777 13.8843 12.755 13.9799 13.2839 14.8116C13.7767 15.5863 14.8472 15.7332 15.5304 15.1198L16.4998 14.2494M3.50049 15.3827L6.64615 14.7489C6.81314 14.7152 6.96647 14.633 7.08689 14.5125L14.1288 7.46679C14.4664 7.12898 14.4661 6.58142 14.1282 6.2439L12.6365 4.75386C12.2988 4.41648 11.7515 4.41671 11.414 4.75438L4.37139 11.8008C4.2512 11.9211 4.16914 12.0741 4.13546 12.2408L3.50049 15.3827Z"
                                      stroke="#86909C"
                                      strokeWidth="1.4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                }
                                size="xs"
                                variant="ghost"
                                color="gray.400"
                                minW="24px"
                                h="24px"
                                _hover={{ color: 'gray.600', bg: 'rgba(0,0,0,0.04)' }}
                                onClick={() => handleOpenEditSection(chapterIndex, sectionIndex)}
                              />
                              <Tooltip
                                label={t(
                                  'aiTeacher.avatar.edit.chapters.deleteSectionWithCourseware'
                                )}
                                isDisabled={!hasSectionCourseware(chapterIndex, sectionIndex)}
                                placement="top"
                              >
                                <IconButton
                                  aria-label="delete"
                                  icon={
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="20"
                                      height="20"
                                      viewBox="0 0 20 20"
                                      fill="none"
                                    >
                                      <path
                                        d="M5.11108 6.44118H14.8889M8.16664 4.5H11.8333M8.77775 12.9118V9.02941M11.2222 12.9118V9.02941M12.1389 15.5H7.86108C7.18607 15.5 6.63886 14.9206 6.63886 14.2059L6.35983 7.11517C6.34536 6.74756 6.62292 6.44118 6.97041 6.44118H13.0295C13.377 6.44118 13.6546 6.74756 13.6401 7.11517L13.3611 14.2059C13.3611 14.9206 12.8139 15.5 12.1389 15.5Z"
                                        stroke="#86909C"
                                        strokeWidth="1.4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  }
                                  size="xs"
                                  variant="ghost"
                                  color="gray.400"
                                  minW="24px"
                                  h="24px"
                                  _hover={{ color: 'red.500', bg: 'rgba(0,0,0,0.04)' }}
                                  isDisabled={hasSectionCourseware(chapterIndex, sectionIndex)}
                                  onClick={() =>
                                    handleOpenDeleteSection(chapterIndex, sectionIndex)
                                  }
                                />
                              </Tooltip>
                            </HStack>
                          </Flex>
                        ))}
                      </VStack>
                    </Collapse>
                  </Box>
                );
              })}

              <Button
                mt={4}
                bg="white"
                color="gray.800"
                border="1px solid"
                borderColor="gray.300"
                _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
                leftIcon={<RepeatIcon />}
                size="sm"
                w="full"
                onClick={() => syllabusInputRef.current?.click()}
                isLoading={isAnalyzing && !isMatching}
                isDisabled={isMatching}
                loadingText={t('aiTeacher.avatar.common.fallback.loading')}
              >
                {t('aiTeacher.avatar.create.step2.syllabus.reupload')}
              </Button>
            </VStack>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="full"
              py={12}
              border="1px dashed"
              borderColor="#D9D9D9"
              borderRadius="12px"
            >
              {/* 云上传图标 */}
              <Flex
                w="64px"
                h="64px"
                borderRadius="full"
                bg="rgba(255, 179, 0, 0.12)"
                align="center"
                justify="center"
                mb={4}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 16V8M12 8L9 11M12 8L15 11"
                    stroke="#FFB300"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 17.5C4 18.8807 5.11929 20 6.5 20H17.5C18.8807 20 20 18.8807 20 17.5C20 16.1193 18.8807 15 17.5 15H17.4492C17.188 12.321 14.9937 10.2222 12.292 10.2222C10.0599 10.2222 8.15163 11.5752 7.30708 13.5089C7.22131 13.5029 7.13456 13.5 7.04724 13.5C5.36441 13.5 4 14.8431 4 16.5V17.5Z"
                    stroke="#FFB300"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Flex>
              <Text fontSize="16px" fontWeight={600} color="#1D2129" mb={2}>
                {t('aiTeacher.avatar.create.step2.syllabus.uploadTitle')}
              </Text>
              <Text fontSize="14px" color="#86909C" textAlign="center" mb={6} lineHeight="22px">
                {t('aiTeacher.avatar.create.step2.syllabus.uploadHint')}
              </Text>
              <Button
                bg="white"
                color="#1D2129"
                border="1px solid"
                borderColor="#D9D9D9"
                borderRadius="8px"
                px={6}
                py={2.5}
                fontSize="14px"
                fontWeight={500}
                _hover={{ bg: '#FAFAFA', borderColor: '#BFBFBF' }}
                onClick={() => syllabusInputRef.current?.click()}
                isLoading={isAnalyzing && !isMatching}
                isDisabled={isMatching}
                loadingText={t('aiTeacher.avatar.common.fallback.loading')}
              >
                {t('aiTeacher.avatar.common.actions.upload')}
              </Button>
              <Text fontSize="12px" color="#BFBFBF" mt={4}>
                {t('aiTeacher.avatar.create.step2.syllabus.parseSuccess')}
              </Text>
            </Flex>
          )}
          <Input
            ref={syllabusInputRef}
            type="file"
            display="none"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              onSyllabusUpload(e.target.files?.[0]);
              if (e.target) {
                e.target.value = '';
              }
            }}
          />
        </Box>

        {/* 添加/编辑弹窗（章/节共用） */}
        <EditChapterModal
          isOpen={isModalOpen}
          onClose={onModalClose}
          onConfirm={handleConfirmModal}
          modalType={modalType}
          modalMode={modalMode}
          initialValue={modalInput}
          initialOpenMode={modalOpenMode}
          initialOpenTime={modalOpenTime}
          allowPrerequisite={modalType === 'chapter' ? modalChapterIndex > 0 : true}
        />

        {/* 删除确认弹窗 */}
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          onConfirm={handleConfirmDelete}
          deleteType={deleteType}
        />

        {/* AI 分析中的遮罩层 - 覆盖整个大纲卡片（仅在分析大纲时显示，匹配时不显示） */}
        {isAnalyzing && !isMatching && (
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(255, 255, 255, 0.95)"
            backdropFilter="blur(4px)"
            align="center"
            justify="center"
            zIndex={10}
            borderRadius="20px"
            direction="column"
          >
            {/* 加载动画 */}
            <Box
              as="span"
              display="inline-block"
              w="56px"
              h="56px"
              border="4px solid"
              borderColor="orange.200"
              borderTopColor={PRIMARY_COLOR}
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
            <Text fontSize="lg" fontWeight={600} color="gray.800" mb={2} px={4} textAlign="center">
              {t('aiTeacher.avatar.create.step2.matching.analyzingSyllabus')}
            </Text>
            <Text fontSize="sm" color="gray.500" px={4} textAlign="center">
              {t('aiTeacher.avatar.create.step2.matching.analyzingSyllabusDesc')}
            </Text>
          </Flex>
        )}
      </Box>

      {/* 右侧：课件资源与匹配结果 */}
      <Box
        flex="1"
        minW={0}
        bg="white"
        borderRadius="20px"
        boxShadow={CARD_SHADOW}
        overflow="hidden"
        display="flex"
        flexDirection="column"
        h="full"
        position="relative"
      >
        <Flex p={5} align="center" justify="space-between" gap={3} flexShrink={0}>
          <HStack spacing={3}>
            <Flex
              w="36px"
              h="36px"
              borderRadius="full"
              bg="rgba(77,133,255,0.1)"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="16"
                viewBox="0 0 19 16"
                fill="none"
              >
                <path
                  d="M0.00636292 10.974C-0.0558405 11.5228 0.3386 12.0181 0.887371 12.0803C1.43614 12.1425 1.93143 11.748 1.99364 11.1993L1 11.0866L0.00636292 10.974ZM1.96063 2.61176L1.31793 1.84564C1.1215 2.01043 0.995872 2.24437 0.966995 2.49913L1.96063 2.61176ZM4.5246 1.76612C4.94771 1.41116 5.00297 0.780414 4.64801 0.357299C4.29306 -0.0658156 3.66231 -0.121071 3.23919 0.233883L3.8819 1L4.5246 1.76612ZM16.4743 11.1993C16.5365 11.748 17.0318 12.1425 17.5806 12.0803C18.1294 12.0181 18.5238 11.5228 18.4616 10.974L17.468 11.0866L16.4743 11.1993ZM16.5073 2.61176L17.501 2.49913C17.4721 2.24437 17.3465 2.01043 17.15 1.84564L16.5073 2.61176ZM15.2288 0.233882C14.8057 -0.121071 14.1749 -0.0658154 13.82 0.3573C13.465 0.780415 13.5203 1.41116 13.9434 1.76612L14.5861 1L15.2288 0.233882ZM6.76379 11.2925H5.76379C5.76379 12.3318 4.92124 13.1744 3.8819 13.1744V14.1744V15.1744C6.02581 15.1744 7.76379 13.4364 7.76379 11.2925H6.76379ZM3.8819 14.1744V13.1744C2.84255 13.1744 2 12.3318 2 11.2925H1H0C0 13.4364 1.73798 15.1744 3.8819 15.1744V14.1744ZM1 11.2925H2C2 10.2531 2.84255 9.41059 3.8819 9.41059V8.41059V7.41059C1.73798 7.41059 0 9.14857 0 11.2925H1ZM3.8819 8.41059V9.41059C4.92124 9.41059 5.76379 10.2531 5.76379 11.2925H6.76379H7.76379C7.76379 9.14857 6.02581 7.41059 3.8819 7.41059V8.41059ZM6.73766 10.6749L7.60326 11.1757C7.93016 10.6106 8.5387 10.234 9.23401 10.234V9.23399V8.23399C7.7959 8.23399 6.54174 9.01652 5.87205 10.1742L6.73766 10.6749ZM9.23401 9.23399V10.234C9.92931 10.234 10.5379 10.6106 10.8647 11.1757L11.7304 10.6749L12.596 10.1742C11.9263 9.01652 10.6721 8.23399 9.23401 8.23399V9.23399ZM17.468 11.2925H16.468C16.468 12.3318 15.6254 13.1744 14.5861 13.1744V14.1744V15.1744C16.73 15.1744 18.468 13.4364 18.468 11.2925H17.468ZM14.5861 14.1744V13.1744C13.5467 13.1744 12.7042 12.3318 12.7042 11.2925H11.7042H10.7042C10.7042 13.4364 12.4422 15.1744 14.5861 15.1744V14.1744ZM11.7042 11.2925H12.7042C12.7042 10.2531 13.5467 9.41059 14.5861 9.41059V8.41059V7.41059C12.4422 7.41059 10.7042 9.14857 10.7042 11.2925H11.7042ZM14.5861 8.41059V9.41059C15.6254 9.41059 16.468 10.2531 16.468 11.2925H17.468H18.468C18.468 9.14857 16.73 7.41059 14.5861 7.41059V8.41059ZM1 11.0866L1.99364 11.1993L2.95427 2.72439L1.96063 2.61176L0.966995 2.49913L0.00636292 10.974L1 11.0866ZM1.96063 2.61176L2.60333 3.37788L4.5246 1.76612L3.8819 1L3.23919 0.233883L1.31793 1.84564L1.96063 2.61176ZM17.468 11.0866L18.4616 10.974L17.501 2.49913L16.5073 2.61176L15.5137 2.72439L16.4743 11.1993L17.468 11.0866ZM16.5073 2.61176L17.15 1.84564L15.2288 0.233882L14.5861 1L13.9434 1.76612L15.8646 3.37788L16.5073 2.61176Z"
                  fill="url(#paint0_linear_1628_13313)"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_1628_13313"
                    x1="9.23399"
                    y1="1"
                    x2="9.23399"
                    y2="14.1744"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#4D85FF" />
                    <stop offset="1" stopColor="#4DC1FF" />
                  </linearGradient>
                </defs>
              </svg>
            </Flex>
            <Box>
              <Text fontWeight={600} color="gray.800">
                {t('aiTeacher.avatar.create.step2.matching.title')}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {t('aiTeacher.avatar.create.step2.matching.subtitle')}
              </Text>
            </Box>
          </HStack>
          {/* 状态标签 */}
          {displayCoursewareFiles.length > 0 && !displayAnalysisCompleted && (
            <HStack spacing={1} px={2} py={0.5} bg="#E8F4FF" borderRadius="4px" color="#1677FF">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 0.5C3.41015 0.5 0.5 3.41015 0.5 7C0.5 10.5899 3.41015 13.5 7 13.5C10.5899 13.5 13.5 10.5899 13.5 7C13.5 3.41015 10.5899 0.5 7 0.5ZM10.1464 5.64645L6.14645 9.64645C5.95118 9.84171 5.63466 9.84171 5.43934 9.64645L3.85355 8.06066C3.65829 7.8654 3.65829 7.54888 3.85355 7.35355C4.04882 7.15829 4.3654 7.15829 4.56066 7.35355L5.79289 8.58579L9.43934 4.93934C9.6346 4.74408 9.95118 4.74408 10.1464 4.93934C10.3417 5.1346 10.3417 5.45118 10.1464 5.64645Z"
                  fill="#1677FF"
                />
              </svg>
              <Text fontSize="12px" fontWeight={500}>
                {t('aiTeacher.avatar.create.step2.matching.state.uploaded')}
              </Text>
            </HStack>
          )}
          {displayAnalysisCompleted && (
            <HStack spacing={1} px={2} py={0.5} bg="#E8F4FF" borderRadius="4px" color="#1677FF">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 0.5C3.41015 0.5 0.5 3.41015 0.5 7C0.5 10.5899 3.41015 13.5 7 13.5C10.5899 13.5 13.5 10.5899 13.5 7C13.5 3.41015 10.5899 0.5 7 0.5ZM10.1464 5.64645L6.14645 9.64645C5.95118 9.84171 5.63466 9.84171 5.43934 9.64645L3.85355 8.06066C3.65829 7.8654 3.65829 7.54888 3.85355 7.35355C4.04882 7.15829 4.3654 7.15829 4.56066 7.35355L5.79289 8.58579L9.43934 4.93934C9.6346 4.74408 9.95118 4.74408 10.1464 4.93934C10.3417 5.1346 10.3417 5.45118 10.1464 5.64645Z"
                  fill="#1677FF"
                />
              </svg>
              <Text fontSize="12px" fontWeight={500}>
                {t('aiTeacher.avatar.create.step2.matching.state.completed')}
              </Text>
            </HStack>
          )}
        </Flex>

        {/* 课件资源列表区域 */}
        <Box p={5} bg="white" flexShrink={0} position="relative">
          <Input
            ref={coursewareInputRef}
            type="file"
            multiple
            display="none"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.wmv,.mkv,.flv"
            onChange={(e) => {
              onCoursewareUpload(e.target.files);
              // 清空文件输入框，允许重复选择同一个文件
              if (e.target) {
                e.target.value = '';
              }
            }}
          />

          {displayCoursewareFiles.length > 0 ? (
            <VStack align="stretch" spacing={2}>
              {/* 文件列表 - 双列网格布局 */}
              <Box border="1px dashed" borderColor="#D9D9D9" borderRadius="12px" p={3} bg="#FAFAFA">
                <Box maxH="136px" overflowY="auto" pr={1}>
                  <Flex wrap="wrap" gap={2}>
                    {displayCoursewareFiles.map((file) => {
                      // 清理 file.id 中的特殊字符，避免 SVG url(#...) 引用时
                      // 被浏览器 CSS 选择器解析器误解析（如 . 被当作 class 选择器）
                      const safeId = file.id.replace(/[^a-zA-Z0-9_-]/g, '-');
                      return (
                      <Flex
                        key={file.id}
                        align="center"
                        gap={2}
                        p={2}
                        bg="white"
                        border="1px solid"
                        borderColor="gray.100"
                        borderRadius="lg"
                        w="calc(50% - 4px)"
                      >
                        <Flex
                          w="32px"
                          h="32px"
                          borderRadius="md"
                          align="center"
                          justify="center"
                          flexShrink={0}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                          >
                            <rect
                              width="32"
                              height="32"
                              rx="9.66038"
                              fill={`url(#paint0_file_icon_${safeId})`}
                              fillOpacity="0.1"
                            />
                            <rect
                              x="6.78955"
                              y="5.26367"
                              width="18.4208"
                              height="21.4734"
                              rx="4.26667"
                              fill={`url(#paint1_file_icon_${safeId})`}
                            />
                            <rect
                              x="10.094"
                              y="9.53027"
                              width="5.35077"
                              height="1.6409"
                              rx="0.820449"
                              fill="white"
                            />
                            <rect
                              x="10.094"
                              y="12.188"
                              width="6.8275"
                              height="1.6409"
                              rx="0.820449"
                              fill="white"
                            />
                            <defs>
                              <linearGradient
                                id={`paint0_file_icon_${safeId}`}
                                x1="16"
                                y1="0"
                                x2="16"
                                y2="32"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop stopColor="#88C3FF" />
                                <stop offset="1" stopColor="#2D65FF" />
                              </linearGradient>
                              <linearGradient
                                id={`paint1_file_icon_${safeId}`}
                                x1="16"
                                y1="5.26367"
                                x2="16"
                                y2="26.7371"
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop stopColor="#88C3FF" />
                                <stop offset="1" stopColor="#2D65FF" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </Flex>
                        <Box flex="1" minW={0}>
                          <Text fontSize="sm" color="gray.800" noOfLines={1} fontWeight={500}>
                            {file.name}
                          </Text>
                          {/* 文件解析进度 */}
                          {file.parseStatus === 'parsing' && (
                            <Box mt={1}>
                              <Flex justify="space-between" mb={0.5}>
                                <Text fontSize="11px" color="#1677FF">
                                  解析中 {file.parseProgress || 0}%
                                </Text>
                              </Flex>
                              <Box
                                w="full"
                                h="4px"
                                bg="#E8F4FF"
                                borderRadius="2px"
                                overflow="hidden"
                              >
                                <Box
                                  h="full"
                                  bg="#1677FF"
                                  borderRadius="2px"
                                  transition="width 0.3s ease"
                                  w={`${file.parseProgress || 0}%`}
                                />
                              </Box>
                            </Box>
                          )}
                          {file.parseStatus === 'parsed' && (
                            <Text fontSize="11px" color="#2BA471">
                              解析完成
                            </Text>
                          )}
                          {file.parseStatus === 'error' && (
                            <Text fontSize="11px" color="#D54941">
                              解析失败
                            </Text>
                          )}
                          {(!file.parseStatus || file.parseStatus === 'pending') && (
                            <Text fontSize="12px" color="#86909C">
                              {file.size || '0 B'}
                            </Text>
                          )}
                        </Box>
                        <IconButton
                          aria-label={t('aiTeacher.avatar.common.actions.delete')}
                          icon={
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
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
                          minW="24px"
                          h="24px"
                          _hover={{ color: 'red.500' }}
                          isDisabled={isMatching}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveCourseware(file.id);
                          }}
                        />
                      </Flex>
                      );
                    })}
                  </Flex>
                </Box>
              </Box>

              {/* 文件数量提示 */}
              <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
                {t('aiTeacher.avatar.common.units.uploadedFiles', {
                  count: displayCoursewareFiles.length,
                  max: MAX_COURSEWARE_FILES
                })}
              </Text>

              {/* 底部按钮 - 只在有文件时显示 */}
              <HStack mt={2} spacing={3}>
                <Button
                  flex="1"
                  bg="white"
                  color="gray.800"
                  border="1px solid"
                  borderColor="gray.300"
                  _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
                  onClick={() => coursewareInputRef.current?.click()}
                  isDisabled={
                    !draft.syllabusFile ||
                    isAnalyzing ||
                    displayCoursewareFiles.length >= MAX_COURSEWARE_FILES ||
                    isMatching
                  }
                >
                  {t('aiTeacher.avatar.create.step2.matching.continueUpload')}
                </Button>
                <Button
                  flex="1"
                  onClick={onStartMatching}
                  isDisabled={
                    !draft.syllabusFile ||
                    displayCoursewareFiles.length === 0 ||
                    isMatching ||
                    isParsingCourseware ||
                    displayCoursewareFiles.some((f) => f.parseStatus !== 'parsed')
                  }
                >
                  {isParsingCourseware
                    ? '解析中...'
                    : displayAnalysisCompleted
                      ? t('aiTeacher.avatar.create.step2.matching.reMatch')
                      : t('aiTeacher.avatar.create.step2.matching.start')}
                </Button>
              </HStack>
            </VStack>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              border="1px dashed"
              borderColor="#D9D9D9"
              borderRadius="12px"
              bg="white"
              py={12}
              textAlign="center"
              cursor={!draft.syllabusFile || isAnalyzing ? 'not-allowed' : 'pointer'}
              opacity={!draft.syllabusFile || isAnalyzing ? 0.6 : 1}
              _hover={!draft.syllabusFile || isAnalyzing ? {} : { borderColor: PRIMARY_COLOR }}
              onClick={() => {
                if (!draft.syllabusFile || isAnalyzing) {
                  return;
                }
                coursewareInputRef.current?.click();
              }}
            >
              {/* 云上传图标 */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 16V8M12 8L9 11M12 8L15 11"
                  stroke="#86909C"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 17.5C4 18.8807 5.11929 20 6.5 20H17.5C18.8807 20 20 18.8807 20 17.5C20 16.1193 18.8807 15 17.5 15H17.4492C17.188 12.321 14.9937 10.2222 12.292 10.2222C10.0599 10.2222 8.15163 11.5752 7.30708 13.5089C7.22131 13.5029 7.13456 13.5 7.04724 13.5C5.36441 13.5 4 14.8431 4 16.5V17.5Z"
                  stroke="#86909C"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <Text fontSize="14px" fontWeight={500} color="#1D2129" mt={3} mb={1}>
                {t('aiTeacher.avatar.create.step2.matching.uploadHint')}
              </Text>
              <Text fontSize="12px" color="#86909C" textAlign="center" lineHeight="22px">
                {t('aiTeacher.avatar.create.step2.matching.uploadSpec', {
                  count: MAX_COURSEWARE_FILES
                })}
              </Text>
            </Flex>
          )}
        </Box>

        {/* 匹配结果展示区域 */}
        <Box flex="1" overflowY="auto" minH={0}>
          {/* 状态1：已上传，未开始匹配 */}
          {displayCoursewareFiles.length > 0 && !isMatching && !displayAnalysisCompleted && (
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="full"
              mx={5}
              mb={5}
              py={8}
              border="1px solid"
              borderColor="#F2F3F5"
              borderRadius="16px"
              bg="white"
            >
              {/* 蓝色图标 */}
              <Box mb={4} w="60px" h="60px">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="60"
                  height="60"
                  viewBox="0 0 60 60"
                  fill="none"
                  dangerouslySetInnerHTML={{
                    __html: `<g filter="url(#f0_step2_analysis)">
    <rect width="36.8284" height="41.0892" rx="7.0878" transform="matrix(1 0 0.0544459 0.998517 10.1406 7.69336)" fill="url(#lg0_step2_analysis)" fill-opacity="0.1"/>
  </g>
  <g filter="url(#f1_step2_analysis)">
    <rect width="31.2861" height="36.3187" rx="6.02115" transform="matrix(1 0 0.0545748 0.99851 13.2065 9.79199)" fill="url(#lg1_step2_analysis)"/>
  </g>
  <path d="M30.2065 37.0982H21.2465L20.6497 25.7105H29.6097L30.2065 37.0982ZM40.7963 37.0972H31.8363L31.4953 30.5896H40.4552L40.7963 37.0972ZM40.371 28.9629H31.411L30.8142 17.5752H39.7742L40.371 28.9629ZM29.5254 24.0829H20.5654L20.2244 17.5752H29.1843L29.5254 24.0829Z" fill="url(#lg2_step2_analysis)"/>
  <g filter="url(#f2_step2_analysis)">
    <mask id="mask_step2_analysis" fill="white">
      <path d="M40.9553 30.5238C45.4161 29.2447 50.2576 31.7645 51.7686 36.1521C53.0818 39.966 51.4458 43.9347 48.0663 45.748L50.5754 53.0351L47.1744 54.0103L44.6653 46.7232C40.7565 47 36.9272 44.5984 35.614 40.7844C34.1033 36.3968 36.4947 31.8031 40.9553 30.5238ZM42.049 33.7002C39.3718 34.468 37.9366 37.225 38.8432 39.8584C39.75 42.4919 42.6556 44.0051 45.333 43.2376C48.0104 42.4698 49.4462 39.7117 48.5394 37.0781C47.6324 34.4447 44.7263 32.9325 42.049 33.7002Z"/>
    </mask>
    <path d="M40.9553 30.5238C45.4161 29.2447 50.2576 31.7645 51.7686 36.1521C53.0818 39.966 51.4458 43.9347 48.0663 45.748L50.5754 53.0351L47.1744 54.0103L44.6653 46.7232C40.7565 47 36.9272 44.5984 35.614 40.7844C34.1033 36.3968 36.4947 31.8031 40.9553 30.5238ZM42.049 33.7002C39.3718 34.468 37.9366 37.225 38.8432 39.8584C39.75 42.4919 42.6556 44.0051 45.333 43.2376C48.0104 42.4698 49.4462 39.7117 48.5394 37.0781C47.6324 34.4447 44.7263 32.9325 42.049 33.7002Z" fill="url(#rg3_step2_analysis)" fill-opacity="0.5"/>
    <path d="M40.9553 30.5238L40.8113 30.1057L40.8113 30.1057L40.9553 30.5238ZM51.7686 36.1521L52.1937 36.0302L52.1937 36.0302L51.7686 36.1521ZM48.0663 45.748L47.8364 45.3646L47.5248 45.5318L47.6412 45.8699L48.0663 45.748ZM50.5754 53.0351L50.7194 53.4532L51.1445 53.3313L51.0006 52.9132L50.5754 53.0351ZM47.1744 54.0103L46.7493 54.1322L46.8933 54.5504L47.3184 54.4285L47.1744 54.0103ZM44.6653 46.7232L45.0904 46.6013L44.974 46.2632L44.6135 46.2888L44.6653 46.7232ZM35.614 40.7844L35.1888 40.9063L35.1888 40.9063L35.614 40.7844ZM42.049 33.7002L41.905 33.282L41.905 33.2821L42.049 33.7002ZM38.8432 39.8584L38.4181 39.9803L38.4181 39.9803L38.8432 39.8584ZM45.333 43.2376L45.4769 43.6557L45.4769 43.6557L45.333 43.2376ZM48.5394 37.0781L48.9645 36.9562L48.9645 36.9562L48.5394 37.0781ZM40.9553 30.5238L41.0992 30.942C45.3253 29.7302 49.9121 32.1174 51.3435 36.2741L51.7686 36.1521L52.1937 36.0302C50.6032 31.4116 45.5068 28.7593 40.8113 30.1057L40.9553 30.5238ZM51.7686 36.1521L51.3435 36.274C52.5874 39.8865 51.038 43.6469 47.8364 45.3646L48.0663 45.748L48.2962 46.1313C51.8536 44.2226 53.5763 40.0455 52.1937 36.0302L51.7686 36.1521ZM48.0663 45.748L47.6412 45.8699L50.1503 53.157L50.5754 53.0351L51.0006 52.9132L48.4914 45.6261L48.0663 45.748ZM50.5754 53.0351L50.4315 52.6169L47.0304 53.5922L47.1744 54.0103L47.3184 54.4285L50.7194 53.4532L50.5754 53.0351ZM47.1744 54.0103L47.5995 53.8884L45.0904 46.6013L44.6653 46.7232L44.2401 46.8451L46.7493 54.1322L47.1744 54.0103ZM44.6653 46.7232L44.6135 46.2888C40.9105 46.551 37.283 44.2752 36.0391 40.6625L35.614 40.7844L35.1888 40.9063C36.5714 44.9216 40.6024 47.449 44.717 47.1576L44.6653 46.7232ZM35.614 40.7844L36.0391 40.6625C34.608 36.5058 36.8734 32.1539 41.0993 30.942L40.9553 30.5238L40.8113 30.1057C36.1159 31.4522 33.5987 36.2877 35.1888 40.9063L35.614 40.7844ZM42.049 33.7002L41.905 33.2821C38.9931 34.1172 37.432 37.116 38.4181 39.9803L38.8432 39.8584L39.2683 39.7366C38.4412 37.3341 39.7506 34.8188 42.193 34.1183L42.049 33.7002ZM38.8432 39.8584L38.4181 39.9803C39.4043 42.8447 42.5647 44.4906 45.4769 43.6557L45.333 43.2376L45.189 42.8194C42.7465 43.5196 40.0956 42.1392 39.2683 39.7365L38.8432 39.8584ZM45.333 43.2376L45.4769 43.6557C48.3891 42.8206 49.9508 39.8207 48.9645 36.9562L48.5394 37.0781L48.1142 37.2C48.9415 39.6026 47.6316 42.119 45.189 42.8194L45.333 43.2376ZM48.5394 37.0781L48.9645 36.9562C47.978 34.0918 44.817 32.447 41.905 33.282L42.049 33.7002L42.193 34.1183C44.6356 33.4179 47.2869 34.7976 48.1143 37.2L48.5394 37.0781Z" fill="url(#lg4_step2_analysis)" mask="url(#mask_step2_analysis)"/>
  </g>
  <defs>
    <filter id="f0_step2_analysis" x="6.21899" y="3.39648" width="46.9088" height="49.6221" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="1.07422" dy="-1.07422"/>
      <feGaussianBlur stdDeviation="0.698243"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.36 0"/>
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1621_15605"/>
    </filter>
    <filter id="f1_step2_analysis" x="13.5261" y="8.87943" width="33.5416" height="37.1772" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="0.912561" dy="-0.912561"/>
      <feGaussianBlur stdDeviation="0.593164"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.17 0"/>
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1621_15605"/>
    </filter>
    <filter id="f2_step2_analysis" x="28.7043" y="23.7347" width="29.9739" height="36.7328" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="-0.884487" dy="-0.442244"/>
      <feGaussianBlur stdDeviation="0.884487"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.47 0"/>
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1621_15605"/>
    </filter>
    <linearGradient id="lg0_step2_analysis" x1="18.4142" y1="0" x2="18.4142" y2="41.0892" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4376F9"/>
      <stop offset="1" stop-color="#80B4F2"/>
    </linearGradient>
    <linearGradient id="lg1_step2_analysis" x1="15.643" y1="0" x2="15.643" y2="36.3187" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4376F9"/>
      <stop offset="1" stop-color="#80B4F2"/>
    </linearGradient>
    <linearGradient id="lg2_step2_analysis" x1="29.9988" y1="17.5752" x2="29.9988" y2="37.0982" gradientUnits="userSpaceOnUse">
      <stop stop-color="white" stop-opacity="0.76"/>
      <stop offset="1" stop-color="white" stop-opacity="0.47"/>
    </linearGradient>
    <radialGradient id="rg3_step2_analysis" cx="0" cy="0" r="1" gradientTransform="matrix(6.65427 12.9953 -17.2664 7.06828 39.8369 35.2048)" gradientUnits="userSpaceOnUse">
      <stop offset="0.397658" stop-color="#31FFE6"/>
      <stop offset="1" stop-color="#8AF1FF"/>
    </radialGradient>
    <linearGradient id="lg4_step2_analysis" x1="36.1205" y1="31.4073" x2="55.1644" y2="36.8851" gradientUnits="userSpaceOnUse">
      <stop stop-color="white" stop-opacity="0"/>
      <stop offset="0.46875" stop-color="white" stop-opacity="0.72"/>
      <stop offset="1" stop-color="white" stop-opacity="0"/>
    </linearGradient>
  </defs>`
                  }}
                />
              </Box>
              <Text fontSize="lg" fontWeight={600} color="gray.800" mb={2}>
                {t('aiTeacher.avatar.create.step2.matching.analysisTitle')}
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                {t('aiTeacher.avatar.create.step2.matching.analysisHint')}
              </Text>

              {/* 步骤指示器 */}
              <HStack spacing={4} mt="110px">
                <HStack spacing={2}>
                  <Flex
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    bg={draft.syllabusFile ? PRIMARY_COLOR : 'gray.300'}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    {draft.syllabusFile && <CheckIcon color="white" boxSize={2} />}
                  </Flex>
                  <Text
                    fontSize="xs"
                    color={draft.syllabusFile ? 'gray.800' : 'gray.400'}
                    whiteSpace="nowrap"
                  >
                    {t('aiTeacher.avatar.create.step2.matching.checklist.syllabus')}
                  </Text>
                </HStack>
                <Box
                  as="svg"
                  width="20px"
                  height="10px"
                  viewBox="0 0 20 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  flexShrink={0}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.102296 2.0359C-0.436537 0.600171 1.27186 -0.623862 2.45776 0.348405L5.79077 3.0818C6.76672 3.88194 6.76669 5.37441 5.79077 6.17458L2.45776 8.90798C1.27191 9.88021 -0.436349 8.65712 0.102296 7.22145L0.811281 5.33083C0.981222 4.87783 0.981286 4.37854 0.811281 3.92555L0.102296 2.0359ZM13.5808 2.0359C13.042 0.600171 14.7504 -0.623862 15.9363 0.348405L19.2693 3.0818C20.2453 3.88195 20.2453 5.37443 19.2693 6.17458L15.9363 8.90798C14.7504 9.88019 13.0422 8.65709 13.5808 7.22145L14.2898 5.33083C14.4598 4.87781 14.4598 4.37856 14.2898 3.92555L13.5808 2.0359Z"
                    fill="#F2F3F5"
                  />
                </Box>
                <HStack spacing={2}>
                  <Flex
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    bg={displayCoursewareFiles.length > 0 ? PRIMARY_COLOR : 'gray.300'}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    {displayCoursewareFiles.length > 0 && <CheckIcon color="white" boxSize={2} />}
                  </Flex>
                  <Text
                    fontSize="xs"
                    color={displayCoursewareFiles.length > 0 ? 'gray.800' : 'gray.400'}
                    whiteSpace="nowrap"
                  >
                    {t('aiTeacher.avatar.create.step2.matching.checklist.courseware')}
                  </Text>
                </HStack>
                <Box
                  as="svg"
                  width="20px"
                  height="10px"
                  viewBox="0 0 20 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  flexShrink={0}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.102296 2.0359C-0.436537 0.600171 1.27186 -0.623862 2.45776 0.348405L5.79077 3.0818C6.76672 3.88194 6.76669 5.37441 5.79077 6.17458L2.45776 8.90798C1.27191 9.88021 -0.436349 8.65712 0.102296 7.22145L0.811281 5.33083C0.981222 4.87783 0.981286 4.37854 0.811281 3.92555L0.102296 2.0359ZM13.5808 2.0359C13.042 0.600171 14.7504 -0.623862 15.9363 0.348405L19.2693 3.0818C20.2453 3.88195 20.2453 5.37443 19.2693 6.17458L15.9363 8.90798C14.7504 9.88019 13.0422 8.65709 13.5808 7.22145L14.2898 5.33083C14.4598 4.87781 14.4598 4.37856 14.2898 3.92555L13.5808 2.0359Z"
                    fill="#F2F3F5"
                  />
                </Box>
                <HStack spacing={2}>
                  <Flex
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    bg="gray.300"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  />
                  <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">
                    {t('aiTeacher.avatar.create.step2.matching.checklist.analysis')}
                  </Text>
                </HStack>
              </HStack>
            </Flex>
          )}

          {/* 状态2：匹配中 */}
          {isMatching && (
            <Flex
              direction="column"
              align="center"
              justify="center"
              h="full"
              mx={5}
              mb={5}
              py={8}
              border="1px solid"
              borderColor="#F2F3F5"
              borderRadius="16px"
              bg="white"
            >
              {/* 加载动画（参考课件上传中的加载样式） */}
              <Box
                as="span"
                display="inline-block"
                w="56px"
                h="56px"
                border="4px solid"
                borderColor="blue.200"
                borderTopColor="blue.500"
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
              <Text fontSize="lg" fontWeight={600} color="gray.800" mb={1}>
                {t('aiTeacher.avatar.create.step2.matching.analyzing.title')}
              </Text>
              <Text fontSize="sm" color="gray.500" mb={4}>
                {t('aiTeacher.avatar.create.step2.matching.analyzing.subtitle')}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {t('aiTeacher.avatar.create.step2.matching.analyzing.description')}
              </Text>
            </Flex>
          )}

          {/* 状态3：匹配完成 */}
          {!isMatching &&
            displayAnalysisCompleted &&
            (() => {
              // 计算统计数据
              const rawChapters = displayMatchResult?.chapters || [];
              // 归一化：无 sections 的章包装成虚拟节
              const matchChapters = rawChapters.map((chapter: any) => {
                if (chapter.sections && Array.isArray(chapter.sections)) {
                  return chapter;
                }
                return {
                  ...chapter,
                  sections: [
                    {
                      section_name: t('aiTeacher.avatar.create.step2.matching.generalContent'),
                      status: chapter.status,
                      covered_files: chapter.covered_files
                    }
                  ]
                };
              });

              // 统计各状态的section数量（不是章节数量）
              // 合并"已覆盖"和"部分覆盖"为"已覆盖"，只保留"已覆盖/缺失"两种展示
              let coveredSections = 0;
              let uncoveredSections = 0;
              let totalSections = 0;

              matchChapters.forEach((chapter: any) => {
                if (chapter.sections && Array.isArray(chapter.sections)) {
                  chapter.sections.forEach((section: any) => {
                    totalSections++;
                    if (section.status === STATUS_COVERED || section.status === STATUS_PARTIAL) {
                      coveredSections++;
                    } else if (section.status === STATUS_UNCOVERED) {
                      uncoveredSections++;
                    }
                  });
                }
              });

              // 计算整体匹配度（基于 status）
              // 已覆盖和部分覆盖都算作已覆盖，缺失为未覆盖
              let totalSectionsForScore = 0;
              let coveredCount = 0;

              matchChapters.forEach((chapter: any) => {
                chapter.sections?.forEach((section: any) => {
                  totalSectionsForScore++;
                  if (section.status === STATUS_COVERED || section.status === STATUS_PARTIAL) {
                    coveredCount++;
                  }
                });
              });

              const overallCoverage =
                totalSectionsForScore > 0 ? coveredCount / totalSectionsForScore : 0;

              return (
                <VStack
                  align="stretch"
                  spacing={4}
                  border="1px solid"
                  borderColor="#F2F3F5"
                  borderRadius="16px"
                  p={5}
                  mx={5}
                  mb={5}
                  bg="white"
                >
                  {/* 总体匹配度摘要 */}
                  <Flex direction="column" align="center" py={6}>
                    {/* 圆形进度条 */}
                    <Box position="relative" mb={4}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#f0f0f0"
                          strokeWidth="6"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={PRIMARY_COLOR}
                          strokeWidth="6"
                          strokeDasharray="264"
                          strokeDashoffset={264 * (1 - overallCoverage)}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <Flex
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        align="center"
                        justify="center"
                      >
                        <Text fontSize="xl" fontWeight={600} color={PRIMARY_COLOR}>
                          {Math.round(overallCoverage * 100)}%
                        </Text>
                      </Flex>
                    </Box>
                    <Text fontSize="md" fontWeight={600} color="gray.800" mb={1}>
                      {t('aiTeacher.avatar.create.step2.matching.resultTitle')}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      {t('aiTeacher.avatar.create.step2.matching.overallScore')}
                    </Text>
                    <HStack spacing="4px" fontSize="sm" color="gray.600">
                      <Text>共识别</Text>
                      <Text color="#2BA471" fontWeight={600}>
                        {totalSections}
                      </Text>
                      <Text>个节，</Text>
                      <Text color="#2BA471" fontWeight={600}>
                        {coveredSections}
                      </Text>
                      <Text>个已覆盖，</Text>
                      <Text color="#D54941" fontWeight={600}>
                        {uncoveredSections}
                      </Text>
                      <Text>个缺失</Text>
                    </HStack>
                  </Flex>

                  {/* 章节匹配结果 */}
                  {matchChapters.map((chapter: any, chapterIndex: number) => {
                    const isChapterExpanded = expandedMatchChapters.has(chapterIndex);
                    return (
                      <Box key={chapterIndex} mb={2}>
                        {/* 章标题 - 可折叠 */}
                        <Flex
                          align="center"
                          py={3}
                          cursor="pointer"
                          onClick={() => toggleMatchChapter(chapterIndex)}
                        >
                          <HStack spacing="6px">
                            {isChapterExpanded ? (
                              <ChevronDownIcon color="#86909C" boxSize={4} />
                            ) : (
                              <ChevronRightIcon color="#86909C" boxSize={4} />
                            )}
                            <Text fontWeight={500} fontSize="14px" color="#333333">
                              {chapter.chapter_name}
                            </Text>
                          </HStack>
                        </Flex>

                        {/* 节列表 */}
                        <Collapse in={isChapterExpanded} animateOpacity>
                          <VStack align="stretch" spacing={0} pl="22px">
                            {chapter.sections?.map((section: any, sectionIndex: number) => {
                              const status = section.status;
                              const isMissing = status === STATUS_UNCOVERED;

                              return (
                                <Box key={sectionIndex}>
                                  {/* 节标题行 */}
                                  <Flex align="center" justify="space-between" py={2}>
                                    <Text fontSize="13px" color="#4E5969">
                                      {section.section_name}
                                    </Text>
                                    <HStack spacing={2}>
                                      <Badge
                                        px={2}
                                        py="2px"
                                        borderRadius="4px"
                                        fontSize="12px"
                                        fontWeight={400}
                                        bg={
                                          status === STATUS_COVERED || status === STATUS_PARTIAL
                                            ? '#E3F9E9'
                                            : '#FFF0ED'
                                        }
                                        color={
                                          status === STATUS_COVERED || status === STATUS_PARTIAL
                                            ? '#2BA471'
                                            : '#D54941'
                                        }
                                      >
                                        {status === STATUS_COVERED
                                          ? t('aiTeacher.avatar.create.step2.matching.covered')
                                          : status === STATUS_PARTIAL
                                            ? t('aiTeacher.avatar.create.step2.matching.covered')
                                            : t('aiTeacher.avatar.create.step2.matching.missing')}
                                      </Badge>
                                      <HStack
                                        spacing="4px"
                                        color="#C8000B"
                                        cursor="pointer"
                                        fontSize="12px"
                                        onClick={() =>
                                          handleOpenResourceModal(chapterIndex, sectionIndex)
                                        }
                                      >
                                        <Text fontSize="14px" lineHeight="1">
                                          +
                                        </Text>
                                        <Text fontSize="12px">
                                          {t(
                                            'aiTeacher.avatar.create.step2.matching.addFromWorkspace'
                                          )}
                                        </Text>
                                      </HStack>
                                    </HStack>
                                  </Flex>

                                  {/* 覆盖该节的文件列表 */}
                                  {section.covered_files && section.covered_files.length > 0 && (
                                    <VStack align="stretch" spacing={2} pl={2} pb={2}>
                                      {section.covered_files.map((file: any, fileIndex: number) => (
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
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 16 16"
                                                fill="none"
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
                                            onClick={() =>
                                              handleRemoveMatchFile(
                                                chapterIndex,
                                                sectionIndex,
                                                fileIndex
                                              )
                                            }
                                          />
                                        </Flex>
                                      ))}
                                    </VStack>
                                  )}
                                </Box>
                              );
                            })}
                          </VStack>
                        </Collapse>
                      </Box>
                    );
                  })}

                  {/* 如果没有数据，显示提示 */}
                  {matchChapters.length === 0 && (
                    <Box p={4} bg="gray.50" borderRadius="lg" textAlign="center">
                      <Text fontSize="sm" color="gray.500">
                        {t('aiTeacher.avatar.create.step2.matching.noResults')}
                      </Text>
                    </Box>
                  )}
                </VStack>
              );
            })()}
        </Box>

        {/* 上传资源弹窗 */}
        <UploadResourceModal
          isOpen={isResourceModalOpen}
          onClose={onResourceModalClose}
          onConfirm={handleConfirmResource}
          chapterTitle={resourceModalChapterTitle}
        />

        {/* 课件上传中的遮罩层 - 覆盖整个右侧卡片 */}
        {isUploadingCourseware && (
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(255, 255, 255, 0.95)"
            backdropFilter="blur(4px)"
            align="center"
            justify="center"
            zIndex={10}
            borderRadius="20px"
            direction="column"
          >
            {/* 加载动画 */}
            <Box
              as="span"
              display="inline-block"
              w="56px"
              h="56px"
              border="4px solid"
              borderColor="blue.200"
              borderTopColor="blue.500"
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
              {t('aiTeacher.avatar.create.step2.matching.uploadingCourseware')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t('aiTeacher.avatar.create.step2.matching.uploadingCoursewareDesc')}
            </Text>
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
