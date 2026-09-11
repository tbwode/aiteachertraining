'use client';

import { useMemo, useState } from 'react';
import { Badge, Box, Flex, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import type { ChapterNode } from '../questionBank/types';
import { MOCK_CLASSES } from '../quiz/mockQuiz';
import {
  buildCourseAiSummary,
  buildCourseSummary,
  type CourseSummaryData
} from './mockCourseSummary';

type Perspective = 'course' | 'class';

type TabCourseSummaryProps = {
  avatarId: string;
  courseName: string;
  chapterTree: ChapterNode[];
  classList?: { className: string }[];
};

const BAND_COLORS = ['#C8000B', '#D97706', '#EAB308', '#2563EB', '#059669'];
const CAUSE_COLORS = ['#C8000B', '#D97706', '#7C3AED', '#2563EB', '#059669'];

const pct = (r: number) => `${Math.round(r * 100)}%`;

// ---------- SVG 图表 ----------

const CHART_W = 560;
const CHART_H = 240;
const PAD = { l: 34, r: 12, t: 18, b: 28 };
const plotW = CHART_W - PAD.l - PAD.r;
const plotH = CHART_H - PAD.t - PAD.b;
const yOf = (v: number) => PAD.t + plotH * (1 - v / 100);
const xOf = (i: number, n: number) => PAD.l + (plotW / Math.max(n - 1, 1)) * i;

// 总分趋势：平均分 / 最高分 / 最低分 三条折线
function TrendChart({ data }: { data: CourseSummaryData['months'] }) {
  const n = data.length;
  const line = (key: 'avg' | 'max' | 'min') =>
    data
      .map((m, i) => `${i === 0 ? 'M' : 'L'}${xOf(i, n).toFixed(1)},${yOf(m[key]).toFixed(1)}`)
      .join(' ');
  return (
    <Box as="svg" viewBox={`0 0 ${CHART_W} ${CHART_H}`} w="100%" h="auto">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line
            x1={PAD.l}
            y1={yOf(v)}
            x2={CHART_W - PAD.r}
            y2={yOf(v)}
            stroke="#EDF0F5"
            strokeWidth={1}
          />
          <text x={PAD.l - 6} y={yOf(v) + 3} fontSize={9} fill="#A0A6B1" textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {data.map((m, i) => (
        <text
          key={m.month}
          x={xOf(i, n)}
          y={CHART_H - 8}
          fontSize={10}
          fill="#6B7280"
          textAnchor="middle"
        >
          {m.month}
        </text>
      ))}
      <path d={line('max')} fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="5 4" />
      <path d={line('min')} fill="none" stroke="#D97706" strokeWidth={1.5} strokeDasharray="5 4" />
      <path d={line('avg')} fill="none" stroke="#C8000B" strokeWidth={2.5} />
      {data.map((m, i) => (
        <g key={`pt-${m.month}`}>
          <circle
            cx={xOf(i, n)}
            cy={yOf(m.avg)}
            r={3.5}
            fill="#C8000B"
            stroke="#fff"
            strokeWidth={1.5}
          />
          <text
            x={xOf(i, n)}
            y={yOf(m.avg) - 8}
            fontSize={9.5}
            fontWeight={600}
            fill="#C8000B"
            textAnchor="middle"
          >
            {m.avg}
          </text>
        </g>
      ))}
    </Box>
  );
}

// 测验完成率：柱状（完成率）+ 折线（平均分）
function CompletionChart({ data }: { data: CourseSummaryData['months'] }) {
  const n = data.length;
  const slot = plotW / n;
  const barW = Math.min(30, slot * 0.42);
  const linePath = data
    .map(
      (m, i) =>
        `${i === 0 ? 'M' : 'L'}${(PAD.l + slot * i + slot / 2).toFixed(1)},${yOf(m.avg).toFixed(1)}`
    )
    .join(' ');
  return (
    <Box as="svg" viewBox={`0 0 ${CHART_W} ${CHART_H}`} w="100%" h="auto">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line
            x1={PAD.l}
            y1={yOf(v)}
            x2={CHART_W - PAD.r}
            y2={yOf(v)}
            stroke="#EDF0F5"
            strokeWidth={1}
          />
          <text x={PAD.l - 6} y={yOf(v) + 3} fontSize={9} fill="#A0A6B1" textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      {data.map((m, i) => {
        const cx = PAD.l + slot * i + slot / 2;
        return (
          <g key={m.month}>
            <rect
              x={cx - barW / 2}
              y={yOf(m.completionRate * 100)}
              width={barW}
              height={yOf(0) - yOf(m.completionRate * 100)}
              rx={3}
              fill="rgba(37,99,235,0.75)"
            />
            <text
              x={cx}
              y={yOf(m.completionRate * 100) - 5}
              fontSize={9}
              fill="#2563EB"
              textAnchor="middle"
            >
              {pct(m.completionRate)}
            </text>
            <text x={cx} y={CHART_H - 8} fontSize={10} fill="#6B7280" textAnchor="middle">
              {m.month}
            </text>
          </g>
        );
      })}
      <path d={linePath} fill="none" stroke="#C8000B" strokeWidth={2.5} />
      {data.map((m, i) => (
        <circle
          key={`cp-${m.month}`}
          cx={PAD.l + slot * i + slot / 2}
          cy={yOf(m.avg)}
          r={3.5}
          fill="#C8000B"
          stroke="#fff"
          strokeWidth={1.5}
        />
      ))}
    </Box>
  );
}

// ---------- 通用小块 ----------

const SectionCard = ({
  title,
  desc,
  children
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) => (
  <Box
    p={{ base: 4, md: 5 }}
    borderRadius="18px"
    border="1px solid"
    borderColor="#E5E6EB"
    bg="white"
    boxShadow="0 6px 22px rgba(31,35,41,0.05)"
  >
    <Text as="h3" fontSize="sm" fontWeight={700} color="#1D2129">
      {title}
    </Text>
    {desc && (
      <Text fontSize="xs" color="gray.400" mt={0.5} mb={2}>
        {desc}
      </Text>
    )}
    <Box mt={desc ? 0 : 2}>{children}</Box>
  </Box>
);

const HBar = ({
  label,
  ratio,
  color,
  right,
  labelW = '86px'
}: {
  label: string;
  ratio: number;
  color: string;
  right: string;
  labelW?: string;
}) => (
  <Flex align="center" gap={2} fontSize="xs">
    <Text w={labelW} flexShrink={0} color="gray.600" noOfLines={1} title={label}>
      {label}
    </Text>
    <Box flex={1} h="14px" borderRadius="full" bg="gray.100" overflow="hidden">
      <Box
        h="100%"
        w={`${Math.max(ratio * 100, ratio > 0 ? 3 : 0)}%`}
        bg={color}
        borderRadius="full"
      />
    </Box>
    <Text w="64px" flexShrink={0} textAlign="right" color="gray.500">
      {right}
    </Text>
  </Flex>
);

const Legend = ({
  items
}: {
  items: { label: string; color: string; dashed?: boolean; bar?: boolean }[];
}) => (
  <HStack spacing={4} flexWrap="wrap">
    {items.map((it) => (
      <HStack key={it.label} spacing={1.5}>
        <Box
          w={it.bar ? '10px' : '16px'}
          h={it.bar ? '10px' : '2px'}
          borderRadius={it.bar ? '2px' : 'full'}
          bg={it.color}
          borderTop={it.dashed ? '2px dashed' : undefined}
          borderColor={it.dashed ? it.color : undefined}
        />
        <Text fontSize="xs" color="gray.500">
          {it.label}
        </Text>
      </HStack>
    ))}
  </HStack>
);

// ---------- 课程总结 ----------

export function TabCourseSummary({
  avatarId,
  courseName,
  chapterTree,
  classList
}: TabCourseSummaryProps) {
  const [perspective, setPerspective] = useState<Perspective>('course');
  const classNames = useMemo(() => {
    const list = (classList || []).map((c) => c.className).filter(Boolean);
    return list.length > 0 ? list : MOCK_CLASSES;
  }, [classList]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  const activeClass = selectedClass || classNames[0] || '';
  const isClass = perspective === 'class';
  const scopeName = isClass ? activeClass : courseName;

  const data = useMemo(
    () => buildCourseSummary(`${avatarId}|${isClass ? activeClass : '__course__'}`, chapterTree),
    [avatarId, isClass, activeClass, chapterTree]
  );
  const ai = useMemo(
    () => buildCourseAiSummary({ scopeName, isClass, data }),
    [scopeName, isClass, data]
  );

  const deltaText = (v: number, unit: string) =>
    `${v > 0 ? '▲' : v < 0 ? '▼' : '—'} ${Math.abs(v)}${unit} 较上月`;
  const deltaColor = (v: number) => (v > 0 ? '#059669' : v < 0 ? '#C8000B' : 'gray.400');

  const statCard = (value: string, label: string, delta: number, unit: string) => (
    <Box
      flex={1}
      minW={{ base: 'calc(50% - 6px)', md: '140px' }}
      p={{ base: 3.5, md: 4 }}
      borderRadius="16px"
      bg="#F7F8FA"
      border="1px solid"
      borderColor="#ECEEF2"
    >
      <Text fontSize="xl" fontWeight={700} color="gray.800" lineHeight="1.2">
        {value}
      </Text>
      <Text fontSize="xs" color="gray.400" mt={0.5}>
        {label}
      </Text>
      <Text fontSize="10px" mt={1} color={deltaColor(delta)}>
        {deltaText(delta, unit)}
      </Text>
    </Box>
  );

  const maxBandCount = Math.max(...data.kpBands.map((b) => b.count), 1);
  const maxWrong = Math.max(...data.topMissed.map((k) => 1 - k.rate), 0.01);

  return (
    <VStack align="stretch" spacing={4}>
      {/* 视角切换 + 班级选择 */}
      <Flex
        align={{ base: 'stretch', md: 'center' }}
        gap={3}
        direction={{ base: 'column', md: 'row' }}
        p={{ base: 3, md: 4 }}
        bg="white"
        border="1px solid"
        borderColor="#E5E6EB"
        borderRadius="18px"
        boxShadow="0 6px 22px rgba(31,35,41,0.05)"
      >
        <HStack spacing={2}>
          {(
            [
              { key: 'course', label: '课程视角' },
              { key: 'class', label: '班级视角' }
            ] as const
          ).map((p) => {
            const active = perspective === p.key;
            return (
              <Box
                key={p.key}
                as="button"
                px={3.5}
                minH="40px"
                borderRadius="full"
                fontSize="sm"
                fontWeight={active ? 600 : 400}
                color={active ? 'white' : 'gray.600'}
                bg={active ? 'gray.700' : 'gray.50'}
                border="1px solid"
                borderColor={active ? 'gray.700' : 'gray.200'}
                _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,0.14)' }}
                onClick={() => setPerspective(p.key)}
              >
                {p.label}
              </Box>
            );
          })}
        </HStack>
        {isClass && (
          <HStack spacing={1.5} flexWrap="wrap">
            {classNames.map((name) => {
              const active = activeClass === name;
              return (
                <Box
                  key={name}
                  as="button"
                  px={3}
                  minH="36px"
                  borderRadius="full"
                  fontSize="xs"
                  color={active ? '#C8000B' : 'gray.600'}
                  bg={active ? 'rgba(200,0,11,0.06)' : 'white'}
                  border="1px solid"
                  borderColor={active ? 'red.300' : 'gray.200'}
                  _focusVisible={{ boxShadow: '0 0 0 3px rgba(200,0,11,0.14)' }}
                  onClick={() => setSelectedClass(name)}
                >
                  {name}
                </Box>
              );
            })}
          </HStack>
        )}
        <Box flex={1} display={{ base: 'none', md: 'block' }} />
        <Text fontSize="xs" color="gray.400">
          {isClass ? `当前班级：${activeClass}` : `全部 ${classNames.length} 个班级汇总`} · 近 6
          个月
        </Text>
      </Flex>

      {/* AI 学习评价摘要 */}
      <Box
        p={{ base: 4, md: 5 }}
        borderRadius="18px"
        border="1px solid"
        borderColor="purple.100"
        bgGradient="linear(to-br, #F7F3FF, #EFF6FF)"
        boxShadow="0 8px 26px rgba(124,58,237,0.07)"
      >
        <Flex align="center" gap={2} mb={3} flexWrap="wrap">
          <Text fontSize="sm" fontWeight={700} color="gray.800">
            ✨ AI 学习评价摘要
          </Text>
          <Badge bg={ai.levelColor} color="white" borderRadius="md" px={2}>
            整体水平：{ai.level}
          </Badge>
          <Badge variant="subtle" colorScheme="purple" borderRadius="md" px={2}>
            {isClass ? `班级视角 · ${activeClass}` : '课程视角'}
          </Badge>
        </Flex>
        <Box mb={3}>
          <Text fontSize="xs" fontWeight={600} color="gray.500" mb={1}>
            课程学生学习整体情况
          </Text>
          <Text fontSize="sm" color="gray.700" lineHeight="1.7">
            {ai.overview}
          </Text>
        </Box>
        <Box mb={3}>
          <Text fontSize="xs" fontWeight={600} color="gray.500" mb={1}>
            重点发现
          </Text>
          <VStack align="stretch" spacing={1}>
            {ai.findings.map((f) => (
              <Flex key={f} gap={1.5} fontSize="sm" color="gray.700" lineHeight="1.6">
                <Text color="#7C3AED" flexShrink={0}>
                  •
                </Text>
                <Text>{f}</Text>
              </Flex>
            ))}
          </VStack>
        </Box>
        <Box>
          <Text fontSize="xs" fontWeight={600} color="gray.500" mb={1}>
            教学建议
          </Text>
          <VStack align="stretch" spacing={1}>
            {ai.suggestions.map((s, i) => (
              <Flex key={s} gap={1.5} fontSize="sm" color="gray.700" lineHeight="1.6">
                <Text color="#059669" flexShrink={0} fontWeight={600}>
                  {i + 1}.
                </Text>
                <Text>{s}</Text>
              </Flex>
            ))}
          </VStack>
        </Box>
      </Box>

      {/* 统计卡 */}
      <Flex gap={3} flexWrap="wrap">
        {statCard(`${data.avgScore} 分`, '平均总分', data.avgScoreDelta, ' 分')}
        {statCard(pct(data.kpMasteryRate), '知识点掌握率', data.kpMasteryDelta, '%')}
        {statCard(pct(data.quizCompletionRate), '测验完成率', data.quizCompletionDelta, '%')}
        {statCard(`${data.dailyStudyMinutes} 分钟`, '日均学习时长', data.dailyStudyDelta, ' 分钟')}
      </Flex>

      {/* 总分趋势 + 测验完成率 */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
        <SectionCard title="总分趋势" desc="近 6 个月每月平均分 / 最高分 / 最低分">
          <TrendChart data={data.months} />
          <Flex justify="center" mt={2}>
            <Legend
              items={[
                { label: '平均分', color: '#C8000B' },
                { label: '最高分', color: '#9CA3AF', dashed: true },
                { label: '最低分', color: '#D97706', dashed: true }
              ]}
            />
          </Flex>
        </SectionCard>
        <SectionCard title="测验完成率" desc="柱状：每月测验完成率；折线：每月平均分">
          <CompletionChart data={data.months} />
          <Flex justify="center" mt={2}>
            <Legend
              items={[
                { label: '测验完成率', color: 'rgba(37,99,235,0.75)', bar: true },
                { label: '平均分', color: '#C8000B' }
              ]}
            />
          </Flex>
        </SectionCard>
      </Grid>

      {/* 知识点掌握率分布 + 错因分布 */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
        <SectionCard
          title="知识点掌握率分布"
          desc={`共 ${data.kpList.length} 个知识点，按掌握率区间分布`}
        >
          <VStack align="stretch" spacing={2}>
            {data.kpBands.map((b, i) => (
              <HBar
                key={b.label}
                label={b.label}
                ratio={b.count / maxBandCount}
                color={BAND_COLORS[i]}
                right={`${b.count} 个`}
              />
            ))}
          </VStack>
        </SectionCard>
        <SectionCard title="错因分布" desc="学生答错题目按归因聚合（占比）">
          <VStack align="stretch" spacing={2}>
            {data.errorCauses.map((c, i) => (
              <HBar
                key={c.cause}
                label={c.cause}
                labelW="96px"
                ratio={c.ratio}
                color={CAUSE_COLORS[i % CAUSE_COLORS.length]}
                right={pct(c.ratio)}
              />
            ))}
          </VStack>
        </SectionCard>
      </Grid>

      {/* 高频失分点 TOP5 + 高频问题分析 */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
        <SectionCard title="高频失分点 TOP5" desc="按知识点失分率（1 - 掌握率）排序">
          <VStack align="stretch" spacing={2}>
            {data.topMissed.map((k, i) => (
              <Box key={k.kp}>
                <Flex align="center" gap={1.5} mb={1}>
                  <Text
                    fontSize="xs"
                    fontWeight={700}
                    color={i < 3 ? '#C8000B' : 'gray.400'}
                    w="18px"
                  >
                    {i + 1}
                  </Text>
                  <Text fontSize="xs" fontWeight={600} color="gray.700" noOfLines={1} flex={1}>
                    {k.kp}
                  </Text>
                  <Text fontSize="10px" color="gray.400" noOfLines={1}>
                    {k.chapterTitle}
                  </Text>
                </Flex>
                <HBar
                  label=""
                  labelW="18px"
                  ratio={(1 - k.rate) / maxWrong}
                  color="#C8000B"
                  right={`失分 ${pct(1 - k.rate)}`}
                />
              </Box>
            ))}
          </VStack>
        </SectionCard>
        <SectionCard title="高频问题分析" desc="学生向 AI 教师提问次数最多的问题">
          <VStack align="stretch" spacing={2}>
            {data.hotQuestions.map((q, i) => (
              <Flex
                key={q.question}
                align="flex-start"
                gap={2}
                p={2.5}
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.100"
                bg={i === 0 ? 'rgba(200,0,11,0.02)' : 'white'}
              >
                <Text
                  fontSize="xs"
                  fontWeight={700}
                  color={i < 3 ? '#C8000B' : 'gray.400'}
                  w="16px"
                  mt={0.5}
                >
                  {i + 1}
                </Text>
                <Box flex={1} minW={0}>
                  <Text fontSize="xs" color="gray.700" lineHeight="1.6">
                    {q.question}
                  </Text>
                  <Text fontSize="10px" color="gray.400" mt={0.5}>
                    {q.chapterTitle}
                  </Text>
                </Box>
                <Badge
                  flexShrink={0}
                  bg={i === 0 ? 'rgba(200,0,11,0.08)' : 'gray.50'}
                  color={i === 0 ? '#C8000B' : 'gray.500'}
                  borderRadius="full"
                  px={2}
                >
                  {q.count} 次
                </Badge>
              </Flex>
            ))}
          </VStack>
        </SectionCard>
      </Grid>
    </VStack>
  );
}
