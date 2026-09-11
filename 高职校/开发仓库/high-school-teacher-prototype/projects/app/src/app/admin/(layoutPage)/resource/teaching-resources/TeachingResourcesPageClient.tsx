'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  useToast,
  Spinner,
  IconButton,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import { useTranslation } from 'react-i18next';
import Pagination from '@/app/admin/components/Pagination';
import ResourceSettingsModal from './components/ResourceSettingsModal';
import DraftsModal from './components/DraftsModal';
import UploadResourceModal from './components/UploadResourceModal';
import EditResourceModal from './components/EditResourceModal';
import ShareResourceModal from './components/ShareResourceModal';
import PreviewResourceModal from './components/PreviewResourceModal';
import ConfirmStatusModal from './components/ConfirmStatusModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import {
  getResourcePage,
  deleteResource,
  batchUpdateResourceStatus,
  batchDeleteResource,
  updateResource,
  getResourceDetail,
  batchPublishResource,
  batchUnpublishResource,
  unpublishResource,
  downloadResource,
  getTeacherNames,
  getMajorNames,
  getCourseNames,
  getResourceTypeList
} from '@/api/admin/resource-center/teaching-resource';
import type { ResourceVO } from '@/types/api/admin/resource-center/teaching-resource';
import { EOwnerType, EResourceStatus } from '@/types/api/admin/resource-center/teaching-resource';
import NewDateRangePicker from '@/components/common/NewDateRangePicker';
import { FileIcon } from '@/app/teacher/(layoutPage)/profile/components/FileIcon';
import { downloadFileFromUrl } from '@/web/common/file/utils';

// 文件格式图标颜色映射
const FILE_FORMAT_COLORS: Record<string, string> = {
  pdf: '#F53F3F',
  doc: '#2B7BF6',
  docx: '#2B7BF6',
  ppt: '#FF6B35',
  pptx: '#FF6B35',
  video: '#7B61FF',
  zip: '#9CA3AF',
  html: '#10B981',
  link: '#8B5CF6'
};

// 归属类型颜色映射
const OWNERSHIP_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#F0E8FF', color: '#7B61FF' },
  2: { bg: '#E8F4FD', color: '#2B7BF6' }
};

// 状态映射（使用 isDeleted 字段）
const STATUS_MAP: Record<number, string> = {
  0: 'draft',
  1: 'onShelf',
  2: 'offShelf'
};

// 共享范围映射
const SHARE_SCOPE_MAP: Record<number, string> = {
  1: 'personal',
  2: 'school'
};

// 文件大小格式化
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const PAGE_I18N_SECTIONS: Parameters<typeof useAdminPageI18n>[0] = ['resource'];

