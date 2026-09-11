'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Radio,
  RadioGroup,
  Select,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileCheck2,
  FileText,
  GitBranch,
  GraduationCap,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles
} from 'lucide-react';
import {
  abilityGaps,
  chapters,
  courseRows,
  goals,
  programs,
  type ProgramStatus,
  type TrainingProgram,
  warnings
} from './_mock/data';

const ACCENT = '#C8000B';
const ACCENT_SOFT = '#FFF2F2';
const SURFACE = '#F7F8FA';

const statusTone: Record<ProgramStatus, { bg: string; color: string }> = {
  编制中: { bg: 'orange.50', color: 'orange.700' },
  待论证: { bg: 'purple.50', color: 'purple.700' },
  已通过: { bg: 'green.50', color: 'green.700' },
  执行中: { bg: 'blue.50', color: 'blue.700' }
};

const navItems = [
  ['overview', '工作台'],
  ['plans', '方案管理'],
  ['editor', '方案编制'],
  ['benchmark', '岗位能力对标'],
  ['matrix', '课程能力映射'],
  ['review', '论证审核'],
  ['execution', '执行管理'],
  ['quality', '质量监测'],
  ['attainment', '达成分析'],
  ['warning', '预警整改'],
  ['validation', '整改验证'],
  ['improve', '改进建议']
] as const;
type TabKey = (typeof navItems)[number][0];

function PanelCard({ children, p = 5 }: { children: React.ReactNode; p?: number }) {
  return (
    <Box bg="white" borderWidth="1px" borderColor="blackAlpha.100" rounded="18px" p={p}>
      {children}
    </Box>
  );
}

function PanelTitle({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex align="flex-start" justify="space-between" gap={4} mb={4}>
      <Box>
        <Text fontWeight="700" color="gray.800">
          {title}
        </Text>
        {subtitle && (
          <Text mt={1} fontSize="sm" color="gray.500">
            {subtitle}
          </Text>
        )}
      </Box>
      {action}
    </Flex>
  );
}

function StatusBadge({ value }: { value: ProgramStatus }) {
  const tone = statusTone[value];
  return (
    <Badge px={2.5} py={1} rounded="full" bg={tone.bg} color={tone.color} fontWeight="600">
      {value}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = ACCENT
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  tone?: string;
}) {
  return (
    <PanelCard p={4}>
      <Flex align="flex-start" justify="space-between" gap={2}>
        <Box>
          <Text fontSize="sm" color="gray.500">
            {label}
          </Text>
          <Text mt={1.5} fontSize="2xl" fontWeight="750" color="gray.900" lineHeight="1">
            {value}
          </Text>
          <Text mt={2} fontSize="xs" color="gray.400">
            {helper}
          </Text>
        </Box>
        <Flex w="38px" h="38px" align="center" justify="center" rounded="12px" bg={`${tone}12`} color={tone}>
          <Icon size={19} strokeWidth={1.8} />
        </Flex>
      </Flex>
    </PanelCard>
  );
}

function DashboardPanel({ onNavigate }: { onNavigate: (tab: TabKey) => void }) {
  const metrics = [
    ['方案总数', '18', '覆盖 12 个专业', FileText, ACCENT],
    ['编制进行中', '5', '2 项本周到期', WandSparkles, '#DD6B20'],
    ['待论证', '3', '共 16 位专家参与', ClipboardCheck, '#805AD5'],
    ['岗位图谱', '26', '本月新增 3 个', GitBranch, '#3182CE'],
    ['能力点', '1,286', '已映射 92%', Target, '#0F9D80'],
    ['课程覆盖率', '89%', '较上月 +4.2%', BookOpen, '#2B6CB0'],
    ['质量预警', '6', '高风险 2 项', AlertTriangle, '#D53F3F'],
    ['执行达成度', '87%', '2025 级平均值', Activity, '#6B46C1']
  ] as const;
  return (
    <Stack spacing={5}>
      <SimpleGrid columns={{ base: 2, md: 4, xl: 8 }} spacing={3}>
        {metrics.map(([label, value, helper, icon, tone]) => (
          <MetricCard key={label} label={label} value={value} helper={helper} icon={icon} tone={tone} />
        ))}
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0,1.65fr) minmax(320px,.85fr)' }} gap={5}>
        <PanelCard>
          <PanelTitle
            title="方案编制进度"
            subtitle="按当前培养周期汇总"
            action={<Button variant="ghost" size="sm" rightIcon={<ArrowRight size={15} />} onClick={() => onNavigate('plans')}>查看全部</Button>}
          />
          <Box overflowX="auto">
            <Table size="sm" minW="720px">
              <Thead><Tr><Th>方案</Th><Th>负责人</Th><Th>状态</Th><Th>进度</Th><Th>更新时间</Th></Tr></Thead>
              <Tbody>
                {programs.slice(0, 4).map((program) => (
                  <Tr key={program.id} _hover={{ bg: 'gray.50' }}>
                    <Td><Text fontWeight="600" noOfLines={1}>{program.major}</Text><Text fontSize="xs" color="gray.400">{program.grade} · {program.version}</Text></Td>
                    <Td>{program.owner}</Td><Td><StatusBadge value={program.status} /></Td>
                    <Td><HStack><Progress value={program.progress} colorScheme="red" size="sm" rounded="full" w="86px" /><Text fontSize="xs">{program.progress}%</Text></HStack></Td>
                    <Td color="gray.500">{program.updatedAt}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </PanelCard>

        <PanelCard>
          <PanelTitle title="我的待办" subtitle="按优先级自动排序" />
          <Stack spacing={3}>
            {[
              ['智慧养老方案课程结构待完善', '今天 17:00', '高'],
              ['新能源方案等待提交论证', '明天 12:00', '中'],
              ['机电一体化执行预警待复核', '09-12', '高'],
              ['电子商务整改材料待验证', '09-15', '中']
            ].map(([title, time, level]) => (
              <Flex key={title} p={3} rounded="12px" bg={SURFACE} align="center" gap={3}>
                <Box w="6px" h="6px" rounded="full" bg={level === '高' ? ACCENT : 'orange.400'} flexShrink={0} />
                <Box flex="1" minW={0}><Text fontSize="sm" fontWeight="600" noOfLines={1}>{title}</Text><Text fontSize="xs" color="gray.400" mt={0.5}>{time}</Text></Box>
                <Button size="xs" variant="outline" rounded="8px" onClick={() => onNavigate(level === '高' ? 'warning' : 'editor')}>处理</Button>
              </Flex>
            ))}
          </Stack>
        </PanelCard>
      </Grid>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={5}>
        <PanelCard>
          <PanelTitle title="质量风险分布" subtitle="AI 基于方案、课程和执行数据持续检测" />
          <HStack align="stretch" spacing={4}>
            {[['高风险', '2', 'red.500'], ['中风险', '4', 'orange.400'], ['低风险', '9', 'blue.400']].map(([label, value, color]) => (
              <Box key={label} flex="1" p={4} rounded="14px" bg={SURFACE}><Text fontSize="xs" color="gray.500">{label}</Text><Text mt={1} fontSize="2xl" fontWeight="700" color={color}>{value}</Text></Box>
            ))}
          </HStack>
          <Button mt={4} w="full" variant="outline" rounded="10px" onClick={() => onNavigate('warning')}>进入预警整改</Button>
        </PanelCard>
        <PanelCard>
          <PanelTitle title="培养方案健康度" subtitle="当前主方案综合评估" />
          <Flex align="center" gap={6}>
            <Flex w="96px" h="96px" rounded="full" align="center" justify="center" bg={ACCENT_SOFT} border="8px solid" borderColor="red.100"><Box textAlign="center"><Text fontSize="2xl" fontWeight="800" color={ACCENT}>86</Text><Text fontSize="xs" color="gray.500">健康</Text></Box></Flex>
            <Stack flex="1" spacing={2.5}>
              {[['标准符合度', 94], ['岗位匹配度', 88], ['课程支撑度', 82], ['执行达成度', 79]].map(([label, value]) => (
                <Box key={label as string}><Flex justify="space-between" fontSize="xs" mb={1}><Text>{label}</Text><Text fontWeight="600">{value}%</Text></Flex><Progress value={value as number} colorScheme="red" size="xs" rounded="full" /></Box>
              ))}
            </Stack>
          </Flex>
        </PanelCard>
      </Grid>
    </Stack>
  );
}

function PlansPanel({ items, onEdit }: { items: TrainingProgram[]; onEdit: () => void }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => items.filter((item) => `${item.name}${item.major}${item.owner}`.includes(query)), [items, query]);
  return (
    <PanelCard>
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }} mb={5}>
        <Box><Text fontWeight="700">人才培养方案</Text><Text fontSize="sm" color="gray.500" mt={1}>统一管理方案版本、编制状态与质量风险</Text></Box>
        <HStack><Select size="sm" rounded="10px" w="130px" defaultValue="全部年级"><option>全部年级</option><option>2026 级</option><option>2025 级</option></Select><InputGroup size="sm" w={{ base: 'full', md: '240px' }}><InputLeftElement><Search size={15} /></InputLeftElement><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索专业、负责人" rounded="10px" /></InputGroup></HStack>
      </Flex>
      <Box overflowX="auto">
        <Table size="sm" minW="960px">
          <Thead><Tr><Th>方案名称</Th><Th>归属学院</Th><Th>负责人</Th><Th>状态</Th><Th>编制进度</Th><Th>培养参数</Th><Th>风险</Th><Th textAlign="right">操作</Th></Tr></Thead>
          <Tbody>{filtered.map((program) => <Tr key={program.id} _hover={{ bg: 'gray.50' }}><Td maxW="300px"><Text fontWeight="650" noOfLines={1}>{program.name}</Text><Text fontSize="xs" color="gray.400" mt={1}>{program.id} · {program.grade} · {program.version}</Text></Td><Td>{program.college}</Td><Td>{program.owner}</Td><Td><StatusBadge value={program.status} /></Td><Td><HStack><Progress value={program.progress} colorScheme="red" size="sm" rounded="full" w="80px" /><Text fontSize="xs">{program.progress}%</Text></HStack></Td><Td><Text fontSize="xs">{program.credits} 学分 · {program.hours} 学时</Text><Text fontSize="xs" color="gray.400">实践占比 {program.practiceRate}%</Text></Td><Td><Text fontSize="xs" color={program.risk === '无风险' ? 'green.600' : ACCENT}>{program.risk}</Text></Td><Td textAlign="right"><HStack justify="flex-end"><Button size="xs" variant="ghost" leftIcon={<Eye size={14} />} onClick={onEdit}>查看</Button><Button size="xs" variant="outline" rounded="8px" onClick={onEdit}>编辑</Button></HStack></Td></Tr>)}</Tbody>
        </Table>
      </Box>
    </PanelCard>
  );
}

