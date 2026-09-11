'use client';

/**
 * 数字人画布顶部悬浮询问条：
 * 关闭数字人 / 拖动位置 / 等比缩放调整后，悬浮在画面正上方询问作用域（同步到所有片段 / 仅此片段）
 */
import { Flex, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** 确认条消息文案 key 映射 */
const DH_PROMPT_TEXT_KEY: Record<'move' | 'resize' | 'remove', string> = {
  move: 'position',
  resize: 'size',
  remove: 'removed'
};

function BarAction({
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
      color={primary ? '#8FB8FF' : 'rgba(255,255,255,0.75)'}
      lineHeight="1.4"
      whiteSpace="nowrap"
      _hover={{ color: primary ? '#B9D4FF' : 'white' }}
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

export function DigitalHumanCanvasBar({
  kind,
  onSyncAll,
  onThisShot
}: {
  kind: 'move' | 'resize' | 'remove';
  onSyncAll: () => void;
  onThisShot: () => void;
}) {
  const { t } = useTranslation('teacher');

  return (
    <Flex
      position="absolute"
      top={4}
      left="50%"
      transform="translateX(-50%)"
      zIndex={10}
      align="center"
      gap={2}
      bg="#171F38"
      color="white"
      borderRadius="full"
      pl={3}
      pr={4}
      h="36px"
      boxShadow="0px 8px 24px rgba(23,25,35,0.28)"
      pointerEvents="auto"
      whiteSpace="nowrap"
    >
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
      <Text fontSize="12px" lineHeight="1.4">
        {t(`aiVideo.studio.digitalHuman.canvas.adjusted.${DH_PROMPT_TEXT_KEY[kind]}`)}
        <Text as="span" color="rgba(255,255,255,0.55)" ml={1}>
          {t('aiVideo.studio.digitalHuman.canvas.syncAsk')}
        </Text>
      </Text>
      <Flex align="center" gap={3} ml={1}>
        <BarAction primary onClick={onSyncAll}>
          {t('aiVideo.studio.digitalHuman.canvas.syncAll')}
        </BarAction>
        <BarAction onClick={onThisShot}>
          {t('aiVideo.studio.digitalHuman.canvas.thisShot')}
        </BarAction>
      </Flex>
    </Flex>
  );
}
