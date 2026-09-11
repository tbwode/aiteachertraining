import type { Metadata } from 'next';
import Providers from './components/Providers';

export const metadata: Metadata = {
  title: '学习平台'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
