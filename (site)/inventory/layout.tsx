import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
import { requireLogin } from '@/lib/auth/requireLogin';

export default async function InventoryLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('inventory');
  if (!enabled) notFound();
  await requireLogin('/inventory');
  return <>{children}</>;
}
