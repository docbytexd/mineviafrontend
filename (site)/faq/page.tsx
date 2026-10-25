'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, FileText, ChevronRight, Pin } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import * as LucideIcons from 'lucide-react';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
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
interface SearchResult {
  id: string;
  title: string;
  slug: string;
}
export default function FaqPage() {
  const { t } = useSiteLang();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/public/help')
      .then((r) => r.json())
      .then((d) => {
        setTopics(d.topics || []);
        setArticles(d.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/public/help/search?q=${encodeURIComponent(q)}`).then((r) => r.json());
    setSearchResults(res.articles || []);
    setSearching(false);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, doSearch]);
  const rootTopics = topics.filter((t) => !t.parent);
  function getTopicArticles(topicId: string) {
    return articles.filter((a) => a.topic === topicId);
  }
  function TopicIcon({ icon }: { icon: string }) {
    if (!icon) return <FileText size={28} className="text-orange-400" />;
    const Ic = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[icon];
    if (!Ic) return <FileText size={28} className="text-orange-400" />;
    return <Ic size={28} className="text-orange-400" />;
  }
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        title={t('faq.title', 'Sana nasıl yardımcı olabiliriz?')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('faq.help', 'Yardım') }]}
        image="/images/support-hero.jpg"
        align="center"
      >
        <div className="relative mx-auto w-full max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c502e]/80" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search', 'Ara...')}
              className="w-full rounded-2xl border-0 bg-[#f1b978] py-4 pl-12 pr-4 text-sm text-[#632811] shadow-xl outline-none focus:ring-2 focus:ring-orange-400"
            />
            {search && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-[#f1b978] shadow-2xl">
                {searching ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d88a67] border-t-orange-500" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-[#8c502e]/80">{t('faq.no_results', 'Sonuç bulunamadı.')}</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {searchResults.map((r) => (
                      <Link key={r.id} href={`/faq/${r.slug}`} onClick={() => setSearch('')}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[#632811] transition-colors hover:bg-orange-50 hover:text-orange-600">
                        <FileText size={14} className="shrink-0 text-[#8c502e]/80" />
                        {r.title}
                        <ChevronRight size={13} className="ml-auto text-slate-300" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 py-12">
        {rootTopics.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-xl font-black text-[#632811]">{t('faq.topics', 'Konular')}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rootTopics.map((topic) => {
                const count = getTopicArticles(topic.id).length;
                return (
                  <Link
                    key={topic.id}
                    href={`/faq/topic/${topic.slug}`}
                    className="group flex flex-col items-center rounded-2xl border border-[#d88a67] bg-[#f1b978] p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 transition-colors group-hover:bg-orange-100">
                      <TopicIcon icon={topic.icon} />
                    </div>
                    <h3 className="mb-1 font-black text-[#632811] group-hover:text-orange-500">{topic.name}</h3>
                    {topic.description && (
                      <p className="mb-3 text-xs text-[#8c502e]/80 line-clamp-2">{topic.description}</p>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white transition-colors group-hover:bg-orange-600">
                      {t('faq.browse', 'Göz At')}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        {rootTopics.map((topic) => {
          const topicArticles = getTopicArticles(topic.id);
          if (topicArticles.length === 0) return null;
          return (
            <div key={topic.id} className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-[#632811]">{topic.name}</h2>
                <Link href={`/faq/topic/${topic.slug}`} className="text-xs font-semibold text-orange-500 hover:underline">
                  {t('common.view_all', 'Tümünü Gör')}
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {topicArticles.slice(0, 6).map((article) => (
                  <Link
                    key={article.id}
                    href={`/faq/${article.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-[#d88a67] bg-[#f1b978] px-4 py-3 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f1b978] group-hover:bg-orange-50">
                      {article.pinned
                        ? <Pin size={13} className="text-orange-400" />
                        : <FileText size={13} className="text-[#8c502e]/80 group-hover:text-orange-400" />
                      }
                    </div>
                    <span className="line-clamp-1 text-sm font-semibold text-[#632811] group-hover:text-orange-600">
                      {article.title}
                    </span>
                    <ChevronRight size={14} className="ml-auto shrink-0 text-slate-300 group-hover:text-orange-400" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        {rootTopics.length === 0 && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{t('faq.empty', 'Henüz içerik yok')}</p>
          </div>
        )}
      </div>
      <JoinCta />
    </div>
  );
}