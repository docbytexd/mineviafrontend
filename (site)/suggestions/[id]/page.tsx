'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, MessageCircle, Pin, Send, Shield, Loader2 } from 'lucide-react';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
import { useServerName } from '@/lib/site/useServerName';
import { useSiteLang } from '@/lib/site/SiteLangContext';
interface Comment {
  id: string;
  authorName: string;
  content: string;
  isStaff: boolean;
  createdAt: string;
}
interface Suggestion {
  id: string;
  title: string;
  content: string;
  authorName: string;
  status: { id: string; name: string; color: string; isClosed: boolean } | null;
  likes: number;
  dislikes: number;
  adminResponse: string;
  pinned: boolean;
  createdAt: string;
  comments: Comment[];
}
export default function SuggestionDetailPage() {
  const { t } = useSiteLang();
  const { id } = useParams<{ id: string }>();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [voted, setVoted] = useState<'like' | 'dislike' | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  useEffect(() => {
    fetch(`/api/public/suggestions/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.suggestion) {
          setSuggestion(d.suggestion);
          setLikes(d.suggestion.likes);
          setDislikes(d.suggestion.dislikes);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);
  const serverName = useServerName();
  useEffect(() => {
    if (suggestion) document.title = `${serverName} · ${suggestion.title}`;
  }, [suggestion, serverName]);
  async function handleVote(type: 'like' | 'dislike') {
    const res = await fetch(`/api/public/suggestions/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setVoted(voted === type ? null : type);
    }
  }
  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    setCommentError('');
    const res = await fetch(`/api/public/suggestions/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    });
    const data = await res.json();
    setCommenting(false);
    if (!res.ok) { setCommentError(data.error || 'Bir hata oluştu.'); return; }
    setComment('');
    const updated = await fetch(`/api/public/suggestions/${id}`).then((r) => r.json());
    if (updated.suggestion) setSuggestion(updated.suggestion);
  }
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (loading) return (
    <div className="flex justify-center py-24 min-h-screen bg-[#f7ce9e] text-[#632811]">
      <Loader2 size={24} className="animate-spin text-slate-300" />
    </div>
  );
  if (!suggestion) return (
    <div className="flex flex-col items-center justify-center py-24 text-center min-h-screen bg-[#f7ce9e] text-[#632811]">
      <p className="font-bold text-[#8c502e]">{t('suggestions.not_found', 'Öneri bulunamadı.')}</p>
      <Link href="/suggestions" className="mt-4 text-sm text-orange-500 hover:underline">{t('common.back', 'Geri Dön')}</Link>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        title={suggestion.title}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('suggestions.title', 'Öneriler'), href: '/suggestions' }, { label: suggestion.title }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex gap-5">
          <div className="flex flex-col items-center gap-2 pt-1">
            <button onClick={() => handleVote('like')}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-emerald-50"
              style={{ backgroundColor: voted === 'like' ? '#dcfce7' : 'white', border: '1px solid', borderColor: voted === 'like' ? '#86efac' : 'var(--border)' }}>
              <ThumbsUp size={16} className={voted === 'like' ? 'text-emerald-500' : 'text-[#8c502e]/80'} />
            </button>
            <span className="text-sm font-black text-[#8c502e]">{likes}</span>
            <button onClick={() => handleVote('dislike')}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-red-50"
              style={{ backgroundColor: voted === 'dislike' ? '#fee2e2' : 'white', border: '1px solid', borderColor: voted === 'dislike' ? '#fca5a5' : 'var(--border)' }}>
              <ThumbsDown size={16} className={voted === 'dislike' ? 'text-red-500' : 'text-[#8c502e]/80'} />
            </button>
            <span className="text-sm font-black text-[#8c502e]">{dislikes}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
              <div className="p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {suggestion.pinned && (
                    <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-600">
                      <Pin size={10} /> {t('suggestions.pinned', 'Sabitlendi')}
                    </span>
                  )}
                  {suggestion.status && (
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: suggestion.status.color }}>
                      {suggestion.status.name}
                    </span>
                  )}
                </div>
                <h1 className="mb-3 text-xl font-black text-[#632811]">{suggestion.title}</h1>
                <p className="text-sm leading-relaxed text-[#8c502e]">{suggestion.content}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-[#8c502e]/80">
                  <span className="font-semibold">{suggestion.authorName}</span>
                  <span>·</span>
                  <span>{formatDate(suggestion.createdAt)}</span>
                </div>
              </div>
            </div>
            {suggestion.adminResponse && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Shield size={14} className="text-indigo-500" />
                  <span className="text-xs font-black text-indigo-600">{t('suggestions.admin', 'Yönetici Yanıtı')}</span>
                </div>
                <p className="text-sm text-indigo-800">{suggestion.adminResponse}</p>
              </div>
            )}
            <div className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 font-black text-[#632811]">
                <MessageCircle size={16} className="text-orange-400" />
                {t('suggestions.comments', 'Yorumlar')} ({suggestion.comments.length})
              </h2>
              <div className="space-y-3">
                {suggestion.comments.map((c) => (
                  <div key={c.id} className={`overflow-hidden rounded-2xl border p-4 ${c.isStaff ? 'border-indigo-200 bg-indigo-50' : 'border-[#d88a67] bg-[#f1b978]'}`}>
                    <div className="mb-2 flex items-center gap-2">
                      {c.isStaff && <Shield size={12} className="text-indigo-500" />}
                      <span className="text-xs font-bold text-[#632811]">{c.authorName}</span>
                      {c.isStaff && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">{t('suggestions.staff', 'Yetkili')}</span>}
                      <span className="ml-auto text-[11px] text-[#8c502e]/80">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[#8c502e]">{c.content}</p>
                  </div>
                ))}
              </div>
              {!suggestion.status?.isClosed && (
                <form onSubmit={handleComment} className="mt-4 overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                  <div className="border-b border-[#d88a67] px-5 py-3">
                    <h3 className="text-sm font-bold text-[#632811]">{t('suggestions.comment', 'Yorum Yap')}</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    {commentError && <p className="text-xs font-semibold text-red-500">{commentError}</p>}
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                      placeholder={t('suggestions.comment_ph', 'Yorumunuzu yazın...')} rows={3} maxLength={2000}
                      className="w-full resize-none rounded-xl border border-[#d88a67] px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                    <div className="flex justify-end">
                      <button type="submit" disabled={commenting || !comment.trim()}
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">
                        {commenting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        {t('common.submit', 'Gönder')}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}