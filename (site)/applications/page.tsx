'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, ArrowRight, Lock } from 'lucide-react';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
import { useSiteLang } from '@/lib/site/SiteLangContext';
interface Form {
  id: string;
  title: string;
  slug: string;
  description: string;
  requireLogin: boolean;
}
export default function ApplyPage() {
  const { t } = useSiteLang();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/public/forms')
      .then((r) => r.json())
      .then((d) => { if (d.forms) setForms(d.forms); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        badge={t('site.nav.applications', 'Başvurular')}
        title={t('applications.title', 'Başvuru Formları')}
        description={t('applications.empty_desc', 'Aşağıdaki formları doldurarak başvurunu gerçekleştirebilirsin.')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('site.nav.applications', 'Başvurular') }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <FileText size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{t('applications.empty', 'Aktif başvuru formu yok')}</p>
            <p className="mt-1 text-sm text-[#8c502e]/80">{t('applications.empty_desc', 'Şu an için açık bir başvuru formu bulunmuyor.')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/apply/${form.slug}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-orange-200"
              >
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 group-hover:bg-orange-100 transition-colors">
                      <FileText size={20} className="text-orange-500" />
                    </div>
                    {form.requireLogin && (
                      <span className="flex items-center gap-1 rounded-full bg-[#f1b978] px-2.5 py-1 text-[10px] font-bold text-[#8c502e]">
                        <Lock size={10} /> {t('applications.login_required', 'Giriş Gerekli')}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2 font-black text-[#632811] group-hover:text-orange-500 transition-colors">{form.title}</h3>
                  {form.description && (
                    <p className="text-sm text-[#8c502e]/80 line-clamp-2">{form.description}</p>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-sm font-bold text-orange-500">
                  {t('applications.apply', 'Başvur')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <JoinCta />
    </div>
  );
}