function EditorPanel({ onPreview }: { onPreview: () => void }) {
  const [chapter, setChapter] = useState('04');
  const [mode, setMode] = useState<'goals' | 'courses' | 'schedule'>('goals');
  return (
    <Grid templateColumns={{ base: '1fr', xl: '230px minmax(0,1fr) 290px' }} gap={4} alignItems="start">
      <PanelCard p={3}>
        <Text px={2} py={2} fontWeight="700">方案目录</Text>
        <Stack spacing={1}>{chapters.map(([code, title, status]) => <Button key={code} variant="ghost" h="auto" py={2.5} px={2.5} rounded="10px" justifyContent="flex-start" bg={chapter === code ? ACCENT_SOFT : 'transparent'} color={chapter === code ? ACCENT : 'gray.700'} onClick={() => setChapter(code)}><HStack w="full" align="flex-start"><Text fontSize="xs" pt="2px" color={chapter === code ? ACCENT : 'gray.400'}>{code}</Text><Box flex="1" textAlign="left"><Text fontSize="sm" whiteSpace="normal">{title}</Text><Text mt={0.5} fontSize="xs" color={status === '完成' ? 'green.500' : status === '编辑中' ? 'orange.500' : 'gray.400'}>{status}</Text></Box></HStack></Button>)}</Stack>
      </PanelCard>

      <Stack spacing={4}>
        <PanelCard>
          <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
            <Box><Text fontWeight="700">04 培养目标与培养规格</Text><Text mt={1} fontSize="sm" color="gray.500">智慧健康养老服务与管理 · 2026 级 · V3.2</Text></Box>
            <HStack><Button size="sm" variant="outline" leftIcon={<Eye size={15} />} rounded="10px" onClick={onPreview}>预览</Button><Button size="sm" bg={ACCENT} color="white" _hover={{ bg: '#A80009' }} rounded="10px">保存草稿</Button></HStack>
          </Flex>
          <HStack mt={4} p={1} rounded="11px" bg={SURFACE} w="fit-content">
            {[['goals', '培养目标'], ['courses', '课程体系'], ['schedule', '教学进程']].map(([key, label]) => <Button key={key} size="sm" variant="ghost" rounded="8px" bg={mode === key ? 'white' : 'transparent'} color={mode === key ? ACCENT : 'gray.500'} boxShadow={mode === key ? 'sm' : 'none'} onClick={() => setMode(key as typeof mode)}>{label}</Button>)}
          </HStack>
        </PanelCard>

        {mode === 'goals' && <PanelCard><PanelTitle title="培养目标" subtitle="已与岗位能力图谱自动对齐，点击目标可继续编辑" action={<Button size="sm" variant="outline" rounded="10px" leftIcon={<Plus size={14} />}>添加目标</Button>} /><Stack spacing={3}>{goals.map((goal) => <Box key={goal.code} p={4} rounded="14px" borderWidth="1px" borderColor="gray.100" _hover={{ borderColor: 'red.200', bg: ACCENT_SOFT }} transition="all .2s"><Flex justify="space-between" gap={4}><HStack align="flex-start"><Flex w="34px" h="34px" rounded="10px" bg={ACCENT_SOFT} color={ACCENT} align="center" justify="center" fontWeight="700" fontSize="sm">{goal.code}</Flex><Box><Text fontWeight="650">{goal.title}</Text><Text mt={1} fontSize="sm" color="gray.500">{goal.detail}</Text></Box></HStack><Box textAlign="right"><Text fontSize="lg" fontWeight="700" color={goal.score >= 85 ? 'green.600' : 'orange.500'}>{goal.score}%</Text><Text fontSize="xs" color="gray.400">支撑度</Text></Box></Flex></Box>)}</Stack></PanelCard>}
        {mode === 'courses' && <PanelCard><PanelTitle title="课程体系" subtitle="核心课、拓展课与岗位能力的支撑关系" /><Box overflowX="auto"><Table size="sm" minW="720px"><Thead><Tr><Th>课程</Th><Th>类型</Th><Th>学分</Th><Th>学时</Th><Th>支撑能力</Th><Th>状态</Th></Tr></Thead><Tbody>{courseRows.map((row) => <Tr key={row[0]}><Td fontWeight="600">{row[0]}</Td><Td>{row[1]}</Td><Td>{row[2]}</Td><Td>{row[3]}</Td><Td maxW="240px">{row[4]}</Td><Td><Badge colorScheme={row[5] === '已对齐' ? 'green' : 'orange'} rounded="full">{row[5]}</Badge></Td></Tr>)}</Tbody></Table></Box></PanelCard>}
        {mode === 'schedule' && <PanelCard><PanelTitle title="教学进程总体安排" subtitle="6 个学期共 142 学分 / 2,640 学时" /><SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>{[1,2,3,4,5,6].map((term) => <Box key={term} p={4} bg={SURFACE} rounded="14px"><Text fontWeight="650">第 {term} 学期</Text><Text mt={3} fontSize="2xl" fontWeight="750">{term < 5 ? 24 : term === 5 ? 18 : 4} 学分</Text><Text mt={1} fontSize="xs" color="gray.500">{term < 5 ? `${420 + term * 8} 学时 · ${term + 5} 门课程` : term === 5 ? '480 学时 · 岗位实习' : '120 学时 · 毕业设计'}</Text></Box>)}</SimpleGrid></PanelCard>}
      </Stack>

      <Stack spacing={4}>
        <Box bg="linear-gradient(145deg,#3B1014,#8F0E18)" color="white" rounded="18px" p={5}><HStack><Sparkles size={18} /><Text fontWeight="700">AI 编制助手</Text></HStack><Text mt={3} fontSize="sm" color="whiteAlpha.800">已完成标准符合性、岗位覆盖度和课程支撑关系扫描。</Text><Flex mt={4} align="end" justify="space-between"><Box><Text fontSize="3xl" fontWeight="800">86</Text><Text fontSize="xs" color="whiteAlpha.700">方案健康度</Text></Box><Badge colorScheme="green" rounded="full">良好</Badge></Flex></Box>
        <PanelCard><PanelTitle title="智能建议" subtitle="4 项可优化内容" /><Stack spacing={3}>{[['培养目标', '补充智慧平台数据安全要求', '高'], ['课程体系', '建议新增吞咽风险评估实训', '高'], ['学时结构', '实践教学占比可提升 3%', '中'], ['毕业要求', '量化 G4 智慧服务达成标准', '中']].map(([tag, text, level]) => <Box key={text} p={3} rounded="12px" bg={SURFACE}><HStack justify="space-between"><Badge rounded="full" colorScheme={level === '高' ? 'red' : 'orange'}>{tag}</Badge><Text fontSize="xs" color="gray.400">{level}优先级</Text></HStack><Text mt={2} fontSize="sm">{text}</Text><Button mt={2} size="xs" variant="link" color={ACCENT}>应用建议</Button></Box>)}</Stack></PanelCard>
      </Stack>
    </Grid>
  );
}

