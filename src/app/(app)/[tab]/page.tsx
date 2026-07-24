import { notFound } from 'next/navigation';
import { isActiveTab } from '@/lib/nav';
import { TabView } from '@/components/TabView';

interface TabPageProps {
  params: Promise<{ tab: string }>;
}

export default async function TabPage({ params }: TabPageProps) {
  const { tab } = await params;

  if (!isActiveTab(tab)) {
    notFound();
  }

  return <TabView tab={tab} />;
}
