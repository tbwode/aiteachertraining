import Providers from './components/Providers';

export const metadata = {
  title: '高职校教学平台 - 教师端',
  description: '高职校 SaaS 教学平台教师端'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
