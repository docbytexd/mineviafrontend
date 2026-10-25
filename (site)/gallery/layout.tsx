import { notFound } from 'next/navigation';
import { isModuleEnabled } from '@/lib/modules/getEnabledModules';
export default async function GalleryLayout({ children }: { children: React.ReactNode }) {
  const enabled = await isModuleEnabled('gallery');
  if (!enabled) notFound();
  return <>{children}</>;
}