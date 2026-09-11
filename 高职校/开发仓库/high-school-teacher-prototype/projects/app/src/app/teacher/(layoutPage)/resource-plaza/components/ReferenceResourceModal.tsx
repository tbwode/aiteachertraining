'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import { Bot, BookOpen, GitBranch, Link2 } from 'lucide-react';
import {
  createResourceReference,
  type PlazaResourceVO,
  type ResourceReferenceTarget
} from '@/api/teacher/resource/resource-plaza';

const targets = {
  course: [
    {
      id: 401,
      name: '动力电池管理系统检修',
      locations: [
        { id: 'chapter-1-2', name: '模块1·动力电池认知 / 1.2 电池安全防护' },
        { id: 'chapter-2-1', name: '模块2·BMS 系统检修 / 2.1 BMS 硬件架构' },
        { id: 'chapter-2-2', name: '模块2·BMS 系统检修 / 2.2 单体均衡策略' }
      ]
    },
    {
      id: 402,
      name: '新能源汽车故障诊断',
      locations: [
        { id: 'project-1', name: '项目一·高压不上电故障诊断' },
        { id: 'project-2', name: '项目二·热管理系统故障诊断' }
      ]
    }
  ],
  avatar: [
    {
      id: 901,
      name: '动力电池管理系统检修',
      locations: [
        { id: 'knowledge-basic', name: '课程基础知识库' },
        { id: 'knowledge-diagnosis', name: '故障诊断知识库' },
        { id: 'knowledge-training', name: '实训指导知识库' }
      ]
    },
    {
      id: 902,
      name: '新能源汽车高压安全实训',
      locations: [
        { id: 'knowledge-safety', name: '安全规范知识库' },
        { id: 'knowledge-cases', name: '企业案例知识库' }
      ]
    }
  ]
} as const;

type ReferenceResourceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resource: PlazaResourceVO | null;
  onSuccess?: (created: boolean) => void;
};

