'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  HStack,
  IconButton,
  Spinner,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  ArrowLeft,
  Check,
  FolderOpen,
  History,
  Mic,
  Paperclip,
  Send,
  Sparkles
} from 'lucide-react';
import {
  DEFAULT_PREP_PROMPT,
  DEFAULT_WORKSPACE_SKILL,
  WORKSPACE_EXPERTS,
  WORKSPACE_MODES,
  WORKSPACE_SKILLS,
  getWorkspaceExpertsForScene,
  getWorkspaceSceneMeta,
  getWorkspaceSkillPrompt,
  getWorkspaceSkillScene,
  getWorkspaceSkillsForScene,
  type WorkspaceExpertKey,
  type WorkspaceModeKey,
  type WorkspaceScene,
  type WorkspaceSkillKey
} from '../workbuddyConfig';
import {
  WorkspaceContextChips,
  WorkspaceContextControls,
  type WorkspaceAttachment
} from '../components/WorkspaceContextControls';
import ArtifactPanel from './components/ArtifactPanel';
import ArtifactPreviewModal from './components/ArtifactPreviewModal';
import ChatHistoryPanel from './components/ChatHistoryPanel';
import SkillInvocationCard from './components/SkillInvocationCard';
import {
  createMockSkillRun,
  normalizeSkillKeys,
  type MockArtifact,
  type MockSkillRun
} from './mockSkillConversation';

type ConversationTurn = {
  id: string;
  prompt: string;
  createdAt: string;
  phase: 'running' | 'completed';
  mode?: WorkspaceModeKey | null;
  expert?: WorkspaceExpertKey | null;
  scene?: WorkspaceScene;
  attachments?: WorkspaceAttachment[];
  run: MockSkillRun;
};

type WorkspaceConversation = {
  id: string;
  title: string;
  updatedAt: string;
  turns: ConversationTurn[];
};

const STORAGE_KEY = 'teacher-workspace-chat-conversations-v4';
const PRIMARY = '#C8000B';
const FOCUS_RING = '0 0 0 3px rgba(200,0,11,.17)';

const createTurn = (
  id: string,
  prompt: string,
  skill: WorkspaceSkillKey,
  createdAt: string,
  mode: WorkspaceModeKey | null = 'plan',
  expert: WorkspaceExpertKey | null = null,
  attachments: WorkspaceAttachment[] = [],
  scene: WorkspaceScene = getWorkspaceSkillScene(skill)
): ConversationTurn => ({
  id,
  prompt,
  createdAt,
  phase: 'completed',
  mode,
  expert,
  scene,
  attachments,
  run: createMockSkillRun(prompt, [skill], mode)
});

const createDemoConversations = (): WorkspaceConversation[] => [
  {
    id: 'demo-tcp',
    title: '工业机器人 TCP 标定完整课包',
    updatedAt: '今天 10:28',
    turns: [
      createTurn('turn-demo-tcp', DEFAULT_PREP_PROMPT, 'slides', '10:28', 'plan', 'courseware')
    ]
  },
  {
    id: 'demo-bms',
    title: 'BMS 过压保护随堂测验',
    updatedAt: '今天 09:42',
    turns: [
      createTurn(
        'turn-demo-bms',
        '围绕动力电池 BMS 过压保护原理生成一套随堂诊断测验，并提供答案解析。',
        'quiz',
        '09:42',
        'qa',
        'assessment'
      )
    ]
  },
  {
    id: 'demo-plc',
    title: 'PLC 安全联锁实训工单',
    updatedAt: '昨天 16:20',
    turns: [
      createTurn(
        'turn-demo-plc',
        '设计 PLC 安全联锁控制实训工单，包含操作步骤、安全规范和过程评价标准。',
        'practice',
        '昨天 16:20',
        'plan',
        'industry'
      )
    ]
  },
  {
    id: 'demo-campus-procurement',
    title: '新能源实训设备采购审查',
    updatedAt: '昨天 14:30',
    turns: [
      createTurn(
        'turn-demo-campus-procurement',
        '审查新能源汽车实训设备采购申请：核对采购政策与审批流程，辅助核算预算，优化申报材料，整理采购台账，并输出合规风险与归档清单。',
        'procurement',
        '昨天 14:30',
        'plan',
        'procurement-compliance',
        [],
        'campus'
      )
    ]
  }
];

