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
  useToast,
  Spinner
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import NewDateRangePicker from '@/components/common/NewDateRangePicker';
import {
  getTeacherAllResourcePage,
  downloadResource,
  batchDownloadResource,
  getMajorNames,
  getCourseNames,
  getTeacherNames,
  getTeacherResourceTypeList,
  type TeacherAllResourceVO,
  type TenantMajorNameVO,
  type TenantCourseNameVO,
  type TeacherNameVO,
  type ResourceTypeVO
} from '@/api/teacher/resource/all-resources';
import PreviewResourceModal from './PreviewResourceModal';
import { FileIcon } from './FileIcon';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import { downloadFileFromUrl } from '@/web/common/file/utils';

// 归属标签颜色
const OWNERSHIP_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#F0E8FF', color: '#7B61FF' },
  2: { bg: '#E8F4FD', color: '#2B7BF6' }
};

// 共享范围标签颜色
const SHARE_SCOPE_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#F2F3F5', color: '#86909C' },
  2: { bg: '#E8FFEA', color: '#00B42A' }
};

// 文件格式颜色配置
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

// 文件大小格式化（接口返回 B，固定换算为 KB 展示）
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 KB';
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

export default function AllResourcesPanel() {
  const { t } = useTranslation('teacher');
  const isI18nReady = useTeacherPageI18n(['profile']);
  const toast = useToast();

  // 列表数据状态
  const [resources, setResources] = useState<TeacherAllResourceVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // 搜索表单状态
  const [major, setMajor] = useState('');
  const [course, setCourse] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [format, setFormat] = useState('');
  const [source, setSource] = useState('');
  const [uploader, setUploader] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 选择状态
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 专业、课程、上传人、类型、格式、来源输入筛选状态
  const [majorInput, setMajorInput] = useState('');
  const [courseInput, setCourseInput] = useState('');
  const [uploaderInput, setUploaderInput] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showUploaderDropdown, setShowUploaderDropdown] = useState(false);
  const [showResourceTypeDropdown, setShowResourceTypeDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const majorRef = useRef<HTMLDivElement>(null);
  const courseRef = useRef<HTMLDivElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);
  const resourceTypeRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const [isMajorFiltering, setIsMajorFiltering] = useState(false);
  const [isCourseFiltering, setIsCourseFiltering] = useState(false);
  const [isUploaderFiltering, setIsUploaderFiltering] = useState(false);

  // 专业列表数据
  const [majorOptions, setMajorOptions] = useState<TenantMajorNameVO[]>([]);
  const [majorLoading, setMajorLoading] = useState(false);

  // 课程列表数据
  const [courseOptions, setCourseOptions] = useState<TenantCourseNameVO[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);

  // 上传人列表数据
  const [teacherOptions, setTeacherOptions] = useState<TeacherNameVO[]>([]);
  const [teacherLoading, setTeacherLoading] = useState(false);

  // 资源类型列表数据
  const [resourceTypeOptions, setResourceTypeOptions] = useState<ResourceTypeVO[]>([]);
  const [resourceTypeLoading, setResourceTypeLoading] = useState(false);

  // 获取专业名称列表
  const fetchMajorNames = useCallback(async (searchKey?: string) => {
    setMajorLoading(true);
    try {
      const res = await getMajorNames(searchKey);
      setMajorOptions(res || []);
    } catch {
      setMajorOptions([]);
    } finally {
      setMajorLoading(false);
    }
  }, []);

  // 获取课程名称列表
  const fetchCourseNames = useCallback(
    async (searchKey?: string) => {
      setCourseLoading(true);
      try {
        const res = await getCourseNames(major ? Number(major) : undefined, searchKey);
        setCourseOptions(res || []);
      } catch {
        setCourseOptions([]);
      } finally {
        setCourseLoading(false);
      }
    },
    [major]
  );

  // 获取教师名称列表（上传人下拉框）
  const fetchTeacherNames = useCallback(async (searchKey?: string) => {
    setTeacherLoading(true);
    try {
      const res = await getTeacherNames(searchKey);
      setTeacherOptions(res || []);
    } catch {
      setTeacherOptions([]);
    } finally {
      setTeacherLoading(false);
    }
  }, []);

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
      if (resourceTypeRef.current && !resourceTypeRef.current.contains(event.target as Node)) {
        setShowResourceTypeDropdown(false);
      }
      if (formatRef.current && !formatRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 专业下拉框聚焦时加载专业列表
  useEffect(() => {
    if (showMajorDropdown && majorOptions.length === 0) {
      fetchMajorNames(isMajorFiltering ? majorInput || undefined : undefined);
    }
  }, [showMajorDropdown, majorInput, isMajorFiltering, majorOptions.length, fetchMajorNames]);

  // 课程下拉框聚焦时加载课程列表
  useEffect(() => {
    if (showCourseDropdown && courseOptions.length === 0) {
      fetchCourseNames(isCourseFiltering ? courseInput || undefined : undefined);
    }
  }, [showCourseDropdown, courseInput, isCourseFiltering, courseOptions.length, fetchCourseNames]);

  // 上传人下拉框聚焦时加载教师列表
  useEffect(() => {
    if (showUploaderDropdown && teacherOptions.length === 0) {
      fetchTeacherNames(isUploaderFiltering ? uploaderInput || undefined : undefined);
    }
  }, [
    showUploaderDropdown,
    uploaderInput,
    isUploaderFiltering,
    teacherOptions.length,
    fetchTeacherNames
  ]);

  const filteredMajorOptions = isMajorFiltering
    ? majorOptions.filter((m) => m.name.includes(majorInput))
    : majorOptions;

  const filteredCourseOptions = isCourseFiltering
    ? courseOptions.filter((c) => c.name.includes(courseInput))
    : courseOptions;

  const filteredUploaderOptions = isUploaderFiltering
    ? teacherOptions.filter((u) => u.name.includes(uploaderInput))
    : teacherOptions;

  // 获取资源类型列表
  const fetchResourceTypes = useCallback(async () => {
    setResourceTypeLoading(true);
    try {
      const res = await getTeacherResourceTypeList({ status: 1 });
      setResourceTypeOptions(res || []);
    } catch {
      setResourceTypeOptions([]);
    } finally {
      setResourceTypeLoading(false);
    }
  }, []);

  // 获取来源类型值
  const getSourceTypeValue = (value: string): number | undefined => {
    switch (value) {
      case 'school':
        return 1;
      case 'ai':
        return 2;
      default:
        return undefined;
    }
  };

  // 获取格式类型值
  const getFormatTypeValue = (value: string): number | undefined => {
    switch (value) {
      case 'pdf':
        return 1;
      case 'word':
        return 2;
      case 'ppt':
        return 3;
      case 'video':
        return 4;
      case 'zip':
        return 5;
      case 'html':
        return 6;
      case 'link':
        return 7;
      default:
        return undefined;
    }
  };

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
        sourceType: getSourceTypeValue(source),
        uploaderId: uploader ? Number(uploader) : undefined,
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
        searchKey: searchKeyword || undefined
      };

      const res = await getTeacherAllResourcePage(params);
      setResources(res.records);
      setTotal(res.total);
    } catch (error) {
      toast({
        title: t('profile.allResources.feedback.loadError'),
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
    source,
    uploader,
    dateStart,
    dateEnd,
    searchKeyword,
    toast
  ]);

  // 初始加载资源类型列表
  useEffect(() => {
    fetchResourceTypes();
  }, [fetchResourceTypes]);

  // 筛选条件变化时（选中即生效的下拉项、日期范围、搜索关键词）重置到第 1 页，
  // 避免在非首页时切换条件导致请求携带越界页码、查不到本应存在的数据。
  const isFirstFilterRender = useRef(true);
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [major, course, resourceType, format, source, uploader, dateStart, dateEnd, searchKeyword]);

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

  // 文件类型图标组件
  const FileTypeIcon = ({ format }: { format: string }) => {
    const color = FILE_FORMAT_COLORS[format] || '#999';
    return (
      <Flex
        w="40px"
        h="40px"
        bg={color}
        borderRadius="8px"
        align="center"
        justify="center"
        fontSize="12px"
        fontWeight={600}
        color="white"
      >
        {format?.toUpperCase()?.slice(0, 2) || '?'}
      </Flex>
    );
  };

  // 预览弹窗状态
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewResourceId, setPreviewResourceId] = useState<number | null>(null);
  const [previewResourceName, setPreviewResourceName] = useState('');
  const [previewFileFormat, setPreviewFileFormat] = useState('');

  return (
    <Box>
      {/* 页面标题 */}
      <Box mb={5}>
        <Text fontSize="20px" fontWeight={600} color="#1D2129">
          {t('profile.allResources.title')}
        </Text>
        <Text fontSize="14px" color="#86909C" mt={1}>
          {t('profile.allResources.description')}
        </Text>
      </Box>

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
                placeholder={t('profile.allResources.filters.placeholder.major')}
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
                    const selected = majorOptions.find((m) => String(m.id) === major);
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
                    {t('profile.allResources.feedback.loading')}
                  </Box>
                ) : filteredMajorOptions.length === 0 ? (
                  <Box px={3} py={2} fontSize="14px" color="#86909C">
                    {t('profile.allResources.feedback.noData')}
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
                        bg={major === String(option.id) ? '#FFF5F5' : 'white'}
                        color={major === String(option.id) ? '#C8000B' : '#1D2129'}
                        onClick={() => {
                          setMajor(String(option.id));
                          setMajorInput(option.name);
                          setIsMajorFiltering(false);
                          setShowMajorDropdown(false);
                          setCourse('');
                          setCourseInput('');
                          setCourseOptions([]);
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
          <Box ref={courseRef} position="relative" flex={1}>
            <InputGroup>
              <Input
                placeholder={t('profile.allResources.filters.placeholder.course')}
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
                    {t('profile.allResources.feedback.loading')}
                  </Box>
                ) : filteredCourseOptions.length === 0 ? (
                  <Box px={3} py={2} fontSize="14px" color="#86909C">
                    {t('profile.allResources.feedback.noData')}
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
          <Box ref={resourceTypeRef} position="relative" flex={1}>
            <InputGroup>
              <Input
                placeholder={t('profile.allResources.filters.allTypes')}
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
                {resourceTypeLoading ? (
                  <Box px={3} py={2} fontSize="14px" color="#86909C">
                    {t('profile.allResources.feedback.loading')}
                  </Box>
                ) : resourceTypeOptions.length === 0 ? (
                  <Box px={3} py={2} fontSize="14px" color="#86909C">
                    {t('profile.allResources.feedback.noData')}
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
                placeholder={t('profile.allResources.filters.allFormats')}
                value={format ? t(`profile.allResources.filters.formatOptions.${format}`) : ''}
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
                  { key: 'pdf', label: t('profile.allResources.filters.formatOptions.pdf') },
                  { key: 'word', label: t('profile.allResources.filters.formatOptions.word') },
                  { key: 'ppt', label: t('profile.allResources.filters.formatOptions.ppt') },
                  { key: 'video', label: t('profile.allResources.filters.formatOptions.video') },
                  { key: 'zip', label: t('profile.allResources.filters.formatOptions.zip') },
                  { key: 'html', label: t('profile.allResources.filters.formatOptions.html') },
                  { key: 'link', label: t('profile.allResources.filters.formatOptions.link') }
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
          <Box ref={sourceRef} position="relative" flex={1}>
            <InputGroup>
              <Input
                placeholder={t('profile.allResources.filters.allSources')}
                value={source ? t(`profile.allResources.filters.sourceOptions.${source}`) : ''}
                readOnly
                onClick={() => {
                  setShowSourceDropdown(true);
                }}
                onFocus={() => {
                  setShowSourceDropdown(true);
                }}
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
                    onClick={() => {
                      setSource('');
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
                    onClick={() => setShowSourceDropdown(true)}
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
                  { key: 'school', label: t('profile.allResources.filters.sourceOptions.school') },
                  { key: 'ai', label: t('profile.allResources.filters.sourceOptions.ai') }
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
        </Flex>

        {/* 第二行筛选 */}
        <Flex gap={3} align="center">
          <Box ref={uploaderRef} position="relative" w="180px" flex="none">
            <InputGroup>
              <Input
                placeholder={t('profile.allResources.filters.placeholder.uploader')}
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
                    {t('profile.allResources.feedback.loading')}
                  </Box>
                ) : filteredUploaderOptions.length === 0 ? (
                  <Box px={3} py={2} fontSize="14px" color="#86909C">
                    {t('profile.allResources.feedback.noData')}
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
              placeholder={t('profile.allResources.filters.placeholder.search')}
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
            {t('profile.allResources.actions.query')}
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
              setCourse('');
              setCourseInput('');
              setResourceType('');
              setFormat('');
              setSource('');
              setUploader('');
              setUploaderInput('');
              setDateStart('');
              setDateEnd('');
              setSearchKeyword('');
              setCurrentPage(1);
            }}
          >
            {t('profile.allResources.actions.reset')}
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
            {t('profile.allResources.table.selected', { count: selectedIds.length })}
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
                    title: t('profile.allResources.feedback.batchDownloadSuccess'),
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                } catch {
                  toast({
                    title: t('profile.allResources.feedback.batchDownloadError'),
                    status: 'error',
                    duration: 2000,
                    isClosable: true,
                    position: 'top'
                  });
                }
              }}
            >
              {t('profile.allResources.actions.batchDownload')}
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
              {t('profile.allResources.actions.cancelSelection')}
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
                {t('profile.allResources.table.columns.fileName')}
              </Th>
              <Th
                w="80px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.allResources.table.columns.ownership')}
              </Th>
              <Th
                w="100px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.allResources.table.columns.uploader')}
              </Th>
              <Th
                w="100px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.allResources.table.columns.fileSize')}
              </Th>
              <Th
                w="100px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.allResources.table.columns.resourceType')}
              </Th>
              <Th
                w="100px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.allResources.table.columns.shareScope')}
              </Th>
              <Th
                w="60px"
                px={3}
                py={3}
                fontSize="14px"
                color="#86909C"
                textAlign="center"
                borderBottom="1px solid #F0F0F0"
              >
                {t('profile.allResources.table.columns.actions')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={8} py={16} borderBottom="1px solid #F0F0F0">
                  <Flex justify="center" align="center" gap={2}>
                    <Spinner size="md" color="#C8000B" />
                    <Text color="gray.500">{t('profile.allResources.feedback.loading')}</Text>
                  </Flex>
                </Td>
              </Tr>
            ) : resources.length === 0 ? (
              <Tr>
                <Td colSpan={8} py={16} borderBottom="1px solid #F0F0F0">
                  <Flex direction="column" align="center" gap={2} color="gray.500">
                    <Text fontSize="14px" fontWeight={600}>
                      {t('profile.allResources.empty.title')}
                    </Text>
                    <Text fontSize="12px">{t('profile.allResources.empty.description')}</Text>
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
                      px={3}
                      py={1}
                      bg={OWNERSHIP_COLORS[item.ownerType]?.bg || '#F2F3F5'}
                      color={OWNERSHIP_COLORS[item.ownerType]?.color || '#4E5969'}
                      fontSize="12px"
                      borderRadius="12px"
                      fontWeight={500}
                    >
                      {t(
                        `profile.allResources.ownership.${item.ownerType === 1 ? 'personal' : 'school'}`
                      )}
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
                      bg={SHARE_SCOPE_COLORS[item.shareScope]?.bg || '#F2F3F5'}
                      color={SHARE_SCOPE_COLORS[item.shareScope]?.color || '#86909C'}
                      fontSize="12px"
                      borderRadius="4px"
                    >
                      {t(
                        `profile.allResources.shareScope.${item.shareScope === 1 ? 'personal' : 'schoolwide'}`
                      )}
                    </Box>
                  </Td>
                  <Td px={3} py={3} borderBottom="1px solid #F0F0F0">
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
                        aria-label={t('profile.allResources.table.columns.actions')}
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
                          {t('profile.allResources.actions.preview')}
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
                                toast({
                                  title: t('profile.allResources.feedback.downloadStarted'),
                                  status: 'success',
                                  duration: 2000,
                                  isClosable: true,
                                  position: 'top'
                                });
                              } else {
                                toast({
                                  title: t('profile.allResources.feedback.downloadLinkError'),
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
                                t('profile.allResources.feedback.downloadError');
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
                          {t('profile.allResources.actions.download')}
                        </MenuItem>
                      </MenuList>
                    </Menu>
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
              {t('profile.allResources.pagination.total', { total })}
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
                {t('profile.allResources.pagination.pageInfo', { page: currentPage, totalPages })}
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
      />
    </Box>
  );
}
