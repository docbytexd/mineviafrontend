import { connectDB } from '@/lib/db/connect';
import { getGeneralSettings } from '@/lib/db/models/settings/GeneralSettings';
import { News } from '@/lib/db/models/content/News';
import { User } from '@/lib/db/models/User';
import { GameMode } from '@/lib/db/models/content/GameMode';
import PirateLanding from '@/components/home/PirateLanding';
import '@/lib/db/models/content/NewsCategory';

interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt: string | Date;
}

async function getDiscordMembers(url: string) {
  const code = (url || '').split('discord.gg/')[1]?.split(/[?#/]/)[0] || (url || '').split('discord.com/invite/')[1]?.split(/[?#/]/)[0];
  if (!code) return 0;
  try {
    const res = await fetch('https://discord.com/api/v10/invites/' + code + '?with_counts=true', { next: { revalidate: 300 } });
    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data?.approximate_member_count) || 0;
  } catch {
    return 0;
  }
}
async function getOnline(ip: string) {
  if (!ip) return 0;
  try {
    const res = await fetch('https://api.mcsrvstat.us/2/' + encodeURIComponent(ip), { next: { revalidate: 60 } });
    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data?.players?.online) || 0;
  } catch {
    return 0;
  }
}

export default async function HomePage() {
  await connectDB();
  const [settings, newsItems, modes] = await Promise.all([
    getGeneralSettings(),
    News.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(3)
      .select('title slug excerpt coverImage publishedAt')
      .lean<NewsItem[]>(),
    GameMode.find({ active: true }).sort({ order: 1 }).select('name slug shortDescription coverImage').lean(),
  ]);
  const [online, registered, discordMembers] = await Promise.all([
    getOnline(settings.serverIp || ''),
    User.countDocuments(),
    getDiscordMembers(settings.discord || ''),
  ]);

  return (
    <PirateLanding
      serverName={settings.serverName || ''}
      serverIp={settings.serverIp || ''}
      discord={settings.discord || ''}
      logo={settings.logo1 || ''}
      about={settings.about || settings.slogan || ''}
      version={settings.serverVersion || ''}
      online={online}
        registered={registered}
        discordMembers={discordMembers}
      news={JSON.parse(JSON.stringify(newsItems))}
        modes={JSON.parse(JSON.stringify(modes))}
    />
  );
}
