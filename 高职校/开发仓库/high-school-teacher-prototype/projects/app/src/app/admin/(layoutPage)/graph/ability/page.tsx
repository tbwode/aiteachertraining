import type { Metadata } from 'next';
import TalentTrainingPrototypeFrame from '@/app/admin/components/TalentTrainingPrototypeFrame';

export const metadata: Metadata = {
  title: '岗位能力图谱 | 管理端',
  description: '校级岗位能力图谱资产管理，支持 AI 生成、版本管理与发布。'
};

export default function AbilityGraphPage() {
  return (
    <TalentTrainingPrototypeFrame initialView="abilitygraph" title="岗位能力图谱完整交互原型" />
  );
}
