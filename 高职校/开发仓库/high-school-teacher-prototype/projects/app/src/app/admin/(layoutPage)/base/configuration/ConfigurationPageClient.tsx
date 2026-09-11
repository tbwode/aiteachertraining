'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  useToast,
  Image,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { getTenantDetail, updateTenantDetail } from '@/api/admin/teaching/tenant';
import { uploadFilePublic } from '@/teacher/api/file';
import { useAdminPageI18n } from '@/app/admin/components/AdminI18nProvider';

// 图片字段映射关系：主字段 -> URL字段（用于展示模式）
const IMAGE_FIELD_MAP: Record<string, string> = {
  avatar: 'avatarUrl',
  backgroundImg: 'backgroundImgUrl',
  functionBackgroundImg: 'functionBackgroundImgUrl',
  fullNameImg: 'fullNameImgUrl',
  sidebarImg: 'sidebarImgUrl',
  homepageBackgroundImg: 'homepageBackgroundImgUrl'
};

// 图片尺寸配置
const IMAGE_SIZES: Record<string, { width: number; height: number; display: string }> = {
  avatar: { width: 58, height: 58, display: '58x58' },
  fullNameImg: { width: 264, height: 40, display: '264x40' },
  sidebarImg: { width: 844, height: 687, display: '844x687' },
  backgroundImg: { width: 1920, height: 1080, display: '1920x1080' },
  functionBackgroundImg: { width: 1700, height: 1080, display: '1700x1080' },
  homepageBackgroundImg: { width: 1700, height: 1080, display: '1700x1080' }
};

// 配置数据接口
interface ConfigData {
  name: string;
  fullName: string;
  domain: string;
  avatar?: string;
  backgroundImg?: string;
  functionBackgroundImg?: string;
  fullNameImg?: string;
  sidebarImg?: string;
  homepageBackgroundImg?: string;
  avatarUrl?: string;
  backgroundImgUrl?: string;
  functionBackgroundImgUrl?: string;
  fullNameImgUrl?: string;
  sidebarImgUrl?: string;
  homepageBackgroundImgUrl?: string;
}

// 图片上传组件
interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  sizeDisplay: string;
  t: (key: string) => string;
}

function ImageUpload({ value, onChange, sizeDisplay, t }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('base.configuration.upload.imageOnly'),
        status: 'error',
        duration: 2000,
        isClosable: true
      });
      return;
    }

    // 检查文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('base.configuration.upload.sizeLimit'),
        status: 'error',
        duration: 2000,
        isClosable: true
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadFilePublic(formData);
      if (result.fileUrl) {
        onChange(result.fileUrl);
        toast({
          title: t('base.configuration.upload.success'),
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      }
    } catch (error) {
      toast({
        title: t('base.configuration.upload.failed'),
        status: 'error',
        duration: 2000,
        isClosable: true
      });
    } finally {
      setUploading(false);
      // 重置 input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <Flex flexDirection="column" alignItems="flex-start">
      <Box
        width="80px"
        height="80px"
        position="relative"
        cursor="pointer"
        onClick={handleClick}
        flexShrink={0}
        borderRadius="8px"
        overflow="hidden"
        bg="#F5F5F5"
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        {value ? (
          <>
            <Image
              src={value}
              alt={t('base.configuration.image.alt')}
              width="80px"
              height="80px"
              objectFit="cover"
            />
            {/* 悬停遮罩 */}
            <Flex
              position="absolute"
              top={0}
              left={0}
              width="80px"
              height="80px"
              bg="rgba(0,0,0,0.5)"
              justifyContent="center"
              alignItems="center"
              opacity={0}
              _hover={{ opacity: 1 }}
              transition="opacity 0.2s"
            >
              <Text color="white" fontSize="12px">
                {t('base.configuration.upload.replace')}
              </Text>
            </Flex>
          </>
        ) : (
          <Flex
            width="80px"
            height="80px"
            justifyContent="center"
            alignItems="center"
            bg="#F5F5F5"
            flexDirection="column"
            gap={1}
          >
            {/* 红色圆形加号 */}
            <Flex
              width="18px"
              height="18px"
              borderRadius="50%"
              bg="#E53935"
              justifyContent="center"
              alignItems="center"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1V13M1 7H13"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Flex>
            <Text fontSize="10px" color="#333">
              {uploading
                ? t('base.configuration.upload.uploading')
                : t('base.configuration.upload.clickToUpload')}
            </Text>
          </Flex>
        )}
      </Box>
      {/* 尺寸提示 */}
      <Text fontSize="12px" color="#666" mt="8px">
        {sizeDisplay}
      </Text>
    </Flex>
  );
}

