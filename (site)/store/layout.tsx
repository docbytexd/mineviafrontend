import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('shop');
  if (!enabled) notFound();
  return <>{children}</>;
}