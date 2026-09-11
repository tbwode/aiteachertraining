import { Badge, Box, Flex, HStack, Icon, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Clock3,
  Eye,
  FileText,
  Headphones,
  Image as ImageIcon,
  MousePointerClick,
  Paperclip,
  Presentation,
  Star,
  Video
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import FilePreviewModal from '@/components/FilePreview/FilePreviewModal';
import type {
  AiAvatarChapterVO,
  AiAvatarDetailVO,
  AiAvatarMaterialVO
} from '@/teacher/types/aiTeacher';

type TabCatalogProps = {
  avatarDetail: AiAvatarDetailVO | null;
};

type FileTypeInfo = {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
};

function getFileTypeInfo(material: AiAvatarMaterialVO): FileTypeInfo {
  const source = [material.fileType, material.fileFormat, material.fileName]
    .join(' ')
    .toLowerCase();

  if (/ppt|presentation|powerpoint/.test(source)) {
    return { icon: Presentation, color: '#B54708', bg: '#FFFAEB', label: 'PPT 课件' };
  }
  if (/video|mp4|webm|mov/.test(source)) {
    return { icon: Video, color: '#175CD3', bg: '#EFF8FF', label: '视频课件' };
  }
  if (/openmaic|interactive|互动/.test(source)) {
    return { icon: MousePointerClick, color: '#7A5AF8', bg: '#F4F3FF', label: '互动课件' };
  }
  if (/digital|数字教材/.test(source)) {
    return { icon: BookOpen, color: '#067647', bg: '#ECFDF3', label: '数字教材' };
  }
  if (/audio|mp3|wav|aac/.test(source)) {
    return { icon: Headphones, color: '#C11574', bg: '#FDF2FA', label: '音频课件' };
  }
  if (/image|png|jpg|jpeg|webp/.test(source)) {
    return { icon: ImageIcon, color: '#027A48', bg: '#ECFDF3', label: '图片素材' };
  }
  if (/document|pdf|doc|word/.test(source)) {
    return { icon: FileText, color: '#344054', bg: '#F2F4F7', label: '文档资料' };
  }

  return { icon: Paperclip, color: '#475467', bg: '#F2F4F7', label: '其他资源' };
}

function collectMaterials(chapters: AiAvatarChapterVO[]): AiAvatarMaterialVO[] {
  return chapters.flatMap((chapter) => [
    ...(chapter.materialList || []),
    ...collectMaterials(chapter.children || [])
  ]);
}

function formatFileMeta(material: AiAvatarMaterialVO) {
  const parts: string[] = [];
  if (material.fileFormat) parts.push(material.fileFormat.toUpperCase());
  if (material.duration) {
    const minutes = Math.floor(material.duration / 60);
    const seconds = material.duration % 60;
    parts.push(minutes + ':' + seconds.toString().padStart(2, '0'));
  }
  if (material.fileSize) {
    parts.push(
      material.fileSize >= 1024 * 1024
        ? (material.fileSize / 1024 / 1024).toFixed(1) + ' MB'
        : Math.ceil(material.fileSize / 1024) + ' KB'
    );
  }
  return parts.join(' · ');
}

function MaterialRow({
  material,
  onPreview
}: {
  material: AiAvatarMaterialVO;
  onPreview: (material: AiAvatarMaterialVO) => void;
}) {
  const info = getFileTypeInfo(material);
  const FileIcon = info.icon;
  const fileMeta = formatFileMeta(material);

  return (
    <Flex
      align="center"
      justify="space-between"
      p={{ base: 3, md: 3.5 }}
      gap={3}
      bg="#F9FAFB"
      border="1px solid #EAECF0"
      borderRadius="13px"
      _hover={{
        bg: '#FFFFFF',
        borderColor: '#D0D5DD',
        boxShadow: '0 4px 14px rgba(16,24,40,.06)'
      }}
      transition="all 0.18s ease"
    >
      <HStack spacing={3} flex="1" minW={0} align="center">
        <Flex
          align="center"
          justify="center"
          w="40px"
          h="40px"
          flexShrink={0}
          borderRadius="11px"
          bg={info.bg}
          color={info.color}
        >
          <Icon as={FileIcon} boxSize="18px" aria-hidden="true" />
        </Flex>
        <Box minW={0}>
          <Text fontSize="13px" fontWeight={650} color="#344054" noOfLines={1}>
            {material.fileName}
          </Text>
          <Flex align="center" gap={2} mt={1} flexWrap="wrap">
            <Badge
              px={2}
              py={0.5}
              borderRadius="full"
              bg={info.bg}
              color={info.color}
              fontSize="10px"
              fontWeight={600}
            >
              {info.label}
            </Badge>
            {fileMeta ? (
              <HStack spacing={1} color="#98A2B3">
                {material.duration ? <Clock3 size={11} aria-hidden="true" /> : null}
                <Text fontSize="10px">{fileMeta}</Text>
              </HStack>
            ) : null}
          </Flex>
        </Box>
      </HStack>
      <Button
        variant="secondary"
        minH="36px"
        h="36px"
        px={3.5}
        leftIcon={<Eye size={14} aria-hidden="true" />}
        onClick={() => onPreview(material)}
      >
        预览
      </Button>
    </Flex>
  );
}

function ChapterMaterials({
  chapter,
  onPreview,
  depth = 0
}: {
  chapter: AiAvatarChapterVO;
  onPreview: (material: AiAvatarMaterialVO) => void;
  depth?: number;
}) {
  const chapterHasLearned =
    chapter.hasLearned === 1 || (chapter.children || []).some((child) => child.hasLearned === 1);
  const resourceCount =
    (chapter.materialList?.length || 0) + collectMaterials(chapter.children || []).length;

  return (
    <Box
      border={depth === 0 ? '1px solid #EAECF0' : undefined}
      borderRadius={depth === 0 ? '16px' : undefined}
      p={depth === 0 ? { base: 3.5, md: 4 } : 0}
      bg={depth === 0 ? '#FFFFFF' : undefined}
      _hover={depth === 0 ? { borderColor: '#D0D5DD' } : undefined}
      transition="border-color 0.18s ease"
    >
      <HStack spacing={2} mb={chapter.materialList?.length || chapter.children?.length ? 3 : 0}>
        <Text
          fontSize={depth === 0 ? '15px' : '13px'}
          fontWeight={depth === 0 ? 700 : 650}
          color={depth === 0 ? '#1D2939' : '#475467'}
        >
          {chapter.title}
        </Text>
        {chapterHasLearned ? (
          <Flex title="已有学生学习" color="#F79009" align="center">
            <Star size={13} fill="currentColor" aria-label="已有学生学习" />
          </Flex>
        ) : null}
        <Badge ml="auto" bg="#F2F4F7" color="#667085" borderRadius="full" px={2}>
          {resourceCount} 份资源
        </Badge>
      </HStack>

      {chapter.materialList?.length ? (
        <VStack align="stretch" spacing={2} mb={chapter.children?.length ? 4 : 0}>
          {chapter.materialList.map((material) => (
            <MaterialRow key={material.id} material={material} onPreview={onPreview} />
          ))}
        </VStack>
      ) : null}

      {chapter.children?.length ? (
        <VStack
          align="stretch"
          spacing={4}
          pl={{ base: 0, md: depth === 0 ? 4 : 0 }}
          borderLeft={{ base: 'none', md: depth === 0 ? '2px solid #F2F4F7' : 'none' }}
        >
          {chapter.children.map((child) => (
            <ChapterMaterials
              key={child.id}
              chapter={child}
              onPreview={onPreview}
              depth={depth + 1}
            />
          ))}
        </VStack>
      ) : null}
    </Box>
  );
}

export function TabCatalog({ avatarDetail }: TabCatalogProps) {
  const { t } = useTranslation('teacher');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    type: string;
    name: string;
    fileType?: string;
  } | null>(null);

  const allMaterials = useMemo(
    () => collectMaterials(avatarDetail?.chapterList || []),
    [avatarDetail?.chapterList]
  );
  const typeStats = useMemo(() => {
    const map = new Map<string, { info: FileTypeInfo; count: number }>();
    allMaterials.forEach((material) => {
      const info = getFileTypeInfo(material);
      const current = map.get(info.label);
      map.set(info.label, { info, count: (current?.count || 0) + 1 });
    });
    return Array.from(map.values());
  }, [allMaterials]);

  const handlePreview = (material: AiAvatarMaterialVO) => {
    setPreviewFile({
      url: material.fileUrl,
      type: material.fileFormat,
      name: material.fileName,
      fileType: material.fileType
    });
    onOpen();
  };

  if (!avatarDetail?.chapterList?.length) {
    return (
      <Box bg="white" borderRadius="20px" border="1px solid #E5E6EB" p={{ base: 5, md: 6 }}>
        <Text fontSize="lg" fontWeight={600} color="gray.800" mb={4}>
          {t('aiTeacher.avatar.detail.catalog.title')}
        </Text>
        <Text color="gray.400" fontSize="sm" textAlign="center" py={8}>
          {t('aiTeacher.avatar.common.fallback.none')}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      as="section"
      aria-labelledby="course-catalog-title"
      bg="white"
      borderRadius="20px"
      border="1px solid #E5E6EB"
      boxShadow="0 8px 28px rgba(31,35,41,0.07)"
      p={{ base: 4, md: 6 }}
    >
      <Flex align="flex-start" justify="space-between" gap={4} flexWrap="wrap" mb={5}>
        <Box>
          <Text id="course-catalog-title" as="h2" fontSize="lg" fontWeight={700} color="#1D2129">
            {t('aiTeacher.avatar.detail.catalog.title')}
          </Text>
          <Text fontSize="sm" color="#86909C" mt={1}>
            按章节查看课程内容，已内置 {typeStats.length} 种课件类型的 Mock 数据
          </Text>
        </Box>
        <Box textAlign={{ base: 'left', sm: 'right' }}>
          <Text fontSize="12px" fontWeight={650} color="#344054">
            {avatarDetail.chapterList.length} 个模块 · {allMaterials.length} 份资源
          </Text>
          <Text fontSize="11px" color="#98A2B3" mt={1}>
            类型与资源数据均为原型演示数据
          </Text>
        </Box>
      </Flex>

      <Flex gap={2} flexWrap="wrap" mb={5} aria-label="课件类型汇总">
        {typeStats.map(({ info, count }) => {
          const TypeIcon = info.icon;
          return (
            <HStack
              key={info.label}
              spacing={1.5}
              px={2.5}
              py={1.5}
              bg={info.bg}
              color={info.color}
              borderRadius="9px"
            >
              <Icon as={TypeIcon} boxSize="13px" aria-hidden="true" />
              <Text fontSize="11px" fontWeight={650}>
                {info.label} {count}
              </Text>
            </HStack>
          );
        })}
      </Flex>

      <VStack spacing={3} align="stretch">
        {avatarDetail.chapterList.map((chapter) => (
          <ChapterMaterials key={chapter.id} chapter={chapter} onPreview={handlePreview} />
        ))}
      </VStack>

      {previewFile ? (
        <FilePreviewModal
          isOpen={isOpen}
          onClose={onClose}
          fileUrl={previewFile.url}
          fileType={previewFile.type}
          fileName={previewFile.name}
          bizType={previewFile.fileType}
        />
      ) : null}
    </Box>
  );
}
