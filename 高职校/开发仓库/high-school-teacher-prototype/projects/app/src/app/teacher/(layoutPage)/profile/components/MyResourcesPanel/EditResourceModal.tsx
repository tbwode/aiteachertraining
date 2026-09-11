'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  Button,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTeacherPageI18n } from '@/app/teacher/components/TeacherI18nProvider';
import {
  updateResource,
  getMyMajorNames,
  getMyCourseNames,
  uploadMyResourceFile,
  type UpdateResourceRequest,
  type MyResourceVO,
  type ResourceDetailVO,
  type TenantMajorNameVO,
  type TenantCourseNameVO
} from '@/api/teacher/resource/my-resources';
import {
  getTeacherResourceTypeList,
  type ResourceTypeVO
} from '@/api/teacher/resource/all-resources';
import { FileIcon } from '@/app/teacher/(layoutPage)/profile/components/FileIcon';
import {
  getFileConfig,
  isAllowedFile,
  isVideoFile,
  isAudioFile,
  formatFileSize
} from '@/web/common/file/utils';

// 资源类型列表状态（组件内部维护）
let cachedResourceTypeOptions: ResourceTypeVO[] | null = null;
let cachedResourceTypePromise: Promise<ResourceTypeVO[]> | null = null;

const fetchResourceTypeOptions = async (): Promise<ResourceTypeVO[]> => {
  if (cachedResourceTypeOptions) return cachedResourceTypeOptions;
  if (cachedResourceTypePromise) return cachedResourceTypePromise;
  cachedResourceTypePromise = getTeacherResourceTypeList({ status: 1 });
  const res = await cachedResourceTypePromise;
  cachedResourceTypeOptions = res || [];
  return cachedResourceTypeOptions;
};

// 获取资源类型值（通过 name 查找 id）
const getResourceTypeValue = (label: string, options: ResourceTypeVO[]): number | undefined => {
  const found = options.find((item) => item.name === label);
  return found ? found.id : undefined;
};

// 资源类型 id 转 name
const getResourceTypeName = (id: number, options: ResourceTypeVO[]): string => {
  const found = options.find((item) => item.id === id);
  return found ? found.name : '';
};

// 根据文件扩展名获取 formatType
const getFormatType = (ext: string): number => {
  const map: Record<string, number> = {
    pdf: 1,
    doc: 2,
    docx: 2,
    ppt: 3,
    pptx: 3,
    mp4: 4,
    avi: 4,
    mov: 4,
    wmv: 4,
    mp3: 4,
    zip: 5,
    rar: 5
  };
  return map[ext] || 2;
};

interface EditResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resource: MyResourceVO | null;
  detail: ResourceDetailVO | null;
}