// 占位图片组件
function PlaceholderImage() {
  return <Box width="80px" height="80px" flexShrink={0} bg="#F5F5F5" borderRadius="8px" />;
}

// 图片展示组件
function ImageDisplay({ src, alt }: { src?: string; alt: string }) {
  if (!src || src.trim() === '') {
    return <PlaceholderImage />;
  }
  return (
    <Image src={src} alt={alt} width="80px" height="80px" objectFit="cover" borderRadius="8px" />
  );
}

// 图片字段展示组件（展示模式）
function ImageFieldDisplay({
  field,
  label,
  required,
  tenantDetail,
  sizeDisplay
}: {
  field: string;
  label: string;
  required: boolean;
  tenantDetail: Partial<ConfigData>;
  sizeDisplay: string;
}) {
  const urlField = IMAGE_FIELD_MAP[field] || `${field}Url`;
  return (
    <Flex flexDirection="column">
      <FormLabel fontSize="14px" fontWeight="500" color="#303133" mb="8px" padding={0} margin={0}>
        {label}
        {required && (
          <Text as="span" color="#F53F3F" ml="4px">
            *
          </Text>
        )}
      </FormLabel>
      <ImageDisplay src={(tenantDetail as any)[urlField] as string} alt={label} />
      <Text fontSize="12px" color="#666" mt="8px">
        {sizeDisplay}
      </Text>
    </Flex>
  );
}

// 图片字段上传组件（编辑模式）
function ImageFieldUpload({
  field,
  label,
  required,
  imageFields,
  onChange,
  sizeDisplay,
  t
}: {
  field: string;
  label: string;
  required: boolean;
  imageFields: Record<string, string>;
  onChange: (field: string, url: string) => void;
  sizeDisplay: string;
  t: (key: string) => string;
}) {
  return (
    <Flex flexDirection="column">
      <FormLabel fontSize="14px" fontWeight="500" color="#303133" mb="8px" padding={0} margin={0}>
        {label}
        {required && (
          <Text as="span" color="#F53F3F" ml="4px">
            *
          </Text>
        )}
      </FormLabel>
      <ImageUpload
        value={imageFields[field] || ''}
        onChange={(url) => onChange(field, url)}
        sizeDisplay={sizeDisplay}
        t={t}
      />
    </Flex>
  );
}

