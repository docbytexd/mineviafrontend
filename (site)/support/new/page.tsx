'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, ChevronDown, Info, ChevronRight } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
}
export default function NewTicketPage() {
  const { t } = useSiteLang();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subject, setSubject] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/public/support/categories')
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
  }, []);
  function selectCategory(cat: Category) {
    setCategoryId(cat.id);
    setSelectedCat(cat);
    setCatOpen(false);
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) { setError(t('support.required', 'Konu ve mesaj zorunludur.')); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/me/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, categoryId: categoryId || null, content }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || t('common.error', 'Bir hata oluştu.')); return; }
    router.push('/support');
  }
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        title={t('support.new_title', 'Yeni Destek Talebi')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('support.title', 'Destek'), href: '/support' }, { label: t('support.new', 'Yeni Talep') }]}
        image="/images/support-hero.jpg"
      />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <form onSubmit={handleSubmit} className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
            <div className="border-b border-[#d88a67] px-6 py-4">
              <h2 className="font-bold text-[#632811]">{t('support.info_title', 'Talep Bilgileri')}</h2>
            </div>
            <div className="space-y-5 p-6">
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">{error}</p>}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#8c502e]">
                  {t('support.subject', 'Başlık')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('support.subject_ph', 'Başlık girin.')}
                  maxLength={200}
                  className="w-full rounded-xl border border-[#d88a67] px-4 py-2.5 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
              {categories.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#8c502e]">{t('support.category', 'Kategori')}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCatOpen((p) => !p)}
                      className="flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all"
                      style={{
                        borderColor: selectedCat ? selectedCat.color : 'var(--border)',
                        borderStyle: catOpen ? 'dashed' : 'solid',
                        color: selectedCat ? selectedCat.color : '#94a3b8',
                        backgroundColor: selectedCat ? `${selectedCat.color}10` : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {selectedCat && (
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedCat.color }} />
                        )}
                        <span className="font-semibold">
                          {selectedCat ? selectedCat.name : 'Kategori seçin.'}
                        </span>
                      </div>
                      <ChevronDown size={15} className={`transition-transform ${catOpen ? 'rotate-180' : ''}`} style={{ color: selectedCat ? selectedCat.color : '#94a3b8' }} />
                    </button>
                    {catOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-[#d88a67] bg-[#f1b978] shadow-xl">
                          {categories.map((cat, i) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => selectCategory(cat)}
                              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[#f7ce9e] ${i > 0 ? 'border-t border-[#d88a67]' : ''}`}
                            >
                              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                              <div>
                                <p className="font-semibold text-[#632811]">{cat.name}</p>
                                {cat.description && (
                                  <p className="text-[11px] text-[#8c502e]/80">{cat.description}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {selectedCat?.description && (
                    <p className="mt-1.5 text-[11px] text-[#8c502e]/80">{selectedCat.description}</p>
                  )}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#8c502e]">
                  {t('support.message', 'Mesaj')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('support.message_ph', 'Yetkili ekibimize iletmek istediğiniz mesajı girin.')}
                  rows={8}
                  maxLength={10000}
                  className="w-full resize-none rounded-xl border border-[#d88a67] px-4 py-3 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                <p className="mt-1 text-right text-[11px] text-[#8c502e]/80">{content.length}/10000</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Link
                  href="/support"
                  className="flex-1 rounded-xl border border-[#d88a67] py-2.5 text-center text-sm font-semibold text-[#8c502e] transition-colors hover:bg-[#f7ce9e]"
                >
                  {t('common.cancel', 'İptal')}
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <><Send size={14} /> {t('common.submit', 'Gönder')}</>
                  )}
                </button>
              </div>
            </div>
          </form>
          <div className="w-full shrink-0 space-y-4 lg:w-72">
            <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
              <div className="border-b border-[#d88a67] px-5 py-4">
                <h3 className="font-bold text-[#632811]">{t('support.info', 'Bilgilendirme')}</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-orange-50 p-3">
                  <Info size={15} className="mt-0.5 shrink-0 text-orange-500" />
                  <p className="text-xs text-[#8c502e]">
                    {t('support.info_desc', 'Talep oluşturmadan önce yardım merkezine bakmayı unutmayınız.')}
                  </p>
                </div>
                <Link
                  href="/faq"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d88a67] py-2.5 text-sm font-semibold text-[#8c502e] transition-colors hover:bg-[#f7ce9e]"
                >
                  {t('support.go_help', 'Yardım Merkezine Git')} <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}