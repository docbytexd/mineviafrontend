import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function VoteLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('vote');
  if (!enabled) notFound();
  return <>{children}</>;
}