import type { Metadata } from 'next';
import TalentTrainingPrototypeFrame from '@/app/admin/components/TalentTrainingPrototypeFrame';

export const metadata: Metadata = {
  title: '人培方案管理 | 管理端',
  description: '人才培养方案编制、岗位对标、课程映射、论证与质量改进。'
};

export default function TrainingProgramsPage() {
  return <TalentTrainingPrototypeFrame initialView="dashboard" title="人培方案管理完整交互原型" />;
}
