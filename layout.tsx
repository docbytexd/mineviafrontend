import type { Metadata } from 'next';
import './globals.css';
import { connectDB } from '@/lib/db/connect';
import { getGeneralSettings } from '@/lib/db/models/settings/GeneralSettings';
import { SiteTheme } from '@/lib/db/models/SiteTheme';
import DevToolsGuard from '@/components/DevToolsGuard';

export const dynamic = 'force-dynamic';

function withCacheBust(url: string, version: string | number | Date | undefined) {
  if (!url) return url;
  const v = version instanceof Date ? version.getTime() : version || Date.now();
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${v}`;
}

export async function generateMetadata(): Promise<Metadata> {
  let favicon = '';
  let siteUrl = '';
  let serverName = 'Areofy';
  let slogan = '';
  let updatedAt: Date | undefined;
  let ogImage = '';
  try {
    await connectDB();
    const theme = await SiteTheme.findOne().lean();
    ogImage = theme?.images?.ogImage || '';
    const settings = await getGeneralSettings();
    favicon = settings.favicon || '';
    siteUrl = settings.siteUrl || '';
    if (settings.serverName) serverName = settings.serverName;
    if (settings.slogan) slogan = settings.slogan;
    updatedAt = settings.updatedAt;
  } catch {
  }
  let metadataBase: URL | undefined;
  if (siteUrl) {
    try {
      metadataBase = new URL(siteUrl);
    } catch {
    }
  }
  const pageTitle = slogan ? `${serverName} · ${slogan}` : serverName;
  const iconHref = favicon ? withCacheBust(favicon, updatedAt) : '/icon';
  const isIco = /\.ico(\?|$)/i.test(favicon);
  return {
    title: {
      default: pageTitle,
      template: `%s · ${serverName}`,
    },
    description: slogan || 'Minecraft Sunucu CMS',
    ...(metadataBase ? { metadataBase } : {}),
    openGraph: {
      title: pageTitle,
      description: slogan || 'Minecraft Sunucu CMS',
      siteName: serverName,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: 'summary_large_image', title: pageTitle, description: slogan || 'Minecraft Sunucu CMS', ...(ogImage ? { images: [ogImage] } : {}) },
    icons: {
      icon: [
        { url: '/icon', type: 'image/png' },
        { url: iconHref, type: isIco ? 'image/x-icon' : 'image/png' },
      ],
      shortcut: iconHref,
      apple: iconHref,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preload" as="image" href="/mp/assets_static_icons_logo.png" fetchPriority="high" />
      <link rel="preload" as="image" href="/mp/assets_static_npcs_merry.png" />
      <link rel="preload" as="image" href="/mp/assets_static_npcs_luffy.png" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Rubik, ui-sans-serif, system-ui, sans-serif' }}>
        {children}
        <DevToolsGuard />
      </body>
    </html>
  );
}
