import { Suspense } from 'react';
import WorkbenchClient from './WorkbenchClient';

// 静态导出要求动态段先生成参数；运行时新建的图谱从 g101 起递增，预留 g101-g130。
export function generateStaticParams() {
  const seedIds = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9'];
  const runtimeIds = Array.from({ length: 30 }, (_, i) => `g${101 + i}`);
  return [...seedIds, ...runtimeIds].map((id) => ({ id }));
}

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={null}>
      <WorkbenchClient graphId={params.id} />
    </Suspense>
  );
}
