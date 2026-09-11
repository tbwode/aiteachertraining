'use client';

/**
 * AI视频课 工作台 - AI编辑面板
 * 展示当前选中分镜，支持通过「快捷指令」（优化动画节奏/丰富细节/精简内容，位于输入框上方）
 * 或「智能体对话」对当前分镜进行优化；右上角关闭按钮收起面板
 */
import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Flex,
  IconButton,
  Image,
  Input,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react';
import { FastForward, Minimize2, SendHorizonal, Sparkles, Wand2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AiVideoProject, ShotOptimizeAction } from '@/teacher/types/aiVideo';
import { optimizeShot } from '@/teacher/api/aiVideo';
import { AI_VIDEO_PRIMARY, AI_VIDEO_PRIMARY_BG } from '../../constants';

type AiEditPanelProps = {
  project: AiVideoProject;
  /** 左侧分镜栏当前选中的分镜 */
  selectedShotId: string | null;
  onProjectChange: (project: AiVideoProject) => void;
  /** 关闭面板（收起右侧工具面板） */
  onClose: () => void;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** 思考中占位 */
  pending?: boolean;
};

/** 对话意图识别：命中关键词走对应优化动作 */
function detectAction(text: string): ShotOptimizeAction | null {
  if (/节奏|快慢|时长|pacing|rhythm/i.test(text)) return 'pacing';
  if (/丰富|细节|细致|更多|enrich|detail/i.test(text)) return 'enrich';
  if (/精简|简化|压缩|缩短|simplify|shorter/i.test(text)) return 'simplify';
  return null;
}