function BenchmarkPanel({ onGraph }: { onGraph: () => void }) {
  const [active, setActive] = useState(0);
  return (
    <Grid templateColumns={{ base: '1fr', lg: '300px minmax(0,1fr)' }} gap={4}>
      <Stack spacing={4}>
        <PanelCard><PanelTitle title="目标岗位" subtitle="方案关联 3 个典型岗位" />{['养老护理员', '健康照护师', '养老机构运营专员'].map((job, index) => <Button key={job} w="full" h="auto" py={3} px={3} mb={2} rounded="11px" variant="ghost" justifyContent="space-between" bg={active === index ? ACCENT_SOFT : SURFACE} color={active === index ? ACCENT : 'gray.700'} onClick={() => setActive(index)}><HStack><BriefcaseBusiness size={16} /><Text>{job}</Text></HStack><Text fontSize="xs">{index === 0 ? '主岗位' : '关联'}</Text></Button>)}<Button mt={2} w="full" variant="outline" rounded="10px" leftIcon={<GitBranch size={15} />} onClick={onGraph}>查看岗位能力图谱</Button></PanelCard>
        <PanelCard><PanelTitle title="对标来源" /><Stack fontSize="sm" spacing={3}><HStack><FileCheck2 size={16} color={ACCENT} /><Text>养老护理员国家职业技能标准</Text></HStack><HStack><FileCheck2 size={16} color={ACCENT} /><Text>12 家合作企业岗位说明书</Text></HStack><HStack><FileCheck2 size={16} color={ACCENT} /><Text>1+X 老年照护职业技能等级标准</Text></HStack></Stack></PanelCard>
      </Stack>
      <Stack spacing={4}>
        <PanelCard><Flex justify="space-between" align="center"><Box><Text fontWeight="700">{['养老护理员', '健康照护师', '养老机构运营专员'][active]} · 能力对标结果</Text><Text mt={1} fontSize="sm" color="gray.500">目标能力 32 项，已覆盖 27 项，4 项存在等级差距</Text></Box><Box textAlign="right"><Text fontSize="2xl" fontWeight="800" color={ACCENT}>84%</Text><Text fontSize="xs" color="gray.400">岗位匹配度</Text></Box></Flex></PanelCard>
        <PanelCard><PanelTitle title="能力差距分析" subtitle="按缺口严重程度排序" /><Stack spacing={3}>{abilityGaps.map((gap) => <Box key={gap.name} p={4} rounded="14px" borderWidth="1px" borderColor="gray.100"><Flex justify="space-between" gap={3}><Box><HStack><Text fontWeight="650">{gap.name}</Text><Badge colorScheme={gap.severity === '高' ? 'red' : gap.severity === '中' ? 'orange' : 'green'} rounded="full">{gap.severity}风险</Badge></HStack><Text mt={1.5} fontSize="sm" color="gray.500">当前 {gap.level}，岗位要求 {gap.target}</Text></Box><Text fontSize="lg" fontWeight="700">{gap.coverage}%</Text></Flex><Progress mt={3} value={gap.coverage} colorScheme={gap.coverage < 70 ? 'red' : gap.coverage < 80 ? 'orange' : 'green'} size="sm" rounded="full" /><HStack mt={3}><Button size="xs" variant="outline" rounded="8px">查看证据</Button><Button size="xs" color={ACCENT} variant="ghost">生成课程优化建议</Button></HStack></Box>)}</Stack></PanelCard>
      </Stack>
    </Grid>
  );
}

