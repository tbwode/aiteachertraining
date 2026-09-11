'use client';

/**
 * 数字人应用状态条（悬浮在数字人弹框底部）：
 * applied-已应用状态（切换范围/撤销）；当前分镜已删除数字人-恢复入口
 * 注意：调整后的询问条（关闭/拖动/缩放）悬浮在画面上，见 DigitalHumanCanvasBar
 */
import { Flex, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DhBar } from './StudioPlayer';
import { AI_VIDEO_PRIMARY } from '../../constants';

function StatusAction({
  primary = false,
  onClick,
  children
}: {
  primary?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Flex
      as="button"
      type="button"
      fontSize="12px"
      fontWeight={primary ? 600 : 400}
      color={primary ? AI_VIDEO_PRIMARY : 'gray.500'}
      lineHeight="1.4"
      whiteSpace="nowrap"
      _hover={{ color: primary ? AI_VIDEO_PRIMARY : 'gray.700' }}
      textDecoration={primary ? 'none' : 'underline'}
      textUnderlineOffset="2px"
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </Flex>
  );
}

/** 悬浮卡片容器（弹框底部浮起） */
function FloatingCard({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      mt="auto"
      align="center"
      gap={2}
      flexShrink={0}
      flexWrap="wrap"
      bg="white"
      border="1px solid"
      borderColor="gray.100"
      borderRadius="12px"
      boxShadow="0px 6px 20px rgba(23,25,35,0.12)"
      px={3}
      py={2.5}
    >
      {children}
    </Flex>
  );
}

export function DigitalHumanStatusBar({
  bar,
  canUndo,
  shotHidden = false,
  onRestoreShot,
  onSwitchScope,
  onUndo
}: {
  bar: DhBar | null;
  canUndo: boolean;
  /** 当前分镜已删除数字人（画面不再展示占位，在此提供恢复入口） */
  shotHidden?: boolean;
  onRestoreShot?: () => void;
  onSwitchScope: () => void;
  onUndo: () => void;
}) {
  const { t } = useTranslation('teacher');

  /* 当前分镜已删除数字人：展示状态与恢复入口（无其他活动状态条时） */
  if (!bar && shotHidden) {
    return (
      <FloatingCard>
        <Flex
          w="18px"
          h="18px"
          borderRadius="full"
          bg="gray.300"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Check size={11} color="white" strokeWidth={3.5} />
        </Flex>
        <Text fontSize="12px" color="gray.700" flex="1" lineHeight="1.4">
          {t('aiVideo.studio.digitalHuman.canvas.removedCurrent')}
        </Text>
        <StatusAction primary onClick={() => onRestoreShot?.()}>
          {t('aiVideo.studio.digitalHuman.canvas.restoreShot')}
        </StatusAction>
      </FloatingCard>
    );
  }

  /* 仅 applied 形态悬浮在弹框；ask 形态已移至画面（DigitalHumanCanvasBar） */
  if (!bar || bar.stage !== 'applied') return null;

  return (
    <FloatingCard>
      <Flex
        w="18px"
        h="18px"
        borderRadius="full"
        bg="#22C55E"
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Check size={11} color="white" strokeWidth={3.5} />
      </Flex>
      <Text fontSize="12px" color="gray.700" flex="1" minW="100px" lineHeight="1.4">
        {t(`aiVideo.studio.digitalHuman.canvas.applied.${bar.scope}`)}
      </Text>
      <Flex align="center" gap={3}>
        <StatusAction primary onClick={onSwitchScope}>
          {t(
            bar.scope === 'all'
              ? 'aiVideo.studio.digitalHuman.canvas.switchToShot'
              : 'aiVideo.studio.digitalHuman.canvas.switchToAll'
          )}
        </StatusAction>
        {canUndo && (
          <StatusAction onClick={onUndo}>
            {t('aiVideo.studio.digitalHuman.canvas.undo')}
          </StatusAction>
        )}
      </Flex>
    </FloatingCard>
  );
}