export function AiEditPanel({ project, selectedShotId, onProjectChange, onClose }: AiEditPanelProps) {
  const { t } = useTranslation('teacher');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  const shot = project.storyboard.find((item) => item.id === selectedShotId) ?? null;
  const shotIndex = shot ? project.storyboard.findIndex((item) => item.id === shot.id) : -1;

  /* 新消息自动滚动到底部 */
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const pushMessage = (role: ChatMessage['role'], text: string, pending = false) => {
    seq.current += 1;
    const msg: ChatMessage = { id: `msg_${Date.now()}_${seq.current}`, role, text, pending };
    setMessages((prev) => [...prev, msg]);
    return msg.id;
  };

  const replaceMessage = (id: string, text: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text, pending: false } : m)));
  };

  /** 对当前分镜执行优化动作，并把过程记录到对话流 */
  const runAction = async (action: ShotOptimizeAction, userText: string) => {
    pushMessage('user', userText);
    if (!shot) {
      pushMessage('assistant', t('aiVideo.studio.aiEdit.chat.replyNoShot'));
      return;
    }
    setThinking(true);
    const pendingId = pushMessage('assistant', t('aiVideo.studio.aiEdit.chat.thinking'), true);
    try {
      const next = await optimizeShot(project.id, shot.id, action);
      if (next) {
        onProjectChange(next);
        const updated = next.storyboard.find((item) => item.id === shot.id);
        const replyKey =
          action === 'pacing'
            ? 'replyPacing'
            : action === 'enrich'
              ? 'replyEnrich'
              : 'replySimplify';
        replaceMessage(
          pendingId,
          t(`aiVideo.studio.aiEdit.chat.${replyKey}`, { duration: updated?.duration ?? shot.duration })
        );
      } else {
        replaceMessage(pendingId, t('aiVideo.studio.aiEdit.chat.replyFallback'));
      }
    } finally {
      setThinking(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput('');
    const action = detectAction(text);
    if (action) {
      void runAction(action, text);
      return;
    }
    pushMessage('user', text);
    if (!shot) {
      pushMessage('assistant', t('aiVideo.studio.aiEdit.chat.replyNoShot'));
      return;
    }
    setThinking(true);
    const pendingId = pushMessage('assistant', t('aiVideo.studio.aiEdit.chat.thinking'), true);
    setTimeout(() => {
      replaceMessage(pendingId, t('aiVideo.studio.aiEdit.chat.replyFallback'));
      setThinking(false);
    }, 700);
  };

  const quickCommands: Array<{ action: ShotOptimizeAction; icon: React.ReactNode }> = [
    { action: 'pacing', icon: <FastForward size={14} /> },
    { action: 'enrich', icon: <Wand2 size={14} /> },
    { action: 'simplify', icon: <Minimize2 size={14} /> }
  ];

  return (
    <Flex direction="column" flex="1" minH={0} gap={4}>
      {/* 头部：标题 + 关闭按钮 */}
      <Flex justify="space-between" align="center" mt={-1}>
        <Text fontSize="14px" fontWeight={700} color="gray.800">
          {t('aiVideo.studio.rail.aiEdit')}
        </Text>
        <IconButton
          aria-label={t('aiVideo.studio.aiEdit.close')}
          icon={<X size={15} />}
          size="xs"
          variant="ghost"
          color="gray.400"
          onClick={onClose}
        />
      </Flex>

      {/* 当前分镜 */}
      <Box flexShrink={0}>
        <Text fontSize="12px" color="gray.400" mb={2}>
          {t('aiVideo.studio.aiEdit.currentShot')}
        </Text>
        {shot ? (
          <Flex
            gap={3}
            p={2.5}
            borderRadius="12px"
            border="1px solid"
            borderColor="#EEF0F4"
            bg="gray.50"
          >
            <Box position="relative" flexShrink={0}>
              <Image
                src={shot.customMediaUrl ?? shot.imageUrl}
                alt={shot.title}
                w="96px"
                h="56px"
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
                bg={AI_VIDEO_PRIMARY}
                color="white"
                fontSize="11px"
                align="center"
                justify="center"
              >
                {shotIndex + 1}
              </Flex>
            </Box>
            <VStack align="flex-start" spacing={0.5} minW={0} flex="1">
              <Text fontSize="13px" fontWeight={600} color="gray.700" noOfLines={1}>
                {shot.title}
              </Text>
              <Text fontSize="11px" color="gray.400">
                {t('aiVideo.studio.sidebar.seconds', { value: shot.duration })}
              </Text>
              <Text fontSize="11px" color="gray.500" noOfLines={2}>
                {shot.narration}
              </Text>
            </VStack>
          </Flex>
        ) : (
          <Flex
            p={3}
            borderRadius="12px"
            border="1px dashed"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Text fontSize="12px" color="gray.400">
              {t('aiVideo.studio.aiEdit.noShot')}
            </Text>
          </Flex>
        )}
      </Box>

      {/* 智能体对话（占据剩余空间，输入框沉底） */}
      <Flex direction="column" flex="1" minH={0}>
        <Flex align="center" gap={1.5} mb={2} flexShrink={0}>
          <Sparkles size={13} color={AI_VIDEO_PRIMARY} />
          <Text fontSize="12px" color="gray.400">
            {t('aiVideo.studio.aiEdit.chat.title')}
          </Text>
        </Flex>
        <Flex
          direction="column"
          flex="1"
          minH={0}
          borderRadius="12px"
          border="1px solid"
          borderColor="#EEF0F4"
          overflow="hidden"
        >
          <Box
            ref={listRef}
            flex="1"
            minH="120px"
            overflowY="auto"
            p={3}
            bg="gray.50"
          >
            {messages.length === 0 && (
              <Text fontSize="11px" color="gray.400" textAlign="center" py={6}>
                {t('aiVideo.studio.aiEdit.chat.placeholder')}
              </Text>
            )}
            <VStack align="stretch" spacing={2}>
              {messages.map((msg) => (
                <Flex key={msg.id} justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}>
                  <Flex
                    maxW="85%"
                    px={3}
                    py={1.5}
                    borderRadius="10px"
                    fontSize="12px"
                    lineHeight="1.6"
                    whiteSpace="pre-wrap"
                    bg={msg.role === 'user' ? AI_VIDEO_PRIMARY : 'white'}
                    color={msg.role === 'user' ? 'white' : 'gray.600'}
                    border={msg.role === 'user' ? 'none' : '1px solid'}
                    borderColor="#EEF0F4"
                    align="center"
                    gap={2}
                  >
                    {msg.pending && <Spinner size="xs" />}
                    {msg.text}
                  </Flex>
                </Flex>
              ))}
            </VStack>
          </Box>
          {/* 快捷指令（输入框上方，仅指令 chips） */}
          <Flex
            gap={1.5}
            flexWrap="wrap"
            px={3}
            py={2}
            borderTop="1px solid"
            borderColor="#EEF0F4"
            bg="white"
            align="center"
            flexShrink={0}
          >
            {quickCommands.map(({ action, icon }) => (
              <Flex
                key={action}
                as="button"
                type="button"
                align="center"
                gap={1}
                px={2.5}
                py={1}
                borderRadius="full"
                border="1px solid"
                borderColor={shot && !thinking ? '#E7E7E7' : '#F0F0F0'}
                color={shot && !thinking ? 'gray.600' : 'gray.300'}
                bg="white"
                fontSize="11px"
                flexShrink={0}
                cursor={shot && !thinking ? 'pointer' : 'not-allowed'}
                _hover={shot && !thinking ? { borderColor: AI_VIDEO_PRIMARY, color: AI_VIDEO_PRIMARY, bg: AI_VIDEO_PRIMARY_BG } : undefined}
                onClick={() => {
                  if (!shot || thinking) return;
                  void runAction(action, t(`aiVideo.studio.aiEdit.cmd.${action}`));
                }}
              >
                {icon}
                {t(`aiVideo.studio.aiEdit.cmd.${action}`)}
              </Flex>
            ))}
          </Flex>
          <Flex borderTop="1px solid" borderColor="#EEF0F4" bg="white" align="center" flexShrink={0}>
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSend();
              }}
              placeholder={t('aiVideo.studio.aiEdit.chat.placeholder')}
              fontSize="12px"
              border="none"
              _focusVisible={{ boxShadow: 'none' }}
            />
            <IconButton
              aria-label={t('aiVideo.studio.aiEdit.chat.send')}
              icon={<SendHorizonal size={14} />}
              size="sm"
              variant="ghost"
              color={input.trim() && !thinking ? AI_VIDEO_PRIMARY : 'gray.300'}
              isDisabled={!input.trim() || thinking}
              onClick={handleSend}
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
