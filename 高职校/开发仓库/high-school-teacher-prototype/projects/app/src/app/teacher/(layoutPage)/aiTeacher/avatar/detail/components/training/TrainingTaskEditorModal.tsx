'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Checkbox,
  Divider,
  Flex,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useToast
} from '@chakra-ui/react';
import { Check, ChevronLeft, Plus, Sparkles, Trash2 } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import { ManualAbilityPickerDrawer } from './ManualAbilityPickerDrawer';
import type {
  AbilitySource,
  AbilityWeight,
  TrainingAbilityRef,
  TrainingRubricItem,
  TrainingTask,
  TrainingTaskStatus
} from './types';
import { totalRubricScore } from './types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editingTask: TrainingTask | null;
  courseName: string;
  classNames: string[];
  abilityOptions: TrainingAbilityRef[];
  onSave: (task: TrainingTask, status: TrainingTaskStatus) => void;
};

const sourceMeta = {
  course: {
    label: '课程继承',
    color: '#2563EB',
    bg: '#EFF6FF',
    description: '由当前课程与岗位能力图谱的映射关系自动推荐'
  },
  manual: {
    label: '手动补充',
    color: '#D97706',
    bg: '#FFFBEB',
    description: '教师可从当前图谱额外选择，也可新增任务专属能力点，仅对本任务生效'
  }
};

