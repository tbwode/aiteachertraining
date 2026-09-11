'use client';

/**
 * AI视频课 首页 - 我的项目列表
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  Grid,
  IconButton,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Spinner,
  Tag,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import Empty from '@/app/components/ui/Empty';
import type { AiVideoProject, AiVideoStatus } from '@/teacher/types/aiVideo';
import { deleteProject, duplicateProject, updateProject } from '@/teacher/api/aiVideo';
import { CARD_SHADOW, CARD_SHADOW_HOVER, AI_VIDEO_PRIMARY } from '../constants';
import { ConfirmModal } from './ConfirmModal';
import { ProjectPreviewModal } from './ProjectPreviewModal';

const STATUS_STYLE: Record<AiVideoStatus, { bg: string; color: string }> = {
  draft: { bg: 'gray.100', color: 'gray.600' },
  queued: { bg: 'orange.100', color: 'orange.600' },
  generating: { bg: 'blue.100', color: 'blue.600' },
  success: { bg: 'green.100', color: 'green.600' },
  failed: { bg: 'red.100', color: 'red.600' }
};

function formatUpdatedAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale, { hour12: false });
}

type ProjectListProps = {
  projects: AiVideoProject[];
  isLoading: boolean;
  onChanged: () => void;
};

export function ProjectList({ projects, isLoading, onChanged }: ProjectListProps) {
  const { t, i18n } = useTranslation('teacher');
  const router = useRouter();
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<AiVideoProject | null>(null);
  const [previewTarget, setPreviewTarget] = useState<AiVideoProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameTarget, setRenameTarget] = useState<AiVideoProject | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const handleConfirmRename = async () => {
    if (!renameTarget) return;
    const title = renameValue.trim();
    if (!title) return;
    setIsRenaming(true);
    try {
      await updateProject(renameTarget.id, (project) => ({ ...project, title }));
      toast({
        title: t('aiVideo.home.project.renameSuccess'),
        status: 'success',
        duration: 2000
      });
      setRenameTarget(null);
      onChanged();
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDuplicate = async (project: AiVideoProject) => {
    await duplicateProject(project.id);
    toast({ title: t('aiVideo.home.project.duplicateSuccess'), status: 'success', duration: 2000 });
    onChanged();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      toast({ title: t('aiVideo.home.project.deleteSuccess'), status: 'success', duration: 2000 });
      setDeleteTarget(null);
      onChanged();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" py={16}>
        <Spinner color={AI_VIDEO_PRIMARY} />
      </Flex>
    );
  }

  if (projects.length === 0) {
    return (
      <Box bg="white" borderRadius="16px" boxShadow={CARD_SHADOW}>
        <Empty
          title={t('aiVideo.home.project.empty')}
          description={t('aiVideo.home.project.emptyDesc')}
          action={
            <Button
              variant="primary"
              bg={AI_VIDEO_PRIMARY}
              borderColor={AI_VIDEO_PRIMARY}
              onClick={() => router.push('/teacher/ai-video/create/text')}
            >
              {t('aiVideo.home.project.create')}
            </Button>
          }
        />
      </Box>
    );
  }

  return (
    <>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }} gap={5}>
        {projects.map((project) => {
          const statusStyle = STATUS_STYLE[project.status];
          /* 主按钮：已完成→查看成片；PPT 未完成→回口播稿设置；文字未完成→编辑 */
          const primaryLabel =
            project.status === 'success'
              ? t('aiVideo.home.project.preview')
              : t('aiVideo.home.project.edit');
          const handlePrimary = () => {
            if (project.status === 'success') {
              setPreviewTarget(project);
            } else if (project.mode === 'ppt') {
              router.push(`/teacher/ai-video/create/ppt?id=${project.id}`);
            } else {
              router.push(`/teacher/ai-video/project?id=${project.id}`);
            }
          };
          /* 编辑入口：PPT 进口播稿编辑页，文字进预览编辑工作台 */
          const editHref =
            project.mode === 'ppt'
              ? `/teacher/ai-video/create/ppt?id=${project.id}`
              : `/teacher/ai-video/project?id=${project.id}`;
          /* 卡片点击：PPT 生成中/排队中看进度，其余进入对应编辑页 */
          const cardHref =
            project.mode === 'ppt' &&
            (project.status === 'queued' || project.status === 'generating')
              ? `/teacher/ai-video/project?id=${project.id}`
              : editHref;
          /* 下拉菜单：已完成状态展示「编辑」入口 */
          const showEditEntry = project.status === 'success';
          return (
            <Box
              key={project.id}
              bg="white"
              borderRadius="16px"
              boxShadow={CARD_SHADOW}
              overflow="hidden"
              transition="all 0.2s"
              _hover={{ boxShadow: CARD_SHADOW_HOVER }}
            >
              <Box
                position="relative"
                cursor="pointer"
                onClick={() => router.push(cardHref)}
              >
                <Image
                  src={project.coverUrl ?? '/media/ai-video/cover-16x9.jpg'}
                  alt={project.title}
                  w="100%"
                  h="150px"
                  objectFit="cover"
                />
                <Tag
                  position="absolute"
                  top={3}
                  left={3}
                  size="sm"
                  bg={statusStyle.bg}
                  color={statusStyle.color}
                  borderRadius="full"
                >
                  {t(`aiVideo.home.project.status.${project.status}`)}
                </Tag>
                {/* 正在生成中：封面叠加进度条与百分比 */}
                {(project.status === 'queued' || project.status === 'generating') && (
                  <Box position="absolute" left={3} right={3} bottom={3}>
                    <Flex justify="space-between" mb={1}>
                      <Text fontSize="11px" color="white" textShadow="0 1px 3px rgba(0,0,0,0.6)">
                        {project.status === 'queued'
                          ? t('aiVideo.home.project.queuePosition', {
                              value: project.queuePosition
                            })
                          : t('aiVideo.home.project.generating')}
                      </Text>
                      <Text
                        fontSize="11px"
                        fontWeight={600}
                        color="white"
                        textShadow="0 1px 3px rgba(0,0,0,0.6)"
                      >
                        {project.progress}%
                      </Text>
                    </Flex>
                    <Progress
                      value={project.progress}
                      size="xs"
                      borderRadius="full"
                      colorScheme="red"
                      bg="rgba(255,255,255,0.35)"
                      hasStripe
                      isAnimated
                    />
                  </Box>
                )}
              </Box>
              <VStack align="stretch" p={4} spacing={3}>
                <Box>
                  <Text fontSize="15px" fontWeight={600} color="gray.800" noOfLines={1}>
                    {project.title}
                  </Text>
                  <Text fontSize="12px" color="gray.400" mt={1}>
                    {t(`aiVideo.home.project.modeLabel.${project.mode}`)} ·{' '}
                    {formatUpdatedAt(project.updatedAt, i18n.language)}
                  </Text>
                </Box>
                {/* 主按钮 + 下拉菜单（其余操作收起） */}
                <Flex gap={2}>
                  <Button
                    flex="1"
                    size="sm"
                    variant="primary"
                    bg={AI_VIDEO_PRIMARY}
                    borderColor={AI_VIDEO_PRIMARY}
                    fontSize="13px"
                    onClick={handlePrimary}
                  >
                    {primaryLabel}
                  </Button>
                  <Menu placement="bottom-end">
                    <MenuButton
                      as={IconButton}
                      aria-label={t('aiVideo.home.project.more')}
                      icon={<MoreHorizontal size={16} />}
                      size="sm"
                      variant="outline"
                      bg="white"
                      color="gray.600"
                      borderColor="#E7E7E7"
                    />
                    <MenuList
                      minW="140px"
                      p={1}
                      borderRadius="8px"
                      borderColor="#E5E6EB"
                      boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    >
                      {showEditEntry && (
                        <MenuItem
                          fontSize="13px"
                          borderRadius="6px"
                          onClick={() => router.push(cardHref)}
                        >
                          {t('aiVideo.home.project.edit')}
                        </MenuItem>
                      )}
                      <MenuItem
                        fontSize="13px"
                        borderRadius="6px"
                        onClick={() => {
                          setRenameValue(project.title);
                          setRenameTarget(project);
                        }}
                      >
                        {t('aiVideo.home.project.rename')}
                      </MenuItem>
                      <MenuItem
                        fontSize="13px"
                        borderRadius="6px"
                        onClick={() => void handleDuplicate(project)}
                      >
                        {t('aiVideo.home.project.duplicate')}
                      </MenuItem>
                      <MenuItem
                        fontSize="13px"
                        borderRadius="6px"
                        color="red.500"
                        onClick={() => setDeleteTarget(project)}
                      >
                        {t('aiVideo.home.project.delete')}
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </VStack>
            </Box>
          );
        })}
      </Grid>

      {/* 成品预览弹框（播放视频 + 下载） */}
      <ProjectPreviewModal
        project={previewTarget}
        isOpen={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t('aiVideo.home.project.deleteTitle')}
        message={t('aiVideo.home.project.deleteMessage', { title: deleteTarget?.title ?? '' })}
        confirmText={isDeleting ? '...' : t('aiVideo.home.project.confirmDelete')}
        danger
      />

      {/* 重命名弹框 */}
      <Modal isOpen={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="16px" mx={4}>
          <ModalHeader px={5} pt={5} pb={2} fontSize="16px">
            {t('aiVideo.home.project.renameTitle')}
          </ModalHeader>
          <ModalBody px={5}>
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder={t('aiVideo.home.project.renamePlaceholder')}
              maxLength={50}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleConfirmRename();
              }}
            />
          </ModalBody>
          <ModalFooter px={5} pb={5} gap={2}>
            <Button
              size="sm"
              variant="outline"
              bg="white"
              color="gray.600"
              onClick={() => setRenameTarget(null)}
            >
              {t('aiVideo.common.cancel')}
            </Button>
            <Button
              size="sm"
              variant="primary"
              bg={AI_VIDEO_PRIMARY}
              borderColor={AI_VIDEO_PRIMARY}
              isDisabled={isRenaming || !renameValue.trim()}
              onClick={() => void handleConfirmRename()}
            >
              {isRenaming ? '...' : t('aiVideo.common.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