function MatrixPanel() {
  const [matrix, setMatrix] = useState<Record<string, string>>({});
  const cellEditor = useDisclosure();
  const [cellKey, setCellKey] = useState('');
  const targets = ['G1 职业素养', 'G2 专业照护', 'G3 健康管理', 'G4 智慧服务'];
  const courses = ['老年生活照护', '老年健康评估', '智慧养老平台实务', '失智老年人照护', '养老机构运营管理'];
  const defaults = [['H','H','M','L'], ['M','H','H','L'], ['L','M','M','H'], ['M','H','H','M'], ['M','L','M','H']];
  const currentValue = matrix[cellKey] || (cellKey ? defaults[Number(cellKey.split('-')[0])][Number(cellKey.split('-')[1])] : 'M');
  return (
    <Grid templateColumns={{ base: '1fr', xl: 'minmax(0,1fr) 300px' }} gap={4}>
      <PanelCard><PanelTitle title="课程—培养目标支撑矩阵" subtitle="点击单元格调整支撑强度：H 高支撑 / M 中支撑 / L 低支撑" action={<Button size="sm" variant="outline" rounded="10px" leftIcon={<Download size={14} />}>导出矩阵</Button>} /><Box overflowX="auto"><Table size="sm" minW="720px"><Thead><Tr><Th>课程</Th>{targets.map((target) => <Th key={target} textAlign="center">{target}</Th>)}<Th textAlign="center">完整度</Th></Tr></Thead><Tbody>{courses.map((course, row) => <Tr key={course}><Td fontWeight="600">{course}</Td>{targets.map((_, col) => { const value = matrix[`${row}-${col}`] || defaults[row][col]; return <Td key={col} textAlign="center"><Button size="xs" minW="34px" rounded="8px" bg={value === 'H' ? 'red.50' : value === 'M' ? 'orange.50' : 'blue.50'} color={value === 'H' ? ACCENT : value === 'M' ? 'orange.700' : 'blue.600'} onClick={() => { setCellKey(`${row}-${col}`); cellEditor.onOpen(); }}>{value}</Button></Td>; })}<Td textAlign="center"><Badge colorScheme="green" rounded="full">完整</Badge></Td></Tr>)}</Tbody></Table></Box></PanelCard>
      <Stack spacing={4}><PanelCard><PanelTitle title="矩阵健康检查" /><Stack spacing={3}>{[['G4 智慧服务', '高支撑课程仅 2 门，建议补强', '高'], ['智慧养老平台实务', '与 G1 的支撑关系需提供证据', '中'], ['G2 专业照护', '支撑课程分布均衡', '正常']].map(([title, detail, level]) => <Box key={title} p={3} rounded="12px" bg={SURFACE}><HStack><Box w="7px" h="7px" rounded="full" bg={level === '高' ? ACCENT : level === '中' ? 'orange.400' : 'green.400'} /><Text fontSize="sm" fontWeight="650">{title}</Text></HStack><Text mt={1.5} pl="15px" fontSize="xs" color="gray.500">{detail}</Text></Box>)}</Stack></PanelCard><PanelCard><PanelTitle title="支撑强度分布" /><SimpleGrid columns={3} spacing={2}>{([['H', 11, 'red.50'], ['M', 7, 'orange.50'], ['L', 2, 'blue.50']] as const).map(([label, value, bg]) => <Box key={label} p={3} bg={bg} rounded="12px" textAlign="center"><Text fontSize="xl" fontWeight="700">{value}</Text><Text fontSize="xs" color="gray.500">{label} 支撑</Text></Box>)}</SimpleGrid></PanelCard></Stack>
      <Modal isOpen={cellEditor.isOpen} onClose={cellEditor.onClose} isCentered><ModalOverlay /><ModalContent rounded="18px"><ModalHeader>调整支撑强度</ModalHeader><ModalCloseButton /><ModalBody><Text fontSize="sm" color="gray.500" mb={4}>选择课程对培养目标的支撑强度。</Text><RadioGroup value={currentValue} onChange={(value) => setMatrix((prev) => ({ ...prev, [cellKey]: value }))}><Stack><Radio value="H">H · 高支撑（直接达成）</Radio><Radio value="M">M · 中支撑（部分达成）</Radio><Radio value="L">L · 低支撑（辅助达成）</Radio><Radio value="-">无支撑关系</Radio></Stack></RadioGroup></ModalBody><ModalFooter pt={4} pb={5}><Button variant="outline" rounded="10px" mr={3} onClick={cellEditor.onClose}>取消</Button><Button bg={ACCENT} color="white" _hover={{ bg: '#A80009' }} rounded="10px" onClick={cellEditor.onClose}>保存</Button></ModalFooter></ModalContent></Modal>
    </Grid>
  );
}

function ReviewPanel() {
  const toast = useToast();
  const [decision, setDecision] = useState('pass');
  return (
    <Grid templateColumns={{ base: '1fr', xl: '250px minmax(0,1fr) 310px' }} gap={4}>
      <PanelCard p={3}><Text p={2} fontWeight="700">论证材料</Text>{chapters.slice(0, 8).map(([code, title], index) => <Flex key={code} px={3} py={2.5} rounded="10px" bg={index === 3 ? ACCENT_SOFT : 'transparent'} align="center" justify="space-between"><Text fontSize="sm">{code} {title}</Text>{index === 3 && <Badge colorScheme="red" rounded="full">2 条意见</Badge>}</Flex>)}</PanelCard>
      <Stack spacing={4}><PanelCard><PanelTitle title="专家论证摘要" subtitle="智慧健康养老服务与管理专业 · V3.2" /><SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>{[['参评专家','7'], ['已提交','6'], ['原则通过','5'], ['待修改项','4']].map(([label,value]) => <Box key={label} p={3} bg={SURFACE} rounded="12px"><Text fontSize="xs" color="gray.500">{label}</Text><Text mt={1} fontSize="xl" fontWeight="700">{value}</Text></Box>)}</SimpleGrid></PanelCard><PanelCard><PanelTitle title="专家意见" /><Stack spacing={3}>{[['张建国 · 行业专家','建议加强智慧养老平台实训，明确平台数据采集、分析与隐私保护能力的达成标准。','高'], ['宋琳 · 企业专家','课程体系与典型工作任务对应清晰，建议将吞咽风险评估纳入核心实训项目。','高'], ['许明 · 校内专家','第六学期岗位实习考核指标还需补充企业导师评价权重。','中']].map(([author,text,level]) => <Box key={author} p={4} rounded="14px" borderWidth="1px" borderColor="gray.100"><HStack justify="space-between"><Text fontWeight="650">{author}</Text><Badge colorScheme={level === '高' ? 'red' : 'orange'} rounded="full">{level}优先级</Badge></HStack><Text mt={2} fontSize="sm" color="gray.600" lineHeight="1.8">{text}</Text><HStack mt={3}><Button size="xs" variant="outline" rounded="8px">定位原文</Button><Button size="xs" variant="ghost" color={ACCENT}>采纳并生成修改</Button></HStack></Box>)}</Stack></PanelCard></Stack>
      <PanelCard><PanelTitle title="提交论证结论" subtitle="结论提交后进入专业负责人整改" /><RadioGroup value={decision} onChange={setDecision}><Stack spacing={3}><Radio value="pass">通过</Radio><Radio value="conditional">修改后通过</Radio><Radio value="reject">不通过，重新编制</Radio></Stack></RadioGroup><FormControl mt={5}><FormLabel fontSize="sm">综合意见</FormLabel><Textarea minH="150px" rounded="12px" placeholder="填写论证依据、修改要求和建议完成时间…" defaultValue="方案整体结构完整，职业面向清晰。建议补强智慧平台操作和吞咽风险评估相关课程内容，修改后通过。" /></FormControl><Button mt={4} w="full" bg={ACCENT} color="white" _hover={{ bg: '#A80009' }} rounded="10px" onClick={() => toast({ title: '论证结论已提交', description: 'Mock：已通知专业负责人进入整改。', status: 'success', position: 'top' })}>提交结论</Button></PanelCard>
    </Grid>
  );
}

