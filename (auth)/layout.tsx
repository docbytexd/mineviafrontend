import TitleSync from '@/components/TitleSync';
import SiteLangRoot from '@/components/SiteLangRoot';

import { connectDB } from '@/lib/db/connect';
import { getGeneralSettings } from '@/lib/db/models/settings/GeneralSettings';

export async function generateMetadata() {
  let serverName = 'Minevia';
  try {
    await connectDB();
    const s = await getGeneralSettings();
    if (s.serverName) serverName = s.serverName;
  } catch {}
  return { title: { absolute: serverName }, robots: { index: false, follow: false } };
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteLangRoot>
      <TitleSync />
      {children}
    </SiteLangRoot>
  );
}