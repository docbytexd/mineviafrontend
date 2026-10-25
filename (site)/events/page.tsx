'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, CalendarCheck } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
interface EventItem {
  id: string;
  name: string;
  description: string;
  image: string;
  scheduleType: 'once' | 'weekly';
  eventDate: string | null;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  color: string;
}
const DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function scheduleLabel(e: EventItem) {
  if (e.scheduleType === 'once') return fmtDate(e.eventDate);
  if (e.daysOfWeek.length === 0) return '—';
  if (e.daysOfWeek.length === 7) return 'Her gün';
  return e.daysOfWeek.slice().sort().map((d) => DAYS_SHORT[d]).join(', ');
}
function parseHM(t: string) {
  const [h, m] = t.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}
function combineDateTime(date: Date, time: string) {
  const { h, m } = parseHM(time);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}
type Timing = { status: 'live' | 'upcoming' | 'ended'; target: Date | null };
function getOnceTiming(e: EventItem, now: Date): Timing | null {
  if (!e.eventDate) return null;
  const day = new Date(e.eventDate);
  const start = combineDateTime(day, e.startTime);
  const end = combineDateTime(day, e.endTime);
  if (now < start) return { status: 'upcoming', target: start };
  if (now >= start && now <= end) return { status: 'live', target: end };
  return { status: 'ended', target: null };
}
function getWeeklyTiming(e: EventItem, now: Date): Timing | null {
  if (e.daysOfWeek.length === 0) return null;
  const todayIdx = now.getDay();
  if (e.daysOfWeek.includes(todayIdx)) {
    const start = combineDateTime(now, e.startTime);
    const end = combineDateTime(now, e.endTime);
    if (now >= start && now <= end) return { status: 'live', target: end };
    if (now < start) return { status: 'upcoming', target: start };
  }
  for (let i = 1; i <= 7; i++) {
    const idx = (todayIdx + i) % 7;
    if (e.daysOfWeek.includes(idx)) {
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + i);
      const start = combineDateTime(nextDate, e.startTime);
      return { status: 'upcoming', target: start };
    }
  }
  return null;
}
function Countdown({ target }: { target: Date }) {
  const [diff, setDiff] = useState(() => target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (diff <= 0) return <span className="font-mono tabular-nums">00:00:00</span>;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <span className="font-mono tabular-nums">
      {days > 0 && `${days}g `}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
function StatusCell({ event, type }: { event: EventItem; type: 'weekly' | 'once' }) {
  const { t } = useSiteLang();
  const compute = () => (type === 'weekly' ? getWeeklyTiming(event, new Date()) : getOnceTiming(event, new Date()));
  const [timing, setTiming] = useState<Timing | null>(compute);
  useEffect(() => {
    const id = setInterval(() => setTiming(compute()), 15000);
    return () => clearInterval(id);
  }, [event]);
  if (!timing) return <span className="inline-flex items-center rounded-full bg-[#f7ce9e] px-2.5 py-1 text-xs font-medium text-[#8c502e]/80">—</span>;
  if (timing.status === 'ended') {
    return <span className="inline-flex items-center rounded-full bg-[#f1b978] px-2.5 py-1 text-xs font-medium text-[#8c502e]/80">{t('events.ended', 'Sona Erdi')}</span>;
  }
  if (timing.status === 'live' && timing.target) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> {t('events.live', 'Şu An Aktif')}
        </span>
        <span className="text-[11px] text-[#8c502e]/80">
          {t('events.until_end', 'Bitmesine')} <Countdown target={timing.target} />
        </span>
      </div>
    );
  }
  if (timing.status === 'upcoming' && timing.target) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-500">{t('events.upcoming', 'Yaklaşıyor')}</span>
        <span className="text-[11px] text-[#8c502e]/80">
          {t('events.until_start', 'Başlamasına')} <Countdown target={timing.target} />
        </span>
      </div>
    );
  }
  return null;
}
export default function EventsPage() {
  const { t } = useSiteLang();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/public/events')
      .then((r) => r.json())
      .then((d) => { if (d.events) setEvents(d.events); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  const weekly = events.filter((e) => e.scheduleType === 'weekly');
  const oneTime = events
    .filter((e) => e.scheduleType === 'once')
    .sort((a, b) => new Date(a.eventDate || 0).getTime() - new Date(b.eventDate || 0).getTime());
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHero
        badge="Etkinlikler"
        title={t('events.title', 'Etkinlik Takvimi')}
        description="Sunucumuzda düzenlenen etkinlikleri ve zamanlarını buradan takip edebilirsin."
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('events.title', 'Etkinlik Takvimi') }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <CalendarDays size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{t('events.empty', 'Henüz etkinlik yok')}</p>
            <p className="mt-1 text-sm text-[#8c502e]/80">{t('events.empty_desc', 'Yakında eklenecek, takipte kal.')}</p>
          </div>
        ) : (
          <>
            {weekly.length > 0 && (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <CalendarCheck size={15} className="text-orange-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#8c502e]">{t('events.weekly', 'Haftalık Etkinlikler')}</h2>
                  <div className="flex-1 border-t border-[#d88a67]" />
                </div>
                <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#d88a67] bg-[#f7ce9e] text-left text-xs uppercase tracking-wider text-[#8c502e]/80">
                        <th className="px-5 py-3 font-bold">Etkinlik</th>
                        <th className="px-5 py-3 font-bold">Günler</th>
                        <th className="px-5 py-3 font-bold">Saat</th>
                        <th className="px-5 py-3 font-bold text-right">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekly.map((e) => (
                          <tr key={e.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-[#f7ce9e]">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {e.image ? (
                                  <img src={e.image} alt={e.name} className="h-11 w-11 rounded-xl object-cover" />
                                ) : (
                                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${e.color}18`, color: e.color }}>
                                    <CalendarDays size={18} />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                                    <span className="font-bold text-[#632811]">{e.name}</span>
                                  </div>
                                  {e.description && <p className="mt-0.5 max-w-sm text-xs text-[#8c502e]/80">{e.description}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[#8c502e]">{scheduleLabel(e)}</td>
                            <td className="px-5 py-4 text-[#8c502e]">
                              <span className="flex items-center gap-1"><Clock size={12} /> {e.startTime} - {e.endTime}</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <StatusCell event={e} type="weekly" />
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {oneTime.length > 0 && (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays size={15} className="text-orange-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#8c502e]">{t('events.one_time', 'Tek Seferlik Etkinlikler')}</h2>
                  <div className="flex-1 border-t border-[#d88a67]" />
                </div>
                <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#d88a67] bg-[#f7ce9e] text-left text-xs uppercase tracking-wider text-[#8c502e]/80">
                        <th className="px-5 py-3 font-bold">Etkinlik</th>
                        <th className="px-5 py-3 font-bold">Tarih</th>
                        <th className="px-5 py-3 font-bold">Saat</th>
                        <th className="px-5 py-3 font-bold text-right">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oneTime.map((e) => (
                          <tr key={e.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-[#f7ce9e]">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {e.image ? (
                                  <img src={e.image} alt={e.name} className="h-11 w-11 rounded-xl object-cover" />
                                ) : (
                                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${e.color}18`, color: e.color }}>
                                    <CalendarDays size={18} />
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                                    <span className="font-bold text-[#632811]">{e.name}</span>
                                  </div>
                                  {e.description && <p className="mt-0.5 max-w-sm text-xs text-[#8c502e]/80">{e.description}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[#8c502e]">{fmtDate(e.eventDate)}</td>
                            <td className="px-5 py-4 text-[#8c502e]">
                              <span className="flex items-center gap-1"><Clock size={12} /> {e.startTime} - {e.endTime}</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <StatusCell event={e} type="once" />
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}