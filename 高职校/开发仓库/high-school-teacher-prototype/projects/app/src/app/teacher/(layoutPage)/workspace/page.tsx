'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenText,
  Building2,
  CalendarDays,
  ChevronDown,
  FileText,
  ListChecks,
  MessageCircle,
  Mic,
  MonitorPlay,
  Network,
  Send,
  ShoppingCart,
  Wrench,
  Workflow
} from 'lucide-react';
import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  IconButton,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/react';
import { useAuth } from '@/app/components/auth/AuthProvider';
import {
  WorkspaceContextChips,
  WorkspaceContextControls,
  type WorkspaceAttachment
} from './components/WorkspaceContextControls';
import {
  DEFAULT_WORKSPACE_SKILL,
  WORKSPACE_SCENE_SKILLS,
  createPrepChatUrl,
  getWorkspaceExpertsForScene,
  getWorkspaceQuickTagsForScene,
  getWorkspaceSceneMeta,
  getWorkspaceSkillPrompt,
  getWorkspaceSkillScene,
  getWorkspaceSkillsForScene,
  getWorkspaceToolsForScene,
  type WorkspaceExpertKey,
  type WorkspaceModeKey,
  type WorkspaceScene,
  type WorkspaceSkillKey,
  type WorkspaceTool,
  type WorkspaceToolKey
} from './workbuddyConfig';

const PRIMARY = '#C8000B';
const PRIMARY_DARK = '#A50008';
const PRIMARY_SOFT = '#FFF0EE';
const FOCUS_RING = '0 0 0 3px rgba(200, 0, 11, 0.18)';

