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
  uploadResource,
  saveDraft,
  updateResource,
  publishResource,
  getMyMajorNames,
  getMyCourseNames,
  uploadMyResourceFile,
  type UploadResourceRequest,
  type UpdateResourceRequest,
  type ResourceDetailVO,
  type TenantMajorNameVO,
  type TenantCourseNameVO
} from '@/api/teacher/resource/my-resources';
import {
  getTeacherResourceTypeList,
  type ResourceTypeVO
} from '@/api/teacher/resource/all-resources';
// import { uploadPrivateFile } from '@/teacher/api/file';
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

// 获取文件扩展名对应的 formatType
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
    rar: 5,
    '7z': 5,
    html: 6,
    htm: 6
  };
  return map[ext] || 2;
};

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  draftData?: ResourceDetailVO | null;
}

export default function UploadResourceModal({
  isOpen,
  onClose,
  onSuccess,
  draftData
}: UploadResourceModalProps) {
  const { t } = useTranslation('teacher');
  useTeacherPageI18n(['profile']);
  const toast = useToast();

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    resourceName: '',
    majorId: '',
    majorName: '',
    courseId: '',
    courseName: '',
    resourceType: '',
    shareScope: 'schoolwide',
    description: ''
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileKey, setFileKey] = useState('');
  const [fileJson, setFileJson] = useState('');
  const [videoId, setVideoId] = useState('');
  const [formatType, setFormatType] = useState<number | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const fileNameForTypeCheck = uploadForm.file?.name || draftData?.fileName || '';
  const isMediaFile = isVideoFile(fileNameForTypeCheck) || isAudioFile(fileNameForTypeCheck);

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
    if (uploadForm.majorId) {
      setCoursesLoading(true);
      getMyCourseNames(Number(uploadForm.majorId))
        .then((res) => {
          setCourseList(res || []);
        })
        .catch(() => setCourseList([]))
        .finally(() => setCoursesLoading(false));
    } else {
      setCourseList([]);
    }
  }, [uploadForm.majorId]);

  // 回显草稿数据（只依赖 draftData，避免列表变化时重置）
  useEffect(() => {
    if (isOpen && draftData) {
      setUploadForm({
        file: null,
        resourceName: draftData.fileName || '',
        majorId: String(draftData.majorId || ''),
        majorName: '',
        courseId: String(draftData.courseId || ''),
        courseName: '',
        resourceType: getResourceTypeName(draftData.resourceType, resourceTypeOptions) || '',
        shareScope: draftData.shareScope === 2 ? 'schoolwide' : 'personal',
        description: draftData.description || ''
      });
      setFileUrl(draftData.fileUrl || '');
      setFileKey(draftData.fileKey || '');
      setFileJson(draftData.fileJson || '');
      setVideoId(draftData.videoId || '');
      setFormatType(draftData.formatType);
    }
  }, [isOpen, draftData, resourceTypeOptions]);

  // 专业列表加载完成后回显专业名称
  useEffect(() => {
    if (uploadForm.majorId && majorList.length > 0 && !uploadForm.majorName) {
      const majorName = majorList.find((m) => String(m.id) === String(uploadForm.majorId))?.name || '';
      if (majorName) {
        setUploadForm((prev) => ({ ...prev, majorName }));
      }
    }
  }, [majorList, uploadForm.majorId, uploadForm.majorName]);

  // 课程列表加载完成后回显课程名称
  useEffect(() => {
    if (uploadForm.courseId && courseList.length > 0 && !uploadForm.courseName) {
      const courseName = courseList.find((c) => String(c.id) === String(uploadForm.courseId))?.name || '';
      if (courseName) {
        setUploadForm((prev) => ({ ...prev, courseName }));
      }
    }
  }, [courseList, uploadForm.courseId, uploadForm.courseName]);

  const resetUploadForm = () => {
    setUploadForm({
      file: null as File | null,
      resourceName: '',
      majorId: '',
      majorName: '',
      courseId: '',
      courseName: '',
      resourceType: '',
      shareScope: 'schoolwide',
      description: ''
    });
    setFileUrl('');
    setFileKey('');
    setFileJson('');
    setVideoId('');
    setFormatType(undefined);
    setUploading(false);
    setSubmitting(false);
    setIsDragging(false);
  };

  const handleClose = () => {
    resetUploadForm();
    onClose();
  };

  // 是否处于编辑草稿模式
  const isEditDraftMode = !!draftData;

  // 上传文件到服务器
  const uploadFileToServer = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadMyResourceFile(formData);
      setFileUrl(result.fileUrl || '');
      setFileKey(result.fileKey || '');
      if (result.fileJson) setFileJson(result.fileJson);
      if ((result as any).videoId) setVideoId((result as any).videoId);
      if ((result as any).formatType) setFormatType((result as any).formatType);
      toast({
        title: t('profile.myResources.upload.uploadFileSuccess'),
        status: 'success',
        duration: 1500,
        position: 'top'
      });
      return true;
    } catch (error) {
      toast({
        title: t('profile.myResources.upload.uploadFileError'),
        status: 'error',
        duration: 2000,
        position: 'top'
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  // 处理文件选择（自动上传）
  const handleFileSelect = async (file: File) => {
    // 校验文件格式
    if (!isAllowedFile(file.name)) {
      toast({
        title: t('profile.myResources.upload.validation.unsupportedFormat'),
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
        title: t('profile.myResources.upload.validation.fileTooLarge'),
        status: 'warning',
        duration: 3000,
        position: 'top'
      });
      return;
    }

    setUploadForm((prev) => ({ ...prev, file }));
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    // 根据文件类型自动调整资源类型
    const isMedia = isVideoFile(file.name) || isAudioFile(file.name);
    const currentTypeObj = resourceTypeOptions.find((t) => t.name === uploadForm.resourceType);
    const isMediaType = currentTypeObj?.name === '音视频';
    let newResourceType = uploadForm.resourceType;
    if (isMedia && !isMediaType) {
      const mediaOption = resourceTypeOptions.find((t) => t.name === '音视频');
      if (mediaOption) newResourceType = mediaOption.name;
    } else if (!isMedia && isMediaType) {
      newResourceType = '';
    }
    setUploadForm((prev) => ({
      ...prev,
      file,
      resourceName: nameWithoutExt,
      resourceType: newResourceType
    }));
    await uploadFileToServer(file);
  };

  // 处理文件输入变化
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // 处理拖拽
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
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 构建提交参数（严格校验：所有必填项）
  const buildSubmitParams = (): UploadResourceRequest | null => {
    if (!uploadForm.resourceName.trim()) {
      toast({
        title: t('profile.myResources.upload.validation.resourceNameRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }
    if (!uploadForm.majorId) {
      toast({
        title: t('profile.myResources.upload.validation.majorRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }
    if (!uploadForm.courseId) {
      toast({
        title: t('profile.myResources.upload.validation.courseRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }
    if (!uploadForm.resourceType) {
      toast({
        title: t('profile.myResources.upload.validation.resourceTypeRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }
    if (!fileUrl) {
      toast({
        title: t('profile.myResources.upload.validation.fileRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }

    return {
      fileName: uploadForm.file?.name || uploadForm.resourceName,
      fileKey,
      fileUrl,
      fileSize: uploadForm.file?.size || draftData?.fileSize || 0,
      fileJson: fileJson || '{}',
      videoId: videoId || '',
      formatType: getFormatType(
        (uploadForm.file?.name || draftData?.fileName || '').split('.').pop()?.toLowerCase() || ''
      ),
      majorId: Number(uploadForm.majorId),
      courseId: Number(uploadForm.courseId),
      shareScope: uploadForm.shareScope === 'schoolwide' ? 2 : 1,
      resourceType: getResourceTypeValue(uploadForm.resourceType, resourceTypeOptions) || 1,
      description: uploadForm.description
    };
  };

  // 构建草稿参数（仅校验资源名称）
  const buildDraftParams = (): UploadResourceRequest | null => {
    if (!uploadForm.resourceName.trim()) {
      toast({
        title: t('profile.myResources.upload.validation.resourceNameRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }

    return {
      fileName: uploadForm.file?.name || uploadForm.resourceName,
      fileKey,
      fileUrl,
      fileSize: uploadForm.file?.size || draftData?.fileSize || 0,
      fileJson: fileJson || '{}',
      videoId: videoId || '',
      formatType: getFormatType(
        (uploadForm.file?.name || draftData?.fileName || '').split('.').pop()?.toLowerCase() || ''
      ),
      majorId: uploadForm.majorId ? Number(uploadForm.majorId) : 0,
      courseId: uploadForm.courseId ? Number(uploadForm.courseId) : 0,
      shareScope: uploadForm.shareScope === 'schoolwide' ? 2 : 1,
      resourceType: getResourceTypeValue(uploadForm.resourceType, resourceTypeOptions) || 1,
      description: uploadForm.description
    };
  };

  // 构建更新资源参数（编辑草稿模式）
  const buildUpdateParams = (): UpdateResourceRequest | null => {
    if (!draftData) return null;
    if (!uploadForm.resourceName.trim()) {
      toast({
        title: t('profile.myResources.upload.validation.resourceNameRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }
    if (!uploadForm.majorId) {
      toast({
        title: t('profile.myResources.upload.validation.majorRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }
    if (!uploadForm.courseId) {
      toast({
        title: t('profile.myResources.upload.validation.courseRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }
    if (!uploadForm.resourceType) {
      toast({
        title: t('profile.myResources.upload.validation.resourceTypeRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }
    if (!fileUrl) {
      toast({
        title: t('profile.myResources.upload.validation.fileRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }

    return {
      id: draftData.id,
      fileName: uploadForm.file?.name || uploadForm.resourceName,
      fileKey,
      fileUrl,
      fileSize: uploadForm.file?.size || draftData.fileSize || 0,
      fileJson: fileJson || '{}',
      videoId: videoId || '',
      formatType: getFormatType(
        (uploadForm.file?.name || draftData?.fileName || '').split('.').pop()?.toLowerCase() || ''
      ),
      majorId: Number(uploadForm.majorId),
      courseId: Number(uploadForm.courseId),
      shareScope: uploadForm.shareScope === 'schoolwide' ? 2 : 1,
      resourceType: getResourceTypeValue(uploadForm.resourceType, resourceTypeOptions) || 1,
      description: uploadForm.description
    };
  };

  // 构建更新草稿参数（编辑草稿模式，仅校验资源名称）
  const buildUpdateDraftParams = (): UpdateResourceRequest | null => {
    if (!draftData) return null;
    if (!uploadForm.resourceName.trim()) {
      toast({
        title: t('profile.myResources.upload.validation.resourceNameRequired'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return null;
    }

    return {
      id: draftData.id,
      fileName: uploadForm.file?.name || uploadForm.resourceName,
      fileKey,
      fileUrl,
      fileSize: uploadForm.file?.size || draftData.fileSize || 0,
      fileJson: fileJson || '{}',
      videoId: videoId || '',
      formatType: getFormatType(
        (uploadForm.file?.name || draftData?.fileName || '').split('.').pop()?.toLowerCase() || ''
      ),
      majorId: uploadForm.majorId ? Number(uploadForm.majorId) : 0,
      courseId: uploadForm.courseId ? Number(uploadForm.courseId) : 0,
      shareScope: uploadForm.shareScope === 'schoolwide' ? 2 : 1,
      resourceType: getResourceTypeValue(uploadForm.resourceType, resourceTypeOptions) || 1,
      description: uploadForm.description
    };
  };

  // 提交上传
  const handleUploadSubmit = async () => {
    setSubmitting(true);
    try {
      if (isEditDraftMode && draftData) {
        // 编辑草稿模式：先更新资源，再上架
        const updateParams = buildUpdateParams();
        if (!updateParams) {
          setSubmitting(false);
          return;
        }
        await updateResource(updateParams);
        await publishResource(draftData.id);
        toast({
          title: t('profile.myResources.upload.feedback.publishDraftSuccess'),
          status: 'success',
          duration: 2000,
          position: 'top'
        });
      } else {
        // 新建模式：只调上传资源接口
        const params = buildSubmitParams();
        if (!params) {
          setSubmitting(false);
          return;
        }
        await uploadResource(params);
        toast({
          title: t('profile.myResources.upload.feedback.uploadSuccess'),
          status: 'success',
          duration: 2000,
          position: 'top'
        });
      }
      resetUploadForm();
      onSuccess();
    } catch (error: any) {
      const errorMsg =
        error?.msg || error?.message || t('profile.myResources.upload.feedback.error');
      toast({ title: errorMsg, status: 'error', duration: 2000, position: 'top' });
    } finally {
      setSubmitting(false);
    }
  };

  // 保存至草稿
  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      if (isEditDraftMode && draftData) {
        // 编辑草稿模式：调用资源更新接口
        const updateParams = buildUpdateDraftParams();
        if (!updateParams) {
          setSubmitting(false);
          return;
        }
        await updateResource(updateParams);
        toast({
          title: t('profile.myResources.upload.feedback.saveDraftSuccess'),
          status: 'success',
          duration: 2000,
          position: 'top'
        });
      } else {
        // 新建模式：调用保存草稿接口
        const params = buildDraftParams();
        if (!params) {
          setSubmitting(false);
          return;
        }
        await saveDraft(params);
        toast({
          title: t('profile.myResources.upload.feedback.saveDraftSuccess'),
          status: 'success',
          duration: 2000,
          position: 'top'
        });
      }
      resetUploadForm();
      onSuccess();
    } catch (error: any) {
      const errorMsg =
        error?.msg || error?.message || t('profile.myResources.upload.feedback.saveDraftError');
      toast({ title: errorMsg, status: 'error', duration: 2000, position: 'top' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      closeOnOverlayClick={!submitting && !uploading}
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
          {draftData
            ? t('profile.myResources.upload.editTitle')
            : t('profile.myResources.upload.title')}
          <IconButton
            aria-label={t('profile.myResources.upload.close')}
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
            disabled={submitting || uploading}
          />
        </ModalHeader>
        <ModalBody py={5} px={5} w="100%" maxH="calc(100vh - 200px)" overflowY="auto">
          <Flex direction="column" gap={4} w="100%">
            {/* 选择文件 */}
            <Box w="100%">
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.upload.selectFile')}
              </Text>
              {uploadForm.file || (isEditDraftMode && fileUrl) ? (
                <Box bg="#F7F8FA" borderRadius="8px" p={3}>
                  <Flex justify="space-between" align="center">
                    <Flex gap={3} align="center">
                      <FileIcon fileName={uploadForm.file?.name || draftData?.fileName || ''} />
                      <Box>
                        <Text fontSize="14px" color="#1D2129" fontWeight={500}>
                          {uploadForm.file?.name || draftData?.fileName || ''}
                        </Text>
                        <Text
                          fontSize="12px"
                          color={uploading ? '#C8000B' : fileUrl ? '#52C41A' : '#86909C'}
                        >
                          {uploading
                            ? t('profile.myResources.upload.uploading')
                            : fileUrl
                              ? t('profile.myResources.upload.uploadSuccess')
                              : formatFileSize(uploadForm.file?.size || 0)}
                        </Text>
                      </Box>
                    </Flex>
                    <IconButton
                      aria-label={t('profile.myResources.menu.delete')}
                      icon={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#86909C"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      }
                      variant="ghost"
                      size="sm"
                      color="#86909C"
                      disabled={submitting || uploading}
                      onClick={() => {
                        setUploadForm((prev) => ({ ...prev, file: null, resourceName: '' }));
                        setFileUrl('');
                        setFileKey('');
                        setFileJson('');
                        setVideoId('');
                        setFormatType(undefined);
                      }}
                      _hover={{ bg: 'transparent', color: '#C8000B' }}
                    />
                  </Flex>
                </Box>
              ) : !uploadForm.file ? (
                <Box
                  border="1px dashed"
                  borderColor={isDragging ? '#C8000B' : '#E5E6EB'}
                  borderRadius="8px"
                  p={8}
                  textAlign="center"
                  bg={isDragging ? 'rgba(200, 0, 11, 0.02)' : 'white'}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                  transition="all 0.2s"
                  _hover={{ borderColor: '#C8000B', bg: 'rgba(200, 0, 11, 0.02)' }}
                >
                  <Box
                    w="56px"
                    h="56px"
                    mx="auto"
                    mb={3}
                    borderRadius="50%"
                    bg="#FFF1F0"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C8000B"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </Box>
                  <Text fontSize="14px" color="#1D2129" mb={1}>
                    {t('profile.myResources.upload.dragTip')}
                    <Text as="span" color="#C8000B" fontWeight={500}>
                      {t('profile.myResources.upload.clickUpload')}
                    </Text>
                  </Text>
                  <Text fontSize="12px" color="#86909C">
                    {t('profile.myResources.upload.fileSupport')}
                  </Text>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    display="none"
                    onChange={handleFileInputChange}
                  />
                </Box>
              ) : (
                <Box bg="#F7F8FA" borderRadius="8px" p={3}>
                  <Flex justify="space-between" align="center">
                    <Flex gap={3} align="center">
                      <FileIcon fileName={uploadForm.file.name} />
                      <Box>
                        <Text fontSize="14px" color="#1D2129" fontWeight={500}>
                          {uploadForm.file.name}
                        </Text>
                        <Text
                          fontSize="12px"
                          color={uploading ? '#C8000B' : fileUrl ? '#52C41A' : '#86909C'}
                        >
                          {uploading
                            ? t('profile.myResources.upload.uploading')
                            : fileUrl
                              ? t('profile.myResources.upload.uploadSuccess')
                              : formatFileSize(uploadForm.file.size)}
                        </Text>
                      </Box>
                    </Flex>
                    <IconButton
                      aria-label={t('profile.myResources.menu.delete')}
                      icon={
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#86909C"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      }
                      variant="ghost"
                      size="sm"
                      color="#86909C"
                      disabled={submitting || uploading || isEditDraftMode}
                      onClick={() => {
                        setUploadForm((prev) => ({ ...prev, file: null, resourceName: '' }));
                        setFileUrl('');
                        setFileKey('');
                        setFileJson('');
                        setVideoId('');
                        setFormatType(undefined);
                      }}
                      _hover={{ bg: 'transparent', color: '#C8000B' }}
                    />
                  </Flex>
                </Box>
              )}
            </Box>

            {/* 资源名称 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.upload.resourceName')}{' '}
                <Text as="span" color="#C8000B">
                  *
                </Text>
              </Text>
              <Input
                placeholder={t('profile.myResources.upload.resourceNamePlaceholder')}
                value={uploadForm.resourceName}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, resourceName: e.target.value }))
                }
                h="40px"
                fontSize="14px"
                borderColor="#E5E6EB"
                borderRadius="6px"
                w="100%"
                _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                _disabled={{ bg: '#F5F5F5', cursor: 'not-allowed' }}
                disabled={submitting || uploading}
              />
            </Box>

            {/* 选择专业 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.upload.selectMajor')}{' '}
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
                  if (!(submitting || uploading || majorsLoading)) {
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
                      cursor={submitting || uploading || majorsLoading ? 'not-allowed' : 'pointer'}
                      transition="all 0.2s"
                      _hover={{ borderColor: '#C8000B' }}
                      opacity={submitting || uploading || majorsLoading ? 0.6 : 1}
                      tabIndex={0}
                    >
                      <Flex h="100%" align="center" justify="space-between">
                        <Text
                          fontSize="14px"
                          color={uploadForm.majorName ? '#1D2129' : '#86909C'}
                          noOfLines={1}
                        >
                          {uploadForm.majorName ||
                            t('profile.myResources.upload.majorPlaceholder')}
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
                          const isActive = uploadForm.majorId === String(major.id);
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
                                setUploadForm((prev) => ({
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
                {t('profile.myResources.upload.selectCourse')}{' '}
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
                  if (!(!uploadForm.majorId || submitting || uploading || coursesLoading)) {
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
                        !uploadForm.majorId || submitting || uploading || coursesLoading
                          ? 'not-allowed'
                          : 'pointer'
                      }
                      transition="all 0.2s"
                      _hover={{ borderColor: '#C8000B' }}
                      opacity={!uploadForm.majorId || submitting || uploading || coursesLoading ? 0.6 : 1}
                      tabIndex={0}
                    >
                      <Flex h="100%" align="center" justify="space-between">
                        <Text
                          fontSize="14px"
                          color={uploadForm.courseName ? '#1D2129' : '#86909C'}
                          noOfLines={1}
                        >
                          {uploadForm.courseName ||
                            (uploadForm.majorId
                              ? t('profile.myResources.upload.coursePlaceholder')
                              : t('profile.myResources.upload.courseDisabled'))}
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
                          const isActive = uploadForm.courseId === String(course.id);
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
                                setUploadForm((prev) => ({
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
                {t('profile.myResources.upload.resourceType')}{' '}
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
                          color={uploadForm.resourceType ? '#1D2129' : '#86909C'}
                          noOfLines={1}
                        >
                          {uploadForm.resourceType ||
                            t('profile.myResources.upload.resourceTypePlaceholder')}
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
                        const isActive = uploadForm.resourceType === item.name;
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
                              setUploadForm((prev) => ({ ...prev, resourceType: item.name }));
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
                {t('profile.myResources.upload.shareScope')}{' '}
                <Text as="span" color="#C8000B">
                  *
                </Text>
              </Text>
              <Flex gap={6}>
                <Flex
                  align="center"
                  gap={2}
                  cursor={submitting || uploading ? 'not-allowed' : 'pointer'}
                  onClick={() =>
                    !(submitting || uploading) &&
                    setUploadForm((prev) => ({ ...prev, shareScope: 'schoolwide' }))
                  }
                  opacity={submitting || uploading ? 0.6 : 1}
                >
                  <Box
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    border="2px solid"
                    borderColor={uploadForm.shareScope === 'schoolwide' ? '#C8000B' : '#E5E6EB'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {uploadForm.shareScope === 'schoolwide' && (
                      <Box w="8px" h="8px" borderRadius="full" bg="#C8000B" />
                    )}
                  </Box>
                  <Text fontSize="14px" color="#4E5969">
                    {t('profile.myResources.upload.schoolwide')}
                  </Text>
                </Flex>
                <Flex
                  align="center"
                  gap={2}
                  cursor={submitting || uploading ? 'not-allowed' : 'pointer'}
                  onClick={() =>
                    !(submitting || uploading) &&
                    setUploadForm((prev) => ({ ...prev, shareScope: 'personal' }))
                  }
                  opacity={submitting || uploading ? 0.6 : 1}
                >
                  <Box
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    border="2px solid"
                    borderColor={uploadForm.shareScope === 'personal' ? '#C8000B' : '#E5E6EB'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {uploadForm.shareScope === 'personal' && (
                      <Box w="8px" h="8px" borderRadius="full" bg="#C8000B" />
                    )}
                  </Box>
                  <Text fontSize="14px" color="#4E5969">
                    {t('profile.myResources.upload.personal')}
                  </Text>
                </Flex>
              </Flex>
            </Box>

            {/* 资源描述 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={2}>
                {t('profile.myResources.upload.description')}
              </Text>
              <Input
                placeholder={t('profile.myResources.upload.descriptionPlaceholder')}
                value={uploadForm.description}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, description: e.target.value }))
                }
                h="80px"
                fontSize="14px"
                borderColor="#E5E6EB"
                borderRadius="6px"
                w="100%"
                _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                _disabled={{ bg: '#F5F5F5', cursor: 'not-allowed' }}
                as="textarea"
                py={2}
                resize="none"
                disabled={submitting || uploading}
              />
            </Box>
          </Flex>
        </ModalBody>
        <ModalFooter justifyContent="flex-end" py={4} px={5} gap={3}>
          <Button
            variant="outline"
            borderColor="#E5E6EB"
            color="#4E5969"
            bg="white"
            px={5}
            h="36px"
            fontSize="14px"
            borderRadius="6px"
            _hover={{ bg: '#F5F5F5' }}
            onClick={handleSaveDraft}
            isLoading={submitting || uploading}
            loadingText={
              uploading
                ? t('profile.myResources.upload.uploading')
                : t('profile.myResources.upload.saving')
            }
            disabled={submitting || uploading}
          >
            {t('profile.myResources.upload.saveDraft')}
          </Button>
          <Button
            bg="#2D2D2D"
            color="white"
            px={5}
            h="36px"
            fontSize="14px"
            borderRadius="6px"
            _hover={{ bg: '#1F1F1F' }}
            onClick={handleUploadSubmit}
            isLoading={submitting || uploading}
            loadingText={
              uploading
                ? t('profile.myResources.upload.uploading')
                : t('profile.myResources.upload.submitting')
            }
            disabled={submitting || uploading}
          >
            {t('profile.myResources.upload.confirmUpload')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