function ExecutionPanel() {
  const terms = [82, 91, 86, 74, 68, 35];
  return <Stack spacing={5}><SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}><MetricCard label="执行中方案" value="9" helper="覆盖 2024—2026 级" icon={Activity} /><MetricCard label="课程开出率" value="96.4%" helper="计划 318 / 实际 307" icon={BookOpen} tone="#3182CE" /><MetricCard label="学分完成率" value="88.2%" helper="较上学期 +3.1%" icon={CheckCircle2} tone="#0F9D80" /><MetricCard label="执行偏差" value="7" helper="需调整项目 3 项" icon={AlertTriangle} tone="#DD6B20" /></SimpleGrid><Grid templateColumns={{ base: '1fr', lg: '1.3fr .7fr' }} gap={5}><PanelCard><PanelTitle title="学期执行进度" subtitle="智慧健康养老服务与管理 · 2025 级" /><HStack align="end" h="230px" spacing={{ base: 3, md: 6 }} px={3}>{terms.map((value,index) => <Flex key={index} direction="column" align="center" justify="end" h="full" flex="1"><Text fontSize="xs" fontWeight="600" mb={2}>{value}%</Text><Box w="full" maxW="42px" h={`${value * 1.7}px`} minH="20px" bg={index === 5 ? 'red.200' : index === 4 ? 'orange.300' : ACCENT} rounded="8px 8px 3px 3px" /><Text mt={2} fontSize="xs" color="gray.500">第{index + 1}学期</Text></Flex>)}</HStack></PanelCard><PanelCard><PanelTitle title="执行偏差" /><Stack spacing={3}>{[['岗位实习周数','计划 24 周 / 当前 20 周','高'], ['智慧平台实训课','开课进度延迟 2 周','中'], ['企业导师覆盖率','目标 100% / 当前 86%','中'], ['核心课程开出率','18/18 门','正常']].map(([title,detail,level]) => <Box key={title} p={3} rounded="12px" bg={SURFACE}><HStack justify="space-between"><Text fontSize="sm" fontWeight="650">{title}</Text><Badge colorScheme={level === '高' ? 'red' : level === '中' ? 'orange' : 'green'} rounded="full">{level}</Badge></HStack><Text mt={1} fontSize="xs" color="gray.500">{detail}</Text></Box>)}</Stack></PanelCard></Grid></Stack>;
}

function QualityPanel() {
  const metrics = [
    ['标准符合度', 94, '国家专业教学标准'],
    ['岗位匹配度', 88, '3 个目标岗位'],
    ['课程支撑度', 82, '45 门课程'],
    ['毕业要求达成', 79, '2025 级阶段值']
  ];
  return <Stack spacing={5}><SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4}>{metrics.map(([label,value,helper]) => <PanelCard key={label as string}><Flex justify="space-between"><Box><Text fontSize="sm" color="gray.500">{label}</Text><Text mt={2} fontSize="3xl" fontWeight="800">{value}%</Text><Text mt={2} fontSize="xs" color="gray.400">{helper}</Text></Box><Flex w="54px" h="54px" rounded="full" align="center" justify="center" bg={Number(value) >= 85 ? 'green.50' : 'orange.50'} color={Number(value) >= 85 ? 'green.600' : 'orange.600'}><Activity size={23} /></Flex></Flex><Progress mt={4} value={Number(value)} colorScheme={Number(value) >= 85 ? 'green' : 'orange'} rounded="full" size="sm" /></PanelCard>)}</SimpleGrid><Grid templateColumns={{ base: '1fr', lg: '1.4fr .6fr' }} gap={5}><PanelCard><PanelTitle title="质量指标监测" subtitle="数据来自教务、实训、评价和就业系统的 Mock 聚合" /><Box overflowX="auto"><Table size="sm" minW="720px"><Thead><Tr><Th>指标</Th><Th>目标值</Th><Th>当前值</Th><Th>趋势</Th><Th>状态</Th><Th>数据来源</Th></Tr></Thead><Tbody>{[['核心课程达成度','≥ 85%','87.6%','↑ 2.1%','达标','课程评价'], ['实践教学占比','≥ 55%','56.0%','↑ 1.0%','达标','教务系统'], ['证书获取率','≥ 80%','76.8%','↓ 1.6%','预警','证书平台'], ['企业满意度','≥ 90%','91.2%','↑ 3.4%','达标','企业评价'], ['毕业去向落实率','≥ 92%','89.5%','持平','关注','就业系统']].map((row) => <Tr key={row[0]}><Td fontWeight="600">{row[0]}</Td>{row.slice(1,4).map((value) => <Td key={value}>{value}</Td>)}<Td><Badge colorScheme={row[4] === '达标' ? 'green' : row[4] === '预警' ? 'red' : 'orange'} rounded="full">{row[4]}</Badge></Td><Td color="gray.500">{row[5]}</Td></Tr>)}</Tbody></Table></Box></PanelCard><PanelCard><PanelTitle title="监测周期" /><Stack spacing={3}>{[['实时','课程开出、学生出勤'], ['每月','学分进度、实训达成'], ['每学期','课程目标达成度'], ['每学年','毕业要求与就业质量']].map(([cycle,detail]) => <HStack key={cycle} align="flex-start"><Flex w="30px" h="30px" rounded="9px" bg={ACCENT_SOFT} color={ACCENT} align="center" justify="center" fontSize="xs" fontWeight="700">{cycle.slice(0,1)}</Flex><Box><Text fontSize="sm" fontWeight="650">{cycle}</Text><Text fontSize="xs" color="gray.500">{detail}</Text></Box></HStack>)}</Stack><Divider my={4} /><Text fontSize="xs" color="gray.500" lineHeight="1.7">指标异常将自动生成预警，进入“发现—整改—验证—归档”的质量闭环。</Text></PanelCard></Grid></Stack>;
}