export default function ReferenceResourceModal({
  isOpen,
  onClose,
  resource,
  onSuccess
}: ReferenceResourceModalProps) {
  const toast = useToast();
  const [targetType, setTargetType] = useState<ResourceReferenceTarget>('course');
  const [targetId, setTargetId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const targetOptions = targets[targetType];
  const selectedTarget = useMemo(
    () => targetOptions.find((item) => String(item.id) === targetId),
    [targetId, targetOptions]
  );

  useEffect(() => {
    if (!isOpen) return;
    setTargetType('course');
    setTargetId('');
    setLocationId('');
  }, [isOpen]);

  useEffect(() => {
    setTargetId('');
    setLocationId('');
  }, [targetType]);

  const handleSubmit = async () => {
    if (!resource || !selectedTarget || !locationId) return;
    const location = selectedTarget.locations.find((item) => item.id === locationId);
    if (!location) return;
    setSubmitting(true);
    try {
      const result = await createResourceReference({
        resourceId: resource.id,
        targetType,
        targetId: selectedTarget.id,
        targetName: selectedTarget.name,
        locationId: location.id,
        locationName: location.name
      });
      if (!result.success) throw new Error(result.reason);
      toast({
        title: result.duplicated ? '该位置已引用此资源' : '资源引用成功',
        description:
          targetType === 'avatar' ? '已加入 AI 教师分身资源解析队列' : '已添加到选定课程章节',
        status: 'success',
        duration: 2200,
        position: 'top'
      });
      onSuccess?.(!result.duplicated);
      onClose();
    } catch (error) {
      toast({
        title: '引用失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        status: 'error',
        duration: 2200,
        position: 'top'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="rgba(15,23,42,.42)" backdropFilter="blur(4px)" />
      <ModalContent mx={4} borderRadius="18px" overflow="hidden" maxH="90vh">
        <ModalHeader px={{ base: 5, md: 6 }} py={5} borderBottom="1px solid" borderColor="#EAECF0">
          <Flex align="center" gap={3} pr={8}>
            <Flex
              w="40px"
              h="40px"
              borderRadius="12px"
              bg="#FFF1F0"
              color="#B4232D"
              align="center"
              justify="center"
            >
              <Link2 size={20} aria-hidden="true" />
            </Flex>
            <Box minW={0}>
              <Text fontSize="17px" color="#182230" fontWeight={700}>
                引用资源
              </Text>
              <Text mt={0.5} fontSize="12px" color="#667085" noOfLines={1}>
                {resource?.title}
              </Text>
            </Box>
          </Flex>
        </ModalHeader>
        <ModalCloseButton top="18px" right="18px" borderRadius="9px" />

        <ModalBody px={{ base: 5, md: 6 }} py={5} overflowY="auto">
          <FormControl as="fieldset">
            <FormLabel as="legend" color="#344054" fontSize="13px" fontWeight={600}>
              选择引用方式
            </FormLabel>
            <RadioGroup
              value={targetType}
              onChange={(value) => setTargetType(value as ResourceReferenceTarget)}
            >
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={3}>
                {[
                  {
                    value: 'course',
                    title: '引用到课程',
                    description: '放入指定课程章节',
                    icon: BookOpen
                  },
                  {
                    value: 'avatar',
                    title: '引用到 AI 教师分身',
                    description: '加入分身知识库',
                    icon: Bot
                  }
                ].map((option) => {
                  const Icon = option.icon;
                  const selected = targetType === option.value;
                  return (
                    <Box
                      as="label"
                      key={option.value}
                      flex="1"
                      p={4}
                      border="1px solid"
                      borderColor={selected ? '#B4232D' : '#D0D5DD'}
                      borderRadius="12px"
                      bg={selected ? '#FFF8F7' : 'white'}
                      cursor="pointer"
                    >
                      <Flex align="flex-start" gap={3}>
                        <Radio value={option.value} colorScheme="red" mt={0.5} />
                        <Box>
                          <Flex align="center" gap={2} color={selected ? '#B4232D' : '#344054'}>
                            <Icon size={17} aria-hidden="true" />
                            <Text fontSize="13px" fontWeight={700}>
                              {option.title}
                            </Text>
                          </Flex>
                          <Text mt={1} color="#667085" fontSize="12px">
                            {option.description}
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>
            </RadioGroup>
          </FormControl>

          <Stack spacing={4} mt={5}>
            <FormControl isRequired>
              <FormLabel color="#344054" fontSize="13px" fontWeight={600}>
                {targetType === 'course' ? '选择课程' : '选择 AI 教师分身'}
              </FormLabel>
              <Select
                value={targetId}
                onChange={(event) => {
                  setTargetId(event.target.value);
                  setLocationId('');
                }}
                placeholder={targetType === 'course' ? '请选择课程' : '请选择 AI 教师分身'}
                h="44px"
                borderRadius="10px"
                focusBorderColor="#B4232D"
              >
                {targetOptions.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired isDisabled={!selectedTarget}>
              <FormLabel color="#344054" fontSize="13px" fontWeight={600}>
                {targetType === 'course' ? '选择课程章节' : '选择知识目录'}
              </FormLabel>
              <Select
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                placeholder={selectedTarget ? '请选择引用位置' : '请先选择目标'}
                h="44px"
                borderRadius="10px"
                focusBorderColor="#B4232D"
              >
                {selectedTarget?.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Alert
            mt={5}
            status="info"
            borderRadius="12px"
            bg="#F5F8FF"
            color="#344054"
            alignItems="flex-start"
          >
            <AlertIcon color="#175CD3" mt={0.5} />
            <AlertDescription fontSize="12px" lineHeight="1.7">
              引用将绑定当前 v{resource?.version ?? 1}{' '}
              版本，不会修改源资源。新版本发布后可在“我的引用”中手动升级。
            </AlertDescription>
          </Alert>
        </ModalBody>

        <ModalFooter
          px={{ base: 5, md: 6 }}
          py={4}
          borderTop="1px solid"
          borderColor="#EAECF0"
          gap={3}
        >
          <Button variant="outline" borderColor="#D0D5DD" borderRadius="10px" onClick={onClose}>
            取消
          </Button>
          <Button
            leftIcon={<GitBranch size={16} aria-hidden="true" />}
            bg="#B4232D"
            color="white"
            borderRadius="10px"
            isDisabled={!selectedTarget || !locationId}
            isLoading={submitting}
            loadingText="正在引用"
            onClick={() => void handleSubmit()}
            _hover={{ bg: '#8F1D26' }}
          >
            确认引用
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
