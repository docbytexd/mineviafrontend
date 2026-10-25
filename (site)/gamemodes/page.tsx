'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, ArrowRight } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
interface GameMode {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  coverImage: string;
  serverIp: string;
}
interface SiteSettings {
  serverName: string;
}
export default function GameModesPage() {
  const { t } = useSiteLang();
  const [modes, setModes] = useState<GameMode[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({ serverName: '' });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([
      fetch('/api/public/gamemodes').then((r) => r.json()),
      fetch('/api/public/settings').then((r) => r.json()),
    ]).then(([gm, s]) => {
      if (gm.modes) setModes(gm.modes);
      if (s.serverName) setSettings({ serverName: s.serverName });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div style={{ backgroundColor: '#0f0c29', minHeight: '100vh' }}>
      <PageHero
        badge={settings.serverName || 'Oyun Modları'}
        title={t('gamemodes.title', 'Oyun Modları')}
        description={`${settings.serverName ? `${settings.serverName}'da ` : ''}${modes.length} farklı oyun moduyla maceraya atıl!`}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('gamemodes.title', 'Oyun Modları') }]}
        align="center"
      />
      <div className="mx-auto max-w-5xl px-4 py-12">
        {modes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Gamepad2 size={48} className="mb-4 text-white/20" />
            <p className="font-bold text-white/40">{t('gamemodes.empty', 'Henüz oyun modu yok')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {modes.map((mode) => (
              <Link
                key={mode.id}
                href={`/gamemodes/${mode.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10"
                style={{ backgroundColor: '#1a1530' }}
              >
                <div className="relative h-36 overflow-hidden">
                  {mode.coverImage ? (
                    <img src={mode.coverImage} alt={mode.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: '#2a2040' }}>
                      <Gamepad2 size={40} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-black uppercase tracking-wide text-white group-hover:text-orange-400 transition-colors">
                    {mode.name}
                  </h3>
                  {mode.shortDescription && (
                    <p className="mt-1 line-clamp-2 text-xs text-white/50">{mode.shortDescription}</p>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs font-bold text-orange-400 opacity-0 transition-opacity group-hover:opacity-100">
                    {t('gamemodes.details', 'Detaylar')} <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}