function AttainmentPanel() {
  const outcomes = [
    ['G1 职业素养', '≥ 85%', '91.6%', '达成', '课程评价、企业评价'],
    ['G2 专业照护', '≥ 85%', '87.8%', '达成', '核心课程、技能考核'],
    ['G3 健康管理', '≥ 80%', '82.4%', '达成', '项目实训、综合测评'],
    ['G4 智慧服务', '≥ 80%', '74.9%', '未达成', '平台实训、岗位评价']
  ];
  return <Stack spacing={5}><SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}><MetricCard label="总体达成度" value="84.2%" helper="较上学期 +2.8%" icon={Target} /><MetricCard label="已达成目标" value="3/4" helper="G4 仍需补强" icon={CheckCircle2} tone="#0F9D80" /><MetricCard label="参与学生" value="286" helper="覆盖 8 个教学班" icon={GraduationCap} tone="#3182CE" /><MetricCard label="有效证据" value="1,842" helper="课程与企业评价数据" icon={FileCheck2} tone="#805AD5" /></SimpleGrid><Grid templateColumns={{ base: '1fr', lg: 'minmax(0,1fr) 300px' }} gap={5}><PanelCard><PanelTitle title="培养目标达成分析" subtitle="智慧健康养老服务与管理 · 2025 级" /><Box overflowX="auto"><Table size="sm" minW="720px"><Thead><Tr><Th>培养目标</Th><Th>目标值</Th><Th>达成值</Th><Th>结论</Th><Th>证据来源</Th></Tr></Thead><Tbody>{outcomes.map((row) => <Tr key={row[0]}><Td fontWeight="650">{row[0]}</Td><Td>{row[1]}</Td><Td><Text fontWeight="700" color={row[3] === '达成' ? 'green.600' : ACCENT}>{row[2]}</Text></Td><Td><Badge colorScheme={row[3] === '达成' ? 'green' : 'red'} rounded="full">{row[3]}</Badge></Td><Td color="gray.500">{row[4]}</Td></Tr>)}</Tbody></Table></Box></PanelCard><PanelCard><PanelTitle title="未达成归因" /><Stack spacing={3}>{[['课程支撑','智慧平台操作高支撑课程不足'], ['教学实施','平台综合实训完成率仅 76%'], ['评价证据','企业导师评价样本覆盖率偏低']].map(([label, detail], index) => <Box key={label} p={3} bg={SURFACE} rounded="12px"><HStack><Flex w="22px" h="22px" rounded="7px" bg={ACCENT_SOFT} color={ACCENT} align="center" justify="center" fontSize="xs" fontWeight="700">{index + 1}</Flex><Text fontSize="sm" fontWeight="650">{label}</Text></HStack><Text mt={2} fontSize="xs" color="gray.500" lineHeight="1.7">{detail}</Text></Box>)}</Stack></PanelCard></Grid></Stack>;
}

function ValidationPanel() {
  const toast = useToast();
  return <Grid templateColumns={{ base: '1fr', xl: 'minmax(0,1fr) 300px' }} gap={5}><PanelCard><PanelTitle title="整改验证任务" subtitle="验证达成后自动关闭预警并沉淀改进证据" /><Box overflowX="auto"><Table size="sm" minW="780px"><Thead><Tr><Th>整改事项</Th><Th>整改动作</Th><Th>验证指标</Th><Th>验证结果</Th><Th>状态</Th><Th textAlign="right">操作</Th></Tr></Thead><Tbody>{[['智慧平台操作能力支撑不足','新增 16 学时综合实训','课程达成度 ≥ 80%','82.6%','验证通过'], ['吞咽风险评估训练不足','补充 2 个情境项目','技能考核 ≥ 85%','待采集','待验证'], ['企业导师覆盖率偏低','新增 6 名企业导师','覆盖率 ≥ 95%','93.2%','验证中']].map((row) => <Tr key={row[0]}><Td fontWeight="650">{row[0]}</Td><Td>{row[1]}</Td><Td>{row[2]}</Td><Td>{row[3]}</Td><Td><Badge colorScheme={row[4] === '验证通过' ? 'green' : row[4] === '验证中' ? 'blue' : 'orange'} rounded="full">{row[4]}</Badge></Td><Td textAlign="right"><Button size="xs" variant="outline" rounded="8px" onClick={() => toast({ title: '已打开验证详情', description: 'Mock：展示整改前后指标、证据和验证意见。', status: 'info', position: 'top' })}>验证详情</Button></Td></Tr>)}</Tbody></Table></Box></PanelCard><Stack spacing={4}><PanelCard><PanelTitle title="验证闭环" /><Stack spacing={3}>{[['1','提交整改材料','已完成'], ['2','采集验证数据','进行中'], ['3','质量负责人复核','待开始'], ['4','关闭并归档','待开始']].map(([step, title, status]) => <HStack key={step} align="flex-start"><Flex w="30px" h="30px" rounded="full" flexShrink={0} align="center" justify="center" bg={status === '已完成' ? 'green.50' : status === '进行中' ? ACCENT_SOFT : 'gray.100'} color={status === '已完成' ? 'green.600' : status === '进行中' ? ACCENT : 'gray.400'} fontSize="xs" fontWeight="700">{step}</Flex><Box><Text fontSize="sm" fontWeight="650">{title}</Text><Text fontSize="xs" color="gray.400">{status}</Text></Box></HStack>)}</Stack></PanelCard><PanelCard><PanelTitle title="本月验证数据" /><SimpleGrid columns={2} spacing={2}>{[['待验证','3'], ['验证中','2'], ['已通过','8'], ['退回整改','1']].map(([label,value]) => <Box key={label} p={3} bg={SURFACE} rounded="11px" textAlign="center"><Text fontSize="xl" fontWeight="750">{value}</Text><Text fontSize="xs" color="gray.500">{label}</Text></Box>)}</SimpleGrid></PanelCard></Stack></Grid>;
}

