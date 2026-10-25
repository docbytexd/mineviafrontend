'use client';
import { useState, useEffect, useCallback } from 'react';
import PageHero from '@/components/PageHero';
import Link from 'next/link';
interface GamingNight {
  id: string;
  name: string;
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  discountType: 'percent' | 'amount';
  discountValue: number;
}

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const pad = (n: number) => String(n).padStart(2, '0');
export default function GamingNightPage() {
  const [nights, setNights] = useState<GamingNight[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<GamingNight | null>(null);
  const [next, setNext] = useState<GamingNight | null>(null);
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    fetch('/api/public/gaming-night')
      .then((r) => r.json())
      .then((d) => { if (d.nights) setNights(d.nights); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  const compute = useCallback(() => {
    if (!nights.length) return;
    const current = new Date();
    const day = current.getDay();
    const hour = current.getHours();
    const live = nights.find((n) => n.dayOfWeek === day && hour >= n.startHour && hour < n.endHour) || null;
    setActive(live);
    if (live) {
      const endTime = new Date(current);
      endTime.setHours(live.endHour, 0, 0, 0);
      const diff = Math.max(0, endTime.getTime() - current.getTime());
      setLeft({ d: 0, h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
      setNext(null);
      return;
    }
    let minDiff = Infinity;
    let upcoming: GamingNight | null = null;
    for (const n of nights) {
      let daysUntil = (n.dayOfWeek - day + 7) % 7;
      if (daysUntil === 0 && hour >= n.startHour) daysUntil = 7;
      const nextStart = new Date(current);
      nextStart.setDate(nextStart.getDate() + daysUntil);
      nextStart.setHours(n.startHour, 0, 0, 0);
      const diff = nextStart.getTime() - current.getTime();
      if (diff > 0 && diff < minDiff) { minDiff = diff; upcoming = n; }
    }
    setNext(upcoming);
    if (minDiff !== Infinity) {
      setLeft({
        d: Math.floor(minDiff / 86400000),
        h: Math.floor((minDiff % 86400000) / 3600000),
        m: Math.floor((minDiff % 3600000) / 60000),
        s: Math.floor((minDiff % 60000) / 1000),
      });
    }
  }, [nights]);
  useEffect(() => {
    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [compute]);
  const focus = active || next;
  const cells: [string, string][] = [['Gün', pad(left.d)], ['Saat', pad(left.h)], ['Dakika', pad(left.m)], ['Saniye', pad(left.s)]];
  return (
    <div className="min-h-screen bg-[#f7ce9e] pb-16">
      <PageHero badge="Oyun Gecesi" title={active ? 'İndirim şu an aktif!' : 'Haftalık indirim gecesi'} description="Her hafta belirlenen saatte mağaza indirimi açılır." crumbs={[{ label: 'Anasayfa', href: '/' }, { label: 'Oyun Gecesi' }]} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {loading && <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" /></div>}
        {!loading && nights.length === 0 && <div className="rounded-xl border-b-4 border-[#632811] bg-[#8c502e] p-10 text-center font-bold text-[#f7ce9e]">Henüz oyun gecesi tanımlanmadı.</div>}
        {!loading && nights.length > 0 && (
          <>
            <div className="rounded-2xl border-b-4 border-[#c2410c] bg-gradient-to-br from-orange-500 to-orange-700 p-6 text-center text-white shadow-xl">
              <p className="text-sm font-black uppercase tracking-[0.2em]">{active ? 'İndirim bitmesine' : 'Sonraki geceye'}</p>
              {focus && <p className="mt-1 text-2xl font-black uppercase">{focus.name} · {DAYS[focus.dayOfWeek]} {pad(focus.startHour)}:00–{pad(focus.endHour)}:00 · {focus.discountType === 'percent' ? `%${focus.discountValue}` : `${focus.discountValue}₺`} indirim</p>}
              <div className="mt-6 flex justify-center gap-3">
                {cells.map(([label, value]) => (
                  <div key={label} className="w-16 md:w-20">
                    <div className="flex h-20 items-center justify-center rounded-xl bg-[#1c0d07] text-4xl font-black tabular-nums md:h-24 md:text-5xl">{value}</div>
                    <p className="mt-2 text-xs font-bold uppercase">{label}</p>
                  </div>
                ))}
              </div>
              <Link href="/store" className="mt-6 inline-flex rounded-lg border-b-4 border-[#9a3412] bg-[#f1b978] px-6 py-2 font-black uppercase text-orange-700 transition-transform hover:scale-95">Mağazaya git</Link>
            </div>
            <h2 className="mb-4 mt-10 text-2xl font-black uppercase text-[#8c502e]">Haftalık saatler</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {nights.map((n) => {
                const on = active?.id === n.id;
                return (
                  <div key={n.id} className={on ? 'rounded-xl border-b-4 border-[#c2410c] bg-orange-500 p-4 text-white' : 'rounded-xl border-b-4 border-[#632811] bg-[#8c502e] p-4 text-[#f7ce9e]'}>
                    <p className="font-black uppercase">{n.name}{on ? ' · AKTİF' : ''}</p>
                    <p className="mt-1 text-sm font-semibold">{DAYS[n.dayOfWeek]} · {pad(n.startHour)}:00 – {pad(n.endHour)}:00</p>
                    <p className="mt-1 text-lg font-black">{n.discountType === 'percent' ? `%${n.discountValue}` : `${n.discountValue}₺`} indirim</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}