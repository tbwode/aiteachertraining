'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';
import {
  Box,
  Button,
  Flex,
  Text,
  Input,
  Select,
  Textarea,
  Stack,
  useToast,
  Spinner,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Image,
  Progress,
  CloseButton,
  Collapse
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  AddIcon,
  ChevronRightIcon as ChevronRight,
  ChevronDownIcon
} from '@chakra-ui/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { createNews, updateNews, getNewsDetail } from '@/api/admin/teaching/news';
import { postDeptList } from '@/api/admin/teaching/depts';
import type { DeptItem } from '@/types/api/admin/teaching/depts';
import { ENewsType, ENewsStatus, ENewsMode } from '@/types/api/admin/teaching/news';
import { uploadFilePublic } from '@/teacher/api/file';
import MyEdit from '@/components/common/MyEdit';

// 部门树形单选组件
function DeptTreeSingleSelect({
  deptList,
  selectedId,
  onChange,
  placeholder,
  t
}: {
  deptList: DeptItem[];
  selectedId: string;
  onChange: (id: string) => void;
  placeholder?: string;
  t: (key: string) => string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 默认展开所有有子部门的节点
  useEffect(() => {
    const collectIds = (items: DeptItem[], ids: string[] = []) => {
      items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          ids.push(item.id);
          collectIds(item.children, ids);
        }
      });
      return ids;
    };
    const allIds = collectIds(deptList || []);
    setExpandedIds(new Set(allIds));
  }, [deptList]);

  // 递归渲染部门树
  const renderDeptTree = (items: DeptItem[], level = 0) => {
    return items.map((item) => {
      const isExpanded = expandedIds.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      const isSelected = selectedId === item.id;

      return (
        <Box key={item.id}>
          <Flex
            align="center"
            py={1.5}
            px={2}
            ml={level * 4}
            cursor="pointer"
            bg={isSelected ? '#FEF2F2' : 'transparent'}
            color={isSelected ? '#C83E3E' : 'gray.700'}
            borderRadius="md"
            onClick={() => {
              onChange(item.id);
              setIsOpen(false);
            }}
            _hover={{ bg: isSelected ? '#FEF2F2' : 'gray.50' }}
          >
            {/* 展开/折叠箭头 */}
            {hasChildren ? (
              <Box
                mr={1}
                cursor="pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const newExpanded = new Set(expandedIds);
                  if (isExpanded) newExpanded.delete(item.id);
                  else newExpanded.add(item.id);
                  setExpandedIds(newExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronDownIcon boxSize={5} color="gray.400" />
                ) : (
                  <ChevronRight boxSize={5} color="gray.400" />
                )}
              </Box>
            ) : (
              <Box w="24px" mr={1} />
            )}
            <Text fontSize="14px" fontWeight={isSelected ? 500 : 400}>
              {item.name}
            </Text>
          </Flex>
          {hasChildren && item.children && (
            <Collapse in={isExpanded} animateOpacity>
              <Box>{renderDeptTree(item.children, level + 1)}</Box>
            </Collapse>
          )}
        </Box>
      );
    });
  };

  // 获取选中项的名称
  const getSelectedName = () => {
    const findName = (items: DeptItem[]): string | null => {
      for (const item of items) {
        if (item.id === selectedId) return item.name;
        if (item.children) {
          const name = findName(item.children);
          if (name) return name;
        }
      }
      return null;
    };
    return findName(deptList || []) || placeholder;
  };

  return (
    <Box position="relative">
      <Box
        border="1px"
        borderColor={isOpen ? '#C8000B' : 'gray.200'}
        borderRadius="8px"
        p={2}
        h="48px"
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg="#F2F3F5"
        _hover={{ borderColor: 'gray.300' }}
      >
        <Text fontSize="14px" color={selectedId ? '#333333' : '#86909C'} isTruncated maxW="90%">
          {getSelectedName()}
        </Text>
        <ChevronDownIcon
          boxSize={5}
          color="gray.400"
          transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
          transition="transform 0.2s"
        />
      </Box>
      <Box
        position="absolute"
        top="calc(100% + 4px)"
        left={0}
        right={0}
        zIndex={100}
        overflow="visible"
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      >
        {/* 点击外部关闭 */}
        {isOpen && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={-1}
            onClick={() => setIsOpen(false)}
          />
        )}
        {/* 下拉树形菜单 */}
        <Box
          maxH="300px"
          overflowY="auto"
          bg="white"
          border="1px"
          borderColor="gray.200"
          borderRadius="8px"
          boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          transformOrigin="top"
          style={{
            transform: isOpen ? 'scaleY(1)' : 'scaleY(0.95)',
            transition: 'transform 0.2s ease-out'
          }}
        >
          {deptList && deptList.length > 0 ? (
            renderDeptTree(deptList)
          ) : (
            <Text p={3} fontSize="14px" color="gray.400" textAlign="center">
              {t('content.news.edit.form.noDeptData')}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function EditNewsPage() {
  const { t } = useTranslation('admin');
  useAdminPageI18n(['content']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const id = searchParams.get('id');
  const isEdit = !!id;

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    newsType: '',
    coverImage: '',
    introduction: '',
    deptId: '',
    mode: ENewsMode.INTERNAL,
    content: '',
    sourceUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deptList, setDeptList] = useState<DeptItem[]>([]);

  // 表单校验错误状态
  const [errors, setErrors] = useState<{
    title?: string;
    newsType?: string;
    introduction?: string;
    deptId?: string;
    content?: string;
    sourceUrl?: string;
  }>({});

  // 封面图上传状态
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 资讯类型选项
  const newsTypeOptions = [
    { label: t('content.news.type.notice'), value: ENewsType.NOTICE },
    { label: t('content.news.type.news'), value: ENewsType.NEWS },
    { label: t('content.news.type.policy'), value: ENewsType.POLICY },
    { label: t('content.news.type.teaching'), value: ENewsType.TEACHING },
    { label: t('content.news.type.exchange'), value: ENewsType.EXCHANGE },
    { label: t('content.news.type.achievement'), value: ENewsType.ACHIEVEMENT },
    { label: t('content.news.type.honor'), value: ENewsType.HONOR }
  ];

  // 加载部门列表
  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await postDeptList();
        setDeptList(res || []);
      } catch (error) {
        console.error('加载部门失败', error);
      }
    };
    loadDepts();
  }, []);

  // 加载资讯详情（编辑模式）
  useEffect(() => {
    if (!id) return;
    const loadDetail = async () => {
      setLoading(true);
      try {
        const res = await getNewsDetail({ id });
        setFormData({
          title: res.title || '',
          newsType: String(res.newsType) || '',
          coverImage: res.coverImage || '',
          introduction: res.introduction || '',
          deptId: String(res.deptId) || '',
          mode: res.mode || ENewsMode.INTERNAL,
          content: res.content || '',
          sourceUrl: res.sourceUrl || ''
        });
      } catch (error) {
        toast({
          title: t('content.news.edit.messages.loadDetailFailed'),
          status: 'error',
          duration: 2000
        });
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id, t, toast]);

  // 表单验证
  const validateForm = (isDraft = false) => {
    const newErrors: typeof errors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('content.news.edit.validation.titleRequired');
    } else if (formData.title.length > 50) {
      newErrors.title = t('content.news.edit.validation.titleMaxLength');
    }

    if (!isDraft) {
      if (!formData.newsType) {
        newErrors.newsType = t('content.news.edit.validation.typeRequired');
      }
      if (!formData.introduction.trim()) {
        newErrors.introduction = t('content.news.edit.validation.introductionRequired');
      } else if (formData.introduction.length > 100) {
        newErrors.introduction = t('content.news.edit.validation.introductionMaxLength');
      }
      if (!formData.deptId) {
        newErrors.deptId = t('content.news.edit.validation.deptRequired');
      }
      if (formData.mode === ENewsMode.INTERNAL && !formData.content.trim()) {
        newErrors.content = t('content.news.edit.validation.contentRequired');
      }
      if (formData.mode === ENewsMode.EXTERNAL && !formData.sourceUrl.trim()) {
        newErrors.sourceUrl = t('content.news.edit.validation.sourceUrlRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 清除单个字段错误
  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // 处理封面图上传
  const handleFileUpload = useCallback(
    async (file: File) => {
      // 校验文件类型
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('content.news.edit.messages.uploadImageOnly'),
          status: 'error',
          duration: 2000
        });
        return;
      }
      // 校验文件大小 (最大 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: t('content.news.edit.messages.uploadSizeLimit'),
          status: 'error',
          duration: 2000
        });
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const result = await uploadFilePublic(uploadFormData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setUploadProgress(progress);
            }
          }
        });

        setFormData((prev) => ({ ...prev, coverImage: result.fileUrl || '' }));
        toast({
          title: t('content.news.edit.messages.uploadSuccess'),
          status: 'success',
          duration: 2000
        });
      } catch (error) {
        toast({
          title: t('content.news.edit.messages.uploadFailed'),
          status: 'error',
          duration: 2000
        });
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [t, toast]
  );

  // 点击上传区域
  const handleUploadClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  // 文件选择变化
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // 清空 input 值，允许重复选择同一文件
    e.target.value = '';
  };

  // 拖拽事件处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 删除封面图
  const handleRemoveCover = () => {
    setFormData((prev) => ({ ...prev, coverImage: '' }));
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    if (!validateForm(true)) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        newsType: formData.newsType ? parseInt(formData.newsType) : 0,
        deptId: formData.deptId ? parseInt(formData.deptId) : 0,
        status: ENewsStatus.DRAFT,
        isTop: 0
      };
      if (isEdit) {
        await updateNews({ ...payload, id: id! });
      } else {
        await createNews(payload);
      }
      router.push('/admin/content/news/drafts');
    } catch (error: any) {
      toast({
        title: error?.message || t('content.news.edit.messages.saveFailed'),
        status: 'error',
        duration: 2000
      });
    } finally {
      setSaving(false);
    }
  };

  // 确认发布
  const handlePublish = async () => {
    if (!validateForm(false)) return;
    setPublishing(true);
    try {
      const payload = {
        ...formData,
        newsType: parseInt(formData.newsType),
        deptId: parseInt(formData.deptId),
        status: ENewsStatus.PUBLISHED,
        isTop: 0
      };
      if (isEdit) {
        await updateNews({ ...payload, id: id! });
      } else {
        await createNews(payload);
      }
      router.push('/admin/content/news');
    } catch (error: any) {
      toast({
        title: error?.message || t('content.news.edit.messages.publishFailed'),
        status: 'error',
        duration: 2000
      });
    } finally {
      setPublishing(false);
    }
  };

  // 返回
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="8px">
      {/* 返回标题 */}
      <Box borderBottom="1px solid #C8000B" pb={4} mb={6}>
        <Flex align="center" gap={4}>
          <Flex
            fontSize="16px"
            color="#C8000B"
            fontWeight="400"
            cursor="pointer"
            align="center"
            onClick={handleBack}
          >
            <ChevronLeftIcon boxSize={5} />
            <Text>{t('content.news.edit.back')}</Text>
          </Flex>
          <Text color="#303133" fontSize="20px" fontWeight="bold">
            {isEdit ? t('content.news.edit.title.edit') : t('content.news.edit.title.add')}
          </Text>
        </Flex>
      </Box>

      {/* 表单 */}
      <Box maxW="672px" mx="auto" py={4}>
        <Stack spacing={6}>
          {/* 资讯标题 */}
          <FormControl isInvalid={!!errors.title}>
            <FormLabel fontSize="14px" color="#4E5969" mb={2}>
              {t('content.news.edit.form.title')}
              <Text color="#F53F3F" ml={1} display="inline">
                *
              </Text>
            </FormLabel>
            <Input
              placeholder={t('content.news.edit.form.titlePlaceholder')}
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                clearError('title');
              }}
              bg="#F2F3F5"
              border="none"
              h="48px"
              maxLength={50}
              color="#333333"
              _placeholder={{ color: '#86909C' }}
            />
            <FormErrorMessage>{errors.title}</FormErrorMessage>
          </FormControl>

          {/* 资讯类型 */}
          <FormControl isInvalid={!!errors.newsType}>
            <FormLabel fontSize="14px" color="#4E5969" mb={2}>
              {t('content.news.edit.form.type')}
              <Text color="#F53F3F" ml={1} display="inline">
                *
              </Text>
            </FormLabel>
            <Select
              placeholder={t('content.news.edit.form.typePlaceholder')}
              value={formData.newsType}
              onChange={(e) => {
                setFormData({ ...formData, newsType: e.target.value });
                clearError('newsType');
              }}
              bg="#F2F3F5"
              border="none"
              h="48px"
              color="#333333"
              _placeholder={{ color: '#86909C' }}
            >
              {newsTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.newsType}</FormErrorMessage>
          </FormControl>

          {/* 封面图 */}
          <Box>
            <Text fontSize="14px" color="#4E5969" mb={2}>
              {t('content.news.edit.form.cover')}
            </Text>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
            {formData.coverImage ? (
              <Box position="relative" w="120px" h="120px" borderRadius="8px" overflow="hidden">
                <Image
                  src={formData.coverImage}
                  alt={t('content.news.edit.form.cover')}
                  objectFit="cover"
                  w="100%"
                  h="100%"
                />
                <CloseButton
                  position="absolute"
                  top="4px"
                  right="4px"
                  size="sm"
                  bg="rgba(0,0,0,0.5)"
                  color="white"
                  borderRadius="full"
                  _hover={{ bg: 'rgba(0,0,0,0.7)' }}
                  onClick={handleRemoveCover}
                />
              </Box>
            ) : (
              <Flex
                w="110px"
                h="110px"
                bg="#F7F8FA"
                border="1px dashed"
                borderColor={isDragging ? '#C8000B' : '#D1D5DB'}
                borderRadius="8px"
                direction="column"
                align="center"
                justify="center"
                cursor={uploading ? 'not-allowed' : 'pointer'}
                opacity={uploading ? 0.6 : 1}
                onClick={handleUploadClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                transition="all 0.2s"
                _hover={{ borderColor: '#C8000B', bg: '#FFF0F0' }}
              >
                {uploading ? (
                  <Box w="80%">
                    <Progress
                      value={uploadProgress}
                      size="sm"
                      colorScheme="red"
                      borderRadius="full"
                    />
                    <Text fontSize="12px" color="#86909C" mt={2} textAlign="center">
                      {t('content.news.edit.form.coverUploading', { progress: uploadProgress })}
                    </Text>
                  </Box>
                ) : (
                  <>
                    <Flex
                      w="24px"
                      h="24px"
                      bg="#C8000B"
                      borderRadius="full"
                      align="center"
                      justify="center"
                      mb={2}
                    >
                      <AddIcon boxSize={17} color="white" />
                    </Flex>
                    <Text fontSize="12px" color="#4E5969">
                      {t('content.news.edit.form.coverUpload')}
                    </Text>
                  </>
                )}
              </Flex>
            )}
          </Box>

          {/* 简介 */}
          <FormControl isInvalid={!!errors.introduction}>
            <FormLabel fontSize="14px" color="#4E5969" mb={2}>
              {t('content.news.edit.form.introduction')}
              <Text color="#F53F3F" ml={1} display="inline">
                *
              </Text>
            </FormLabel>
            <Box position="relative">
              <Textarea
                placeholder={t('content.news.edit.form.introductionPlaceholder')}
                value={formData.introduction}
                onChange={(e) => {
                  setFormData({ ...formData, introduction: e.target.value });
                  clearError('introduction');
                }}
                bg="#F2F3F5"
                border="none"
                minH="120px"
                maxLength={100}
                resize="vertical"
                color="#333333"
                _placeholder={{ color: '#86909C' }}
                pb="24px"
              />
              <Text fontSize="14px" color="#86909C" position="absolute" bottom="8px" right="12px">
                {formData.introduction.length}/100
              </Text>
            </Box>
            <FormErrorMessage>{errors.introduction}</FormErrorMessage>
          </FormControl>

          {/* 发布方 */}
          <FormControl isInvalid={!!errors.deptId}>
            <FormLabel fontSize="14px" color="#4E5969" mb={2}>
              {t('content.news.edit.form.dept')}
              <Text color="#F53F3F" ml={1} display="inline">
                *
              </Text>
            </FormLabel>
            <DeptTreeSingleSelect
              deptList={deptList}
              selectedId={formData.deptId}
              onChange={(id) => {
                setFormData({ ...formData, deptId: id });
                clearError('deptId');
              }}
              placeholder={t('content.news.edit.form.deptPlaceholder')}
              t={t}
            />
            <FormErrorMessage>{errors.deptId}</FormErrorMessage>
          </FormControl>

          {/* 模式 */}
          <FormControl>
            <FormLabel fontSize="14px" color="#4E5969" mb={2}>
              {t('content.news.edit.form.mode')}
              <Text color="#F53F3F" ml={1} display="inline">
                *
              </Text>
            </FormLabel>
            <Flex gap={4}>
              <Box
                w="210px"
                h="40px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="#F2F3F5"
                borderRadius="8px"
                border={
                  formData.mode === ENewsMode.INTERNAL
                    ? '1px solid #C8000B'
                    : '1px solid transparent'
                }
                cursor="pointer"
                onClick={() => {
                  setFormData({ ...formData, mode: ENewsMode.INTERNAL });
                  clearError('content');
                  clearError('sourceUrl');
                }}
                transition="all 0.2s"
              >
                {/* 单选圆圈样式 */}
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="full"
                  border="2px solid"
                  borderColor={formData.mode === ENewsMode.INTERNAL ? '#C83E3E' : '#D1D5DB'}
                  bg={formData.mode === ENewsMode.INTERNAL ? '#C83E3E' : 'white'}
                  mr={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {formData.mode === ENewsMode.INTERNAL && (
                    <Box w="6px" h="6px" borderRadius="full" bg="white" />
                  )}
                </Box>
                <Text
                  fontSize="14px"
                  color={formData.mode === ENewsMode.INTERNAL ? '#C83E3E' : '#4E5969'}
                  fontWeight={formData.mode === ENewsMode.INTERNAL ? 500 : 400}
                >
                  {t('content.news.edit.form.modeInternal')}
                </Text>
              </Box>
              <Box
                w="210px"
                h="40px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="#F2F3F5"
                borderRadius="8px"
                border={
                  formData.mode === ENewsMode.EXTERNAL
                    ? '1px solid #C8000B'
                    : '1px solid transparent'
                }
                cursor="pointer"
                onClick={() => {
                  setFormData({ ...formData, mode: ENewsMode.EXTERNAL });
                  clearError('content');
                  clearError('sourceUrl');
                }}
                transition="all 0.2s"
              >
                {/* 单选圆圈样式 */}
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="full"
                  border="2px solid"
                  borderColor={formData.mode === ENewsMode.EXTERNAL ? '#C83E3E' : '#D1D5DB'}
                  bg={formData.mode === ENewsMode.EXTERNAL ? '#C83E3E' : 'white'}
                  mr={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {formData.mode === ENewsMode.EXTERNAL && (
                    <Box w="6px" h="6px" borderRadius="full" bg="white" />
                  )}
                </Box>
                <Text
                  fontSize="14px"
                  color={formData.mode === ENewsMode.EXTERNAL ? '#C83E3E' : '#4E5969'}
                  fontWeight={formData.mode === ENewsMode.EXTERNAL ? 500 : 400}
                >
                  {t('content.news.edit.form.modeExternal')}
                </Text>
              </Box>
            </Flex>
          </FormControl>

          {/* 资讯内容 - 站内模式 */}
          {formData.mode === ENewsMode.INTERNAL && (
            <FormControl isInvalid={!!errors.content}>
              <FormLabel fontSize="14px" color="#4E5969" mb={2}>
                {t('content.news.edit.form.content')}
                <Text color="#F53F3F" ml={1} display="inline">
                  *
                </Text>
              </FormLabel>
              <Box
                bg="#F2F3F5"
                borderRadius="8px"
                overflow="hidden"
                border={errors.content ? '1px solid' : 'none'}
                borderColor={errors.content ? '#F53F3F' : 'transparent'}
              >
                <MyEdit
                  value={formData.content}
                  onChange={(value) => {
                    setFormData({ ...formData, content: value });
                    clearError('content');
                  }}
                  placeholder={t('content.news.edit.form.contentPlaceholder')}
                  height="400px"
                />
              </Box>
              <FormErrorMessage>{errors.content}</FormErrorMessage>
            </FormControl>
          )}

          {/* 原文链接 - 站外模式 */}
          {formData.mode === ENewsMode.EXTERNAL && (
            <FormControl isInvalid={!!errors.sourceUrl}>
              <FormLabel fontSize="14px" color="#4E5969" mb={2}>
                {t('content.news.edit.form.sourceUrl')}
                <Text color="#F53F3F" ml={1} display="inline">
                  *
                </Text>
              </FormLabel>
              <Input
                placeholder={t('content.news.edit.form.sourceUrlPlaceholder')}
                value={formData.sourceUrl}
                onChange={(e) => {
                  setFormData({ ...formData, sourceUrl: e.target.value });
                  clearError('sourceUrl');
                }}
                bg="#F2F3F5"
                border="none"
                h="48px"
                color="#333333"
                _placeholder={{ color: '#86909C' }}
              />
              <FormErrorMessage>{errors.sourceUrl}</FormErrorMessage>
            </FormControl>
          )}

          {/* 底部按钮 */}
          <Flex justify="center" gap={4} pt={4}>
            <Button
              w="120px"
              h="42px"
              bg="#F2F3F5"
              color="#4E5969"
              borderRadius="8px"
              fontSize="14px"
              _hover={{ bg: '#E5E6EB' }}
              onClick={handleSaveDraft}
              isLoading={saving}
            >
              {t('content.news.edit.actions.saveDraft')}
            </Button>
            <Button
              w="120px"
              h="42px"
              bg="#2D2D2D"
              color="white"
              borderRadius="8px"
              fontSize="14px"
              _hover={{ bg: '#1F1F1F' }}
              onClick={handlePublish}
              isLoading={publishing}
            >
              {t('content.news.edit.actions.publish')}
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
}
