import type { Metadata } from 'next';
import { Xray } from '@stinsky/xray';
import { AuthProvider } from './components/auth';
import { GuardProvider } from './components/auth/GuardProvider';
import '@/web/styles/reset.scss';
import { MockPrototypeBanner } from '@/mocks/MockPrototypeBanner';
import { isMockMode } from '@/mocks/engine';

export const metadata: Metadata = {
  title: process.env.SYSTEM_TITLE || '高职校SaaS平台',
  description: process.env.SYSTEM_DESCRIPTION || '高中 AI 教学平台'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <GuardProvider>{children}</GuardProvider>
        </AuthProvider>
        <MockPrototypeBanner />
        {!isMockMode && <Xray />}
      </body>
    </html>
  );
}
