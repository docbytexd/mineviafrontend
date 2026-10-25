import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('events');
  if (!enabled) notFound();
  return <>{children}</>;
}