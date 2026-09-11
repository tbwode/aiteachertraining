'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Grid,
  HStack,
  Input,
  Select,
  Text,
  Textarea,
  VStack
} from '@chakra-ui/react';
import { GitBranch, Plus, Search, X } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import type { TrainingAbilityRef } from './types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  options: TrainingAbilityRef[];
  selected: TrainingAbilityRef[];
  onConfirm: (abilities: TrainingAbilityRef[]) => void;
};

const abilityKey = (item: TrainingAbilityRef) => `${item.graphId}-${item.abilityCode}`;
const taskKey = (item: TrainingAbilityRef) => `${item.graphId}::${item.taskCode}`;

export function ManualAbilityPickerDrawer({
  isOpen,
  onClose,
  options,
  selected,
  onConfirm
}: Props) {
  const [keyword, setKeyword] = useState('');
  const [draftKeys, setDraftKeys] = useState<string[]>([]);
  const [customOptions, setCustomOptions] = useState<TrainingAbilityRef[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customTaskKey, setCustomTaskKey] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setKeyword('');
    setDraftKeys(selected.map(abilityKey));
    setCustomOptions(selected.filter((item) => item.manualOrigin === 'teacher'));
    setIsCreating(false);
    setCustomCode('');
    setCustomName('');
    setCustomDescription('');
    setCustomTaskKey('');
  }, [isOpen, selected]);

  const taskOptions = useMemo(() => {
    const unique = new Map<string, TrainingAbilityRef>();
    options.forEach((item) => unique.set(taskKey(item), item));
    return Array.from(unique.values());
  }, [options]);

  const manualOptions = useMemo(
    () => {
      const unique = new Map<string, TrainingAbilityRef>();
      [...options.filter((item) => item.source === 'manual'), ...customOptions].forEach((item) =>
        unique.set(abilityKey(item), item)
      );
      return Array.from(unique.values());
    },
    [customOptions, options]
  );

  const filteredOptions = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return manualOptions;
    return manualOptions.filter((item) =>
      `${item.graphName}${item.graphVersion}${item.taskName}${item.taskCode}${item.abilityName}${item.abilityCode}${item.description}`
        .toLowerCase()
        .includes(search)
    );
  }, [keyword, manualOptions]);

  const toggle = (option: TrainingAbilityRef) => {
    const key = abilityKey(option);
    setDraftKeys((previous) =>
      previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]
    );
  };

  const confirm = () => {
    onConfirm(manualOptions.filter((item) => draftKeys.includes(abilityKey(item))));
    onClose();
  };

  const startCreating = () => {
    const usedCodes = new Set([...options, ...customOptions].map((item) => item.abilityCode));
    let index = 1;
    while (usedCodes.has(`T${String(index).padStart(2, '0')}`)) index += 1;
    setCustomCode(`T${String(index).padStart(2, '0')}`);
    setCustomName('');
    setCustomDescription('');
    setCustomTaskKey(taskOptions[0] ? taskKey(taskOptions[0]) : '');
    setIsCreating(true);
  };

  const saveCustomAbility = () => {
    const code = customCode.trim().toUpperCase();
    const name = customName.trim();
    const task = taskOptions.find((item) => taskKey(item) === customTaskKey);
    if (!code || !name || !task) return;
    const duplicated = [...options, ...customOptions].some(
      (item) => item.graphId === task.graphId && item.abilityCode.toUpperCase() === code
    );
    if (duplicated) return;
    const created: TrainingAbilityRef = {
      graphId: task.graphId,
      graphName: task.graphName,
      graphVersion: task.graphVersion,
      taskCode: task.taskCode,
      taskName: task.taskName,
      abilityCode: code,
      abilityName: name,
      description: customDescription.trim() || '教师根据本次实训评价目标新增的能力点',
      source: 'manual',
      manualOrigin: 'teacher'
    };
    setCustomOptions((previous) => [...previous, created]);
    setDraftKeys((previous) => [...previous, abilityKey(created)]);
    setIsCreating(false);
  };

  const isDuplicateCode = useMemo(() => {
    const code = customCode.trim().toUpperCase();
    if (!code || !customTaskKey) return false;
    const task = taskOptions.find((item) => taskKey(item) === customTaskKey);
    if (!task) return false;
    return [...options, ...customOptions].some(
      (item) => item.graphId === task.graphId && item.abilityCode.toUpperCase() === code
    );
  }, [customCode, customOptions, customTaskKey, options, taskOptions]);

  const canSaveCustomAbility =
    Boolean(customCode.trim() && customName.trim() && customTaskKey) && !isDuplicateCode;

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay bg="rgba(17,24,39,0.48)" backdropFilter="blur(2px)" />
      <DrawerContent maxW={{ base: '100%', md: '560px' }}>
        <DrawerCloseButton top={4} right={4} />
        <DrawerHeader px={{ base: 4, md: 6 }} py={4} borderBottom="1px solid #F0F1F3">
          <HStack spacing={3} pr={10}>
            <Flex w="36px" h="36px" align="center" justify="center" borderRadius="11px" bg="#FFF1F0" color="#C83E3E" flexShrink={0}>
              <GitBranch size={18} />
            </Flex>
            <Box>
              <Text fontSize="md" fontWeight={700} color="#1D2129">手动补充能力点</Text>
              <Text fontSize="xs" color="#86909C" mt={0.5}>从岗位能力图谱当前发布版本中选择</Text>
            </Box>
          </HStack>
        </DrawerHeader>

        <DrawerBody px={{ base: 4, md: 6 }} py={5} bg="#FBFBFC">
          <VStack align="stretch" spacing={4}>
            <Flex direction={{ base: 'column', sm: 'row' }} gap={2}>
              <Box position="relative" flex={1}>
                <Flex position="absolute" left="13px" top="0" h="42px" align="center" color="#A2A8B0" pointerEvents="none">
                  <Search size={16} />
                </Flex>
                <Input
                  h="42px"
                  pl="38px"
                  bg="white"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索工作任务、能力点或编码"
                />
              </Box>
              <Button leftIcon={<Plus size={15} />} flexShrink={0} isDisabled={isCreating} onClick={startCreating}>
                新增能力点
              </Button>
            </Flex>

            {isCreating ? (
              <Box bg="white" border="1px solid #F1C5C5" boxShadow="0 8px 24px rgba(31,35,41,.06)" borderRadius="14px" p={4}>
                <Flex justify="space-between" align="flex-start" gap={3} mb={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight={700} color="#1D2129">新增任务专属能力点</Text>
                    <Text fontSize="xs" color="#86909C" mt={0.5}>能力点仅用于当前实训任务，不写回岗位能力图谱。</Text>
                  </Box>
                  <Button aria-label="取消新增能力点" variant="tertiary" minW="32px" h="32px" px={0} leftIcon={<X size={15} />} onClick={() => setIsCreating(false)} />
                </Flex>
                <VStack align="stretch" spacing={3.5}>
                  <Box>
                    <Text fontSize="xs" fontWeight={650} color="#4E5969" mb={1.5}>所属工作任务 <Text as="span" color="#C83E3E">*</Text></Text>
                    <Select h="40px" value={customTaskKey} onChange={(event) => setCustomTaskKey(event.target.value)}>
                      {taskOptions.map((task) => (
                        <option key={taskKey(task)} value={taskKey(task)}>{task.taskCode} · {task.taskName}（{task.graphName} {task.graphVersion}）</option>
                      ))}
                    </Select>
                  </Box>
                  <Grid templateColumns={{ base: '1fr', sm: '120px minmax(0,1fr)' }} gap={3}>
                    <Box>
                      <Text fontSize="xs" fontWeight={650} color="#4E5969" mb={1.5}>能力编码 <Text as="span" color="#C83E3E">*</Text></Text>
                      <Input h="40px" value={customCode} onChange={(event) => setCustomCode(event.target.value.toUpperCase())} placeholder="如 T01" />
                      {isDuplicateCode ? <Text fontSize="10px" color="#DC2626" mt={1}>当前图谱中已存在该编码</Text> : null}
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight={650} color="#4E5969" mb={1.5}>能力点名称 <Text as="span" color="#C83E3E">*</Text></Text>
                      <Input h="40px" value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="请输入能力点名称" />
                    </Box>
                  </Grid>
                  <Box>
                    <Text fontSize="xs" fontWeight={650} color="#4E5969" mb={1.5}>能力说明</Text>
                    <Textarea rows={3} value={customDescription} onChange={(event) => setCustomDescription(event.target.value)} placeholder="说明学生需要完成的操作、判断或成果要求" />
                  </Box>
                  <Flex justify="flex-end" gap={2}>
                    <Button variant="secondary" onClick={() => setIsCreating(false)}>取消</Button>
                    <Button isDisabled={!canSaveCustomAbility} onClick={saveCustomAbility}>保存并选中</Button>
                  </Flex>
                </VStack>
              </Box>
            ) : null}

            <Flex justify="space-between" align="center" gap={3}>
              <Text fontSize="xs" color="#646A73">可补充 {manualOptions.length} 项</Text>
              <Badge px={2.5} py={1} borderRadius="full" bg="#FFFBEB" color="#D97706">
                已选择 {draftKeys.length} 项
              </Badge>
            </Flex>

            <Box bg="#FFFBEB" border="1px solid #FDE7B2" borderRadius="12px" px={3.5} py={3}>
              <Text fontSize="xs" color="#8A5A00" lineHeight="1.7">
                手动补充不会修改课程与岗位能力图谱的原有映射，仅作为本实训任务的能力评价依据。
              </Text>
            </Box>

            <VStack align="stretch" spacing={2.5}>
              {filteredOptions.map((option) => {
                const checked = draftKeys.includes(abilityKey(option));
                return (
                  <Box
                    key={abilityKey(option)}
                    bg={checked ? '#FFF8F7' : 'white'}
                    border="1px solid"
                    borderColor={checked ? '#C83E3E' : '#E5E6EB'}
                    boxShadow={checked ? '0 0 0 3px rgba(200,62,62,.06)' : 'none'}
                    borderRadius="14px"
                    p={4}
                    cursor="pointer"
                    onClick={() => toggle(option)}
                    _hover={{ borderColor: checked ? '#C83E3E' : '#C9CDD4' }}
                  >
                    <Flex justify="space-between" gap={3} align="flex-start">
                      <Box minW={0}>
                        <HStack spacing={2} mb={1}>
                          <Badge borderRadius="6px" bg="#F2F3F5" color="#4E5969">{option.abilityCode}</Badge>
                          <Text fontSize="sm" fontWeight={700} color="#1D2129">{option.abilityName}</Text>
                          {option.manualOrigin === 'teacher' ? (
                            <Badge borderRadius="full" bg="#FFF1F0" color="#C83E3E" px={2}>教师新增</Badge>
                          ) : null}
                        </HStack>
                        <Text fontSize="xs" color="#646A73" lineHeight="1.65">{option.description}</Text>
                      </Box>
                      <Checkbox
                        colorScheme="red"
                        isChecked={checked}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => toggle(option)}
                        aria-label={`补充能力点 ${option.abilityName}`}
                      />
                    </Flex>
                    <Flex mt={3} pt={3} borderTop="1px solid #F0F1F3" gap={3} flexWrap="wrap">
                      <Box flex="1 1 150px">
                        <Text fontSize="10px" color="#A2A8B0">所属工作任务</Text>
                        <Text fontSize="xs" color="#4E5969" fontWeight={600} mt={0.5}>{option.taskName} · {option.taskCode}</Text>
                      </Box>
                      <Box flex="1 1 180px">
                        <Text fontSize="10px" color="#A2A8B0">来源图谱 / 发布版本</Text>
                        <Text fontSize="xs" color="#4E5969" fontWeight={600} mt={0.5}>
                          {option.manualOrigin === 'teacher' ? `教师新增 · 基于 ${option.graphName} ${option.graphVersion}` : `${option.graphName} · ${option.graphVersion}`}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
              {filteredOptions.length === 0 ? (
                <Flex minH="180px" border="1px dashed #DADDE2" borderRadius="14px" bg="white" align="center" justify="center" direction="column" gap={1}>
                  <Text fontSize="sm" fontWeight={600} color="#4E5969">未找到可补充的能力点</Text>
                  <Text fontSize="xs" color="#A2A8B0">请尝试其他搜索关键词</Text>
                </Flex>
              ) : null}
            </VStack>
          </VStack>
        </DrawerBody>

        <DrawerFooter px={{ base: 4, md: 6 }} py={4} borderTop="1px solid #F0F1F3" gap={3}>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={confirm}>确认补充（{draftKeys.length}）</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
