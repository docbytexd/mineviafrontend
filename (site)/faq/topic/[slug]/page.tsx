'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FileText, Pin, ChevronRight } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
import * as LucideIcons from 'lucide-react';
import { useServerName } from '@/lib/site/useServerName';
interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  parent: string | null;
}
interface Article {
  id: string;
  title: string;
  slug: string;
  topic: string | null;
  pinned: boolean;
}
export default function TopicPage() {
  const { t } = useSiteLang();
  const { slug } = useParams<{ slug: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/public/help')
      .then((r) => r.json())
      .then((d) => {
        const found = (d.topics || []).find((t: Topic) => t.slug === slug);
        setTopic(found || null);
        if (found) {
          setArticles((d.articles || []).filter((a: Article) => a.topic === found.id));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);
  const serverName = useServerName();
  useEffect(() => {
    if (topic) document.title = `${serverName} · ${topic.name}`;
  }, [topic, serverName]);
  function TopicIcon({ icon }: { icon: string }) {
    if (!icon) return <FileText size={32} className="text-orange-400" />;
    const Ic = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[icon];
    if (!Ic) return <FileText size={32} className="text-orange-400" />;
    return <Ic size={32} className="text-orange-400" />;
  }
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  if (!topic) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-bold text-[#8c502e]">{t('faq.topic_not_found', 'Konu bulunamadı.')}</p>
      <Link href="/faq" className="mt-4 text-sm text-orange-500 hover:underline">{t('faq.back_help', 'Yardım Merkezine Dön')}</Link>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        title={topic.name}
        description={topic.description}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('faq.help_center', 'Yardım Merkezi'), href: '/faq' }, { label: topic.name }]}
        image="/images/support-hero.jpg"
      />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-[#632811]">{articles.length} makale</h2>
        </div>
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <FileText size={40} className="mb-3 text-slate-200" />
            <p className="text-sm text-[#8c502e]/80">{t('faq.no_articles', 'Bu konuda henüz makale yok.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/faq/${article.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-[#d88a67] bg-[#f1b978] px-4 py-3.5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1b978] group-hover:bg-orange-50">
                  {article.pinned
                    ? <Pin size={14} className="text-orange-400" />
                    : <FileText size={14} className="text-[#8c502e]/80 group-hover:text-orange-400" />
                  }
                </div>
                <span className="line-clamp-1 text-sm font-semibold text-[#632811] group-hover:text-orange-600">
                  {article.title}
                </span>
                <ChevronRight size={14} className="ml-auto shrink-0 text-slate-300 group-hover:text-orange-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
      <JoinCta />
    </div>
  );
}