const nowText = () => {
  const d = new Date();
  const p = (value: number) => String(value).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const newRubricId = () => `rubric-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export function TrainingTaskEditorModal({
  isOpen,
  onClose,
  editingTask,
  courseName,
  classNames,
  abilityOptions,
  onSave
}: Props) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('2026-09-30T18:00');
  const [abilities, setAbilities] = useState<TrainingAbilityRef[]>([]);
  const [rubrics, setRubrics] = useState<TrainingRubricItem[]>([]);
  const [abilitySearch, setAbilitySearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | AbilitySource>('all');
  const [isManualPickerOpen, setIsManualPickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setAbilitySearch('');
    setSourceFilter('all');
    setIsManualPickerOpen(false);
    setTitle(editingTask?.title ?? '');
    setDescription(editingTask?.description ?? '');
    setRequirements(editingTask?.requirements.join('\n') ?? '');
    setSelectedClasses(editingTask?.classNames ?? classNames.slice(0, 1));
    setDeadline(editingTask?.deadline ?? '2026-09-30T18:00');
    setAbilities(editingTask?.abilities ?? []);
    setRubrics(editingTask?.rubrics ?? []);
  }, [classNames, editingTask, isOpen]);

  const visibleAbilityOptions = useMemo(() => {
    const courseOptions = abilityOptions.filter((item) => item.source === 'course');
    const selectedManualOptions = abilities.filter((item) => item.source === 'manual');
    const unique = new Map<string, TrainingAbilityRef>();
    [...courseOptions, ...selectedManualOptions].forEach((item) => {
      unique.set(`${item.graphId}-${item.abilityCode}`, item);
    });
    return Array.from(unique.values());
  }, [abilities, abilityOptions]);

  const filteredAbilities = useMemo(() => {
    const keyword = abilitySearch.trim().toLowerCase();
    return visibleAbilityOptions.filter((item) => {
      const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
      const matchesKeyword =
        !keyword ||
        `${item.graphName}${item.taskName}${item.abilityCode}${item.abilityName}${item.description}`
          .toLowerCase()
          .includes(keyword);
      return matchesSource && matchesKeyword;
    });
  }, [visibleAbilityOptions, abilitySearch, sourceFilter]);

  const sourceCounts = useMemo(
    () => ({
      all: visibleAbilityOptions.length,
      course: visibleAbilityOptions.filter((item) => item.source === 'course').length,
      manual: visibleAbilityOptions.filter((item) => item.source === 'manual').length
    }),
    [visibleAbilityOptions]
  );

  const confirmManualAbilities = (manualAbilities: TrainingAbilityRef[]) => {
    const courseAbilities = abilities.filter((item) => item.source === 'course');
    const nextAbilities = [...courseAbilities, ...manualAbilities];
    const activeCodes = new Set(nextAbilities.map((item) => item.abilityCode));
    setAbilities(nextAbilities);
    setRubrics((previous) =>
      previous.map((rubric) => ({
        ...rubric,
        abilityWeights: rubric.abilityWeights.filter((mapping) => activeCodes.has(mapping.abilityCode))
      }))
    );
    setSourceFilter(manualAbilities.length > 0 ? 'manual' : 'all');
    toast({
      title: manualAbilities.length > 0 ? `已补充 ${manualAbilities.length} 个能力点` : '已移除手动补充能力点',
      description: '仅更新当前实训任务的能力关联',
      status: 'success',
      position: 'top',
      duration: 1800
    });
  };

  const ensureRubrics = () => {
    if (rubrics.length > 0 || abilities.length === 0) return;
    const base = Math.floor(100 / abilities.length);
    let remainder = 100 - base * abilities.length;
    setRubrics(
      abilities.map((ability) => {
        const maxScore = base + (remainder > 0 ? 1 : 0);
        remainder -= remainder > 0 ? 1 : 0;
        return {
          id: newRubricId(),
          name: `${ability.abilityName}实训表现`,
          description: `评价学生在「${ability.abilityName}」方面的操作过程与完成质量`,
          maxScore,
          abilityWeights: [
            { abilityCode: ability.abilityCode, abilityName: ability.abilityName, weight: 100 }
          ]
        };
      })
    );
  };

  const validateStep = () => {
    if (step === 1) {
      if (!title.trim() || selectedClasses.length === 0 || !deadline) {
        toast({
          title: '请完善任务名称、发布班级和截止时间',
          status: 'warning',
          position: 'top',
          duration: 1800
        });
        return false;
      }
    }
    if (step === 2 && abilities.length === 0) {
      toast({ title: '请至少关联 1 个能力点', status: 'warning', position: 'top', duration: 1800 });
      return false;
    }
    if (step === 3) {
      if (rubrics.length === 0 || rubrics.some((item) => !item.name.trim() || item.maxScore <= 0)) {
        toast({ title: '请完善评价项名称和分值', status: 'warning', position: 'top', duration: 1800 });
        return false;
      }
      const invalid = rubrics.some(
        (item) =>
          item.abilityWeights.length === 0 ||
          item.abilityWeights.reduce((sum, mapping) => sum + mapping.weight, 0) !== 100
      );
      if (invalid) {
        toast({ title: '每个评价项的能力权重需合计为 100%', status: 'warning', position: 'top', duration: 2200 });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step === 2) ensureRubrics();
    setStep((value) => Math.min(4, value + 1));
  };

  const toggleClass = (name: string) =>
    setSelectedClasses((previous) =>
      previous.includes(name) ? previous.filter((item) => item !== name) : [...previous, name]
    );

  const toggleAbility = (option: TrainingAbilityRef) => {
    const selected = abilities.some(
      (item) => item.graphId === option.graphId && item.abilityCode === option.abilityCode
    );
    if (selected) {
      setAbilities((previous) =>
        previous.filter(
          (item) => !(item.graphId === option.graphId && item.abilityCode === option.abilityCode)
        )
      );
      setRubrics((previous) =>
        previous.map((rubric) => ({
          ...rubric,
          abilityWeights: rubric.abilityWeights.filter(
            (mapping) => mapping.abilityCode !== option.abilityCode
          )
        }))
      );
    } else {
      setAbilities((previous) => [...previous, option]);
    }
  };

  const updateRubric = (id: string, patch: Partial<TrainingRubricItem>) =>
    setRubrics((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );

  const updateMapping = (
    rubric: TrainingRubricItem,
    index: number,
    patch: Partial<AbilityWeight>
  ) => {
    const mappings = rubric.abilityWeights.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    );
    updateRubric(rubric.id, { abilityWeights: mappings });
  };

  const handleSave = (status: TrainingTaskStatus) => {
    if (status !== 'draft') {
      for (const targetStep of [1, 2, 3]) {
        setStep(targetStep);
        if (targetStep === 1 && (!title.trim() || selectedClasses.length === 0 || !deadline)) {
          toast({ title: '基本信息尚未完整', status: 'warning', position: 'top' });
          return;
        }
        if (targetStep === 2 && abilities.length === 0) {
          toast({ title: '请至少关联 1 个能力点', status: 'warning', position: 'top' });
          return;
        }
        if (
          targetStep === 3 &&
          (rubrics.length === 0 ||
            rubrics.some(
              (item) =>
                !item.name.trim() ||
                item.maxScore <= 0 ||
                item.abilityWeights.length === 0 ||
                item.abilityWeights.reduce((sum, mapping) => sum + mapping.weight, 0) !== 100
            ))
        ) {
          toast({ title: '评价项或能力权重配置不完整', status: 'warning', position: 'top' });
          return;
        }
      }
      setStep(4);
    }
    const time = nowText();
    onSave(
      {
        id: editingTask?.id ?? `training-${Date.now()}`,
        title: title.trim() || '未命名实训任务',
        courseName,
        description: description.trim(),
        requirements: requirements.split('\n').map((item) => item.trim()).filter(Boolean),
        classNames: selectedClasses,
        deadline,
        status,
        abilities,
        rubrics,
        createdAt: editingTask?.createdAt ?? time,
        updatedAt: time
      },
      status
    );
    onClose();
  };

  const stepLabels = ['基本信息', '能力关联', '评价映射', '预览发布'];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="5xl" scrollBehavior="inside">
      <ModalOverlay bg="rgba(17,24,39,0.58)" backdropFilter="blur(3px)" />
      <ModalContent
        mx={3}
        maxH="calc(100vh - 32px)"
        borderRadius="20px"
        border="1px solid #E5E6EB"
        boxShadow="0 24px 70px rgba(31,35,41,0.24)"
        overflow="hidden"
      >
        <ModalHeader px={{ base: 4, md: 6 }} py={4} borderBottom="1px solid #F0F1F3">
          <Text fontSize="md" fontWeight={700} color="#1D2129">
            {editingTask ? '编辑实训任务' : '创建实训任务'}
          </Text>
          <Flex gap={2} mt={3} pr={10} overflowX="auto">
            {stepLabels.map((label, index) => {
              const number = index + 1;
              const active = step === number;
              const done = step > number;
              return (
                <Flex key={label} align="center" gap={2} flex={1} minW="130px">
                  <Flex
                    w="24px"
                    h="24px"
                    borderRadius="full"
                    align="center"
                    justify="center"
                    fontSize="xs"
                    fontWeight={700}
                    color={active || done ? 'white' : '#86909C'}
                    bg={active || done ? '#C83E3E' : '#F2F3F5'}
                  >
                    {done ? <Check size={13} /> : number}
                  </Flex>
                  <Text fontSize="xs" fontWeight={active ? 700 : 500} color={active ? '#C83E3E' : '#646A73'}>
                    {label}
                  </Text>
                  {number < 4 ? <Box h="1px" bg="#E5E6EB" flex={1} /> : null}
                </Flex>
              );
            })}
          </Flex>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody px={{ base: 4, md: 6 }} py={5} bg="#FBFBFC">
          {step === 1 ? (
            <VStack align="stretch" spacing={4} maxW="820px" mx="auto">
              <Box bg="white" border="1px solid #E5E6EB" borderRadius="16px" p={{ base: 4, md: 5 }}>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight={650} mb={2}>任务名称 <Text as="span" color="#C83E3E">*</Text></Text>
                    <Input h="44px" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：动力电池 BMS 故障诊断实训" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight={650} mb={2}>任务简介</Text>
                    <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="说明实训情境、目标和成果要求" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight={650} mb={2}>任务要求</Text>
                    <Textarea rows={4} value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="每行一条要求" />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight={650} mb={2}>发布班级 <Text as="span" color="#C83E3E">*</Text></Text>
                    <Flex gap={2} flexWrap="wrap">
                      {classNames.map((name) => (
                        <Checkbox key={name} colorScheme="red" isChecked={selectedClasses.includes(name)} onChange={() => toggleClass(name)}>
                          <Text fontSize="sm">{name}</Text>
                        </Checkbox>
                      ))}
                    </Flex>
                  </Box>
                  <Box maxW="300px">
                    <Text fontSize="sm" fontWeight={650} mb={2}>截止时间 <Text as="span" color="#C83E3E">*</Text></Text>
                    <Input h="44px" type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
                  </Box>
                </VStack>
              </Box>
            </VStack>
          ) : null}

          {step === 2 ? (
            <VStack align="stretch" spacing={4}>
              <Flex direction={{ base: 'column', md: 'row' }} gap={3} align={{ md: 'center' }} justify="space-between">
                <Box>
                  <Text fontWeight={700} color="#1D2129">从岗位能力图谱选择能力点</Text>
                  <Text fontSize="xs" color="#86909C" mt={1}>能力均来自岗位能力图谱当前发布版本，发布任务后将固定引用版本快照。</Text>
                </Box>
                <Flex direction={{ base: 'column', sm: 'row' }} gap={2} w={{ base: '100%', md: 'auto' }}>
                  <Input bg="white" h="40px" w={{ base: '100%', md: '260px' }} value={abilitySearch} onChange={(event) => setAbilitySearch(event.target.value)} placeholder="搜索已关联能力" />
                  <Button
                    variant="secondary"
                    leftIcon={<Plus size={15} />}
                    flexShrink={0}
                    onClick={() => setIsManualPickerOpen(true)}
                  >
                    手动补充能力点
                  </Button>
                </Flex>
              </Flex>

              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={{ base: 3, md: 6 }}
                bg="white"
                border="1px solid #E5E6EB"
                borderRadius="14px"
                px={4}
                py={3}
              >
                {(Object.keys(sourceMeta) as AbilitySource[]).map((source) => {
                  const meta = sourceMeta[source];
                  return (
                    <Flex key={source} gap={2.5} align="flex-start" flex={1}>
                      <Badge mt="1px" flexShrink={0} bg={meta.bg} color={meta.color} borderRadius="full" px={2.5} py={0.5}>
                        {meta.label}
                      </Badge>
                      <Text fontSize="xs" color="#646A73" lineHeight="1.65">{meta.description}</Text>
                    </Flex>
                  );
                })}
              </Flex>

              <Flex justify="space-between" gap={3} flexWrap="wrap" align="center">
                <Flex gap={2} flexWrap="wrap">
                  {([
                    { key: 'all' as const, label: '全部能力' },
                    { key: 'course' as const, label: '课程继承' },
                    { key: 'manual' as const, label: '手动补充' }
                  ]).map((filter) => {
                    const active = sourceFilter === filter.key;
                    return (
                      <Box
                        key={filter.key}
                        as="button"
                        px={3}
                        py={1.5}
                        borderRadius="9px"
                        border="1px solid"
                        borderColor={active ? '#C83E3E' : '#E5E6EB'}
                        bg={active ? '#FFF1F0' : 'white'}
                        color={active ? '#C83E3E' : '#4E5969'}
                        fontSize="xs"
                        fontWeight={active ? 700 : 500}
                        onClick={() => setSourceFilter(filter.key)}
                        _hover={{ borderColor: active ? '#C83E3E' : '#C9CDD4' }}
                      >
                        {filter.label} {sourceCounts[filter.key]}
                      </Box>
                    );
                  })}
                </Flex>
                <Badge px={2.5} py={1} borderRadius="full" bg="#FFF1F0" color="#C83E3E">已选 {abilities.length} 项</Badge>
              </Flex>

              <VStack display={{ base: 'flex', md: 'none' }} align="stretch" spacing={2.5}>
                {filteredAbilities.map((option) => {
                  const active = abilities.some((item) => item.graphId === option.graphId && item.abilityCode === option.abilityCode);
                  const meta = sourceMeta[option.source];
                  return (
                    <Box
                      key={`mobile-${option.graphId}-${option.abilityCode}`}
                      textAlign="left"
                      cursor="pointer"
                      bg={active ? '#FFF8F7' : 'white'}
                      border="1px solid"
                      borderColor={active ? '#C83E3E' : '#E5E6EB'}
                      borderRadius="14px"
                      p={3.5}
                      onClick={() => toggleAbility(option)}
                    >
                      <Flex justify="space-between" align="flex-start" gap={3}>
                        <Box minW={0}>
                          <HStack spacing={2} mb={1}>
                            <Badge borderRadius="6px" bg="#F2F3F5" color="#4E5969">{option.abilityCode}</Badge>
                            <Text fontSize="sm" fontWeight={700} color="#1D2129" noOfLines={1}>{option.abilityName}</Text>
                          </HStack>
                          <Text fontSize="xs" color="#86909C" lineHeight="1.55">{option.description}</Text>
                        </Box>
                        <Checkbox
                          mt={0.5}
                          colorScheme="red"
                          isChecked={active}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleAbility(option)}
                          aria-label={`选择能力点 ${option.abilityName}`}
                        />
                      </Flex>
                      <Flex mt={3} pt={3} borderTop="1px solid #F0F1F3" gap={3}>
                        <Box flex={1} minW={0}>
                          <Text fontSize="10px" color="#A2A8B0" mb={0.5}>所属工作任务</Text>
                          <Text fontSize="xs" fontWeight={600} color="#4E5969" noOfLines={1}>{option.taskName} · {option.taskCode}</Text>
                        </Box>
                        <Box flex={1} minW={0}>
                          <Text fontSize="10px" color="#A2A8B0" mb={0.5}>岗位能力图谱 / 版本</Text>
                          <Text fontSize="xs" fontWeight={600} color="#4E5969" noOfLines={1}>{option.graphName} · {option.graphVersion}</Text>
                        </Box>
                      </Flex>
                      <Flex mt={2.5} align="center" justify="space-between" gap={2}>
                        <Text fontSize="10px" color="#A2A8B0">关联来源</Text>
                        <HStack spacing={2} justify="flex-end">
                          <Badge bg={meta.bg} color={meta.color} borderRadius="full" px={2.5}>{option.manualOrigin === 'teacher' ? '教师新增' : meta.label}</Badge>
                          <Text fontSize="10px" color="#86909C">
                            {option.source === 'course'
                              ? `来自${courseName}`
                              : option.manualOrigin === 'teacher'
                                ? '教师新增'
                                : `来自${option.graphName} ${option.graphVersion}`}
                          </Text>
                        </HStack>
                      </Flex>
                    </Box>
                  );
                })}
                {filteredAbilities.length === 0 ? (
                  <Flex minH="130px" bg="white" border="1px solid #E5E6EB" borderRadius="14px" align="center" justify="center" direction="column" gap={1}>
                    <Text fontSize="sm" fontWeight={600} color="#4E5969">{sourceFilter === 'manual' ? '尚未手动补充能力点' : '未找到匹配的能力点'}</Text>
                    <Text fontSize="xs" color="#A2A8B0">{sourceFilter === 'manual' ? '点击“手动补充能力点”从岗位能力图谱选择' : '请调整来源筛选或搜索关键词'}</Text>
                  </Flex>
                ) : null}
              </VStack>

              <Box display={{ base: 'none', md: 'block' }} bg="white" border="1px solid #E5E6EB" borderRadius="14px" overflowX="auto">
                <Table size="sm" minW="920px">
                  <Thead bg="#F7F8FA">
                    <Tr>
                      <Th w="52px" px={4} py={3}>选择</Th>
                      <Th w="280px" py={3}>
                        <Tooltip label="能力点编码、名称及能力定义" placement="top" hasArrow>
                          <Text as="span" cursor="help">能力点</Text>
                        </Tooltip>
                      </Th>
                      <Th w="160px" py={3}>
                        <Tooltip label="该能力点在岗位能力图谱中所属的工作任务" placement="top" hasArrow>
                          <Text as="span" cursor="help">所属工作任务</Text>
                        </Tooltip>
                      </Th>
                      <Th w="180px" py={3}>
                        <Tooltip label="提供该能力点的岗位能力图谱" placement="top" hasArrow>
                          <Text as="span" cursor="help">岗位能力图谱</Text>
                        </Tooltip>
                      </Th>
                      <Th w="90px" py={3}>
                        <Tooltip label="发布任务时保存的图谱版本快照" placement="top" hasArrow>
                          <Text as="span" cursor="help">图谱版本</Text>
                        </Tooltip>
                      </Th>
                      <Th w="190px" py={3} pr={4}>
                        <Tooltip label="课程继承为系统推荐，手动补充为教师额外选择" placement="top" hasArrow>
                          <Text as="span" cursor="help">关联来源</Text>
                        </Tooltip>
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredAbilities.map((option) => {
                      const active = abilities.some((item) => item.graphId === option.graphId && item.abilityCode === option.abilityCode);
                      const meta = sourceMeta[option.source];
                      return (
                        <Tr
                          key={`${option.graphId}-${option.abilityCode}`}
                          cursor="pointer"
                          bg={active ? '#FFF8F7' : 'white'}
                          onClick={() => toggleAbility(option)}
                          _hover={{ bg: active ? '#FFF4F2' : '#FAFAFB' }}
                          transition="background .14s ease"
                        >
                          <Td px={4} py={3.5}>
                            <Checkbox
                              colorScheme="red"
                              isChecked={active}
                              onClick={(event) => event.stopPropagation()}
                              onChange={() => toggleAbility(option)}
                              aria-label={`选择能力点 ${option.abilityName}`}
                            />
                          </Td>
                          <Td py={3.5}>
                            <HStack spacing={2} mb={1}>
                              <Badge borderRadius="6px" bg="#F2F3F5" color="#4E5969">{option.abilityCode}</Badge>
                              <Text fontSize="sm" fontWeight={700} color="#1D2129">{option.abilityName}</Text>
                            </HStack>
                            <Text fontSize="xs" color="#86909C" lineHeight="1.55">{option.description}</Text>
                          </Td>
                          <Td py={3.5}>
                            <Text fontSize="sm" fontWeight={600} color="#4E5969">{option.taskName}</Text>
                            <Text fontSize="xs" color="#A2A8B0" mt={1}>任务编码 {option.taskCode}</Text>
                          </Td>
                          <Td py={3.5}>
                            <Text fontSize="sm" color="#4E5969">{option.graphName}</Text>
                          </Td>
                          <Td py={3.5}>
                            <Badge borderRadius="full" bg="#F2F3F5" color="#4E5969" px={2}>{option.graphVersion}</Badge>
                          </Td>
                          <Td py={3.5} pr={4}>
                            <Badge bg={meta.bg} color={meta.color} borderRadius="full" px={2.5} py={0.5}>{option.manualOrigin === 'teacher' ? '教师新增' : meta.label}</Badge>
                            <Text fontSize="11px" color="#86909C" mt={1.5} lineHeight="1.5">
                              {option.source === 'course'
                                ? `来源：${courseName}`
                                : option.manualOrigin === 'teacher'
                                  ? `来源：教师新增 · 基于 ${option.graphName} ${option.graphVersion}`
                                  : `来源：${option.graphName} ${option.graphVersion}`}
                            </Text>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
                {filteredAbilities.length === 0 ? (
                  <Flex minH="150px" align="center" justify="center" direction="column" gap={1}>
                    <Text fontSize="sm" fontWeight={600} color="#4E5969">{sourceFilter === 'manual' ? '尚未手动补充能力点' : '未找到匹配的能力点'}</Text>
                    <Text fontSize="xs" color="#A2A8B0">{sourceFilter === 'manual' ? '点击“手动补充能力点”从岗位能力图谱选择' : '请调整来源筛选或搜索关键词'}</Text>
                  </Flex>
                ) : null}
              </Box>

              {abilities.length > 0 ? (
                <Flex gap={2} flexWrap="wrap">
                  {abilities.map((item) => {
                    const meta = sourceMeta[item.source];
                    return (
                      <Badge key={`${item.graphId}-${item.abilityCode}`} px={2.5} py={1} borderRadius="full" bg={meta.bg} color={meta.color}>
                        {item.abilityCode} {item.abilityName} · {item.manualOrigin === 'teacher' ? '教师新增' : meta.label}
                      </Badge>
                    );
                  })}
                </Flex>
              ) : null}

              <Box bg="#FFF7F7" border="1px solid #F4D7D7" borderRadius="14px" px={4} py={3}>
                <HStack color="#C83E3E" mb={1}><Sparkles size={16} /><Text fontSize="sm" fontWeight={700}>AI 关联建议</Text></HStack>
                <Text fontSize="xs" color="#646A73" lineHeight="1.75">根据课程「{courseName}」，建议优先采用课程继承的“故障诊断”、“绝缘检测”和“高压系统操作”。如任务存在额外评价目标，可从当前发布版岗位能力图谱中手动补充，补充项不会改变课程原有映射。</Text>
              </Box>
            </VStack>
          ) : null}

          {step === 3 ? (
            <VStack align="stretch" spacing={3}>
              <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
                <Box>
                  <Text fontWeight={700} color="#1D2129">评价项与能力映射</Text>
                  <Text fontSize="xs" color="#86909C" mt={1}>同一评价项的能力权重必须合计为 100%。</Text>
                </Box>
                <Button variant="secondary" leftIcon={<Plus size={15} />} onClick={() => setRubrics((previous) => [...previous, { id: newRubricId(), name: '', description: '', maxScore: 10, abilityWeights: abilities[0] ? [{ abilityCode: abilities[0].abilityCode, abilityName: abilities[0].abilityName, weight: 100 }] : [] }])}>添加评价项</Button>
              </Flex>
              <Flex gap={2} flexWrap="wrap">
                <Badge px={2.5} py={1} borderRadius="full" bg="#F2F3F5" color="#4E5969">评价项 {rubrics.length}</Badge>
                <Badge px={2.5} py={1} borderRadius="full" bg={totalRubricScore({ rubrics } as TrainingTask) === 100 ? '#ECFDF5' : '#FFFBEB'} color={totalRubricScore({ rubrics } as TrainingTask) === 100 ? '#059669' : '#D97706'}>总分 {rubrics.reduce((sum, item) => sum + item.maxScore, 0)} 分</Badge>
              </Flex>
              {rubrics.map((rubric, rubricIndex) => {
                const weightTotal = rubric.abilityWeights.reduce((sum, item) => sum + item.weight, 0);
                return (
                  <Box key={rubric.id} bg="white" border="1px solid #E5E6EB" borderRadius="16px" p={4}>
                    <Flex gap={3} align="flex-start">
                      <Flex w="28px" h="28px" align="center" justify="center" bg="#FFF1F0" color="#C83E3E" fontWeight={700} borderRadius="9px" flexShrink={0}>{rubricIndex + 1}</Flex>
                      <VStack flex={1} align="stretch" spacing={3}>
                        <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
                          <Input h="40px" value={rubric.name} onChange={(event) => updateRubric(rubric.id, { name: event.target.value })} placeholder="评价项名称" />
                          <NumberInput w={{ base: '100%', md: '120px' }} min={1} max={100} value={rubric.maxScore} onChange={(_, value) => updateRubric(rubric.id, { maxScore: Number.isFinite(value) ? value : 0 })}>
                            <NumberInputField h="40px" pr={2} placeholder="满分" />
                          </NumberInput>
                        </Flex>
                        <Input h="40px" value={rubric.description} onChange={(event) => updateRubric(rubric.id, { description: event.target.value })} placeholder="评价说明" />
                        <Divider />
                        <Flex justify="space-between" align="center">
                          <Text fontSize="xs" fontWeight={700} color="#4E5969">能力贡献映射</Text>
                          <Badge borderRadius="full" bg={weightTotal === 100 ? '#ECFDF5' : '#FEF2F2'} color={weightTotal === 100 ? '#059669' : '#DC2626'}>合计 {weightTotal}%</Badge>
                        </Flex>
                        {rubric.abilityWeights.map((mapping, mappingIndex) => (
                          <Flex key={`${rubric.id}-${mappingIndex}`} gap={2} align="center">
                            <Select h="38px" value={mapping.abilityCode} onChange={(event) => {
                              const selected = abilities.find((item) => item.abilityCode === event.target.value);
                              if (selected) updateMapping(rubric, mappingIndex, { abilityCode: selected.abilityCode, abilityName: selected.abilityName });
                            }}>
                              {abilities.map((item) => <option key={`${item.graphId}-${item.abilityCode}`} value={item.abilityCode}>{item.abilityCode} · {item.abilityName}</option>)}
                            </Select>
                            <NumberInput w="100px" min={0} max={100} value={mapping.weight} onChange={(_, value) => updateMapping(rubric, mappingIndex, { weight: Number.isFinite(value) ? value : 0 })}>
                              <NumberInputField h="38px" pr={2} />
                            </NumberInput>
                            <Text fontSize="xs" color="#86909C">%</Text>
                            <Button aria-label="删除能力映射" variant="tertiary" minW="38px" px={0} leftIcon={<Trash2 size={15} />} onClick={() => updateRubric(rubric.id, { abilityWeights: rubric.abilityWeights.filter((_, index) => index !== mappingIndex) })} />
                          </Flex>
                        ))}
                        <Button alignSelf="flex-start" variant="tertiary" leftIcon={<Plus size={14} />} isDisabled={rubric.abilityWeights.length >= abilities.length} onClick={() => {
                          const unused = abilities.find((ability) => !rubric.abilityWeights.some((mapping) => mapping.abilityCode === ability.abilityCode));
                          if (unused) updateRubric(rubric.id, { abilityWeights: [...rubric.abilityWeights, { abilityCode: unused.abilityCode, abilityName: unused.abilityName, weight: 0 }] });
                        }}>添加关联能力</Button>
                      </VStack>
                      <Button aria-label="删除评价项" variant="tertiary" minW="38px" px={0} color="#86909C" leftIcon={<Trash2 size={15} />} onClick={() => setRubrics((previous) => previous.filter((item) => item.id !== rubric.id))} />
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          ) : null}

          {step === 4 ? (
            <VStack align="stretch" spacing={4}>
              <Box bg="linear-gradient(135deg,#7F1D1D 0%,#C83E3E 100%)" color="white" borderRadius="18px" p={{ base: 5, md: 6 }}>
                <Badge bg="whiteAlpha.300" color="white" borderRadius="full" px={2.5} mb={3}>{courseName}</Badge>
                <Text fontSize="xl" fontWeight={750}>{title || '未命名实训任务'}</Text>
                <Text fontSize="sm" color="whiteAlpha.800" mt={2}>{description || '暂无任务简介'}</Text>
                <Flex gap={5} mt={4} flexWrap="wrap" fontSize="sm">
                  <Text>{selectedClasses.length} 个班级</Text><Text>{abilities.length} 个能力点</Text><Text>{rubrics.length} 个评价项</Text><Text>{rubrics.reduce((sum, item) => sum + item.maxScore, 0)} 分</Text>
                </Flex>
              </Box>
              <Flex direction={{ base: 'column', lg: 'row' }} gap={4}>
                <Box flex={1} bg="white" border="1px solid #E5E6EB" borderRadius="16px" p={5}>
                  <Text fontWeight={700} mb={3}>发布信息</Text>
                  <VStack align="stretch" spacing={2} fontSize="sm" color="#4E5969">
                    <Text>发布班级：{selectedClasses.join('、')}</Text>
                    <Text>截止时间：{deadline.replace('T', ' ')}</Text>
                    <Text>任务要求：{requirements.split('\n').filter(Boolean).length} 条</Text>
                  </VStack>
                </Box>
                <Box flex={1} bg="white" border="1px solid #E5E6EB" borderRadius="16px" p={5}>
                  <Text fontWeight={700} mb={3}>岗位能力快照</Text>
                  <Flex gap={2} flexWrap="wrap">
                    {abilities.map((item) => <Badge key={`${item.graphId}-${item.abilityCode}`} px={2.5} py={1.5} borderRadius="full" bg="#FFF1F0" color="#C83E3E">{item.abilityCode} {item.abilityName} · {item.graphVersion}</Badge>)}
                  </Flex>
                </Box>
              </Flex>
            </VStack>
          ) : null}
        </ModalBody>

        <ModalFooter px={{ base: 4, md: 6 }} py={4} borderTop="1px solid #F0F1F3" bg="white" gap={3}>
          {step > 1 ? <Button variant="tertiary" leftIcon={<ChevronLeft size={16} />} onClick={() => setStep((value) => value - 1)}>上一步</Button> : <Button variant="secondary" onClick={onClose}>取消</Button>}
          <Box flex={1} />
          {step < 4 ? <Button onClick={handleNext}>下一步：{stepLabels[step]}</Button> : (
            <>
              <Button variant="secondary" onClick={() => handleSave('draft')}>保存草稿</Button>
              <Button onClick={() => handleSave('published')}>发布任务</Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
      </Modal>
      <ManualAbilityPickerDrawer
        isOpen={isManualPickerOpen}
        onClose={() => setIsManualPickerOpen(false)}
        options={abilityOptions}
        selected={abilities.filter((item) => item.source === 'manual')}
        onConfirm={confirmManualAbilities}
      />
    </>
  );
}
