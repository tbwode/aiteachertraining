import type { Metadata } from 'next';
import AiWizardClient from './AiWizardClient';

export const metadata: Metadata = {
  title: 'AI 生成岗位能力图谱'
};

export default function Page() {
  return <AiWizardClient />;
}
