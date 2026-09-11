'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Checkbox,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
  Spinner
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import NewDateRangePicker from '@/components/common/NewDateRangePicker';
import {
  getMyResourcePage,
  deleteResource,
  batchDeleteResource,
  batchDownloadResource,
  publishResource,
  unpublishResource,
  updateShareScope,
  getResourceDetail,
  getDraftPage,
  getMyResourcePreviewDetail,
  previewMyResource,
  downloadMyResource,
  getMyMajorNames,
  getMyCourseNames,
  type MyResourceVO,
  type ResourceDetailVO,
  type TenantMajorNameVO,
  type TenantCourseNameVO
} from '@/api/teacher/resource/my-resources';
import { getMyResourceTypeList, type ResourceTypeVO } from '@/api/teacher/resource/my-resources';
import DraftBoxModal from './MyResourcesPanel/DraftBoxModal';
import UploadResourceModal from './MyResourcesPanel/UploadResourceModal';
import EditResourceModal from './MyResourcesPanel/EditResourceModal';
import PreviewResourceModal from './PreviewResourceModal';
import { FileIcon } from './FileIcon';
import { downloadFileFromUrl } from '@/web/common/file/utils';

// 状态映射
const STATUS_MAP: Record<number, string> = {
  0: 'draft',
  1: 'published',
  2: 'unpublished'
};

// 归属标签颜色
const OWNERSHIP_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#F0E8FF', color: '#7B61FF' },
  2: { bg: '#E8F4FD', color: '#2B7BF6' }
};

// 状态标签颜色
const STATUS_COLORS: Record<number, { bg: string; color: string }> = {
  0: { bg: '#FFF7E8', color: '#FF7D00' },
  1: { bg: '#E8FFEA', color: '#00B42A' },
  2: { bg: '#F2F3F5', color: '#86909C' }
};

// 共享范围标签颜色
const SHARE_SCOPE_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#F2F3F5', color: '#86909C' },
  2: { bg: '#E8FFEA', color: '#00B42A' }
};