const buildTitle = (prompt: string) => {
  const compact = prompt.replace(/\s+/gu, ' ').trim();
  return compact.length > 18 ? `${compact.slice(0, 18)}…` : compact || '新备课任务';
};

const parseMode = (value: string | null): WorkspaceModeKey | null =>
  WORKSPACE_MODES.some((item) => item.key === value) ? (value as WorkspaceModeKey) : null;

const parseExpert = (value: string | null): WorkspaceExpertKey | null =>
  WORKSPACE_EXPERTS.some((item) => item.key === value) ? (value as WorkspaceExpertKey) : null;

const parseScene = (value: string | null): WorkspaceScene | null =>
  value === 'daily' || value === 'work-order' || value === 'campus' ? value : null;

const getContextLabel = <T extends { key: string; label: string }>(
  options: T[],
  key?: string | null
) => options.find((item) => item.key === key)?.label;

const isStoredConversationList = (value: unknown): value is WorkspaceConversation[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as WorkspaceConversation).id === 'string' &&
      Array.isArray((item as WorkspaceConversation).turns)
  );

export default function WorkspaceChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const initializedRef = useRef(false);
  const [conversations, setConversations] =
    useState<WorkspaceConversation[]>(createDemoConversations);
  const [activeConversationId, setActiveConversationId] = useState('demo-tcp');
  const [inputValue, setInputValue] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<WorkspaceSkillKey | null>(
    DEFAULT_WORKSPACE_SKILL
  );
  const [selectedMode, setSelectedMode] = useState<WorkspaceModeKey | null>('plan');
  const [selectedExpert, setSelectedExpert] = useState<WorkspaceExpertKey | null>(null);
  const [activeScene, setActiveScene] = useState<WorkspaceScene>('daily');
  const [attachments, setAttachments] = useState<WorkspaceAttachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewArtifact, setPreviewArtifact] = useState<MockArtifact | null>(null);
  const historyDrawer = useDisclosure();
  const artifactDrawer = useDisclosure();
  const previewModal = useDisclosure();
  const sceneMeta = getWorkspaceSceneMeta(activeScene);
  const sceneExperts = getWorkspaceExpertsForScene(activeScene);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const text = searchParams.get('text')?.trim() || '';
    const requestedSkills = normalizeSkillKeys([
      searchParams.get('skill') || '',
      ...(searchParams.get('skills') || '').split(',').filter(Boolean)
    ]);
    const requestedMode = parseMode(searchParams.get('mode')) ?? 'plan';
    const requestedExpert = parseExpert(searchParams.get('expert'));
    let incomingAttachments: WorkspaceAttachment[] = [];

    const storedAttachment = window.localStorage.getItem('common_chat_attachments');
    if (storedAttachment) {
      try {
        const files = JSON.parse(storedAttachment) as Array<{
          fileName?: string;
          fileSize?: number;
        }>;
        if (Array.isArray(files)) {
          incomingAttachments = files
            .filter((file): file is { fileName: string; fileSize?: number } =>
              Boolean(file.fileName)
            )
            .map((file, index) => ({
              id: `incoming-${index}-${file.fileName}`,
              name: file.fileName,
              size: file.fileSize ?? 0
            }));
          setAttachments(incomingAttachments);
        }
      } catch {
        // 忽略损坏的原型附件数据
      }
      window.localStorage.removeItem('common_chat_attachments');
    }

    if (text) {
      const skill = requestedSkills[0] ?? DEFAULT_WORKSPACE_SKILL;
      const scene = parseScene(searchParams.get('scene')) ?? getWorkspaceSkillScene(skill);
      const id = `conversation-${Date.now()}`;
      const conversation: WorkspaceConversation = {
        id,
        title: buildTitle(text),
        updatedAt: '刚刚',
        turns: [
          createTurn(
            `turn-${Date.now()}`,
            text,
            skill,
            '刚刚',
            requestedMode,
            requestedExpert,
            incomingAttachments,
            scene
          )
        ]
      };
      setConversations((current) => [conversation, ...current]);
      setActiveConversationId(id);
      setSelectedSkill(skill);
      setSelectedMode(requestedMode);
      setSelectedExpert(requestedExpert);
      setActiveScene(scene);
      setAttachments([]);
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as unknown;
        if (isStoredConversationList(parsed) && parsed.length > 0) {
          setConversations(parsed);
          setActiveConversationId(parsed[0].id);
          const latestTurn = parsed[0].turns.at(-1);
          setSelectedSkill(latestTurn?.run.skills[0] ?? DEFAULT_WORKSPACE_SKILL);
          setSelectedMode(latestTurn?.mode ?? 'plan');
          setSelectedExpert(latestTurn?.expert ?? null);
          setActiveScene(
            latestTurn?.scene ??
              getWorkspaceSkillScene(latestTurn?.run.skills[0] ?? DEFAULT_WORKSPACE_SKILL)
          );
        }
      } catch {
        // 使用内置演示会话
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!initializedRef.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) ?? conversations[0],
    [activeConversationId, conversations]
  );

  const activeArtifacts = useMemo(
    () => activeConversation?.turns.flatMap((turn) => turn.run.artifacts) ?? [],
    [activeConversation]
  );

  const conversationSummaries = useMemo(
    () =>
      conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        updatedAt: conversation.updatedAt,
        skillCount: new Set(conversation.turns.flatMap((turn) => turn.run.skills)).size
      })),
    [conversations]
  );

  const handleConversationSelect = (id: string) => {
    setActiveConversationId(id);
    const target = conversations.find((item) => item.id === id);
    const latestTurn = target?.turns.at(-1);
    setSelectedSkill(latestTurn?.run.skills[0] ?? DEFAULT_WORKSPACE_SKILL);
    setSelectedMode(latestTurn?.mode ?? 'plan');
    setSelectedExpert(latestTurn?.expert ?? null);
    setActiveScene(
      latestTurn?.scene ??
        getWorkspaceSkillScene(latestTurn?.run.skills[0] ?? DEFAULT_WORKSPACE_SKILL)
    );
    setAttachments([]);
    historyDrawer.onClose();
  };

  const handleCreateConversation = () => {
    const id = `conversation-${Date.now()}`;
    setConversations((current) => [
      { id, title: '新备课任务', updatedAt: '刚刚', turns: [] },
      ...current
    ]);
    setActiveConversationId(id);
    setInputValue('');
    setSelectedSkill(DEFAULT_WORKSPACE_SKILL);
    setSelectedMode('plan');
    setSelectedExpert(null);
    setActiveScene('daily');
    setAttachments([]);
    historyDrawer.onClose();
  };

  const handleSkillSelect = (skill: WorkspaceSkillKey) => {
    const nextScene = getWorkspaceSkillScene(skill);
    if (nextScene !== activeScene) setSelectedExpert(null);
    setSelectedSkill(skill);
    setActiveScene(nextScene);
    setInputValue(getWorkspaceSkillPrompt(skill));
  };

  const handleSend = () => {
    const prompt = inputValue.trim();
    if (!prompt || isGenerating || !activeConversation) return;

    const run = createMockSkillRun(prompt, selectedSkill ? [selectedSkill] : [], selectedMode);
    const turnId = `turn-${Date.now()}`;
    const runningTurn: ConversationTurn = {
      id: turnId,
      prompt,
      createdAt: '刚刚',
      phase: 'running',
      mode: selectedMode,
      expert: selectedExpert,
      scene: activeScene,
      attachments,
      run
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              title: conversation.turns.length === 0 ? buildTitle(prompt) : conversation.title,
              updatedAt: '刚刚',
              turns: [...conversation.turns, runningTurn]
            }
          : conversation
      )
    );
    setInputValue('');
    setAttachments([]);
    setIsGenerating(true);

    window.setTimeout(() => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                turns: conversation.turns.map((turn) =>
                  turn.id === turnId ? { ...turn, phase: 'completed' } : turn
                )
              }
            : conversation
        )
      );
      setIsGenerating(false);
    }, 900);
  };

  const handleFiles = (files: File[]) => {
    setAttachments((current) => [
      ...current,
      ...files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        name: file.name,
        size: file.size
      }))
    ]);
    toast({
      title: `已添加 ${files.length} 个文件`,
      description: '文件仅作为本地 Mock 对话上下文展示。',
      status: 'success',
      duration: 1500
    });
  };

  const handlePreview = (artifact: MockArtifact) => {
    setPreviewArtifact(artifact);
    artifactDrawer.onClose();
    previewModal.onOpen();
  };

  return (
    <Box
      h="calc(100vh - 64px)"
      minH="640px"
      color="#1E293B"
      overflow="hidden"
      sx={{
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            transitionDuration: '0.01ms !important'
          }
        }
      }}
    >
      <Flex
        h="58px"
        px={{ base: 4, md: 6 }}
        align="center"
        justify="space-between"
        borderBottom="1px solid rgba(226,232,240,.9)"
        bg="rgba(255,255,255,.86)"
        backdropFilter="blur(12px)"
      >
        <HStack spacing={3} minW={0}>
          <IconButton
            type="button"
            aria-label="返回教师工作台"
            icon={<ArrowLeft size={17} />}
            size="sm"
            variant="ghost"
            borderRadius="10px"
            color="#475569"
            _hover={{ bg: '#FFF1F0', color: PRIMARY }}
            _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
            onClick={() => router.push('/teacher')}
          />
          <Box minW={0}>
            <HStack spacing={2}>
              <Text
                fontSize={{ base: '13px', md: '14px' }}
                fontWeight={800}
                color="#0F172A"
                noOfLines={1}
              >
                {activeConversation?.title || `新${sceneMeta.label}任务`}
              </Text>
              <Text
                display={{ base: 'none', sm: 'block' }}
                px={2}
                py="2px"
                borderRadius="full"
                bg="#ECFDF5"
                color="#047857"
                fontSize="9px"
                fontWeight={700}
              >
                Mock 模式
              </Text>
            </HStack>
            <Text display={{ base: 'none', md: 'block' }} mt={0.5} fontSize="10px" color="#94A3B8">
              {activeScene === 'campus'
                ? '校园管理数据仅用于 Mock 原型演示，不会发送到后端'
                : '教学内容在当前浏览器生成，不会发送到后端'}
            </Text>
          </Box>
        </HStack>

        <HStack spacing={2}>
          <Button
            type="button"
            display={{ base: 'inline-flex', lg: 'none' }}
            size="sm"
            h="34px"
            leftIcon={<History size={14} />}
            fontSize="11px"
            variant="outline"
            onClick={historyDrawer.onOpen}
          >
            历史
          </Button>
          <Button
            type="button"
            display={{ base: 'inline-flex', xl: 'none' }}
            size="sm"
            h="34px"
            leftIcon={<FolderOpen size={14} />}
            fontSize="11px"
            variant="outline"
            onClick={artifactDrawer.onOpen}
          >
            产物 {activeArtifacts.length || ''}
          </Button>
        </HStack>
      </Flex>

      <Grid
        h="calc(100% - 58px)"
        minH={0}
        templateColumns={{
          base: 'minmax(0, 1fr)',
          lg: '228px minmax(0, 1fr)',
          xl: '228px minmax(0, 1fr) 292px'
        }}
        gap={{ base: 0, lg: 4 }}
        p={{ base: 0, lg: 4 }}
      >
        <Box
          display={{ base: 'none', lg: 'block' }}
          minH={0}
          bg="rgba(255,255,255,.88)"
          border="1px solid #E2E8F0"
          borderRadius="16px"
          p={3}
          boxShadow="0 10px 30px rgba(15,23,42,.04)"
        >
          <ChatHistoryPanel
            conversations={conversationSummaries}
            activeId={activeConversationId}
            onSelect={handleConversationSelect}
            onCreate={handleCreateConversation}
          />
        </Box>

        <Flex
          as="main"
          id="workspace-chat-main"
          minW={0}
          minH={0}
          direction="column"
          bg="rgba(255,255,255,.94)"
          border={{ base: 'none', lg: '1px solid #E2E8F0' }}
          borderRadius={{ base: 0, lg: '16px' }}
          boxShadow={{ base: 'none', lg: '0 10px 30px rgba(15,23,42,.05)' }}
          overflow="hidden"
        >
          <Flex
            px={{ base: 4, md: 5 }}
            py={3}
            align="center"
            justify="space-between"
            gap={4}
            borderBottom="1px solid #E8EDF3"
            bg="#FCFDFE"
          >
            <HStack spacing={2} minW={0}>
              <Flex
                w="30px"
                h="30px"
                borderRadius="10px"
                align="center"
                justify="center"
                bg="#FFF1F0"
                color={PRIMARY}
                flexShrink={0}
              >
                <Sparkles size={15} />
              </Flex>
              <Box minW={0}>
                <Text fontSize="12px" fontWeight={800} color="#1E293B">
                  {sceneMeta.assistantTitle}
                </Text>
                <Text fontSize="9px" color="#94A3B8" noOfLines={1}>
                  {sceneMeta.assistantDescription}
                </Text>
              </Box>
            </HStack>
            <HStack spacing={1.5} color="#047857" flexShrink={0}>
              <Box w="7px" h="7px" borderRadius="full" bg="#10B981" boxShadow="0 0 0 3px #D1FAE5" />
              <Text fontSize="10px">在线</Text>
            </HStack>
          </Flex>

          <Box flex="1" minH={0} overflowY="auto" px={{ base: 4, md: 6 }} py={5}>
            {activeConversation?.turns.length ? (
              <VStack spacing={6} align="stretch" maxW="790px" mx="auto">
                {activeConversation.turns.map((turn) => (
                  <Box key={turn.id}>
                    <Flex justify="flex-end" mb={4}>
                      <Box maxW="78%">
                        <Box
                          bg="#FFF1F0"
                          border="1px solid #FDDBD6"
                          borderRadius="16px 4px 16px 16px"
                          px={4}
                          py={3}
                        >
                          <Text
                            fontSize="12px"
                            color="#334155"
                            lineHeight="1.75"
                            whiteSpace="pre-wrap"
                          >
                            {turn.prompt}
                          </Text>
                          <Flex mt={2.5} gap={1.5} wrap="wrap">
                            {turn.mode && (
                              <Text
                                px={2}
                                py={1}
                                borderRadius="6px"
                                bg="#EFF6FF"
                                color="#1D4ED8"
                                fontSize="9px"
                              >
                                模式 · {getContextLabel(WORKSPACE_MODES, turn.mode)}
                              </Text>
                            )}
                            {turn.run.skills[0] && (
                              <Text
                                px={2}
                                py={1}
                                borderRadius="6px"
                                bg="white"
                                border="1px solid #FDDBD6"
                                color="#B3121B"
                                fontSize="9px"
                              >
                                技能 · {getContextLabel(WORKSPACE_SKILLS, turn.run.skills[0])}
                              </Text>
                            )}
                            {turn.expert && (
                              <Text
                                px={2}
                                py={1}
                                borderRadius="6px"
                                bg="#FFFBEB"
                                color="#B45309"
                                fontSize="9px"
                              >
                                专家 · {getContextLabel(WORKSPACE_EXPERTS, turn.expert)}
                              </Text>
                            )}
                            {turn.attachments?.map((attachment) => (
                              <HStack
                                key={attachment.id}
                                spacing={1}
                                px={2}
                                py={1}
                                borderRadius="6px"
                                bg="#F8FAFC"
                                color="#64748B"
                              >
                                <Paperclip size={11} />
                                <Text maxW="180px" fontSize="9px" noOfLines={1}>
                                  {attachment.name}
                                </Text>
                              </HStack>
                            ))}
                          </Flex>
                        </Box>
                        <Text mt={1} textAlign="right" fontSize="9px" color="#94A3B8">
                          {turn.createdAt}
                        </Text>
                      </Box>
                    </Flex>

                    <Flex align="flex-start" gap={3}>
                      <Flex
                        w="32px"
                        h="32px"
                        flexShrink={0}
                        borderRadius="11px"
                        bg="linear-gradient(135deg,#C8000B,#E52531)"
                        color="white"
                        align="center"
                        justify="center"
                        boxShadow="0 5px 14px rgba(200,0,11,.18)"
                      >
                        <Sparkles size={15} />
                      </Flex>
                      <Box
                        maxW="calc(100% - 44px)"
                        flex="1"
                        border="1px solid #E2E8F0"
                        borderRadius="4px 16px 16px 16px"
                        bg="white"
                        p={{ base: 4, md: 5 }}
                        boxShadow="0 8px 24px rgba(15,23,42,.045)"
                      >
                        <Flex align="center" justify="space-between" gap={3} mb={3}>
                          <Box>
                            <Text fontSize="12px" fontWeight={800} color="#0F172A">
                              {sceneMeta.assistantTitle}
                            </Text>
                            <Text mt={0.5} fontSize="9px" color="#94A3B8">
                              已理解{sceneMeta.label}任务并完成所选技能调用
                            </Text>
                          </Box>
                          {turn.phase === 'running' ? (
                            <HStack color="#D97706" spacing={1.5}>
                              <Spinner size="xs" />
                              <Text fontSize="9px">生成中</Text>
                            </HStack>
                          ) : (
                            <HStack color="#047857" spacing={1.5}>
                              <Check size={12} />
                              <Text fontSize="9px">已完成</Text>
                            </HStack>
                          )}
                        </Flex>
                        <Text fontSize="12px" color="#475569" lineHeight="1.75" mb={4}>
                          {turn.run.summary}
                        </Text>
                        <SkillInvocationCard
                          invocations={turn.run.invocations}
                          isRunning={turn.phase === 'running'}
                        />
                        {turn.phase === 'completed' && turn.run.artifacts.length > 0 && (
                          <Box mt={4}>
                            <Text mb={2.5} fontSize="11px" fontWeight={800} color="#334155">
                              生成产物
                            </Text>
                            <ArtifactPanel
                              artifacts={turn.run.artifacts}
                              onPreview={handlePreview}
                              compact
                            />
                          </Box>
                        )}
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            ) : (
              <Flex
                h="100%"
                minH="320px"
                direction="column"
                align="center"
                justify="center"
                textAlign="center"
                px={6}
              >
                <Flex
                  w="58px"
                  h="58px"
                  borderRadius="18px"
                  bg="#FFF1F0"
                  color={PRIMARY}
                  align="center"
                  justify="center"
                  boxShadow="0 10px 24px rgba(200,0,11,.10)"
                >
                  <Sparkles size={25} />
                </Flex>
                <Text mt={4} fontSize="16px" fontWeight={900} color="#0F172A">
                  开始新的{sceneMeta.label}对话
                </Text>
                <Text mt={2} maxW="420px" fontSize="11px" color="#64748B" lineHeight="1.7">
                  选择一个技能，并按需添加模式、专家或文件，系统将生成可直接预览的
                  {activeScene === 'campus' ? '校园事务处理结果。' : '教学产物。'}
                </Text>
              </Flex>
            )}
          </Box>

          <Box px={{ base: 3, md: 5 }} pb={{ base: 3, md: 4 }} pt={2} bg="white">
            <Box
              border="1px solid #DCE3EA"
              borderRadius="15px"
              bg="white"
              boxShadow="0 8px 28px rgba(15,23,42,.07)"
              overflow="hidden"
              _focusWithin={{ borderColor: '#EAA3A7', boxShadow: FOCUS_RING }}
            >
              <Textarea
                aria-label={activeScene === 'campus' ? '描述校园管理任务' : '描述教学任务'}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={sceneMeta.inputPlaceholder}
                minH="72px"
                maxH="150px"
                resize="none"
                border="none"
                borderRadius={0}
                px={4}
                py={3}
                fontSize="12px"
                color="#1E293B"
                _placeholder={{ color: '#94A3B8' }}
                _focusVisible={{ boxShadow: 'none' }}
              />
              <Box px={3}>
                <WorkspaceContextChips
                  skill={selectedSkill}
                  attachments={attachments}
                  onRemoveSkill={() => setSelectedSkill(null)}
                  onRemoveAttachment={(id) =>
                    setAttachments((current) => current.filter((item) => item.id !== id))
                  }
                />
              </Box>
              <Flex px={3} pb={3} align="center" justify="space-between" gap={3} wrap="wrap">
                <Flex align="center" gap={1.5} wrap="wrap">
                  <WorkspaceContextControls
                    skill={selectedSkill}
                    mode={selectedMode}
                    expert={selectedExpert}
                    skillOptions={getWorkspaceSkillsForScene(activeScene)}
                    expertOptions={sceneExperts}
                    skillMenuLabel={sceneMeta.skillMenuLabel}
                    onFiles={handleFiles}
                    onSelectSkill={handleSkillSelect}
                    onSelectMode={setSelectedMode}
                    onSelectExpert={setSelectedExpert}
                    onRemoveMode={() => setSelectedMode(null)}
                    onRemoveExpert={() => setSelectedExpert(null)}
                  />
                  <IconButton
                    type="button"
                    aria-label="语音输入"
                    icon={<Mic size={15} />}
                    size="sm"
                    variant="ghost"
                    color="#64748B"
                    onClick={() =>
                      toast({ title: '语音入口为 Mock 演示', status: 'info', duration: 1300 })
                    }
                  />
                </Flex>
                <Button
                  type="button"
                  ml="auto"
                  h="34px"
                  px={4}
                  borderRadius="10px"
                  bg="linear-gradient(135deg,#C8000B,#E52531)"
                  color="white"
                  leftIcon={isGenerating ? <Spinner size="xs" /> : <Send size={14} />}
                  fontSize="11px"
                  isDisabled={!inputValue.trim() || isGenerating}
                  _hover={{ bg: 'linear-gradient(135deg,#A50008,#C8000B)' }}
                  _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
                  onClick={handleSend}
                >
                  {isGenerating ? '生成中' : '发送任务'}
                </Button>
              </Flex>
            </Box>
            <Text mt={2} textAlign="center" fontSize="9px" color="#94A3B8">
              {activeScene === 'campus'
                ? '内容由校园管理智能体基于 Mock 数据生成，请结合现行制度与实际审批流程复核'
                : '内容由教学智能体 Mock 生成，请结合课程标准审核使用'}
            </Text>
          </Box>
        </Flex>

        <Box
          display={{ base: 'none', xl: 'block' }}
          minH={0}
          overflowY="auto"
          bg="rgba(255,255,255,.90)"
          border="1px solid #E2E8F0"
          borderRadius="16px"
          p={4}
          boxShadow="0 10px 30px rgba(15,23,42,.04)"
        >
          <Flex align="center" justify="space-between" mb={4}>
            <Box>
              <Text fontSize="13px" fontWeight={800} color="#0F172A">
                本次生成产物
              </Text>
              <Text mt={0.5} fontSize="10px" color="#94A3B8">
                可直接打开交互预览
              </Text>
            </Box>
            <Text fontSize="10px" color={PRIMARY} bg="#FFF1F0" px={2.5} py={1} borderRadius="full">
              {activeArtifacts.length} 项
            </Text>
          </Flex>
          <ArtifactPanel artifacts={activeArtifacts} onPreview={handlePreview} />
        </Box>
      </Grid>

      <Drawer
        isOpen={historyDrawer.isOpen}
        placement="left"
        onClose={historyDrawer.onClose}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton aria-label="关闭历史会话" />
          <DrawerHeader fontSize="15px" borderBottom="1px solid #E2E8F0">
            智能工作对话历史
          </DrawerHeader>
          <DrawerBody py={4}>
            <ChatHistoryPanel
              conversations={conversationSummaries}
              activeId={activeConversationId}
              onSelect={handleConversationSelect}
              onCreate={handleCreateConversation}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Drawer
        isOpen={artifactDrawer.isOpen}
        placement="right"
        onClose={artifactDrawer.onClose}
        size="sm"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton aria-label="关闭生成产物" />
          <DrawerHeader fontSize="15px" borderBottom="1px solid #E2E8F0">
            本次生成产物
          </DrawerHeader>
          <DrawerBody py={4}>
            <ArtifactPanel artifacts={activeArtifacts} onPreview={handlePreview} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <ArtifactPreviewModal
        artifact={previewArtifact}
        isOpen={previewModal.isOpen}
        onClose={previewModal.onClose}
      />

      <Box
        position="absolute"
        w="1px"
        h="1px"
        overflow="hidden"
        clip="rect(0 0 0 0)"
        aria-live="polite"
      >
        {isGenerating
          ? `正在调用${sceneMeta.label}技能`
          : `技能调用完成，生成 ${activeArtifacts.length} 项产物`}
      </Box>
    </Box>
  );
}
