import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function LeaderboardsLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('leaderboard');
  if (!enabled) notFound();
  return <>{children}</>;
}