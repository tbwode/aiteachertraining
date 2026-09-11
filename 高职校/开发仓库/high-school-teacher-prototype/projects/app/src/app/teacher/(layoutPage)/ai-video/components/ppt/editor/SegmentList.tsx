'use client';

/**
 * PPT/文档转视频 预览编辑 - 左侧片段栏
 * 片段卡片：序号 + 页面缩略图（含数字人位置标记）+ 口播稿摘要
 * （视频尚未生成，不展示片段时长）
 * 支持新增片段；选中片段时缩略图右上角显示删除按钮；口播稿未生成的片段展示骨架态
 */
import { Box, Flex, IconButton, Image, SkeletonText, Text, VStack } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject, StoryboardShot } from '@/teacher/types/aiVideo';
import { AI_VIDEO_PRIMARY, CARD_SHADOW } from '../../../constants';
import { resolvePptLayoutView } from './ShotCanvas';

/** 数字人位置标记（与画布同一布局解析：版式/形态/摆放百分比/宽高比） */
function DhMarker({ project, shot }: { project: AiVideoProject; shot: StoryboardShot }) {
  const { dh } = resolvePptLayoutView(project, shot);
  if (!dh) return null;
  return (
    <Image
      src={dh.src}
      alt=""
      position="absolute"
      left={`${dh.placement.x}%`}
      top={`${dh.placement.y}%`}
      transform="translate(-50%, -50%)"
      w={`${dh.widthPercent}%`}
      sx={{ aspectRatio: String(dh.aspect) }}
      objectFit="cover"
      objectPosition={dh.objectPosition}
      borderRadius={dh.borderRadius}
      border="1px solid rgba(255,255,255,0.9)"
      boxShadow="0 1px 4px rgba(0,0,0,0.35)"
      bg="white"
      pointerEvents="none"
    />
  );
}

export function SegmentList({
  project,
  scripts,
  revealedIds,
  selectedId,
  addDisabled,
  onSelect,
  onAdd,
  onDelete
}: {
  project: AiVideoProject;
  /** shotId → 口播稿（未生成/待生成为空串） */
  scripts: Record<string, string>;
  /** 已生成完成的 shotId 集合 */
  revealedIds: Set<string>;
  selectedId: string | null;
  /** 口播稿生成中禁止新增 */
  addDisabled: boolean;
  onSelect: (shotId: string) => void;
  onAdd: () => void;
  onDelete: (shotId: string) => void;
}) {
  const { t } = useTranslation('teacher');

  return (
    <Box
      w="220px"
      flexShrink={0}
      bg="white"
      borderRadius="16px"
      boxShadow={CARD_SHADOW}
      p={3}
      h="100%"
      overflowY="auto"
    >
      <Text fontSize="13px" fontWeight={600} color="gray.800" mb={3} px={1}>
        {t('aiVideo.ppt.editor.segments')}（{project.storyboard.length}）
      </Text>
      <VStack align="stretch" spacing={3}>
        {project.storyboard.map((shot, index) => {
          const selected = selectedId === shot.id;
          const revealed = revealedIds.has(shot.id);
          const script = scripts[shot.id] ?? '';
          return (
            <Flex
              key={shot.id}
              role="button"
              tabIndex={0}
              cursor="pointer"
              direction="column"
              align="stretch"
              textAlign="left"
              borderRadius="10px"
              border="2px solid"
              borderColor={selected ? AI_VIDEO_PRIMARY : 'transparent'}
              bg={selected ? 'red.50' : 'gray.50'}
              p={1.5}
              gap={1.5}
              onClick={() => onSelect(shot.id)}
              onKeyDown={(event: React.KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(shot.id);
                }
              }}
              transition="all 0.15s"
              position="relative"
            >
              <Box position="relative">
                <Image
                  src={shot.imageUrl}
                  alt={shot.title}
                  w="100%"
                  h="96px"
                  objectFit="cover"
                  borderRadius="8px"
                  bg="gray.200"
                />
                <Flex
                  position="absolute"
                  top={1}
                  left={1}
                  w="18px"
                  h="18px"
                  borderRadius="6px"
                  bg={selected ? AI_VIDEO_PRIMARY : 'blackAlpha.600'}
                  color="white"
                  fontSize="11px"
                  align="center"
                  justify="center"
                >
                  {index + 1}
                </Flex>
                <DhMarker project={project} shot={shot} />
                {/* 选中片段显示删除按钮 */}
                {selected && (
                  <IconButton
                    aria-label={t('aiVideo.ppt.editor.deleteSegment')}
                    icon={<Trash2 size={12} />}
                    size="xs"
                    position="absolute"
                    top={1}
                    right={1}
                    borderRadius="6px"
                    bg="white"
                    color="red.500"
                    boxShadow="0 1px 4px rgba(0,0,0,0.2)"
                    _hover={{ bg: 'red.50' }}
                    onClick={(event: React.MouseEvent) => {
                      event.stopPropagation();
                      onDelete(shot.id);
                    }}
                  />
                )}
              </Box>
              {revealed ? (
                <Text fontSize="12px" color="gray.600" noOfLines={2} lineHeight="1.5" px={0.5}>
                  {script}
                </Text>
              ) : (
                <Box px={0.5}>
                  <SkeletonText
                    noOfLines={2}
                    spacing="1.5"
                    skeletonHeight="2.5"
                    startColor="gray.100"
                    endColor="gray.200"
                  />
                  <Text fontSize="10px" color="gray.400" mt={1}>
                    {t('aiVideo.ppt.editor.scriptGenerating')}
                  </Text>
                </Box>
              )}
            </Flex>
          );
        })}

        {/* 新增片段 */}
        <Flex
          as="button"
          type="button"
          align="center"
          justify="center"
          gap={1}
          py={2.5}
          borderRadius="10px"
          border="1px dashed"
          borderColor={addDisabled ? 'gray.200' : '#D9DEE7'}
          color={addDisabled ? 'gray.300' : 'gray.500'}
          fontSize="12px"
          cursor={addDisabled ? 'not-allowed' : 'pointer'}
          _hover={
            addDisabled ? undefined : { borderColor: AI_VIDEO_PRIMARY, color: AI_VIDEO_PRIMARY }
          }
          transition="all 0.15s"
          onClick={() => {
            if (!addDisabled) onAdd();
          }}
        >
          <Plus size={13} />
          {t('aiVideo.ppt.editor.addSegment')}
        </Flex>
      </VStack>
    </Box>
  );
}
