import { AddIcon, ChevronRightIcon, ViewIcon, DownloadIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  Flex,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  useDisclosure,
  Icon,
  HStack,
  Badge,
  useToast,
  IconButton,
  Tooltip,
  RadioGroup,
  Radio,
  Stack
} from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { ChapterData, CoursewareItem } from '../constants';
import type { AiAvatarDetailVO } from '@/teacher/types/aiTeacher';
import { PRIMARY_COLOR, SUCCESS_COLOR } from '../constants';
import { uploadPrivateFile } from '@/teacher/api/file';
import UploadResourceModal from '../../create/components/Step2TeachingPath/UploadResourceModal';

type TabChaptersProps = {
  chapters: ChapterData[];
  selectedSection: string | null;
  onSectionSelect: (sectionId: string) => void;
  onChaptersChange: (chapters: ChapterData[]) => void;
  avatarDetail?: AiAvatarDetailVO | null; // 添加 avatarDetail prop
};

type EditTarget = {
  type: 'chapter' | 'section';
  id: string;
  chapterId?: string;
  isNew?: boolean;
};

export function TabChapters({
  chapters,
  selectedSection,
  onSectionSelect,
  onChaptersChange,
  avatarDetail
}: TabChaptersProps) {
  const { t } = useTranslation('teacher');
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
  const {
    isOpen: isDeleteCoursewareOpen,
    onOpen: onDeleteCoursewareOpen,
    onClose: onDeleteCoursewareClose
  } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editName, setEditName] = useState('');
  const [editOpenMode, setEditOpenMode] = useState<'unlimited' | 'scheduled' | 'prerequisite'>(
    'unlimited'
  );
  const [editOpenTime, setEditOpenTime] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EditTarget | null>(null);
  const [deleteCoursewareTarget, setDeleteCoursewareTarget] = useState<CoursewareItem | null>(null);
  const [previewCourseware, setPreviewCourseware] = useState<CoursewareItem | null>(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map((c) => c.id))
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  // 当前选中的章（当章下没有节时，可选中章以添加课件）
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // 创作空间弹窗状态
  const {
    isOpen: isResourceModalOpen,
    onOpen: onResourceModalOpen,
    onClose: onResourceModalClose
  } = useDisclosure();
  const [resourceModalTitle, setResourceModalTitle] = useState('');

  // 添加章
  const handleAddChapter = () => {
    const maxId = chapters.reduce((max, c) => Math.max(max, parseInt(c.id)), 0);
    const newId = String(maxId + 1);

    setEditTarget({ type: 'chapter', id: newId, isNew: true });
    setEditName('');
    setEditOpenMode('unlimited');
    setEditOpenTime('');
    onEditOpen();
  };

  // 添加节
  const handleAddSection = (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    const maxSectionNum = chapter.sections.reduce((max, s) => {
      const num = parseInt(s.id.split('-')[1]);
      return Math.max(max, num);
    }, 0);
    const newSectionId = `${chapterId}-${maxSectionNum + 1}`;

    // 确保章节展开
    setExpandedChapters((prev) => new Set([...prev, chapterId]));

    setEditTarget({ type: 'section', id: newSectionId, chapterId, isNew: true });
    setEditName('');
    setEditOpenMode('unlimited');
    setEditOpenTime('');
    onEditOpen();
  };

  // 编辑章
  const handleEditChapter = (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    setEditTarget({ type: 'chapter', id: chapterId });
    setEditName(chapter.title);
    setEditOpenMode(chapter.openMode || 'unlimited');
    setEditOpenTime(chapter.openTime || '');
    onEditOpen();
  };

  // 编辑节
  const handleEditSection = (e: React.MouseEvent, sectionId: string) => {
    e.stopPropagation();
    const chapter = chapters.find((c) => c.sections.some((s) => s.id === sectionId));
    if (!chapter) return;

    const section = chapter.sections.find((s) => s.id === sectionId);
    if (!section) return;

    setEditTarget({ type: 'section', id: sectionId, chapterId: chapter.id });
    setEditName(section.title);
    setEditOpenMode(section.openMode || 'unlimited');
    setEditOpenTime(section.openTime || '');
    onEditOpen();
  };

  // 删除章
  const handleDeleteChapter = (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    if (chapter.sections.length > 0) {
      toast({
        title: t('aiTeacher.avatar.edit.chapters.deleteChapterWithSections'),
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setDeleteTarget({ type: 'chapter', id: chapterId });
    onDeleteOpen();
  };

  // 删除节
  const handleDeleteSection = (e: React.MouseEvent, sectionId: string) => {
    e.stopPropagation();
    const chapter = chapters.find((c) => c.sections.some((s) => s.id === sectionId));
    if (!chapter) return;

    const section = chapter.sections.find((s) => s.id === sectionId);
    if (!section) return;

    setDeleteTarget({ type: 'section', id: sectionId, chapterId: chapter.id });
    onDeleteOpen();
  };

  // 确认编辑
  const handleConfirmEdit = () => {
    if (!editName.trim()) {
      toast({
        title: t('aiTeacher.avatar.edit.chapters.enterName'),
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!editTarget) return;

    if (editTarget.type === 'chapter') {
      if (editTarget.isNew) {
        // 添加新章
        const newChapter: ChapterData = {
          id: editTarget.id,
          title: editName,
          openMode: editOpenMode,
          openTime: editOpenMode === 'scheduled' ? editOpenTime || undefined : undefined,
          sections: [],
          coursewareCount: 0,
          coursewareList: []
        };
        onChaptersChange([...chapters, newChapter]);
        setExpandedChapters((prev) => new Set([...prev, editTarget.id]));
      } else {
        // 编辑章
        onChaptersChange(
          chapters.map((c) =>
            c.id === editTarget.id
              ? {
                  ...c,
                  title: editName,
                  openMode: editOpenMode,
                  openTime: editOpenMode === 'scheduled' ? editOpenTime || undefined : undefined
                }
              : c
          )
        );
      }
    } else if (editTarget.type === 'section' && editTarget.chapterId) {
      if (editTarget.isNew) {
        // 添加新节
        onChaptersChange(
          chapters.map((c) =>
            c.id === editTarget.chapterId
              ? {
                  ...c,
                  sections: [
                    ...c.sections,
                    {
                      id: editTarget.id,
                      title: editName,
                      openMode: editOpenMode,
                      openTime:
                        editOpenMode === 'scheduled' ? editOpenTime || undefined : undefined,
                      knowledgeCount: 0,
                      coursewareCount: 0,
                      hasStudents: false
                    }
                  ]
                }
              : c
          )
        );
      } else {
        // 编辑节
        onChaptersChange(
          chapters.map((c) =>
            c.id === editTarget.chapterId
              ? {
                  ...c,
                  sections: c.sections.map((s) =>
                    s.id === editTarget.id
                      ? {
                          ...s,
                          title: editName,
                          openMode: editOpenMode,
                          openTime:
                            editOpenMode === 'scheduled' ? editOpenTime || undefined : undefined
                        }
                      : s
                  )
                }
              : c
          )
        );
      }
    }

    onEditClose();
    setEditTarget(null);
    setEditName('');
    setEditOpenMode('unlimited');
    setEditOpenTime('');
  };

  // 确认删除
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'chapter') {
      onChaptersChange(chapters.filter((c) => c.id !== deleteTarget.id));
    } else if (deleteTarget.type === 'section' && deleteTarget.chapterId) {
      onChaptersChange(
        chapters.map((c) =>
          c.id === deleteTarget.chapterId
            ? { ...c, sections: c.sections.filter((s) => s.id !== deleteTarget.id) }
            : c
        )
      );
    }

    onDeleteClose();
    setDeleteTarget(null);
  };

  // 切换章节展开/折叠
  const toggleChapter = (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // 计算章节的知识点总数
  const getChapterKnowledgeCount = (chapter: ChapterData) => {
    return chapter.sections.reduce((sum, s) => sum + s.knowledgeCount, 0);
  };

  // 获取小节的知识点列表（用于 Tooltip 显示）
  const getSectionKnowledgePoints = (sectionId: string): string[] => {
    if (!avatarDetail) return [];

    // 从 avatarDetail 中查找对应的小节
    for (const chapter of avatarDetail.chapterList) {
      const section = chapter.children.find((s) => s.id === parseInt(sectionId));
      if (section && section.knowledgePoints) {
        // 将知识点转换为字符串数组
        return section.knowledgePoints.map((kp) => (typeof kp === 'string' ? kp : kp.name));
      }
    }
    return [];
  };

  // 获取当前选中目标（章或节）的课件列表
  const getCurrentCourseware = (): CoursewareItem[] => {
    if (selectedSection) {
      const section = chapters.flatMap((c) => c.sections).find((s) => s.id === selectedSection);
      return section?.coursewareList || [];
    }
    if (selectedChapterId) {
      const chapter = chapters.find((c) => c.id === selectedChapterId);
      return chapter?.coursewareList || [];
    }
    return [];
  };

  // 根据文件类型获取图标和颜色
  const getFileIconAndColor = (
    type: string
  ): { icon: string; bgColor: string; iconColor: string } => {
    const fileType = type.toLowerCase();
    if (fileType.includes('video') || fileType.includes('mp4')) {
      return { icon: '🎬', bgColor: '#FFF1F0', iconColor: '#C8000B' };
    }
    if (fileType.includes('pdf')) {
      return { icon: '📄', bgColor: '#FFF0E6', iconColor: '#FA541C' };
    }
    if (
      fileType.includes('doc') ||
      fileType.includes('word') ||
      fileType.includes('application/msword')
    ) {
      return { icon: '📝', bgColor: '#E6F4FF', iconColor: '#1677FF' };
    }
    if (
      fileType.includes('ppt') ||
      fileType.includes('powerpoint') ||
      fileType.includes('presentation')
    ) {
      return { icon: '📊', bgColor: '#FFF2E8', iconColor: '#FA8C16' };
    }
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg')) {
      return { icon: '🖼️', bgColor: '#F6FFED', iconColor: '#52C41A' };
    }
    if (fileType.includes('audio') || fileType.includes('mp3')) {
      return { icon: '🎵', bgColor: '#FFF7E6', iconColor: '#FAAD14' };
    }
    return { icon: '📎', bgColor: '#F5F5F5', iconColor: '#8C8C8C' };
  };

  // 打开创作空间弹窗
  const handleOpenUpload = () => {
    if (selectedSection) {
      const section = chapters.flatMap((c) => c.sections).find((s) => s.id === selectedSection);
      setResourceModalTitle(section?.title || '');
    } else if (selectedChapterId) {
      const chapter = chapters.find((c) => c.id === selectedChapterId);
      setResourceModalTitle(chapter?.title || '');
    }
    onResourceModalOpen();
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 文件类型验证
    const allowedTypes = [
      // 视频
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-matroska',
      // 文档
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // 图片
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      // 音频
      'audio/mpeg',
      'audio/wav',
      'audio/aac',
      'audio/ogg',
      'audio/flac',
      'audio/mp4'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('aiTeacher.avatar.edit.chapters.fileTypeNotSupported'),
        description: t('aiTeacher.avatar.edit.chapters.fileTypeNotSupportedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    // 文件大小验证
    const maxSizes: Record<string, number> = {
      video: 2 * 1024 * 1024 * 1024, // 2GB
      audio: 200 * 1024 * 1024, // 200MB
      application: 500 * 1024 * 1024, // 500MB
      image: 50 * 1024 * 1024 // 50MB
    };

    const fileTypeCategory = file.type.split('/')[0];
    const maxSize = maxSizes[fileTypeCategory] || maxSizes.application;

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      toast({
        title: t('aiTeacher.avatar.edit.chapters.fileTooLarge'),
        description: t('aiTeacher.avatar.edit.chapters.fileTooLargeDesc', { size: maxSizeMB }),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setSelectedFile(file);
  };

  // 清除文件
  const handleClearFile = () => {
    setSelectedFile(null);
  };

  // 确认添加创作空间资源
  const handleConfirmResource = (
    resources: Array<{
      id: string;
      title: string;
      fileKey?: string | null;
      fileName?: string;
      fileSize?: number;
      iconType?: string;
      fileUrl?: string;
      fileType?: string;
    }>
  ) => {
    if (resources.length === 0) return;
    if (!selectedSection && !selectedChapterId) return;

    const targetId = selectedSection || selectedChapterId;
    const isChapterTarget = !selectedSection && !!selectedChapterId;

    // 根据 fileType 和文件名映射前端展示用的 type
    const getDisplayType = (fileType?: string, fileName?: string): CoursewareItem['type'] => {
      const ft = (fileType || '').toLowerCase();
      const name = (fileName || '').toLowerCase();

      // openmaic 始终使用 iframe 预览
      if (ft === 'openmaic') return 'iframe';

      // digital 类型：.html/.htm 使用 iframe，其他后缀继续走文件名判断
      // 根据文件名后缀判断预览格式
      if (name.endsWith('.pdf')) return 'pdf';
      if (name.endsWith('.doc') || name.endsWith('.docx')) return 'doc';
      if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'ppt';
      if (name.endsWith('.html') || name.endsWith('.htm')) return 'iframe';
      if (
        name.endsWith('.mp4') ||
        name.endsWith('.avi') ||
        name.endsWith('.mov') ||
        name.endsWith('.wmv') ||
        name.endsWith('.mkv') ||
        name.endsWith('.flv') ||
        name.endsWith('.webm')
      )
        return 'video';
      if (
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.gif') ||
        name.endsWith('.bmp') ||
        name.endsWith('.webp') ||
        name.endsWith('.svg')
      )
        return 'image';
      if (
        name.endsWith('.mp3') ||
        name.endsWith('.wav') ||
        name.endsWith('.flac') ||
        name.endsWith('.aac') ||
        name.endsWith('.ogg') ||
        name.endsWith('.m4a') ||
        name.endsWith('.wma')
      )
        return 'audio';

      return 'pdf';
    };

    const newCoursewareList = resources.map((res) => {
      const sizeStr =
        res.fileSize && res.fileSize > 0 ? `${(res.fileSize / 1024 / 1024).toFixed(2)}MB` : '-';

      // AI主讲课和数字课件 fileKey 为 null，不传 fileKey；其他类型传递 fileKey
      const hasFileKey = res.fileKey !== null && res.fileKey !== undefined && res.fileKey !== '';
      return {
        id: res.id,
        sectionId: targetId,
        name: res.fileName || res.title,
        size: sizeStr,
        date: new Date().toISOString().split('T')[0],
        type: getDisplayType(res.fileType, res.fileName || res.title),
        hasStudyRecord: false,
        fileUrl: res.fileUrl || '',
        fileKey: hasFileKey ? (res.fileKey as string) : '',
        fileType: res.fileType || 'other'
      };
    });

    if (isChapterTarget) {
      const updatedChapters = chapters.map((chapter) =>
        chapter.id === selectedChapterId
          ? {
              ...chapter,
              coursewareCount: chapter.coursewareCount + newCoursewareList.length,
              coursewareList: [...(chapter.coursewareList || []), ...newCoursewareList]
            }
          : chapter
      );
      onChaptersChange(updatedChapters);
    } else {
      const updatedChapters = chapters.map((chapter) => ({
        ...chapter,
        sections: chapter.sections.map((section) =>
          section.id === selectedSection
            ? {
                ...section,
                coursewareCount: section.coursewareCount + newCoursewareList.length,
                coursewareList: [...(section.coursewareList || []), ...newCoursewareList]
              }
            : section
        )
      }));
      onChaptersChange(updatedChapters);
    }

    toast({
      title: t('aiTeacher.avatar.edit.chapters.coursewareUploaded'),
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top'
    });
  };

  // 确认上传
  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      toast({
        title: t('aiTeacher.avatar.edit.chapters.selectFileFirst'),
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (!selectedSection && !selectedChapterId) {
      toast({
        title: t('aiTeacher.avatar.edit.chapters.selectSectionFirst'),
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    const targetId = selectedSection || selectedChapterId;
    const isChapterTarget = !selectedSection && !!selectedChapterId;

    setIsUploading(true);

    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('=== 开始上传课件 ===');
      console.log('文件名:', selectedFile.name);
      console.log('文件大小:', selectedFile.size, 'bytes');
      console.log('文件类型:', selectedFile.type);
      console.log('当前页面路径:', window.location.pathname);
      console.log('当前页面完整URL:', window.location.href);
      console.log('FormData entries:', Array.from(formData.entries()));

      // 上传文件
      const result = await uploadPrivateFile(formData);

      console.log('=== 上传成功 ===');
      console.log('返回结果:', result);

      // 创建课件项
      const newCourseware: CoursewareItem = {
        id: result.fileKey,
        sectionId: targetId,
        name: selectedFile.name,
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
        date: new Date().toISOString().split('T')[0],
        type: selectedFile.type.includes('video')
          ? 'video'
          : selectedFile.type.includes('pdf')
            ? 'pdf'
            : selectedFile.type.includes('powerpoint') || selectedFile.type.includes('presentation')
              ? 'ppt'
              : selectedFile.type.includes('word') || selectedFile.type.includes('msword')
                ? 'doc'
                : selectedFile.type.includes('image')
                  ? 'image'
                  : selectedFile.type.includes('audio')
                    ? 'audio'
                    : 'pdf',
        hasStudyRecord: false,
        fileUrl: result.fileUrl,
        fileKey: result.fileKey
      };

      toast({
        title: t('aiTeacher.avatar.edit.chapters.coursewareUploaded'),
        description: t('aiTeacher.avatar.edit.chapters.coursewareUploadedDesc', {
          name: selectedFile.name
        }),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });

      // 更新章节数据：增加课件数量并添加到课件列表
      if (isChapterTarget) {
        const updatedChapters = chapters.map((chapter) =>
          chapter.id === selectedChapterId
            ? {
                ...chapter,
                coursewareCount: chapter.coursewareCount + 1,
                coursewareList: [...(chapter.coursewareList || []), newCourseware]
              }
            : chapter
        );
        onChaptersChange(updatedChapters);
      } else {
        const updatedChapters = chapters.map((chapter) => ({
          ...chapter,
          sections: chapter.sections.map((section) =>
            section.id === selectedSection
              ? {
                  ...section,
                  coursewareCount: section.coursewareCount + 1,
                  coursewareList: [...(section.coursewareList || []), newCourseware]
                }
              : section
          )
        }));
        onChaptersChange(updatedChapters);
      }

      // 关闭弹窗并清理状态
      onUploadClose();
      setSelectedFile(null);
    } catch (error) {
      console.error('=== 上传失败 ===');
      console.error('错误详情:', error);
      console.error('错误响应:', (error as any)?.response);
      console.error('错误状态:', (error as any)?.response?.status);
      console.error('错误数据:', (error as any)?.response?.data);

      toast({
        title: t('aiTeacher.avatar.edit.chapters.uploadFailed'),
        description: t('aiTeacher.avatar.edit.chapters.uploadFailedDesc'),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 预览课件
  const handlePreviewCourseware = (courseware: CoursewareItem) => {
    setPreviewCourseware(courseware);
    onPreviewOpen();
  };

  // 下载课件
  const handleDownloadCourseware = (courseware: CoursewareItem) => {
    if (courseware.fileUrl) {
      // 使用 fetch 下载文件
      fetch(courseware.fileUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = courseware.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
          console.error('下载失败:', error);
          // 如果 fetch 失败，尝试直接打开链接
          const link = document.createElement('a');
          link.href = courseware.fileUrl!;
          link.target = '_blank';
          link.download = courseware.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } else {
      toast({
        title: t('aiTeacher.avatar.edit.chapters.cannotDownload'),
        description: t('aiTeacher.avatar.edit.chapters.fileUrlNotAvailable'),
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    }
  };

  // 打开删除课件确认弹窗
  const handleOpenDeleteCourseware = (courseware: CoursewareItem) => {
    setDeleteCoursewareTarget(courseware);
    onDeleteCoursewareOpen();
  };

  // 确认删除课件
  const handleConfirmDeleteCourseware = () => {
    if (!deleteCoursewareTarget || (!selectedSection && !selectedChapterId)) return;

    if (selectedChapterId) {
      const updatedChapters = chapters.map((chapter) =>
        chapter.id === selectedChapterId
          ? {
              ...chapter,
              coursewareCount: Math.max(0, chapter.coursewareCount - 1),
              coursewareList: (chapter.coursewareList || []).filter(
                (c) => c.id !== deleteCoursewareTarget.id
              )
            }
          : chapter
      );
      onChaptersChange(updatedChapters);
    } else if (selectedSection) {
      const updatedChapters = chapters.map((chapter) => ({
        ...chapter,
        sections: chapter.sections.map((section) =>
          section.id === selectedSection
            ? {
                ...section,
                coursewareCount: Math.max(0, section.coursewareCount - 1),
                coursewareList: (section.coursewareList || []).filter(
                  (c) => c.id !== deleteCoursewareTarget.id
                )
              }
            : section
        )
      }));
      onChaptersChange(updatedChapters);
    }

    toast({
      title: t('aiTeacher.avatar.edit.chapters.coursewareDeleted'),
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top'
    });

    onDeleteCoursewareClose();
    setDeleteCoursewareTarget(null);
  };

  return (
    <>
      <Box
        bg="white"
        border="1px solid #E5E6EB"
        borderRadius={{ base: '18px', md: '20px' }}
        boxShadow="0 8px 28px rgba(31,35,41,0.07)"
        minH={{ base: '760px', lg: '600px' }}
        overflow="hidden"
      >
        <Flex direction={{ base: 'column', lg: 'row' }} h={{ base: 'auto', lg: '600px' }}>
          {/* 左侧目录树 */}
          <Box
            w={{ base: '100%', lg: '384px' }}
            borderRight={{ base: 'none', lg: '1px solid' }}
            borderBottom={{ base: '1px solid', lg: 'none' }}
            borderColor="#E5E6EB"
            flexShrink={0}
          >
            <Flex
              align="center"
              justify="space-between"
              p={4}
              borderBottom="1px solid"
              borderColor="gray.200"
            >
              <Text fontWeight={600} color="gray.800">
                {t('aiTeacher.avatar.edit.chapters.structure')}
              </Text>
              <Button size="sm" leftIcon={<AddIcon />} onClick={handleAddChapter}>
                {t('aiTeacher.avatar.edit.chapters.addChapter')}
              </Button>
            </Flex>

            <Box p={2} overflowY="auto" h={{ base: '300px', lg: 'calc(600px - 57px)' }}>
              {chapters.map((chapter) => {
                const isExpanded = expandedChapters.has(chapter.id);
                const chapterKnowledgeCount = getChapterKnowledgeCount(chapter);
                const hasStudents = chapter.sections.some((s) => s.hasStudents);

                return (
                  <Box key={chapter.id} mb={1}>
                    <Flex
                      align="center"
                      gap={2}
                      p={2}
                      borderRadius="lg"
                      cursor="pointer"
                      bg={
                        selectedChapterId === chapter.id && chapter.sections.length === 0
                          ? '#FEF2F2'
                          : 'transparent'
                      }
                      borderLeft={
                        selectedChapterId === chapter.id && chapter.sections.length === 0
                          ? `3px solid ${PRIMARY_COLOR}`
                          : 'none'
                      }
                      _hover={{ bg: 'gray.50' }}
                      role="group"
                      onClick={() => {
                        if (chapter.sections.length === 0) {
                          setSelectedChapterId(chapter.id);
                          onSectionSelect(null);
                        }
                      }}
                    >
                      <Icon
                        as={ChevronRightIcon}
                        w={4}
                        h={4}
                        color="gray.400"
                        transform={isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}
                        transition="transform 0.2s"
                        onClick={(e) => toggleChapter(e, chapter.id)}
                      />
                      <Box as="span" fontSize="sm" color={isExpanded ? PRIMARY_COLOR : 'gray.400'}>
                        {isExpanded ? '📂' : '📁'}
                      </Box>
                      <Text fontSize="sm" color="gray.700" flex="1" noOfLines={1}>
                        {chapter.title}
                      </Text>
                      {chapter.openMode === 'scheduled' && chapter.openTime && (
                        <Text fontSize="xs" color="#86909C" flexShrink={0}>
                          {chapter.openTime.replace('T', ' ').slice(0, 16)}
                        </Text>
                      )}
                      {chapter.openMode === 'prerequisite' && (
                        <Text fontSize="xs" color="#C8000B" flexShrink={0}>
                          完成前置章节学习
                        </Text>
                      )}
                      {hasStudents && (
                        <Badge
                          fontSize="xs"
                          bg="rgba(250,173,20,0.16)"
                          color="#B7791F"
                          px={1.5}
                          py={0.5}
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          👥
                        </Badge>
                      )}
                      {chapter.sections.length === 0 && (
                        <Badge
                          fontSize="xs"
                          bg={chapter.coursewareCount > 0 ? 'rgba(82,196,26,0.16)' : 'gray.200'}
                          color={chapter.coursewareCount > 0 ? SUCCESS_COLOR : 'gray.600'}
                          px={1.5}
                          py={0.5}
                          borderRadius="md"
                        >
                          {chapter.coursewareCount}
                        </Badge>
                      )}
                      <HStack spacing={1} opacity={{ base: 1, lg: 0 }} _groupHover={{ opacity: 1 }}>
                        <Box
                          as="button"
                          p={1}
                          borderRadius="md"
                          _hover={{ bg: 'white' }}
                          title={t('aiTeacher.avatar.edit.chapters.addSection')}
                          onClick={(e: React.MouseEvent) => handleAddSection(e, chapter.id)}
                        >
                          <AddIcon w={3.5} h={3.5} color="gray.500" />
                        </Box>
                        <Box
                          as="button"
                          p={1}
                          borderRadius="md"
                          _hover={{ bg: 'white' }}
                          title={t('aiTeacher.avatar.edit.chapters.editAriaLabel')}
                          onClick={(e: React.MouseEvent) => handleEditChapter(e, chapter.id)}
                        >
                          <Text fontSize="sm">✏️</Text>
                        </Box>
                        <Box
                          as="button"
                          p={1}
                          borderRadius="md"
                          _hover={{ bg: 'white' }}
                          title={t('aiTeacher.avatar.edit.chapters.deleteAriaLabel')}
                          onClick={(e: React.MouseEvent) => handleDeleteChapter(e, chapter.id)}
                        >
                          <Text fontSize="sm">🗑️</Text>
                        </Box>
                      </HStack>
                    </Flex>

                    {isExpanded && (
                      <VStack pl={4} spacing={0} align="stretch">
                        {chapter.sections.map((section) => (
                          <Flex
                            key={section.id}
                            align="center"
                            gap={2}
                            p={2}
                            borderRadius="lg"
                            cursor="pointer"
                            bg={selectedSection === section.id ? '#FEF2F2' : 'transparent'}
                            borderLeft={
                              selectedSection === section.id ? `3px solid ${PRIMARY_COLOR}` : 'none'
                            }
                            _hover={{ bg: '#F0F7FF' }}
                            onClick={() => {
                              onSectionSelect(section.id);
                              setSelectedChapterId(null);
                            }}
                            role="group"
                          >
                            <Box as="span" fontSize="sm" color="gray.400">
                              📄
                            </Box>
                            <Text fontSize="sm" color="gray.700" flex="1" noOfLines={1}>
                              {section.title}
                            </Text>
                            {section.openMode === 'scheduled' && section.openTime && (
                              <Text fontSize="xs" color="#86909C" flexShrink={0}>
                                {section.openTime.replace('T', ' ').slice(0, 16)}
                              </Text>
                            )}
                            {section.openMode === 'prerequisite' && (
                              <Text fontSize="xs" color="#C8000B" flexShrink={0}>
                                完成前置章节学习
                              </Text>
                            )}
                            {section.hasStudents && (
                              <Badge
                                fontSize="xs"
                                bg="rgba(250,173,20,0.16)"
                                color="#B7791F"
                                px={1.5}
                                py={0.5}
                                borderRadius="md"
                                display="flex"
                                alignItems="center"
                                gap={1}
                              >
                                👥
                              </Badge>
                            )}
                            <Badge
                              fontSize="xs"
                              bg={section.coursewareCount > 0 ? 'rgba(82,196,26,0.16)' : 'gray.200'}
                              color={section.coursewareCount > 0 ? SUCCESS_COLOR : 'gray.600'}
                              px={1.5}
                              py={0.5}
                              borderRadius="md"
                            >
                              {section.coursewareCount}
                            </Badge>
                            <HStack
                              spacing={1}
                              opacity={{ base: 1, lg: 0 }}
                              _groupHover={{ opacity: 1 }}
                            >
                              <Box
                                as="button"
                                p={1}
                                borderRadius="md"
                                _hover={{ bg: 'white' }}
                                title={t('aiTeacher.avatar.edit.chapters.editAriaLabel')}
                                onClick={(e: React.MouseEvent) => handleEditSection(e, section.id)}
                              >
                                <Text fontSize="sm">✏️</Text>
                              </Box>
                              <Box
                                as="button"
                                p={1}
                                borderRadius="md"
                                _hover={{ bg: 'white' }}
                                title={t('aiTeacher.avatar.edit.chapters.deleteAriaLabel')}
                                onClick={(e: React.MouseEvent) =>
                                  handleDeleteSection(e, section.id)
                                }
                              >
                                <Text fontSize="sm">🗑️</Text>
                              </Box>
                            </HStack>
                          </Flex>
                        ))}
                      </VStack>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* 右侧详情区 */}
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            minW={0}
            minH={{ base: '460px', lg: 0 }}
          >
            {selectedSection ||
            (selectedChapterId &&
              chapters.find((c) => c.id === selectedChapterId)?.sections.length === 0) ? (
              <>
                {/* 头部 */}
                <Flex
                  align={{ base: 'stretch', sm: 'center' }}
                  justify="space-between"
                  direction={{ base: 'column', sm: 'row' }}
                  gap={3}
                  p={4}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  <Box>
                    <Text fontSize="lg" fontWeight={600} color="gray.800">
                      {selectedSection
                        ? chapters.flatMap((c) => c.sections).find((s) => s.id === selectedSection)
                            ?.title
                        : chapters.find((c) => c.id === selectedChapterId)?.title}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {t('aiTeacher.avatar.edit.chapters.courseware')}：
                      <Text as="span" color={SUCCESS_COLOR} fontWeight={500}>
                        {t('aiTeacher.avatar.edit.chapters.coursewareCount', {
                          count: selectedSection
                            ? chapters
                                .flatMap((c) => c.sections)
                                .find((s) => s.id === selectedSection)?.coursewareCount || 0
                            : chapters.find((c) => c.id === selectedChapterId)?.coursewareCount || 0
                        })}
                      </Text>
                    </Text>
                  </Box>
                  <Button
                    size="sm"
                    leftIcon={<AddIcon w={3} h={3} />}
                    bg="white"
                    borderColor="#333333"
                    color="#333333"
                    border="1px solid"
                    borderRadius="12px"
                    px={4}
                    py={2}
                    fontSize="14px"
                    fontWeight={500}
                    _hover={{ bg: 'gray.50' }}
                    onClick={handleOpenUpload}
                    minH="44px"
                  >
                    {t('aiTeacher.avatar.edit.chapters.addFromWorkspace')}
                  </Button>
                </Flex>

                {/* 课件列表区域 */}
                <Box flex="1" overflowY="auto" p={4}>
                  {getCurrentCourseware().length > 0 ? (
                    <VStack spacing={3} align="stretch">
                      {getCurrentCourseware().map((courseware) => {
                        const { icon, bgColor, iconColor } = getFileIconAndColor(courseware.type);
                        return (
                          <Flex
                            key={courseware.id}
                            align="center"
                            gap={4}
                            p={4}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="gray.100"
                            _hover={{ bg: 'gray.50' }}
                            transition="all 0.2s"
                          >
                            <Box
                              w={10}
                              h={10}
                              bg={bgColor}
                              borderRadius="md"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              flexShrink={0}
                            >
                              <Text fontSize="lg">{icon}</Text>
                            </Box>
                            <Box flex="1" minW={0}>
                              <Flex align="center" gap={2}>
                                <Text fontSize="sm" fontWeight={500} color="gray.800" noOfLines={1}>
                                  {courseware.name}
                                </Text>
                                {courseware.hasStudyRecord && (
                                  <Badge
                                    fontSize="xs"
                                    bg="rgba(250,173,20,0.16)"
                                    color="#B7791F"
                                    px={1.5}
                                    py={0.5}
                                    borderRadius="md"
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                  >
                                    👥
                                  </Badge>
                                )}
                              </Flex>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                {courseware.size} · {courseware.date}
                              </Text>
                            </Box>
                            <HStack spacing={1}>
                              <IconButton
                                aria-label={t('aiTeacher.avatar.edit.chapters.previewAriaLabel')}
                                icon={<ViewIcon />}
                                size="sm"
                                variant="ghost"
                                color="gray.400"
                                _hover={{ color: PRIMARY_COLOR }}
                                onClick={() => handlePreviewCourseware(courseware)}
                              />
                              <IconButton
                                aria-label={t('aiTeacher.avatar.edit.chapters.downloadAriaLabel')}
                                icon={<DownloadIcon />}
                                size="sm"
                                variant="ghost"
                                color="gray.400"
                                _hover={{ color: PRIMARY_COLOR }}
                                onClick={() => handleDownloadCourseware(courseware)}
                              />
                              <IconButton
                                aria-label={t('aiTeacher.avatar.edit.chapters.deleteAriaLabel')}
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                color="gray.400"
                                _hover={{ color: 'red.500' }}
                                onClick={() => handleOpenDeleteCourseware(courseware)}
                              />
                            </HStack>
                          </Flex>
                        );
                      })}
                    </VStack>
                  ) : (
                    <Flex direction="column" align="center" justify="center" py={12} gap={4}>
                      <Box
                        w={16}
                        h={16}
                        bg="gray.100"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={() => <Text fontSize="3xl">☁️</Text>} color="gray.400" />
                      </Box>
                      <Text color="gray.500" fontSize="sm">
                        {t('aiTeacher.avatar.edit.chapters.noCourseware')}
                      </Text>
                    </Flex>
                  )}
                </Box>
              </>
            ) : (
              <Flex align="center" justify="center" flex="1">
                <Text color="gray.400" fontSize="sm">
                  {t('aiTeacher.avatar.edit.chapters.selectSection')}
                </Text>
              </Flex>
            )}
          </Box>
        </Flex>
      </Box>

      {/* 编辑弹窗 */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editTarget?.isNew
              ? editTarget.type === 'chapter'
                ? t('aiTeacher.avatar.edit.chapters.addChapterTitle')
                : t('aiTeacher.avatar.edit.chapters.addSectionTitle')
              : editTarget?.type === 'chapter'
                ? t('aiTeacher.avatar.edit.chapters.editChapter')
                : t('aiTeacher.avatar.edit.chapters.editSection')}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>{t('aiTeacher.avatar.edit.chapters.nameLabel')}</FormLabel>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={t('aiTeacher.avatar.edit.chapters.namePlaceholder')}
                autoFocus
              />
            </FormControl>
            <FormControl>
              <FormLabel>学习设置</FormLabel>
              <RadioGroup
                value={editOpenMode}
                onChange={(val) =>
                  setEditOpenMode(val as 'unlimited' | 'scheduled' | 'prerequisite')
                }
              >
                <Stack spacing={3}>
                  <Radio value="unlimited" colorScheme="red">
                    <Text fontSize="sm">无限制</Text>
                  </Radio>
                  <Radio value="scheduled" colorScheme="red">
                    <Stack spacing={1}>
                      <Text fontSize="sm">指定开放时间</Text>
                      {editOpenMode === 'scheduled' && (
                        <Input
                          type="datetime-local"
                          value={editOpenTime}
                          onChange={(e) => setEditOpenTime(e.target.value)}
                          placeholder="请选择开放时间"
                          size="sm"
                        />
                      )}
                    </Stack>
                  </Radio>
                  <Radio value="prerequisite" colorScheme="red">
                    <Text fontSize="sm">完成前置章节学习</Text>
                  </Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="outline" onClick={onEditClose}>
              {t('aiTeacher.avatar.common.actions.cancel')}
            </Button>
            <Button onClick={handleConfirmEdit}>
              {t('aiTeacher.avatar.common.actions.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.6)" />
        <ModalContent borderRadius="16px" maxW="480px" mx={4}>
          <ModalHeader
            display="flex"
            alignItems="center"
            gap={3}
            pt={6}
            pb={4}
            px={6}
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <Flex
              w={10}
              h={10}
              bg="red.50"
              borderRadius="full"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon
                as={() => (
                  <Text fontSize="xl" color="red.500">
                    ⓘ
                  </Text>
                )}
              />
            </Flex>
            <Text fontSize="lg" fontWeight={600} color="gray.800">
              {t('aiTeacher.avatar.edit.chapters.deleteConfirm')}
            </Text>
          </ModalHeader>
          <ModalCloseButton top={6} right={6} />
          <ModalBody px={6} py={6}>
            <Text fontSize="md" color="gray.700" lineHeight="1.6">
              {deleteTarget?.type === 'chapter'
                ? t('aiTeacher.avatar.edit.chapters.deleteChapterMessage')
                : t('aiTeacher.avatar.edit.chapters.deleteSectionMessage')}
            </Text>
          </ModalBody>
          <ModalFooter px={6} pb={6} pt={4} gap={3} justifyContent="flex-end">
            <Button
              variant="outline"
              onClick={onDeleteClose}
              px={8}
              h={10}
              borderRadius="8px"
              bg="white"
              borderColor="gray.300"
              color="gray.600"
              _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
            >
              {t('aiTeacher.avatar.common.actions.cancel')}
            </Button>
            <Button
              onClick={handleConfirmDelete}
              px={8}
              h={10}
              borderRadius="8px"
              bg="gray.800"
              color="white"
              _hover={{ bg: 'gray.900' }}
            >
              {t('aiTeacher.avatar.edit.chapters.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除课件确认弹窗 */}
      <Modal isOpen={isDeleteCoursewareOpen} onClose={onDeleteCoursewareClose} isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.6)" />
        <ModalContent borderRadius="16px" maxW="480px" mx={4}>
          <ModalHeader
            display="flex"
            alignItems="center"
            gap={3}
            pt={6}
            pb={4}
            px={6}
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <Flex
              w={10}
              h={10}
              bg="red.50"
              borderRadius="full"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon
                as={() => (
                  <Text fontSize="xl" color="red.500">
                    ⓘ
                  </Text>
                )}
              />
            </Flex>
            <Text fontSize="lg" fontWeight={600} color="gray.800">
              {t('aiTeacher.avatar.edit.chapters.deleteConfirm')}
            </Text>
          </ModalHeader>
          <ModalCloseButton top={6} right={6} />
          <ModalBody px={6} py={6}>
            <Text fontSize="md" color="gray.700" lineHeight="1.6">
              {deleteCoursewareTarget?.hasStudyRecord
                ? t('aiTeacher.avatar.edit.chapters.deleteCoursewareWithStudents')
                : t('aiTeacher.avatar.edit.chapters.deleteCoursewareMessage')}
            </Text>
          </ModalBody>
          <ModalFooter px={6} pb={6} pt={4} gap={3} justifyContent="flex-end">
            <Button
              variant="outline"
              onClick={onDeleteCoursewareClose}
              px={8}
              h={10}
              borderRadius="8px"
              bg="white"
              borderColor="gray.300"
              color="gray.600"
              _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
            >
              {t('aiTeacher.avatar.common.actions.cancel')}
            </Button>
            <Button
              onClick={handleConfirmDeleteCourseware}
              px={8}
              h={10}
              borderRadius="8px"
              bg="gray.800"
              color="white"
              _hover={{ bg: 'gray.900' }}
            >
              {t('aiTeacher.avatar.edit.chapters.confirmDelete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 预览课件弹窗 */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => {
          onPreviewClose();
          setPreviewCourseware(null);
          setIsPreviewFullscreen(false);
        }}
        size={isPreviewFullscreen ? 'full' : '6xl'}
        isCentered={!isPreviewFullscreen}
      >
        <ModalOverlay />
        <ModalContent
          maxW={isPreviewFullscreen ? '100vw' : '1400px'}
          maxH={isPreviewFullscreen ? '100vh' : '90vh'}
          h={isPreviewFullscreen ? '100vh' : '90vh'}
          m={0}
          borderRadius={isPreviewFullscreen ? 0 : undefined}
        >
          <ModalHeader>
            <Flex align="center" gap={3}>
              <Text>{t('aiTeacher.avatar.edit.chapters.previewCourseware')}</Text>
              {previewCourseware && (
                <Text fontSize="sm" color="gray.500" fontWeight="normal">
                  {previewCourseware.name}
                </Text>
              )}
            </Flex>
          </ModalHeader>
          {/* 关闭按钮和全屏按钮用 Flex 容器统一管理位置 */}
          <Flex position="absolute" right="3" top="3" align="center" gap={1} zIndex={1}>
            {/* 全屏按钮：所有文件类型均显示 */}
            {previewCourseware && (
              <IconButton
                aria-label={isPreviewFullscreen ? '退出全屏' : '全屏'}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {isPreviewFullscreen ? (
                      <>
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                      </>
                    ) : (
                      <>
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                      </>
                    )}
                  </svg>
                }
                size="sm"
                variant="ghost"
                onClick={() => setIsPreviewFullscreen((prev) => !prev)}
              />
            )}
            <ModalCloseButton position="static" m={0} />
          </Flex>
          <ModalBody p={0} overflow="hidden">
            {previewCourseware && previewCourseware.fileUrl ? (
              <>
                {/* 视频预览 */}
                {previewCourseware.type === 'video' && (
                  <Box
                    w="100%"
                    h="100%"
                    bg="black"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <video
                      controls
                      style={{ maxWidth: '100%', maxHeight: '100%', width: '100%' }}
                      src={previewCourseware.fileUrl}
                    >
                      {t('aiTeacher.avatar.edit.chapters.videoNotSupported')}
                    </video>
                  </Box>
                )}

                {/* 图片预览 */}
                {previewCourseware.type === 'image' && (
                  <Box
                    w="100%"
                    h="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="gray.50"
                  >
                    <img
                      src={previewCourseware.fileUrl}
                      alt={previewCourseware.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </Box>
                )}

                {/* 音频预览 */}
                {previewCourseware.type === 'audio' && (
                  <Flex
                    w="100%"
                    h="100%"
                    alignItems="center"
                    justifyContent="center"
                    direction="column"
                    gap={4}
                  >
                    <Icon as={() => <Text fontSize="6xl">🎵</Text>} />
                    <Text fontSize="lg" color="gray.700">
                      {previewCourseware.name}
                    </Text>
                    <audio
                      controls
                      style={{ width: '80%', maxWidth: '600px' }}
                      src={previewCourseware.fileUrl}
                    >
                      {t('aiTeacher.avatar.edit.chapters.audioNotSupported')}
                    </audio>
                  </Flex>
                )}

                {/* PDF预览 - 使用embed标签 */}
                {previewCourseware.type === 'pdf' && (
                  <Box w="100%" h="100%" bg="gray.100">
                    <embed
                      src={`${previewCourseware.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      type="application/pdf"
                      style={{ width: '100%', height: '100%' }}
                      title={previewCourseware.name}
                    />
                  </Box>
                )}

                {/* Office文档预览 - 使用微软在线预览服务 */}
                {(previewCourseware.type === 'doc' || previewCourseware.type === 'ppt') && (
                  <Box w="100%" h="100%">
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewCourseware.fileUrl)}`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      title={previewCourseware.name}
                    />
                  </Box>
                )}

                {/* iframe 预览 - openmaic/digital 等内嵌内容 */}
                {previewCourseware.type === 'iframe' && (
                  <Box w="100%" h="100%">
                    <iframe
                      src={previewCourseware.fileUrl}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      title={previewCourseware.name}
                    />
                  </Box>
                )}
              </>
            ) : (
              <Flex
                w="100%"
                h="100%"
                alignItems="center"
                justifyContent="center"
                direction="column"
                gap={4}
              >
                <Icon as={() => <Text fontSize="6xl">📄</Text>} />
                <Text color="gray.500">{t('aiTeacher.avatar.edit.chapters.cannotPreview')}</Text>
                <Button
                  onClick={() => previewCourseware && handleDownloadCourseware(previewCourseware)}
                >
                  {t('aiTeacher.avatar.edit.chapters.downloadFile')}
                </Button>
              </Flex>
            )}
          </ModalBody>
          {!isPreviewFullscreen && (
            <ModalFooter borderTop="1px solid" borderColor="gray.100">
              <HStack spacing={3}>
                <Button
                  variant="outline"
                  leftIcon={<DownloadIcon />}
                  onClick={() => previewCourseware && handleDownloadCourseware(previewCourseware)}
                >
                  {t('aiTeacher.avatar.edit.chapters.downloadCourseware')}
                </Button>
                <Button
                  onClick={() => {
                    onPreviewClose();
                    setPreviewCourseware(null);
                  }}
                >
                  {t('aiTeacher.avatar.edit.chapters.closeCourseware')}
                </Button>
              </HStack>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      {/* 创作空间资源弹窗 */}
      <UploadResourceModal
        isOpen={isResourceModalOpen}
        onClose={onResourceModalClose}
        onConfirm={handleConfirmResource}
        chapterTitle={resourceModalTitle}
      />
    </>
  );
}
