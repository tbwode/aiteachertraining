import { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  Textarea
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, CloseIcon, RepeatIcon, WarningIcon } from '@chakra-ui/icons';
import type { Mapping, Mastery } from '../mockData';
import { abilityIndex } from '../mockData';

const masteryOptions: Mastery[] = ['了解', '掌握', '精通'];

type MappingCardProps = {
  mapping: Mapping;
  highlighted: boolean;
  onConfirm: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onUndo: (id: string) => void;
  onMasteryChange: (id: string, mastery: Mastery) => void;
  onWeightChange: (id: string, weight: number) => void;
  onRebind: (id: string) => void;
  onIgnoreGovernance: (id: string) => void;
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  if (confidence >= 0.9) {
    return (
      <Text fontSize="xs" fontWeight={700} color="green.600" flexShrink={0}>
        {pct}% 高置信
      </Text>
    );
  }
  if (confidence >= 0.75) {
    return (
      <Text fontSize="xs" fontWeight={700} color="orange.600" flexShrink={0}>
        {pct}%
      </Text>
    );
  }
  return (
    <Text fontSize="xs" fontWeight={700} color="red.500" flexShrink={0}>
      {pct}% 低置信
    </Text>
  );
}

function StatusPill({ mapping }: { mapping: Mapping }) {
  if (mapping.status === 'confirmed') {
    return (
      <Box fontSize="11px" px={2} py={0.5} rounded="full" bg="green.50" color="green.600" fontWeight={600} flexShrink={0}>
        已确认
      </Box>
    );
  }
  if (mapping.status === 'rejected') {
    return (
      <Box fontSize="11px" px={2} py={0.5} rounded="full" bg="red.50" color="red.500" fontWeight={600} flexShrink={0}>
        已驳回
      </Box>
    );
  }
  if (mapping.governance && !mapping.governance.ignored) {
    return (
      <Box fontSize="11px" px={2} py={0.5} rounded="full" bg="red.50" color="red.500" fontWeight={600} flexShrink={0}>
        治理待办
      </Box>
    );
  }
  return (
    <Box fontSize="11px" px={2} py={0.5} rounded="full" bg="orange.50" color="orange.600" fontWeight={600} flexShrink={0}>
      待审核
    </Box>
  );
}

