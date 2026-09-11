'use client';

import { useCallback, useMemo, useState } from 'react';
import { Grid, useToast, VStack } from '@chakra-ui/react';
import SubBar from './SubBar';
import ProgressCard from './ProgressCard';
import KnowledgeTreePanel from './KnowledgeTreePanel';
import AbilityTreePanel from './AbilityTreePanel';
import MappingList, { countByTab, type MappingTab } from './MappingList';
import { initialMappings, type Mapping, type MappingStatus, type Mastery } from '../mockData';

export default function Workbench() {
  const toast = useToast();
  const [mappings, setMappings] = useState<Mapping[]>(initialMappings);
  const [activeTab, setActiveTab] = useState<MappingTab>('pending');
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(null);
  const [abilityFilter, setAbilityFilter] = useState<string | null>(null);

  const patchMapping = useCallback((id: string, patch: Partial<Mapping>) => {
    setMappings((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const statusByKnowledgeId = useMemo(() => {
    const map: Record<string, MappingStatus> = {};
    mappings.forEach((m) => {
      map[m.knowledgeId] = m.status;
    });
    return map;
  }, [mappings]);

  const refCountByCode = useMemo(() => {
    const counts: Record<string, number> = {};
    mappings.forEach((m) => {
      if (m.status !== 'rejected') {
        counts[m.abilityCode] = (counts[m.abilityCode] ?? 0) + 1;
      }
    });
    return counts;
  }, [mappings]);

  const counts = countByTab(mappings);
  const summary = {
    total: mappings.length,
    pending: counts.pending,
    confirmed: counts.confirmed,
    rejected: counts.rejected
  };

  const handleConfirm = useCallback(
    (id: string) => {
      patchMapping(id, { status: 'confirmed' });
      toast({ title: '已确认该映射', status: 'success', duration: 1500, position: 'top', isClosable: true });
    },
    [patchMapping, toast]
  );

  const handleReject = useCallback(
    (id: string, reason: string) => {
      patchMapping(id, { status: 'rejected', rejectReason: reason });
      toast({ title: '已驳回，原因将用于 AI 校准', status: 'info', duration: 2000, position: 'top', isClosable: true });
    },
    [patchMapping, toast]
  );

  const handleUndo = useCallback(
    (id: string) => {
      patchMapping(id, { status: 'pending', rejectReason: undefined });
      setActiveTab('pending');
    },
    [patchMapping]
  );

  const handleMasteryChange = useCallback(
    (id: string, mastery: Mastery) => patchMapping(id, { mastery }),
    [patchMapping]
  );

  const handleWeightChange = useCallback(
    (id: string, weight: number) => patchMapping(id, { weight }),
    [patchMapping]
  );

  const handleRebind = useCallback(
    (id: string) => {
      const target = mappings.find((m) => m.id === id);
      const suggestion = target?.governance;
      if (!suggestion) return;
      patchMapping(id, {
        abilityCode: suggestion.suggestedCode,
        abilityName: suggestion.suggestedName,
        confidence: suggestion.suggestedConfidence,
        governance: undefined,
        rebound: true,
        status: 'confirmed'
      });
      toast({
        title: `已改绑至 ${suggestion.suggestedCode} ${suggestion.suggestedName}`,
        description: '该映射已按治理建议自动确认，可在「已确认」页签撤销。',
        status: 'success',
        duration: 2500,
        position: 'top',
        isClosable: true
      });
    },
    [mappings, patchMapping, toast]
  );

  const handleIgnoreGovernance = useCallback(
    (id: string) => {
      const target = mappings.find((m) => m.id === id);
      if (!target?.governance) return;
      patchMapping(id, { governance: { ...target.governance, ignored: true } });
      toast({ title: '已忽略改绑建议', status: 'info', duration: 1500, position: 'top', isClosable: true });
    },
    [mappings, patchMapping, toast]
  );

  const handleBatchConfirm = useCallback(() => {
    const targets = mappings.filter((m) => m.status === 'pending' && m.confidence >= 0.9);
    if (targets.length === 0) return;
    setMappings((prev) =>
      prev.map((m) => (m.status === 'pending' && m.confidence >= 0.9 ? { ...m, status: 'confirmed' } : m))
    );
    toast({
      title: `已批量确认 ${targets.length} 条高置信度映射`,
      status: 'success',
      duration: 2000,
      position: 'top',
      isClosable: true
    });
  }, [mappings, toast]);

  const handleSelectKnowledge = useCallback(
    (knowledgeId: string) => {
      setSelectedKnowledgeId(knowledgeId);
      setAbilityFilter(null);
      const target = mappings.find((m) => m.knowledgeId === knowledgeId);
      if (!target) return;
      if (target.status === 'pending') {
        setActiveTab(target.governance && !target.governance.ignored ? 'governance' : 'pending');
      } else {
        setActiveTab(target.status);
      }
    },
    [mappings]
  );

  const handleDemoAction = useCallback(
    (title: string) => {
      toast({
        title,
        description: '原型演示环境，该操作不会真实执行。',
        status: 'info',
        duration: 2000,
        position: 'top',
        isClosable: true
      });
    },
    [toast]
  );

  return (
    <VStack align="stretch" spacing={3.5}>
      <SubBar
        highConfCount={counts.high}
        onBatchConfirm={handleBatchConfirm}
        onRetag={() => handleDemoAction('已触发重新打标')}
        onExport={() => handleDemoAction('已导出映射表')}
      />

      <ProgressCard {...summary} />

      <Grid templateColumns="260px minmax(0, 1fr) 260px" gap={3.5} alignItems="start">
        <KnowledgeTreePanel
          statusByKnowledgeId={statusByKnowledgeId}
          selectedKnowledgeId={selectedKnowledgeId}
          onSelectKnowledge={handleSelectKnowledge}
        />
        <MappingList
          mappings={mappings}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          abilityFilter={abilityFilter}
          onClearAbilityFilter={() => setAbilityFilter(null)}
          highlightKnowledgeId={selectedKnowledgeId}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onUndo={handleUndo}
          onMasteryChange={handleMasteryChange}
          onWeightChange={handleWeightChange}
          onRebind={handleRebind}
          onIgnoreGovernance={handleIgnoreGovernance}
        />
        <AbilityTreePanel
          refCountByCode={refCountByCode}
          selectedCode={abilityFilter}
          onSelect={setAbilityFilter}
        />
      </Grid>
    </VStack>
  );
}
