'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Input,
  Progress,
  Select,
  Text,
  VStack,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound
} from 'lucide-react';
import Button from '@/app/components/ui/Button';
import type { AiAvatarDetailVO } from '@/teacher/types/aiTeacher';
import type {
  ReviewStatus,
  TrainingReview,
  TrainingState,
  TrainingSubmission,
  TrainingTask,
  TrainingTaskStatus
} from './types';
import { calculateAbilityResults, reviewTotalScore } from './types';
import {
  createBlankTrainingSubmissions,
  createSeedTrainingState,
  getPublishedAbilityOptions,
  loadTrainingState,
  saveTrainingState
} from './mockTraining';
import { TrainingTaskEditorModal } from './TrainingTaskEditorModal';
import { TrainingTaskDetail } from './TrainingTaskDetail';
import { TrainingReviewWorkspace } from './TrainingReviewWorkspace';
import { StudentAbilityView } from './StudentAbilityView';

type Props = {
  avatarDetail: AiAvatarDetailVO | null;
};

type ViewState =
  | { type: 'list' }
  | { type: 'detail'; taskId: string }
  | { type: 'review'; taskId: string; submissionId: string }
  | { type: 'ability'; taskId: string; submissionId: string; backTo: 'detail' | 'review' };

const taskMeta = {
  draft: { label: '草稿', color: '#86909C', bg: '#F2F3F5' },
  published: { label: '进行中', color: '#2563EB', bg: '#EFF6FF' },
  ended: { label: '已结束', color: '#059669', bg: '#ECFDF5' }
};

function TaskStat({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: typeof ClipboardList }) {
  return (
    <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={{ base: 4, md: 5 }} boxShadow="0 7px 24px rgba(31,35,41,.05)">
      <Flex justify="space-between" align="center">
        <Box><Text fontSize="xs" color="#86909C">{label}</Text><Text fontSize="3xl" fontWeight={780} color="#1D2129" mt={1}>{value}</Text></Box>
        <Flex w="44px" h="44px" borderRadius="14px" align="center" justify="center" bg={`${color}12`} color={color}><Icon size={21} /></Flex>
      </Flex>
    </Box>
  );
}

