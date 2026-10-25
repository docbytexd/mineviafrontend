import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function GamingNightLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('gaming_night');
  if (!enabled) notFound();
  return <>{children}</>;
}