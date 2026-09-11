'use client';

import { ChevronDownIcon, DownloadIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Flex,
  SimpleGrid,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/app/components/ui/Button';
import {
  PROFILE_PRIMARY_BG,
  PROFILE_PRIMARY_COLOR,
  activityTrend,
  overviewMetrics,
  progressDistribution,
  studentLearningDetails
} from '../constants';
import type { StudentActivityLevel } from '../types';

type OverviewPanelProps = {
  selectedClass: string;
  selectedRange: string;
  selectedClassLabel: string;
  selectedRangeLabel: string;
  onClassChange: (value: string) => void;
  onRangeChange: (value: string) => void;
  classOptions: string[];
  rangeOptions: string[];
  onExport: () => void;
  onRowAction: (name: string) => void;
};

const OVERVIEW_BAR_CHART_MAX = 100;
const OVERVIEW_CARD_BORDER_COLOR = '#F3F4F6';
const OVERVIEW_CARD_SHADOW = '0 4px 20px rgba(15, 23, 42, 0.03)';
const OVERVIEW_CARD_RADIUS = '16px';
const OVERVIEW_CARD_PADDING = '20px';

function getActivityMeta(level: StudentActivityLevel) {
  if (level === 'high') {
    return {
      bg: 'green.50',
      color: 'green.600'
    };
  }

  if (level === 'low') {
    return {
      bg: 'red.50',
      color: 'red.600'
    };
  }

  return {
    bg: 'yellow.50',
    color: 'yellow.700'
  };
}

function getProgressColor(progress: number) {
  if (progress < 40) return '#F5222D';
  if (progress < 70) return '#FAAD14';
  return '#52C41A';
}

export default function OverviewPanel({
  selectedClass,
  selectedRange,
  selectedClassLabel,
  selectedRangeLabel,
  onClassChange,
  onRangeChange,
  classOptions,
  rangeOptions,
  onExport,
  onRowAction
}: OverviewPanelProps) {
  const { t } = useTranslation('teacher');
  const lineMin = 30;
  const lineMax = 60;
  const lineHeight = 168;
  const lineWidth = 228;
  const metrics = useMemo(
    () =>
      overviewMetrics.map((item, index) => ({
        ...item,
        label: t(`profile.overview.metrics.${index}.label`),
        suffix: t(`profile.overview.metrics.${index}.suffix`)
      })),
    [t]
  );
  const trendPoints = useMemo(
    () =>
      activityTrend.map((item, index) => ({
        ...item,
        label: t(`profile.overview.activityTrend.${index}.label`)
      })),
    [t]
  );
  const distributionItems = useMemo(
    () =>
      progressDistribution.map((item, index) => ({
        ...item,
        className: t(`profile.overview.progressDistribution.${index}.className`)
      })),
    [t]
  );
  const studentRows = useMemo(
    () =>
      studentLearningDetails.map((item, index) => ({
        ...item,
        className: t(`profile.overview.studentDetails.${index}.className`),
        course: t(`profile.overview.studentDetails.${index}.course`)
      })),
    [t]
  );

  const [isClassOpen, setIsClassOpen] = useState(false);
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const rangeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setIsClassOpen(false);
      }
      if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(event.target as Node)) {
        setIsRangeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const linePoints = trendPoints.map((item, index) => {
    const x = (index / (trendPoints.length - 1)) * lineWidth;
    const y = lineHeight - ((item.value - lineMin) / (lineMax - lineMin)) * lineHeight;
    return { ...item, x, y };
  });

  const linePath = linePoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${lineWidth} ${lineHeight} L 0 ${lineHeight} Z`;

  return (
    <Box>
      <Flex align="center" justify="space-between" gap={4} mb={5} flexDir="row" wrap="nowrap">
        <Box>
          <Text fontSize="18px" fontWeight={500} color="#333" lineHeight="22px">
            {t('profile.overview.title')}
          </Text>
          <Text mt={1} fontSize="14px" color="#86909C" lineHeight="20px">
            {t('profile.overview.description')}
          </Text>
        </Box>

        <Flex gap={3} flexWrap="nowrap" align="center" flexShrink={0}>
          <Box position="relative" ref={classDropdownRef}>
            <Flex
              align="center"
              justify="space-between"
              h="40px"
              w="160px"
              px={4}
              border="1px solid"
              borderColor={isClassOpen ? PROFILE_PRIMARY_COLOR : '#E5E7EB'}
              borderRadius="lg"
              bg="white"
              cursor="pointer"
              onClick={() => setIsClassOpen(!isClassOpen)}
              transition="all 0.2s"
              _hover={{ borderColor: '#D1D5DB' }}
              role="combobox"
              aria-expanded={isClassOpen}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsClassOpen(!isClassOpen);
                }
              }}
            >
              <Text fontSize="14px" color="#4B5563" noOfLines={1}>
                {selectedClassLabel}
              </Text>
              <ChevronDownIcon
                boxSize={4}
                color="gray.400"
                transform={isClassOpen ? 'rotate(180deg)' : undefined}
                transition="transform 0.2s"
              />
            </Flex>

            {isClassOpen && (
              <Box
                position="absolute"
                top="calc(100% + 4px)"
                left={0}
                right={0}
                zIndex={10}
                bg="white"
                borderRadius="lg"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                border="1px solid"
                borderColor="gray.100"
                maxH="280px"
                overflowY="auto"
                py={2}
              >
                {classOptions.map((option) => {
                  const isSelected = option === selectedClass;
                  return (
                    <Flex
                      key={option}
                      px={4}
                      py={2.5}
                      cursor="pointer"
                      bg={isSelected ? 'gray.50' : 'transparent'}
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => {
                        onClassChange(option);
                        setIsClassOpen(false);
                      }}
                    >
                      <Text
                        fontSize="14px"
                        color={isSelected ? PROFILE_PRIMARY_COLOR : '#4B5563'}
                        fontWeight={isSelected ? 500 : 400}
                      >
                        {option}
                      </Text>
                    </Flex>
                  );
                })}
              </Box>
            )}
          </Box>

          <Box position="relative" ref={rangeDropdownRef}>
            <Flex
              align="center"
              justify="space-between"
              h="40px"
              w="140px"
              px={4}
              border="1px solid"
              borderColor={isRangeOpen ? PROFILE_PRIMARY_COLOR : '#E5E7EB'}
              borderRadius="lg"
              bg="white"
              cursor="pointer"
              onClick={() => setIsRangeOpen(!isRangeOpen)}
              transition="all 0.2s"
              _hover={{ borderColor: '#D1D5DB' }}
              role="combobox"
              aria-expanded={isRangeOpen}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsRangeOpen(!isRangeOpen);
                }
              }}
            >
              <Text fontSize="14px" color="#4B5563" noOfLines={1}>
                {selectedRangeLabel}
              </Text>
              <ChevronDownIcon
                boxSize={4}
                color="gray.400"
                transform={isRangeOpen ? 'rotate(180deg)' : undefined}
                transition="transform 0.2s"
              />
            </Flex>

            {isRangeOpen && (
              <Box
                position="absolute"
                top="calc(100% + 4px)"
                left={0}
                right={0}
                zIndex={10}
                bg="white"
                borderRadius="lg"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                border="1px solid"
                borderColor="gray.100"
                maxH="280px"
                overflowY="auto"
                py={2}
              >
                {rangeOptions.map((option) => {
                  const isSelected = option === selectedRange;
                  return (
                    <Flex
                      key={option}
                      px={4}
                      py={2.5}
                      cursor="pointer"
                      bg={isSelected ? 'gray.50' : 'transparent'}
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => {
                        onRangeChange(option);
                        setIsRangeOpen(false);
                      }}
                    >
                      <Text
                        fontSize="14px"
                        color={isSelected ? PROFILE_PRIMARY_COLOR : '#4B5563'}
                        fontWeight={isSelected ? 500 : 400}
                      >
                        {option}
                      </Text>
                    </Flex>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* <Button
            variant="secondary"
            leftIcon={<DownloadIcon />}
            onClick={onExport}
            color="#111827"
            borderColor="#111827"
            bg="#FFFFFF"
            _hover={{ bg: '#F9FAFB', borderColor: '#111827' }}
          >
            {t('profile.overview.export')}
          </Button> */}
        </Flex>
      </Flex>

      <SimpleGrid columns={4} spacing={4} mb={6}>
        {metrics.map((item, index) => (
          <Box
            key={item.label}
            bg="#FFFFFF"
            rounded={OVERVIEW_CARD_RADIUS}
            border="1px solid"
            borderColor={OVERVIEW_CARD_BORDER_COLOR}
            boxShadow={OVERVIEW_CARD_SHADOW}
            p={OVERVIEW_CARD_PADDING}
            minH="84px"
            position="relative"
            overflow="hidden"
          >
            <Text fontSize="14px" color="#86909C" mb={2}>
              {item.label}
            </Text>
            <Text fontSize="20px" fontWeight={500} color={item.color || '#333'} lineHeight="1">
              {item.value}
              <Text as="span" ml={1} fontSize="14px" fontWeight={400} color="#86909C">
                {item.suffix}
              </Text>
            </Text>
            <MetricDecoration index={index} />
          </Box>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={2} spacing={6} mb={6}>
        <Box
          bg="#FFFFFF"
          rounded={OVERVIEW_CARD_RADIUS}
          border="1px solid"
          borderColor={OVERVIEW_CARD_BORDER_COLOR}
          boxShadow={OVERVIEW_CARD_SHADOW}
          p={OVERVIEW_CARD_PADDING}
        >
          <ChartTitle title={t('profile.overview.progressDistributionTitle')} />

          <StackedProgressDistribution items={distributionItems} />
        </Box>

        <Box
          bg="#FFFFFF"
          rounded={OVERVIEW_CARD_RADIUS}
          border="1px solid"
          borderColor={OVERVIEW_CARD_BORDER_COLOR}
          boxShadow={OVERVIEW_CARD_SHADOW}
          p={OVERVIEW_CARD_PADDING}
        >
          <ChartTitle title={t('profile.overview.activityTrendTitle')} />

          <Flex align="stretch" gap={3}>
            <Stack spacing={0} justify="space-between" h="208px" pt={2} pb={6}>
              {[60, 55, 50, 45, 40, 35, 30].map((tick) => (
                <Text key={tick} fontSize="12px" color="#9CA3AF" lineHeight="1">
                  {tick}
                </Text>
              ))}
            </Stack>

            <Box flex="1" position="relative" h="208px">
              <Box position="absolute" inset={0}>
                {[0, 1, 2, 3, 4, 5, 6].map((line) => (
                  <Box
                    key={line}
                    position="absolute"
                    left={0}
                    right={0}
                    top={`${(line / 6) * 168 + 8}px`}
                    borderTop="1px dashed"
                    borderColor="#E9EEF5"
                  />
                ))}
              </Box>

              <Box position="absolute" left={0} right={0} top="8px" h="168px">
                <svg
                  viewBox={`0 0 ${lineWidth} ${lineHeight}`}
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="overviewTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF8F8F" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#overviewTrendFill)" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#FF4D4F"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {linePoints.map((point) => (
                    <g key={point.label}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="3.5"
                        fill="#FFFFFF"
                        stroke="#FF4D4F"
                        strokeWidth="1.5"
                      />
                    </g>
                  ))}
                </svg>
              </Box>

              <Flex
                position="absolute"
                left={0}
                right={0}
                bottom={0}
                justify="space-between"
                pl="2px"
                pr="4px"
              >
                {trendPoints.map((item) => (
                  <Text key={item.label} fontSize="12px" color="#6B7280">
                    {item.label}
                  </Text>
                ))}
              </Flex>
            </Box>
          </Flex>
        </Box>
      </SimpleGrid>

      <Box
        bg="#FFFFFF"
        rounded={OVERVIEW_CARD_RADIUS}
        border="1px solid"
        borderColor={OVERVIEW_CARD_BORDER_COLOR}
        boxShadow={OVERVIEW_CARD_SHADOW}
        p={OVERVIEW_CARD_PADDING}
      >
        <Flex align="center" justify="space-between" gap={3} mb={4}>
          <ChartTitle title={t('profile.overview.studentDetailsTitle')} mb={0} />
          {/* <Button
            variant="secondary"
            onClick={onExport}
            color="#111827"
            borderColor="#111827"
            bg="#FFFFFF"
            h="34px"
            minH="34px"
            px="14px"
            fontSize="12px"
            _hover={{ bg: '#F9FAFB', borderColor: '#111827' }}
          >
            {t('profile.overview.exportCompact')}
          </Button> */}
        </Flex>

        <TableContainer border="1px solid" borderColor="#EEF2F7" rounded="14px" overflow="hidden">
          <Table variant="simple">
            <Thead bg="#FFFFFF">
              <Tr borderColor="#F3F4F6">
                <Th
                  bg="#FFFFFF"
                  px={4}
                  py={3}
                  fontSize="12px"
                  color="#9CA3AF"
                  fontWeight={400}
                  textTransform="none"
                >
                  {t('profile.overview.table.columns.studentName')}
                </Th>
                <Th
                  bg="#FFFFFF"
                  py={3}
                  fontSize="12px"
                  color="#9CA3AF"
                  fontWeight={400}
                  textTransform="none"
                >
                  {t('profile.overview.table.columns.className')}
                </Th>
                <Th
                  bg="#FFFFFF"
                  py={3}
                  fontSize="12px"
                  color="#9CA3AF"
                  fontWeight={400}
                  textTransform="none"
                >
                  {t('profile.overview.table.columns.course')}
                </Th>
                <Th
                  bg="#FFFFFF"
                  py={3}
                  fontSize="12px"
                  color="#9CA3AF"
                  fontWeight={400}
                  textTransform="none"
                >
                  {t('profile.overview.table.columns.progress')}
                </Th>
                <Th
                  bg="#FFFFFF"
                  py={3}
                  fontSize="12px"
                  color="#9CA3AF"
                  fontWeight={400}
                  textTransform="none"
                >
                  {t('profile.overview.table.columns.activity')}
                </Th>
                <Th
                  bg="#FFFFFF"
                  isNumeric
                  px={4}
                  py={3}
                  fontSize="12px"
                  color="#9CA3AF"
                  fontWeight={400}
                  textTransform="none"
                >
                  {t('profile.overview.table.columns.actions')}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {studentRows.map((student) => {
                const activityMeta = getActivityMeta(student.activityLevel);
                const progressColor = getProgressColor(student.progress);

                return (
                  <Tr key={student.id} borderColor="#F8FAFC">
                    <Td px={4} py={3.5} fontSize="14px" color="#374151">
                      {student.name}
                    </Td>
                    <Td py={3.5} fontSize="14px" color="#374151">
                      {student.className}
                    </Td>
                    <Td py={3.5} fontSize="14px" color="#374151">
                      {student.course}
                    </Td>
                    <Td py={3.5}>
                      <Flex align="center" gap={3}>
                        <Box w="76px" h="4px" bg="#EEF2F7" rounded="full" overflow="hidden">
                          <Box
                            w={`${student.progress}%`}
                            h="full"
                            bg={PROFILE_PRIMARY_COLOR}
                            rounded="full"
                          />
                        </Box>
                        <Text fontSize="14px" fontWeight={400} color={progressColor}>
                          {student.progress}%
                        </Text>
                      </Flex>
                    </Td>
                    <Td py={3.5}>
                      <Text fontSize="14px" color={activityMeta.color} fontWeight={400}>
                        {t(`profile.overview.activityLevels.${student.activityLevel}`)}
                      </Text>
                    </Td>
                    <Td px={4} py={3.5} isNumeric>
                      <Button
                        variant="link"
                        onClick={() => onRowAction(student.name)}
                        color={PROFILE_PRIMARY_COLOR}
                        fontSize="14px"
                        fontWeight={400}
                        isDisabled
                      >
                        {t('profile.overview.table.actions.detail')}
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

function StackedProgressDistribution({ items }: { items: typeof progressDistribution }) {
  return (
    <Flex align="stretch" gap={3}>
      <Stack spacing={0} justify="space-between" h="208px" pt={1} pb={6}>
        {['100%', '90%', '80%', '70%', '60%', '50%', '40%', '30%', '20%', '10%', '0%'].map(
          (tick) => (
            <Text key={tick} fontSize="12px" color="#9CA3AF" lineHeight="1">
              {tick}
            </Text>
          )
        )}
      </Stack>

      <Box flex="1" position="relative" h="208px">
        <Box position="absolute" inset={0}>
          {Array.from({ length: 11 }).map((_, index) => (
            <Box
              key={index}
              position="absolute"
              left={0}
              right={0}
              top={`${(index / 10) * 180 + 2}px`}
              borderTop="1px dashed"
              borderColor="#E9EEF5"
            />
          ))}
        </Box>

        <Flex
          position="absolute"
          left={0}
          right={0}
          bottom="26px"
          align="end"
          justify="space-around"
          h="180px"
        >
          {items.map((item) => (
            <Box key={item.className} textAlign="center" w="48px">
              <Box
                mx="auto"
                w="34px"
                h={`${(item.progress / OVERVIEW_BAR_CHART_MAX) * 180}px`}
                minH="6px"
                bg="#FFD5D5"
                roundedTop="2px"
              />
            </Box>
          ))}
        </Flex>

        <Flex position="absolute" left={0} right={0} bottom={0} justify="space-around">
          {items.map((item) => (
            <Text key={item.className} fontSize="12px" color="#6B7280" textAlign="center">
              {item.className}
            </Text>
          ))}
        </Flex>
      </Box>
    </Flex>
  );
}

function MetricDecoration({ index }: { index: number }) {
  const decorations = [
    { colors: ['#FFD8B5', '#FF9A3D'], angle: '135deg' },
    { colors: ['#B3DAFF', '#4A9CFF'], angle: '135deg' },
    { colors: ['#CCF3FF', '#60C6EB'], angle: '135deg' },
    { colors: ['#FFB6C8', '#F03162'], angle: '135deg' }
  ] as const;

  const decoration = decorations[index] || decorations[0];

  return (
    <>
      <Box
        position="absolute"
        right="18px"
        top="18px"
        w="18px"
        h="18px"
        rounded="full"
        bgGradient={`linear(${decoration.angle}, ${decoration.colors[0]}, ${decoration.colors[1]})`}
        opacity={0.9}
      />
      <Box
        position="absolute"
        right="28px"
        top="28px"
        w="22px"
        h="22px"
        rounded="10px"
        bgGradient={`linear(${decoration.angle}, ${decoration.colors[0]}, ${decoration.colors[1]})`}
        opacity={0.55}
      />
    </>
  );
}

function ChartTitle({ title, mb = 4 }: { title: string; mb?: number }) {
  return (
    <Flex align="center" gap={2} mb={mb}>
      <Box w="3px" h="14px" rounded="full" bg={PROFILE_PRIMARY_COLOR} />
      <Text fontSize="18px" fontWeight={500} color="#333">
        {title}
      </Text>
    </Flex>
  );
}
