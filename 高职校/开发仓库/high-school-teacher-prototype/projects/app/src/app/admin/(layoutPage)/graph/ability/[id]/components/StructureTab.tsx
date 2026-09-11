'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Progress,
  Select,
  Stack,
  Tag,
  Text,
  Textarea,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  AddIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DeleteIcon,
  SearchIcon,
  WarningIcon
} from '@chakra-ui/icons';
import { AdminIcon } from '@/app/admin/components/AdminIcon';
import {
  validateWeights,
  withAbilityAdded,
  withKnowledgeAdded,
  withNodeMoved,
  withNodeRemoved,
  withNodeUpdated
} from '../../_mock/store';
import type {
  Ability,
  AbilityGraph,
  AbilityKnowledge,
  JobTask,
  Mastery,
  NodeStatus
} from '../../_mock/types';

const ACCENT = '#C8000B';
const ACCENT_SOFT = '#FFF1F0';

type SelectedNode =
  | { level: 'task'; task: JobTask }
  | { level: 'ability'; task: JobTask; ability: Ability }
  | { level: 'knowledge'; task: JobTask; ability: Ability; knowledge: AbilityKnowledge };

function findSelected(tasks: JobTask[], code: string | null): SelectedNode | null {
  if (!code) return null;
  for (const task of tasks) {
    if (task.code === code) return { level: 'task', task };
    for (const ability of task.abilities) {
      if (ability.code === code) return { level: 'ability', task, ability };
      for (const knowledge of ability.knowledges) {
        if (knowledge.code === code) return { level: 'knowledge', task, ability, knowledge };
      }
    }
  }
  return null;
}

function nodeStatusTag(status: NodeStatus) {
  if (status === 'new') return <Tag size="sm" colorScheme="green" flexShrink={0}>新</Tag>;
  if (status === 'deprecated') return <Tag size="sm" colorScheme="gray" flexShrink={0}>废弃</Tag>;
  return null;
}

type Props = {
  graph: AbilityGraph;
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
  mutate: (fn: (g: AbilityGraph) => AbilityGraph) => void;
  addTask: (name: string) => void;
  createMode?: boolean;
};

