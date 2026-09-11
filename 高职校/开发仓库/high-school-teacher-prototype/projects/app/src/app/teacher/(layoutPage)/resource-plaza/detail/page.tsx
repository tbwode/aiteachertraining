'use client';

import { useCallback, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  HStack,
  Link,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Download,
  Eye,
  GitBranch,
  Link2,
  School,
  Tag,
  UserRound
} from 'lucide-react';
import {
  downloadPlazaResource,
  getRelatedResources,
  getResourcePlazaDetail,
  previewPlazaResource,
  toggleResourceFavorite,
  type PlazaResourceVO
} from '@/api/teacher/resource/resource-plaza';
import PlazaScaffold from '../components/PlazaScaffold';
import ReferenceResourceModal from '../components/ReferenceResourceModal';
import ResourceCard from '../components/ResourceCard';
import ResourcePreviewPanel from '../components/ResourcePreviewPanel';
import { formatFileSize, getCategoryStyle, sourceLabelMap } from '../components/resourceVisuals';

export default function ResourceDetailPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const referenceModal = useDisclosure();
  const resourceId = Number(searchParams?.get('id') ?? 0);
  const [resource, setResource] = useState<PlazaResourceVO | null>(null);
  const [related, setRelated] = useState<PlazaResourceVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!resourceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [detail, relatedResources] = await Promise.all([
        getResourcePlazaDetail(resourceId),
        getRelatedResources(resourceId)
      ]);
      if (detail) {
        const preview = await previewPlazaResource(resourceId);
        setResource(preview.resource ?? detail);
      } else {
        setResource(null);
      }
      setRelated(relatedResources);
    } catch {
      toast({ title: '资源详情加载失败', status: 'error', position: 'top' });
    } finally {
      setLoading(false);
    }
  }, [resourceId, toast]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleFavorite = async (target: PlazaResourceVO) => {
    const response = await toggleResourceFavorite(target.id);
    const update = (item: PlazaResourceVO) =>
      item.id === target.id
        ? {
            ...item,
            isFavorite: response.isFavorite,
            favoriteCount: Math.max(0, item.favoriteCount + (response.isFavorite ? 1 : -1))
          }
        : item;
    setResource((current) => (current ? update(current) : current));
    setRelated((current) => current.map(update));
    toast({
      title: response.isFavorite ? '已收藏' : '已取消收藏',
      status: 'success',
      duration: 1200,
      position: 'top'
    });
  };

  const handleDownload = async () => {
    if (!resource) return;
    setDownloading(true);
    try {
      const result = await downloadPlazaResource(resource.id);
      if (!result.success) throw new Error(result.reason);
      setResource((current) =>
        current ? { ...current, downloadCount: current.downloadCount + 1 } : current
      );
      toast({
        title: '已加入下载任务',
        description: `${result.fileName ?? resource.fileName}（Mock 原型）`,
        status: 'success',
        duration: 1800,
        position: 'top'
      });
    } catch (error) {
      toast({
        title: '无法下载',
        description: error instanceof Error ? error.message : '请稍后重试',
        status: 'error',
        position: 'top'
      });
    } finally {
      setDownloading(false);
    }
  };

  const headerActions = (
    <Link
      as={NextLink}
      href="/teacher/resource-plaza/all"
      display="inline-flex"
      alignItems="center"
      gap={2}
      minH="40px"
      px={3}
      color="#475467"
      fontSize="13px"
      fontWeight={600}
      borderRadius="10px"
      _hover={{ bg: '#F2F4F7', textDecoration: 'none' }}
    >
      <ArrowLeft size={16} aria-hidden="true" />
      返回资源列表
    </Link>
  );

  if (loading) {
    return (
      <PlazaScaffold title="资源详情" description="正在加载资源内容" actions={headerActions}>
        <Grid templateColumns={{ base: '1fr', lg: 'minmax(0,1fr) 340px' }} gap={5}>
          <Skeleton h="620px" borderRadius="18px" />
          <Skeleton h="520px" borderRadius="18px" />
        </Grid>
      </PlazaScaffold>
    );
  }

  if (!resource) {
    return (
      <PlazaScaffold
        title="资源不存在"
        description="该资源可能已删除或您暂无访问权限"
        actions={headerActions}
      >
        <Flex
          minH="360px"
          bg="white"
          border="1px dashed"
          borderColor="#D0D5DD"
          borderRadius="18px"
          align="center"
          justify="center"
          direction="column"
        >
          <Text color="#182230" fontWeight={700}>
            未找到资源
          </Text>
          <Button
            as={NextLink}
            href="/teacher/resource-plaza"
            mt={4}
            bg="#B4232D"
            color="white"
            borderRadius="10px"
          >
            返回资源广场
          </Button>
        </Flex>
      </PlazaScaffold>
    );
  }

  const style = getCategoryStyle(resource.categoryId);
  const isOffline = resource.publishStatus === 'offline';

  return (
    <PlazaScaffold
      title="资源详情"
      description="在线预览资源，并将其应用到课程或 AI 教师分身"
      actions={headerActions}
    >
      {isOffline && (
        <Alert
          mb={5}
          status="warning"
          borderRadius="12px"
          bg="#FFFAEB"
          border="1px solid"
          borderColor="#FEDF89"
        >
          <AlertIcon color="#DC6803" />
          <AlertDescription color="#7A2E0E" fontSize="13px">
            该资源已下架，无法继续预览、下载或新增引用。已有引用可在“我的引用”中查看并替换。
          </AlertDescription>
        </Alert>
      )}

      <Grid templateColumns={{ base: '1fr', lg: 'minmax(0,1fr) 350px' }} gap={5} alignItems="start">
        <Box
          bg="white"
          p={{ base: 4, md: 5 }}
          border="1px solid"
          borderColor="#E4E7EC"
          borderRadius="18px"
        >
          <Flex
            mb={4}
            align={{ base: 'flex-start', sm: 'center' }}
            justify="space-between"
            direction={{ base: 'column', sm: 'row' }}
            gap={2}
          >
            <Box>
              <Text color="#182230" fontSize="15px" fontWeight={700}>
                在线预览
              </Text>
              <Text mt={0.5} color="#98A2B3" fontSize="11px">
                此处为原型预览，正式环境将加载真实文件
              </Text>
            </Box>
            <Badge
              px={2.5}
              py={1}
              borderRadius="999px"
              bg={style.bg}
              color={style.color}
              fontSize="10px"
              textTransform="uppercase"
            >
              {resource.fileFormat} · v{resource.version}
            </Badge>
          </Flex>
          {isOffline ? (
            <Flex
              minH="420px"
              bg="#F9FAFB"
              border="1px dashed"
              borderColor="#D0D5DD"
              borderRadius="16px"
              align="center"
              justify="center"
              direction="column"
              textAlign="center"
              px={6}
            >
              <Text color="#182230" fontSize="16px" fontWeight={700}>
                资源预览已停止
              </Text>
              <Text mt={1} color="#667085" fontSize="13px">
                请联系管理员或选择其他同类资源
              </Text>
            </Flex>
          ) : (
            <ResourcePreviewPanel resource={resource} />
          )}
        </Box>

        <Box
          position={{ lg: 'sticky' }}
          top={{ lg: '84px' }}
          bg="white"
          p={5}
          border="1px solid"
          borderColor="#E4E7EC"
          borderRadius="18px"
        >
          <HStack spacing={2} mb={3}>
            <Badge
              px={2.5}
              py={1}
              borderRadius="999px"
              bg={style.bg}
              color={style.color}
              fontSize="11px"
              textTransform="none"
            >
              {resource.categoryName}
            </Badge>
            <Text color="#98A2B3" fontSize="11px">
              {sourceLabelMap[resource.sourceType]}
            </Text>
          </HStack>
          <Text as="h2" color="#182230" fontSize="21px" fontWeight={800} lineHeight="1.45">
            {resource.title}
          </Text>
          <Text mt={3} color="#667085" fontSize="13px" lineHeight="1.8">
            {resource.description}
          </Text>

          <HStack mt={4} spacing={2} flexWrap="wrap">
            {resource.tags.map((tag) => (
              <Text
                key={tag}
                px={2.5}
                py={1}
                bg="#F2F4F7"
                color="#475467"
                borderRadius="999px"
                fontSize="11px"
              >
                #{tag}
              </Text>
            ))}
          </HStack>

          <Grid mt={5} templateColumns="repeat(4,1fr)" gap={2}>
            {[
              { icon: Eye, value: resource.previewCount, label: '预览' },
              { icon: Bookmark, value: resource.favoriteCount, label: '收藏' },
              { icon: Download, value: resource.downloadCount, label: '下载' },
              { icon: Link2, value: resource.referenceCount, label: '引用' }
            ].map((stat) => (
              <Box key={stat.label} py={2.5} bg="#F9FAFB" borderRadius="10px" textAlign="center">
                <Flex justify="center" color="#667085">
                  <stat.icon size={15} aria-hidden="true" />
                </Flex>
                <Text mt={1} color="#182230" fontSize="13px" fontWeight={700}>
                  {stat.value}
                </Text>
                <Text color="#98A2B3" fontSize="10px">
                  {stat.label}
                </Text>
              </Box>
            ))}
          </Grid>

          <Divider my={5} />
          <Stack spacing={3.5} color="#475467" fontSize="12px">
            <HStack align="flex-start">
              <School size={16} color="#98A2B3" />
              <Text>
                <Text as="span" color="#98A2B3">
                  适用课程：
                </Text>
                {resource.courseName}
              </Text>
            </HStack>
            <HStack>
              <UserRound size={16} color="#98A2B3" />
              <Text>
                <Text as="span" color="#98A2B3">
                  上传人：
                </Text>
                {resource.uploaderName}
              </Text>
            </HStack>
            <HStack>
              <Tag size={16} color="#98A2B3" />
              <Text>
                <Text as="span" color="#98A2B3">
                  文件：
                </Text>
                {resource.fileFormat.toUpperCase()} · {formatFileSize(resource.fileSize)}
              </Text>
            </HStack>
            <HStack>
              <CalendarDays size={16} color="#98A2B3" />
              <Text>
                <Text as="span" color="#98A2B3">
                  发布：
                </Text>
                {resource.publishTime}
              </Text>
            </HStack>
          </Stack>

          <Stack mt={6} spacing={3}>
            <Button
              leftIcon={<GitBranch size={17} aria-hidden="true" />}
              h="44px"
              bg="#B4232D"
              color="white"
              borderRadius="10px"
              isDisabled={isOffline}
              onClick={referenceModal.onOpen}
              _hover={{ bg: '#8F1D26' }}
            >
              引用资源
            </Button>
            <Grid templateColumns="repeat(2,1fr)" gap={3}>
              <Button
                leftIcon={
                  <Bookmark
                    size={16}
                    fill={resource.isFavorite ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                }
                h="42px"
                variant="outline"
                borderColor={resource.isFavorite ? '#B4232D' : '#D0D5DD'}
                color={resource.isFavorite ? '#B4232D' : '#344054'}
                borderRadius="10px"
                isDisabled={isOffline}
                onClick={() => void handleFavorite(resource)}
              >
                {resource.isFavorite ? '已收藏' : '收藏'}
              </Button>
              <Button
                leftIcon={<Download size={16} aria-hidden="true" />}
                h="42px"
                variant="outline"
                borderColor="#D0D5DD"
                borderRadius="10px"
                isDisabled={isOffline}
                isLoading={downloading}
                onClick={() => void handleDownload()}
              >
                下载
              </Button>
            </Grid>
          </Stack>
        </Box>
      </Grid>

      {related.length > 0 && (
        <Box mt={9}>
          <Text as="h2" color="#182230" fontSize="20px" fontWeight={700}>
            相关资源
          </Text>
          <Text mt={1} color="#667085" fontSize="13px">
            同课程或同类型的校本资源
          </Text>
          <Grid
            mt={4}
            templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }}
            gap={4}
          >
            {related.map((item) => (
              <ResourceCard key={item.id} resource={item} onToggleFavorite={handleFavorite} />
            ))}
          </Grid>
        </Box>
      )}

      <ReferenceResourceModal
        isOpen={referenceModal.isOpen}
        onClose={referenceModal.onClose}
        resource={resource}
        onSuccess={(created) => {
          if (!created) return;
          setResource((current) =>
            current ? { ...current, referenceCount: current.referenceCount + 1 } : current
          );
        }}
      />
    </PlazaScaffold>
  );
}
