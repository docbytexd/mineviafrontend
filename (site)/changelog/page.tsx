'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Pin, Tag, Calendar, FileText } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
interface ChangelogTag {
  id: string;
  name: string;
  color: string;
}
interface ChangelogItem {
  id: string;
  version: string;
  title: string;
  content: string;
  tags: ChangelogTag[];
  releaseDate: string;
  pinned: boolean;
}
export default function ChangelogPage() {
  const { t } = useSiteLang();
  const [logs, setLogs] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetch('/api/public/changelog')
      .then((r) => r.json())
      .then((d) => { if (d.logs) setLogs(d.logs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  const allTags = Array.from(
    new Map(logs.flatMap((l) => l.tags).map((t) => [t.id, t])).values()
  );
  const filtered = activeTag ? logs.filter((l) => l.tags.some((t) => t.id === activeTag)) : logs;
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        badge={t('changelog.badge', 'Changelog')}
        title={t('changelog.title', 'Güncelleme Notları')}
        description={t('changelog.desc', 'Sunucudaki yeni özellikler, düzeltmeler ve değişiklikler.')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('changelog.title', 'Güncelleme Notları') }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {allTags.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-[#8c502e]">
              <Tag size={12} /> {t('common.filter', 'Filtrele:')}
            </span>
            <button
              onClick={() => setActiveTag(null)}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
              style={{
                backgroundColor: activeTag === null ? 'var(--accent)' : 'var(--bg)',
                color: activeTag === null ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t('common.all', 'Tümü')}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
                className="rounded-full px-3 py-1.5 text-xs font-bold transition-all"
                style={{
                  backgroundColor: activeTag === tag.id ? tag.color : `${tag.color}20`,
                  color: activeTag === tag.id ? '#fff' : tag.color,
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <FileText size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{t('changelog.empty', 'Güncelleme notu yok')}</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 h-full w-px bg-slate-200" />
            <div className="space-y-4">
              {filtered.map((log) => {
                const isExpanded = expanded.has(log.id);
                return (
                  <div key={log.id} className="relative pl-14">
                    <div
                      className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white shadow-md"
                      style={{ backgroundColor: log.pinned ? 'var(--accent)' : '#1e293b' }}
                    >
                      {log.pinned
                        ? <Pin size={18} className="text-white" />
                        : <span className="text-[10px] font-black text-white">{log.version || 'v'}</span>
                      }
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                      <div className="p-5">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              {log.version && (
                                <span className="rounded-full bg-[#f1b978] px-2.5 py-1 text-[11px] font-black text-[#8c502e]">
                                  {log.version}
                                </span>
                              )}
                              {log.pinned && (
                                <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-600">
                                  <Pin size={10} /> {t('changelog.pinned', 'Sabitlendi')}
                                </span>
                              )}
                              {log.tags.map((tag) => (
                                <span key={tag.id} className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                                  style={{ backgroundColor: tag.color }}>
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                            <h3 className="text-base font-black text-[#632811]">{log.title}</h3>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#8c502e]/80 shrink-0">
                            <Calendar size={12} />
                            {formatDate(log.releaseDate)}
                          </div>
                        </div>
                        {log.content && (
                          <>
                            <div
                              className={`prose prose-sm max-w-none text-[#8c502e] ${!isExpanded ? 'line-clamp-3' : ''}`}
                              dangerouslySetInnerHTML={{ __html: log.content }}
                            />
                            {log.content.length > 200 && (
                              <button
                                onClick={() => toggleExpand(log.id)}
                                className="mt-2 text-xs font-bold text-orange-500 hover:underline"
                              >
                                {isExpanded ? t('changelog.show_less', 'Daha az göster') : t('changelog.read_more', 'Devamını oku')}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <JoinCta />
    </div>
  );
}