function ImprovePanel() {
  const toast = useToast();
  const suggestions = [
    ['课程结构优化', '将《智慧养老平台实务》由专业拓展课调整为专业核心课，并增加 16 学时综合实训。', '解决 G4 智慧服务达成度不足', '高'],
    ['实训内容补强', '在《老年健康评估》中新增吞咽风险识别与应急处置情境项目。', '覆盖 58% 的能力缺口', '高'],
    ['评价机制完善', '企业导师评价权重由 20% 提升至 30%，补充数字化服务过程证据。', '提升岗位评价有效性', '中'],
    ['学期负荷调整', '将养老机构运营管理调整至第四学期，平衡第三学期课程负荷。', '峰值周学时降低 4 学时', '中']
  ];
  return <Stack spacing={5}><PanelCard><Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" direction={{ base: 'column', md: 'row' }} gap={4}><HStack align="flex-start"><Flex w="42px" h="42px" align="center" justify="center" rounded="13px" bg={ACCENT_SOFT} color={ACCENT}><Sparkles size={20} /></Flex><Box><Text fontWeight="700">AI 持续改进建议</Text><Text mt={1} fontSize="sm" color="gray.500">综合岗位标准、达成分析、预警整改与企业反馈生成</Text></Box></HStack><Button size="sm" bg={ACCENT} color="white" _hover={{ bg: '#A80009' }} rounded="10px" leftIcon={<WandSparkles size={15} />} onClick={() => toast({ title: '已重新生成建议', description: 'Mock：已结合最新质量数据更新优先级。', status: 'success', position: 'top' })}>重新生成</Button></Flex></PanelCard><SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>{suggestions.map(([title, detail, impact, level], index) => <PanelCard key={title}><Flex justify="space-between" align="flex-start"><HStack><Flex w="30px" h="30px" rounded="9px" bg={index < 2 ? ACCENT_SOFT : 'orange.50'} color={index < 2 ? ACCENT : 'orange.600'} align="center" justify="center" fontSize="xs" fontWeight="800">{index + 1}</Flex><Text fontWeight="700">{title}</Text></HStack><Badge colorScheme={level === '高' ? 'red' : 'orange'} rounded="full">{level}优先级</Badge></Flex><Text mt={4} fontSize="sm" color="gray.600" lineHeight="1.8">{detail}</Text><Box mt={4} p={3} rounded="11px" bg={SURFACE}><Text fontSize="xs" color="gray.400">预期收益</Text><Text mt={1} fontSize="sm" fontWeight="600">{impact}</Text></Box><HStack mt={4}><Button size="sm" variant="outline" rounded="9px">查看依据</Button><Button size="sm" variant="ghost" color={ACCENT} rightIcon={<ArrowRight size={14} />} onClick={() => toast({ title: '建议已加入下一版方案', description: 'Mock：已生成修改任务并保留采纳记录。', status: 'success', position: 'top' })}>采纳建议</Button></HStack></PanelCard>)}</SimpleGrid></Stack>;
}

function WarningPanel({ onOpen }: { onOpen: (index: number) => void }) {
  return <Grid templateColumns={{ base: '1fr', lg: 'minmax(0,1fr) 290px' }} gap={5}><PanelCard><PanelTitle title="质量预警与整改" subtitle="对方案、课程与执行异常进行闭环管理" /><Box overflowX="auto"><Table size="sm" minW="760px"><Thead><Tr><Th>预警事项</Th><Th>对象</Th><Th>等级</Th><Th>责任人</Th><Th>截止时间</Th><Th>状态</Th><Th textAlign="right">操作</Th></Tr></Thead><Tbody>{warnings.map((item,index) => <Tr key={item.id} _hover={{ bg: 'gray.50' }}><Td><Text fontWeight="650">{item.title}</Text><Text mt={1} fontSize="xs" color="gray.400">{item.id}</Text></Td><Td>智慧养老 2025 级</Td><Td><Badge colorScheme={item.level === '高' ? 'red' : 'orange'} rounded="full">{item.level}风险</Badge></Td><Td>{index % 2 ? '张莉' : '陈静'}</Td><Td>{index === 0 ? '09-12' : index === 1 ? '09-18' : '09-25'}</Td><Td><Badge colorScheme={index === 2 ? 'blue' : 'orange'} rounded="full">{index === 2 ? '待验证' : '整改中'}</Badge></Td><Td textAlign="right"><Button size="xs" variant="outline" rounded="8px" onClick={() => onOpen(index)}>查看整改</Button></Td></Tr>)}</Tbody></Table></Box></PanelCard><Stack spacing={4}><PanelCard><PanelTitle title="闭环概览" /><Stack spacing={3}>{[['待分派','2'], ['整改中','4'], ['待验证','3'], ['本月已关闭','11']].map(([label,value]) => <Flex key={label} p={3} bg={SURFACE} rounded="12px" justify="space-between"><Text fontSize="sm" color="gray.600">{label}</Text><Text fontWeight="700">{value}</Text></Flex>)}</Stack></PanelCard><Box p={5} rounded="18px" bg="linear-gradient(145deg,#FFF5F5,#FFF)" borderWidth="1px" borderColor="red.100"><ShieldCheck size={24} color={ACCENT} /><Text mt={3} fontWeight="700">质量改进建议</Text><Text mt={2} fontSize="sm" color="gray.600" lineHeight="1.7">AI 已结合本学期 6 项预警生成 3 条课程结构和 2 条评价机制优化建议。</Text><Button mt={4} size="sm" bg={ACCENT} color="white" _hover={{ bg: '#A80009' }} rounded="10px">查看建议</Button></Box></Stack></Grid>;
}