// 定制配置页面
export default function ConfigurationPageClient() {
  const { t } = useTranslation('admin');
  const ad = useAdminPageI18n(['base']);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tenantDetail, setTenantDetail] = useState<Partial<ConfigData>>({});

  // 独立管理图片字段的 state，避免 Form 重渲染导致图片闪烁
  const [imageFields, setImageFields] = useState<{
    avatar?: string;
    backgroundImg?: string;
    functionBackgroundImg?: string;
    fullNameImg?: string;
    sidebarImg?: string;
    homepageBackgroundImg?: string;
  }>({});

  // 表单字段
  const [formData, setFormData] = useState({
    fullName: '',
    domain: ''
  });

  // 表单错误
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    domain?: string;
  }>({});

  // 加载租户详情
  const fetchTenantDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTenantDetail();
      // 优先使用 URL 字段，如果没有则使用 fileKey 字段（向后兼容）
      const tenantData: Partial<ConfigData> = {
        name: data.name || '',
        fullName: data.fullName || '',
        domain: data.domain || '',
        // 优先使用 URL 字段，如果没有则使用 fileKey（向后兼容）
        avatar: data.avatarUrl || data.avatar || '',
        avatarUrl: data.avatarUrl || data.avatar || '',
        backgroundImg: data.backgroundImgUrl || data.backgroundImg || '',
        backgroundImgUrl: data.backgroundImgUrl || data.backgroundImg || '',
        functionBackgroundImg: data.functionBackgroundImgUrl || data.functionBackgroundImg || '',
        functionBackgroundImgUrl: data.functionBackgroundImgUrl || data.functionBackgroundImg || '',
        fullNameImg: data.fullNameImgUrl || data.fullNameImg || '',
        fullNameImgUrl: data.fullNameImgUrl || data.fullNameImg || '',
        sidebarImg: data.sidebarImgUrl || data.sidebarImg || '',
        sidebarImgUrl: data.sidebarImgUrl || data.sidebarImg || '',
        homepageBackgroundImg: data.homepageBackgroundImgUrl || data.homepageBackgroundImg || '',
        homepageBackgroundImgUrl: data.homepageBackgroundImgUrl || data.homepageBackgroundImg || ''
      };
      setTenantDetail(tenantData);
      // 独立管理图片字段
      setImageFields({
        avatar: tenantData.avatar || '',
        backgroundImg: tenantData.backgroundImg || '',
        functionBackgroundImg: tenantData.functionBackgroundImg || '',
        fullNameImg: tenantData.fullNameImg || '',
        sidebarImg: tenantData.sidebarImg || '',
        homepageBackgroundImg: tenantData.homepageBackgroundImg || ''
      });
      // 同步文本字段到 form
      setFormData({
        fullName: tenantData.fullName || '',
        domain: tenantData.domain || ''
      });
    } catch (error) {
      toast({
        title: t('base.configuration.messages.loadFailed'),
        status: 'error',
        duration: 2000,
        isClosable: true
      });
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 组件初始化时加载数据
  useEffect(() => {
    fetchTenantDetail();
  }, [fetchTenantDetail]);

  // 更新图片字段（独立管理，避免 Form 重渲染影响）
  const handleImageChange = (field: string, url: string) => {
    setImageFields((prev) => ({
      ...prev,
      [field]: url
    }));
    // 同时更新 tenantDetail 中的 URL 字段（用于展示模式）
    setTenantDetail((prev) => ({
      ...prev,
      [field]: url,
      [IMAGE_FIELD_MAP[field]]: url
    }));
  };

  // 表单验证
  const validateForm = () => {
    const errors: { fullName?: string; domain?: string } = {};

    if (!formData.fullName) {
      errors.fullName = t('base.configuration.validation.fullNameRequired');
    } else if (formData.fullName.length < 2 || formData.fullName.length > 50) {
      errors.fullName = t('base.configuration.validation.fullNameLength');
    }

    if (!formData.domain) {
      errors.domain = t('base.configuration.validation.domainRequired');
    } else if (formData.domain.length < 3 || formData.domain.length > 50) {
      errors.domain = t('base.configuration.validation.domainLength');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存修改
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const currentData = await getTenantDetail();
      // 记录更新前的徽标值，用于判断是否需要刷新页面
      const originalAvatar = currentData.avatarUrl || currentData.avatar || '';
      // 合并文本字段（来自 Form）和图片字段（来自独立 state）
      const updateParams = {
        id: currentData.id,
        name: formData.fullName ?? currentData.name ?? tenantDetail.name ?? '',
        industry: currentData.industry,
        domain: formData.domain,
        fullName: formData.fullName,
        // 图片字段现在存储的是 URL，直接传递给后端
        avatar: imageFields.avatar || '',
        avatarUrl: imageFields.avatar || '',
        backgroundImg: imageFields.backgroundImg || '',
        backgroundImgUrl: imageFields.backgroundImg || '',
        functionBackgroundImg: imageFields.functionBackgroundImg || '',
        functionBackgroundImgUrl: imageFields.functionBackgroundImg || '',
        fullNameImg: imageFields.fullNameImg || '',
        fullNameImgUrl: imageFields.fullNameImg || '',
        sidebarImg: imageFields.sidebarImg || '',
        sidebarImgUrl: imageFields.sidebarImg || '',
        homepageBackgroundImg: imageFields.homepageBackgroundImg || '',
        homepageBackgroundImgUrl: imageFields.homepageBackgroundImg || ''
      };
      await updateTenantDetail(updateParams);
      toast({
        title: t('base.configuration.messages.saveSuccess'),
        status: 'success',
        duration: 2000,
        isClosable: true
      });
      // 检查徽标是否更新，如果更新则刷新页面
      const newAvatar = imageFields.avatar || '';
      if (originalAvatar !== newAvatar) {
        window.location.reload();
        return;
      }
      // 重新获取最新数据，确保详情页面显示最新内容
      await fetchTenantDetail();
      setIsEditMode(false);
    } catch (error) {
      toast({
        title: t('base.configuration.messages.saveFailed'),
        status: 'error',
        duration: 2000,
        isClosable: true
      });
      console.error('保存失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 进入编辑模式（先获取最新数据，防止并发修改）
  const handleEdit = async () => {
    await fetchTenantDetail();
    setIsEditMode(true);
  };

  // 撤销修改
  const handleCancel = () => {
    fetchTenantDetail();
    setIsEditMode(false);
    setFormErrors({});
  };
  if (!ad) return null;
  return (
    <Box p={6}>
      <Box bg="white" borderRadius="8px" p={6}>
        {/* 展示详情视图 */}
        {!isEditMode ? (
          <Flex width="672px" margin="0 auto" flexDirection="column" gap="24px">
            {/* 平台名称 */}
            <FormControl>
              <FormLabel fontSize="14px" color="#303133" fontWeight="500" mb="8px">
                {t('base.configuration.fields.platformName')}
                <Text as="span" color="#F53F3F" ml="4px">
                  *
                </Text>
              </FormLabel>
              <Input
                value={tenantDetail.fullName || ''}
                isReadOnly
                size="lg"
                bg="#F5F7FA"
                borderRadius="8px"
                h="40px"
                fontSize="14px"
              />
            </FormControl>

            {/* 域名 */}
            <FormControl>
              <FormLabel fontSize="14px" color="#303133" fontWeight="500" mb="8px">
                {t('base.configuration.fields.domain')}
                <Text as="span" color="#F53F3F" ml="4px">
                  *
                </Text>
              </FormLabel>
              <Flex width="100%" alignItems="center" gap="12px">
                <Input
                  value={tenantDetail.domain || ''}
                  isReadOnly
                  size="lg"
                  bg="#F5F7FA"
                  borderRadius="8px"
                  h="40px"
                  fontSize="14px"
                  flex="1"
                />
                <Text fontSize="14px" color="#1D2129" flexShrink={0}>
                  {t('base.configuration.fields.domainSuffix')}
                </Text>
              </Flex>
              <Text fontSize="12px" color="#909399" mt="4px">
                {t('base.configuration.fields.domainHint')}
              </Text>
            </FormControl>

            {/* 图片区域 - 徽标和全称图片 */}
            <Flex gap="40px" flexWrap="nowrap">
              <ImageFieldDisplay
                field="avatar"
                label={t('base.configuration.imageFields.avatar')}
                required={true}
                tenantDetail={tenantDetail}
                sizeDisplay={IMAGE_SIZES.avatar.display}
              />
              <ImageFieldDisplay
                field="fullNameImg"
                label={t('base.configuration.imageFields.fullNameImg')}
                required={false}
                tenantDetail={tenantDetail}
                sizeDisplay={IMAGE_SIZES.fullNameImg.display}
              />
            </Flex>

            {/* 图片区域 - 登录封面、登录背景、功能页背景 */}
            <Flex gap="40px" flexWrap="nowrap">
              <ImageFieldDisplay
                field="sidebarImg"
                label={t('base.configuration.imageFields.sidebarImg')}
                required={false}
                tenantDetail={tenantDetail}
                sizeDisplay={IMAGE_SIZES.sidebarImg.display}
              />
              <ImageFieldDisplay
                field="backgroundImg"
                label={t('base.configuration.imageFields.backgroundImg')}
                required={false}
                tenantDetail={tenantDetail}
                sizeDisplay={IMAGE_SIZES.backgroundImg.display}
              />
              <ImageFieldDisplay
                field="functionBackgroundImg"
                label={t('base.configuration.imageFields.functionBackgroundImg')}
                required={false}
                tenantDetail={tenantDetail}
                sizeDisplay={IMAGE_SIZES.functionBackgroundImg.display}
              />
            </Flex>

            {/* 图片区域 - 首页背景 */}
            <Flex gap="40px" flexWrap="nowrap">
              <ImageFieldDisplay
                field="homepageBackgroundImg"
                label={t('base.configuration.imageFields.homepageBackgroundImg')}
                required={false}
                tenantDetail={tenantDetail}
                sizeDisplay={IMAGE_SIZES.homepageBackgroundImg.display}
              />
            </Flex>

            {/* 编辑按钮 */}
            <Flex justifyContent="flex-end" gap="16px" mt="40px">
              <Button
                bg="#333"
                color="white"
                borderRadius="8px"
                height="36px"
                minWidth="120px"
                fontSize="14px"
                fontWeight="400"
                _hover={{ bg: '#1a1a1a' }}
                onClick={handleEdit}
                isLoading={loading}
              >
                {t('base.configuration.actions.edit')}
              </Button>
            </Flex>
          </Flex>
        ) : (
          // 编辑模式
          <Flex width="672px" margin="0 auto" flexDirection="column" gap="24px">
            {/* 平台名称 */}
            <FormControl isInvalid={!!formErrors.fullName}>
              <FormLabel fontSize="14px" color="#303133" fontWeight="500" mb="8px">
                {t('base.configuration.fields.platformName')}
                <Text as="span" color="#F53F3F" ml="4px">
                  *
                </Text>
              </FormLabel>
              <Input
                placeholder={t('base.configuration.placeholder.platformName')}
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (formErrors.fullName) {
                    setFormErrors({ ...formErrors, fullName: undefined });
                  }
                }}
                size="lg"
                bg="#FAF9FF"
                borderRadius="8px"
                h="40px"
                fontSize="14px"
                maxLength={50}
              />
              {formErrors.fullName && (
                <Text color="#F53F3F" fontSize="12px" mt="4px">
                  {formErrors.fullName}
                </Text>
              )}
            </FormControl>

            {/* 域名 */}
            <FormControl isInvalid={!!formErrors.domain}>
              <FormLabel fontSize="14px" color="#303133" fontWeight="500" mb="8px">
                {t('base.configuration.fields.domain')}
                <Text as="span" color="#F53F3F" ml="4px">
                  *
                </Text>
              </FormLabel>
              <Flex width="100%" alignItems="center" gap="12px">
                <Input
                  placeholder={t('base.configuration.placeholder.domain')}
                  value={formData.domain}
                  onChange={(e) => {
                    setFormData({ ...formData, domain: e.target.value });
                    if (formErrors.domain) {
                      setFormErrors({ ...formErrors, domain: undefined });
                    }
                  }}
                  size="lg"
                  bg="#FAF9FF"
                  borderRadius="8px"
                  h="40px"
                  fontSize="14px"
                  maxLength={50}
                  flex="1"
                />
                <Text fontSize="14px" color="#1D2129" flexShrink={0}>
                  {t('base.configuration.fields.domainSuffix')}
                </Text>
              </Flex>
              {formErrors.domain && (
                <Text color="#F53F3F" fontSize="12px" mt="4px">
                  {formErrors.domain}
                </Text>
              )}
              <Text fontSize="12px" color="#909399" mt="4px">
                {t('base.configuration.fields.domainHint')}
              </Text>
            </FormControl>

            {/* 图片区域（编辑模式）- 徽标和全称图片 */}
            <Flex gap="40px" flexWrap="nowrap">
              <ImageFieldUpload
                field="avatar"
                label={t('base.configuration.imageFields.avatar')}
                required={true}
                imageFields={imageFields}
                onChange={handleImageChange}
                sizeDisplay={IMAGE_SIZES.avatar.display}
                t={t}
              />
              <ImageFieldUpload
                field="fullNameImg"
                label={t('base.configuration.imageFields.fullNameImg')}
                required={false}
                imageFields={imageFields}
                onChange={handleImageChange}
                sizeDisplay={IMAGE_SIZES.fullNameImg.display}
                t={t}
              />
            </Flex>

            {/* 图片区域（编辑模式）- 登录封面、登录背景、功能页背景 */}
            <Flex gap="40px" flexWrap="nowrap">
              <ImageFieldUpload
                field="sidebarImg"
                label={t('base.configuration.imageFields.sidebarImg')}
                required={false}
                imageFields={imageFields}
                onChange={handleImageChange}
                sizeDisplay={IMAGE_SIZES.sidebarImg.display}
                t={t}
              />
              <ImageFieldUpload
                field="backgroundImg"
                label={t('base.configuration.imageFields.backgroundImg')}
                required={false}
                imageFields={imageFields}
                onChange={handleImageChange}
                sizeDisplay={IMAGE_SIZES.backgroundImg.display}
                t={t}
              />
              <ImageFieldUpload
                field="functionBackgroundImg"
                label={t('base.configuration.imageFields.functionBackgroundImg')}
                required={false}
                imageFields={imageFields}
                onChange={handleImageChange}
                sizeDisplay={IMAGE_SIZES.functionBackgroundImg.display}
                t={t}
              />
            </Flex>

            {/* 图片区域（编辑模式）- 首页背景 */}
            <Flex gap="40px" flexWrap="nowrap">
              <ImageFieldUpload
                field="homepageBackgroundImg"
                label={t('base.configuration.imageFields.homepageBackgroundImg')}
                required={false}
                imageFields={imageFields}
                onChange={handleImageChange}
                sizeDisplay={IMAGE_SIZES.homepageBackgroundImg.display}
                t={t}
              />
            </Flex>

            {/* 保存/取消按钮 */}
            <Flex justifyContent="flex-end" gap="16px" mt="40px">
              <Button
                onClick={handleCancel}
                bg="white"
                color="#333"
                border="1px solid #D9D9D9"
                borderRadius="8px"
                height="36px"
                minWidth="100px"
                fontSize="14px"
                fontWeight="400"
                _hover={{ bg: '#F5F5F5' }}
              >
                {t('base.configuration.actions.cancel')}
              </Button>
              <Button
                bg="#333"
                color="white"
                borderRadius="8px"
                height="36px"
                minWidth="120px"
                fontSize="14px"
                fontWeight="400"
                _hover={{ bg: '#1a1a1a' }}
                onClick={handleSave}
                isLoading={loading}
              >
                {t('base.configuration.actions.save')}
              </Button>
            </Flex>
          </Flex>
        )}
      </Box>
    </Box>
  );
}
