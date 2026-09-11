import Providers from './components/Providers';

export const metadata = {
  title: '高职校教学平台 - 管理端',
  description: '高职校 SaaS 教学平台管理端'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
