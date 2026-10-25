import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function SuggestionsLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('suggestions');
  if (!enabled) notFound();
  return <>{children}</>;
}