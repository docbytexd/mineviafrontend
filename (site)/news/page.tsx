'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHero from '@/components/PageHero';

interface Item {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
  category?: { name: string; color: string } | null;
}

export default function NewsListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/news')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.items)) setItems(d.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f7ce9e] pb-16">
      <PageHero
        badge="Haberler"
        title="Haberlerimiz"
        description="Sunucu duyuruları, güncellemeler ve son gelişmeler."
        crumbs={[{ label: 'Anasayfa', href: '/' }, { label: 'Haberler' }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading && <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8c502e]/30 border-t-orange-500" /></div>}
        {!loading && items.length === 0 && (
          <div className="mx-auto flex max-w-xl flex-col items-center rounded-lg border-b-4 border-[#632811] bg-[#8c502e] px-8 py-14 text-center shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl border-b-4 border-[#c2410c] bg-gradient-to-br from-orange-400 to-orange-600 text-3xl text-white">⚓</div>
            <p className="text-xl font-black uppercase text-[#f7ce9e]">Henüz haber yok</p>
            <p className="mt-2 text-sm font-semibold text-[#f1b978]">Yeni duyurular burada ahşap kartlarla görünecek.</p>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <Link key={n.id} href={'/news/' + n.slug} className="flex flex-col rounded-lg border-b-4 border-[#632811] bg-[#8c502e] p-4 text-[#f7ce9e] shadow-xl transition-transform hover:scale-[0.98]">
              {n.coverImage ? (
                <img src={n.coverImage} alt="" className="mb-3 aspect-video h-40 w-full rounded-md object-cover" />
              ) : (
                <div className="mb-3 flex aspect-video h-40 items-center justify-center rounded-md bg-[#632811]/40 text-4xl">H</div>
              )}
              <h2 className="font-black uppercase">{n.title}</h2>
              {n.excerpt ? <p className="mt-1 line-clamp-3 text-sm font-medium text-[#f1b978]">{n.excerpt}</p> : null}
              <div className="mt-auto flex items-center justify-between pt-3 text-xs">
                <span className="rounded bg-green-500 px-2 py-0.5 font-bold text-white">{n.category?.name || 'Haberler'}</span>
                <span>{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('tr-TR') : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