export default function MappingCard({
  mapping,
  highlighted,
  onConfirm,
  onReject,
  onUndo,
  onMasteryChange,
  onWeightChange,
  onRebind,
  onIgnoreGovernance
}: MappingCardProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonExpanded, setReasonExpanded] = useState(false);

  const isPending = mapping.status === 'pending';
  const targetDeprecated = abilityIndex[mapping.abilityCode]?.status === 'deprecated';
  const showGovernance = isPending && mapping.governance && !mapping.governance.ignored;
  const reasonLong = mapping.aiReason.length > 72;

  const cardBorderColor = highlighted
    ? 'primary.500'
    : showGovernance
      ? 'red.300'
      : mapping.status === 'rejected'
        ? 'red.200'
        : 'gray.200';

  if (!isPending) {
    // 已确认 / 已驳回：紧凑卡片
    const confirmed = mapping.status === 'confirmed';
    return (
      <Box
        bg="white"
        border="1px solid"
        borderColor={cardBorderColor}
        rounded="xl"
        px={4}
        py={2.5}
        boxShadow={highlighted ? '0 0 0 3px rgba(200,62,62,0.15)' : 'sm'}
        transition="box-shadow 0.2s ease"
      >
        <Flex align="center" gap={2}>
          {confirmed ? (
            <CheckIcon boxSize={3.5} color="green.500" flexShrink={0} />
          ) : (
            <CloseIcon boxSize={3} color="red.500" flexShrink={0} />
          )}
          <Text fontSize="13px" fontWeight={500} color="gray.800" noOfLines={1}>
            {mapping.knowledgeName}
          </Text>
          <Text fontSize="xs" color="gray.500" noOfLines={1} flex={1}>
            → {mapping.abilityCode} {mapping.abilityName} ·{' '}
            {confirmed ? `${mapping.mastery} · 权重 ${mapping.weight.toFixed(1)}` : '已驳回'}
          </Text>
          {mapping.rebound && (
            <Box fontSize="11px" px={1.5} py={0.5} rounded="md" bg="blue.50" color="blue.600" flexShrink={0}>
              已改绑 {mapping.abilityCode}
            </Box>
          )}
          <Button
            size="xs"
            variant="ghost"
            colorScheme="gray"
            leftIcon={<ArrowBackIcon />}
            onClick={() => onUndo(mapping.id)}
            flexShrink={0}
          >
            {confirmed ? '撤销' : '重新映射'}
          </Button>
        </Flex>
        {!confirmed && mapping.rejectReason && (
          <Text fontSize="xs" color="red.500" mt={1.5} pl={5}>
            驳回原因:{mapping.rejectReason}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor={cardBorderColor}
      rounded="xl"
      px={4}
      py={3.5}
      boxShadow={highlighted ? '0 0 0 3px rgba(200,62,62,0.15)' : 'sm'}
      transition="box-shadow 0.2s ease"
    >
      <Flex align="center" gap={2} mb={1.5}>
        <Text fontSize="sm" fontWeight={600} color="gray.800" noOfLines={1} flex={1}>
          <Text as="span" color="gray.400" fontWeight={400} fontSize="xs">
            {mapping.moduleName} · {mapping.sectionName} /
          </Text>{' '}
          {mapping.knowledgeName}
        </Text>
        <ConfidenceBadge confidence={mapping.confidence} />
        <StatusPill mapping={mapping} />
      </Flex>

      <Text fontSize="13px" color="gray.600" mb={2}>
        映射至 <Text as="span" color="gray.400">→</Text>{' '}
        <Text
          as="span"
          fontWeight={600}
          color={targetDeprecated ? 'red.500' : 'gray.800'}
          textDecoration={targetDeprecated ? 'line-through' : undefined}
        >
          {mapping.abilityCode} {mapping.abilityName}
        </Text>
      </Text>

      {showGovernance && mapping.governance && (
        <Flex
          align="center"
          gap={2}
          bg="orange.50"
          border="1px solid"
          borderColor="orange.200"
          rounded="lg"
          px={3}
          py={2}
          mb={2}
          flexWrap="wrap"
        >
          <WarningIcon color="orange.500" boxSize={3.5} flexShrink={0} />
          <Text fontSize="xs" color="gray.700" flex={1} minW="240px">
            目标能力点已在 <Text as="b">{mapping.governance.deprecatedVersion}</Text> 中废弃。AI 建议改绑:
            <Text as="b">
              {mapping.governance.suggestedCode} {mapping.governance.suggestedName}
            </Text>
            (匹配度 {Math.round(mapping.governance.suggestedConfidence * 100)}%)
          </Text>
          <Button
            size="xs"
            colorScheme="orange"
            variant="solid"
            leftIcon={<RepeatIcon />}
            onClick={() => onRebind(mapping.id)}
            flexShrink={0}
          >
            一键改绑
          </Button>
        </Flex>
      )}

      <Box bg="blue.50" rounded="lg" px={3} py={2} mb={3}>
        <Text fontSize="xs" color="gray.600" noOfLines={reasonExpanded ? undefined : 2}>
          <Text as="b" color="gray.700">
            AI 理由:
          </Text>
          {mapping.aiReason}
        </Text>
        {reasonLong && (
          <Text
            fontSize="xs"
            color="primary.500"
            cursor="pointer"
            onClick={() => setReasonExpanded((v) => !v)}
            w="fit-content"
          >
            {reasonExpanded ? '收起' : '展开'}
          </Text>
        )}
      </Box>

      <Flex align="center" gap={5} flexWrap="wrap">
        <HStack spacing={2}>
          <Text fontSize="xs" color="gray.500" flexShrink={0}>
            掌握要求
          </Text>
          <ButtonGroup size="xs" isAttached variant="outline">
            {masteryOptions.map((option) => (
              <Button
                key={option}
                onClick={() => onMasteryChange(mapping.id, option)}
                bg={mapping.mastery === option ? 'primary.500' : 'white'}
                color={mapping.mastery === option ? 'white' : 'gray.500'}
                borderColor={mapping.mastery === option ? 'primary.500' : 'gray.200'}
                fontWeight={mapping.mastery === option ? 600 : 400}
                _hover={{ bg: mapping.mastery === option ? 'primary.600' : 'gray.50' }}
              >
                {option}
              </Button>
            ))}
          </ButtonGroup>
        </HStack>

        <HStack spacing={2} minW="170px">
          <Text fontSize="xs" color="gray.500" flexShrink={0}>
            权重
          </Text>
          <Slider
            aria-label="权重"
            min={0.1}
            max={1}
            step={0.1}
            value={mapping.weight}
            onChange={(val) => onWeightChange(mapping.id, val)}
            w="76px"
          >
            <SliderTrack bg="gray.200">
              <SliderFilledTrack bg="primary.500" />
            </SliderTrack>
            <SliderThumb boxSize={3} />
          </Slider>
          <Text fontSize="xs" fontWeight={700} color="gray.600" w="26px">
            {mapping.weight.toFixed(1)}
          </Text>
        </HStack>

        <Box flex={1} />

        {rejecting ? (
          <HStack spacing={2} flexShrink={0}>
            <Button size="sm" variant="ghost" colorScheme="gray" onClick={() => setRejecting(false)}>
              取消
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              onClick={() => {
                onReject(mapping.id, reason.trim() || '未填写原因');
                setRejecting(false);
                setReason('');
              }}
            >
              确认驳回
            </Button>
          </HStack>
        ) : (
          <HStack spacing={2} flexShrink={0}>
            {showGovernance && (
              <Button size="sm" variant="ghost" colorScheme="gray" onClick={() => onIgnoreGovernance(mapping.id)}>
                忽略
              </Button>
            )}
            <Button size="sm" variant="outline" colorScheme="gray" onClick={() => setRejecting(true)}>
              驳回
            </Button>
            <Button size="sm" colorScheme="primary" leftIcon={<CheckIcon />} onClick={() => onConfirm(mapping.id)}>
              确认
            </Button>
          </HStack>
        )}
      </Flex>

      {rejecting && (
        <Textarea
          mt={2}
          size="sm"
          rows={2}
          placeholder="请填写驳回原因，帮助 AI 校准后续推荐…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          focusBorderColor="red.300"
        />
      )}
    </Box>
  );
}
