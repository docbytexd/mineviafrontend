'use client';
import { useState, useEffect } from 'react';
import { ExternalLink, Star, Clock } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
interface VoteSite {
  id: string;
  name: string;
  url: string;
  image: string;
  cooldownHours: number;
}
export default function VotePage() {
  const { t } = useSiteLang();
  const [sites, setSites] = useState<VoteSite[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/public/vote')
      .then((r) => r.json())
      .then((d) => { if (d.sites) setSites(d.sites); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] pb-16">
      <PageHero
        badge={t('vote.badge', 'Oy Ver')}
        title={t('vote.title', 'Sunucuya Oy Ver')}
        description={t('vote.desc', 'Aşağıdaki sitelerde oy vererek sunucunun büyümesine katkıda bulun.')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('vote.badge', 'Oy Ver') }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {sites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <Star size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{t('vote.empty', 'Henüz oy sitesi yok')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sites.map((site, i) => (
              <a
                key={site.id}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50">
                  {site.image ? (
                    <img src={site.image} alt={site.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <Star size={24} className="text-orange-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-300">#{i + 1}</span>
                    <h3 className="font-black text-[#632811] group-hover:text-orange-500 transition-colors truncate">
                      {site.name}
                    </h3>
                  </div>
                  {site.cooldownHours > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#8c502e]/80">
                      <Clock size={11} />
                      {t('vote.cooldown', 'Her {hours} saatte bir oy verebilirsiniz', { hours: site.cooldownHours })}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white transition-colors group-hover:bg-orange-600">
                  {t('vote.cta', 'Oy Ver')} <ExternalLink size={12} />
                </div>
              </a>
            ))}
          </div>
        )}
        <div className="mt-8 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-center">
          <Star size={24} className="mx-auto mb-2 text-orange-400" />
          <p className="font-bold text-[#632811]">{t('vote.thanks', 'Her oy sunucumuzun büyümesine katkı sağlar!')}</p>
          <p className="mt-1 text-sm text-[#8c502e]">{t('vote.thanks_desc', 'Oy vererek daha fazla oyuncunun sunucumuzu keşfetmesine yardımcı ol.')}</p>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}