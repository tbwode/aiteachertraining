import { useEffect, useRef } from 'react';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import { BarChart3, Check, CircleDot, Sparkles, Target, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { SuggestionItem } from '../constants';

type SuggestionDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  suggestion: SuggestionItem | null;
  onAction: (id: string) => void;
};

const priorityMeta = {
  high: { label: '高优先级', color: '#B42318', bg: '#FEF3F2' },
  medium: { label: '中优先级', color: '#B54708', bg: '#FFFAEB' },
  low: { label: '低优先级', color: '#344054', bg: '#F2F4F7' }
};

export function SuggestionDetailModal({
  isOpen,
  onClose,
  suggestion,
  onAction
}: SuggestionDetailModalProps) {
  const { t } = useTranslation('teacher');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: 0, behavior: 'auto' }));
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [isOpen, suggestion?.id]);

  if (!suggestion) return null;

  const typeConfig = {
    news: {
      label: t('home.ai_suggestions.tabs.news'),
      labelBg: '#EFF8FF',
      labelColor: '#175CD3'
    },
    optimization: {
      label: t('home.ai_suggestions.tabs.optimization'),
      labelBg: '#FFFAEB',
      labelColor: '#B54708'
    },
    graph: {
      label: t('home.ai_suggestions.tabs.knowledge_graph'),
      labelBg: '#ECFDF3',
      labelColor: '#027A48'
    }
  };
  const config = typeConfig[suggestion.type];
  const priority = priorityMeta[suggestion.priority];

  const handleAction = () => {
    onAction(suggestion.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      scrollBehavior="inside"
      initialFocusRef={closeButtonRef}
    >
      <ModalOverlay bg="rgba(16,24,40,.58)" backdropFilter="blur(3px)" />
      <ModalContent
        w="calc(100vw - 24px)"
        maxW="900px"
        maxH="calc(100dvh - 48px)"
        borderRadius="20px"
        mx="auto"
        my={3}
        overflow="hidden"
      >
        <ModalHeader px={{ base: 5, md: 6 }} py={5} borderBottom="1px solid #EAECF0" flexShrink={0}>
          <HStack spacing={2.5} pr={10} flexWrap="wrap">
            <Flex
              w="38px"
              h="38px"
              align="center"
              justify="center"
              borderRadius="12px"
              bg="#FFF1F0"
              color="#C83E3E"
            >
              <Sparkles size={18} aria-hidden="true" />
            </Flex>
            <Box>
              <Text fontSize="16px" fontWeight={750} color="#1D2939">
                AI 建议详情
              </Text>
              <Text fontSize="11px" color="#667085" mt={0.5}>
                基于课程、学情与岗位标准综合生成
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton ref={closeButtonRef} top={5} right={5} borderRadius="9px" />

        <ModalBody
          ref={bodyRef}
          px={{ base: 5, md: 6 }}
          pt={5}
          pb={5}
          overflowY="auto"
          sx={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#C9CDD4 transparent',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: '#C9CDD4',
              borderRadius: '999px',
              border: '2px solid white'
            }
          }}
        >
          <Flex align="center" gap={2} mb={3} flexWrap="wrap">
            <Badge
              px={2.5}
              py={1}
              borderRadius="full"
              bg={config.labelBg}
              color={config.labelColor}
            >
              {config.label}
            </Badge>
            <Badge px={2.5} py={1} borderRadius="full" bg={priority.bg} color={priority.color}>
              {priority.label}
            </Badge>
            <Text fontSize="11px" color="#98A2B3">
              置信度 {suggestion.confidence}%
            </Text>
          </Flex>

          <Text
            fontSize={{ base: '18px', md: '20px' }}
            fontWeight={750}
            color="#101828"
            lineHeight="1.45"
          >
            {suggestion.title}
          </Text>
          <Text fontSize="13px" color="#475467" lineHeight="1.8" mt={3}>
            {suggestion.description}
          </Text>

          <Flex flexWrap="wrap" gap={3} mt={5}>
            <Box
              flex="1 1 260px"
              minW={0}
              border="1px solid #EAECF0"
              borderRadius="13px"
              p={3.5}
              bg="#FCFCFD"
            >
              <HStack color="#667085" spacing={1.5} mb={1.5}>
                <Users size={14} aria-hidden="true" />
                <Text fontSize="11px">影响范围</Text>
              </HStack>
              <Text fontSize="12px" color="#1D2939" fontWeight={650} lineHeight="1.6">
                {suggestion.targetAudience}
              </Text>
            </Box>
            <Box
              flex="1 1 260px"
              minW={0}
              border="1px solid #EAECF0"
              borderRadius="13px"
              p={3.5}
              bg="#FCFCFD"
            >
              <HStack color="#667085" spacing={1.5} mb={1.5}>
                <Target size={14} aria-hidden="true" />
                <Text fontSize="11px">预期改善</Text>
              </HStack>
              <Text fontSize="12px" color="#1D2939" fontWeight={650} lineHeight="1.6">
                {suggestion.expectedOutcome}
              </Text>
            </Box>
          </Flex>

          <Flex flexWrap="wrap" gap={5} mt={5} alignItems="flex-start">
            <VStack flex="1 1 360px" minW={0} align="stretch" spacing={4}>
              <Box>
                <HStack spacing={2} mb={2.5}>
                  <BarChart3 size={15} color="#475467" aria-hidden="true" />
                  <Text fontSize="13px" fontWeight={700} color="#344054">
                    AI 判断依据
                  </Text>
                </HStack>
                <VStack align="stretch" spacing={2}>
                  {suggestion.evidenceList.map((evidence) => (
                    <HStack
                      key={evidence}
                      align="flex-start"
                      spacing={2.5}
                      p={3}
                      borderRadius="11px"
                      bg="#F9FAFB"
                    >
                      <CircleDot
                        size={13}
                        color="#C83E3E"
                        style={{ marginTop: 3, flexShrink: 0 }}
                        aria-hidden="true"
                      />
                      <Text fontSize="12px" color="#475467" lineHeight="1.65">
                        {evidence}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              <Box p={4} borderRadius="14px" bg="#FFF8F7" border="1px solid #FEE4E2">
                <Text fontSize="11px" fontWeight={700} color="#B42318" mb={1.5}>
                  影响分析
                </Text>
                <Text fontSize="12px" color="#475467" lineHeight="1.7">
                  {suggestion.impactSummary}
                </Text>
              </Box>
            </VStack>

            <VStack flex="1 1 360px" minW={0} align="stretch" spacing={4}>
              <Box>
                <Text fontSize="13px" fontWeight={700} color="#344054" mb={2.5}>
                  建议处理步骤
                </Text>
                <VStack align="stretch" spacing={2.5}>
                  {suggestion.recommendedActions.map((action, index) => (
                    <Flex key={action} align="flex-start" gap={3}>
                      <Flex
                        w="22px"
                        h="22px"
                        flexShrink={0}
                        align="center"
                        justify="center"
                        borderRadius="7px"
                        bg="#FFF1F0"
                        color="#B42318"
                        fontSize="10px"
                        fontWeight={750}
                      >
                        {index + 1}
                      </Flex>
                      <Text fontSize="12px" color="#475467" lineHeight="1.7">
                        {action}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              </Box>

              <Box p={4} borderRadius="14px" bg="#FCFCFD" border="1px solid #EAECF0">
                <Text fontSize="11px" color="#667085">
                  数据来源
                </Text>
                <Text fontSize="12px" color="#1D2939" fontWeight={650} mt={1}>
                  {suggestion.sourceLabel}
                </Text>
                <Text fontSize="11px" color="#667085" mt={3}>
                  生成时间
                </Text>
                <Text fontSize="12px" color="#1D2939" fontWeight={650} mt={1}>
                  {suggestion.publishTime ?? '今日'}
                </Text>
              </Box>
            </VStack>
          </Flex>

          <Flex
            mt={5}
            pt={3.5}
            borderTop="1px solid #EAECF0"
            gap={3}
            flexDirection={{ base: 'column-reverse', sm: 'row' }}
            justify="flex-end"
          >
            <Button variant="secondary" w={{ base: 'full', sm: 'auto' }} onClick={onClose}>
              关闭
            </Button>
            <Button
              w={{ base: 'full', sm: 'auto' }}
              leftIcon={suggestion.read ? <Check size={15} aria-hidden="true" /> : undefined}
              onClick={handleAction}
              isDisabled={suggestion.read}
            >
              {suggestion.read
                ? suggestion.type === 'graph'
                  ? t('home.ai_suggestions.adopted')
                  : t('home.ai_suggestions.read')
                : suggestion.type === 'graph'
                  ? t('home.ai_suggestions.adopt')
                  : t('home.ai_suggestions.mark_read')}
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
