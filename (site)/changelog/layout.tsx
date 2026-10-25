import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function ChangelogLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('changelog');
  if (!enabled) notFound();
  return <>{children}</>;
}