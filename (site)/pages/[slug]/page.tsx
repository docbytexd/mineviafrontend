'use client';
import { useState, useEffect } from 'react';
import JoinCta from '@/components/JoinCta';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import { useServerName } from '@/lib/site/useServerName';
interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
}
export default function CustomPage() {
  const { t } = useSiteLang();
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    fetch(`/api/public/pages/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.page) setPage(d.page);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);
  const serverName = useServerName();
  useEffect(() => {
    if (page) document.title = `${serverName} · ${page.title}`;
  }, [page, serverName]);
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  if (notFound) return <NotFound />;
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-[#8c502e]/80">
          <Link href="/" className="transition-colors hover:text-[#8c502e]">{t('common.home', 'Anasayfa')}</Link>
          <ChevronRight size={12} />
          <span className="text-[#8c502e]">{page?.title}</span>
        </nav>
        <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
          <div className="border-b border-[#d88a67] px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <FileText size={20} className="text-orange-500" />
              </div>
              <h1 className="text-2xl font-black text-[#632811]">{page?.title}</h1>
            </div>
          </div>
          <div className="px-8 py-6">
            <div
              className="rich-content-light max-w-none text-sm leading-relaxed text-[#632811]"
              dangerouslySetInnerHTML={{ __html: page?.content || '' }}
            />
          </div>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}
function NotFound() {
  return <div />;
}