export default function StructureTab({ graph, selectedCode, onSelect, mutate, addTask, createMode }: Props) {
  const toast = useToast();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'deprecated'>('all');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [pendingDelete, setPendingDelete] = useState<{ code: string; name: string; hard: boolean } | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);

  const weightIssues = useMemo(() => validateWeights(graph.tasks), [graph.tasks]);
  const issueByAbility = useMemo(
    () => new Map(weightIssues.map((i) => [i.abilityCode, i])),
    [weightIssues]
  );
  const selected = useMemo(
    () => findSelected(graph.tasks, selectedCode),
    [graph.tasks, selectedCode]
  );

  const kw = keyword.trim();
  const matchesKeyword = (code: string, name: string) => !kw || `${code} ${name}`.includes(kw);
  const matchesStatus = (status: NodeStatus) => statusFilter === 'all' || status === statusFilter;

  const taskVisible = (t: JobTask) => {
    const selfHit = matchesKeyword(t.code, t.name) && matchesStatus(t.status);
    const childHit = t.abilities.some(
      (a) =>
        (matchesKeyword(a.code, a.name) && matchesStatus(a.status)) ||
        a.knowledges.some((k) => matchesKeyword(k.code, k.name) && matchesStatus(k.status))
    );
    return selfHit || childHit;
  };
  const abilityVisible = (a: Ability) => {
    const selfHit = matchesKeyword(a.code, a.name) && matchesStatus(a.status);
    const childHit = a.knowledges.some((k) => matchesKeyword(k.code, k.name) && matchesStatus(k.status));
    return selfHit || childHit;
  };
  const knowledgeVisible = (k: AbilityKnowledge) =>
    matchesKeyword(k.code, k.name) && matchesStatus(k.status);

  const toggle = (code: string) => setCollapsed((prev) => ({ ...prev, [code]: !prev[code] }));

  const confirmDelete = () => {
    if (!pendingDelete) return;
    mutate((g) => withNodeRemoved(g, pendingDelete.code));
    if (selectedCode === pendingDelete.code) onSelect(null);
    toast({
      title: pendingDelete.hard ? '已删除该新增节点' : '已标记废弃，将进入下次发布的废弃清单',
      status: pendingDelete.hard ? 'info' : 'warning',
      duration: 2500,
      position: 'top'
    });
    setPendingDelete(null);
  };

  // ---- 空态引导（手工搭建首节点）----
  if (graph.tasks.length === 0) {
    return (
      <Flex
        bg="white"
        rounded="24px"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        p={12}
        direction="column"
        align="center"
        gap={4}
      >
        <Flex w="64px" h="64px" rounded="20px" bg={ACCENT_SOFT} color={ACCENT} align="center" justify="center">
          <AdminIcon name="sparkles" style={{ width: 30, height: 30 }} />
        </Flex>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          先创建第一个任务
        </Text>
        <Text fontSize="sm" color="gray.500" textAlign="center" maxW="420px">
          岗位能力图谱按「任务 → 能力 → 知识点」分层组织。任务是该岗位的一项核心工作范畴，例如「动力电池认知」「高压安全」。
        </Text>
        <HStack mt={2}>
          <Input
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="任务名称，如：电池系统检修"
            w="280px"
            rounded="12px"
          />
          <Button
            bg={ACCENT}
            color="white"
            rounded="12px"
            _hover={{ bg: '#A80009' }}
            isDisabled={!newTaskName.trim()}
            onClick={() => addTask(newTaskName.trim())}
          >
            创建任务
          </Button>
        </HStack>
        {createMode && (
          <Text fontSize="xs" color="orange.500">
            创建前请先在页头填写岗位名称
          </Text>
        )}
      </Flex>
    );
  }

  return (
    <>
      <Grid templateColumns={{ base: '1fr', xl: '280px 1fr 300px' }} gap={4} alignItems="start">
        {/* 左栏：树导航 */}
        <Box bg="white" rounded="20px" borderWidth="1px" borderColor="blackAlpha.100" overflow="hidden">
          <Flex px={3.5} py={3} borderBottom="1px solid" borderColor="gray.100" align="center" justify="space-between">
            <Text fontWeight={700} fontSize="sm" color="gray.800">
              能力结构树
            </Text>
            <Button
              size="xs"
              variant="ghost"
              color={ACCENT}
              leftIcon={<AddIcon boxSize={2.5} />}
              onClick={() => addTask('新任务')}
            >
              任务
            </Button>
          </Flex>
          <Box px={3.5} py={2.5} borderBottom="1px solid" borderColor="gray.100">
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" boxSize={3.5} />
              </InputLeftElement>
              <Input
                placeholder="搜索编码 / 名称…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </InputGroup>
            <Select
              size="sm"
              mt={2}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'new' | 'deprecated')}
            >
              <option value="all">全部状态</option>
              <option value="new">仅新增</option>
              <option value="deprecated">仅已废弃</option>
            </Select>
          </Box>
          <VStack as="div" align="stretch" spacing={0} p={2} maxH="calc(100vh - 360px)" minH="320px" overflowY="auto">
            {graph.tasks.filter(taskVisible).map((task) => {
              const taskCollapsed = (collapsed[task.code] ?? false) && !kw;
              return (
                <Box key={task.code}>
                  <TreeRow
                    depth={0}
                    code={task.code}
                    name={task.name}
                    status={task.status}
                    selected={selectedCode === task.code}
                    collapsed={taskCollapsed}
                    hasChildren={task.abilities.length > 0}
                    onToggle={() => toggle(task.code)}
                    onSelect={() => onSelect(task.code)}
                    onAdd={() => {
                      mutate((g) => withAbilityAdded(g, task.code, '新能力'));
                    }}
                    addLabel="能力"
                  />
                  {!taskCollapsed &&
                    task.abilities.filter(abilityVisible).map((ability) => {
                      const abilityCollapsed = (collapsed[ability.code] ?? false) && !kw;
                      const issue = issueByAbility.get(ability.code);
                      return (
                        <Box key={ability.code}>
                          <TreeRow
                            depth={1}
                            code={ability.code}
                            name={ability.name}
                            status={ability.status}
                            selected={selectedCode === ability.code}
                            collapsed={abilityCollapsed}
                            hasChildren={ability.knowledges.length > 0}
                            onToggle={() => toggle(ability.code)}
                            onSelect={() => onSelect(ability.code)}
                            onAdd={() => {
                              mutate((g) => withKnowledgeAdded(g, ability.code, '新知识点'));
                            }}
                            addLabel="知识点"
                            warn={issue ? `权重 ${issue.sum}%` : undefined}
                          />
                          {!abilityCollapsed &&
                            ability.knowledges.filter(knowledgeVisible).map((k) => (
                              <TreeRow
                                key={k.code}
                                depth={2}
                                code={k.code}
                                name={k.name}
                                status={k.status}
                                selected={selectedCode === k.code}
                                collapsed={false}
                                hasChildren={false}
                                onToggle={() => {}}
                                onSelect={() => onSelect(k.code)}
                                weight={k.weight}
                              />
                            ))}
                        </Box>
                      );
                    })}
                </Box>
              );
            })}
          </VStack>
        </Box>

        {/* 中栏：节点编辑器 */}
        <Box bg="white" rounded="20px" borderWidth="1px" borderColor="blackAlpha.100" p={5} minH="480px">
          {!selected ? (
            <Flex direction="column" align="center" justify="center" h="440px" gap={2}>
              <AdminIcon name="sliders" style={{ width: 26, height: 26, color: '#CBD5E0' }} />
              <Text fontSize="sm" color="gray.400">
                从左侧选择节点进行编辑
              </Text>
            </Flex>
          ) : (
            <NodeEditor
              key={selectedCode}
              node={selected}
              onUpdate={(patch) => mutate((g) => withNodeUpdated(g, selectedCode!, patch))}
              onMove={(dir) => {
                mutate((g) => withNodeMoved(g, selectedCode!, dir));
              }}
              onDelete={() => {
                const node =
                  selected.level === 'task'
                    ? selected.task
                    : selected.level === 'ability'
                      ? selected.ability
                      : selected.knowledge;
                setPendingDelete({
                  code: node.code,
                  name: node.name,
                  hard: node.status === 'new'
                });
              }}
            />
          )}
        </Box>

        {/* 右栏：上下文面板 */}
        <Box bg="white" rounded="20px" borderWidth="1px" borderColor="blackAlpha.100" p={5} minH="480px">
          <ContextPanel graph={graph} selected={selected} issues={weightIssues} />
        </Box>
      </Grid>

      <AlertDialog
        isOpen={!!pendingDelete}
        leastDestructiveRef={cancelRef}
        onClose={() => setPendingDelete(null)}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent rounded="20px">
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {pendingDelete?.hard ? '删除新增节点' : '废弃已发布节点'}
          </AlertDialogHeader>
          <AlertDialogBody>
            {pendingDelete?.hard
              ? `「${pendingDelete?.name}」尚未发布，删除后不可恢复。确认删除？`
              : `「${pendingDelete?.name}」已随历史版本发布，删除后将进入下次发布的废弃清单，并标记待处理影响。确认废弃？`}
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setPendingDelete(null)} rounded="10px">
              取消
            </Button>
            <Button
              colorScheme={pendingDelete?.hard ? 'red' : 'orange'}
              ml={3}
              rounded="10px"
              onClick={confirmDelete}
            >
              {pendingDelete?.hard ? '确认删除' : '确认废弃'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---- 树行 ----
function TreeRow(props: {
  depth: number;
  code: string;
  name: string;
  status: NodeStatus;
  selected: boolean;
  collapsed: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAdd?: () => void;
  addLabel?: string;
  weight?: number;
  warn?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Flex
      align="center"
      gap={1.5}
      pl={props.depth * 5 + 2}
      pr={2}
      py={1.5}
      rounded="md"
      cursor="pointer"
      bg={props.selected ? ACCENT_SOFT : 'transparent'}
      _hover={{ bg: props.selected ? ACCENT_SOFT : 'gray.50' }}
      onClick={props.onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {props.hasChildren ? (
        <Box
          onClick={(e) => {
            e.stopPropagation();
            props.onToggle();
          }}
        >
          {props.collapsed ? (
            <ChevronRightIcon boxSize={4} color="gray.500" />
          ) : (
            <ChevronDownIcon boxSize={4} color="gray.500" />
          )}
        </Box>
      ) : (
        <Box w={4} />
      )}
      <Text fontSize="11px" color="gray.400" fontFamily="mono" flexShrink={0}>
        {props.code}
      </Text>
      <Text
        fontSize="13px"
        fontWeight={props.depth === 0 ? 600 : 400}
        color={props.status === 'deprecated' ? 'gray.400' : 'gray.700'}
        textDecoration={props.status === 'deprecated' ? 'line-through' : 'none'}
        flex={1}
        noOfLines={1}
      >
        {props.name}
      </Text>
      {nodeStatusTag(props.status)}
      {props.warn && (
        <HStack spacing={1} flexShrink={0}>
          <WarningIcon color="orange.400" boxSize={3} />
          <Text fontSize="10px" color="orange.500">
            {props.warn}
          </Text>
        </HStack>
      )}
      {props.weight !== undefined && (
        <Text fontSize="11px" color="gray.500" flexShrink={0}>
          {props.weight}%
        </Text>
      )}
      {hover && props.onAdd && (
        <Button
          size="xs"
          variant="ghost"
          color={ACCENT}
          px={1}
          minW="auto"
          h="20px"
          fontSize="11px"
          onClick={(e) => {
            e.stopPropagation();
            props.onAdd!();
          }}
        >
          + {props.addLabel}
        </Button>
      )}
    </Flex>
  );
}

// ---- 节点编辑器 ----
function NodeEditor(props: {
  node: SelectedNode;
  onUpdate: (patch: { name?: string; description?: string; weight?: number; mastery?: Mastery }) => void;
  onMove: (dir: 'up' | 'down') => void;
  onDelete: () => void;
}) {
  const { node } = props;
  const entity = node.level === 'task' ? node.task : node.level === 'ability' ? node.ability : node.knowledge;
  const [name, setName] = useState(entity.name);
  const [description, setDescription] = useState(
    node.level === 'knowledge' ? '' : (entity as JobTask | Ability).description
  );

  const levelLabel = node.level === 'task' ? '任务' : node.level === 'ability' ? '能力' : '知识点';

  return (
    <Stack spacing={5}>
      <HStack justify="space-between">
        <HStack spacing={2}>
          <Badge colorScheme={node.level === 'task' ? 'purple' : node.level === 'ability' ? 'blue' : 'gray'} rounded="full" px={2.5}>
            {levelLabel}
          </Badge>
          <Text fontSize="sm" color="gray.500" fontFamily="mono">
            {entity.code}
          </Text>
          {nodeStatusTag(entity.status)}
        </HStack>
        <HStack spacing={1}>
          <Button size="xs" variant="ghost" leftIcon={<ArrowUpIcon />} onClick={() => props.onMove('up')}>
            上移
          </Button>
          <Button size="xs" variant="ghost" leftIcon={<ArrowDownIcon />} onClick={() => props.onMove('down')}>
            下移
          </Button>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="red"
            leftIcon={<DeleteIcon />}
            onClick={props.onDelete}
          >
            删除
          </Button>
        </HStack>
      </HStack>

      <Box>
        <Text fontSize="xs" color="gray.500" mb={1}>
          名称
        </Text>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== entity.name && props.onUpdate({ name: name.trim() })}
          rounded="10px"
        />
      </Box>

      {node.level !== 'knowledge' && (
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>
            描述
          </Text>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() =>
              description !== (entity as JobTask | Ability).description &&
              props.onUpdate({ description })
            }
            rounded="10px"
            rows={3}
          />
        </Box>
      )}

      {node.level === 'knowledge' && (
        <HStack align="flex-end" spacing={4}>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              权重（%，同能力下合计须为 100）
            </Text>
            <NumberInput
              min={0}
              max={100}
              value={node.knowledge.weight}
              onChange={(_, value) =>
                props.onUpdate({ weight: Number.isFinite(value) ? value : 0 })
              }
            >
              <NumberInputField rounded="10px" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              掌握程度
            </Text>
            <Select
              value={node.knowledge.mastery}
              onChange={(e) => props.onUpdate({ mastery: e.target.value as Mastery })}
              rounded="10px"
            >
              <option value="了解">了解</option>
              <option value="掌握">掌握</option>
              <option value="精通">精通</option>
            </Select>
          </Box>
        </HStack>
      )}

      {entity.status === 'deprecated' && (
        <HStack bg="gray.50" rounded="12px" px={4} py={3} spacing={2}>
          <WarningIcon color="gray.400" />
          <Text fontSize="sm" color="gray.500">
            该节点已标记废弃，将在下次发布时从图谱中移除，不再参与权重校验。
          </Text>
        </HStack>
      )}
    </Stack>
  );
}

