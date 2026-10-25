'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, MessageCircle, Pin, Plus, Search, Loader2 } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
interface Status {
  id: string;
  name: string;
  color: string;
  isClosed: boolean;
}
interface Suggestion {
  id: string;
  title: string;
  content: string;
  authorName: string;
  status: Status | null;
  likes: number;
  dislikes: number;
  commentCount: number;
  pinned: boolean;
  createdAt: string;
}
export default function SuggestionsPage() {
  const { t } = useSiteLang();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [newModal, setNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeStatus) params.set('status', activeStatus);
    if (search) params.set('search', search);
    params.set('page', String(page));
    const res = await fetch(`/api/public/suggestions?${params}`).then((r) => r.json());
    setSuggestions(res.suggestions || []);
    setPages(res.pages || 1);
    setTotal(res.total || 0);
    setLoading(false);
  }, [activeStatus, search, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/public/suggestions/statuses')
      .then((r) => r.json())
      .then((d) => setStatuses(d.statuses || []));
  }, []);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  }, [search]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    const res = await fetch('/api/public/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setSubmitError(data.error || 'Bir hata oluştu.'); return; }
    setSubmitSuccess(true);
    setTimeout(() => {
      setNewModal(false);
      setSubmitSuccess(false);
      setNewTitle('');
      setNewContent('');
      load();
    }, 1500);
  }
  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    return `${days} gün önce`;
  }
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        badge={t('suggestions.title', 'Öneriler')}
        title={t('suggestions.center', 'Öneri Merkezi')}
        description={`${total} öneri`}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('suggestions.title', 'Öneriler') }]}
      >
        <button
          onClick={() => setNewModal(true)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Plus size={15} /> {t('suggestions.make', 'Öneri Yap')}
        </button>
      </PageHero>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#d88a67] bg-[#f1b978] px-4 py-2.5 shadow-sm focus-within:border-orange-400">
            <Search size={15} className="text-[#8c502e]/80" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Öneri ara..."
              className="flex-1 bg-transparent text-sm text-[#632811] outline-none placeholder:text-[#8c502e]/80"
            />
          </div>
        </div>
        {statuses.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              onClick={() => { setActiveStatus(''); setPage(1); }}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
              style={{ backgroundColor: !activeStatus ? 'var(--accent)' : 'var(--bg)', color: !activeStatus ? '#fff' : 'var(--text-muted)' }}
            >
              Tümü
            </button>
            {statuses.map((s) => (
              <button
                key={s.id}
                onClick={() => { setActiveStatus(activeStatus === s.id ? '' : s.id); setPage(1); }}
                className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                style={{
                  backgroundColor: activeStatus === s.id ? s.color : `${s.color}20`,
                  color: activeStatus === s.id ? '#fff' : s.color,
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <MessageCircle size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">Henüz öneri yok</p>
            <button onClick={() => setNewModal(true)} className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
              İlk öneriyi yap
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <Link
                key={s.id}
                href={`/suggestions/${s.id}`}
                className="group flex gap-4 overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] p-5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className="flex items-center gap-1 text-xs font-bold text-[#8c502e]/80">
                    <ThumbsUp size={13} className="text-emerald-400" /> {s.likes}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#8c502e]/80">
                    <ThumbsDown size={13} className="text-red-400" /> {s.dislikes}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {s.pinned && (
                      <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                        <Pin size={9} /> Sabitlendi
                      </span>
                    )}
                    {s.status && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: s.status.color }}>
                        {s.status.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-[#632811] group-hover:text-orange-500 transition-colors line-clamp-1">{s.title}</h3>
                  <p className="mt-1 text-xs text-[#8c502e]/80 line-clamp-2">{s.content}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-[#8c502e]/80">
                    <span>{s.authorName}</span>
                    <span>·</span>
                    <span>{timeAgo(s.createdAt)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><MessageCircle size={10} /> {s.commentCount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-[#d88a67] bg-[#f1b978] px-4 py-2 text-sm font-semibold text-[#8c502e] disabled:opacity-40 hover:bg-[#f7ce9e]">
              {t('common.prev', 'Önceki')}
            </button>
            <span className="text-sm text-[#8c502e]">{page} / {pages}</span>
            <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-[#d88a67] bg-[#f1b978] px-4 py-2 text-sm font-semibold text-[#8c502e] disabled:opacity-40 hover:bg-[#f7ce9e]">
              {t('common.next', 'Sonraki')}
            </button>
          </div>
        )}
      </div>
      {newModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-[#f1b978] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d88a67] px-6 py-4">
              <h3 className="font-black text-[#632811]">{t('suggestions.new', 'Yeni Öneri')}</h3>
              <button onClick={() => setNewModal(false)} className="text-[#8c502e]/80 hover:text-[#8c502e]">✕</button>
            </div>
            {submitSuccess ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <ThumbsUp size={28} className="text-emerald-500" />
                </div>
                <p className="font-bold text-[#632811]">{t('suggestions.received', 'Öneri alındı!')}</p>
                <p className="mt-1 text-sm text-[#8c502e]/80">{t('suggestions.thanks', 'Teşekkürler.')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                {submitError && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-500">{submitError}</p>}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#8c502e]">Başlık <span className="text-red-400">*</span></label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Kısa ve öz bir başlık" maxLength={200} required
                    className="w-full rounded-xl border border-[#d88a67] px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#8c502e]">Açıklama <span className="text-red-400">*</span></label>
                  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Önerinizi detaylıca açıklayın..." rows={5} maxLength={5000} required
                    className="w-full resize-none rounded-xl border border-[#d88a67] px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  <p className="mt-1 text-right text-[11px] text-[#8c502e]/80">{newContent.length}/5000</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setNewModal(false)}
                    className="flex-1 rounded-xl border border-[#d88a67] py-2.5 text-sm font-semibold text-[#8c502e] hover:bg-[#f7ce9e]">
                    {t('common.cancel', 'İptal')}
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {t('common.submit', 'Gönder')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <JoinCta />
    </div>
  );
}