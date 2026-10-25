import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function GameModesLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('game_modes');
  if (!enabled) notFound();
  return <>{children}</>;
}