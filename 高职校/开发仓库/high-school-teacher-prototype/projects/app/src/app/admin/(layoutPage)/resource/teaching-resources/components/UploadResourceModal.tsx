'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Flex,
  Text,
  IconButton,
  Box,
  Button,
  Input,
  Textarea,
  Radio,
  RadioGroup,
  Stack,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import {
  uploadResource,
  saveDraftResource,
  updateResource,
  batchPublishResource,
  getResourceTypeList,
  getMajorNames,
  getCourseNames,
  uploadResourceFile
} from '@/api/admin/resource-center/teaching-resource';
import type {
  ResourceUploadRequest,
  ResourceVO
} from '@/types/api/admin/resource-center/teaching-resource';
import { EResourceStatus } from '@/types/api/admin/resource-center/teaching-resource';
// import { uploadPrivateFile } from '@/teacher/api/file';
import { FileIcon } from '@/app/teacher/(layoutPage)/profile/components/FileIcon';
import {
  getFileConfig,
  isAllowedFile,
  isVideoFile,
  isAudioFile,
  formatFileSize
} from '@/web/common/file/utils';

type UploadResourceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  draftData?: ResourceVO | null;
};

// 资源类型选项（从接口加载）
let resourceTypeOptions: { id: number; name: string }[] = [];

function getFileFormat(ext: string): string {
  const map: Record<string, string> = {
    pdf: 'pdf',
    doc: 'doc',
    docx: 'doc',
    ppt: 'ppt',
    pptx: 'ppt',
    xls: 'doc',
    xlsx: 'doc',
    mp4: 'video',
    avi: 'video',
    mov: 'video',
    wmv: 'video',
    zip: 'zip',
    rar: 'zip',
    '7z': 'zip',
    html: 'html',
    htm: 'html'
  };
  return map[ext] || 'doc';
}

// 根据文件扩展名获取 formatType
function getFormatType(ext: string): number {
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
}

