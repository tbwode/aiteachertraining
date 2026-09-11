'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  HStack,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Progress,
  Select,
  Stack,
  Text,
  Textarea,
  useToast,
  VStack
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  WarningIcon
} from '@chakra-ui/icons';
import { AdminIcon } from '@/app/admin/components/AdminIcon';
import {
  createDraftGraph,
  mockParseJobDocs,
  parsedTreeToTasks
} from '../../_mock/store';
import type {
  Confidence,
  ParsedAbility,
  ParsedTask
} from '../../_mock/types';

const ACCENT = '#C8000B';
const ACCENT_SOFT = '#FFF1F0';

const STEPS = ['上传岗位说明书', '解析预览', '完善信息'];

const SAMPLE_FILES = [
  { name: '储能电站运维技师岗位说明书.pdf', size: '1.8 MB' },
  { name: '储能电站安全规程.docx', size: '356 KB' },
  { name: '运维作业指导手册.pdf', size: '2.4 MB' }
];

const PARSE_PHASES = ['读取文档', '抽取任务', '归纳能力', '生成知识点与权重'];

const confidenceMeta: Record<Confidence, { color: string; label: string }> = {
  high: { color: 'green.500', label: '高置信' },
  mid: { color: 'orange.400', label: '中置信' },
  low: { color: 'red.500', label: '低置信' }
};

const MAJOR_DIRECTIONS = [
  '新能源汽车技术',
  '智能网联汽车技术',
  '汽车技术服务与营销',
  '机电一体化技术'
];

type SelectedNode =
  | { level: 'task'; task: ParsedTask }
  | { level: 'ability'; ability: ParsedAbility }
  | { level: 'knowledge'; ability: ParsedAbility; knowledge: ParsedAbility['knowledges'][number] };

