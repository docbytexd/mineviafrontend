'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, ThumbsUp, ThumbsDown, FileText, ChevronRight } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useServerName } from '@/lib/site/useServerName';
interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  views: number;
  helpfulYes: number;
  helpfulNo: number;
  topic: { name: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
}
export default function ArticlePage() {
  const { t } = useSiteLang();
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null);
  useEffect(() => {
    fetch(`/api/public/help/${slug}`)
      .then((r) => r.json())
      .then((d) => { if (d.article) setArticle(d.article); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);
  const serverName = useServerName();
  useEffect(() => {
    if (article) document.title = `${serverName}  ${article.title}`;
  }, [article, serverName]);
  async function handleVote(type: 'yes' | 'no') {
    if (voted) return;
    setVoted(type);
    if (article) {
      setArticle((prev) => prev ? {
        ...prev,
        helpfulYes: type === 'yes' ? prev.helpfulYes + 1 : prev.helpfulYes,
        helpfulNo: type === 'no' ? prev.helpfulNo + 1 : prev.helpfulNo,
      } : prev);
    }
    await fetch(`/api/public/help/${slug}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    }).catch(() => {});
  }
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  if (!article) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <FileText size={48} className="mb-4 text-slate-200" />
      <p className="font-bold text-[#8c502e]">{t('faq.article_not_found', 'Makale bulunamadı.')}</p>
      <Link href="/faq" className="mt-4 text-sm text-orange-500 hover:underline">{t('faq.back_help', 'Yardım Merkezine Dön')}</Link>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        title={article.title}
        description={`${article.views} görüntülenme · Güncellendi: ${new Date(article.updatedAt).toLocaleDateString('tr-TR')}`}
        crumbs={[
          { label: t('common.home', 'Anasayfa'), href: '/' },
          { label: t('faq.help_center', 'Yardım Merkezi'), href: '/faq' },
          ...(article.topic ? [{ label: article.topic.name, href: `/faq/topic/${article.topic.slug}` }] : []),
          { label: article.title },
        ]}
        image="/images/support-hero.jpg"
      />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
          <div className="p-6 md:p-8">
            <div className="prose prose-slate max-w-none text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
            </div>
          </div>
          <div className="border-t border-[#d88a67] px-6 py-5">
            <p className="mb-3 text-center text-sm font-semibold text-[#8c502e]">{t('faq.helpful', 'Bu makale yardımcı oldu mu?')}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleVote('yes')}
                disabled={!!voted}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-60"
                style={{
                  backgroundColor: voted === 'yes' ? '#22c55e' : '#f0fdf4',
                  color: voted === 'yes' ? '#fff' : '#16a34a',
                }}
              >
                <ThumbsUp size={15} /> Evet ({article.helpfulYes})
              </button>
              <button
                onClick={() => handleVote('no')}
                disabled={!!voted}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-60"
                style={{
                  backgroundColor: voted === 'no' ? '#ef4444' : '#fef2f2',
                  color: voted === 'no' ? '#fff' : '#dc2626',
                }}
              >
                <ThumbsDown size={15} /> Hay1r ({article.helpfulNo})
              </button>
            </div>
            {voted && (
              <p className="mt-3 text-center text-xs text-[#8c502e]/80">{t('faq.thanks', 'Geri bildiriminiz için teşekkürler!')}</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#d88a67] bg-[#f1b978] p-5 shadow-sm">
          <p className="text-sm text-[#8c502e]">{t('faq.still_issue', 'Hâlâ sorun yaşıyor musunuz?')}</p>
          <Link href="/support/new" className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600">
            Destek Talebi A <ChevronRight size={14} />
          </Link>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}