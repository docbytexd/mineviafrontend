import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('applications');
  if (!enabled) notFound();
  return <>{children}</>;
}