export default function AiWizardClient() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parsePhase, setParsePhase] = useState(0);
  const [parsed, setParsed] = useState<ParsedTask[] | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [jobName, setJobName] = useState('储能电站运维技师');
  const [majorDirection, setMajorDirection] = useState(MAJOR_DIRECTIONS[0]);
  const [note, setNote] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addFiles = (items: { name: string; size: string }[]) => {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...items.filter((f) => !names.has(f.name))];
    });
  };

  const startParse = () => {
    setParsing(true);
    setParsePhase(0);
    timerRef.current = setInterval(() => {
      setParsePhase((prev) => {
        if (prev >= PARSE_PHASES.length - 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setParsed(mockParseJobDocs(files));
          setParsing(false);
          setStep(1);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  const toggleExclude = (code: string) => {
    if (!parsed) return;
    const next = JSON.parse(JSON.stringify(parsed)) as ParsedTask[];
    next.forEach((t) => {
      if (t.code === code) {
        t.excluded = !t.excluded;
        t.abilities.forEach((a) => {
          a.excluded = t.excluded;
          a.knowledges.forEach((k) => (k.excluded = t.excluded));
        });
      }
      t.abilities.forEach((a) => {
        if (a.code === code) {
          a.excluded = !a.excluded;
          a.knowledges.forEach((k) => (k.excluded = a.excluded));
        }
        a.knowledges.forEach((k) => {
          if (k.code === code) k.excluded = !k.excluded;
        });
      });
    });
    setParsed(next);
  };

  const renameNode = (code: string, name: string) => {
    if (!parsed) return;
    const next = JSON.parse(JSON.stringify(parsed)) as ParsedTask[];
    next.forEach((t) => {
      if (t.code === code) t.name = name;
      t.abilities.forEach((a) => {
        if (a.code === code) a.name = name;
        a.knowledges.forEach((k) => {
          if (k.code === code) k.name = name;
        });
      });
    });
    setParsed(next);
  };

  const updateKnowledgeWeight = (code: string, weight: number) => {
    if (!parsed) return;
    const next = JSON.parse(JSON.stringify(parsed)) as ParsedTask[];
    next.forEach((t) =>
      t.abilities.forEach((a) =>
        a.knowledges.forEach((k) => {
          if (k.code === code) k.weight = weight;
        })
      )
    );
    setParsed(next);
  };

  const parsedStats = useMemo(() => {
    if (!parsed) return { tasks: 0, abilities: 0, knowledges: 0, low: 0 };
    let abilities = 0;
    let knowledges = 0;
    let low = 0;
    parsed
      .filter((t) => !t.excluded)
      .forEach((t) => {
        if (t.confidence === 'low') low += 1;
        t.abilities
          .filter((a) => !a.excluded)
          .forEach((a) => {
            abilities += 1;
            if (a.confidence === 'low') low += 1;
            a.knowledges
              .filter((k) => !k.excluded)
              .forEach((k) => {
                knowledges += 1;
                if (k.confidence === 'low') low += 1;
              });
          });
      });
    return { tasks: parsed.filter((t) => !t.excluded).length, abilities, knowledges, low };
  }, [parsed]);

  const selectedNode: SelectedNode | null = useMemo(() => {
    if (!parsed || !selectedCode) return null;
    for (const t of parsed) {
      if (t.code === selectedCode) return { level: 'task', task: t };
      for (const a of t.abilities) {
        if (a.code === selectedCode) return { level: 'ability', ability: a };
        for (const k of a.knowledges) {
          if (k.code === selectedCode) return { level: 'knowledge', ability: a, knowledge: k };
        }
      }
    }
    return null;
  }, [parsed, selectedCode]);

  const handleCreate = () => {
    if (!parsed) return;
    if (!jobName.trim()) {
      toast({ title: '请填写岗位名称', status: 'warning', duration: 2000, position: 'top' });
      return;
    }
    const graph = createDraftGraph({
      jobName: jobName.trim(),
      majorDirection,
      sourceDocs: files,
      buildTasks: (id) => parsedTreeToTasks(parsed, id)
    });
    toast({
      title: '草稿图谱已生成',
      description: `「${graph.jobName}」已创建，请在工作台完善权重并发布。`,
      status: 'success',
      duration: 2500,
      position: 'top'
    });
    router.push(`/admin/graph/ability/${graph.id}`);
  };

  return (
    <Stack spacing={6}>
      <Flex justify="space-between" align="center">
        <HStack spacing={3}>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin/graph/ability')}
          >
            返回列表
          </Button>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            AI 生成岗位能力图谱
          </Text>
        </HStack>
      </Flex>

      <HStack spacing={0} align="center" justify="center">
        {STEPS.map((label, index) => (
          <HStack key={label} spacing={0}>
            <HStack spacing={2}>
              <Flex
                w="28px"
                h="28px"
                rounded="full"
                align="center"
                justify="center"
                fontSize="sm"
                fontWeight="bold"
                bg={index <= step ? ACCENT : 'gray.200'}
                color={index <= step ? 'white' : 'gray.500'}
              >
                {index + 1}
              </Flex>
              <Text
                fontSize="sm"
                fontWeight={index === step ? 'bold' : 'normal'}
                color={index <= step ? 'gray.800' : 'gray.400'}
              >
                {label}
              </Text>
            </HStack>
            {index < STEPS.length - 1 && (
              <Box w="80px" h="2px" bg={index < step ? ACCENT : 'gray.200'} mx={4} />
            )}
          </HStack>
        ))}
      </HStack>

      {step === 0 && (
        <Grid templateColumns={{ base: '1fr', lg: '1.2fr 1fr' }} gap={6} alignItems="start">
          <Box bg="white" rounded="24px" borderWidth="1px" borderColor="blackAlpha.100" p={6}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.800" mb={4}>
              上传岗位说明书
            </Text>
            <Flex
              direction="column"
              align="center"
              justify="center"
              border="2px dashed"
              borderColor="gray.300"
              rounded="16px"
              py={12}
              gap={3}
              cursor="pointer"
              _hover={{ borderColor: ACCENT, bg: ACCENT_SOFT }}
              onClick={() => addFiles(SAMPLE_FILES)}
            >
              <AdminIcon name="file-text" style={{ width: 32, height: 32, color: ACCENT }} />
              <Text fontSize="sm" color="gray.600">
                点击或拖拽上传岗位说明书（PDF / Word）
              </Text>
              <Text fontSize="xs" color="gray.400">
                支持多份文档联合解析，单文件不超过 20MB
              </Text>
            </Flex>

            {files.length > 0 && (
              <Stack spacing={2} mt={4}>
                {files.map((f) => (
                  <HStack
                    key={f.name}
                    bg="gray.50"
                    rounded="10px"
                    px={3}
                    py={2}
                    justify="space-between"
                  >
                    <HStack spacing={2}>
                      <AdminIcon name="file-text" style={{ width: 16, height: 16, color: '#718096' }} />
                      <Text fontSize="sm" color="gray.700">
                        {f.name}
                      </Text>
                    </HStack>
                    <HStack spacing={3}>
                      <Text fontSize="xs" color="gray.400">
                        {f.size}
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}
                      >
                        移除
                      </Button>
                    </HStack>
                  </HStack>
                ))}
              </Stack>
            )}

            {parsing && (
              <Box mt={5}>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" color="gray.700" fontWeight="medium">
                    AI 正在解析：{PARSE_PHASES[parsePhase]}…
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {Math.round(((parsePhase + 1) / PARSE_PHASES.length) * 100)}%
                  </Text>
                </HStack>
                <Progress
                  value={((parsePhase + 1) / PARSE_PHASES.length) * 100}
                  size="sm"
                  rounded="full"
                  sx={{ '& > div': { bg: ACCENT } }}
                />
              </Box>
            )}

            <Flex justify="flex-end" mt={6}>
              <Button
                bg={ACCENT}
                color="white"
                rounded="12px"
                _hover={{ bg: '#A80009' }}
                isDisabled={files.length === 0 || parsing}
                isLoading={parsing}
                loadingText="解析中"
                leftIcon={<AdminIcon name="sparkles" style={{ width: 16, height: 16 }} />}
                onClick={startParse}
              >
                开始解析
              </Button>
            </Flex>
          </Box>

          <Box bg="white" rounded="24px" borderWidth="1px" borderColor="blackAlpha.100" p={6}>
            <Text fontSize="lg" fontWeight="semibold" color="gray.800" mb={1}>
              使用示例文件
            </Text>
            <Text fontSize="xs" color="gray.500" mb={4}>
              演示环境不依赖真实文件，点击示例即可加入解析列表
            </Text>
            <Stack spacing={3}>
              {SAMPLE_FILES.map((f) => (
                <HStack
                  key={f.name}
                  borderWidth="1px"
                  borderColor="blackAlpha.100"
                  rounded="12px"
                  px={4}
                  py={3}
                  justify="space-between"
                  cursor="pointer"
                  _hover={{ borderColor: 'red.200', bg: 'red.50' }}
                  onClick={() => addFiles([f])}
                >
                  <HStack spacing={3}>
                    <AdminIcon name="file-text" style={{ width: 18, height: 18, color: ACCENT }} />
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        {f.name}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {f.size}
                      </Text>
                    </Box>
                  </HStack>
                  <AdminIcon name="arrow-right" style={{ width: 14, height: 14, color: '#CBD5E0' }} />
                </HStack>
              ))}
            </Stack>
          </Box>
        </Grid>
      )}

      {step === 1 && parsed && (
        <Stack spacing={4}>
          <HStack
            bg="white"
            rounded="16px"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            px={5}
            py={3}
            spacing={4}
          >
            <AdminIcon name="sparkles" style={{ width: 18, height: 18, color: ACCENT }} />
            <Text fontSize="sm" color="gray.700">
              共识别 <b>{parsedStats.tasks}</b> 任务 / <b>{parsedStats.abilities}</b> 能力 /{' '}
              <b>{parsedStats.knowledges}</b> 知识点
            </Text>
            {parsedStats.low > 0 && (
              <Badge colorScheme="red" rounded="full" px={2.5}>
                其中低置信 {parsedStats.low} 项
              </Badge>
            )}
            <Flex flex={1} justify="flex-end">
              <Text fontSize="xs" color="gray.400">
                取消勾选可剔除节点，点击节点可改名 / 调权重
              </Text>
            </Flex>
          </HStack>

          <Grid templateColumns={{ base: '1fr', lg: '1fr 360px' }} gap={4} alignItems="start">
            <Box bg="white" rounded="20px" borderWidth="1px" borderColor="blackAlpha.100" p={4}>
              <VStack align="stretch" spacing={1}>
                {parsed.map((task) => {
                  const taskCollapsed = collapsed[task.code] ?? false;
                  return (
                    <Box key={task.code}>
                      <HStack
                        spacing={2}
                        px={2}
                        py={2}
                        rounded="md"
                        bg={selectedCode === task.code ? ACCENT_SOFT : 'transparent'}
                        _hover={{ bg: 'gray.50' }}
                      >
                        <Box
                          cursor="pointer"
                          onClick={() =>
                            setCollapsed((prev) => ({ ...prev, [task.code]: !taskCollapsed }))
                          }
                        >
                          {taskCollapsed ? (
                            <ChevronRightIcon boxSize={4} color="gray.500" />
                          ) : (
                            <ChevronDownIcon boxSize={4} color="gray.500" />
                          )}
                        </Box>
                        <Checkbox
                          isChecked={!task.excluded}
                          onChange={() => toggleExclude(task.code)}
                          colorScheme="red"
                        />
                        <Box
                          w="8px"
                          h="8px"
                          rounded="full"
                          bg={confidenceMeta[task.confidence].color}
                          flexShrink={0}
                        />
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color={task.excluded ? 'gray.400' : 'gray.800'}
                          textDecoration={task.excluded ? 'line-through' : 'none'}
                          cursor="pointer"
                          flex={1}
                          onClick={() => setSelectedCode(task.code)}
                        >
                          {task.code} {task.name}
                        </Text>
                        <Badge colorScheme="gray" fontSize="10px">
                          任务
                        </Badge>
                      </HStack>
                      {!taskCollapsed &&
                        task.abilities.map((ability) => {
                          const abilityCollapsed = collapsed[ability.code] ?? false;
                          return (
                            <Box key={ability.code} pl={8}>
                              <HStack
                                spacing={2}
                                px={2}
                                py={1.5}
                                rounded="md"
                                bg={selectedCode === ability.code ? ACCENT_SOFT : 'transparent'}
                                _hover={{ bg: 'gray.50' }}
                              >
                                <Box
                                  cursor="pointer"
                                  onClick={() =>
                                    setCollapsed((prev) => ({
                                      ...prev,
                                      [ability.code]: !abilityCollapsed
                                    }))
                                  }
                                >
                                  {abilityCollapsed ? (
                                    <ChevronRightIcon boxSize={4} color="gray.500" />
                                  ) : (
                                    <ChevronDownIcon boxSize={4} color="gray.500" />
                                  )}
                                </Box>
                                <Checkbox
                                  isChecked={!ability.excluded}
                                  onChange={() => toggleExclude(ability.code)}
                                  colorScheme="red"
                                />
                                <Box
                                  w="8px"
                                  h="8px"
                                  rounded="full"
                                  bg={confidenceMeta[ability.confidence].color}
                                  flexShrink={0}
                                />
                                <Text
                                  fontSize="sm"
                                  color={ability.excluded ? 'gray.400' : 'gray.700'}
                                  textDecoration={ability.excluded ? 'line-through' : 'none'}
                                  cursor="pointer"
                                  flex={1}
                                  onClick={() => setSelectedCode(ability.code)}
                                >
                                  {ability.code} {ability.name}
                                </Text>
                                <Badge colorScheme="blue" fontSize="10px">
                                  能力
                                </Badge>
                              </HStack>
                              {!abilityCollapsed &&
                                ability.knowledges.map((k) => (
                                  <HStack
                                    key={k.code}
                                    pl={16}
                                    pr={2}
                                    py={1.5}
                                    spacing={2}
                                    rounded="md"
                                    bg={selectedCode === k.code ? ACCENT_SOFT : 'transparent'}
                                    _hover={{ bg: 'gray.50' }}
                                  >
                                    <Checkbox
                                      isChecked={!k.excluded}
                                      onChange={() => toggleExclude(k.code)}
                                      colorScheme="red"
                                    />
                                    <Box
                                      w="8px"
                                      h="8px"
                                      rounded="full"
                                      bg={confidenceMeta[k.confidence].color}
                                      flexShrink={0}
                                    />
                                    <Text
                                      fontSize="sm"
                                      color={k.excluded ? 'gray.400' : 'gray.600'}
                                      textDecoration={k.excluded ? 'line-through' : 'none'}
                                      cursor="pointer"
                                      flex={1}
                                      onClick={() => setSelectedCode(k.code)}
                                    >
                                      {k.code} {k.name}
                                    </Text>
                                    {k.confidence === 'low' && (
                                      <WarningIcon color="red.400" boxSize={3.5} />
                                    )}
                                    <Text fontSize="xs" color="gray.500">
                                      {k.weight}%
                                    </Text>
                                  </HStack>
                                ))}
                            </Box>
                          );
                        })}
                    </Box>
                  );
                })}
              </VStack>
            </Box>

            <Box
              bg="white"
              rounded="20px"
              borderWidth="1px"
              borderColor="blackAlpha.100"
              p={5}
              position="sticky"
              top={4}
            >
              {!selectedNode && (
                <Flex direction="column" align="center" py={10} gap={2}>
                  <AdminIcon name="sliders" style={{ width: 24, height: 24, color: '#CBD5E0' }} />
                  <Text fontSize="sm" color="gray.400">
                    点击左侧节点查看 AI 理由并编辑
                  </Text>
                </Flex>
              )}
              {selectedNode && (
                <Stack spacing={4}>
                  {(() => {
                    const node =
                      selectedNode.level === 'task'
                        ? selectedNode.task
                        : selectedNode.level === 'ability'
                          ? selectedNode.ability
                          : selectedNode.knowledge;
                    const meta = confidenceMeta[node.confidence];
                    return (
                      <>
                        <HStack justify="space-between">
                          <HStack spacing={2}>
                            <Box w="10px" h="10px" rounded="full" bg={meta.color} />
                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                              {node.code}
                            </Text>
                            <Badge
                              colorScheme={node.confidence === 'low' ? 'red' : node.confidence === 'mid' ? 'orange' : 'green'}
                              fontSize="10px"
                            >
                              {meta.label}
                            </Badge>
                          </HStack>
                          {node.confidence === 'low' && (
                            <HStack spacing={1}>
                              <WarningIcon color="red.400" boxSize={3.5} />
                              <Text fontSize="xs" color="red.500">
                                建议人工确认
                              </Text>
                            </HStack>
                          )}
                        </HStack>
                        <Box>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            名称
                          </Text>
                          <Input
                            size="sm"
                            value={node.name}
                            rounded="10px"
                            onChange={(e) => renameNode(node.code, e.target.value)}
                          />
                        </Box>
                        {'description' in node && (
                          <Box>
                            <Text fontSize="xs" color="gray.500" mb={1}>
                              描述
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {node.description}
                            </Text>
                          </Box>
                        )}
                        {selectedNode.level === 'knowledge' && (
                          <HStack>
                            <Box flex={1}>
                              <Text fontSize="xs" color="gray.500" mb={1}>
                                权重（%）
                              </Text>
                              <NumberInput
                                size="sm"
                                min={0}
                                max={100}
                                value={selectedNode.knowledge.weight}
                                onChange={(_, value) =>
                                  updateKnowledgeWeight(
                                    selectedNode.level === 'knowledge'
                                      ? selectedNode.knowledge.code
                                      : '',
                                    Number.isFinite(value) ? value : 0
                                  )
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
                              <Text fontSize="sm" color="gray.700" py={1.5}>
                                {selectedNode.knowledge.mastery}
                              </Text>
                            </Box>
                          </HStack>
                        )}
                        <Box bg="gray.50" rounded="12px" p={3} borderLeft="3px solid" borderColor={ACCENT}>
                          <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
                            AI 识别理由
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {node.reason}
                          </Text>
                        </Box>
                      </>
                    );
                  })()}
                </Stack>
              )}
            </Box>
          </Grid>

          <Flex justify="space-between">
            <Button variant="ghost" onClick={() => setStep(0)}>
              上一步
            </Button>
            <Button
              bg={ACCENT}
              color="white"
              rounded="12px"
              _hover={{ bg: '#A80009' }}
              isDisabled={parsedStats.tasks === 0}
              onClick={() => setStep(2)}
            >
              下一步：完善信息
            </Button>
          </Flex>
        </Stack>
      )}

      {step === 2 && (
        <Box
          bg="white"
          rounded="24px"
          borderWidth="1px"
          borderColor="blackAlpha.100"
          p={6}
          maxW="640px"
          mx="auto"
          w="full"
        >
          <Stack spacing={5}>
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                岗位名称 *
              </Text>
              <Input value={jobName} onChange={(e) => setJobName(e.target.value)} rounded="12px" />
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                专业方向 *
              </Text>
              <Select
                value={majorDirection}
                onChange={(e) => setMajorDirection(e.target.value)}
                rounded="12px"
              >
                {MAJOR_DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                备注
              </Text>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：依据 2026 版企业岗位说明书生成，待教研组审定"
                rounded="12px"
              />
            </Box>
            <HStack
              bg={ACCENT_SOFT}
              rounded="12px"
              px={4}
              py={3}
              spacing={3}
              align="flex-start"
            >
              <CheckCircleIcon color={ACCENT} mt={0.5} />
              <Text fontSize="sm" color="gray.700">
                将生成草稿图谱（{parsedStats.tasks} 任务 · {parsedStats.abilities} 能力 ·{' '}
                {parsedStats.knowledges} 知识点），创建后进入治理工作台完善权重并发布。
              </Text>
            </HStack>
            <Flex justify="space-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button
                bg={ACCENT}
                color="white"
                rounded="12px"
                _hover={{ bg: '#A80009' }}
                leftIcon={<AdminIcon name="sparkles" style={{ width: 16, height: 16 }} />}
                onClick={handleCreate}
              >
                生成草稿图谱
              </Button>
            </Flex>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
