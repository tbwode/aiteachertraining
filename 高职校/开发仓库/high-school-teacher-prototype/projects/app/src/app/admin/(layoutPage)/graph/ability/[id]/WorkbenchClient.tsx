'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  Skeleton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { AdminIcon } from '@/app/admin/components/AdminIcon';
import {
  createDraftGraph,
  getGraph,
  nextTaskCode,
  saveGraph,
  withAiRegenerated,
  withTaskAdded
} from '../_mock/store';
import type { AbilityGraph } from '../_mock/types';
import WorkbenchHeader from './components/WorkbenchHeader';
import GraphOverviewTab from './components/GraphOverviewTab';
import StructureTab from './components/StructureTab';
import VersionsTab from './components/VersionsTab';
import ImpactTab from './components/ImpactTab';
import PublishModal from './components/PublishModal';

const ACCENT = '#C8000B';

const TABS = ['visual', 'structure', 'versions', 'impact'] as const;
type TabKey = (typeof TABS)[number];

const emptyDraft: AbilityGraph = {
  id: '',
  jobName: '',
  majorDirection: '',
  status: 'draft',
  currentVersion: '',
  tasks: [],
  versions: [],
  linkedCourses: [],
  sourceDocs: [],
  updatedAt: ''
};

export default function WorkbenchClient({
  graphId,
  createMode
}: {
  graphId?: string;
  createMode?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const publishModal = useDisclosure();
  const aiConfirm = useDisclosure();
  const aiCancelRef = useRef<HTMLButtonElement>(null);

  const [mounted, setMounted] = useState(false);
  const [graph, setGraph] = useState<AbilityGraph | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    if (createMode) {
      setGraph({ ...emptyDraft });
    } else {
      const found = graphId ? getGraph(graphId) : null;
      if (found) setGraph(found);
      else setNotFound(true);
    }
    setMounted(true);
  }, [createMode, graphId]);

  const tabParam = searchParams.get('tab') as TabKey | null;
  const tab: TabKey = tabParam && TABS.includes(tabParam) ? tabParam : 'visual';
  const tabIndex = TABS.indexOf(tab);

  const switchTab = (next: TabKey) => {
    if (!graph) return;
    const base = createMode ? '/admin/graph/ability/new' : `/admin/graph/ability/${graph.id}`;
    router.replace(next === 'visual' ? base : `${base}?tab=${next}`);
  };

  const mutate = (fn: (g: AbilityGraph) => AbilityGraph) => {
    setGraph((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      if (!createMode && next !== prev) saveGraph(next);
      return next;
    });
  };

  const addTask = (name: string) => {
    if (!graph) return;
    if (createMode) {
      if (!graph.jobName.trim()) {
        toast({
          title: '请先填写岗位名称',
          status: 'warning',
          duration: 2000,
          position: 'top'
        });
        return;
      }
      const created = createDraftGraph({
        jobName: graph.jobName.trim(),
        majorDirection: graph.majorDirection || '新能源汽车技术',
        sourceDocs: [],
        buildTasks: (id) => [
          { id: `${id}-A`, code: 'A', name, description: '', status: 'new', abilities: [] }
        ]
      });
      toast({
        title: '草稿图谱已创建',
        description: `「${created.jobName}」已进入图谱列表，可继续完善能力结构。`,
        status: 'success',
        duration: 2500,
        position: 'top'
      });
      router.replace(`/admin/graph/ability/${created.id}`);
      return;
    }
    const code = nextTaskCode(graph.tasks);
    mutate((g) => withTaskAdded(g, name));
    setSelectedCode(code);
  };

  const handleAiRegenerate = () => {
    mutate(withAiRegenerated);
    setSelectedCode(null);
    aiConfirm.onClose();
    toast({
      title: 'AI 已重新生成草稿树',
      description: '已依据岗位说明书重新生成，请复核后发布。',
      status: 'success',
      duration: 2500,
      position: 'top'
    });
  };

  const handleLocate = (abilityCode: string) => {
    setSelectedCode(abilityCode);
    switchTab('structure');
  };

  const handlePublished = (next: AbilityGraph) => {
    setGraph(next);
    saveGraph(next);
    setSelectedCode(null);
    toast({
      title: `${next.currentVersion} 发布成功`,
      description: '新版本已生效，可供课程映射与测评业务调用。',
      status: 'success',
      duration: 3000,
      position: 'top'
    });
    switchTab('versions');
  };

  if (!mounted) {
    return (
      <Stack spacing={4}>
        <Skeleton h="56px" rounded="16px" />
        <Skeleton h="480px" rounded="20px" />
      </Stack>
    );
  }

  if (notFound || !graph) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        py={24}
        gap={3}
        bg="white"
        rounded="24px"
        borderWidth="1px"
        borderColor="blackAlpha.100"
      >
        <AdminIcon name="folder-open" style={{ width: 32, height: 32, color: '#CBD5E0' }} />
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          图谱不存在或已被移除
        </Text>
        <Text fontSize="sm" color="gray.400">
          原型数据为内存态，刷新页面后动态创建的图谱会被还原
        </Text>
        <Button
          mt={2}
          bg={ACCENT}
          color="white"
          rounded="12px"
          _hover={{ bg: '#A80009' }}
          onClick={() => router.push('/admin/graph/ability')}
        >
          返回图谱列表
        </Button>
      </Flex>
    );
  }

  return (
    <Stack spacing={5}>
      <WorkbenchHeader
        graph={graph}
        createMode={createMode}
        onPublishClick={publishModal.onOpen}
        onAiRegenerate={aiConfirm.onOpen}
        onMetaChange={(patch) =>
          setGraph((prev) => (prev ? { ...prev, ...patch } : prev))
        }
      />

      {createMode ? (
        <StructureTab
          graph={graph}
          selectedCode={selectedCode}
          onSelect={setSelectedCode}
          mutate={mutate}
          addTask={addTask}
          createMode
        />
      ) : (
        <Box bg="white" rounded="24px" borderWidth="1px" borderColor="blackAlpha.100" p={4}>
          <Tabs
            index={tabIndex}
            onChange={(index) => switchTab(TABS[index])}
            variant="unstyled"
          >
            <TabList borderBottom="1px solid" borderColor="gray.100" px={2}>
              {[
                { key: 'visual', label: '图谱概览' },
                { key: 'structure', label: '能力结构' },
                { key: 'versions', label: '版本记录' },
                { key: 'impact', label: '影响分析' }
              ].map((item) => (
                <Tab
                  key={item.key}
                  fontWeight="semibold"
                  color="gray.500"
                  _selected={{ color: ACCENT, boxShadow: `inset 0 -2px 0 ${ACCENT}` }}
                  px={4}
                  py={3}
                >
                  {item.label}
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              <TabPanel px={0} pb={0} pt={4}>
                <GraphOverviewTab graph={graph} />
              </TabPanel>
              <TabPanel px={0} pb={0} pt={4}>
                <StructureTab
                  graph={graph}
                  selectedCode={selectedCode}
                  onSelect={setSelectedCode}
                  mutate={mutate}
                  addTask={addTask}
                />
              </TabPanel>
              <TabPanel px={0} pb={0} pt={4}>
                <VersionsTab graph={graph} />
              </TabPanel>
              <TabPanel px={0} pb={0} pt={4}>
                <ImpactTab graph={graph} mutate={mutate} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      )}

      {!createMode && (
        <>
          <PublishModal
            isOpen={publishModal.isOpen}
            onClose={publishModal.onClose}
            graph={graph}
            onLocate={(code) => {
              publishModal.onClose();
              handleLocate(code);
            }}
            onGoImpact={() => {
              publishModal.onClose();
              switchTab('impact');
            }}
            onPublished={handlePublished}
          />
          <AlertDialog
            isOpen={aiConfirm.isOpen}
            leastDestructiveRef={aiCancelRef}
            onClose={aiConfirm.onClose}
            isCentered
          >
            <AlertDialogOverlay />
            <AlertDialogContent rounded="20px">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                AI 重新生成
              </AlertDialogHeader>
              <AlertDialogBody>
                将依据该图谱的岗位说明书重新生成能力结构，并覆盖当前草稿树（历史发布版本不受影响）。确认继续？
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={aiCancelRef} onClick={aiConfirm.onClose} rounded="10px">
                  取消
                </Button>
                <Button
                  bg={ACCENT}
                  color="white"
                  _hover={{ bg: '#A80009' }}
                  ml={3}
                  rounded="10px"
                  onClick={handleAiRegenerate}
                >
                  确认重新生成
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </Stack>
  );
}
