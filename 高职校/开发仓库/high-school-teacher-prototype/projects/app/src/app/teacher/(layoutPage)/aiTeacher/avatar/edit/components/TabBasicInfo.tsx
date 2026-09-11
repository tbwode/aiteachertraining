import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Image,
  Input,
  Text,
  Textarea,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import type { AvatarEditFormData } from '../constants';
import type { AiAvatarDetailVO } from '@/teacher/types/aiTeacher';
import { PRIMARY_COLOR } from '../constants';
import { uploadFilePublic } from '@/teacher/api/file';
import { AiCoverModal } from '../../create/components/AiCoverModal';

type TabBasicInfoProps = {
  formData: AvatarEditFormData;
  setFormData: (data: AvatarEditFormData) => void;
  storedCourse: any;
  avatarDetail: AiAvatarDetailVO | null;
  onClassToggle: (className: string) => void;
  onCoverUrlChange: (coverUrl: string) => void;
};

export function TabBasicInfo({
  formData,
  setFormData,
  storedCourse,
  avatarDetail,
  onClassToggle,
  onCoverUrlChange
}: TabBasicInfoProps) {
  const { t } = useTranslation('teacher');
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiCoverModalOpen, setIsAiCoverModalOpen] = useState(false);

  // 获取可选择的班级列表（isAvailable: true 或 isSelected: true 的班级）
  const availableClasses =
    avatarDetail?.classList?.filter((c) => c.isAvailable === true || c.isSelected === true) || [];

  // 获取覆盖的班级或专业列表（用于显示）
  const coverageList =
    availableClasses.length > 0
      ? availableClasses.map((c) => c.className)
      : avatarDetail?.majorList?.map((m) => m.majorName) || [];

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('aiTeacher.avatar.edit.base.invalidImageType'),
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('aiTeacher.avatar.edit.base.imageTooLarge'),
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 上传图片
      const result = await uploadFilePublic(formData);

      // 更新封面 URL
      onCoverUrlChange(result.fileUrl || '');

      toast({
        title: t('aiTeacher.avatar.edit.base.imageUploadSuccess'),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      console.error('上传图片失败:', error);
      toast({
        title: t('aiTeacher.avatar.edit.base.imageUploadFailed'),
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsUploading(false);
      // 清空 input，允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 点击更换图片按钮
  const handleChangeImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box
      as="section"
      aria-labelledby="avatar-basic-info-title"
      bg="white"
      border="1px solid #E5E6EB"
      borderRadius={{ base: '18px', md: '20px' }}
      p={{ base: 5, md: 8 }}
      boxShadow="0 8px 28px rgba(31,35,41,0.07)"
    >
      <Flex align="center" mb={6} gap={3}>
        <Box w="4px" h="20px" bg={PRIMARY_COLOR} borderRadius="full" aria-hidden="true" />
        <Text id="avatar-basic-info-title" as="h2" fontSize="18px" fontWeight={700} color="#1D2129">
          {t('aiTeacher.avatar.edit.base.title')}
        </Text>
      </Flex>

      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel fontSize="sm" fontWeight={600} color="gray.700">
            {t('aiTeacher.avatar.edit.base.courseName')}
          </FormLabel>
          <Input
            value={formData.name}
            isReadOnly
            h="44px"
            bg="#F7F8FA"
            borderColor="#E5E6EB"
            color="#646A73"
            cursor="not-allowed"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight={600} color="gray.700">
            {t('aiTeacher.avatar.edit.base.courseImage')}
          </FormLabel>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'center' }}
            gap={4}
          >
            {avatarDetail?.coverUrl ? (
              <Image
                src={avatarDetail.coverUrl}
                alt={t('aiTeacher.avatar.create.step1.courseImage.alt')}
                w={{ base: '100%', md: '288px' }}
                maxW={{ base: '420px', md: '288px' }}
                h={{ base: '190px', md: '180px' }}
                objectFit="cover"
                borderRadius="14px"
              />
            ) : (
              <Box
                w={{ base: '100%', md: '288px' }}
                maxW={{ base: '420px', md: '288px' }}
                h={{ base: '190px', md: '180px' }}
                bg={storedCourse?.heroBg ?? 'linear-gradient(135deg, #FEE2E2 0%, #FED7AA 100%)'}
                borderRadius="14px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="4xl" fontWeight={800} color="rgba(200,62,62,0.2)">
                  {storedCourse?.heroText ?? '机'}
                </Text>
              </Box>
            )}
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              display="none"
              onChange={handleImageUpload}
            />
            <Flex direction={{ base: 'row', md: 'column' }} gap={3} align="stretch" flexWrap="wrap">
              <Button
                bg="white"
                color="#333333"
                border="1px solid"
                borderColor="#333333"
                borderRadius="12px"
                px={4}
                py={2}
                fontSize="14px"
                fontWeight={500}
                _hover={{ bg: 'gray.50' }}
                onClick={handleChangeImageClick}
                isLoading={isUploading}
                minH="44px"
              >
                {t('aiTeacher.avatar.edit.base.changeImage')}
              </Button>
              <Button
                bg="linear-gradient(96.58deg, #E80032 26.87%, #FB3B00 46.83%, #C8000B 92.78%)"
                color="white"
                borderRadius="12px"
                px={4}
                py={2}
                fontSize="14px"
                fontWeight={500}
                _hover={{ opacity: 0.9 }}
                onClick={() => setIsAiCoverModalOpen(true)}
                minH="44px"
              >
                AI生成封面
              </Button>
            </Flex>
          </Flex>
        </FormControl>

        {coverageList.length > 0 && (
          <FormControl isRequired>
            <FormLabel fontSize="sm" fontWeight={600} color="gray.700">
              {t('aiTeacher.avatar.common.coverage.classAndMajor')}
            </FormLabel>
            <Box p={4} bg="#F7F8FA" border="1px solid #ECEEF2" borderRadius="14px">
              <Text fontSize="xs" color="gray.500" mb={2}>
                {t('aiTeacher.avatar.edit.base.requiredClassHint')}
              </Text>
              <Flex flexWrap="wrap" gap={3}>
                {coverageList.map((name: string) => (
                  <Box
                    key={name}
                    as="label"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    bg="white"
                    px={3}
                    minH="44px"
                    py={2}
                    borderRadius="12px"
                    border="1px solid"
                    borderColor={
                      formData.coverageClasses.includes(name) ? PRIMARY_COLOR : 'gray.200'
                    }
                    cursor="pointer"
                    _hover={{ borderColor: PRIMARY_COLOR }}
                    _focusWithin={{ boxShadow: '0 0 0 3px rgba(200,0,11,.12)' }}
                  >
                    <Checkbox
                      isChecked={formData.coverageClasses.includes(name)}
                      onChange={() => onClassToggle(name)}
                      colorScheme="red"
                    />
                    <Text fontSize="sm" color="gray.700">
                      {name}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Box>
          </FormControl>
        )}

        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight={600} color="gray.700">
            {t('aiTeacher.avatar.common.time.range')}
          </FormLabel>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'stretch', sm: 'center' }}
            gap={4}
          >
            <Box flex="1">
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('aiTeacher.avatar.common.time.start')}
              </Text>
              <Input
                type="date"
                h="44px"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                _focusVisible={{ borderColor: PRIMARY_COLOR, boxShadow: '0 0 0 1px #C83E3E' }}
              />
            </Box>
            <Text
              color="gray.400"
              pt={{ base: 0, sm: 5 }}
              alignSelf={{ base: 'center', sm: 'auto' }}
            >
              {t('aiTeacher.avatar.common.time.to')}
            </Text>
            <Box flex="1">
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('aiTeacher.avatar.common.time.end')}
              </Text>
              <Input
                type="date"
                h="44px"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                _focusVisible={{ borderColor: PRIMARY_COLOR, boxShadow: '0 0 0 1px #C83E3E' }}
              />
            </Box>
          </Flex>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" fontWeight={600} color="gray.700">
            {t('aiTeacher.avatar.edit.base.courseDescription')}
          </FormLabel>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            bg="white"
            borderColor="gray.300"
            minH="120px"
            resize="vertical"
            _hover={{ borderColor: 'gray.400' }}
            _focus={{ borderColor: PRIMARY_COLOR, boxShadow: `0 0 0 1px ${PRIMARY_COLOR}` }}
          />
        </FormControl>
      </VStack>

      <AiCoverModal
        isOpen={isAiCoverModalOpen}
        onClose={() => setIsAiCoverModalOpen(false)}
        defaultCourseName={formData.name}
        onSelectCover={(coverUrl) => onCoverUrlChange(coverUrl)}
      />
    </Box>
  );
}