export default function TrainingProgramsPageClient() {
  const toast = useToast();
  const createModal = useDisclosure();
  const previewModal = useDisclosure();
  const warningModal = useDisclosure();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [programList, setProgramList] = useState<TrainingProgram[]>(programs);
  const [newName, setNewName] = useState('');
  const [activeWarning, setActiveWarning] = useState(0);
  const tabIndex = navItems.findIndex(([key]) => key === activeTab);

  const createProgram = () => {
    const name = newName.trim() || '新建专业人才培养方案';
    setProgramList((prev) => [{ ...programs[0], id: `TP-2026-${String(prev.length + 1).padStart(3, '0')}`, name, major: name.replace('人才培养方案', ''), progress: 8, version: 'V1.0', status: '编制中', updatedAt: '刚刚' }, ...prev]);
    createModal.onClose();
    setNewName('');
    setActiveTab('editor');
    toast({ title: '方案草稿已创建', description: '已进入编制工作台，Mock 数据仅保留在当前页面。', status: 'success', position: 'top' });
  };

  return (
    <Stack spacing={5}>
      <Flex align={{ base: 'flex-start', lg: 'center' }} justify="space-between" gap={4} direction={{ base: 'column', lg: 'row' }}>
        <HStack align="flex-start" spacing={3}>
          <Flex w="46px" h="46px" rounded="14px" bg={ACCENT_SOFT} color={ACCENT} align="center" justify="center"><GraduationCap size={24} /></Flex>
          <Box><Text fontSize="xl" fontWeight="750" color="gray.900">人才培养方案管理</Text><Text mt={1} fontSize="sm" color="gray.500">以岗位能力为牵引，贯通方案编制、课程映射、论证执行与质量改进</Text></Box>
        </HStack>
        <HStack><Button variant="outline" rounded="10px" leftIcon={<Download size={16} />} onClick={() => toast({ title: '进度报告已生成', description: 'Mock：已完成 18 份方案的汇总导出。', status: 'success', position: 'top' })}>导出进度</Button><Button bg={ACCENT} color="white" _hover={{ bg: '#A80009' }} rounded="10px" leftIcon={<Plus size={16} />} onClick={createModal.onOpen}>新建方案</Button></HStack>
      </Flex>

      <Box bg="white" rounded="18px" borderWidth="1px" borderColor="blackAlpha.100" overflow="hidden">
        <Tabs index={tabIndex} onChange={(index) => setActiveTab(navItems[index][0])} variant="unstyled">
          <Box display={{ base: 'block', lg: 'none' }} p={3} borderBottomWidth="1px" borderColor="gray.100">
            <Select
              aria-label="选择人培方案管理功能"
              value={activeTab}
              rounded="10px"
              bg="white"
              onChange={(event) => setActiveTab(event.target.value as TabKey)}
            >
              {navItems.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </Select>
          </Box>
          <TabList display={{ base: 'none', lg: 'flex' }} overflowX="auto" borderBottomWidth="1px" borderColor="gray.100" px={3} sx={{ scrollbarWidth: 'thin', scrollbarColor: '#D5D8DE transparent' }}>
            {navItems.map(([key, label]) => <Tab key={key} flexShrink={0} px={4} py={3.5} fontSize="sm" fontWeight="650" color="gray.500" _selected={{ color: ACCENT, boxShadow: `inset 0 -2px 0 ${ACCENT}` }}>{label}</Tab>)}
          </TabList>
          <TabPanels bg="#F6F7F9">
            <TabPanel p={{ base: 3, md: 5 }}><DashboardPanel onNavigate={setActiveTab} /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><PlansPanel items={programList} onEdit={() => setActiveTab('editor')} /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><EditorPanel onPreview={previewModal.onOpen} /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><BenchmarkPanel onGraph={() => { window.location.href = '/admin/graph/ability'; }} /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><MatrixPanel /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><ReviewPanel /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><ExecutionPanel /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><QualityPanel /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><AttainmentPanel /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><WarningPanel onOpen={(index) => { setActiveWarning(index); warningModal.onOpen(); }} /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><ValidationPanel /></TabPanel>
            <TabPanel p={{ base: 3, md: 5 }}><ImprovePanel /></TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} isCentered>
        <ModalOverlay /><ModalContent rounded="18px"><ModalHeader>新建人才培养方案</ModalHeader><ModalCloseButton /><ModalBody><Stack spacing={4}><FormControl isRequired><FormLabel fontSize="sm">方案名称</FormLabel><Input value={newName} onChange={(event) => setNewName(event.target.value)} rounded="10px" placeholder="例如：智慧健康养老服务与管理专业人才培养方案" /></FormControl><FormControl><FormLabel fontSize="sm">适用年级</FormLabel><Select rounded="10px"><option>2026 级</option><option>2025 级</option></Select></FormControl><FormControl><FormLabel fontSize="sm">创建方式</FormLabel><Select rounded="10px"><option>基于标准模板创建</option><option>复制历史方案</option><option>AI 辅助生成</option></Select></FormControl></Stack></ModalBody><ModalFooter pt={4} pb={5}><Button variant="outline" rounded="10px" mr={3} onClick={createModal.onClose}>取消</Button><Button bg={ACCENT} color="white" _hover={{ bg: '#A80009' }} rounded="10px" onClick={createProgram}>创建并编制</Button></ModalFooter></ModalContent>
      </Modal>

      <Modal isOpen={previewModal.isOpen} onClose={previewModal.onClose} size="4xl" isCentered scrollBehavior="inside">
        <ModalOverlay /><ModalContent rounded="20px" maxH="88vh"><ModalHeader><Text>方案预览</Text><Text mt={1} fontSize="sm" fontWeight="normal" color="gray.500">智慧健康养老服务与管理专业 · 2026 级 · V3.2</Text></ModalHeader><ModalCloseButton /><ModalBody pb={5}><Box p={{ base: 4, md: 8 }} bg={SURFACE} rounded="14px"><Text textAlign="center" fontSize="2xl" fontWeight="800">智慧健康养老服务与管理专业人才培养方案</Text><Text textAlign="center" mt={2} color="gray.500">（2026 级）</Text><Divider my={7} /><Stack spacing={6}>{chapters.slice(0, 6).map(([code,title],index) => <Box key={code}><Text fontWeight="700">{code} {title}</Text><Text mt={2} fontSize="sm" color="gray.600" lineHeight="1.9">{index === 3 ? '面向养老护理员、健康照护师和养老机构运营专员等岗位，培养具备职业素养、专业照护、健康管理与智慧服务能力的高素质技术技能人才。' : '本章节内容已依据国家专业教学标准、职业技能等级标准及区域养老服务产业需求完成编制与审核。'}</Text></Box>)}</Stack></Box></ModalBody><ModalFooter pt={3} pb={5}><Button variant="outline" rounded="10px" mr={3} onClick={previewModal.onClose}>关闭</Button><Button bg={ACCENT} color="white" _hover={{ bg: '#A80009' }} rounded="10px" leftIcon={<Download size={15} />}>导出 PDF</Button></ModalFooter></ModalContent>
      </Modal>

      <Modal isOpen={warningModal.isOpen} onClose={warningModal.onClose} size="xl" isCentered>
        <ModalOverlay /><ModalContent rounded="20px"><ModalHeader><HStack><Flex w="36px" h="36px" align="center" justify="center" rounded="10px" bg={ACCENT_SOFT} color={ACCENT}><AlertTriangle size={18} /></Flex><Box><Text>整改任务详情</Text><Text mt={0.5} fontSize="xs" fontWeight="normal" color="gray.500">{warnings[activeWarning].id} · {warnings[activeWarning].level}风险</Text></Box></HStack></ModalHeader><ModalCloseButton /><ModalBody><Text fontSize="lg" fontWeight="700">{warnings[activeWarning].title}</Text><Text mt={2} fontSize="sm" color="gray.600" lineHeight="1.8">AI 检测到当前课程支撑度与岗位能力目标存在偏差，已连续两个监测周期低于阈值，建议补充实训项目并调整考核证据。</Text><SimpleGrid columns={2} spacing={3} mt={5}>{[['责任人','陈静'], ['整改截止','2026-09-18'], ['当前状态','整改中'], ['验证方式','课程目标达成分析']].map(([label,value]) => <Box key={label} p={3} bg={SURFACE} rounded="12px"><Text fontSize="xs" color="gray.500">{label}</Text><Text mt={1} fontSize="sm" fontWeight="650">{value}</Text></Box>)}</SimpleGrid><FormControl mt={5}><FormLabel fontSize="sm">整改记录</FormLabel><Textarea rounded="12px" minH="110px" defaultValue="已将吞咽风险评估实训纳入《老年健康评估》第 4 项目，并补充过程评价量规。" /></FormControl></ModalBody><ModalFooter pt={4} pb={5}><Button variant="outline" rounded="10px" mr={3} onClick={warningModal.onClose}>关闭</Button><Button bg={ACCENT} color="white" _hover={{ bg: '#A80009' }} rounded="10px" onClick={() => { warningModal.onClose(); toast({ title: '已提交验证', description: 'Mock：质量负责人将进行达成度复核。', status: 'success', position: 'top' }); }}>提交验证</Button></ModalFooter></ModalContent>
      </Modal>
    </Stack>
  );
}
