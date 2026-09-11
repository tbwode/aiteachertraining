import { Suspense } from 'react';
import WorkbenchClient from '../[id]/WorkbenchClient';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WorkbenchClient createMode />
    </Suspense>
  );
}