export default function UploadResourceModal({
  isOpen,
  onClose,
  onSuccess,
  draftData
}: UploadResourceModalProps) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileKey, setFileKey] = useState<string>('');
  const [fileJson, setFileJson] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('');
  const [formatType, setFormatType] = useState<number | undefined>(undefined);

  const [resourceName, setResourceName] = useState('');
  const [major, setMajor] = useState('');
  const [majorName, setMajorName] = useState('');
  const [course, setCourse] = useState('');
  const [courseName, setCourseName] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [shareScope, setShareScope] = useState('2');
  const [description, setDescription] = useState('');
  const [draftId, setDraftId] = useState<number | undefined>(undefined);

  // 资源类型选项（从接口加载）
  const [typeOptions, setTypeOptions] = useState<{ id: number; name: string }[]>([]);

  // 根据当前文件判断资源类型选项是否禁用
  const fileNameForTypeCheck = selectedFile?.name || draftData?.fileName || '';
  const isMediaFile = isVideoFile(fileNameForTypeCheck) || isAudioFile(fileNameForTypeCheck);

  // 专业、课程选项（从接口加载）
  const [majorOptions, setMajorOptions] = useState<{ id: string; name: string }[]>([]);
  const [courseOptions, setCourseOptions] = useState<{ id: number; name: string }[]>([]);

  // 专业、课程下拉框显隐状态
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // 根据选中的专业获取对应的课程列表
  const availableCourses = major
    ? courseOptions.filter((c) => {
        const selectedMajor = majorOptions.find((m) => String(m.id) === major);
        return selectedMajor ? true : false;
      })
    : courseOptions;

  // 专业、课程 loading 状态
  const [majorsLoading, setMajorsLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // 重置表单
  const resetForm = () => {
    setSelectedFile(null);
    setFileUrl('');
    setFileKey('');
    setFileJson('');
    setVideoId('');
    setFormatType(undefined);
    setResourceName('');
    setMajor('');
    setMajorName('');
    setCourse('');
    setCourseName('');
    setResourceType('');
    setShareScope('2');
    setDescription('');
    setDraftId(undefined);
  };

  // 处理专业变更
  const handleMajorChange = (newMajor: string, newMajorName: string) => {
    setMajor(newMajor);
    setMajorName(newMajorName);
    // 清空已选课程
    setCourse('');
    setCourseName('');
    // 加载对应课程
    if (newMajor) {
      setCoursesLoading(true);
      getCourseNames({ majorId: Number(newMajor) })
        .then((list) => setCourseOptions(list))
        .catch(() => setCourseOptions([]))
        .finally(() => setCoursesLoading(false));
    } else {
      setCourseOptions([]);
    }
  };

  // 加载资源类型列表
  useEffect(() => {
    if (typeOptions.length === 0) {
      getResourceTypeList()
        .then((list) => {
          const options = list.map((item) => ({ id: item.id, name: item.name }));
          setTypeOptions(options);
          resourceTypeOptions = options;
        })
        .catch(() => {
          // 静默失败
        });
    }
  }, [typeOptions.length]);

  // 加载专业列表
  useEffect(() => {
    if (isOpen && majorOptions.length === 0) {
      setMajorsLoading(true);
      getMajorNames()
        .then((list) => setMajorOptions(list))
        .catch(() => setMajorOptions([]))
        .finally(() => setMajorsLoading(false));
    }
  }, [isOpen, majorOptions.length]);

  // 专业列表加载完成后回显专业名称
  useEffect(() => {
    if (major && majorOptions.length > 0 && !majorName) {
      const name = majorOptions.find((m) => String(m.id) === major)?.name || '';
      if (name) setMajorName(name);
    }
  }, [major, majorOptions, majorName]);

  // 课程列表加载完成后回显课程名称
  useEffect(() => {
    if (course && courseOptions.length > 0 && !courseName) {
      const name = courseOptions.find((c) => String(c.id) === course)?.name || '';
      if (name) setCourseName(name);
    }
  }, [course, courseOptions, courseName]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    // 如果有草稿数据，回显到表单
    if (draftData) {
      setResourceName(draftData.fileName.replace(/\.[^/.]+$/, '') || '');
      setMajor(draftData.majorId ? String(draftData.majorId) : '');
      setCourse(draftData.courseId ? String(draftData.courseId) : '');
      const typeName = resourceTypeOptions.find((t) => t.id === draftData.resourceType)?.name || '';
      setResourceType(typeName);
      setShareScope(draftData.shareScope ? String(draftData.shareScope) : '2');
      setDescription(draftData.description || '');
      // 回显后端返回的文件相关字段
      setFileUrl(draftData.fileUrl || '');
      setFileKey(draftData.fileKey || '');
      setFileJson(draftData.fileJson || '');
      setVideoId(draftData.videoId || '');
      setFormatType(draftData.formatType ?? undefined);
      // 保存草稿 id
      setDraftId(draftData.id);
      // 草稿没有本地文件对象
      setSelectedFile(null);

      // 加载草稿对应专业下的课程
      if (draftData.majorId) {
        setCoursesLoading(true);
        getCourseNames({ majorId: draftData.majorId })
          .then((list) => setCourseOptions(list))
          .catch(() => setCourseOptions([]))
          .finally(() => setCoursesLoading(false));
      }
    } else {
      resetForm();
    }
  }, [isOpen, draftData]);

  // 上传文件到服务器
  const uploadFileToServer = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadResourceFile(formData);
      setFileUrl(result.fileUrl || '');
      setFileKey(result.fileKey || '');
      // 存储 fileJson、videoId、formatType（如果后端返回）
      if (result.fileJson) setFileJson(result.fileJson);
      if ((result as any).videoId) setVideoId((result as any).videoId);
      if ((result as any).formatType) setFormatType((result as any).formatType);
      toast({
        title: t('resource.uploadModal.fileUploadSuccess'),
        status: 'success',
        duration: 1500
      });
      return true;
    } catch (error) {
      toast({
        title: t('resource.uploadModal.fileUploadFailed'),
        status: 'error',
        duration: 2000
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    // 校验文件格式
    if (!isAllowedFile(file.name)) {
      toast({
        title: t('resource.uploadModal.validation.unsupportedFormat'),
        status: 'warning',
        duration: 3000
      });
      return;
    }

    // 校验文件大小
    const config = getFileConfig(file.name);
    if (config && file.size > config.maxSize) {
      toast({
        title: t('resource.uploadModal.validation.fileTooLarge'),
        status: 'warning',
        duration: 3000
      });
      return;
    }

    setSelectedFile(file);
    // 自动填充资源名称为文件名（去掉扩展名）
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!resourceName) {
      setResourceName(nameWithoutExt);
    }
    // 根据文件类型自动调整资源类型
    const isMedia = isVideoFile(file.name) || isAudioFile(file.name);
    const currentTypeObj = typeOptions.find((t) => t.name === resourceType);
    const isMediaType = currentTypeObj?.name === '音视频';
    if (isMedia && !isMediaType) {
      const mediaOption = typeOptions.find((t) => t.name === '音视频');
      if (mediaOption) setResourceType(mediaOption.name);
    } else if (!isMedia && isMediaType) {
      setResourceType('');
    }
    // 自动上传文件
    await uploadFileToServer(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
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
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // 根据 fileName 获取文件后缀对应的 formatType
  const resolveFormatType = (): number | undefined => {
    const fileName = selectedFile?.name || draftData?.fileName || '';
    if (!fileName) return undefined;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return getFormatType(ext);
  };

  // 构建上传参数
  const buildUploadParams = (status: EResourceStatus): ResourceUploadRequest => {
    const params: ResourceUploadRequest = {
      fileName: '',
      status
    };

    if (selectedFile) {
      params.fileName = selectedFile.name;
      params.fileSize = selectedFile.size;
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      params.fileFormat = getFileFormat(ext);
      params.formatType = getFormatType(ext);
    } else if (draftId) {
      // 编辑草稿时，保留原文件信息
      params.fileName = draftData?.fileName || resourceName;
      params.fileSize = draftData?.fileSize;
      params.fileFormat = draftData?.fileFormat;
      const ext = (draftData?.fileName || '').split('.').pop()?.toLowerCase() || '';
      params.formatType = ext ? getFormatType(ext) : draftData?.formatType;
    } else {
      params.fileName = resourceName;
    }

    // 添加文件上传后的URL、Key、fileJson、videoId
    if (fileUrl) params.fileUrl = fileUrl;
    if (fileKey) params.fileKey = fileKey;
    if (fileJson) params.fileJson = fileJson;
    if (videoId) params.videoId = videoId;

    // 编辑草稿时，若用户未重新上传文件，保留原文件信息
    if (!selectedFile && draftId && draftData) {
      if (draftData.fileUrl) params.fileUrl = draftData.fileUrl;
      if (draftData.fileKey) params.fileKey = draftData.fileKey;
      if (draftData.fileJson) params.fileJson = draftData.fileJson;
      if (draftData.videoId) params.videoId = draftData.videoId;
    }

    if (resourceType) {
      const found = typeOptions.find((t) => t.name === resourceType);
      if (found) params.resourceType = found.id;
    }
    if (shareScope) params.shareScope = Number(shareScope);
    if (major) params.majorId = Number(major);
    if (course) params.courseId = Number(course);
    if (description) params.description = description;

    return params;
  };

  // 提交上传（确认上传：校验所有必填字段）
  const handleUpload = async () => {
    if (!resourceName.trim()) {
      toast({
        title: t('resource.uploadModal.validation.nameRequired'),
        status: 'warning',
        duration: 2000
      });
      return;
    }
    if (!fileUrl && !draftId) {
      toast({
        title: t('resource.uploadModal.validation.fileRequired'),
        status: 'warning',
        duration: 2000
      });
      return;
    }
    if (!major) {
      toast({
        title: t('resource.uploadModal.validation.majorRequired'),
        status: 'warning',
        duration: 2000
      });
      return;
    }
    if (!course) {
      toast({
        title: t('resource.uploadModal.validation.courseRequired'),
        status: 'warning',
        duration: 2000
      });
      return;
    }
    if (!resourceType) {
      toast({
        title: t('resource.uploadModal.validation.typeRequired'),
        status: 'warning',
        duration: 2000
      });
      return;
    }

    setSubmitting(true);
    try {
      const params = buildUploadParams(EResourceStatus.PUBLISHED);
      if (draftId) {
        // 从草稿箱编辑，先调用 update 接口，再调用上架接口
        params.id = draftId;
        await updateResource(params);
        await batchPublishResource([draftId]);
      } else {
        // 新建上传，调用 upload 接口
        await uploadResource(params);
      }
      toast({ title: t('resource.uploadModal.uploadSuccess'), status: 'success', duration: 2000 });
      onSuccess?.();
      onClose();
    } catch {
      toast({ title: t('resource.uploadModal.uploadFailed'), status: 'error', duration: 2000 });
    } finally {
      setSubmitting(false);
    }
  };

  // 保存至草稿箱（只校验资源名称）
  const handleSaveDraft = async () => {
    if (!resourceName.trim()) {
      toast({
        title: t('resource.uploadModal.validation.nameRequired'),
        status: 'warning',
        duration: 2000
      });
      return;
    }

    setSubmitting(true);
    try {
      const params = buildUploadParams(EResourceStatus.DRAFT);
      console.log(draftId, 'draftId');
      if (draftId) {
        // 从草稿箱编辑，调用 update 接口，传 status=0
        params.id = draftId;
        await updateResource(params);
      } else {
        // 新建保存草稿，调用 saveDraft 接口
        await saveDraftResource(params);
      }
      toast({ title: t('resource.draftsModal.saveSuccess'), status: 'success', duration: 2000 });
      onSuccess?.();
      onClose();
    } catch {
      toast({ title: t('resource.draftsModal.saveFailed'), status: 'error', duration: 2000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered closeOnOverlayClick={!submitting}>
      <ModalOverlay bg="rgba(15, 23, 42, 0.22)" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="12px" maxW="480px">
        <ModalHeader py={4} px={5} borderBottom="1px solid" borderColor="#F0F0F0">
          <Flex justify="space-between" align="center">
            <Text fontSize="16px" fontWeight="600" color="#1D2129">
              {t('resource.uploadModal.title')}
            </Text>
            <IconButton
              aria-label={t('resource.actions.close')}
              icon={<CloseIcon w={3} h={3} />}
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              color="#86909C"
              _hover={{ bg: 'transparent', color: '#4E5969' }}
            />
          </Flex>
        </ModalHeader>

        <ModalBody py={5} px={5} maxH="720px" overflowY="auto">
          {/* 文件上传区域 */}
          {selectedFile || (draftId && fileUrl) ? (
            <Box bg="#F7F8FA" borderRadius="8px" p={3} mb={5}>
              <Flex justify="space-between" align="center">
                <Flex gap={3} align="center">
                  <FileIcon fileName={selectedFile?.name || draftData?.fileName || ''} />
                  <Box>
                    <Text fontSize="14px" color="#1D2129" fontWeight="500">
                      {selectedFile?.name || draftData?.fileName || ''}
                    </Text>
                    <Text
                      fontSize="12px"
                      color={uploading ? '#C8000B' : fileUrl ? '#52C41A' : '#86909C'}
                    >
                      {uploading
                        ? t('resource.uploadModal.uploading')
                        : fileUrl
                          ? t('resource.uploadModal.uploadSuccess')
                          : formatFileSize(selectedFile?.size || 0)}
                    </Text>
                  </Box>
                </Flex>
                <IconButton
                  aria-label={t('resource.actions.delete')}
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
                    setSelectedFile(null);
                    setResourceName('');
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
          ) : (
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
              onClick={handleFileClick}
              transition="all 0.2s"
              _hover={{ borderColor: '#C8000B', bg: 'rgba(200, 0, 11, 0.02)' }}
              mb={5}
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
                {t('resource.uploadModal.dragText')}
                <Text as="span" color="#C8000B" fontWeight="500">
                  {t('resource.uploadModal.clickUpload')}
                </Text>
              </Text>
              <Text fontSize="12px" color="#86909C">
                {t('resource.uploadModal.uploadHint')}
              </Text>
              <Input type="file" ref={fileInputRef} display="none" onChange={handleInputChange} />
            </Box>
          )}

          {/* 表单字段 */}
          <Stack spacing={4}>
            {/* 资源名称 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={1.5}>
                {t('resource.uploadModal.resourceName')}
                <Text as="span" color="#C8000B">
                  *
                </Text>
              </Text>
              <Input
                placeholder={t('resource.uploadModal.resourceNamePlaceholder')}
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                h="40px"
                fontSize="14px"
                borderColor="#E5E6EB"
                borderRadius="6px"
                _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                _disabled={{ bg: '#F5F5F5', cursor: 'not-allowed' }}
              />
            </Box>

            {/* 选择专业 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={1.5}>
                {t('resource.uploadModal.major')}
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
                          color={majorName ? '#1D2129' : '#86909C'}
                          noOfLines={1}
                        >
                          {majorName || t('resource.uploadModal.majorPlaceholder')}
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
                          {t('resource.uploadModal.loading')}
                        </Box>
                      ) : majorOptions.length === 0 ? (
                        <Box px={3} py={2} fontSize="14px" color="#86909C">
                          {t('resource.uploadModal.noData')}
                        </Box>
                      ) : (
                        majorOptions.map((m) => {
                          const isActive = major === String(m.id);
                          return (
                            <MenuItem
                              key={m.id}
                              px="10px"
                              py="8px"
                              borderRadius="4px"
                              bg={isActive ? '#FFF5F5' : 'transparent'}
                              color={isActive ? '#C8000B' : '#1D2129'}
                              fontSize="14px"
                              fontWeight={isActive ? 500 : 400}
                              _hover={{ bg: isActive ? '#FFF5F5' : '#F7F8FA' }}
                              onClick={() => {
                                handleMajorChange(String(m.id), m.name);
                              }}
                            >
                              {m.name}
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
              <Text fontSize="14px" color="#1D2129" mb={1.5}>
                {t('resource.uploadModal.course')}
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
                  if (!(!major || submitting || uploading || coursesLoading)) {
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
                        !major || submitting || uploading || coursesLoading
                          ? 'not-allowed'
                          : 'pointer'
                      }
                      transition="all 0.2s"
                      _hover={{ borderColor: '#C8000B' }}
                      opacity={!major || submitting || uploading || coursesLoading ? 0.6 : 1}
                      tabIndex={0}
                    >
                      <Flex h="100%" align="center" justify="space-between">
                        <Text
                          fontSize="14px"
                          color={courseName ? '#1D2129' : '#86909C'}
                          noOfLines={1}
                        >
                          {courseName ||
                            (major
                              ? t('resource.uploadModal.coursePlaceholder')
                              : t('resource.uploadModal.coursePlaceholderNoMajor'))}
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
                          {t('resource.uploadModal.loading')}
                        </Box>
                      ) : courseOptions.length === 0 ? (
                        <Box px={3} py={2} fontSize="14px" color="#86909C">
                          {t('resource.uploadModal.noData')}
                        </Box>
                      ) : (
                        courseOptions.map((c) => {
                          const isActive = course === String(c.id);
                          return (
                            <MenuItem
                              key={c.id}
                              px="10px"
                              py="8px"
                              borderRadius="4px"
                              bg={isActive ? '#FFF5F5' : 'transparent'}
                              color={isActive ? '#C8000B' : '#1D2129'}
                              fontSize="14px"
                              fontWeight={isActive ? 500 : 400}
                              _hover={{ bg: isActive ? '#FFF5F5' : '#F7F8FA' }}
                              onClick={() => {
                                setCourse(String(c.id));
                                setCourseName(c.name);
                              }}
                            >
                              {c.name}
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
              <Text fontSize="14px" color="#1D2129" mb={1.5}>
                {t('resource.uploadModal.resourceType')}
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
                          color={resourceType ? '#1D2129' : '#86909C'}
                          noOfLines={1}
                        >
                          {resourceType || t('resource.uploadModal.resourceTypePlaceholder')}
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
                      {typeOptions.map((type) => {
                        const isMediaOption = type.name === '音视频';
                        const isOptionDisabled = isMediaFile ? !isMediaOption : isMediaOption;
                        const isActive = resourceType === type.name;
                        return (
                          <MenuItem
                            key={type.id}
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
                              setResourceType(type.name);
                            }}
                          >
                            {type.name}
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
              <Text fontSize="14px" color="#1D2129" mb={1.5}>
                {t('resource.uploadModal.shareScope')}
                <Text as="span" color="#C8000B">
                  *
                </Text>
              </Text>
              <RadioGroup value={shareScope} onChange={setShareScope}>
                <Stack direction="row" spacing={6}>
                  <Radio
                    value="2"
                    sx={{
                      '[data-checked]': {
                        borderColor: '#333333',
                        bg: '#333333'
                      }
                    }}
                  >
                    <Text fontSize="14px" color="#4E5969">
                      {t('resource.uploadModal.shareScopeSchool')}
                    </Text>
                  </Radio>
                  <Radio
                    value="1"
                    sx={{
                      '[data-checked]': {
                        borderColor: '#333333',
                        bg: '#333333'
                      }
                    }}
                  >
                    <Text fontSize="14px" color="#4E5969">
                      {t('resource.uploadModal.shareScopePersonal')}
                    </Text>
                  </Radio>
                </Stack>
              </RadioGroup>
            </Box>

            {/* 资源描述 */}
            <Box>
              <Text fontSize="14px" color="#1D2129" mb={1.5}>
                {t('resource.uploadModal.description')}
              </Text>
              <Textarea
                placeholder={t('resource.uploadModal.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minH="80px"
                fontSize="14px"
                borderColor="#E5E6EB"
                borderRadius="6px"
                resize="none"
                _focus={{ borderColor: '#C8000B', boxShadow: '0 0 0 1px #C8000B' }}
                _disabled={{ bg: '#F5F5F5', cursor: 'not-allowed' }}
              />
            </Box>
          </Stack>
        </ModalBody>

        <ModalFooter
          py={4}
          px={5}
          borderTop="1px solid"
          borderColor="#F0F0F0"
          justifyContent="flex-end"
          gap={2}
        >
          <Button
            h="36px"
            px={5}
            borderRadius="6px"
            borderColor="#D9D9D9"
            variant="outline"
            bg="white"
            color="#4E5969"
            fontSize="14px"
            fontWeight="400"
            disabled={submitting || uploading}
            onClick={handleSaveDraft}
            _hover={{ borderColor: '#2D2D2D', color: '#2D2D2D' }}
          >
            {t('resource.uploadModal.saveDraft')}
          </Button>
          <Button
            h="36px"
            px={5}
            borderRadius="6px"
            bg="#2D2D2D"
            color="white"
            fontSize="14px"
            fontWeight="400"
            isLoading={submitting || uploading}
            loadingText={
              uploading ? t('resource.uploadModal.uploading') : t('resource.uploadModal.submitting')
            }
            onClick={handleUpload}
            _hover={{ bg: '#1F1F1F' }}
          >
            {t('resource.uploadModal.confirmUpload')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
