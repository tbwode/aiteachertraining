'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  HStack,
  VStack,
  Spinner
} from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import { formatFileSize } from '@/web/common/file/utils';

// 本地上传文件类型与大小限制（独立配置，不修改全局 FILE_CONFIG）
const UPLOAD_FILE_CONFIG: Record<string, { category: string; maxSize: number }> = {
  // 文档
  pdf: { category: 'document', maxSize: 500 * 1024 * 1024 },
  doc: { category: 'document', maxSize: 500 * 1024 * 1024 },
  docx: { category: 'document', maxSize: 500 * 1024 * 1024 },
  ppt: { category: 'document', maxSize: 500 * 1024 * 1024 },
  pptx: { category: 'document', maxSize: 500 * 1024 * 1024 },
  // 视频
  mp4: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  mov: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  avi: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  webm: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  mkv: { category: 'video', maxSize: 2 * 1024 * 1024 * 1024 },
  // 音频
  mp3: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  wav: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  aac: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  ogg: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  flac: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  m4a: { category: 'audio', maxSize: 200 * 1024 * 1024 },
  // 图片
  jpg: { category: 'image', maxSize: 50 * 1024 * 1024 },
  jpeg: { category: 'image', maxSize: 50 * 1024 * 1024 },
  png: { category: 'image', maxSize: 50 * 1024 * 1024 },
  gif: { category: 'image', maxSize: 50 * 1024 * 1024 },
  webp: { category: 'image', maxSize: 50 * 1024 * 1024 },
  bmp: { category: 'image', maxSize: 50 * 1024 * 1024 }
};

function isAllowedUploadFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return !!UPLOAD_FILE_CONFIG[ext];
}

function getUploadFileConfig(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return UPLOAD_FILE_CONFIG[ext];
}
import {
  getMaicTaskPage,
  getDigitalCoursewareList,
  getResourceLibraryPage,
  uploadCoursewareFiles
} from '@/teacher/api/aiTeacher';
import type {
  MaicTaskPageResponse,
  MaicTaskRecord,
  DigitalCoursewareListResponse,
  DigitalCoursewareRecord,
  ResourceLibraryPageResponse,
  ResourceLibraryRecord
} from '@/teacher/types/aiTeacher';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';

type TabType = 'aiCourse' | 'digitalCourseware' | 'resourceLibrary' | 'localUpload';

interface ResourceItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'ai' | 'doc' | 'video' | 'ppt' | 'pdf' | 'default';
  url?: string;
  fileKey?: string;
  fileSize?: number;
  fileType?: string;
}

interface SelectedFile {
  id: string;
  file: File;
  fileUrl?: string;
  fileKey?: string;
  uploading: boolean;
  error?: string;
}

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    resources: Array<{
      id: string;
      title: string;
      fileKey?: string;
      fileName?: string;
      fileSize?: number;
      iconType?: string;
      fileUrl?: string;
      fileType?: string;
    }>
  ) => void;
  chapterTitle: string;
}

const useTabList = (t: (key: string) => string): { key: TabType; label: string }[] => [
  {
    key: 'aiCourse',
    label: t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.tabs.aiCourse')
  },
  {
    key: 'digitalCourseware',
    label: t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.tabs.digitalCourseware')
  },
  {
    key: 'resourceLibrary',
    label: t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.tabs.resourceLibrary')
  },
  {
    key: 'localUpload',
    label: t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.tabs.localUpload')
  }
];

// AI主讲课图标（品牌红）
const AIIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#FFF1F0" />
    <path
      d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10ZM20 28C15.589 28 12 24.411 12 20C12 15.589 15.589 12 20 12C24.411 12 28 15.589 28 20C28 24.411 24.411 28 20 28Z"
      fill="#C8000B"
    />
    <path
      d="M20 15C17.239 15 15 17.239 15 20C15 22.761 17.239 25 20 25C22.761 25 25 22.761 25 20C25 17.239 22.761 15 20 15ZM20 23C18.343 23 17 21.657 17 20C17 18.343 18.343 17 20 17C21.657 17 23 18.343 23 20C23 21.657 21.657 23 20 23Z"
      fill="#C8000B"
    />
  </svg>
);