export default function EditResourceModal({
  isOpen,
  onClose,
  onSuccess,
  resource,
  detail
}: EditResourceModalProps) {
  const { t } = useTranslation('teacher');
  useTeacherPageI18n(['profile']);
  const toast = useToast();

  const [editForm, setEditForm] = useState({
    resourceName: '',
    majorId: '',
    majorName: '',
    courseId: '',
    courseName: '',
    resourceType: '',
    shareScope: 'personal',
    description: '',
    fileDeleted: false
  });
  const [editUploading, setEditUploading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFileUrl, setEditFileUrl] = useState('');
  const [editFileKey, setEditFileKey] = useState('');
  const [editFileJson, setEditFileJson] = useState('');
  const [editVideoId, setEditVideoId] = useState('');
  const [editFormatType, setEditFormatType] = useState<number | undefined>(undefined);
  const [editFile, setEditFile] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // 专业与课程列表
  const [majorList, setMajorList] = useState<TenantMajorNameVO[]>([]);
  const [courseList, setCourseList] = useState<TenantCourseNameVO[]>([]);
  const [majorsLoading, setMajorsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // 专业、课程下拉框状态
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // 资源类型列表
  const [resourceTypeOptions, setResourceTypeOptions] = useState<ResourceTypeVO[]>([]);

  // 根据当前文件判断资源类型选项是否禁用
  const displayFileName = editFile?.name || resource?.fileName || '';
  const isMediaFile = isVideoFile(displayFileName) || isAudioFile(displayFileName);

  // 加载资源类型列表
  useEffect(() => {
    if (isOpen) {
      fetchResourceTypeOptions()
        .then(setResourceTypeOptions)
        .catch(() => setResourceTypeOptions([]));
    }
  }, [isOpen]);

  // 加载专业列表
  useEffect(() => {
    if (isOpen) {
      setMajorsLoading(true);
      getMyMajorNames()
        .then((res) => setMajorList(res || []))
        .catch(() => setMajorList([]))
        .finally(() => setMajorsLoading(false));
    }
  }, [isOpen]);

  // 专业变化时加载课程列表
  useEffect(() => {
    if (editForm.majorId) {
      setCoursesLoading(true);
      getMyCourseNames(Number(editForm.majorId))
        .then((res) => setCourseList(res || []))
        .catch(() => setCourseList([]))
        .finally(() => setCoursesLoading(false));
    } else {
      setCourseList([]);
    }
  }, [editForm.majorId]);

  // 当资源数据变化时初始化表单（只依赖 detail/resource，避免列表变化时重置）
  useEffect(() => {
    if (detail && resource) {
      setEditForm({
        resourceName: detail.fileName.replace(/\.[^/.]+$/, ''),
        majorId: String(detail.majorId || ''),
        majorName: '',
        courseId: String(detail.courseId || ''),
        courseName: '',
        resourceType: getResourceTypeName(detail.resourceType, resourceTypeOptions) || '',
        shareScope: detail.shareScope === 2 ? 'schoolwide' : 'personal',
        description: detail.description || '',
        fileDeleted: false
      });
      setEditFileUrl(detail.fileUrl || '');
      setEditFileKey(detail.fileKey || '');
      setEditFileJson(detail.fileJson || '');
      setEditVideoId(detail.videoId || '');
      setEditFormatType(detail.formatType);
      setEditFile(null);
      setEditUploading(false);
      setEditSubmitting(false);
    }
  }, [detail, resource, resourceTypeOptions]);

  // 专业列表加载完成后回显专业名称
  useEffect(() => {
    if (editForm.majorId && majorList.length > 0 && !editForm.majorName) {
      const majorName = majorList.find((m) => String(m.id) === String(editForm.majorId))?.name || '';
      if (majorName) {
        setEditForm((prev) => ({ ...prev, majorName }));
      }
    }
  }, [majorList, editForm.majorId, editForm.majorName]);

  // 课程列表加载完成后回显课程名称
  useEffect(() => {
    if (editForm.courseId && courseList.length > 0 && !editForm.courseName) {
      const courseName = courseList.find((c) => String(c.id) === String(editForm.courseId))?.name || '';
      if (courseName) {
        setEditForm((prev) => ({ ...prev, courseName }));
      }
    }
  }, [courseList, editForm.courseId, editForm.courseName]);

  const resetForm = () => {
    setEditForm({
      resourceName: '',
      majorId: '',
      majorName: '',
      courseId: '',
      courseName: '',
      resourceType: '',
      shareScope: 'personal',
      description: '',
      fileDeleted: false
    });
    setShowMajorDropdown(false);
    setShowCourseDropdown(false);
    setEditFileUrl('');
    setEditFileKey('');
    setEditFileJson('');
    setEditVideoId('');
    setEditFormatType(undefined);
    setEditFile(null);
    setEditUploading(false);
    setEditSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!editForm.resourceName.trim()) {
      toast({
        title: t('profile.myResources.edit.validation.resourceNameRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!editForm.majorId) {
      toast({
        title: t('profile.myResources.edit.validation.majorRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!editForm.courseId) {
      toast({
        title: t('profile.myResources.edit.validation.courseRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (!editForm.resourceType) {
      toast({
        title: t('profile.myResources.edit.validation.resourceTypeRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    if (editForm.fileDeleted && !editFileUrl) {
      toast({
        title: t('profile.myResources.edit.validation.fileRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    setEditSubmitting(true);
    try {
      const fileName = editFile ? editFile.name : detail?.fileName || editForm.resourceName;
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const params: UpdateResourceRequest = {
        id: resource!.id,
        fileName,
        fileKey: editFileKey || detail?.fileKey,
        fileUrl: editFileUrl || detail?.fileUrl,
        fileSize: editFile ? editFile.size : detail?.fileSize,
        fileJson: editFileJson || detail?.fileJson,
        videoId: editVideoId || detail?.videoId,
        formatType: getFormatType(ext),
        majorId: Number(editForm.majorId),
        courseId: Number(editForm.courseId),
        shareScope: editForm.shareScope === 'schoolwide' ? 2 : 1,
        resourceType: getResourceTypeValue(editForm.resourceType, resourceTypeOptions) || 1,
        description: editForm.description
      };

      await updateResource(params);
      toast({
        title: t('profile.myResources.edit.feedback.saveSuccess'),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      resetForm();
      onSuccess();
    } catch (error: any) {
      const errorMsg = error?.msg || error?.message || t('profile.myResources.edit.feedback.error');
      toast({ title: errorMsg, status: 'error', duration: 2000, position: 'top' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 校验文件格式
    if (!isAllowedFile(file.name)) {
      toast({
        title: t('profile.myResources.edit.validation.unsupportedFormat'),
        status: 'warning',
        duration: 3000,
        position: 'top'
      });
      return;
    }

    // 校验文件大小
    const config = getFileConfig(file.name);
    if (config && file.size > config.maxSize) {
      toast({
        title: t('profile.myResources.edit.validation.fileTooLarge'),
        status: 'warning',
        duration: 3000,
        position: 'top'
      });
      return;
    }

    setEditFile(file);
    // 根据文件类型自动调整资源类型
    const isMedia = isVideoFile(file.name) || isAudioFile(file.name);
    const currentTypeObj = resourceTypeOptions.find((t) => t.name === editForm.resourceType);
    const isMediaType = currentTypeObj?.name === '音视频';
    let newResourceType = editForm.resourceType;
    if (isMedia && !isMediaType) {
      const mediaOption = resourceTypeOptions.find((t) => t.name === '音视频');
      if (mediaOption) newResourceType = mediaOption.name;
    } else if (!isMedia && isMediaType) {
      newResourceType = '';
    }
    setEditForm((prev) => ({
      ...prev,
      resourceName: file.name.replace(/\.[^/.]+$/, ''),
      fileDeleted: false,
      resourceType: newResourceType
    }));
    setEditUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadMyResourceFile(formData);
      setEditFileUrl(result.fileUrl || '');
      setEditFileKey(result.fileKey || '');
      if (result.fileJson) setEditFileJson(result.fileJson);
      if ((result as any).videoId) setEditVideoId((result as any).videoId);
      if ((result as any).formatType) setEditFormatType((result as any).formatType);
      toast({
        title: t('profile.myResources.edit.feedback.uploadFileSuccess'),
        status: 'success',
        duration: 1500,
        position: 'top'
      });
    } catch {
      toast({
        title: t('profile.myResources.edit.feedback.uploadFileError'),
        status: 'error',
        duration: 2000,
        position: 'top'
      });
    } finally {
      setEditUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      closeOnOverlayClick={!editSubmitting && !editUploading}
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
          {t('profile.myResources.edit.title')}
          <IconButton
            aria-label={t('profile.myResources.edit.close')}
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
            disabled={editSubmitting || editUploading}
          />
        </ModalHeader>
        <ModalBody py={5} px={5} w="100%" maxH="calc(100vh - 200px)" overflowY="auto">
          <Flex direction="column" gap={4} w="100%">
            {/* 资源文件信息 */}
            <Box w="100%">
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.edit.resourceFile')}
              </Text>
              {!editForm.fileDeleted ? (
                <>
                  <Flex
                    align="center"
                    gap={3}
                    p={3}
                    border="1px solid #E5E6EB"
                    borderRadius="8px"
                    bg="#FAFBFC"
                  >
                    <FileIcon fileName={editFile?.name || resource?.fileName || ''} />
                    <Box flex={1}>
                      <Text fontSize="14px" color="#1D2129" fontWeight={500}>
                        {editFile?.name || resource?.fileName}
                      </Text>
                      <Text fontSize="12px" color="#86909C">
                        {formatFileSize(editFile?.size || resource?.fileSize || 0)}
                      </Text>
                    </Box>
                    <IconButton
                      aria-label={t('profile.myResources.edit.deleteFile')}
                      icon={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      }
                      size="sm"
                      variant="ghost"
                      color="#86909C"
                      _hover={{ color: '#C8000B', bg: 'transparent' }}
                      disabled={editSubmitting || editUploading}
                      onClick={() => setEditForm((prev) => ({ ...prev, fileDeleted: true }))}
                    />
                  </Flex>
                  <Text fontSize="12px" color="#86909C" mt={1}>
                    {t('profile.myResources.edit.replaceFileTip')}
                  </Text>
                </>
              ) : (
                <Box position="relative" as="label" cursor="pointer">
                  <Input
                    type="file"
                    ref={editFileInputRef}
                    position="absolute"
                    opacity={0}
                    w="0"
                    h="0"
                    onChange={handleFileChange}
                  />
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    py={6}
                    px={4}
                    border="2px dashed #E5E6EB"
                    borderRadius="8px"
                    bg="#FAFBFC"
                    _hover={{ borderColor: '#C8000B', bg: '#FFF5F5' }}
                  >
                    <Flex
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg="#FFE8E8"
                      align="center"
                      justify="center"
                      mb={2}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#C8000B"
                        strokeWidth="2"
                      >
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17,8 12,3 7,8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </Flex>
                    <Text
                      fontSize="14px"
                      color="#1D2129"
                      fontWeight={500}
                      mb={1}
                      textAlign="center"
                      w="100%"
                    >
                      {t('profile.myResources.edit.uploadNewFile')}
                    </Text>
                    <Text fontSize="12px" color="#86909C" textAlign="center" w="100%">
                      {t('profile.myResources.edit.fileSupport')}
                    </Text>
                  </Flex>
                </Box>
              )}
            </Box>

            {/* 资源名称 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.edit.resourceName')}{' '}
                <Text as="span" color="#C8000B">
                  *
                </Text>
              </Text>
              <Input
                placeholder={t('profile.myResources.edit.resourceNamePlaceholder')}
                value={editForm.resourceName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, resourceName: e.target.value }))}
                h="40px"
                fontSize="14px"
                borderColor="#E5E6EB"
                borderRadius="6px"
                w="100%"
                _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                disabled={editSubmitting || editUploading}
                _disabled={{ bg: '#F5F5F5', cursor: 'not-allowed' }}
              />
            </Box>

            {/* 选择专业 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.edit.selectMajor')}{' '}
                <Text as="span" color="#C8000B">
                  *
                </Text>
              </Text>
              <Menu
                placement="bottom-start"
                gutter={4}
                matchWidth
                isOpen={showMajorDropdown}
                onOpen={() => {
                  if (!(editSubmitting || editUploading || majorsLoading)) {
                    setShowMajorDropdown(true);
                  }
                }}
                onClose={() => setShowMajorDropdown(false)}
              >
                {({ isOpen }) => (
                  <>
                    <MenuButton
                      as={Box}
                      w="100%"
                      h="40px"
                      px="12px"
                      borderRadius="6px"
                      border="1px solid"
                      borderColor={isOpen ? '#C8000B' : '#E5E6EB'}
                      bg="#FFF"
                      cursor={editSubmitting || editUploading || majorsLoading ? 'not-allowed' : 'pointer'}
                      transition="all 0.2s"
                      _hover={{ borderColor: '#C8000B' }}
                      opacity={editSubmitting || editUploading || majorsLoading ? 0.6 : 1}
                      tabIndex={0}
                    >
                      <Flex h="100%" align="center" justify="space-between">
                        <Text
                          fontSize="14px"
                          color={editForm.majorName ? '#1D2129' : '#86909C'}
                          noOfLines={1}
                        >
                          {editForm.majorName ||
                            t('profile.myResources.edit.majorPlaceholder')}
                        </Text>
                        <Box
                          as="svg"
                          width="14px"
                          height="14px"
                          viewBox="0 0 24 24"
                          fill="none"
                          color="#86909C"
                          transform={isOpen ? 'rotate(180deg)' : undefined}
                          transition="transform 0.2s"
                        >
                          <path
                            d="m6 9 6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Box>
                      </Flex>
                    </MenuButton>
                    <MenuList
                      p="6px"
                      borderRadius="6px"
                      border="1px solid #E5E6EB"
                      bg="#FFF"
                      boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                      maxH="240px"
                      overflowY="auto"
                    >
                      {majorsLoading ? (
                        <Box px={3} py={2} fontSize="14px" color="#86909C">
                          {t('profile.myResources.feedback.loading')}
                        </Box>
                      ) : majorList.length === 0 ? (
                        <Box px={3} py={2} fontSize="14px" color="#86909C">
                          {t('profile.myResources.feedback.noData')}
                        </Box>
                      ) : (
                        majorList.map((major) => {
                          const isActive = editForm.majorId === String(major.id);
                          return (
                            <MenuItem
                              key={major.id}
                              px="10px"
                              py="8px"
                              borderRadius="4px"
                              bg={isActive ? '#FFF5F5' : 'transparent'}
                              color={isActive ? '#C8000B' : '#1D2129'}
                              fontSize="14px"
                              fontWeight={isActive ? 500 : 400}
                              _hover={{ bg: isActive ? '#FFF5F5' : '#F7F8FA' }}
                              onClick={() => {
                                setEditForm((prev) => ({
                                  ...prev,
                                  majorId: String(major.id),
                                  majorName: major.name,
                                  courseId: '',
                                  courseName: ''
                                }));
                              }}
                            >
                              {major.name}
                            </MenuItem>
                          );
                        })
                      )}
                    </MenuList>
                  </>
                )}
              </Menu>
            </Box>

            {/* 选择课程 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.edit.selectCourse')}{' '}
                <Text as="span" color="#C8000B">
                  *
                </Text>
              </Text>
              <Menu
                placement="bottom-start"
                gutter={4}
                matchWidth
                isOpen={showCourseDropdown}
                onOpen={() => {
                  if (!(!editForm.majorId || editSubmitting || editUploading || coursesLoading)) {
                    setShowCourseDropdown(true);
                  }
                }}
                onClose={() => setShowCourseDropdown(false)}
              >
                {({ isOpen }) => (
                  <>
                    <MenuButton
                      as={Box}
                      w="100%"
                      h="40px"
                      px="12px"
                      borderRadius="6px"
                      border="1px solid"
                      borderColor={isOpen ? '#C8000B' : '#E5E6EB'}
                      bg="#FFF"
                      cursor={
                        !editForm.majorId || editSubmitting || editUploading || coursesLoading
                          ? 'not-allowed'
                          : 'pointer'
                      }
                      transition="all 0.2s"
                      _hover={{ borderColor: '#C8000B' }}
                      opacity={!editForm.majorId || editSubmitting || editUploading || coursesLoading ? 0.6 : 1}
                      tabIndex={0}
                    >
                      <Flex h="100%" align="center" justify="space-between">
                        <Text
                          fontSize="14px"
                          color={editForm.courseName ? '#1D2129' : '#86909C'}
                          noOfLines={1}
                        >
                          {editForm.courseName ||
                            (editForm.majorId
                              ? t('profile.myResources.edit.coursePlaceholder')
                              : t('profile.myResources.edit.courseDisabled'))}
                        </Text>
                        <Box
                          as="svg"
                          width="14px"
                          height="14px"
                          viewBox="0 0 24 24"
                          fill="none"
                          color="#86909C"
                          transform={isOpen ? 'rotate(180deg)' : undefined}
                          transition="transform 0.2s"
                        >
                          <path
                            d="m6 9 6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Box>
                      </Flex>
                    </MenuButton>
                    <MenuList
                      p="6px"
                      borderRadius="6px"
                      border="1px solid #E5E6EB"
                      bg="#FFF"
                      boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                      maxH="240px"
                      overflowY="auto"
                    >
                      {coursesLoading ? (
                        <Box px={3} py={2} fontSize="14px" color="#86909C">
                          {t('profile.myResources.feedback.loading')}
                        </Box>
                      ) : courseList.length === 0 ? (
                        <Box px={3} py={2} fontSize="14px" color="#86909C">
                          {t('profile.myResources.feedback.noData')}
                        </Box>
                      ) : (
                        courseList.map((course) => {
                          const isActive = editForm.courseId === String(course.id);
                          return (
                            <MenuItem
                              key={course.id}
                              px="10px"
                              py="8px"
                              borderRadius="4px"
                              bg={isActive ? '#FFF5F5' : 'transparent'}
                              color={isActive ? '#C8000B' : '#1D2129'}
                              fontSize="14px"
                              fontWeight={isActive ? 500 : 400}
                              _hover={{ bg: isActive ? '#FFF5F5' : '#F7F8FA' }}
                              onClick={() => {
                                setEditForm((prev) => ({
                                  ...prev,
                                  courseId: String(course.id),
                                  courseName: course.name
                                }));
                              }}
                            >
                              {course.name}
                            </MenuItem>
                          );
                        })
                      )}
                    </MenuList>
                  </>
                )}
              </Menu>
            </Box>

            {/* 资源类型 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.edit.resourceType')}{' '}
                <Text as="span" color="#C8000B">
                  *
                </Text>
              </Text>
              <Menu placement="bottom-start" gutter={4} matchWidth>
                {({ isOpen }) => (
                  <>
                    <MenuButton
                      as={Box}
                      w="100%"
                      h="40px"
                      px="12px"
                      borderRadius="6px"
                      border="1px solid"
                      borderColor={isOpen ? '#C8000B' : '#E5E6EB'}
                      bg="#FFF"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ borderColor: '#C8000B' }}
                      _focus={{ boxShadow: '0 0 0 1px #C8000B' }}
                    >
                      <Flex h="100%" align="center" justify="space-between">
                        <Text
                          fontSize="14px"
                          color={editForm.resourceType ? '#1D2129' : '#86909C'}
                          noOfLines={1}
                        >
                          {editForm.resourceType ||
                            t('profile.myResources.edit.resourceTypePlaceholder')}
                        </Text>
                        <Box
                          as="svg"
                          width="14px"
                          height="14px"
                          viewBox="0 0 24 24"
                          fill="none"
                          color="#86909C"
                          transform={isOpen ? 'rotate(180deg)' : undefined}
                          transition="transform 0.2s"
                        >
                          <path
                            d="m6 9 6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Box>
                      </Flex>
                    </MenuButton>
                    <MenuList
                      p="6px"
                      borderRadius="6px"
                      border="1px solid #E5E6EB"
                      bg="#FFF"
                      boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                      maxH="240px"
                      overflowY="auto"
                    >
                      {resourceTypeOptions.map((item) => {
                        const isMediaOption = item.name === '音视频';
                        const isOptionDisabled = isMediaFile ? !isMediaOption : isMediaOption;
                        const isActive = editForm.resourceType === item.name;
                        return (
                          <MenuItem
                            key={item.id}
                            px="10px"
                            py="8px"
                            borderRadius="4px"
                            bg={isActive ? '#FFF5F5' : 'transparent'}
                            color={isOptionDisabled ? '#C9CDD4' : isActive ? '#C8000B' : '#1D2129'}
                            fontSize="14px"
                            fontWeight={isActive ? 500 : 400}
                            cursor={isOptionDisabled ? 'not-allowed' : 'pointer'}
                            _hover={{
                              bg: isOptionDisabled ? 'transparent' : '#F7F8FA'
                            }}
                            onClick={() => {
                              if (isOptionDisabled) return;
                              setEditForm((prev) => ({ ...prev, resourceType: item.name }));
                            }}
                          >
                            {item.name}
                          </MenuItem>
                        );
                      })}
                    </MenuList>
                  </>
                )}
              </Menu>
            </Box>

            {/* 共享范围 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.edit.shareScope')}{' '}
                <Text as="span" color="#C8000B">
                  *
                </Text>
              </Text>
              <Flex gap={6}>
                <Flex
                  align="center"
                  gap={2}
                  cursor={editSubmitting || editUploading ? 'not-allowed' : 'pointer'}
                  onClick={() =>
                    !(editSubmitting || editUploading) &&
                    setEditForm((prev) => ({ ...prev, shareScope: 'schoolwide' }))
                  }
                  opacity={editSubmitting || editUploading ? 0.6 : 1}
                >
                  <Box
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    border="2px solid"
                    borderColor={editForm.shareScope === 'schoolwide' ? '#C8000B' : '#E5E6EB'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {editForm.shareScope === 'schoolwide' && (
                      <Box w="8px" h="8px" borderRadius="full" bg="#C8000B" />
                    )}
                  </Box>
                  <Text fontSize="14px" color="#4E5969">
                    {t('profile.myResources.edit.schoolwide')}
                  </Text>
                </Flex>
                <Flex
                  align="center"
                  gap={2}
                  cursor={editSubmitting || editUploading ? 'not-allowed' : 'pointer'}
                  onClick={() =>
                    !(editSubmitting || editUploading) &&
                    setEditForm((prev) => ({ ...prev, shareScope: 'personal' }))
                  }
                  opacity={editSubmitting || editUploading ? 0.6 : 1}
                >
                  <Box
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    border="2px solid"
                    borderColor={editForm.shareScope === 'personal' ? '#C8000B' : '#E5E6EB'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {editForm.shareScope === 'personal' && (
                      <Box w="8px" h="8px" borderRadius="full" bg="#C8000B" />
                    )}
                  </Box>
                  <Text fontSize="14px" color="#4E5969">
                    {t('profile.myResources.edit.personal')}
                  </Text>
                </Flex>
              </Flex>
            </Box>

            {/* 资源描述 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.edit.description')}
              </Text>
              <Input
                placeholder={t('profile.myResources.edit.descriptionPlaceholder')}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                h="80px"
                fontSize="14px"
                borderColor="#E5E6EB"
                borderRadius="6px"
                w="100%"
                _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                as="textarea"
                py={2}
                resize="none"
                disabled={editSubmitting || editUploading}
                _disabled={{ bg: '#F5F5F5', cursor: 'not-allowed' }}
              />
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
            onClick={handleClose}
            disabled={editSubmitting || editUploading}
          >
            {t('profile.myResources.edit.cancel')}
          </Button>
          <Button
            bg="#2D2D2D"
            color="white"
            px={5}
            h="36px"
            fontSize="14px"
            borderRadius="6px"
            _hover={{ bg: '#1F1F1F' }}
            onClick={handleSave}
            isLoading={editSubmitting || editUploading}
            loadingText={
              editUploading
                ? t('profile.myResources.edit.uploading')
                : t('profile.myResources.edit.saving')
            }
            disabled={editSubmitting || editUploading}
          >
            {t('profile.myResources.edit.saveChanges')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
