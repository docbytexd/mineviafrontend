'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Gamepad2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useServerName } from '@/lib/site/useServerName';
import { useSiteLang } from '@/lib/site/SiteLangContext';
interface GameMode {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  content: string;
  coverImage: string;
  gallery: string[];
  serverIp: string;
}
export default function GameModeDetailPage() {
  const { t } = useSiteLang();
  const { slug } = useParams<{ slug: string }>();
  const [mode, setMode] = useState<GameMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeImg, setActiveImg] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/public/gamemodes/${slug}`)
      .then((r) => r.json())
      .then((d) => { if (d.mode) setMode(d.mode); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);
  const serverName = useServerName();
  useEffect(() => {
    if (mode) document.title = `${serverName} · ${mode.name}`;
  }, [mode, serverName]);
  function copyIp(ip: string) {
    navigator.clipboard.writeText(ip).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  if (loading) return (
    <div className="flex justify-center py-24" style={{ backgroundColor: '#0f0c29', minHeight: '100vh' }}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-orange-500" />
    </div>
  );
  if (!mode) return (
    <div className="flex flex-col items-center justify-center py-24 text-center" style={{ backgroundColor: '#0f0c29', minHeight: '100vh' }}>
      <Gamepad2 size={48} className="mb-4 text-white/20" />
      <p className="font-bold text-white/40">{t('gamemodes.not_found', 'Oyun modu bulunamadı.')}</p>
      <Link href="/gamemodes" className="mt-4 text-sm text-orange-400 hover:underline">{t('common.back', 'Geri Dön')}</Link>
    </div>
  );
  return (
    <div style={{ backgroundColor: '#0f0c29', minHeight: '100vh' }}>
      <section className="relative overflow-hidden" style={{ minHeight: 300 }}>
        {mode.coverImage ? (
          <img src={mode.coverImage} alt={mode.name} className="absolute inset-0 h-full w-full object-cover opacity-40" style={{ objectPosition: 'center top' }} />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: '#1a1530' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c29] via-[#0f0c29]/50 to-transparent" />
        <div className="relative mx-auto flex max-w-5xl flex-col justify-end gap-4 px-6 pb-10 pt-16">
          <nav className="flex items-center gap-1.5 text-xs text-white/40">
            <Link href="/" className="transition-colors hover:text-white/70">{t('common.home', 'Anasayfa')}</Link>
            <ChevronRight size={12} />
            <Link href="/gamemodes" className="transition-colors hover:text-white/70">{t('gamemodes.title', 'Oyun Modları')}</Link>
            <ChevronRight size={12} />
            <span className="text-white/70">{mode.name}</span>
          </nav>
          <h1 className="text-4xl font-black uppercase tracking-wide text-white drop-shadow md:text-5xl" style={{ fontFamily: 'serif' }}>
            {mode.name}
          </h1>
          {mode.shortDescription && (
            <p className="max-w-xl text-sm text-white/60">{mode.shortDescription}</p>
          )}
          {mode.serverIp && (
            <button
              onClick={() => copyIp(mode.serverIp)}
              className="flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-[#f1b978]/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-[#f1b978]/20"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copied ? 'Kopyalandı!' : mode.serverIp}
            </button>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {mode.content && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 p-6 md:p-8" style={{ backgroundColor: '#1a1530' }}>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{mode.content}</ReactMarkdown>
            </div>
          </div>
        )}
        {mode.gallery.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-black text-white">{t('gallery.badge', 'Galeri')}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {mode.gallery.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(img)}
                  className="group overflow-hidden rounded-xl border border-white/10 transition-all hover:border-orange-500/50">
                  <img src={img} alt={`${mode.name} ${i + 1}`} className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 p-5" style={{ backgroundColor: '#1a1530' }}>
          <p className="text-sm text-white/60">{t('gamemodes.explore', 'Diğer oyun modlarını keşfet')}</p>
          <Link href="/gamemodes" className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600">
            {t('gamemodes.all', 'Tüm Modlar')} <ChevronRight size={14} />
          </Link>
        </div>
      </div>
      {activeImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setActiveImg(null)}>
          <img src={activeImg} alt="Galeri" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}