// ---- 上下文面板 ----
function ContextPanel(props: {
  graph: AbilityGraph;
  selected: SelectedNode | null;
  issues: { abilityCode: string; abilityName: string; sum: number }[];
}) {
  const { graph, selected } = props;

  if (!selected) {
    return (
      <Flex direction="column" align="center" justify="center" h="440px" gap={2}>
        <AdminIcon name="clipboard-list" style={{ width: 26, height: 26, color: '#CBD5E0' }} />
        <Text fontSize="sm" color="gray.400">
          选中节点后显示上下文信息
        </Text>
      </Flex>
    );
  }

  if (selected.level === 'knowledge') {
    const ability = selected.ability;
    const siblings = ability.knowledges.filter((k) => k.status !== 'deprecated');
    const sum = siblings.reduce((acc, k) => acc + k.weight, 0);
    const ok = sum === 100;
    return (
      <Stack spacing={4}>
        <Text fontSize="sm" fontWeight="bold" color="gray.800">
          同能力权重分配
        </Text>
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="xs" color="gray.500">
              {ability.code} {ability.name}
            </Text>
            <Text fontSize="xs" fontWeight="bold" color={ok ? 'green.600' : 'orange.500'}>
              已分配 {sum}%
            </Text>
          </HStack>
          <Progress
            value={Math.min(sum, 100)}
            size="sm"
            rounded="full"
            sx={{ '& > div': { bg: ok ? '#38A169' : '#DD6B20' } }}
          />
          {!ok && (
            <HStack mt={2} spacing={1}>
              <WarningIcon color="orange.400" boxSize={3.5} />
              <Text fontSize="xs" color="orange.500">
                权重之和需调整至 100% 才能发布
              </Text>
            </HStack>
          )}
        </Box>
        <Stack spacing={2}>
          {siblings.map((k) => (
            <HStack key={k.code} spacing={2}>
              <Text fontSize="xs" color="gray.400" fontFamily="mono" w="44px" flexShrink={0}>
                {k.code}
              </Text>
              <Text fontSize="xs" color="gray.700" flex={1} noOfLines={1}>
                {k.name}
              </Text>
              <Text fontSize="xs" fontWeight="semibold" color="gray.600" w="36px" textAlign="right">
                {k.weight}%
              </Text>
            </HStack>
          ))}
        </Stack>
      </Stack>
    );
  }

  if (selected.level === 'ability') {
    return (
      <Stack spacing={4}>
        <Text fontSize="sm" fontWeight="bold" color="gray.800">
          关联课程
        </Text>
        <Text fontSize="xs" color="gray.500">
          教师端「课程知识图谱映射审核」中引用该图谱的课程
        </Text>
        {graph.linkedCourses.length === 0 ? (
          <Text fontSize="sm" color="gray.400">
            暂无课程引用
          </Text>
        ) : (
          <Stack spacing={2}>
            {graph.linkedCourses.map((c) => (
              <HStack
                key={c.courseId}
                bg="gray.50"
                rounded="10px"
                px={3}
                py={2}
                justify="space-between"
              >
                <HStack spacing={2}>
                  <AdminIcon name="book-open" style={{ width: 14, height: 14, color: ACCENT }} />
                  <Text fontSize="sm" color="gray.700">
                    {c.courseName}
                  </Text>
                </HStack>
                <Badge colorScheme="gray" rounded="full">
                  {c.mappingCount} 条映射
                </Badge>
              </HStack>
            ))}
          </Stack>
        )}
      </Stack>
    );
  }

  // task
  const abilityCount = selected.task.abilities.length;
  const knowledgeCount = selected.task.abilities.reduce((acc, a) => acc + a.knowledges.length, 0);
  const taskIssues = props.issues.filter((i) =>
    selected.task.abilities.some((a) => a.code === i.abilityCode)
  );
  return (
    <Stack spacing={4}>
      <Text fontSize="sm" fontWeight="bold" color="gray.800">
        任务概览
      </Text>
      <HStack spacing={3}>
        <StatCard label="能力" value={abilityCount} />
        <StatCard label="知识点" value={knowledgeCount} />
        <StatCard label="权重异常" value={taskIssues.length} warn={taskIssues.length > 0} />
      </HStack>
      {taskIssues.length > 0 && (
        <Box bg="orange.50" rounded="12px" px={4} py={3}>
          {taskIssues.map((i) => (
            <HStack key={i.abilityCode} spacing={1} mt={1}>
              <WarningIcon color="orange.400" boxSize={3.5} />
              <Text fontSize="xs" color="orange.600">
                {i.abilityCode}「{i.abilityName}」当前 {i.sum}%
              </Text>
            </HStack>
          ))}
        </Box>
      )}
    </Stack>
  );
}

function StatCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <Box flex={1} bg="gray.50" rounded="12px" px={3} py={3} textAlign="center">
      <Text fontSize="xl" fontWeight="bold" color={warn ? 'orange.500' : 'gray.800'}>
        {value}
      </Text>
      <Text fontSize="xs" color="gray.500">
        {label}
      </Text>
    </Box>
  );
}
