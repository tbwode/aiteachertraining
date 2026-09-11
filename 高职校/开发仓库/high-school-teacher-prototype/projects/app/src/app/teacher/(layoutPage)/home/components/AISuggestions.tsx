import { useMemo, useState } from 'react';
import { Badge, Box, Button as ChakraButton, Flex, HStack, Text, Tooltip } from '@chakra-ui/react';
import { Check, ChevronRight, Gauge, Newspaper, Route, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import type { SuggestionItem, SuggestionPriority, SuggestionType } from '../constants';

type AISuggestionsProps = {
  newsSuggestions: SuggestionItem[];
  optimizationSuggestions: SuggestionItem[];
  graphSuggestions: SuggestionItem[];
  onAction: (id: string) => void;
  onMarkAllNewsRead: () => void;
  onItemClick: (suggestion: SuggestionItem) => void;
};

const priorityMeta: Record<SuggestionPriority, { label: string; color: string; bg: string }> = {
  high: { label: '高优先级', color: '#B42318', bg: '#FEF3F2' },
  medium: { label: '中优先级', color: '#B54708', bg: '#FFFAEB' },
  low: { label: '低优先级', color: '#344054', bg: '#F2F4F7' }
};

const typeVisual: Record<
  SuggestionType,
  { icon: typeof Newspaper; color: string; iconBg: string; hoverBorder: string }
> = {
  news: { icon: Newspaper, color: '#175CD3', iconBg: '#EFF8FF', hoverBorder: '#B2DDFF' },
  optimization: { icon: Sparkles, color: '#B54708', iconBg: '#FFFAEB', hoverBorder: '#FEDF89' },
  graph: { icon: Route, color: '#027A48', iconBg: '#ECFDF3', hoverBorder: '#ABEFC6' }
};

export function AISuggestions({
  newsSuggestions,
  optimizationSuggestions,
  graphSuggestions,
  onAction,
  onMarkAllNewsRead,
  onItemClick
}: AISuggestionsProps) {
  const { t } = useTranslation('teacher');
  const [activeType, setActiveType] = useState<SuggestionType>('optimization');

  const groupedSuggestions: Record<SuggestionType, SuggestionItem[]> = useMemo(
    () => ({
      news: newsSuggestions,
      optimization: optimizationSuggestions,
      graph: graphSuggestions
    }),
    [graphSuggestions, newsSuggestions, optimizationSuggestions]
  );
  const allSuggestions = useMemo(
    () => [...newsSuggestions, ...optimizationSuggestions, ...graphSuggestions],
    [graphSuggestions, newsSuggestions, optimizationSuggestions]
  );
  const currentSuggestions = groupedSuggestions[activeType];
  const highPriorityCount = allSuggestions.filter(
    (item) => item.priority === 'high' && !item.read
  ).length;
  const unreadNewsCount = newsSuggestions.filter((item) => !item.read).length;

  const tabs: Array<{ type: SuggestionType; label: string }> = [
    { type: 'optimization', label: t('home.ai_suggestions.tabs.optimization') },
    { type: 'graph', label: t('home.ai_suggestions.tabs.knowledge_graph') },
    { type: 'news', label: t('home.ai_suggestions.tabs.news') }
  ];

  return (
    <Box>
      <Flex
        bg="#FAFAFB"
        border="1px solid #EAECF0"
        borderRadius="14px"
        p={3}
        align="center"
        justify="space-between"
        gap={3}
        mb={4}
      >
        <HStack spacing={3} minW={0}>
          <Flex
            w="36px"
            h="36px"
            flexShrink={0}
            align="center"
            justify="center"
            borderRadius="11px"
            bg="#FFF1F0"
            color="#C83E3E"
          >
            <Gauge size={18} aria-hidden="true" />
          </Flex>
          <Box minW={0}>
            <Text fontSize="13px" fontWeight={700} color="#1D2939">
              AI 已生成 {allSuggestions.length} 条可执行建议
            </Text>
            <Text fontSize="11px" color="#667085" mt={0.5}>
              {highPriorityCount > 0
                ? `${highPriorityCount} 条高优先级建议待处理`
                : '高优先级建议已处理'}
            </Text>
          </Box>
        </HStack>
        <Badge borderRadius="full" px={2.5} py={1} bg="#ECFDF3" color="#027A48">
          今日更新
        </Badge>
      </Flex>

      <Flex
        role="tablist"
        aria-label="AI 建议类型"
        gap={1}
        p={1}
        bg="#F2F4F7"
        borderRadius="12px"
        mb={4}
      >
        {tabs.map((tab) => {
          const selected = activeType === tab.type;
          return (
            <ChakraButton
              key={tab.type}
              role="tab"
              aria-selected={selected}
              aria-label={`${tab.label}，${groupedSuggestions[tab.type].length} 条`}
              aria-controls={`suggestion-panel-${tab.type}`}
              flex="1"
              h="36px"
              px={2}
              borderRadius="9px"
              border="0"
              bg={selected ? 'white' : 'transparent'}
              color={selected ? '#1D2939' : '#667085'}
              boxShadow={selected ? '0 1px 3px rgba(16,24,40,.10)' : 'none'}
              fontSize="12px"
              fontWeight={selected ? 700 : 500}
              _hover={{ bg: selected ? 'white' : 'rgba(255,255,255,.58)' }}
              _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,62,62,.18)' }}
              onClick={() => setActiveType(tab.type)}
            >
              {tab.label}
              <Box
                as="span"
                ml={1.5}
                minW="20px"
                borderRadius="full"
                bg={selected ? '#FFF1F0' : '#E4E7EC'}
                color={selected ? '#B42318' : '#667085'}
                lineHeight="20px"
              >
                {groupedSuggestions[tab.type].length}
              </Box>
            </ChakraButton>
          );
        })}
      </Flex>

      <Box
        id={`suggestion-panel-${activeType}`}
        role="tabpanel"
        aria-label={tabs.find((tab) => tab.type === activeType)?.label}
      >
        <Flex direction="column" gap={3}>
          {currentSuggestions.map((item) => {
            const visual = typeVisual[item.type];
            const Icon = visual.icon;
            const priority = priorityMeta[item.priority];

            return (
              <Flex
                key={item.id}
                border="1px solid"
                borderColor="#EAECF0"
                borderRadius="14px"
                bg="white"
                p={3.5}
                gap={3}
                opacity={item.read ? 0.72 : 1}
                transition="border-color .18s ease, box-shadow .18s ease, transform .18s ease"
                _hover={{
                  borderColor: visual.hoverBorder,
                  boxShadow: '0 6px 16px rgba(16,24,40,.06)',
                  transform: 'translateY(-1px)'
                }}
              >
                <Flex
                  w="34px"
                  h="34px"
                  flexShrink={0}
                  align="center"
                  justify="center"
                  borderRadius="10px"
                  bg={visual.iconBg}
                  color={visual.color}
                >
                  <Icon size={17} aria-hidden="true" />
                </Flex>

                <Box minW={0} flex="1">
                  <Flex align="center" gap={2} mb={1.5} flexWrap="wrap">
                    <Badge
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      bg={priority.bg}
                      color={priority.color}
                      fontSize="10px"
                    >
                      {priority.label}
                    </Badge>
                    <Text fontSize="10px" color="#98A2B3">
                      置信度 {item.confidence}%
                    </Text>
                  </Flex>
                  <Box
                    as="button"
                    type="button"
                    w="full"
                    textAlign="left"
                    borderRadius="6px"
                    _focusVisible={{ outline: '2px solid #C83E3E', outlineOffset: '3px' }}
                    onClick={() => onItemClick(item)}
                  >
                    <Text fontSize="13px" lineHeight="1.55" fontWeight={700} color="#1D2939">
                      {item.title}
                    </Text>
                    <Text fontSize="11px" color="#667085" mt={1} lineHeight="1.65" noOfLines={2}>
                      {item.description}
                    </Text>
                  </Box>
                  <Flex mt={2.5} align="center" justify="space-between" gap={3}>
                    <Tooltip label={item.relatedCourseName} hasArrow openDelay={300}>
                      <Text fontSize="10px" color="#667085" noOfLines={1} minW={0}>
                        {item.relatedCourseName} · {item.sourceLabel}
                      </Text>
                    </Tooltip>
                    <HStack spacing={1.5} flexShrink={0}>
                      <Button
                        variant="tertiary"
                        h="34px"
                        minH="34px"
                        px={2.5}
                        fontSize="11px"
                        rightIcon={<ChevronRight size={13} aria-hidden="true" />}
                        onClick={() => onItemClick(item)}
                      >
                        详情
                      </Button>
                      <Button
                        variant={item.action === 'adopt' ? 'primary' : 'primaryOutline'}
                        h="34px"
                        minH="34px"
                        px={3}
                        fontSize="11px"
                        leftIcon={item.read ? <Check size={13} aria-hidden="true" /> : undefined}
                        isDisabled={item.read}
                        onClick={() => onAction(item.id)}
                      >
                        {item.read
                          ? item.action === 'adopt'
                            ? t('home.ai_suggestions.adopted')
                            : t('home.ai_suggestions.read')
                          : item.action === 'adopt'
                            ? t('home.ai_suggestions.adopt')
                            : t('home.ai_suggestions.mark_read')}
                      </Button>
                    </HStack>
                  </Flex>
                </Box>
              </Flex>
            );
          })}
        </Flex>

        {activeType === 'news' && newsSuggestions.length > 0 ? (
          <Button
            variant="tertiary"
            w="full"
            mt={3}
            isDisabled={unreadNewsCount === 0}
            onClick={onMarkAllNewsRead}
          >
            {unreadNewsCount > 0
              ? `${t('home.ai_suggestions.mark_all_read')}（${unreadNewsCount}）`
              : '全部资讯已读'}
          </Button>
        ) : null}

        {currentSuggestions.length === 0 ? (
          <Flex minH="220px" align="center" justify="center" color="#98A2B3" fontSize="13px">
            暂无该类型建议
          </Flex>
        ) : null}
      </Box>
    </Box>
  );
}
