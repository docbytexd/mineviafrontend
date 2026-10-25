import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
import { requireLogin } from '@/lib/auth/requireLogin';

export const dynamic = 'force-dynamic';

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('support');
  if (!enabled) notFound();
  await requireLogin('/support');
  return <>{children}</>;
}
