'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  Tooltip
} from '@chakra-ui/react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Focus,
  Minus,
  Plus,
  Search,
  Target
} from 'lucide-react';
import type { AbilityGraph, JobTask } from '../../_mock/types';

const ACCENT = '#C8000B';

type SelectedNode =
  | { type: 'job'; code: string; name: string; description: string }
  | { type: 'task'; code: string; name: string; description: string; task: JobTask }
  | { type: 'ability'; code: string; name: string; description: string; task: JobTask };

const nodeTones = {
  job: { bg: '#FFF0F0', border: '#F2A6AA', color: '#A80D16' },
  task: { bg: '#EEF5FF', border: '#A9C8F5', color: '#255EA8' },
  ability: { bg: '#F0FBF6', border: '#A9DFC8', color: '#137A55' },
  knowledge: { bg: '#FFF8E8', border: '#F1D18A', color: '#9A6505' }
};

export default function GraphOverviewTab({ graph }: { graph: AbilityGraph }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() => new Set(graph.tasks.map((task) => task.code)));
  const [selectedCode, setSelectedCode] = useState(graph.tasks[0]?.abilities[0]?.code || 'JOB');
  const [zoom, setZoom] = useState(1);

  const selected = useMemo<SelectedNode>(() => {
    for (const task of graph.tasks) {
      if (task.code === selectedCode) return { type: 'task', code: task.code, name: task.name, description: task.description, task };
      const ability = task.abilities.find((item) => item.code === selectedCode);
      if (ability) return { type: 'ability', code: ability.code, name: ability.name, description: ability.description, task };
    }
    return { type: 'job', code: graph.id.toUpperCase(), name: graph.jobName, description: `${graph.majorDirection}专业对应的核心岗位能力模型` };
  }, [graph, selectedCode]);

  const visibleTasks = graph.tasks.slice(0, 4);
  const canvasHeight = Math.max(540, visibleTasks.length * 138 + 40);
  const toggleTask = (code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  return (
    <Box borderWidth="1px" borderColor="gray.100" rounded="18px" overflow="hidden">
      <Flex minH="610px" align="stretch" overflowX="auto">
        <Box w="250px" minW="250px" p={4} borderRightWidth="1px" borderColor="gray.100" bg="#FAFBFC">
          <Text fontWeight="700">图谱资源</Text>
          <Text mt={1} fontSize="xs" color="gray.500">搜索并定位任务域或能力节点</Text>
          <InputGroup size="sm" mt={4}>
            <InputLeftElement><Search size={14} /></InputLeftElement>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索节点" rounded="10px" bg="white" />
          </InputGroup>

          <Stack mt={4} spacing={1}>
            <Button h="auto" py={2.5} px={2.5} variant="ghost" rounded="10px" justifyContent="flex-start" bg={selected.type === 'job' ? '#FFF0F0' : 'transparent'} color={selected.type === 'job' ? ACCENT : 'gray.700'} onClick={() => setSelectedCode('JOB')}>
              <HStack><Target size={15} /><Text fontSize="sm">{graph.jobName}</Text></HStack>
            </Button>
            {graph.tasks.filter((task) => `${task.name}${task.code}${task.abilities.map((item) => item.name).join('')}`.includes(query.trim())).map((task) => (
              <Box key={task.code}>
                <Flex align="center" rounded="10px" bg={selectedCode === task.code ? 'blue.50' : 'transparent'}>
                  <Button aria-label={`${expanded.has(task.code) ? '收起' : '展开'}${task.name}`} minW="30px" w="30px" h="34px" variant="ghost" p={0} onClick={() => toggleTask(task.code)}>
                    {expanded.has(task.code) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </Button>
                  <Button flex="1" minW={0} h="34px" variant="ghost" px={1} justifyContent="flex-start" fontSize="sm" fontWeight="600" onClick={() => setSelectedCode(task.code)}>{task.name}</Button>
                </Flex>
                {expanded.has(task.code) && <Stack ml={7} mt={1} spacing={0.5}>{task.abilities.map((ability) => <Button key={ability.code} h="30px" variant="ghost" rounded="8px" justifyContent="flex-start" px={2} fontSize="xs" fontWeight="500" color={selectedCode === ability.code ? '#137A55' : 'gray.500'} bg={selectedCode === ability.code ? '#E9F9F2' : 'transparent'} onClick={() => setSelectedCode(ability.code)}>{ability.code} {ability.name}</Button>)}</Stack>}
              </Box>
            ))}
          </Stack>

          <Divider my={4} />
          <Text fontSize="xs" fontWeight="700" color="gray.500">对标来源</Text>
          <Stack mt={3} spacing={2}>
            {(graph.sourceDocs.length ? graph.sourceDocs : [{ name: '国家职业技能标准.pdf', size: '2.4 MB' }, { name: '企业典型任务调研.xlsx', size: '680 KB' }]).slice(0, 3).map((doc) => (
              <HStack key={doc.name} p={2.5} bg="white" borderWidth="1px" borderColor="gray.100" rounded="10px" align="flex-start">
                <FileText size={15} color={ACCENT} /><Box minW={0}><Text fontSize="xs" fontWeight="600" noOfLines={2}>{doc.name}</Text><Text mt={0.5} fontSize="10px" color="gray.400">{doc.size}</Text></Box>
              </HStack>
            ))}
          </Stack>
        </Box>

        <Box flex="1" minW="660px" bg="#FBFCFE" position="relative" overflow="hidden">
          <Flex position="absolute" zIndex={3} top={3} left={4} right={4} justify="space-between" align="center">
            <HStack spacing={4} p={2} bg="whiteAlpha.900" rounded="10px" borderWidth="1px" borderColor="gray.100">
              {([['job', '岗位'], ['task', '任务域'], ['ability', '能力点'], ['knowledge', '知识点']] as const).map(([key, label]) => <HStack key={key} spacing={1.5}><Box w="9px" h="9px" rounded="3px" bg={nodeTones[key].bg} borderWidth="1px" borderColor={nodeTones[key].border} /><Text fontSize="xs" color="gray.500">{label}</Text></HStack>)}
            </HStack>
            <HStack spacing={1} p={1} bg="white" rounded="10px" borderWidth="1px" borderColor="gray.100">
              <Tooltip label="缩小"><Button aria-label="缩小图谱" size="xs" variant="ghost" onClick={() => setZoom((value) => Math.max(.75, value - .1))}><Minus size={14} /></Button></Tooltip>
              <Text w="42px" textAlign="center" fontSize="xs">{Math.round(zoom * 100)}%</Text>
              <Tooltip label="放大"><Button aria-label="放大图谱" size="xs" variant="ghost" onClick={() => setZoom((value) => Math.min(1.25, value + .1))}><Plus size={14} /></Button></Tooltip>
              <Tooltip label="适应画布"><Button aria-label="适应画布" size="xs" variant="ghost" onClick={() => setZoom(1)}><Focus size={14} /></Button></Tooltip>
            </HStack>
          </Flex>

          <Box position="absolute" inset={0} top="48px" transform={`scale(${zoom})`} transformOrigin="center center" transition="transform .2s ease">
            <Box position="relative" w="660px" h={`${canvasHeight}px`} mx="auto">
              <Box as="svg" position="absolute" inset={0} w="660px" h={`${canvasHeight}px`} pointerEvents="none">
                {visibleTasks.map((task, index) => {
                  const taskY = 78 + index * 128;
                  return <g key={task.code}><path d={`M 142 276 C 190 276, 185 ${taskY + 22}, 226 ${taskY + 22}`} fill="none" stroke="#D7DDE6" strokeWidth="1.6" />{expanded.has(task.code) && task.abilities.slice(0, 3).map((ability, abilityIndex) => { const abilityY = taskY + 22 + (abilityIndex - (Math.min(task.abilities.length, 3) - 1) / 2) * 48; return <path key={ability.code} d={`M 362 ${taskY + 22} C 405 ${taskY + 22}, 402 ${abilityY}, 448 ${abilityY}`} fill="none" stroke="#D7DDE6" strokeWidth="1.4" />; })}</g>;
                })}
              </Box>

              <Button position="absolute" left="20px" top="246px" w="122px" h="60px" whiteSpace="normal" rounded="16px" bg={nodeTones.job.bg} borderWidth="1px" borderColor={selected.type === 'job' ? ACCENT : nodeTones.job.border} color={nodeTones.job.color} boxShadow={selected.type === 'job' ? '0 0 0 3px rgba(200,0,11,.09)' : 'sm'} fontSize="sm" onClick={() => setSelectedCode('JOB')}>{graph.jobName}</Button>
              {visibleTasks.map((task, index) => {
                const taskY = 78 + index * 128;
                return <Box key={task.code}><Flex position="absolute" left="226px" top={`${taskY}px`} w="136px" h="44px" align="center" rounded="12px" bg={nodeTones.task.bg} borderWidth="1px" borderColor={selectedCode === task.code ? '#3182CE' : nodeTones.task.border} color={nodeTones.task.color} boxShadow={selectedCode === task.code ? '0 0 0 3px rgba(49,130,206,.1)' : 'sm'}><Button aria-label={`选择${task.name}`} flex="1" minW={0} h="full" variant="ghost" fontSize="sm" onClick={() => setSelectedCode(task.code)}>{task.name}</Button><Button aria-label={`${expanded.has(task.code) ? '收起' : '展开'}${task.name}`} minW="34px" w="34px" h="full" variant="ghost" p={0} borderLeftWidth="1px" borderColor="blue.100" onClick={() => toggleTask(task.code)}>{expanded.has(task.code) ? <Minus size={14} /> : <Plus size={14} />}</Button></Flex>{expanded.has(task.code) && task.abilities.slice(0, 3).map((ability, abilityIndex) => { const abilityY = taskY + (abilityIndex - (Math.min(task.abilities.length, 3) - 1) / 2) * 48; return <Button key={ability.code} position="absolute" left="448px" top={`${abilityY}px`} w="154px" h="44px" whiteSpace="normal" rounded="12px" bg={nodeTones.ability.bg} borderWidth="1px" borderColor={selectedCode === ability.code ? '#20A776' : nodeTones.ability.border} color={nodeTones.ability.color} boxShadow={selectedCode === ability.code ? '0 0 0 3px rgba(32,167,118,.1)' : 'sm'} fontSize="sm" onClick={() => setSelectedCode(ability.code)}><Text as="span" mr={1} fontSize="xs" opacity={.72}>{ability.code}</Text>{ability.name}</Button>; })}</Box>;
              })}
            </Box>
          </Box>
        </Box>

        <Box w="300px" minW="300px" p={4} borderLeftWidth="1px" borderColor="gray.100" bg="white">
          <Flex justify="space-between" align="center">
            <Text fontWeight="700">节点详情</Text>
            <Button size="xs" variant="outline" rounded="8px">编辑</Button>
          </Flex>
          <Divider my={4} />
          <HStack align="flex-start">
            <Flex w="38px" h="38px" flexShrink={0} rounded="11px" align="center" justify="center" bg={nodeTones[selected.type].bg} color={nodeTones[selected.type].color}><Target size={18} /></Flex>
            <Box><Text fontWeight="700">{selected.name}</Text><HStack mt={1}><Badge rounded="full" colorScheme={selected.type === 'ability' ? 'green' : selected.type === 'task' ? 'blue' : 'red'}>{selected.type === 'job' ? '岗位' : selected.type === 'task' ? '任务域' : '能力点'}</Badge><Text fontSize="xs" color="gray.400">{selected.code}</Text></HStack></Box>
          </HStack>
          <Text mt={4} fontSize="sm" lineHeight="1.75" color="gray.600">{selected.description || '该节点用于描述岗位典型工作任务及其能力要求。'}</Text>

          <Text mt={5} fontSize="sm" fontWeight="700">基本信息</Text>
          <Stack mt={3} spacing={2.5}>
            {[
              ['上级节点', selected.type === 'ability' ? selected.task.name : selected.type === 'task' ? graph.jobName : graph.majorDirection],
              ['状态', '已发布'],
              ['来源', selected.type === 'job' ? '专业人才培养方案' : '国家标准 / 企业调研'],
              ['版本', graph.currentVersion]
            ].map(([label, value]) => <Flex key={label} justify="space-between" gap={3}><Text fontSize="xs" color="gray.400">{label}</Text><Text fontSize="xs" textAlign="right" color="gray.700">{value}</Text></Flex>)}
          </Stack>

          {selected.type === 'ability' && <><Text mt={5} fontSize="sm" fontWeight="700">等级要求</Text><HStack mt={3}>{['L1 了解', 'L2 掌握', 'L3 精通'].map((level, index) => <Badge key={level} px={2.5} py={1} rounded="full" colorScheme={index === 2 ? 'red' : 'gray'}>{level}</Badge>)}</HStack><Text mt={5} fontSize="sm" fontWeight="700">知识点（{selected.task.abilities.find((item) => item.code === selected.code)?.knowledges.length || 0}）</Text><Stack mt={3} spacing={2}>{selected.task.abilities.find((item) => item.code === selected.code)?.knowledges.map((knowledge) => <Flex key={knowledge.code} p={2.5} rounded="10px" bg="#FFF9EC" justify="space-between" align="center"><Box><Text fontSize="xs" fontWeight="600">{knowledge.name}</Text><Text mt={0.5} fontSize="10px" color="gray.400">{knowledge.code} · {knowledge.mastery}</Text></Box><Text fontSize="xs" color="#9A6505">{knowledge.weight}%</Text></Flex>)}</Stack></>}

          <Text mt={5} fontSize="sm" fontWeight="700">关联资源（{graph.linkedCourses.length}）</Text>
          <Stack mt={3} spacing={2}>{graph.linkedCourses.slice(0, 3).map((course) => <HStack key={course.courseId} p={2.5} rounded="10px" borderWidth="1px" borderColor="gray.100"><BookOpen size={14} color={ACCENT} /><Box minW={0}><Text fontSize="xs" fontWeight="600" noOfLines={1}>{course.courseName}</Text><Text mt={0.5} fontSize="10px" color="gray.400">课程 · {course.mappingCount} 项映射</Text></Box></HStack>)}</Stack>
        </Box>
      </Flex>
    </Box>
  );
}