// 文件大小格式化
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function MyResourcesPanel() {
  const { t } = useTranslation('teacher');
  useTeacherPageI18n(['profile']);
  const toast = useToast();

  // 列表数据状态
  const [resources, setResources] = useState<MyResourceVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // 选择状态
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 弹窗状态
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // 编辑草稿状态（打开上传弹窗并回显草稿数据）
  const [editingDraftDetail, setEditingDraftDetail] = useState<ResourceDetailVO | null>(null);

  // 编辑资源弹窗状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<MyResourceVO | null>(null);
  const [editingDetail, setEditingDetail] = useState<ResourceDetailVO | null>(null);

  // 上架/下架资源确认弹窗状态
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [resourceToPublish, setResourceToPublish] = useState<MyResourceVO | null>(null);
  const [publishingResource, setPublishingResource] = useState(false);

  // 资源共享管理弹窗状态
  const [isShareManageModalOpen, setIsShareManageModalOpen] = useState(false);
  const [shareManageResource, setShareManageResource] = useState<MyResourceVO | null>(null);
  const [shareManageScope, setShareManageScope] = useState<1 | 2>(1);
  const [updatingShareScope, setUpdatingShareScope] = useState(false);

  // 资源删除确认弹窗状态
  const [resourceDeleteConfirmOpen, setResourceDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<MyResourceVO | null>(null);
  const [deletingResource, setDeletingResource] = useState(false);

  // 预览弹窗状态
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewResourceId, setPreviewResourceId] = useState<number | null>(null);
  const [previewResourceName, setPreviewResourceName] = useState('');
  const [previewFileFormat, setPreviewFileFormat] = useState('');

  // 搜索表单状态
  const [major, setMajor] = useState('');
  const [course, setCourse] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [format, setFormat] = useState('');
  const [status, setStatus] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 资源类型列表数据
  const [resourceTypeOptions, setResourceTypeOptions] = useState<ResourceTypeVO[]>([]);

  // 专业列表数据
  const [majorOptions, setMajorOptions] = useState<TenantMajorNameVO[]>([]);
  const [majorLoading, setMajorLoading] = useState(false);

  // 课程列表数据
  const [courseOptions, setCourseOptions] = useState<TenantCourseNameVO[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);

  // 专业、课程搜索输入状态
  const [majorInput, setMajorInput] = useState('');
  const [courseInput, setCourseInput] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showResourceTypeDropdown, setShowResourceTypeDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isMajorFiltering, setIsMajorFiltering] = useState(false);
  const [isCourseFiltering, setIsCourseFiltering] = useState(false);

  const majorRef = useRef<HTMLDivElement>(null);
  const courseRef = useRef<HTMLDivElement>(null);
  const resourceTypeRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // 本地过滤选项
  const filteredMajorOptions = isMajorFiltering
    ? majorOptions.filter((o) => o.name.includes(majorInput))
    : majorOptions;
  const filteredCourseOptions = isCourseFiltering
    ? courseOptions.filter((o) => o.name.includes(courseInput))
    : courseOptions;

  // 获取课程名称列表
  const fetchCourseNames = useCallback(async (majorId?: number, searchKey?: string) => {
    setCourseLoading(true);
    try {
      const res = await getMyCourseNames(majorId, searchKey);
      setCourseOptions(res || []);
    } catch {
      setCourseOptions([]);
    } finally {
      setCourseLoading(false);
    }
  }, []);

  // 专业变化时清空已选课程和课程列表（级联刷新）
  useEffect(() => {
    setCourse('');
    setCourseInput('');
    setCourseOptions([]);
    setIsCourseFiltering(false);
    setShowCourseDropdown(false);
  }, [major]);

  // 获取专业名称列表
  const fetchMajorNames = useCallback(async (searchKey?: string) => {
    setMajorLoading(true);
    try {
      const res = await getMyMajorNames(searchKey);
      setMajorOptions(res || []);
    } catch {
      setMajorOptions([]);
    } finally {
      setMajorLoading(false);
    }
  }, []);

  // 专业下拉框聚焦时加载专业列表（仅首次展开且为空时加载）
  useEffect(() => {
    if (showMajorDropdown && majorOptions.length === 0) {
      fetchMajorNames();
    }
  }, [showMajorDropdown, majorOptions.length, fetchMajorNames]);

  // 课程下拉框聚焦时加载课程列表（仅首次展开且为空时加载）
  useEffect(() => {
    if (showCourseDropdown && courseOptions.length === 0) {
      fetchCourseNames(major ? Number(major) : undefined);
    }
  }, [showCourseDropdown, courseOptions.length, fetchCourseNames, major]);

  // 专业变化时清空已选课程和课程列表（级联刷新）
  useEffect(() => {
    setCourse('');
    setCourseInput('');
    setCourseOptions([]);
    setIsCourseFiltering(false);
    setShowCourseDropdown(false);
  }, [major]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorRef.current && !majorRef.current.contains(event.target as Node)) {
        setShowMajorDropdown(false);
      }
      if (courseRef.current && !courseRef.current.contains(event.target as Node)) {
        setShowCourseDropdown(false);
      }
      if (resourceTypeRef.current && !resourceTypeRef.current.contains(event.target as Node)) {
        setShowResourceTypeDropdown(false);
      }
      if (formatRef.current && !formatRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取资源类型列表
  const fetchResourceTypes = useCallback(async () => {
    try {
      const res = await getMyResourceTypeList({ status: 1 });
      setResourceTypeOptions(res || []);
    } catch {
      setResourceTypeOptions([]);
    }
  }, []);

  // 初始加载资源类型列表
  useEffect(() => {
    fetchResourceTypes();
  }, [fetchResourceTypes]);

  // 获取文件格式值
  const getFormatTypeValue = (key: string): number | undefined => {
    const formatMap: Record<string, number> = {
      pdf: 1,
      word: 2,
      ppt: 3,
      video: 4,
      zip: 5,
      html: 6,
      link: 7
    };
    return formatMap[key] ?? undefined;
  };

  // 获取状态值
  const getStatusValue = (key: string): number | undefined => {
    const statusMap: Record<string, number> = {
      published: 1,
      unpublished: 2
    };
    return statusMap[key] ?? undefined;
  };

  // 状态选项配置
  const STATUS_OPTIONS = [
    { key: 'published', label: t('profile.myResources.status.published'), value: 1 },
    { key: 'unpublished', label: t('profile.myResources.status.unpublished'), value: 2 }
  ];

  // 获取列表数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        current: currentPage,
        size: pageSize,
        majorId: major ? Number(major) : undefined,
        courseId: course ? Number(course) : undefined,
        resourceType: resourceType ? Number(resourceType) : undefined,
        formatType: getFormatTypeValue(format),
        status: getStatusValue(status),
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
        searchKey: searchKeyword || undefined
      };

      const res = await getMyResourcePage(params);
      setResources(res.records);
      setTotal(res.total);
    } catch (error: any) {
      const errorMsg = error?.msg || error?.message || t('profile.myResources.feedback.loadError');
      toast({
        title: errorMsg,
        status: 'error',
        duration: 2000,
        position: 'top'
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    major,
    course,
    resourceType,
    format,
    status,
    dateStart,
    dateEnd,
    searchKeyword,
    toast
  ]);

  // 筛选条件变化时（选中即生效的下拉项、日期范围、搜索关键词）重置到第 1 页，
  // 避免在非首页时切换条件导致请求携带越界页码、查不到本应存在的数据。
  const isFirstFilterRender = useRef(true);
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [major, course, resourceType, format, status, dateStart, dateEnd, searchKeyword]);

  // 初始加载和搜索条件变化时获取数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 分页计算
  const totalPages = Math.ceil(total / pageSize);

  // 选择相关
  const allSelected =
    resources.length > 0 && resources.every((item) => selectedIds.includes(item.id));
  const isIndeterminate = selectedIds.length > 0 && !allSelected;

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

  return (
    <Box>
      <Flex justify="space-between" align="flex-start" mb={5}>
        <Box>
          <Text fontSize="20px" fontWeight={600} color="#1D2129">
            {t('profile.myResources.title')}
          </Text>
          <Text fontSize="14px" color="#86909C" mt={1}>
            {t('profile.myResources.description')}
          </Text>
        </Box>
        <Flex gap={3}>
          <Button
            h="36px"
            px={5}
            fontSize="13px"
            fontWeight="500"
            rounded="md"
            variant="outline"
            borderColor="#2D2D2D"
            color="#2D2D2D"
            bg="white"
            leftIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M1.33325 7.99984H3.92123C4.37803 7.99984 4.79563 8.25793 4.99992 8.6665C5.20421 9.07508 5.6218 9.33317 6.07861 9.33317H9.92123C10.378 9.33317 10.7956 9.07508 10.9999 8.6665C11.2042 8.25793 11.6218 7.99984 12.0786 7.99984H14.6666M1.33325 7.99984V5.8665C1.33325 4.7464 1.33325 4.18635 1.55124 3.75852C1.74299 3.3822 2.04895 3.07624 2.42527 2.88449C2.85309 2.6665 3.41315 2.6665 4.53325 2.6665H11.4666C12.5867 2.6665 13.1467 2.6665 13.5746 2.88449C13.9509 3.07624 14.2569 3.3822 14.4486 3.75852C14.6666 4.18635 14.6666 4.7464 14.6666 5.8665V7.99984M1.33325 7.99984V10.1332C1.33325 11.2533 1.33325 11.8133 1.55124 12.2412C1.74299 12.6175 2.04895 12.9234 2.42527 13.1152C2.85309 13.3332 3.41315 13.3332 4.53325 13.3332H11.4666C12.5867 13.3332 13.1467 13.3332 13.5746 13.1152C13.9509 12.9234 14.2569 12.6175 14.4486 12.2412C14.6666 11.8133 14.6666 11.2533 14.6666 10.1332V7.99984"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            _hover={{ bg: '#F5F5F5' }}
            onClick={() => {
              setIsDraftModalOpen(true);
            }}
          >
            {t('profile.myResources.actions.drafts')}
          </Button>
          <Button
            h="36px"
            px={5}
            fontSize="13px"
            fontWeight="500"
            rounded="md"
            bg="#2D2D2D"
            color="white"
            leftIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M14 10V10.8C14 11.9201 14 12.4802 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.4802 14 11.9201 14 10.8 14H5.2C4.07989 14 3.51984 14 3.09202 13.782C2.71569 13.5903 2.40973 13.2843 2.21799 12.908C2 12.4802 2 11.9201 2 10.8V10M4.66667 5.33333L8 2L11.3333 5.33333M8 2V10"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            _hover={{ bg: '#1F1F1F' }}
            onClick={() => setIsUploadModalOpen(true)}
          >
            {t('profile.myResources.actions.upload')}
          </Button>
        </Flex>
      </Flex>

      {/* 搜索栏 */}
      <Box
        bg="#FFFFFF"
        roundedTop="16px"
        border="1px solid #F3F4F6"
        borderBottom="none"
        boxShadow="0 4px 20px rgba(15, 23, 42, 0.03)"
        p={5}
      >
        {/* 第一行筛选 */}
        <Flex gap={3} mb={3}>
          <Box ref={majorRef} position="relative" flex={1}>
            <InputGroup>
              <Input
                placeholder={t('profile.myResources.filters.placeholder.major')}
                value={majorInput}
                onChange={(e) => {
                  setMajorInput(e.target.value);
                  setIsMajorFiltering(true);
                  setShowMajorDropdown(true);
                  if (e.target.value === '') {
                    setMajor('');
                  }
                }}
                onFocus={() => {
                  setShowMajorDropdown(true);
                  setIsMajorFiltering(false);
                  if (major) {
                    const selected = majorOptions.find((o) => String(o.id) === major);
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
                    {t('profile.myResources.feedback.loading')}
                  </Box>
                ) : filteredMajorOptions.length === 0 ? (
                  <Box px={3} py={2} fontSize="14px" color="#86909C">
                    {t('profile.myResources.feedback.noData')}
                  </Box>
                ) : (
                  <>
                    {filteredMajorOptions.map((opt) => (
                      <Box
                        key={opt.id}
                        px={3}
                        py={2}
                        fontSize="14px"
                        cursor="pointer"
                        bg={String(opt.id) === major ? '#FFF5F5' : 'white'}
                        color={String(opt.id) === major ? '#C8000B' : '#1D2129'}
                        _hover={{ bg: '#F7F8FA' }}
                        onClick={() => {
                          setMajor(String(opt.id));
                          setMajorInput(opt.name);
                          setIsMajorFiltering(false);
                          setCourse('');
                          setCourseInput('');
                          setShowMajorDropdown(false);
                        }}
                      >
                        {opt.name}
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            )}
          </Box>
          <Box ref={courseRef} position="relative" flex={1}>
            <InputGroup>
              <Input
                placeholder={t('profile.myResources.filters.placeholder.course')}
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
                    const selected = courseOptions.find((o) => String(o.id) === course);
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
                    {t('profile.myResources.feedback.loading')}
                  </Box>
                ) : filteredCourseOptions.length === 0 ? (
                  <Box px={3} py={2} fontSize="14px" color="#86909C">
                    {t('profile.myResources.feedback.noData')}
                  </Box>
                ) : (
                  <>
                    {filteredCourseOptions.map((opt) => (
                      <Box
                        key={opt.id}
                        px={3}
                        py={2}
                        fontSize="14px"
                        cursor="pointer"
                        bg={String(opt.id) === course ? '#FFF5F5' : 'white'}
                        color={String(opt.id) === course ? '#C8000B' : '#1D2129'}
                        _hover={{ bg: '#F7F8FA' }}
                        onClick={() => {
                          setCourse(String(opt.id));
                          setCourseInput(opt.name);
                          setIsCourseFiltering(false);
                          setShowCourseDropdown(false);
                        }}
                      >
                        {opt.name}
                      </Box>
                    ))}
                  </>
                )}
              </Box>
            )}
          </Box>
          <Box ref={resourceTypeRef} position="relative" flex={1}>
            <InputGroup>
              <Input
                placeholder={t('profile.myResources.filters.allTypes')}
                value={
                  resourceTypeOptions.find((item) => String(item.id) === resourceType)?.name || ''
                }
                readOnly
                onClick={() => {
                  setShowResourceTypeDropdown(true);
                }}
                onFocus={() => {
                  setShowResourceTypeDropdown(true);
                }}
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
                    onClick={() => {
                      setResourceType('');
                    }}
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
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
                    {t('profile.myResources.feedback.noData')}
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
                        bg={resourceType === String(item.id) ? '#FFF5F5' : 'white'}
                        color={resourceType === String(item.id) ? '#C8000B' : '#1D2129'}
                        onClick={() => {
                          setResourceType(String(item.id));
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
          <Box ref={formatRef} position="relative" flex={1}>
            <InputGroup>
              <Input
                placeholder={t('profile.myResources.filters.allFormats')}
                value={format ? t(`profile.myResources.filters.formatOptions.${format}`) : ''}
                readOnly
                onClick={() => {
                  setShowFormatDropdown(true);
                }}
                onFocus={() => {
                  setShowFormatDropdown(true);
                }}
                h="36px"
                fontSize="14px"
                borderColor="#E5E6EB"
                borderRadius="6px"
                pr="28px"
                _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
              />
              <InputRightElement h="36px" w="28px" justifyContent="center">
                {format ? (
                  <Box
                    as="span"
                    cursor="pointer"
                    color="#C9CDD4"
                    _hover={{ color: '#86909C' }}
                    onClick={() => {
                      setFormat('');
                    }}
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
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
                {[
                  { key: 'pdf', label: t('profile.myResources.filters.formatOptions.pdf') },
                  { key: 'word', label: t('profile.myResources.filters.formatOptions.word') },
                  { key: 'ppt', label: t('profile.myResources.filters.formatOptions.ppt') },
                  { key: 'video', label: t('profile.myResources.filters.formatOptions.video') },
                  { key: 'zip', label: t('profile.myResources.filters.formatOptions.zip') },
                  { key: 'html', label: t('profile.myResources.filters.formatOptions.html') },
                  { key: 'link', label: t('profile.myResources.filters.formatOptions.link') }
                ].map((item) => (
                  <Box
                    key={item.key}
                    px={3}
                    py={2}
                    fontSize="14px"
                    cursor="pointer"
                    _hover={{ bg: '#F7F8FA' }}
                    bg={format === item.key ? '#FFF5F5' : 'white'}
                    color={format === item.key ? '#C8000B' : '#1D2129'}
                    onClick={() => {
                      setFormat(item.key);
                      setShowFormatDropdown(false);
                    }}
                  >
                    {item.label}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          <Box ref={statusRef} position="relative" flex={1}>
            <InputGroup>
              <Input
                placeholder={t('profile.myResources.filters.allStatuses')}
                value={status ? STATUS_OPTIONS.find((s) => s.key === status)?.label || '' : ''}
                readOnly
                onClick={() => {
                  setShowStatusDropdown(true);
                }}
                onFocus={() => {
                  setShowStatusDropdown(true);
                }}
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
                    onClick={() => {
                      setStatus('');
                    }}
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
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
                {STATUS_OPTIONS.map((item) => (
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
        </Flex>

        {/* 第二行筛选 */}
        <Flex gap={3} align="center">
          <NewDateRangePicker
            startValue={dateStart}
            endValue={dateEnd}
            onStartChange={setDateStart}
            onEndChange={setDateEnd}
            flex={1}
          />
          <InputGroup flex={1} minW="200px">
            <InputLeftElement h="36px" pointerEvents="none">
              <SearchIcon color="#C9CDD4" w={4} h={4} />
            </InputLeftElement>
            <Input
              placeholder={t('profile.myResources.filters.placeholder.search')}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              h="36px"
              fontSize="14px"
              borderColor="#E5E6EB"
              borderRadius="6px"
              pl={10}
            />
          </InputGroup>
          <Button
            h="36px"
            px={5}
            fontSize="13px"
            fontWeight="500"
            rounded="md"
            bg="#2D2D2D"
            color="white"
            _hover={{ bg: '#1F1F1F' }}
            onClick={() => {
              setCurrentPage(1);
              fetchData();
            }}
          >
            {t('profile.myResources.actions.query')}
          </Button>
          <Button
            h="36px"
            px={5}
            fontSize="13px"
            fontWeight="500"
            rounded="md"
            variant="outline"
            borderColor="#2D2D2D"
            color="#2D2D2D"
            bg="white"
            _hover={{ bg: '#F5F5F5' }}
            onClick={() => {
              setMajor('');
              setMajorInput('');
              setIsMajorFiltering(false);
              setCourse('');
              setCourseInput('');
              setIsCourseFiltering(false);
              setResourceType('');
              setFormat('');
              setStatus('');
              setDateStart('');
              setDateEnd('');
              setSearchKeyword('');
              setCurrentPage(1);
            }}
          >
            {t('profile.myResources.actions.reset')}
          </Button>
        </Flex>
      </Box>

      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <Flex
          bg="#fafafa"
          borderBottom="1px solid #F0F0F0"
          px={5}
          py={3}
          align="center"
          justify="space-between"
        >
          <Text fontSize="14px" color="#4E5969">
            {t('profile.myResources.table.selected', { count: selectedIds.length })}
          </Text>
          <Flex gap={3}>
            <Button
              leftIcon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              }
              variant="outline"
              size="sm"
              color="#C8000B"
              fontSize="14px"
              fontWeight={400}
              borderColor="#C8000B"
              bg="white"
              _hover={{ borderColor: '#b03030', color: '#b03030' }}
              onClick={async () => {
                try {
                  await batchDeleteResource(selectedIds);
                  toast({
                    title: t('profile.myResources.feedback.batchDeleteSuccess'),
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                  setSelectedIds([]);
                  fetchData();
                } catch (error: any) {
                  const errorMsg =
                    error?.msg || error?.message || t('profile.myResources.feedback.loadError');
                  toast({
                    title: errorMsg,
                    status: 'error',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                }
              }}
            >
              {t('profile.myResources.actions.batchDelete')}
            </Button>
            <Button
              leftIcon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              }
              variant="outline"
              size="sm"
              color="#4E5969"
              fontSize="14px"
              fontWeight={400}
              borderColor="#D9D9D9"
              bg="white"
              _hover={{ borderColor: '#c83e3e', color: '#c83e3e' }}
              onClick={async () => {
                try {
                  const blob = await batchDownloadResource(selectedIds);
                  if (!blob || !(blob instanceof Blob) || blob.size === 0) {
                    throw new Error('Empty response');
                  }
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'resources.zip';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  toast({
                    title: t('profile.myResources.feedback.batchDownloadSuccess'),
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                } catch (error: any) {
                  const errorMsg =
                    error?.msg || error?.message || t('profile.myResources.feedback.loadError');
                  toast({
                    title: errorMsg,
                    status: 'error',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                }
              }}
            >
              {t('profile.myResources.actions.batchDownload')}
            </Button>
            <Button
              leftIcon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              }
              variant="outline"
              size="sm"
              color="#4E5969"
              fontSize="14px"
              fontWeight={400}
              borderColor="#D9D9D9"
              bg="white"
              _hover={{ borderColor: '#4E5969', color: '#1D2129' }}
              onClick={() => setSelectedIds([])}
            >
              {t('profile.myResources.actions.cancelSelection')}
            </Button>
          </Flex>
        </Flex>
      )}

      {/* 资源列表 */}
      <Box
        bg="#FFFFFF"
        roundedBottom="16px"
        border="1px solid #F3F4F6"
        borderTop="none"
        boxShadow="0 4px 20px rgba(15, 23, 42, 0.03)"
        overflow="hidden"
        px={5}
      >
        {/* 表格 */}
        <Table variant="simple" sx={{ th: { textTransform: 'none', fontWeight: 500 } }}>
          <Thead bg="#FAFBFC">
            <Tr>
              <Th w="40px" px={3} py={3} borderBottom="1px solid #F0F0F0">
                <Checkbox
                  isChecked={allSelected}
                  isIndeterminate={isIndeterminate}
                  onChange={handleSelectAll}
                  sx={{
                    '&[data-checked]': {
                      borderColor: '#c8000b !important',
                      bg: '#c8000b !important'
                    },
                    '&[data-indeterminate]': {
                      borderColor: '#c8000b !important',
                      bg: '#c8000b !important'
                    },
                    '& .chakra-checkbox__control[data-checked], & .chakra-checkbox__control[data-indeterminate]':
                      {
                        borderColor: '#c8000b !important',
                        bg: '#c8000b !important'
                      }
                  }}
                />
              </Th>
              <Th px={3} py={3} fontSize="14px" color="#86909C" borderBottom="1px solid #F0F0F0">
                {t('profile.myResources.table.columns.fileName')}
              </Th>
              <Th
                w="80px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.myResources.table.columns.ownership')}
              </Th>
              <Th
                w="100px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.myResources.table.columns.uploader')}
              </Th>
              <Th
                w="100px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.myResources.table.columns.fileSize')}
              </Th>
              <Th
                w="100px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.myResources.table.columns.resourceType')}
              </Th>
              <Th
                w="80px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.myResources.table.columns.status')}
              </Th>
              <Th
                w="100px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.myResources.table.columns.shareScope')}
              </Th>
              <Th
                w="80px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                textAlign="center"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.myResources.table.columns.actions')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={8} py={16} borderBottom="1px solid #F0F0F0">
                  <Flex justify="center" align="center" gap={2}>
                    <Spinner size="md" color="#C8000B" />
                    <Text color="gray.500">{t('profile.myResources.feedback.loading')}</Text>
                  </Flex>
                </Td>
              </Tr>
            ) : resources.length === 0 ? (
              <Tr>
                <Td colSpan={8} py={16} borderBottom="1px solid #F0F0F0">
                  <Flex direction="column" align="center" gap={2} color="gray.500">
                    <Text fontSize="14px" fontWeight="600">
                      {t('profile.myResources.empty.title')}
                    </Text>
                    <Text fontSize="12px">{t('profile.myResources.empty.description')}</Text>
                  </Flex>
                </Td>
              </Tr>
            ) : (
              resources.map((item) => (
                <Tr key={item.id} _hover={{ bg: '#FAFAFA' }}>
                  <Td px={3} py={3} borderBottom="1px solid #F0F0F0">
                    <Checkbox
                      isChecked={selectedIds.includes(item.id)}
                      onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                      sx={{
                        '&[data-checked]': {
                          borderColor: '#c8000b !important',
                          bg: '#c8000b !important'
                        },
                        '& .chakra-checkbox__control[data-checked]': {
                          borderColor: '#c8000b !important',
                          bg: '#c8000b !important'
                        }
                      }}
                    />
                  </Td>
                  <Td px={3} py={3} borderBottom="1px solid #F0F0F0">
                    <Flex align="center" gap={3}>
                      <Box flexShrink={0} w="40px" h="40px">
                        <FileIcon fileName={item.fileName} />
                      </Box>
                      <Box>
                        <Text
                          fontSize="14px"
                          color="#1D2129"
                          fontWeight={500}
                          noOfLines={1}
                          title={item.fileName}
                        >
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
                  <Td px={3} py={3} borderBottom="1px solid #F0F0F0">
                    <Box
                      display="inline-flex"
                      px={2}
                      py={0.5}
                      bg={OWNERSHIP_COLORS[item.ownerType]?.bg || '#F2F3F5'}
                      color={OWNERSHIP_COLORS[item.ownerType]?.color || '#4E5969'}
                      fontSize="12px"
                      borderRadius="4px"
                    >
                      {item.ownerType
                        ? t(
                            `profile.myResources.ownership.${item.ownerType === 1 ? 'personal' : 'school'}`
                          )
                        : '-'}
                    </Box>
                  </Td>
                  <Td
                    px={3}
                    py={3}
                    fontSize="14px"
                    color="#1D2129"
                    borderBottom="1px solid #F0F0F0"
                  >
                    {item.uploaderName}
                  </Td>
                  <Td
                    px={3}
                    py={3}
                    fontSize="14px"
                    color="#1D2129"
                    borderBottom="1px solid #F0F0F0"
                  >
                    {formatFileSize(item.fileSize)}
                  </Td>
                  <Td px={3} py={3} borderBottom="1px solid #F0F0F0">
                    <Box
                      display="inline-flex"
                      px={2}
                      py={0.5}
                      bg="#F2F3F5"
                      color="#4E5969"
                      fontSize="12px"
                      borderRadius="4px"
                    >
                      {resourceTypeOptions.find((opt) => opt.id === item.resourceType)?.name || '-'}
                    </Box>
                  </Td>
                  <Td px={3} py={3} borderBottom="1px solid #F0F0F0">
                    <Box
                      display="inline-flex"
                      px={2}
                      py={0.5}
                      bg={STATUS_COLORS[item.status]?.bg || '#F2F3F5'}
                      color={STATUS_COLORS[item.status]?.color || '#4E5969'}
                      fontSize="12px"
                      borderRadius="4px"
                    >
                      {item.status !== undefined
                        ? t(`profile.myResources.status.${STATUS_MAP[item.status]}`)
                        : '-'}
                    </Box>
                  </Td>
                  <Td px={3} py={3} borderBottom="1px solid #F0F0F0">
                    <Box
                      display="inline-flex"
                      px={2}
                      py={0.5}
                      bg={SHARE_SCOPE_COLORS[item.shareScope]?.bg || '#F2F3F5'}
                      color={SHARE_SCOPE_COLORS[item.shareScope]?.color || '#4E5969'}
                      fontSize="12px"
                      borderRadius="4px"
                    >
                      {item.shareScope
                        ? t(
                            `profile.myResources.shareScope.${item.shareScope === 1 ? 'personal' : 'schoolwide'}`
                          )
                        : '-'}
                    </Box>
                  </Td>
                  <Td px={3} py={3} borderBottom="1px solid #F0F0F0">
                    <Flex justify="center" gap={1}>
                      <IconButton
                        aria-label={t('profile.myResources.modal.edit')}
                        icon={
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        }
                        size="sm"
                        variant="ghost"
                        color="#86909C"
                        _hover={{ color: '#C8000B', bg: 'transparent' }}
                        onClick={async () => {
                          try {
                            const detail = await getResourceDetail(item.id);
                            setEditingResource(item);
                            setEditingDetail(detail);
                            setIsEditModalOpen(true);
                          } catch (error: any) {
                            const errorMsg =
                              error?.msg ||
                              error?.message ||
                              t('profile.myResources.feedback.detailError');
                            toast({
                              title: errorMsg,
                              status: 'error',
                              duration: 2000,
                              position: 'top'
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
                          aria-label={t('profile.myResources.modal.moreActions')}
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
                            {t('profile.myResources.menu.preview')}
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
                                const res = await downloadMyResource(item.id);
                                if (res.fileUrl) {
                                  await downloadFileFromUrl(
                                    res.fileUrl,
                                    res.fileName || item.fileName
                                  );
                                  toast({
                                    title: t('profile.myResources.feedback.downloadStarted'),
                                    status: 'success',
                                    duration: 2000,
                                    isClosable: true,
                                    position: 'top'
                                  });
                                } else {
                                  toast({
                                    title: t('profile.myResources.feedback.downloadLinkError'),
                                    status: 'error',
                                    duration: 2000,
                                    isClosable: true,
                                    position: 'top'
                                  });
                                }
                              } catch (error: any) {
                                const errorMsg =
                                  error?.msg ||
                                  error?.message ||
                                  t('profile.myResources.feedback.downloadError');
                                toast({
                                  title: errorMsg,
                                  status: 'error',
                                  duration: 3000,
                                  isClosable: true,
                                  position: 'top'
                                });
                              }
                            }}
                          >
                            {t('profile.myResources.menu.download')}
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
                              setResourceToPublish(item);
                              setPublishConfirmOpen(true);
                            }}
                          >
                            {item.status === 1
                              ? t('profile.myResources.menu.unpublish')
                              : t('profile.myResources.menu.publish')}
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
                              setShareManageResource(item);
                              setShareManageScope((item.shareScope as 1 | 2) || 1);
                              setIsShareManageModalOpen(true);
                            }}
                          >
                            {t('profile.myResources.menu.shareManage')}
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
                              setResourceToDelete(item);
                              setResourceDeleteConfirmOpen(true);
                            }}
                          >
                            {t('profile.myResources.menu.delete')}
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

        {/* 分页 */}
        {!loading && resources.length > 0 && (
          <Flex justify="space-between" align="center" py={4} borderTop="1px solid #F0F0F0">
            <Text fontSize="14px" color="#86909C">
              {t('profile.myResources.pagination.total', { total })}
            </Text>
            <Flex gap={2} align="center">
              <Button
                size="sm"
                variant="outline"
                borderColor="#E5E6EB"
                color={currentPage === 1 ? '#86909C' : '#4E5969'}
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                bg="white"
                _hover={{ borderColor: '#C8000B', color: '#C8000B' }}
              >
                &lt;
              </Button>
              <Text fontSize="14px" color="#4E5969">
                {t('profile.myResources.pagination.pageInfo', { page: currentPage, totalPages })}
              </Text>
              <Button
                size="sm"
                variant="outline"
                borderColor="#E5E6EB"
                color={currentPage === totalPages ? '#86909C' : '#4E5969'}
                isDisabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                bg="white"
                _hover={{ borderColor: '#C8000B', color: '#C8000B' }}
              >
                &gt;
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>

      {/* 草稿箱弹窗 */}
      <DraftBoxModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        onEditDraft={(detail) => {
          setIsDraftModalOpen(false);
          setEditingDraftDetail(detail);
          setIsUploadModalOpen(true);
        }}
      />

      {/* 确认上架/下架弹窗 */}
      <Modal
        isOpen={publishConfirmOpen}
        onClose={() => setPublishConfirmOpen(false)}
        size="sm"
        isCentered
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" />
        <ModalContent
          borderRadius="12px"
          overflow="hidden"
          w="400px"
          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
        >
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
            <Flex align="center" gap={2}>
              <Flex
                w="20px"
                h="20px"
                borderRadius="full"
                bg="#C8000B"
                align="center"
                justify="center"
              >
                <Text fontSize="12px" color="white" fontWeight={600} lineHeight="1">
                  ?
                </Text>
              </Flex>
              <Text fontSize="16px" fontWeight={600} color="#1D2129">
                {resourceToPublish?.status === 1
                  ? t('profile.myResources.modal.unpublishTitle')
                  : t('profile.myResources.modal.publishTitle')}
              </Text>
            </Flex>
            <IconButton
              aria-label={t('profile.myResources.modal.close')}
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
              onClick={() => setPublishConfirmOpen(false)}
            />
          </ModalHeader>
          <ModalBody py={5} px={5}>
            <Text fontSize="14px" color="#4E5969" wordBreak="break-all">
              {resourceToPublish?.status === 1
                ? t('profile.myResources.modal.unpublishConfirm', {
                    name: resourceToPublish?.fileName
                  })
                : t('profile.myResources.modal.publishConfirm', {
                    name: resourceToPublish?.fileName
                  })}
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="flex-end" py={4} px={5} gap={3}>
            <Button
              variant="outline"
              borderColor="#2D2D2D"
              color="#2D2D2D"
              bg="white"
              px={5}
              h="36px"
              fontSize="14px"
              borderRadius="6px"
              _hover={{ bg: '#F5F5F5' }}
              onClick={() => setPublishConfirmOpen(false)}
            >
              {t('profile.myResources.modal.cancel')}
            </Button>
            <Button
              bg="#2D2D2D"
              color="white"
              px={5}
              h="36px"
              fontSize="14px"
              borderRadius="6px"
              _hover={{ bg: '#1F1F1F' }}
              isLoading={publishingResource}
              loadingText={t('profile.myResources.feedback.processing')}
              onClick={async () => {
                if (!resourceToPublish) return;
                setPublishingResource(true);
                try {
                  const isPublish = resourceToPublish.status !== 1;
                  if (isPublish) {
                    await publishResource(resourceToPublish.id);
                  } else {
                    await unpublishResource(resourceToPublish.id);
                  }
                  toast({
                    title: isPublish
                      ? t('profile.myResources.feedback.publishSuccess')
                      : t('profile.myResources.feedback.unpublishSuccess'),
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                  setPublishConfirmOpen(false);
                  setResourceToPublish(null);
                  fetchData();
                } catch (error: any) {
                  const errorMsg =
                    error?.msg || error?.message || t('profile.myResources.feedback.loadError');
                  toast({
                    title: errorMsg,
                    status: 'error',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                } finally {
                  setPublishingResource(false);
                }
              }}
            >
              {t('profile.myResources.modal.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 资源删除确认弹窗 */}
      <Modal
        isOpen={resourceDeleteConfirmOpen}
        onClose={() => setResourceDeleteConfirmOpen(false)}
        size="sm"
        isCentered
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" />
        <ModalContent
          borderRadius="12px"
          overflow="hidden"
          w="400px"
          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
        >
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
            <Flex align="center" gap={2}>
              <Flex
                w="20px"
                h="20px"
                borderRadius="full"
                bg="#C8000B"
                align="center"
                justify="center"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                >
                  <line x1="12" y1="8" x2="12" y2="14" />
                  <circle cx="12" cy="17" r="1.5" fill="white" />
                </svg>
              </Flex>
              <Text fontSize="16px" fontWeight={600} color="#1D2129">
                {t('profile.myResources.modal.deleteTitle')}
              </Text>
            </Flex>
            <IconButton
              aria-label={t('profile.myResources.modal.close')}
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
              onClick={() => setResourceDeleteConfirmOpen(false)}
            />
          </ModalHeader>
          <ModalBody py={5} px={5}>
            <Text fontSize="14px" color="#4E5969">
              {t('profile.myResources.modal.deleteConfirm', { name: resourceToDelete?.fileName })}
            </Text>
          </ModalBody>
          <ModalFooter justifyContent="flex-end" py={4} px={5} gap={3}>
            <Button
              variant="outline"
              borderColor="#2D2D2D"
              color="#2D2D2D"
              bg="white"
              px={5}
              h="36px"
              fontSize="14px"
              borderRadius="6px"
              _hover={{ bg: '#F5F5F5' }}
              onClick={() => setResourceDeleteConfirmOpen(false)}
            >
              {t('profile.myResources.modal.cancel')}
            </Button>
            <Button
              bg="#2D2D2D"
              color="white"
              px={5}
              h="36px"
              fontSize="14px"
              borderRadius="6px"
              _hover={{ bg: '#1F1F1F' }}
              isLoading={deletingResource}
              loadingText={t('profile.myResources.feedback.deleting')}
              onClick={async () => {
                if (!resourceToDelete) return;
                setDeletingResource(true);
                try {
                  await deleteResource(resourceToDelete.id);
                  toast({
                    title: t('profile.myResources.feedback.deleteSuccess'),
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                  setResourceDeleteConfirmOpen(false);
                  setResourceToDelete(null);
                  // 从选中列表中移除
                  setSelectedIds((prev) => prev.filter((id) => id !== resourceToDelete.id));
                  // 刷新列表
                  fetchData();
                } catch (error: any) {
                  const errorMsg =
                    error?.msg || error?.message || t('profile.myResources.feedback.loadError');
                  toast({
                    title: errorMsg,
                    status: 'error',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                } finally {
                  setDeletingResource(false);
                }
              }}
            >
              {t('profile.myResources.modal.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 编辑资源弹窗 */}
      <EditResourceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          fetchData();
        }}
        resource={editingResource}
        detail={editingDetail}
      />

      {/* 资源共享管理弹窗 */}
      <Modal
        isOpen={isShareManageModalOpen}
        onClose={() => setIsShareManageModalOpen(false)}
        isCentered
      >
        <ModalOverlay bg="rgba(0, 0, 0, 0.5)" />
        <ModalContent borderRadius="12px" overflow="hidden" w="480px" maxW="90vw">
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
            {t('profile.myResources.modal.shareTitle')}
            <IconButton
              aria-label={t('profile.myResources.modal.close')}
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
              onClick={() => setIsShareManageModalOpen(false)}
            />
          </ModalHeader>
          <ModalBody py={5} px={5} w="100%">
            <Flex direction="column" gap={5} w="100%">
              {/* 共享至学校资源库 */}
              <Box>
                <Text fontSize="14px" color="#1D2129" fontWeight={500} mb={3}>
                  {t('profile.myResources.modal.shareSchoolLibrary')}
                </Text>
                <Flex align="center" gap={3}>
                  {/* 开关 */}
                  <Box
                    w="44px"
                    h="24px"
                    borderRadius="12px"
                    bg={shareManageScope === 2 ? '#C8000B' : '#E5E6EB'}
                    cursor="pointer"
                    position="relative"
                    transition="all 0.2s"
                    onClick={() => setShareManageScope(shareManageScope === 2 ? 1 : 2)}
                  >
                    <Box
                      w="20px"
                      h="20px"
                      borderRadius="full"
                      bg="white"
                      position="absolute"
                      top="2px"
                      left={shareManageScope === 2 ? '22px' : '2px'}
                      transition="all 0.2s"
                      boxShadow="0 1px 3px rgba(0,0,0,0.1)"
                    />
                  </Box>
                  <Text fontSize="13px" color="#86909C">
                    {t('profile.myResources.modal.shareDescription')}
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </ModalBody>
          <ModalFooter justifyContent="flex-end" py={4} px={5} gap={3}>
            <Button
              variant="outline"
              borderColor="#2D2D2D"
              color="#2D2D2D"
              bg="white"
              px={5}
              h="36px"
              fontSize="14px"
              borderRadius="6px"
              _hover={{ bg: '#F5F5F5' }}
              onClick={() => setIsShareManageModalOpen(false)}
            >
              {t('profile.myResources.modal.cancel')}
            </Button>
            <Button
              bg="#2D2D2D"
              color="white"
              px={5}
              h="36px"
              fontSize="14px"
              borderRadius="6px"
              _hover={{ bg: '#1F1F1F' }}
              isLoading={updatingShareScope}
              loadingText={t('profile.myResources.feedback.saving')}
              onClick={async () => {
                if (!shareManageResource) return;
                setUpdatingShareScope(true);
                try {
                  await updateShareScope(shareManageResource.id, shareManageScope);
                  toast({
                    title: t('profile.myResources.feedback.saveSuccess'),
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                  setIsShareManageModalOpen(false);
                  setShareManageResource(null);
                  fetchData();
                } catch (error: any) {
                  const errorMsg =
                    error?.msg || error?.message || t('profile.myResources.feedback.loadError');
                  toast({
                    title: errorMsg,
                    status: 'error',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                } finally {
                  setUpdatingShareScope(false);
                }
              }}
            >
              {t('profile.myResources.modal.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 上传资源弹窗 */}
      <UploadResourceModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEditingDraftDetail(null);
        }}
        onSuccess={() => {
          setIsUploadModalOpen(false);
          setEditingDraftDetail(null);
          fetchData();
        }}
        draftData={editingDraftDetail}
      />

      {/* 资源预览弹窗 */}
      <PreviewResourceModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewResourceId(null);
          setPreviewResourceName('');
          setPreviewFileFormat('');
        }}
        resourceId={previewResourceId}
        resourceName={previewResourceName}
        fileFormat={previewFileFormat}
        source="my"
      />
    </Box>
  );
}