// 文档图标（蓝色）
const DocIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#E6F0FF" />
    <path
      d="M22 10H14C12.9 10 12 10.9 12 12V28C12 29.1 12.9 30 14 30H26C27.1 30 28 29.1 28 28V16L22 10Z"
      fill="#4A90E2"
    />
    <path
      d="M22 10V16H28"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M16 20H24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 24H22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// PPT图标（橙色）
const PptIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#FFF3E6" />
    <rect x="10" y="12" width="20" height="16" rx="2" fill="#FF8C42" />
    <path d="M14 18H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14 22H18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// PDF图标（红色）
const PdfIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#FFE6E6" />
    <path
      d="M22 10H14C12.9 10 12 10.9 12 12V28C12 29.1 12.9 30 14 30H26C27.1 30 28 29.1 28 28V16L22 10Z"
      fill="#E74C3C"
    />
    <text x="14" y="25" fill="white" fontSize="8" fontWeight="bold">
      PDF
    </text>
  </svg>
);

// 视频图标
const VideoIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#E6FFF0" />
    <rect x="10" y="13" width="20" height="14" rx="2" fill="#2ECC71" />
    <path d="M18 17L24 20L18 23V17Z" fill="white" />
  </svg>
);

// 默认文件图标
const DefaultIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#F5F5F5" />
    <path
      d="M22 10H14C12.9 10 12 10.9 12 12V28C12 29.1 12.9 30 14 30H26C27.1 30 28 29.1 28 28V16L22 10Z"
      fill="#86909C"
    />
  </svg>
);

const ResourceIcon = ({ type }: { type: ResourceItem['iconType'] }) => {
  switch (type) {
    case 'ai':
      return <AIIcon />;
    case 'doc':
      return <DocIcon />;
    case 'ppt':
      return <PptIcon />;
    case 'pdf':
      return <PdfIcon />;
    case 'video':
      return <VideoIcon />;
    default:
      return <DefaultIcon />;
  }
};