export function TabTrainingManage({ avatarDetail }: Props) {
  const toast = useToast();
  const editor = useDisclosure();
  const deleteDialog = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const hydrated = useRef(false);
  const [state, setState] = useState<TrainingState>(() => createSeedTrainingState());
  const [view, setView] = useState<ViewState>({ type: 'list' });
  const [editingTask, setEditingTask] = useState<TrainingTask | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');

  useEffect(() => {
    setState(loadTrainingState());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (hydrated.current) saveTrainingState(state);
  }, [state]);

  const courseName = avatarDetail?.courseName || '动力电池管理系统检修';
  const classNames = useMemo(() => {
    const names = (avatarDetail?.classList || []).map((item) => item.className).filter(Boolean);
    return names.length ? names : ['新能源汽车 2401 班', '新能源汽车 2501 班'];
  }, [avatarDetail?.classList]);
  const abilityOptions = useMemo(() => getPublishedAbilityOptions(courseName), [courseName]);

  const summaries = useMemo(() => {
    const map = new Map<string, { total: number; submitted: number; pending: number; reviewed: number; average: number; ability: number }>();
    state.tasks.forEach((task) => {
      const submissions = state.submissions.filter((item) => item.taskId === task.id);
      const submitted = submissions.filter((item) => item.submitStatus !== 'not-submitted');
      const reviewed = submitted.filter((item) => item.review.status === 'reviewed');
      const pending = submitted.filter((item) => item.review.status !== 'reviewed');
      const scores = reviewed.map((item) => reviewTotalScore(task, item.review));
      const abilityScores = reviewed.flatMap((item) => calculateAbilityResults(task, item.review).map((ability) => ability.score));
      map.set(task.id, {
        total: submissions.length,
        submitted: submitted.length,
        pending: pending.length,
        reviewed: reviewed.length,
        average: scores.length ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10 : 0,
        ability: abilityScores.length ? Math.round(abilityScores.reduce((sum, value) => sum + value, 0) / abilityScores.length) : 0
      });
    });
    return map;
  }, [state]);

  const overallStats = useMemo(() => ({
    total: state.tasks.length,
    active: state.tasks.filter((task) => task.status === 'published').length,
    pending: Array.from(summaries.values()).reduce((sum, item) => sum + item.pending, 0),
    reviewed: Array.from(summaries.values()).reduce((sum, item) => sum + item.reviewed, 0)
  }), [state.tasks, summaries]);

  const courses = useMemo(() => Array.from(new Set(state.tasks.map((task) => task.courseName))), [state.tasks]);
  const classes = useMemo(() => Array.from(new Set(state.tasks.flatMap((task) => task.classNames))), [state.tasks]);
  const visibleTasks = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return state.tasks.filter((task) => {
      const summary = summaries.get(task.id);
      const matchesReview = reviewFilter === 'all' || (reviewFilter === 'pending' ? Boolean(summary?.pending) : Boolean(summary?.reviewed));
      return (!text || `${task.title}${task.description}`.toLowerCase().includes(text)) &&
        (courseFilter === 'all' || task.courseName === courseFilter) &&
        (classFilter === 'all' || task.classNames.includes(classFilter)) &&
        (statusFilter === 'all' || task.status === statusFilter) && matchesReview;
    });
  }, [classFilter, courseFilter, keyword, reviewFilter, state.tasks, statusFilter, summaries]);

  const currentTask = view.type === 'list' ? undefined : state.tasks.find((task) => task.id === view.taskId);
  const currentSubmission = view.type === 'review' || view.type === 'ability'
    ? state.submissions.find((item) => item.id === view.submissionId)
    : undefined;

  const handleSaveTask = (task: TrainingTask, status: TrainingTaskStatus) => {
    const exists = state.tasks.some((item) => item.id === task.id);
    setState((previous) => ({
      tasks: exists
        ? previous.tasks.map((item) => item.id === task.id ? task : item)
        : [task, ...previous.tasks],
      submissions: exists
        ? previous.submissions
        : [...previous.submissions, ...createBlankTrainingSubmissions(task, task.classNames.length * 42)]
    }));
    setEditingTask(null);
    toast({ title: status === 'draft' ? '实训任务草稿已保存' : `实训任务「${task.title}」已发布`, status: 'success', position: 'top', duration: 1800 });
  };

  const handleReviewSave = (review: TrainingReview, status: ReviewStatus) => {
    if (!currentSubmission) return;
    setState((previous) => ({
      ...previous,
      submissions: previous.submissions.map((item) => item.id === currentSubmission.id ? { ...item, review: { ...review, status } } : item)
    }));
  };

  if (view.type === 'detail' && currentTask) {
    const submissions = state.submissions.filter((item) => item.taskId === currentTask.id);
    return <TrainingTaskDetail task={currentTask} submissions={submissions} onBack={() => setView({ type: 'list' })} onEdit={() => { setEditingTask(currentTask); editor.onOpen(); }} onGrade={(submission) => setView({ type: 'review', taskId: currentTask.id, submissionId: submission.id })} onAbility={(submission) => setView({ type: 'ability', taskId: currentTask.id, submissionId: submission.id, backTo: 'detail' })} />;
  }

  if (view.type === 'review' && currentTask && currentSubmission) {
    return <TrainingReviewWorkspace task={currentTask} submission={currentSubmission} onBack={() => setView({ type: 'detail', taskId: currentTask.id })} onSave={handleReviewSave} onAbility={() => setView({ type: 'ability', taskId: currentTask.id, submissionId: currentSubmission.id, backTo: 'review' })} />;
  }

  if (view.type === 'ability' && currentTask && currentSubmission) {
    return <StudentAbilityView state={state} task={currentTask} submission={currentSubmission} onBack={() => setView(view.backTo === 'review' ? { type: 'review', taskId: currentTask.id, submissionId: currentSubmission.id } : { type: 'detail', taskId: currentTask.id })} />;
  }

  return (
    <VStack align="stretch" spacing={4}>
      <Box bg="linear-gradient(135deg,#FFF9F8 0%,#FFFFFF 70%)" border="1px solid #F0DADA" borderRadius="20px" p={{ base: 5, md: 6 }} boxShadow="0 8px 28px rgba(31,35,41,.055)">
        <Flex align={{ base: 'stretch', md: 'center' }} justify="space-between" gap={4} direction={{ base: 'column', md: 'row' }}>
          <Box><Badge bg="#FFF1F0" color="#C83E3E" borderRadius="full" px={2.5} py={1} mb={2}>评价驱动能力达成</Badge><Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight={780} color="#1D2129">实训任务与能力评价</Text><Text fontSize="sm" color="#646A73" mt={2}>关联岗位能力图谱，通过评价项批改形成可追溯的学生能力证据。</Text></Box>
          <Button minH="44px" leftIcon={<Plus size={17} />} onClick={() => { setEditingTask(null); editor.onOpen(); }}>创建实训任务</Button>
        </Flex>
      </Box>

      <Grid templateColumns={{ base: 'repeat(2,minmax(0,1fr))', lg: 'repeat(4,minmax(0,1fr))' }} gap={3}>
        <TaskStat label="实训任务" value={overallStats.total} color="#2563EB" icon={ClipboardList} />
        <TaskStat label="进行中" value={overallStats.active} color="#7C3AED" icon={CalendarClock} />
        <TaskStat label="待批改" value={overallStats.pending} color="#C83E3E" icon={UsersRound} />
        <TaskStat label="已批改" value={overallStats.reviewed} color="#059669" icon={BarChart3} />
      </Grid>

      <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" p={4}>
        <Flex gap={2.5} direction={{ base: 'column', md: 'row' }} flexWrap="wrap">
          <Box position="relative" flex={{ md: 1 }} minW={{ md: '220px' }}><Box position="absolute" left="13px" top="12px" color="#86909C"><Search size={16} /></Box><Input h="42px" pl="38px" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索实训任务" /></Box>
          <Select h="42px" w={{ base: '100%', md: '190px' }} value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}><option value="all">全部课程</option>{courses.map((course) => <option key={course} value={course}>{course}</option>)}</Select>
          <Select h="42px" w={{ base: '100%', md: '180px' }} value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="all">全部班级</option>{classes.map((name) => <option key={name} value={name}>{name}</option>)}</Select>
          <Select h="42px" w={{ base: '100%', md: '132px' }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">全部状态</option><option value="published">进行中</option><option value="ended">已结束</option><option value="draft">草稿</option></Select>
          <Select h="42px" w={{ base: '100%', md: '140px' }} value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}><option value="all">全部批改</option><option value="pending">有待批改</option><option value="reviewed">有已批改</option></Select>
        </Flex>
      </Box>

      <VStack align="stretch" spacing={3}>
        {visibleTasks.map((task) => {
          const summary = summaries.get(task.id) ?? { total: 0, submitted: 0, pending: 0, reviewed: 0, average: 0, ability: 0 };
          const meta = taskMeta[task.status];
          const versionStale = task.abilities.some((ability) => {
            const current = abilityOptions.find((option) => option.graphId === ability.graphId && option.abilityCode === ability.abilityCode);
            return current && current.graphVersion !== ability.graphVersion;
          });
          return (
            <Box key={task.id} bg="white" border="1px solid #E5E6EB" borderRadius="20px" p={{ base: 4, md: 5 }} boxShadow="0 8px 26px rgba(31,35,41,.05)" transition="all .16s ease" _hover={{ transform: 'translateY(-2px)', boxShadow: '0 13px 32px rgba(31,35,41,.09)' }}>
              <Flex gap={4} direction={{ base: 'column', lg: 'row' }} align={{ lg: 'center' }}>
                <Box flex={1} minW={0}>
                  <Flex gap={2} flexWrap="wrap" align="center" mb={2}><Badge bg={meta.bg} color={meta.color} borderRadius="full" px={2.5}>{meta.label}</Badge>{versionStale ? <Badge bg="#FFFBEB" color="#D97706" borderRadius="full">能力图谱有新版本</Badge> : null}<Text fontSize="lg" fontWeight={750} color="#1D2129">{task.title}</Text></Flex>
                  <Text fontSize="sm" color="#646A73" noOfLines={2} lineHeight="1.7">{task.description}</Text>
                  <Flex gap={2} flexWrap="wrap" mt={3}>{task.abilities.map((ability) => <Badge key={`${task.id}-${ability.abilityCode}`} bg="#F5F3FF" color="#7C3AED" borderRadius="full" px={2}>{ability.abilityCode} {ability.abilityName}</Badge>)}</Flex>
                  <Flex gap={{ base: 3, md: 5 }} flexWrap="wrap" mt={3} fontSize="xs" color="#86909C"><Text>{task.classNames.join('、')}</Text><Text>截止 {task.deadline.replace('T', ' ')}</Text><Text>{task.rubrics.length} 个评价项</Text></Flex>
                </Box>
                <Grid templateColumns="repeat(4,minmax(64px,1fr))" gap={2} w={{ base: '100%', lg: '390px' }}>
                  <Box p={3} bg="#F7F8FA" borderRadius="12px" textAlign="center"><Text fontSize="lg" fontWeight={750}>{summary.submitted}/{summary.total}</Text><Text fontSize="10px" color="#86909C">已提交</Text></Box>
                  <Box p={3} bg="#FFF7F7" borderRadius="12px" textAlign="center"><Text fontSize="lg" fontWeight={750} color="#C83E3E">{summary.pending}</Text><Text fontSize="10px" color="#86909C">待批改</Text></Box>
                  <Box p={3} bg="#F7F8FA" borderRadius="12px" textAlign="center"><Text fontSize="lg" fontWeight={750}>{summary.average || '--'}</Text><Text fontSize="10px" color="#86909C">平均分</Text></Box>
                  <Box p={3} bg="#F0FDF4" borderRadius="12px" textAlign="center"><Text fontSize="lg" fontWeight={750} color="#059669">{summary.ability ? `${summary.ability}%` : '--'}</Text><Text fontSize="10px" color="#86909C">能力达成</Text></Box>
                </Grid>
                <Flex gap={2} flexWrap="wrap" justify={{ lg: 'flex-end' }} w={{ lg: '218px' }}>
                  <Button variant="secondary" leftIcon={<Eye size={15} />} onClick={() => setView({ type: 'detail', taskId: task.id })}>查看详情</Button>
                  {task.status === 'draft' ? <Button onClick={() => setState((previous) => ({ ...previous, tasks: previous.tasks.map((item) => item.id === task.id ? { ...item, status: 'published' } : item) }))}>发布</Button> : null}
                  <Button aria-label={`编辑 ${task.title}`} variant="tertiary" minW="38px" px={0} leftIcon={<Pencil size={15} />} onClick={() => { setEditingTask(task); editor.onOpen(); }} />
                  <Button aria-label={`删除 ${task.title}`} variant="tertiary" minW="38px" px={0} color="#86909C" leftIcon={<Trash2 size={15} />} onClick={() => { setDeletingId(task.id); deleteDialog.onOpen(); }} />
                </Flex>
              </Flex>
              {task.status !== 'draft' ? <Progress mt={4} value={summary.total ? summary.reviewed / summary.total * 100 : 0} size="xs" colorScheme="green" borderRadius="full" /> : null}
            </Box>
          );
        })}
        {visibleTasks.length === 0 ? <Box bg="white" border="1px solid #E5E6EB" borderRadius="18px" py={12} textAlign="center"><ClipboardList size={34} color="#C9CDD4" /><Text mt={3} color="#86909C">没有符合条件的实训任务</Text></Box> : null}
      </VStack>

      <TrainingTaskEditorModal isOpen={editor.isOpen} onClose={() => { editor.onClose(); setEditingTask(null); }} editingTask={editingTask} courseName={courseName} classNames={classNames} abilityOptions={abilityOptions} onSave={handleSaveTask} />

      <AlertDialog isOpen={deleteDialog.isOpen} leastDestructiveRef={cancelRef} onClose={deleteDialog.onClose} isCentered>
        <AlertDialogOverlay bg="rgba(17,24,39,.58)"><AlertDialogContent mx={3} borderRadius="18px"><AlertDialogHeader fontSize="md" fontWeight={750} pb={2}>删除实训任务</AlertDialogHeader><AlertDialogBody color="#646A73" fontSize="sm">删除后，该任务的学生提交、批改结果和能力证据也将从当前原型中移除。</AlertDialogBody><AlertDialogFooter gap={3} pt={4}><Button ref={cancelRef} variant="secondary" onClick={deleteDialog.onClose}>取消</Button><Button variant="dangerSolid" onClick={() => { if (!deletingId) return; setState((previous) => ({ tasks: previous.tasks.filter((task) => task.id !== deletingId), submissions: previous.submissions.filter((item) => item.taskId !== deletingId) })); setDeletingId(null); deleteDialog.onClose(); toast({ title: '实训任务已删除', status: 'success', position: 'top', duration: 1600 }); }}>确认删除</Button></AlertDialogFooter></AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}