export default function TeachingResourcesPageClient() {
  const isI18nReady = useAdminPageI18n(PAGE_I18N_SECTIONS);
  const { t } = useTranslation('admin');
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const formatOptions = useMemo(
    () => [
      { key: 'PDF' },
      { key: 'Word' },
      { key: 'PPT' },
      { key: 'video' },
      { key: 'zip' },
      { key: 'html' },
      { key: 'link' }
    ],
    []
  );

  const getFormatLabel = (key: string) => {
    switch (key) {
      case 'PDF':
        return t('resource.format.pdf');
      case 'Word':
        return t('resource.format.word');
      case 'PPT':
        return t('resource.format.ppt');
      case 'video':
        return t('resource.format.video');
      case 'zip':
        return t('resource.format.zip');
      case 'html':
        return t('resource.format.html');
      case 'link':
        return t('resource.format.link');
      default:
        return key;
    }
  };

  const [resources, setResources] = useState<ResourceVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 搜索表单状态
  const [major, setMajor] = useState('');
  const [course, setCourse] = useState('');
  const [uploader, setUploader] = useState('');
  const [ownershipLevel, setOwnershipLevel] = useState('');
  const [status, setStatus] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [source, setSource] = useState('');
  const [formatType, setFormatType] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [searchName, setSearchName] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [draftForUpload, setDraftForUpload] = useState<ResourceVO | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceVO | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [sharingResource, setSharingResource] = useState<ResourceVO | null>(null);
  const [isConfirmStatusOpen, setIsConfirmStatusOpen] = useState(false);
  const [confirmStatusAction, setConfirmStatusAction] = useState<'onShelf' | 'offShelf'>('onShelf');
  const [confirmStatusResource, setConfirmStatusResource] = useState<ResourceVO | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [confirmDeleteResource, setConfirmDeleteResource] = useState<ResourceVO | null>(null);

  // 预览弹窗状态
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewResourceId, setPreviewResourceId] = useState<number | null>(null);
  const [previewResourceName, setPreviewResourceName] = useState('');
  const [previewFileFormat, setPreviewFileFormat] = useState('');

  // 专业、课程和上传人输入筛选状态
  const [majorInput, setMajorInput] = useState('');
  const [courseInput, setCourseInput] = useState('');
  const [uploaderInput, setUploaderInput] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showUploaderDropdown, setShowUploaderDropdown] = useState(false);
  const majorRef = useRef<HTMLDivElement>(null);
  const courseRef = useRef<HTMLDivElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);

  const [isMajorFiltering, setIsMajorFiltering] = useState(false);
  const [isCourseFiltering, setIsCourseFiltering] = useState(false);
  const [isUploaderFiltering, setIsUploaderFiltering] = useState(false);

  // 自定义下拉框状态（归属层级、状态、资源类型、来源、格式）
  const [showOwnershipDropdown, setShowOwnershipDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showResourceTypeDropdown, setShowResourceTypeDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const ownershipRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const resourceTypeRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);

  // 上传人接口数据
  const [teacherOptions, setTeacherOptions] = useState<{ id: number; name: string }[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);

  // 专业接口数据
  const [majorOptions, setMajorOptions] = useState<{ id: string; name: string }[]>([]);
  const [majorLoading, setMajorLoading] = useState(false);

  // 课程接口数据
  const [courseOptions, setCourseOptions] = useState<{ id: number; name: string }[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);

  // 资源类型接口数据
  const [resourceTypeOptions, setResourceTypeOptions] = useState<{ id: number; name: string }[]>(
    []
  );

  const filteredMajorOptions = isMajorFiltering
    ? majorOptions.filter((m) => m.name.includes(majorInput))
    : majorOptions;
  const filteredCourseOptions = isCourseFiltering
    ? courseOptions.filter((c) => c.name.includes(courseInput))
    : courseOptions;
  const filteredUploaderOptions = isUploaderFiltering
    ? teacherOptions.filter((u) => u.name.includes(uploaderInput))
    : teacherOptions;

  // 搜索参数转换映射
  const getOwnerTypeValue = (label: string): number | undefined => {
    switch (label) {
      case 'personal':
        return 1;
      case 'school':
        return 2;
      default:
        return undefined;
    }
  };

  const getStatusValue = (label: string): EResourceStatus | undefined => {
    switch (label) {
      case 'onShelf':
        return EResourceStatus.PUBLISHED;
      case 'offShelf':
        return EResourceStatus.UNPUBLISHED;
      default:
        return undefined;
    }
  };

  const getResourceTypeValue = (label: string): number | undefined => {
    const found = resourceTypeOptions.find((t) => t.name === label);
    return found ? found.id : undefined;
  };

  const getFormatTypeValue = (label: string): number | undefined => {
    const formatMap: Record<string, number> = {
      PDF: 1,
      Word: 2,
      PPT: 3,
      video: 4,
      zip: 5,
      html: 6,
      link: 7
    };
    return formatMap[label] ?? undefined;
  };

  // 获取教师名称列表（上传人下拉框）
  const fetchTeacherNames = useCallback(async (searchKey?: string) => {
    setTeacherLoading(true);
    try {
      const res = await getTeacherNames(searchKey ? { searchKey } : undefined);
      setTeacherOptions(res);
    } catch {
      // 静默失败，保持空列表
    } finally {
      setTeacherLoading(false);
    }
  }, []);

  // 获取专业名称列表（专业下拉框）
  const fetchMajorNames = useCallback(async (searchKey?: string) => {
    setMajorLoading(true);
    try {
      const res = await getMajorNames(searchKey ? { searchKey } : undefined);
      setMajorOptions(res);
    } catch {
      // 静默失败，保持空列表
    } finally {
      setMajorLoading(false);
    }
  }, []);

  // 获取课程名称列表（课程下拉框）
  const fetchCourseNames = useCallback(
    async (searchKey?: string) => {
      setCourseLoading(true);
      try {
        const res = await getCourseNames({
          majorId: major ? Number(major) : undefined,
          searchKey: searchKey || undefined
        });
        setCourseOptions(res);
      } catch {
        // 静默失败，保持空列表
      } finally {
        setCourseLoading(false);
      }
    },
    [major]
  );

  // 查询版本号，用于触发查询
  const [queryVersion, setQueryVersion] = useState(0);

  // 获取列表数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        current: currentPage,
        size: pageSize,
        majorId: major ? Number(major) : undefined,
        courseId: course ? Number(course) : undefined,
        ownerType: getOwnerTypeValue(ownershipLevel),
        status: getStatusValue(status),
        resourceType: getResourceTypeValue(resourceType),
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
        uploaderId: uploader ? Number(uploader) : undefined,
        sourceType: source ? Number(source) : undefined,
        formatType: getFormatTypeValue(formatType),
        searchKey: searchName || undefined
      };

      const res = await getResourcePage(params);
      setResources(res.records);
      setTotal(res.total);
    } catch (error) {
      toastRef.current({
        title: t('resource.messages.fetchListFailed'),
        status: 'error',
        duration: 2000
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    major,
    course,
    ownershipLevel,
    status,
    resourceType,
    dateStart,
    dateEnd,
    uploader,
    source,
    formatType,
    searchName
  ]);

  // 初始加载和查询版本变化时获取数据
  useEffect(() => {
    if (isI18nReady) {
      fetchData();
    }
  }, [isI18nReady, queryVersion]);

  // 搜索条件变化时重置页码并触发查询
  useEffect(() => {
    if (isI18nReady) {
      setCurrentPage(1);
      setQueryVersion((v) => v + 1);
    }
  }, [isI18nReady, major, course, uploader, ownershipLevel, status, resourceType, source, formatType, dateStart, dateEnd, searchName]);

  // 页码或页大小变化时触发查询
  useEffect(() => {
    if (isI18nReady) {
      setQueryVersion((v) => v + 1);
    }
  }, [isI18nReady, currentPage, pageSize]);

  // 上传人下拉框聚焦时加载教师列表
  useEffect(() => {
    if (isI18nReady && showUploaderDropdown && teacherOptions.length === 0) {
      fetchTeacherNames(isUploaderFiltering ? uploaderInput || undefined : undefined);
    }
  }, [
    isI18nReady,
    showUploaderDropdown,
    uploaderInput,
    isUploaderFiltering,
    teacherOptions.length,
    fetchTeacherNames
  ]);

  // 专业下拉框聚焦时加载专业列表（仅首次展开且为空时加载）
  useEffect(() => {
    if (isI18nReady && showMajorDropdown && majorOptions.length === 0) {
      fetchMajorNames();
    }
  }, [isI18nReady, showMajorDropdown, majorOptions.length, fetchMajorNames]);

  // 课程下拉框聚焦时加载课程列表（仅首次展开且为空时加载）
  useEffect(() => {
    if (isI18nReady && showCourseDropdown && courseOptions.length === 0) {
      fetchCourseNames();
    }
  }, [isI18nReady, showCourseDropdown, courseOptions.length, fetchCourseNames]);

  // 专业变化时清空已选课程和课程列表（级联刷新）
  useEffect(() => {
    setCourse('');
    setCourseInput('');
    setCourseOptions([]);
    setIsCourseFiltering(false);
    setShowCourseDropdown(false);
  }, [major]);

  // 初始加载资源类型列表
  useEffect(() => {
    if (isI18nReady) {
      getResourceTypeList()
        .then((list) => {
          setResourceTypeOptions(list.map((item) => ({ id: item.id, name: item.name })));
        })
        .catch(() => {
          // 静默失败
        });
    }
  }, [isI18nReady]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorRef.current && !majorRef.current.contains(event.target as Node)) {
        setShowMajorDropdown(false);
      }
      if (courseRef.current && !courseRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
      }
      if (uploaderRef.current && !uploaderRef.current.contains(event.target as Node)) {
        setShowUploaderDropdown(false);
      }
      if (ownershipRef.current && !ownershipRef.current.contains(event.target as Node)) {
        setShowOwnershipDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (resourceTypeRef.current && !resourceTypeRef.current.contains(event.target as Node)) {
        setShowResourceTypeDropdown(false);
      }
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false);
      }
      if (formatRef.current && !formatRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 监听头部按钮事件
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleOpenDrafts = () => setIsDraftsOpen(true);
    const handleOpenUpload = () => setIsUploadOpen(true);

    window.addEventListener('teaching-resource:open-settings', handleOpenSettings);
    window.addEventListener('teaching-resource:open-drafts', handleOpenDrafts);
    window.addEventListener('teaching-resource:open-upload', handleOpenUpload);

    return () => {
      window.removeEventListener('teaching-resource:open-settings', handleOpenSettings);
      window.removeEventListener('teaching-resource:open-drafts', handleOpenDrafts);
      window.removeEventListener('teaching-resource:open-upload', handleOpenUpload);
    };
  }, []);

  if (!isI18nReady) return null;

  const allSelected = resources.length > 0 && selectedIds.length === resources.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < resources.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(resources.map((item) => item.id));
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  // 批量上架
  const handleBatchPublish = async () => {
    try {
      await batchPublishResource(selectedIds);
      toastRef.current({
        title: t('resource.messages.batchPublishSuccess', { count: selectedIds.length }),
        status: 'success',
        duration: 1500
      });
      setSelectedIds([]);
      setQueryVersion((v) => v + 1);
    } catch {
      toastRef.current({
        title: t('resource.messages.batchPublishFailed'),
        status: 'error',
        duration: 2000
      });
    }
  };

  // 批量下架
  const handleBatchUnpublish = async () => {
    try {
      await batchUnpublishResource(selectedIds);
      toastRef.current({
        title: t('resource.messages.batchUnpublishSuccess', { count: selectedIds.length }),
        status: 'success',
        duration: 1500
      });
      setSelectedIds([]);
      setQueryVersion((v) => v + 1);
    } catch {
      toastRef.current({
        title: t('resource.messages.batchUnpublishFailed'),
        status: 'error',
        duration: 2000
      });
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    try {
      await batchDeleteResource({ ids: selectedIds });
      toastRef.current({
        title: t('resource.messages.batchDeleteSuccess', { count: selectedIds.length }),
        status: 'success',
        duration: 1500
      });
      setSelectedIds([]);
      setQueryVersion((v) => v + 1);
    } catch {
      toastRef.current({
        title: t('resource.messages.batchDeleteFailed'),
        status: 'error',
        duration: 2000
      });
    }
  };

  const handleCancelSelection = () => {
    setSelectedIds([]);
  };

  // 状态标签样式 - 圆点样式
  const getStatusStyle = (status: number) => {
    switch (status) {
      case EResourceStatus.PUBLISHED:
        return { dotColor: '#52C41A', text: t('resource.status.onShelf') };
      case EResourceStatus.UNPUBLISHED:
        return { dotColor: '#999999', text: t('resource.status.offShelf') };
      case EResourceStatus.DRAFT:
        return { dotColor: '#FAAD14', text: t('resource.status.draft') };
      default:
        return { dotColor: '#999999', text: '--' };
    }
  };

  // 共享范围标签样式
  const getShareScopeStyle = (shareScope: number) => {
    switch (shareScope) {
      case 2:
        return { bg: '#FFF7E6', color: '#FAAD14', text: t('resource.shareScope.school') };
      case 1:
        return { bg: '#E8FFEA', color: '#166534', text: t('resource.shareScope.personal') };
      case 3:
        return { bg: '#E6F0FF', color: '#2B7BF6', text: t('resource.shareScope.department') };
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* 搜索区和表格区容器 */}
      <Box bg="#fff" borderRadius="8px">
        {/* 搜索栏 */}
        <Box p={4}>
          {/* 第一行 - 筛选器 */}
          <Flex gap={3} align="center" mb={3} flexWrap="wrap">
            <Box ref={majorRef} position="relative" flex={{
              base: '1 1 100%',
              sm: '1 1 calc(50% - 6px)',
              md: '1 1 calc(33.333% - 8px)',
              lg: '1 1 calc(25% - 9px)',
              xl: 0.8
            }}>
              <InputGroup>
                <Input
                  placeholder={t('resource.filter.allMajors')}
                  value={majorInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMajorInput(value);
                    setIsMajorFiltering(true);
                    setShowMajorDropdown(true);
                    if (value === '') {
                      setMajor('');
                    }
                  }}
                  onFocus={() => {
                    setShowMajorDropdown(true);
                    setIsMajorFiltering(false);
                    if (major) {
                      const selected = majorOptions.find((m) => m.id === major);
                      setMajorInput(selected ? selected.name : '');
                    } else {
                      setMajorInput('');
                    }
                  }}
                  h="36px"
                  fontSize="14px"
                  borderColor="#E5E6EB"
                  borderRadius="6px"
                  pr="28px"
                  _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                />
                {majorInput && (
                  <InputRightElement h="36px" w="28px" justifyContent="center">
                    <Box
                      as="span"
                      cursor="pointer"
                      color="#C9CDD4"
                      _hover={{ color: '#86909C' }}
                      onClick={() => {
                        setMajor('');
                        setMajorInput('');
                        setIsMajorFiltering(false);
                      }}
                      display="flex"
                      alignItems="center"
                    >
                      <CloseIcon w={2.5} h={2.5} />
                    </Box>
                  </InputRightElement>
                )}
              </InputGroup>
              {showMajorDropdown && (
                <Box
                  position="absolute"
                  top="40px"
                  left={0}
                  w="100%"
                  maxH="200px"
                  overflowY="auto"
                  border="1px solid #E5E6EB"
                  borderRadius="6px"
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  zIndex={10}
                  bg="white"
                >
                  {majorLoading ? (
                    <Box px={3} py={2} fontSize="14px" color="#86909C">
                      {t('resource.table.loading')}
                    </Box>
                  ) : filteredMajorOptions.length === 0 ? (
                    <Box px={3} py={2} fontSize="14px" color="#86909C">
                      {t('resource.table.noData')}
                    </Box>
                  ) : (
                    <>
                      {filteredMajorOptions.map((option) => (
                        <Box
                          key={option.id}
                          px={3}
                          py={2}
                          fontSize="14px"
                          cursor="pointer"
                          _hover={{ bg: '#F7F8FA' }}
                          bg={major === option.id ? '#FFF5F5' : 'white'}
                          color={major === option.id ? '#C8000B' : '#1D2129'}
                          onClick={() => {
                            setMajor(option.id);
                            setMajorInput(option.name);
                            setIsMajorFiltering(false);
                            setShowMajorDropdown(false);
                          }}
                        >
                          {option.name}
                        </Box>
                      ))}
                    </>
                  )}
                </Box>
              )}
            </Box>
            <Box ref={courseRef} position="relative" flex={{
              base: '1 1 100%',
              sm: '1 1 calc(50% - 6px)',
              md: '1 1 calc(33.333% - 8px)',
              lg: '1 1 calc(25% - 9px)',
              xl: 0.8
            }}>
              <InputGroup>
                <Input
                  placeholder={t('resource.filter.allCourses')}
                  value={courseInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCourseInput(value);
                    setIsCourseFiltering(true);
                    setShowCourseDropdown(true);
                    if (value === '') {
                      setCourse('');
                    }
                  }}
                  onFocus={() => {
                    setShowCourseDropdown(true);
                    setIsCourseFiltering(false);
                    if (course) {
                      const selected = courseOptions.find((c) => String(c.id) === course);
                      setCourseInput(selected ? selected.name : '');
                    } else {
                      setCourseInput('');
                    }
                  }}
                  h="36px"
                  fontSize="14px"
                  borderColor="#E5E6EB"
                  borderRadius="6px"
                  pr="28px"
                  _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                />
                {courseInput && (
                  <InputRightElement h="36px" w="28px" justifyContent="center">
                    <Box
                      as="span"
                      cursor="pointer"
                      color="#C9CDD4"
                      _hover={{ color: '#86909C' }}
                      onClick={() => {
                        setCourse('');
                        setCourseInput('');
                        setIsCourseFiltering(false);
                      }}
                      display="flex"
                      alignItems="center"
                    >
                      <CloseIcon w={2.5} h={2.5} />
                    </Box>
                  </InputRightElement>
                )}
              </InputGroup>
              {showCourseDropdown && (
                <Box
                  position="absolute"
                  top="40px"
                  left={0}
                  w="100%"
                  maxH="200px"
                  overflowY="auto"
                  border="1px solid #E5E6EB"
                  borderRadius="6px"
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  zIndex={10}
                  bg="white"
                >
                  {courseLoading ? (
                    <Box px={3} py={2} fontSize="14px" color="#86909C">
                      {t('resource.table.loading')}
                    </Box>
                  ) : filteredCourseOptions.length === 0 ? (
                    <Box px={3} py={2} fontSize="14px" color="#86909C">
                      {t('resource.table.noData')}
                    </Box>
                  ) : (
                    <>
                      {filteredCourseOptions.map((option) => (
                        <Box
                          key={option.id}
                          px={3}
                          py={2}
                          fontSize="14px"
                          cursor="pointer"
                          _hover={{ bg: '#F7F8FA' }}
                          bg={course === String(option.id) ? '#FFF5F5' : 'white'}
                          color={course === String(option.id) ? '#C8000B' : '#1D2129'}
                          onClick={() => {
                            setCourse(String(option.id));
                            setCourseInput(option.name);
                            setIsCourseFiltering(false);
                            setShowCourseDropdown(false);
                          }}
                        >
                          {option.name}
                        </Box>
                      ))}
                    </>
                  )}
                </Box>
              )}
            </Box>
            <Box ref={uploaderRef} position="relative" flex={{
              base: '1 1 100%',
              sm: '1 1 calc(50% - 6px)',
              md: '1 1 calc(33.333% - 8px)',
              lg: '1 1 calc(25% - 9px)',
              xl: 0.8
            }}>
              <InputGroup>
                <Input
                  placeholder={t('resource.filter.allUploaders')}
                  value={uploaderInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUploaderInput(value);
                    setIsUploaderFiltering(true);
                    setShowUploaderDropdown(true);
                    if (value === '') {
                      setUploader('');
                    }
                  }}
                  onFocus={() => {
                    setShowUploaderDropdown(true);
                    setIsUploaderFiltering(false);
                    if (uploader) {
                      const selected = teacherOptions.find((t) => String(t.id) === uploader);
                      setUploaderInput(selected ? selected.name : '');
                    } else {
                      setUploaderInput('');
                    }
                  }}
                  h="36px"
                  fontSize="14px"
                  borderColor="#E5E6EB"
                  borderRadius="6px"
                  pr="28px"
                  _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                />
                {uploaderInput && (
                  <InputRightElement h="36px" w="28px" justifyContent="center">
                    <Box
                      as="span"
                      cursor="pointer"
                      color="#C9CDD4"
                      _hover={{ color: '#86909C' }}
                      onClick={() => {
                        setUploader('');
                        setUploaderInput('');
                        setIsUploaderFiltering(false);
                      }}
                      display="flex"
                      alignItems="center"
                    >
                      <CloseIcon w={2.5} h={2.5} />
                    </Box>
                  </InputRightElement>
                )}
              </InputGroup>
              {showUploaderDropdown && (
                <Box
                  position="absolute"
                  top="40px"
                  left={0}
                  w="100%"
                  maxH="200px"
                  overflowY="auto"
                  border="1px solid #E5E6EB"
                  borderRadius="6px"
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  zIndex={10}
                  bg="white"
                >
                  {teacherLoading ? (
                    <Box px={3} py={2} fontSize="14px" color="#86909C">
                      {t('resource.table.loading')}
                    </Box>
                  ) : filteredUploaderOptions.length === 0 ? (
                    <Box px={3} py={2} fontSize="14px" color="#86909C">
                      {t('resource.table.noData')}
                    </Box>
                  ) : (
                    <>
                      {filteredUploaderOptions.map((option) => (
                        <Box
                          key={option.id}
                          px={3}
                          py={2}
                          fontSize="14px"
                          cursor="pointer"
                          _hover={{ bg: '#F7F8FA' }}
                          bg={uploader === String(option.id) ? '#FFF5F5' : 'white'}
                          color={uploader === String(option.id) ? '#C8000B' : '#1D2129'}
                          onClick={() => {
                            setUploader(String(option.id));
                            setUploaderInput(option.name);
                            setIsUploaderFiltering(false);
                            setShowUploaderDropdown(false);
                          }}
                        >
                          {option.name}
                        </Box>
                      ))}
                    </>
                  )}
                </Box>
              )}
            </Box>
            <Box ref={ownershipRef} position="relative" flex={{
              base: '1 1 100%',
              sm: '1 1 calc(50% - 6px)',
              md: '1 1 calc(33.333% - 8px)',
              lg: '1 1 calc(25% - 9px)',
              xl: 0.8
            }}>
              <InputGroup>
                <Input
                  placeholder={t('resource.filter.allLevels')}
                  value={ownershipLevel ? t(`resource.ownership.${ownershipLevel}`) : ''}
                  readOnly
                  onClick={() => setShowOwnershipDropdown(true)}
                  onFocus={() => setShowOwnershipDropdown(true)}
                  h="36px"
                  fontSize="14px"
                  borderColor="#E5E6EB"
                  borderRadius="6px"
                  pr="28px"
                  _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                />
                <InputRightElement h="36px" w="28px" justifyContent="center">
                  {ownershipLevel ? (
                    <Box
                      as="span"
                      cursor="pointer"
                      color="#C9CDD4"
                      _hover={{ color: '#86909C' }}
                      onClick={() => setOwnershipLevel('')}
                      display="flex"
                      alignItems="center"
                    >
                      <CloseIcon w={2.5} h={2.5} />
                    </Box>
                  ) : (
                    <Box
                      as="span"
                      cursor="pointer"
                      color="#86909C"
                      onClick={() => setShowOwnershipDropdown(true)}
                      display="flex"
                      alignItems="center"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6,9 12,15 18,9" />
                      </svg>
                    </Box>
                  )}
                </InputRightElement>
              </InputGroup>
              {showOwnershipDropdown && (
                <Box
                  position="absolute"
                  top="40px"
                  left={0}
                  w="100%"
                  maxH="200px"
                  overflowY="auto"
                  border="1px solid #E5E6EB"
                  borderRadius="6px"
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  zIndex={10}
                  bg="white"
                >
                  {[
                    { key: 'personal', label: t('resource.ownership.personal') },
                    { key: 'school', label: t('resource.ownership.school') }
                  ].map((item) => (
                    <Box
                      key={item.key}
                      px={3}
                      py={2}
                      fontSize="14px"
                      cursor="pointer"
                      _hover={{ bg: '#F7F8FA' }}
                      bg={ownershipLevel === item.key ? '#FFF5F5' : 'white'}
                      color={ownershipLevel === item.key ? '#C8000B' : '#1D2129'}
                      onClick={() => {
                        setOwnershipLevel(item.key);
                        setShowOwnershipDropdown(false);
                      }}
                    >
                      {item.label}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <Box ref={statusRef} position="relative" flex={{
              base: '1 1 100%',
              sm: '1 1 calc(50% - 6px)',
              md: '1 1 calc(33.333% - 8px)',
              lg: '1 1 calc(25% - 9px)',
              xl: 0.8
            }}>
              <InputGroup>
                <Input
                  placeholder={t('resource.filter.allStatus')}
                  value={status ? t(`resource.status.${status}`) : ''}
                  readOnly
                  onClick={() => setShowStatusDropdown(true)}
                  onFocus={() => setShowStatusDropdown(true)}
                  h="36px"
                  fontSize="14px"
                  borderColor="#E5E6EB"
                  borderRadius="6px"
                  pr="28px"
                  _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                />
                <InputRightElement h="36px" w="28px" justifyContent="center">
                  {status ? (
                    <Box
                      as="span"
                      cursor="pointer"
                      color="#C9CDD4"
                      _hover={{ color: '#86909C' }}
                      onClick={() => setStatus('')}
                      display="flex"
                      alignItems="center"
                    >
                      <CloseIcon w={2.5} h={2.5} />
                    </Box>
                  ) : (
                    <Box
                      as="span"
                      cursor="pointer"
                      color="#86909C"
                      onClick={() => setShowStatusDropdown(true)}
                      display="flex"
                      alignItems="center"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6,9 12,15 18,9" />
                      </svg>
                    </Box>
                  )}
                </InputRightElement>
              </InputGroup>
              {showStatusDropdown && (
                <Box
                  position="absolute"
                  top="40px"
                  left={0}
                  w="100%"
                  maxH="200px"
                  overflowY="auto"
                  border="1px solid #E5E6EB"
                  borderRadius="6px"
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  zIndex={10}
                  bg="white"
                >
                  {[
                    { key: 'onShelf', label: t('resource.status.onShelf') },
                    { key: 'offShelf', label: t('resource.status.offShelf') }
                  ].map((item) => (
                    <Box
                      key={item.key}
                      px={3}
                      py={2}
                      fontSize="14px"
                      cursor="pointer"
                      _hover={{ bg: '#F7F8FA' }}
                      bg={status === item.key ? '#FFF5F5' : 'white'}
                      color={status === item.key ? '#C8000B' : '#1D2129'}
                      onClick={() => {
                        setStatus(item.key);
                        setShowStatusDropdown(false);
                      }}
                    >
                      {item.label}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <Box ref={resourceTypeRef} position="relative" flex={{
              base: '1 1 100%',
              sm: '1 1 calc(50% - 6px)',
              md: '1 1 calc(33.333% - 8px)',
              lg: '1 1 calc(25% - 9px)',
              xl: 0.8
            }}>
              <InputGroup>
                <Input
                  placeholder={t('resource.filter.allTypes')}
                  value={resourceTypeOptions.find((t) => t.name === resourceType)?.name || ''}
                  readOnly
                  onClick={() => setShowResourceTypeDropdown(true)}
                  onFocus={() => setShowResourceTypeDropdown(true)}
                  h="36px"
                  fontSize="14px"
                  borderColor="#E5E6EB"
                  borderRadius="6px"
                  pr="28px"
                  _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                />
                <InputRightElement h="36px" w="28px" justifyContent="center">
                  {resourceType ? (
                    <Box
                      as="span"
                      cursor="pointer"
                      color="#C9CDD4"
                      _hover={{ color: '#86909C' }}
                      onClick={() => setResourceType('')}
                      display="flex"
                      alignItems="center"
                    >
                      <CloseIcon w={2.5} h={2.5} />
                    </Box>
                  ) : (
                    <Box
                      as="span"
                      cursor="pointer"
                      color="#86909C"
                      onClick={() => setShowResourceTypeDropdown(true)}
                      display="flex"
                      alignItems="center"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6,9 12,15 18,9" />
                      </svg>
                    </Box>
                  )}
                </InputRightElement>
              </InputGroup>
              {showResourceTypeDropdown && (
                <Box
                  position="absolute"
                  top="40px"
                  left={0}
                  w="100%"
                  maxH="200px"
                  overflowY="auto"
                  border="1px solid #E5E6EB"
                  borderRadius="6px"
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  zIndex={10}
                  bg="white"
                >
                  {resourceTypeOptions.length === 0 ? (
                    <Box px={3} py={2} fontSize="14px" color="#86909C">
                      {t('resource.table.noData')}
                    </Box>
                  ) : (
                    <>
                      {resourceTypeOptions.map((item) => (
                        <Box
                          key={item.id}
                          px={3}
                          py={2}
                          fontSize="14px"
                          cursor="pointer"
                          _hover={{ bg: '#F7F8FA' }}
                          bg={resourceType === item.name ? '#FFF5F5' : 'white'}
                          color={resourceType === item.name ? '#C8000B' : '#1D2129'}
                          onClick={() => {
                            setResourceType(item.name);
                            setShowResourceTypeDropdown(false);
                          }}
                        >
                          {item.name}
                        </Box>
                      ))}
                    </>
                  )}
                </Box>
              )}
            </Box>
            <NewDateRangePicker
              startValue={dateStart}
              endValue={dateEnd}
              onStartChange={setDateStart}
              onEndChange={setDateEnd}
              flex={{
                base: '1 1 100%',
                sm: '1 1 calc(50% - 6px)',
                md: '1 1 calc(33.333% - 8px)',
                lg: '1 1 calc(25% - 9px)',
                xl: '1.5'
              }}
            />
            <InputGroup
              flex={{
                base: '1 1 100%',
                sm: '1 1 calc(50% - 6px)',
                md: '1 1 calc(33.333% - 8px)',
                lg: '1 1 calc(25% - 9px)',
                xl: '1.5'
              }}
            >
              <Input
                placeholder={t('resource.search.placeholder')}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                h="36px"
                fontSize="14px"
                borderColor="#E5E6EB"
                borderRadius="6px"
              />
              <InputRightElement h="36px" cursor="pointer">
                <SearchIcon color="#86909C" w={4} h={4} />
              </InputRightElement>
            </InputGroup>
          </Flex>

          {/* 第二行 - 来源筛选 + 按钮 */}
          <Flex justify="space-between" align="center" gap={3}>
            <Flex gap={3} flex="1" align="center">
              <Box ref={sourceRef} position="relative" w="219px">
                <InputGroup>
                  <Input
                    placeholder={t('resource.filter.allSources')}
                    value={source ? t(`resource.source.${source === '1' ? 'schoolLibrary' : 'aiLibrary'}`) : ''}
                    readOnly
                    onClick={() => setShowSourceDropdown(true)}
                    onFocus={() => setShowSourceDropdown(true)}
                    h="36px"
                    fontSize="14px"
                    borderColor="#E5E6EB"
                    borderRadius="6px"
                    pr="28px"
                    _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                  />
                  <InputRightElement h="36px" w="28px" justifyContent="center">
                    {source ? (
                      <Box
                        as="span"
                        cursor="pointer"
                        color="#C9CDD4"
                        _hover={{ color: '#86909C' }}
                        onClick={() => setSource('')}
                        display="flex"
                        alignItems="center"
                      >
                        <CloseIcon w={2.5} h={2.5} />
                      </Box>
                    ) : (
                      <Box
                        as="span"
                        cursor="pointer"
                        color="#86909C"
                        onClick={() => setShowSourceDropdown(true)}
                        display="flex"
                        alignItems="center"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6,9 12,15 18,9" />
                        </svg>
                      </Box>
                    )}
                  </InputRightElement>
                </InputGroup>
                {showSourceDropdown && (
                  <Box
                    position="absolute"
                    top="40px"
                    left={0}
                    w="100%"
                    maxH="200px"
                    overflowY="auto"
                    border="1px solid #E5E6EB"
                    borderRadius="6px"
                    boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    zIndex={10}
                    bg="white"
                  >
                    {[
                      { key: '1', label: t('resource.source.schoolLibrary') },
                      { key: '2', label: t('resource.source.aiLibrary') }
                    ].map((item) => (
                      <Box
                        key={item.key}
                        px={3}
                        py={2}
                        fontSize="14px"
                        cursor="pointer"
                        _hover={{ bg: '#F7F8FA' }}
                        bg={source === item.key ? '#FFF5F5' : 'white'}
                        color={source === item.key ? '#C8000B' : '#1D2129'}
                        onClick={() => {
                          setSource(item.key);
                          setShowSourceDropdown(false);
                        }}
                      >
                        {item.label}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
              <Box ref={formatRef} position="relative" w="219px">
                <InputGroup>
                  <Input
                    placeholder={t('resource.filter.allFormats')}
                    value={formatType ? getFormatLabel(formatType) : ''}
                    readOnly
                    onClick={() => setShowFormatDropdown(true)}
                    onFocus={() => setShowFormatDropdown(true)}
                    h="36px"
                    fontSize="14px"
                    borderColor="#E5E6EB"
                    borderRadius="6px"
                    pr="28px"
                    _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                  />
                  <InputRightElement h="36px" w="28px" justifyContent="center">
                    {formatType ? (
                      <Box
                        as="span"
                        cursor="pointer"
                        color="#C9CDD4"
                        _hover={{ color: '#86909C' }}
                        onClick={() => setFormatType('')}
                        display="flex"
                        alignItems="center"
                      >
                        <CloseIcon w={2.5} h={2.5} />
                      </Box>
                    ) : (
                      <Box
                        as="span"
                        cursor="pointer"
                        color="#86909C"
                        onClick={() => setShowFormatDropdown(true)}
                        display="flex"
                        alignItems="center"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6,9 12,15 18,9" />
                        </svg>
                      </Box>
                    )}
                  </InputRightElement>
                </InputGroup>
                {showFormatDropdown && (
                  <Box
                    position="absolute"
                    top="40px"
                    left={0}
                    w="100%"
                    maxH="200px"
                    overflowY="auto"
                    border="1px solid #E5E6EB"
                    borderRadius="6px"
                    boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    zIndex={10}
                    bg="white"
                  >
                    {formatOptions.map((item) => (
                      <Box
                        key={item.key}
                        px={3}
                        py={2}
                        fontSize="14px"
                        cursor="pointer"
                        _hover={{ bg: '#F7F8FA' }}
                        bg={formatType === item.key ? '#FFF5F5' : 'white'}
                        color={formatType === item.key ? '#C8000B' : '#1D2129'}
                        onClick={() => {
                          setFormatType(item.key);
                          setShowFormatDropdown(false);
                        }}
                      >
                        {getFormatLabel(item.key)}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Flex>
            <Flex gap={3}>
              <Button
                h="40px"
                px={5}
                fontSize="13px"
                fontWeight="500"
                variant="outline"
                rounded="md"
                borderColor="#333"
                color="#333"
                onClick={() => {
                  setMajor('');
                  setMajorInput('');
                  setCourse('');
                  setCourseInput('');
                  setUploader('');
                  setUploaderInput('');
                  setOwnershipLevel('');
                  setStatus('');
                  setResourceType('');
                  setSource('');
                  setFormatType('');
                  setDateStart('');
                  setDateEnd('');
                  setSearchName('');
                }}
              >
                {t('resource.actions.reset')}
              </Button>
              <Button
                h="40px"
                px={6}
                fontSize="13px"
                fontWeight="500"
                rounded="md"
                bg="#2D2D2D"
                color="white"
                _hover={{ bg: '#1F1F1F' }}
                onClick={() => {
                  setCurrentPage(1);
                  setQueryVersion((v) => v + 1);
                }}
              >
                {t('resource.actions.search')}
              </Button>
            </Flex>
          </Flex>
        </Box>

        {/* 批量操作卡片 */}
        {selectedIds.length > 0 && (
          <Flex justify="space-between" align="center" bg="#ffffff" px={4} py={3}>
            <Text fontSize="14px" color="#4E5969">
              {t('resource.messages.selectedCount', { count: selectedIds.length })}
            </Text>
            <Flex gap={3} align="center">
              {(() => {
                const selectedItems = resources.filter((r) => selectedIds.includes(r.id));
                const hasUnpublished = selectedItems.some(
                  (r) => r.status === EResourceStatus.UNPUBLISHED
                );
                const hasPublished = selectedItems.some(
                  (r) => r.status === EResourceStatus.PUBLISHED
                );
                return (
                  <>
                    {hasUnpublished && (
                      <Button
                        size="sm"
                        h="32px"
                        px={4}
                        borderRadius="6px"
                        variant="outline"
                        borderColor="#00B42A"
                        color="#00B42A"
                        bg="white"
                        fontSize="13px"
                        fontWeight="400"
                        leftIcon={
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        }
                        _hover={{ bg: '#F0FFF0' }}
                        onClick={handleBatchPublish}
                      >
                        {t('resource.actions.batchPublish')}
                      </Button>
                    )}
                    {hasPublished && (
                      <Button
                        size="sm"
                        h="32px"
                        px={4}
                        borderRadius="6px"
                        variant="outline"
                        borderColor="#4E5969"
                        color="#4E5969"
                        bg="white"
                        fontSize="13px"
                        fontWeight="400"
                        leftIcon={
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        }
                        _hover={{ bg: '#F7F8FA' }}
                        onClick={handleBatchUnpublish}
                      >
                        {t('resource.actions.batchUnpublish')}
                      </Button>
                    )}
                  </>
                );
              })()}
              <Button
                size="sm"
                h="32px"
                px={4}
                borderRadius="6px"
                variant="outline"
                borderColor="#F53F3F"
                color="#F53F3F"
                bg="white"
                fontSize="13px"
                fontWeight="400"
                leftIcon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                }
                _hover={{ bg: '#FFF1F0' }}
                onClick={handleBatchDelete}
              >
                {t('resource.actions.batchDelete')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                h="32px"
                px={2}
                color="#86909C"
                bg="transparent"
                fontSize="13px"
                fontWeight="400"
                leftIcon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                }
                _hover={{ bg: 'transparent', color: '#4E5969' }}
                onClick={handleCancelSelection}
              >
                {t('resource.actions.cancelSelection')}
              </Button>
            </Flex>
          </Flex>
        )}

        {/* 列表 */}
        <Box overflow="hidden" px={4}>
          <Box overflowX="auto">
            <Table variant="simple" sx={{ th: { textTransform: 'none', fontWeight: 500 } }}>
              <Thead bg="#F7F8FA">
                <Tr>
                  <Th w="40px" px={3} py={3} borderBottom="1px solid #E5E6EB">
                    <Checkbox
                      isChecked={allSelected}
                      isIndeterminate={isIndeterminate}
                      onChange={handleSelectAll}
                      colorScheme="red"
                      sx={{
                        '&[data-checked]': {
                          borderColor: '#c83e3e !important',
                          bg: '#c83e3e !important'
                        },
                        '&[data-indeterminate]': {
                          borderColor: '#c83e3e !important',
                          bg: '#c83e3e !important'
                        },
                        '&[data-checked]': {
                          borderColor: '#c83e3e !important',
                          bg: '#c83e3e !important'
                        },
                        '&[data-indeterminate]': {
                          borderColor: '#c83e3e !important',
                          bg: '#c83e3e !important'
                        },
                        '& .chakra-checkbox__control[data-indeterminate]': {
                          borderColor: '#c83e3e !important',
                          bg: '#c83e3e !important'
                        },
                        '& .chakra-checkbox__control[data-checked]': {
                          borderColor: '#c83e3e !important',
                          bg: '#c83e3e !important'
                        },
                        '& .chakra-checkbox__control[data-indeterminate] > div': {
                          color: 'white'
                        },
                        '& .chakra-checkbox__control[data-checked] > div': {
                          color: 'white'
                        }
                      }}
                    />
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB">
                    {t('resource.table.fileName')}
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB">
                    {t('resource.table.ownership')}
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB">
                    {t('resource.table.uploader')}
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB">
                    {t('resource.table.size')}
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB">
                    {t('resource.table.type')}
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB">
                    {t('resource.table.status')}
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB">
                    {t('resource.table.shareScope')}
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB" textAlign="center">
                    {t('resource.table.preview')}
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB" textAlign="center">
                    {t('resource.table.download')}
                  </Th>
                  <Th px={3} py={3} borderBottom="1px solid #E5E6EB" textAlign="center">
                    {t('resource.table.actions')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={11} py={16} borderBottom="1px solid #E5E6EB">
                      <Flex direction="column" align="center" gap={2} color="gray.500">
                        <Spinner size="md" />
                        <Text fontSize="14px" fontWeight="600">
                          {t('resource.table.loading')}
                        </Text>
                      </Flex>
                    </Td>
                  </Tr>
                ) : resources.length === 0 ? (
                  <Tr>
                    <Td colSpan={11} py={16} borderBottom="1px solid #E5E6EB">
                      <Flex direction="column" align="center" gap={2} color="gray.500">
                        <Text fontSize="14px" fontWeight="600">
                          {t('resource.table.empty')}
                        </Text>
                        <Text fontSize="12px">{t('resource.table.emptyHint')}</Text>
                      </Flex>
                    </Td>
                  </Tr>
                ) : (
                  resources.map((item) => (
                    <Tr key={item.id} _hover={{ bg: '#FAFAFA' }}>
                      <Td px={3} py={3} borderBottom="1px solid #E5E6EB">
                        <Checkbox
                          isChecked={selectedIds.includes(item.id)}
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          sx={{
                            '[data-checked]': {
                              borderColor: '#c83e3e',
                              bg: '#c83e3e'
                            },
                            '[data-checked] > div': {
                              color: 'white'
                            }
                          }}
                        />
                      </Td>
                      <Td px={3} py={3} borderBottom="1px solid #E5E6EB">
                        <Flex align="center" gap={3}>
                          <Box
                            cursor="pointer"
                            onClick={() => {
                              setPreviewResourceId(item.id);
                              setPreviewResourceName(item.fileName);
                              setPreviewFileFormat(item.fileFormat);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <FileIcon fileName={item.fileName} />
                          </Box>
                          <Box>
                            <Text fontSize="14px" color="#1D2129" fontWeight="500">
                              {item.fileName}
                            </Text>
                            <Flex align="center" gap="4px" mt={0.5}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: '#86909C' }}
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 6v6l4 2"></path>
                              </svg>
                              <Text fontSize="12px" color="#86909C">
                                {item.createTime?.split(' ')?.[0] || '-'}
                              </Text>
                            </Flex>
                          </Box>
                        </Flex>
                      </Td>
                      <Td
                        px={3}
                        py={3}
                        fontSize="14px"
                        color="#1D2129"
                        borderBottom="1px solid #E5E6EB"
                      >
                        {item.ownerType === 1
                          ? t('resource.ownership.personal')
                          : item.ownerType === 2
                            ? t('resource.ownership.school')
                            : '-'}
                      </Td>
                      <Td
                        px={3}
                        py={3}
                        fontSize="14px"
                        color="#1D2129"
                        borderBottom="1px solid #E5E6EB"
                      >
                        {item.uploaderName}
                      </Td>
                      <Td
                        px={3}
                        py={3}
                        fontSize="14px"
                        color="#86909C"
                        borderBottom="1px solid #E5E6EB"
                      >
                        {formatFileSize(item.fileSize)}
                      </Td>
                      <Td px={3} py={3} borderBottom="1px solid #E5E6EB">
                        <Box
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                          minW="44px"
                          lineHeight="22px"
                          bg="#F2F3F5"
                          borderRadius="4px"
                          color="#4E5969"
                          fontSize="12px"
                          fontWeight="400"
                          px={2}
                          py="1px"
                        >
                          {resourceTypeOptions.find((t) => t.id === item.resourceType)?.name || '-'}
                        </Box>
                      </Td>
                      <Td px={3} py={3} borderBottom="1px solid #E5E6EB">
                        <Flex align="center" gap={1.5}>
                          <Box
                            w="6px"
                            h="6px"
                            borderRadius="full"
                            bg={
                              item.status === EResourceStatus.PUBLISHED
                                ? '#52C41A'
                                : item.status === EResourceStatus.UNPUBLISHED
                                  ? '#999999'
                                  : '#FAAD14'
                            }
                          />
                          <Text fontSize="12px" fontWeight="400" color="#4E5969">
                            {item.status === EResourceStatus.PUBLISHED
                              ? t('resource.status.onShelf')
                              : item.status === EResourceStatus.UNPUBLISHED
                                ? t('resource.status.offShelf')
                                : item.status === EResourceStatus.DRAFT
                                  ? t('resource.status.draft')
                                  : '-'}
                          </Text>
                        </Flex>
                      </Td>
                      <Td px={3} py={3} borderBottom="1px solid #E5E6EB">
                        {SHARE_SCOPE_MAP[item.shareScope] ? (
                          <Box
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                            minW="44px"
                            lineHeight="22px"
                            bg={item.shareScope === 1 ? '#E8FFEA' : '#FFF7E6'}
                            borderRadius="4px"
                            color={item.shareScope === 1 ? '#166534' : '#FAAD14'}
                            fontSize="12px"
                            fontWeight="400"
                            px={2}
                            py="1px"
                          >
                            {item.shareScope === 1
                              ? t('resource.shareScope.personal')
                              : item.shareScope === 2
                                ? t('resource.shareScope.school')
                                : t('resource.shareScope.department')}
                          </Box>
                        ) : (
                          <Text fontSize="14px" color="#86909C">
                            -
                          </Text>
                        )}
                      </Td>
                      <Td
                        px={3}
                        py={3}
                        fontSize="14px"
                        color="#86909C"
                        textAlign="center"
                        borderBottom="1px solid #E5E6EB"
                      >
                        <Flex align="center" justify="center" gap="4px">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          {item.previewCount || 0}
                        </Flex>
                      </Td>
                      <Td
                        px={3}
                        py={3}
                        fontSize="14px"
                        color="#86909C"
                        textAlign="center"
                        borderBottom="1px solid #E5E6EB"
                      >
                        <Flex align="center" justify="center" gap="4px">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 15V3"></path>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <path d="m7 10 5 5 5-5"></path>
                          </svg>
                          {item.downloadCount}
                        </Flex>
                      </Td>
                      <Td px={3} py={3} borderBottom="1px solid #E5E6EB">
                        <Flex justify="center" gap={1}>
                          <IconButton
                            icon={
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
                              </svg>
                            }
                            aria-label={t('resource.actions.edit')}
                            size="sm"
                            variant="ghost"
                            color="#86909C"
                            _hover={{ color: '#C8000B', bg: 'transparent' }}
                            onClick={async () => {
                              try {
                                const detail = await getResourceDetail(item.id);
                                setEditingResource(detail);
                                setIsEditOpen(true);
                              } catch {
                                toastRef.current({
                                  title: t('resource.messages.fetchDetailFailed'),
                                  status: 'error',
                                  duration: 2000
                                });
                              }
                            }}
                          />
                          <Menu placement="bottom-end">
                            <MenuButton
                              as={IconButton}
                              icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="6" cy="12" r="2" />
                                  <circle cx="12" cy="12" r="2" />
                                  <circle cx="18" cy="12" r="2" />
                                </svg>
                              }
                              aria-label={t('resource.table.actions')}
                              size="sm"
                              variant="ghost"
                              color="#86909C"
                              _hover={{ color: '#C8000B', bg: 'transparent' }}
                            />
                            <MenuList
                              minW="140px"
                              p={1}
                              borderRadius="8px"
                              borderColor="#E5E6EB"
                              boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                            >
                              <MenuItem
                                icon={
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ color: '#9CA3AF' }}
                                  >
                                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                }
                                fontSize="13px"
                                color="#4E5969"
                                _hover={{ bg: '#F7F8FA' }}
                                onClick={() => {
                                  setPreviewResourceId(item.id);
                                  setPreviewResourceName(item.fileName);
                                  setPreviewFileFormat(item.fileFormat);
                                  setIsPreviewOpen(true);
                                }}
                              >
                                {t('resource.actions.previewResource')}
                              </MenuItem>
                              <MenuItem
                                icon={
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ color: '#9CA3AF' }}
                                  >
                                    <path d="M12 15V3"></path>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <path d="m7 10 5 5 5-5"></path>
                                  </svg>
                                }
                                fontSize="13px"
                                color="#4E5969"
                                _hover={{ bg: '#F7F8FA' }}
                                onClick={async () => {
                                  try {
                                    const { fileUrl, fileName } = await downloadResource(item.id);
                                    if (fileUrl) {
                                      await downloadFileFromUrl(fileUrl, fileName || item.fileName);
                                      toastRef.current({
                                        title: t('resource.messages.downloadStarted'),
                                        status: 'success',
                                        duration: 1500
                                      });
                                    } else {
                                      toastRef.current({
                                        title: t('resource.messages.downloadLinkFailed'),
                                        status: 'warning',
                                        duration: 2000
                                      });
                                    }
                                  } catch {
                                    toastRef.current({
                                      title: t('resource.messages.downloadFailed'),
                                      status: 'error',
                                      duration: 2000
                                    });
                                    return;
                                  }
                                  setQueryVersion((v) => v + 1);
                                }}
                              >
                                {t('resource.actions.downloadResource')}
                              </MenuItem>
                              <MenuItem
                                icon={
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ color: '#9CA3AF' }}
                                  >
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
                                    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
                                  </svg>
                                }
                                fontSize="13px"
                                color="#4E5969"
                                _hover={{ bg: '#F7F8FA' }}
                                onClick={() => {
                                  setSharingResource(item);
                                  setIsShareOpen(true);
                                }}
                              >
                                {t('resource.actions.shareResource')}
                              </MenuItem>
                              <MenuItem
                                icon={
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ color: '#9CA3AF' }}
                                  >
                                    <path d="M12 2v10"></path>
                                    <path d="M18.4 6.6a9 9 0 1 1-12.77.04"></path>
                                  </svg>
                                }
                                fontSize="13px"
                                color="#4E5969"
                                _hover={{ bg: '#F7F8FA' }}
                                onClick={() => {
                                  setConfirmStatusAction(
                                    item.status === 1 ? 'offShelf' : 'onShelf'
                                  );
                                  setConfirmStatusResource(item);
                                  setIsConfirmStatusOpen(true);
                                }}
                              >
                                {item.status === 1
                                  ? t('resource.actions.unpublishResource')
                                  : t('resource.actions.publishResource')}
                              </MenuItem>
                              <MenuItem
                                icon={
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ color: '#EF4444' }}
                                  >
                                    <path d="M10 11v6"></path>
                                    <path d="M14 11v6"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                    <path d="M3 6h18"></path>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                }
                                fontSize="13px"
                                color="#F53F3F"
                                _hover={{ bg: '#FFF1F0' }}
                                onClick={() => {
                                  setConfirmDeleteResource(item);
                                  setIsConfirmDeleteOpen(true);
                                }}
                              >
                                {t('resource.actions.deleteResource')}
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Flex>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>

          {/* 分页 */}
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            pageSizeOptions={[10, 20, 50]}
            onChange={(page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) setPageSize(size);
            }}
          />
        </Box>
      </Box>

      {/* 资源设置弹窗 */}
      <ResourceSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* 草稿箱弹窗 */}
      <DraftsModal
        isOpen={isDraftsOpen}
        onClose={() => setIsDraftsOpen(false)}
        onEdit={(draft) => {
          setDraftForUpload(draft);
          setIsUploadOpen(true);
        }}
      />

      {/* 上传资源弹窗 */}
      <UploadResourceModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setDraftForUpload(null);
        }}
        onSuccess={() => {
          setDraftForUpload(null);
          setQueryVersion((v) => v + 1);
        }}
        draftData={draftForUpload}
      />

      {/* 编辑资源弹窗 */}
      <EditResourceModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        resource={editingResource}
        onSuccess={() => setQueryVersion((v) => v + 1)}
      />

      {/* 资源共享管理弹窗 */}
      <ShareResourceModal
        isOpen={isShareOpen}
        onClose={() => {
          setIsShareOpen(false);
          setSharingResource(null);
        }}
        resource={sharingResource}
        onSuccess={() => setQueryVersion((v) => v + 1)}
      />

      {/* 上架/下架确认弹窗 */}
      <ConfirmStatusModal
        isOpen={isConfirmStatusOpen}
        onClose={() => setIsConfirmStatusOpen(false)}
        onConfirm={async () => {
          if (!confirmStatusResource) return;
          try {
            if (confirmStatusAction === 'onShelf') {
              await batchPublishResource([confirmStatusResource.id]);
            } else {
              await unpublishResource({ id: confirmStatusResource.id });
            }
            toastRef.current({
              title:
                confirmStatusAction === 'onShelf'
                  ? t('resource.messages.publishSuccess')
                  : t('resource.messages.unpublishSuccess'),
              status: 'success',
              duration: 1500
            });
            setIsConfirmStatusOpen(false);
            setQueryVersion((v) => v + 1);
          } catch {
            toastRef.current({
              title:
                confirmStatusAction === 'onShelf'
                  ? t('resource.messages.publishFailed')
                  : t('resource.messages.unpublishFailed'),
              status: 'error',
              duration: 2000
            });
          }
        }}
        fileName={confirmStatusResource?.fileName || ''}
        action={confirmStatusAction}
      />

      {/* 删除确认弹窗 */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={async () => {
          if (!confirmDeleteResource) return;
          try {
            await deleteResource(confirmDeleteResource.id);
            toastRef.current({
              title: t('resource.messages.deleteSuccess'),
              status: 'success',
              duration: 1500
            });
            setIsConfirmDeleteOpen(false);
            setQueryVersion((v) => v + 1);
          } catch {
            toastRef.current({
              title: t('resource.messages.deleteFailed'),
              status: 'error',
              duration: 2000
            });
          }
        }}
        fileName={confirmDeleteResource?.fileName || ''}
      />

      {/* 资源预览弹窗 */}
      <PreviewResourceModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewResourceId(null);
          setPreviewResourceName('');
          setPreviewFileFormat('');
          setQueryVersion((v) => v + 1);
        }}
        resourceId={previewResourceId}
        resourceName={previewResourceName}
        fileFormat={previewFileFormat}
      />
    </Box>
  );
}