function AssistantRobot() {
  return (
    <Box
      as="svg"
      aria-hidden="true"
      w={{ base: '84px', md: '96px' }}
      h={{ base: '84px', md: '96px' }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 120 120"
      color="#334155"
      filter="drop-shadow(0 4px 8px rgba(15, 23, 42, 0.08))"
      transition="transform 0.3s ease"
      _hover={{ transform: 'scale(1.04)' }}
    >
      <line strokeLinecap="round" strokeWidth="2.5" x1="60" x2="60" y1="28" y2="14" />
      <circle cx="60" cy="12" fill="white" r="3.5" strokeWidth="2" />
      <path d="M48 20 Q40 10 32 18" strokeLinecap="round" strokeWidth="2" />
      <path d="M72 20 Q80 10 88 18" strokeLinecap="round" strokeWidth="2" />
      <rect fill="#F8FAFC" height="42" rx="16" strokeWidth="2.5" width="48" x="36" y="28" />
      <rect fill="white" height="18" rx="3" strokeWidth="2" width="6" x="30" y="40" />
      <rect fill="white" height="18" rx="3" strokeWidth="2" width="6" x="84" y="40" />
      <rect fill="white" height="26" rx="8" strokeWidth="2" width="36" x="42" y="36" />
      <line
        stroke={PRIMARY}
        strokeLinecap="round"
        strokeWidth="3"
        x1="49"
        x2="55"
        y1="46"
        y2="46"
      />
      <line
        stroke={PRIMARY}
        strokeLinecap="round"
        strokeWidth="3"
        x1="65"
        x2="71"
        y1="46"
        y2="46"
      />
      <path d="M54 54 Q60 58 66 54" stroke={PRIMARY} strokeLinecap="round" strokeWidth="2" />
      <rect fill="#F8FAFC" height="26" rx="8" strokeWidth="2" width="32" x="44" y="74" />
      <line strokeDasharray="2 2" strokeWidth="1.5" x1="48" x2="72" y1="84" y2="84" />
      <line strokeDasharray="2 2" strokeWidth="1.5" x1="48" x2="72" y1="90" y2="90" />
      <circle cx="60" cy="80" fill={PRIMARY} r="2.5" stroke="none" />
      <path
        d="M44 80 L32 88 L34 98 L44 94"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M76 80 L88 88 L86 98 L76 94"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M38 100 Q48 105 60 105 Q72 105 82 100" strokeLinecap="round" strokeWidth="2.5" />
    </Box>
  );
}

function ToolIcon({ toolKey }: { toolKey: WorkspaceToolKey }) {
  const props = { size: 21, strokeWidth: 2 };
  if (toolKey === 'outline') return <FileText {...props} />;
  if (toolKey === 'lesson') return <BookOpenText {...props} />;
  if (toolKey === 'practice') return <ListChecks {...props} />;
  if (toolKey === 'school-affairs') return <Building2 {...props} />;
  if (toolKey === 'procurement') return <ShoppingCart {...props} />;
  if (toolKey === 'logistics') return <Wrench {...props} />;
  if (toolKey === 'meeting') return <CalendarDays {...props} />;
  return <Network {...props} />;
}

function ToolCard({
  tool,
  isReflection,
  onClick
}: {
  tool: WorkspaceTool;
  isReflection?: boolean;
  onClick?: () => void;
}) {
  return (
    <Flex
      as={isReflection ? 'div' : 'button'}
      type={isReflection ? undefined : 'button'}
      align="center"
      gap={3}
      minW={0}
      p={3}
      textAlign="left"
      bg="rgba(255, 255, 255, 0.94)"
      border="1px solid"
      borderColor="#E2E8F0"
      borderRadius="13px"
      boxShadow={isReflection ? 'none' : '0 2px 8px rgba(15, 23, 42, 0.035)'}
      cursor={isReflection ? 'default' : 'pointer'}
      transition="transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
      onClick={onClick}
      _hover={
        isReflection
          ? undefined
          : {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
              borderColor: '#CBD5E1'
            }
      }
      _focusVisible={isReflection ? undefined : { outline: 'none', boxShadow: FOCUS_RING }}
    >
      <Flex
        w="40px"
        h="40px"
        flexShrink={0}
        align="center"
        justify="center"
        borderRadius="10px"
        bg={tool.background}
        color={tool.color}
      >
        <ToolIcon toolKey={tool.key} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="12px" lineHeight="18px" fontWeight={700} color="#1E293B" noOfLines={1}>
          {tool.title}
        </Text>
        <Text fontSize="11px" lineHeight="17px" color="#94A3B8" noOfLines={1}>
          {tool.description}
        </Text>
      </Box>
    </Flex>
  );
}

function SceneButton({
  active,
  children,
  icon,
  onClick,
  contained
}: {
  active: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  contained?: boolean;
}) {
  return (
    <Button
      type="button"
      aria-pressed={active}
      size="sm"
      h="34px"
      minW="auto"
      px={contained ? 4 : 2.5}
      gap={1.5}
      borderRadius={contained ? 'full' : '9px'}
      border={contained && !active ? '1px solid transparent' : 'none'}
      bg={active ? PRIMARY : 'transparent'}
      color={active ? 'white' : '#64748B'}
      fontSize="12px"
      fontWeight={active ? 700 : 500}
      boxShadow={active ? '0 4px 12px rgba(200, 0, 11, 0.18)' : 'none'}
      onClick={onClick}
      _hover={{
        bg: active ? PRIMARY_DARK : contained ? 'whiteAlpha.800' : PRIMARY_SOFT,
        color: active ? 'white' : PRIMARY
      }}
      _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
    >
      {icon}
      {children}
    </Button>
  );
}

export default function WorkspacePage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(getWorkspaceSkillPrompt(DEFAULT_WORKSPACE_SKILL));
  const [selectedSkill, setSelectedSkill] = useState<WorkspaceSkillKey | null>(
    DEFAULT_WORKSPACE_SKILL
  );
  const [selectedMode, setSelectedMode] = useState<WorkspaceModeKey | null>('plan');
  const [selectedExpert, setSelectedExpert] = useState<WorkspaceExpertKey | null>(null);
  const [activeScene, setActiveScene] = useState<WorkspaceScene>('daily');
  const [attachments, setAttachments] = useState<WorkspaceAttachment[]>([]);

  const displayName = useMemo(() => user?.name || '教师', [user?.name]);
  const sceneMeta = getWorkspaceSceneMeta(activeScene);
  const sceneTools = getWorkspaceToolsForScene(activeScene);
  const quickTags = getWorkspaceQuickTagsForScene(activeScene);
  const sceneExperts = getWorkspaceExpertsForScene(activeScene);

  const selectWorkspaceSkill = (skill: WorkspaceSkillKey, addition?: string) => {
    const nextScene = getWorkspaceSkillScene(skill);
    if (nextScene !== activeScene) setSelectedExpert(null);
    setSelectedSkill(skill);
    setActiveScene(nextScene);
    setPrompt(`${getWorkspaceSkillPrompt(skill)}${addition ? `\n\n补充要求：${addition}。` : ''}`);
  };

  const handleToolSelect = (tool: WorkspaceTool) => {
    selectWorkspaceSkill(tool.skill);
    toast({
      title: `已切换到「${tool.title}」`,
      description: '示例任务已填入输入框，可继续编辑。',
      status: 'info',
      duration: 1600,
      position: 'top'
    });
  };

  const handleSceneSelect = (scene: WorkspaceScene) => {
    const skill = WORKSPACE_SCENE_SKILLS[scene][0];
    setActiveScene(scene);
    setPrompt(getWorkspaceSkillPrompt(skill));
    setSelectedSkill(skill);
    setSelectedExpert(null);
  };

  const handleQuickTag = (label: string, skill: WorkspaceSkillKey) => {
    selectWorkspaceSkill(skill, label);
  };

  const handleSend = () => {
    if (attachments.length) {
      window.localStorage.setItem(
        'common_chat_attachments',
        JSON.stringify(
          attachments.map((attachment) => ({
            fileName: attachment.name,
            fileKey: `mock/${attachment.name}`,
            fileUrl: '',
            fileSize: attachment.size
          }))
        )
      );
    }
    router.push(
      createPrepChatUrl(prompt, {
        skill: selectedSkill,
        mode: selectedMode,
        expert: selectedExpert,
        scene: activeScene
      })
    );
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
      duration: 1600,
      position: 'top'
    });
  };

  return (
    <Box
      minH="calc(100vh - 64px)"
      color="#1E293B"
      display="flex"
      flexDirection="column"
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
        as="main"
        id="teacher-workspace-main"
        flex="1"
        direction="column"
        align="center"
        w="100%"
        maxW="1080px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        pt={{ base: 6, md: 7 }}
        pb={{ base: 8, md: 10 }}
      >
        <Flex
          as="section"
          direction="column"
          align="center"
          textAlign="center"
          mb={{ base: 5, md: 6 }}
        >
          <Box
            position="relative"
            w={{ base: '92px', md: '108px' }}
            h={{ base: '92px', md: '108px' }}
            mb={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box
              position="absolute"
              inset={0}
              bg="rgba(255, 214, 208, 0.58)"
              borderRadius="full"
              filter="blur(22px)"
            />
            <Box position="relative">
              <AssistantRobot />
            </Box>
          </Box>
          <Flex align="center" justify="center" gap={2} wrap="wrap">
            <Text
              as="h1"
              fontSize={{ base: '23px', md: '28px' }}
              lineHeight="1.25"
              fontWeight={800}
              letterSpacing="-0.02em"
              color="#0F172A"
            >
              {activeScene === 'campus' ? '智慧校园，事务一站协同' : '智能备课，智连万象'}
            </Text>
            <Text aria-hidden="true" fontSize="20px" transform="rotate(-10deg)">
              🔍
            </Text>
          </Flex>
          <Text
            mt={1.5}
            fontSize={{ base: '11px', md: '12px' }}
            color="#94A3B8"
            letterSpacing="0.04em"
          >
            {activeScene === 'campus'
              ? '贯通校务、采购、后勤与会议 · 校园事务智能流转'
              : '连通产教融合资源库 · 45 分钟精品教学闭环秒级推演生成'}
          </Text>
        </Flex>

        <Box
          as="section"
          aria-label={activeScene === 'campus' ? '校园管理智能体能力' : '智能备课能力'}
          w="100%"
          maxW="900px"
          mb={{ base: 5, md: 3 }}
          position="relative"
        >
          <Grid
            templateColumns={{
              base: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))'
            }}
            gap={3}
            position="relative"
            zIndex={1}
          >
            {sceneTools.map((tool) => (
              <ToolCard key={tool.key} tool={tool} onClick={() => handleToolSelect(tool)} />
            ))}
          </Grid>

          <Grid
            aria-hidden="true"
            templateColumns="repeat(4, minmax(0, 1fr))"
            gap={3}
            mt={1}
            maxH="52px"
            overflow="hidden"
            transform="scaleY(-1)"
            transformOrigin="top"
            opacity={0.2}
            filter="blur(1.2px)"
            pointerEvents="none"
            display={{ base: 'none', lg: 'grid' }}
            sx={{
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0.28), transparent 78%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.28), transparent 78%)'
            }}
          >
            {sceneTools.map((tool) => (
              <ToolCard key={`reflection-${tool.key}`} tool={tool} isReflection />
            ))}
          </Grid>
        </Box>

        <Flex
          as="section"
          aria-label="工作台场景"
          align="center"
          justify="center"
          gap={{ base: 1, sm: 4, md: 6 }}
          mb={5}
          w="100%"
          overflowX="auto"
          sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
        >
          <Flex
            p={1}
            borderRadius="full"
            bg="rgba(226, 232, 240, 0.72)"
            border="1px solid rgba(203, 213, 225, 0.55)"
            gap={1}
            flexShrink={0}
          >
            <SceneButton
              active={activeScene === 'daily'}
              contained
              icon={<MonitorPlay size={14} />}
              onClick={() => handleSceneSelect('daily')}
            >
              日程备课
            </SceneButton>
            <SceneButton
              active={activeScene === 'work-order'}
              contained
              icon={<Workflow size={14} />}
              onClick={() => handleSceneSelect('work-order')}
            >
              实训工单
            </SceneButton>
            <SceneButton
              active={activeScene === 'campus'}
              contained
              icon={<Building2 size={14} />}
              onClick={() => handleSceneSelect('campus')}
            >
              校园管理
            </SceneButton>
          </Flex>
        </Flex>

        <Box
          as="section"
          aria-label={activeScene === 'campus' ? '快捷校园管理能力' : '快捷备课能力'}
          w="100%"
          maxW="960px"
          mb={4}
          overflowX="auto"
          pb={1}
          sx={{ scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
        >
          <HStack
            spacing={2}
            minW="max-content"
            justify={{ base: 'flex-start', lg: 'center' }}
            px={1}
          >
            {quickTags.map((item) => {
              const selected = selectedSkill === item.skill && prompt.includes(item.label);
              return (
                <Button
                  key={item.label}
                  type="button"
                  aria-pressed={selected}
                  size="xs"
                  h="30px"
                  px={3}
                  gap={1.5}
                  borderRadius="full"
                  bg={selected ? PRIMARY_SOFT : '#F1F5F9'}
                  color={selected ? PRIMARY : '#475569'}
                  border="1px solid"
                  borderColor={selected ? '#FDDBD6' : '#E2E8F0'}
                  fontSize="11px"
                  fontWeight={500}
                  onClick={() => handleQuickTag(item.label, item.skill)}
                  _hover={{
                    bg: selected ? '#FFE9E6' : '#E2E8F0',
                    color: selected ? PRIMARY_DARK : '#1E293B'
                  }}
                  _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
                >
                  <Text as="span" aria-hidden="true">
                    {item.icon}
                  </Text>
                  {item.label}
                </Button>
              );
            })}
          </HStack>
        </Box>

        <Box
          as="section"
          aria-label={activeScene === 'campus' ? '校园管理输入器' : '智能备课输入器'}
          w="100%"
          maxW="960px"
        >
          <Box
            as="form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
            bg="rgba(255, 255, 255, 0.96)"
            backdropFilter="blur(12px)"
            borderRadius={{ base: '16px', md: '18px' }}
            border="1px solid #E2E8F0"
            boxShadow="0 16px 40px -10px rgba(124, 58, 237, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.04)"
            p={{ base: 3.5, md: 4 }}
            transition="border-color 0.2s ease, box-shadow 0.2s ease"
            _focusWithin={{
              borderColor: '#F0A0A6',
              boxShadow:
                '0 16px 40px -10px rgba(200, 0, 11, 0.10), 0 0 0 4px rgba(200, 0, 11, 0.06)'
            }}
          >
            <Textarea
              aria-label={activeScene === 'campus' ? '校园管理任务描述' : '备课任务描述'}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={sceneMeta.inputPlaceholder}
              minH={{ base: '112px', md: '92px' }}
              resize="vertical"
              border="none"
              p={0}
              bg="transparent"
              color="#1E293B"
              fontSize={{ base: '13px', md: '14px' }}
              lineHeight="1.75"
              letterSpacing="0.01em"
              _placeholder={{ color: '#94A3B8' }}
              _focusVisible={{ boxShadow: 'none' }}
            />

            <WorkspaceContextChips
              skill={selectedSkill}
              attachments={attachments}
              onRemoveSkill={() => setSelectedSkill(null)}
              onRemoveAttachment={(id) =>
                setAttachments((current) => current.filter((item) => item.id !== id))
              }
            />

            <Flex
              pt={3}
              mt={1}
              borderTop="1px solid #F1F5F9"
              align="center"
              justify="space-between"
              gap={3}
              wrap="wrap"
            >
              <WorkspaceContextControls
                skill={selectedSkill}
                mode={selectedMode}
                expert={selectedExpert}
                skillOptions={getWorkspaceSkillsForScene(activeScene)}
                expertOptions={sceneExperts}
                skillMenuLabel={sceneMeta.skillMenuLabel}
                onFiles={handleFiles}
                onSelectSkill={(skill) => selectWorkspaceSkill(skill)}
                onSelectMode={setSelectedMode}
                onSelectExpert={setSelectedExpert}
                onRemoveMode={() => setSelectedMode(null)}
                onRemoveExpert={() => setSelectedExpert(null)}
              />

              <Flex align="center" gap={2} ml="auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  h="30px"
                  px={2}
                  leftIcon={<MessageCircle size={14} />}
                  rightIcon={<ChevronDown size={12} />}
                  fontSize="11px"
                  color="#64748B"
                  _hover={{ bg: PRIMARY_SOFT, color: PRIMARY }}
                  _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
                >
                  {displayName}的工作空间
                </Button>
                <IconButton
                  type="button"
                  aria-label="语音描述备课目标"
                  icon={<Mic size={16} />}
                  size="sm"
                  w="32px"
                  h="32px"
                  minW="32px"
                  borderRadius="full"
                  variant="ghost"
                  color="#94A3B8"
                  _hover={{ bg: PRIMARY_SOFT, color: PRIMARY }}
                  _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
                  onClick={() =>
                    toast({
                      title: '语音输入为原型演示入口',
                      status: 'info',
                      duration: 1400,
                      position: 'top'
                    })
                  }
                />
                <IconButton
                  type="submit"
                  aria-label="一键启动生成"
                  icon={<Send size={16} />}
                  w="34px"
                  h="34px"
                  minW="34px"
                  borderRadius="9px"
                  color="white"
                  bg={`linear-gradient(135deg, ${PRIMARY} 0%, #E52531 100%)`}
                  boxShadow="0 5px 18px rgba(200, 0, 11, 0.30)"
                  transform="rotate(-2deg)"
                  transition="transform 0.2s ease, box-shadow 0.2s ease"
                  _hover={{
                    transform: 'rotate(-2deg) scale(1.06)',
                    boxShadow: '0 7px 22px rgba(200, 0, 11, 0.38)'
                  }}
                  _active={{ transform: 'rotate(-2deg) scale(0.96)' }}
                  _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
                />
              </Flex>
            </Flex>
          </Box>

          <Text textAlign="center" mt={3} fontSize="10px" color="#94A3B8" letterSpacing="0.03em">
            {activeScene === 'campus'
              ? '内容由校园管理智能体基于 Mock 数据生成，请结合学校现行制度与实际审批流程复核'
              : '内容由高校与职教教学智能体生成，生成教案仅供教学参考，请结合专业教学大纲审核使用'}
          </Text>
        </Box>
      </Flex>

      <Flex
        as="footer"
        w="100%"
        borderTop="1px solid rgba(226, 232, 240, 0.72)"
        bg="rgba(255, 255, 255, 0.68)"
        backdropFilter="blur(10px)"
        px={{ base: 4, md: 6 }}
        py={2.5}
      >
        <Flex
          maxW="1120px"
          w="100%"
          mx="auto"
          align="center"
          justify="space-between"
          gap={3}
          wrap="wrap"
        >
          <Flex align="center" gap={2} minW={0}>
            <Text fontSize="11px" color="#94A3B8" whiteSpace="nowrap">
              {activeScene === 'campus' ? '最近校园任务：' : '最近备课草稿：'}
            </Text>
            <Button
              type="button"
              variant="link"
              color="#334155"
              fontSize="11px"
              fontWeight={600}
              noOfLines={1}
              textDecoration="none"
              _hover={{ color: PRIMARY, textDecoration: 'underline' }}
              _focusVisible={{ outline: 'none', boxShadow: FOCUS_RING }}
              onClick={() => {
                if (activeScene === 'campus') {
                  selectWorkspaceSkill('procurement');
                  return;
                }
                setPrompt('继续完善《工业机器人离线示教编程》第四章：圆弧插补与姿态平滑备课草稿。');
              }}
            >
              {activeScene === 'campus'
                ? '新能源实训设备采购合规自查任务'
                : '《工业机器人离线示教编程》第四章 · 圆弧插补与姿态平滑.cwk'}
            </Button>
            <Text
              px={1.5}
              py="2px"
              bg="#F1F5F9"
              color="#64748B"
              fontSize="9px"
              borderRadius="5px"
              whiteSpace="nowrap"
              display={{ base: 'none', md: 'block' }}
            >
              10 分钟前更新
            </Text>
          </Flex>
          <HStack spacing={3} color="#94A3B8" display={{ base: 'none', lg: 'flex' }}>
            <Text fontSize="10px">
              {activeScene === 'campus' ? '校务制度与办理流程库就绪' : '多模态素材库就绪'}
            </Text>
            <Text>·</Text>
            <Text fontSize="10px">
              {activeScene === 'campus'
                ? '校园管理引擎 · Mock Agent 3.5'
                : '教学法引擎 · Mock Agent 3.5'}
            </Text>
          </HStack>
        </Flex>
      </Flex>
    </Box>
  );
}