export default function UploadResourceModal({
  isOpen,
  onClose,
  onConfirm,
  chapterTitle
}: UploadResourceModalProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const TABS = useTabList(t);
  const [activeTab, setActiveTab] = useState<TabType>('aiCourse');
  const [searchKey, setSearchKey] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI主讲课列表状态
  const [aiCourseList, setAiCourseList] = useState<ResourceItem[]>([]);
  const [isAiCourseLoading, setIsAiCourseLoading] = useState(false);
  const [aiCoursePage, setAiCoursePage] = useState(1);
  const [aiCourseTotal, setAiCourseTotal] = useState(0);

  // 数字课件列表状态
  const [digitalCoursewareList, setDigitalCoursewareList] = useState<ResourceItem[]>([]);
  const [isDigitalCoursewareLoading, setIsDigitalCoursewareLoading] = useState(false);

  // 教学资源库列表状态
  const [resourceLibraryList, setResourceLibraryList] = useState<ResourceItem[]>([]);
  const [isResourceLibraryLoading, setIsResourceLibraryLoading] = useState(false);
  const [resourceLibraryPage, setResourceLibraryPage] = useState(1);
  const [resourceLibraryTotal, setResourceLibraryTotal] = useState(0);

  // 加载AI主讲课数据
  const loadAiCourses = useCallback(async (keyword: string) => {
    setIsAiCourseLoading(true);
    try {
      const res = await getMaicTaskPage({
        name: keyword || undefined,
        status: 2
      });
      // 兼容后端可能直接返回数组或 { records: [...] } 两种格式
      const rawRecords = Array.isArray(res) ? res : res?.records || [];
      const records = rawRecords.map((item: any) => ({
        id: item.url || item.name + item.createTime,
        title: item.name,
        subtitle: item.size ? formatFileSize(item.size) : '',
        iconType: 'ai' as const,
        url: item.url,
        fileSize: item.size
      }));
      setAiCourseList(records);
      setAiCourseTotal(Array.isArray(res) ? res.length : res?.total || 0);
    } catch (error) {
      console.error('加载AI主讲课列表失败:', error);
    } finally {
      setIsAiCourseLoading(false);
    }
  }, []);

  // 加载数字课件数据
  const loadDigitalCourseware = useCallback(async (keyword: string) => {
    setIsDigitalCoursewareLoading(true);
    try {
      const res = await getDigitalCoursewareList({
        searchKey: keyword || undefined
      });
      // 兼容后端可能直接返回数组或 { records: [...] } 两种格式
      const rawRecords = Array.isArray(res) ? res : res?.records || [];
      const records = rawRecords.map((item: any) => ({
        id: item.fileUrl || item.name + item.createTime,
        title: item.name,
        subtitle: item.fileSize ? formatFileSize(item.fileSize) : '',
        iconType: 'ppt' as const,
        url: item.fileUrl,
        fileSize: item.fileSize
      }));
      setDigitalCoursewareList(records);
    } catch (error) {
      console.error('加载数字课件列表失败:', error);
    } finally {
      setIsDigitalCoursewareLoading(false);
    }
  }, []);

  // 加载教学资源库数据
  const loadResourceLibrary = useCallback(async (keyword: string) => {
    setIsResourceLibraryLoading(true);
    try {
      const res = await getResourceLibraryPage({
        searchKey: keyword || undefined
      });
      console.log('[教学资源库] 接口返回:', res);
      // 兼容后端可能直接返回数组或 { records: [...] } 两种格式
      const rawRecords = Array.isArray(res) ? res : res?.records || [];
      const records = rawRecords.map((item: any) => {
        const fileName = item.fileName || item.file_name || '未命名';
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        // 优先根据文件扩展名推断 fileType，确保后端返回错误类型时也能正确识别
        let ft: string;
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) ft = 'image';
        else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) ft = 'audio';
        else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) ft = 'video';
        else if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(ext))
          ft = 'document';
        else ft = item.fileType || item.file_type || 'other';
        return {
          id:
            item.fileKey ||
            item.file_key ||
            item.fileUrl ||
            item.file_url ||
            item.fileName + item.createTime,
          title: fileName,
          subtitle:
            item.fileSize || item.file_size ? formatFileSize(item.fileSize || item.file_size) : '',
          iconType: 'doc' as const,
          url: item.fileUrl || item.file_url || '',
          fileKey: item.fileKey || item.file_key || '',
          fileSize: item.fileSize || item.file_size || 0,
          fileType: ft
        };
      });
      console.log('[教学资源库] 解析后 records:', records);
      setResourceLibraryList(records);
      setResourceLibraryTotal(Array.isArray(res) ? res.length : res?.total || 0);
    } catch (error) {
      console.error('加载教学资源库列表失败:', error);
    } finally {
      setIsResourceLibraryLoading(false);
    }
  }, []);

  // 重置状态
  const resetState = useCallback(() => {
    setActiveTab('aiCourse');
    setSearchKey('');
    setSelectedIds(new Set());
    setSelectedFiles([]);
    setIsDragging(false);
    setAiCourseList([]);
    setAiCoursePage(1);
    setAiCourseTotal(0);
    setDigitalCoursewareList([]);
    setResourceLibraryList([]);
    setResourceLibraryPage(1);
    setResourceLibraryTotal(0);
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  // 弹窗打开时加载AI主讲课数据（只加载一次）
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        loadAiCourses('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loadAiCourses]);

  // 统一处理Tab切换和搜索（数字课件、教学资源库）
  useEffect(() => {
    setAiCoursePage(1);
    setResourceLibraryPage(1);

    const timer = setTimeout(() => {
      if (activeTab === 'digitalCourseware') {
        loadDigitalCourseware(searchKey);
      } else if (activeTab === 'resourceLibrary') {
        loadResourceLibrary(searchKey);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, searchKey, loadDigitalCourseware, loadResourceLibrary]);

  // AI主讲课Tab搜索
  useEffect(() => {
    if (activeTab === 'aiCourse') {
      const timer = setTimeout(() => {
        setAiCoursePage(1);
        loadAiCourses(searchKey);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchKey, activeTab, loadAiCourses]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 加载更多AI主讲课
  const handleLoadMoreAiCourses = () => {
    const nextPage = aiCoursePage + 1;
    setAiCoursePage(nextPage);
    loadAiCourses(searchKey);
  };

  // 加载更多教学资源库
  const handleLoadMoreResourceLibrary = () => {
    const nextPage = resourceLibraryPage + 1;
    setResourceLibraryPage(nextPage);
    loadResourceLibrary(searchKey);
  };

  const getResourceList = (): ResourceItem[] => {
    let list: ResourceItem[] = [];
    switch (activeTab) {
      case 'aiCourse':
        list = aiCourseList;
        break;
      case 'digitalCourseware':
        list = digitalCoursewareList;
        break;
      case 'resourceLibrary':
        list = resourceLibraryList;
        break;
      case 'localUpload':
        return [];
    }
    return list;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: { file: File; id: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!isAllowedUploadFile(file.name)) {
        toast({
          title: `${t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.toasts.fileTypeNotSupported')}: ${file.name}`,
          status: 'warning',
          duration: 2000,
          position: 'top'
        });
        continue;
      }

      const config = getUploadFileConfig(file.name);
      if (config && file.size > config.maxSize) {
        toast({
          title: `${t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.toasts.fileSizeExceeded')}: ${file.name}`,
          status: 'warning',
          duration: 2000,
          position: 'top'
        });
        continue;
      }

      validFiles.push({ file, id: `local-${Date.now()}-${i}` });
    }

    if (validFiles.length === 0) return;

    // 添加到待上传列表
    setSelectedFiles((prev) => [
      ...prev,
      ...validFiles.map((item) => ({ id: item.id, file: item.file, uploading: true }))
    ]);

    // 批量上传
    try {
      const formData = new FormData();
      validFiles.forEach((item) => {
        formData.append('files', item.file);
      });
      const result = await uploadCoursewareFiles(formData);
      // 兼容后端可能返回数组或 { records: [...] } 两种格式
      const records = Array.isArray(result) ? result : result?.records || [];

      console.log('[批量上传] 后端返回:', result);
      console.log('[批量上传] 解析后 records:', records);
      console.log(
        '[批量上传] 上传文件列表:',
        validFiles.map((v) => v.file.name)
      );

      setSelectedFiles((prev) =>
        prev.map((item) => {
          // 只处理本次上传的文件
          if (!validFiles.some((v) => v.id === item.id)) return item;

          // 兼容驼峰(fileName)和下划线(file_name)两种命名，使用大小写不敏感匹配
          // 同时兼容空格和下划线差异（后端可能将空格替换为下划线）
          const normalizeFileName = (name: string) => name.toLowerCase().replace(/[_\s]+/g, '_');
          const matched = records.find((r: any) => {
            const recordName = normalizeFileName(r.fileName || r.file_name || '');
            const itemName = normalizeFileName(item.file.name);
            const isMatch = recordName === itemName;
            if (!isMatch) {
              console.log(`[批量上传] 匹配失败: 前端"${itemName}" vs 后端"${recordName}"`);
            }
            return isMatch;
          });
          if (matched) {
            console.log(`[批量上传] 匹配成功: ${item.file.name}`, matched);
            return {
              ...item,
              fileUrl: matched.fileUrl || matched.file_url || '',
              fileKey: matched.fileKey || matched.file_key || '',
              uploading: false
            };
          }
          // 后端未返回匹配记录，标记为失败
          console.log(`[批量上传] 未找到匹配: ${item.file.name}, records数量: ${records.length}`);
          return {
            ...item,
            uploading: false,
            error: t(
              'aiTeacher.avatar.create.step2.matching.uploadResourceModal.errors.matchFailed'
            )
          };
        })
      );
    } catch (error) {
      console.error('批量上传失败:', error);
      toast({
        title: t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.toasts.uploadFailed'),
        status: 'error',
        duration: 2000,
        position: 'top'
      });
      setSelectedFiles((prev) =>
        prev.map((item) =>
          validFiles.some((v) => v.id === item.id)
            ? {
                ...item,
                uploading: false,
                error: t(
                  'aiTeacher.avatar.create.step2.matching.uploadResourceModal.errors.uploadFailed'
                )
              }
            : item
        )
      );
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    handleFileSelect(files);
    // 清空 input 允许重复选择同一文件
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirm = () => {
    const uploadingCount = selectedFiles.filter((f) => f.uploading).length;
    if (uploadingCount > 0) {
      toast({
        title: t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.toasts.waitForUpload'),
        status: 'warning',
        duration: 1500,
        position: 'top'
      });
      return;
    }

    const completedFiles = selectedFiles.filter((f) => !f.uploading && !f.error);
    // 根据文件扩展名获取 fileType
    const getFileTypeByExt = (fileName: string): string => {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'image';
      if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) return 'audio';
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) return 'video';
      if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(ext))
        return 'document';
      return 'other';
    };

    const allSelectedResources = [
      ...aiCourseList
        .filter((item) => selectedIds.has(item.id))
        .map((item) => ({
          id: item.id,
          title: item.title,
          fileKey: null,
          fileSize: item.fileSize,
          iconType: item.iconType,
          fileUrl: item.url,
          fileType: 'openmaic'
        })),
      ...digitalCoursewareList
        .filter((item) => selectedIds.has(item.id))
        .map((item) => ({
          id: item.id,
          title: item.title,
          fileKey: null,
          fileSize: item.fileSize,
          iconType: item.iconType,
          fileUrl: item.url,
          fileType: 'digital'
        })),
      ...resourceLibraryList
        .filter((item) => selectedIds.has(item.id))
        .map((item) => ({
          id: item.id,
          title: item.title,
          fileKey: item.fileKey,
          fileSize: item.fileSize,
          iconType: item.iconType,
          fileUrl: item.url,
          fileType: item.fileType || 'document'
        })),
      ...completedFiles.map((f) => ({
        id: f.id,
        title: f.file.name,
        fileKey: f.fileKey,
        fileName: f.file.name,
        fileSize: f.file.size,
        iconType: 'doc',
        fileUrl: f.fileUrl,
        fileType: getFileTypeByExt(f.file.name)
      }))
    ];

    if (allSelectedResources.length === 0) {
      toast({
        title: t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.toasts.noFilesToAdd'),
        status: 'warning',
        duration: 1500,
        position: 'top'
      });
      return;
    }

    onConfirm(allSelectedResources);
    onClose();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const resourceList = getResourceList();
  const hasSelection =
    selectedIds.size > 0 || (selectedFiles.length > 0 && selectedFiles.some((f) => !f.uploading));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay bg="rgba(0, 0, 0, 0.5)" />
      <ModalContent borderRadius="16px" overflow="hidden" maxW="560px" mx={4}>
        {/* 头部 */}
        <ModalHeader
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          py={4}
          px={5}
          borderBottom="1px solid #F0F0F0"
          fontSize="16px"
          fontWeight={600}
          color="#1D2129"
        >
          {t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.title')}
          <IconButton
            aria-label="close"
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            }
            size="sm"
            variant="ghost"
            color="#86909C"
            _hover={{ color: '#1D2129', bg: 'transparent' }}
            onClick={handleClose}
          />
        </ModalHeader>

        <ModalBody py={4} px={5}>
          {/* 当前添加位置 */}
          <Text fontSize="13px" color="#86909C" mb={3}>
            {t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.currentLocation')}
            <Text as="span" color="#1D2129" fontWeight={500}>
              {chapterTitle}
            </Text>
          </Text>

          {/* Tab 标签 */}
          <HStack spacing={1} mb={4} bg="#F7F8FA" p={1} borderRadius="16px">
            {TABS.map((tab) => (
              <Box
                key={tab.key}
                flex={1}
                textAlign="center"
                px={3}
                py={2}
                cursor="pointer"
                fontSize="14px"
                fontWeight={activeTab === tab.key ? 500 : 400}
                color={activeTab === tab.key ? '#C8000B' : '#4E5969'}
                bg={activeTab === tab.key ? 'white' : 'transparent'}
                borderRadius="16px"
                transition="all 0.2s"
                _hover={{ color: activeTab === tab.key ? '#C8000B' : '#1D2129' }}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchKey('');
                }}
              >
                {tab.label}
              </Box>
            ))}
          </HStack>

          {/* 搜索框（非本地上传时显示） */}
          {activeTab !== 'localUpload' && (
            <Box position="relative" mb={4}>
              <Input
                placeholder={t(
                  'aiTeacher.avatar.create.step2.matching.uploadResourceModal.searchPlaceholder'
                )}
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                h="40px"
                fontSize="14px"
                borderColor="#E5E6EB"
                borderRadius="8px"
                pl={4}
                pr={10}
                _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
              />
              <Box
                position="absolute"
                right={3}
                top="50%"
                transform="translateY(-50%)"
                color="#86909C"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </Box>
            </Box>
          )}

          {/* 资源列表 */}
          {activeTab !== 'localUpload' ? (
            <VStack align="stretch" spacing={2} maxH="320px" overflowY="auto">
              {activeTab === 'aiCourse' && isAiCourseLoading && aiCourseList.length === 0 && (
                <Flex direction="column" align="center" justify="center" py={10}>
                  <Spinner size="sm" color="#C8000B" mb={2} />
                  <Text fontSize="14px" color="#86909C">
                    加载中...
                  </Text>
                </Flex>
              )}
              {activeTab === 'digitalCourseware' &&
                isDigitalCoursewareLoading &&
                digitalCoursewareList.length === 0 && (
                  <Flex direction="column" align="center" justify="center" py={10}>
                    <Spinner size="sm" color="#C8000B" mb={2} />
                    <Text fontSize="14px" color="#86909C">
                      加载中...
                    </Text>
                  </Flex>
                )}
              {activeTab === 'resourceLibrary' &&
                isResourceLibraryLoading &&
                resourceLibraryList.length === 0 && (
                  <Flex direction="column" align="center" justify="center" py={10}>
                    <Spinner size="sm" color="#C8000B" mb={2} />
                    <Text fontSize="14px" color="#86909C">
                      加载中...
                    </Text>
                  </Flex>
                )}
              {resourceList.length > 0 ? (
                <>
                  {resourceList.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <Flex
                        key={item.id}
                        align="center"
                        gap={3}
                        p={3}
                        bg={isSelected ? '#FFF5F5' : '#F7F8FA'}
                        borderRadius="10px"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ bg: isSelected ? '#FFF5F5' : '#F0F0F0' }}
                        onClick={() => toggleSelection(item.id)}
                      >
                        <ResourceIcon type={item.iconType} />
                        <Box flex="1" minW={0}>
                          <Text fontSize="14px" color="#1D2129" fontWeight={500} noOfLines={1}>
                            {item.title}
                          </Text>
                          <Text fontSize="12px" color="#86909C">
                            {item.subtitle}
                          </Text>
                        </Box>
                        {/* 单选按钮 */}
                        <Box
                          w="18px"
                          h="18px"
                          borderRadius="full"
                          border="2px solid"
                          borderColor={isSelected ? '#C8000B' : '#D9D9D9'}
                          bg={isSelected ? '#C8000B' : 'transparent'}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          transition="all 0.2s"
                        >
                          {isSelected && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </Box>
                      </Flex>
                    );
                  })}
                  {/* AI主讲课加载更多 */}
                  {activeTab === 'aiCourse' && aiCourseList.length < aiCourseTotal && (
                    <Flex justify="center" py={2}>
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={isAiCourseLoading}
                        onClick={handleLoadMoreAiCourses}
                      >
                        加载更多
                      </Button>
                    </Flex>
                  )}
                  {/* 教学资源库加载更多 */}
                  {activeTab === 'resourceLibrary' &&
                    resourceLibraryList.length < resourceLibraryTotal && (
                      <Flex justify="center" py={2}>
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={isResourceLibraryLoading}
                          onClick={handleLoadMoreResourceLibrary}
                        >
                          加载更多
                        </Button>
                      </Flex>
                    )}
                </>
              ) : (
                !isAiCourseLoading &&
                !isDigitalCoursewareLoading &&
                !isResourceLibraryLoading && (
                  <Flex direction="column" align="center" justify="center" py={10}>
                    <Text fontSize="14px" color="#86909C">
                      {t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.noData')}
                    </Text>
                  </Flex>
                )
              )}
            </VStack>
          ) : (
            /* 本地上传区域 */
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.selectFile')}
              </Text>
              {/* 上传拖拽区域 */}
              <Box
                border="2px dashed"
                borderColor={isDragging ? '#C8000B' : '#E5E6EB'}
                borderRadius="12px"
                p={6}
                textAlign="center"
                bg={isDragging ? 'rgba(200, 0, 11, 0.02)' : '#FAFAFA'}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                cursor="pointer"
                onClick={() => fileInputRef.current?.click()}
                transition="all 0.2s"
                _hover={{ borderColor: '#C8000B', bg: 'rgba(200, 0, 11, 0.02)' }}
                mb={selectedFiles.length > 0 ? 3 : 0}
              >
                <Flex
                  w="48px"
                  h="48px"
                  mx="auto"
                  mb={3}
                  borderRadius="full"
                  bg="#FFF1F0"
                  align="center"
                  justify="center"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C8000B"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </Flex>
                <Text fontSize="14px" color="#1D2129" mb={1}>
                  {t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.uploadHint')}
                </Text>
                <Text fontSize="12px" color="#86909C" lineHeight="1.6" whiteSpace="pre-line">
                  {t(
                    'aiTeacher.avatar.create.step2.matching.uploadResourceModal.uploadDescription'
                  )}
                </Text>
                <Input
                  type="file"
                  ref={fileInputRef}
                  display="none"
                  multiple
                  onChange={handleFileInputChange}
                />
              </Box>

              {/* 已选文件列表 */}
              {selectedFiles.length > 0 && (
                <Box>
                  <Text fontSize="14px" color="#1D2129" mb={2}>
                    {t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.selectedFile')}
                  </Text>
                  <VStack align="stretch" spacing={2} maxH="240px" overflowY="auto">
                    {selectedFiles.map((item) => (
                      <Flex
                        key={item.id}
                        align="center"
                        gap={3}
                        p={3}
                        bg="#F7F8FA"
                        borderRadius="10px"
                      >
                        <DocIcon />
                        <Box flex="1" minW={0}>
                          <Text fontSize="14px" color="#1D2129" fontWeight={500} noOfLines={1}>
                            {item.file.name}
                          </Text>
                          <Text fontSize="12px" color={item.error ? '#C8000B' : '#86909C'}>
                            {item.uploading
                              ? t(
                                  'aiTeacher.avatar.create.step2.matching.uploadResourceModal.uploading'
                                )
                              : item.error
                                ? item.error
                                : formatFileSize(item.file.size)}
                          </Text>
                        </Box>
                        {item.uploading ? (
                          <Spinner size="sm" color="#C8000B" />
                        ) : (
                          <IconButton
                            aria-label="remove"
                            icon={
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#86909C"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                              </svg>
                            }
                            size="sm"
                            variant="ghost"
                            color="#86909C"
                            _hover={{ color: '#C8000B', bg: 'transparent' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(item.id);
                            }}
                          />
                        )}
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              )}
            </Box>
          )}
        </ModalBody>

        {/* 底部按钮 */}
        <ModalFooter justifyContent="flex-end" py={4} px={5} gap={3} borderTop="1px solid #F0F0F0">
          <Button
            variant="outline"
            borderColor="#2D2D2D"
            color="#2D2D2D"
            bg="white"
            px={5}
            h="36px"
            fontSize="14px"
            borderRadius="8px"
            _hover={{ bg: '#F5F5F5', borderColor: '#1F1F1F' }}
            onClick={handleClose}
          >
            {t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.cancel')}
          </Button>
          <Button
            bg="#2D2D2D"
            color="white"
            px={5}
            h="36px"
            fontSize="14px"
            borderRadius="8px"
            _hover={{ bg: '#1F1F1F' }}
            onClick={handleConfirm}
            isDisabled={!hasSelection}
          >
            {t('aiTeacher.avatar.create.step2.matching.uploadResourceModal.confirmAdd')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
