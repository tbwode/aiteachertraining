'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { DashboardData, StudyTimeDistribution } from '../types';
import SvgIcon from '@/app/components/ui/SvgIcon';
import { designTokens } from '@/theme/designTokens';

const panelCardStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.9)',
  background: '#FFFFFF',
  boxShadow: '0 6px 22px rgba(15, 23, 42, 0.04)'
} as const;

const metricCardStyle = {
  borderRadius: '14px',
  border: '1px solid rgba(241, 245, 249, 0.9)',
  background: '#FFFFFF',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)'
} as const;

const titleAccentStyle = {
  width: '4px',
  height: '14px',
  borderRadius: '999px',
  bg: '#C8000B'
} as const;

const progressTrackColor = '#EEF1F5';
const learningProgressColor = '#3B3F45';
const completedProgressColor = '#C8000B';
const trendBarColor = '#F9C9C9';
const pieColors = ['#F58A8F', '#8EB2F3', '#C29BF4', '#FFD36D'];

export function DashboardPanel({ data }: { data: DashboardData }) {
  const { t } = useTranslation('student');

  const trendData = useMemo(
    () =>
      data.studyTrend.map((item) => ({
        ...item,
        label: t(`dashboard.studyTrend.${item.key}`),
        value: item.hours
      })),
    [data.studyTrend, t]
  );

  const localizedTimeDistribution = useMemo(
    () =>
      data.timeDistribution.map((item) => ({
        ...item,
        label: t(`dashboard.timeDistribution.${item.key}`)
      })),
    [data.timeDistribution, t]
  );

  return (
    <Box flex="1" w="100%">
      <Flex align="center" gap="10px" mb="18px">
        <SvgIcon src="/imgs/app/student/userDetail/xqkb.svg" alt="学情看板" size="22px" />
        <Text
          fontSize="18px"
          lineHeight="18px"
          fontWeight={600}
          color="#C8000B"
          letterSpacing="0.24px"
        >
          {t('dashboard.title')}
        </Text>
      </Flex>

      <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="12px" mb="14px">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.key} metricKey={metric.key} value={metric.value} />
        ))}
      </Grid>

      <Box {...panelCardStyle} p="20px" mb="14px">
        <SectionTitle>{t('dashboard.sections.courseProgress')}</SectionTitle>

        <Box display="grid" gap="12px">
          {data.courseProgress.map((item) => {
            const isCompleted = item.status === 'completed';

            return (
              <Box key={item.id}>
                <Flex justify="space-between" align="center" mb="6px">
                  <Text fontSize="13px" lineHeight="20px" color="#4E5969">
                    {t(`dashboard.courseProgress.${item.id}.title`)}
                  </Text>

                  <Flex align="center" gap="8px">
                    <Text
                      fontSize="13px"
                      lineHeight="20px"
                      fontWeight={500}
                      color={isCompleted ? '#333333' : '#C8000B'}
                    >
                      {item.progress}%
                    </Text>
                    <Box
                      px="6px"
                      h="20px"
                      borderRadius="6px"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="11px"
                      lineHeight="11px"
                      color={item.actionKey === 'review' ? '#C8000B' : '#86909C'}
                      bg={item.actionKey === 'review' ? '#FFEDED' : '#F2F3F5'}
                    >
                      {t(`dashboard.actions.${item.actionKey}`)}
                    </Box>
                  </Flex>
                </Flex>

                <Box h="5px" bg={progressTrackColor} borderRadius="999px" overflow="hidden">
                  <Box
                    h="100%"
                    w={`${item.progress}%`}
                    bg={isCompleted ? completedProgressColor : learningProgressColor}
                    borderRadius="999px"
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="14px">
        <Box {...panelCardStyle} p="14px 14px 12px" minH="252px">
          <Flex justify="space-between" align="center" mb="10px">
            <SectionTitle mb="0">{t('dashboard.sections.trend')}</SectionTitle>

            <Flex
              align="center"
              gap="2px"
              bg="#F7F8FA"
              borderRadius="999px"
              p="2px"
              border="1px solid #F2F3F5"
            >
              <Box
                px="12px"
                h="24px"
                borderRadius="999px"
                bg="#FFFFFF"
                border="1px solid #F3D2D5"
                color="#C8000B"
                fontSize="10px"
                lineHeight="10px"
                fontWeight={500}
                display="inline-flex"
                alignItems="center"
              >
                {t('dashboard.timeRange.last7Days')}
              </Box>
              <Box
                px="10px"
                h="24px"
                color="#86909C"
                fontSize="10px"
                lineHeight="10px"
                display="inline-flex"
                alignItems="center"
              >
                {t('dashboard.timeRange.last30Days')}
              </Box>
            </Flex>
          </Flex>

          <Box h="184px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ top: 8, right: 6, left: -18, bottom: 0 }}
                barCategoryGap={10}
              >
                <CartesianGrid stroke="#E8EDF3" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fill: '#86909C', fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 4]}
                  ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => Number(value).toFixed(1)}
                  tick={{ fill: '#B8C0CC', fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(249, 201, 201, 0.16)' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #F3D9DC',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
                  }}
                />
                <Bar dataKey="value" fill={trendBarColor} radius={[0, 0, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Box {...panelCardStyle} p="14px 14px 12px" minH="252px">
          <Flex justify="space-between" align="center" mb="10px">
            <SectionTitle mb="0">{t('dashboard.sections.timeDistribution')}</SectionTitle>
            <Text fontSize="12px" lineHeight="12px" color="#86909C">
              {t('dashboard.timeRange.currentWeek')}
            </Text>
          </Flex>

          <Flex direction="column" align="center" justify="center">
            <Box h="172px" w="100%">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={localizedTimeDistribution}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={42}
                    outerRadius={74}
                    paddingAngle={0}
                    stroke="none"
                  >
                    {localizedTimeDistribution.map((item, index) => (
                      <Cell key={item.key} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name, item) => [
                      `${value}%`,
                      item.payload?.label || ''
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #E8EDF3',
                      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="10px 14px" w="100%" mt="4px">
              {localizedTimeDistribution.map((item, index) => (
                <TimeLegendItem
                  key={item.key}
                  item={item}
                  color={pieColors[index % pieColors.length]}
                />
              ))}
            </Grid>
          </Flex>
        </Box>
      </Grid>
    </Box>
  );
}

function SectionTitle({ children, mb = '12px' }: { children: React.ReactNode; mb?: string }) {
  return (
    <Flex align="center" gap="6px" mb={mb}>
      <Box {...titleAccentStyle} />
      <Text fontSize="18px" lineHeight="18px" fontWeight={500} color="#333333">
        {children}
      </Text>
    </Flex>
  );
}

function MetricCard({
  metricKey,
  value
}: {
  metricKey: 'learning' | 'completed' | 'weekly' | 'total';
  value: number;
}) {
  const { t } = useTranslation('student');
  const iconPath = {
    learning: '/imgs/app/student/userDetail/class.svg',
    completed: '/imgs/app/student/userDetail/done.svg',
    weekly: '/imgs/app/student/userDetail/study.svg',
    total: '/imgs/app/student/userDetail/ljxx.svg'
  }[metricKey];

  return (
    <Box {...metricCardStyle} p={'24px'}>
      <Flex align="center" justify="space-between" h="100%">
        <Box>
          <Text fontSize="12px" lineHeight="12px" color="#86909C" mb="12px">
            {t(`dashboard.metrics.${metricKey}.label`)}
          </Text>
          <Text fontSize="30px" lineHeight="20px" fontWeight={500} color="#333">
            {value}
            <Text
              as="span"
              ml="4px"
              fontSize="14px"
              lineHeight="14px"
              fontWeight={400}
              color="#86909C"
            >
              {t(`dashboard.metrics.${metricKey}.unit`)}
            </Text>
          </Text>
        </Box>

        <SvgIcon src={iconPath} alt={metricKey} width="44px" height="44px" />
      </Flex>
    </Box>
  );
}

function TimeLegendItem({
  item,
  color
}: {
  item: StudyTimeDistribution & { label: string };
  color: string;
}) {
  return (
    <Flex align="center" gap="6px" minW={0}>
      <Box w="8px" h="8px" borderRadius="999px" bg={color} flexShrink={0} />
      <Text
        fontSize="12px"
        lineHeight="16px"
        color={designTokens.colors.textSecondary}
        whiteSpace="nowrap"
      >
        {item.label}
      </Text>
    </Flex>
  );
}
