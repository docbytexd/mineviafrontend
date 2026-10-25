'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, RefreshCw } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
interface LeaderboardEntry {
  rank: number;
  playerName: string;
  uuid: string;
  value: number;
  avatar: string;
}
interface Leaderboard {
  id: string;
  title: string;
  category: string;
  description: string;
  valueLabel: string;
  valueFormat: 'number' | 'time' | 'money';
  limit: number;
  showAvatar: boolean;
  active: boolean;
}
function formatValue(value: number, format: 'number' | 'time' | 'money') {
  if (format === 'money') {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
  }
  if (format === 'time') {
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    const s = value % 60;
    if (h > 0) return `${h}s ${m}d`;
    if (m > 0) return `${m}d ${s}sn`;
    return `${s}sn`;
  }
  return new Intl.NumberFormat('tr-TR').format(value);
}
const MEDALS = ['🥇', '🥈', '🥉'];
function LeaderboardCard({ lb }: { lb: Leaderboard }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`/api/leaderboards/${lb.id}/entries`)
      .then((r) => r.json())
      .then((d) => {
        if (d.entries) setEntries(d.entries);
        else setError(d.error || 'Veri alinamadi.');
        setLoading(false);
      })
      .catch(() => { setError('Baglanti hatasi.'); setLoading(false); });
  }, [lb.id]);
  return (
    <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#d88a67] px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
          <Trophy size={18} className="text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#632811] truncate">{lb.title}</h3>
          {lb.description && (
            <p className="text-xs text-[#8c502e]/80 truncate">{lb.description}</p>
          )}
        </div>
      </div>
      <div className="p-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-[#8c502e]/80">{error}</p>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#8c502e]/80">Veri bulunamadi.</p>
        ) : (
          <div className="space-y-1">
            {entries.map((e) => (
              <div
                key={e.rank}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#f7ce9e]"
                style={{ backgroundColor: e.rank === 1 ? 'rgba(251,191,36,0.06)' : e.rank === 2 ? 'rgba(148,163,184,0.06)' : e.rank === 3 ? 'rgba(180,83,9,0.06)' : undefined }}
              >
                <span className="w-7 shrink-0 text-center text-sm font-bold">
                  {e.rank <= 3 ? MEDALS[e.rank - 1] : (
                    <span className="text-xs text-[#8c502e]/80">#{e.rank}</span>
                  )}
                </span>
                {lb.showAvatar && (
                  <img
                    src={e.avatar}
                    alt={e.playerName}
                    className="h-7 w-7 shrink-0 rounded-lg"
                    onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <span className="flex-1 truncate text-sm font-semibold text-[#632811]">
                  {e.playerName}
                </span>
                <span className="shrink-0 text-sm font-bold text-orange-500">
                  {formatValue(e.value, lb.valueFormat)}
                  {lb.valueLabel && <span className="ml-1 text-xs font-normal text-[#8c502e]/80">{lb.valueLabel}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default function LeaderboardsPage() {
  const { t } = useSiteLang();
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/leaderboards')
      .then((r) => r.json())
      .then((d) => { setLeaderboards((d.leaderboards || []).filter((l: Leaderboard) => l.active)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  const grouped = leaderboards.reduce<Record<string, Leaderboard[]>>((acc, l) => {
    const cat = l.category?.trim() || t('leaderboards.general', 'Genel');
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(l);
    return acc;
  }, {});
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        badge={t('leaderboards.badge', 'Sıralamalar')}
        title={t('leaderboards.title', 'En İyi Oyuncular')}
        description={t('leaderboards.desc', 'Sunucumuzdaki en iyi oyuncuları keşfet ve sıralamalarda yerini al.')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('leaderboards.badge', 'Sıralamalar') }]}
        image="/images/leaderboard-hero.jpg"
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {leaderboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <Trophy size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{t('leaderboards.empty', 'Henüz sıralama yok')}</p>
            <p className="mt-1 text-sm text-[#8c502e]/80">{t('leaderboards.empty_desc', 'Yakında eklenecek, takipte kal.')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([cat, list]) => (
              <div key={cat}>
                <div className="mb-4 flex items-center gap-2">
                  <Trophy size={15} className="text-orange-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#8c502e]">{cat}</h2>
                  <div className="flex-1 border-t border-[#d88a67]" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((lb) => (
                    <LeaderboardCard key={lb.id} lb={lb} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <JoinCta />
    </div>
  );
}