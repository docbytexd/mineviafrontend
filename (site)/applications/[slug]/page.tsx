'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, CheckCircle, Lock, ChevronRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
import { useServerName } from '@/lib/site/useServerName';
import { useSiteLang } from '@/lib/site/SiteLangContext';
interface FormField {
  id: string;
  type: string;
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
  options: string[];
  order: number;
}
interface FormData {
  id: string;
  title: string;
  slug: string;
  description: string;
  requireLogin: boolean;
  oncePerUser: boolean;
  fields: FormField[];
}
export default function ApplyFormPage() {
  const { t } = useSiteLang();
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    fetch(`/api/public/forms/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.form) setForm(d.form);
        else setError(d.error || t('applications.not_found', 'Form bulunamadı.'));
        setLoading(false);
      })
      .catch(() => { setError(t('common.error', 'Bir hata oluştu.')); setLoading(false); });
  }, [slug]);
  const serverName = useServerName();
  useEffect(() => {
    if (form) document.title = `${serverName} · ${form.title}`;
  }, [form, serverName]);
  function setAnswer(fieldId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    setError('');
    const payload = form.fields.map((f) => ({
      fieldId: f.id,
      label: f.label,
      value: answers[f.id] || '',
    }));
    const res = await fetch(`/api/public/forms/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: payload }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error || t('common.error', 'Bir hata oluştu.')); return; }
    setSuccess(true);
  }
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  if (success) return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h1 className="mb-2 text-2xl font-black text-[#632811]">{t('applications.success_title', 'Başvurunuz Alındı!')}</h1>
        <p className="mb-6 text-sm text-[#8c502e]">{t('applications.success_desc', 'Başvurunuz incelemeye alınmıştır. Sonuç size bildirilecektir.')}</p>
        <Link href="/apply" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600">
          {t('applications.back_to_forms', 'Formlara Dön')} <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        title={form?.title || t('applications.form', 'Başvuru Formu')}
        description={form?.description}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('site.nav.applications', 'Başvurular'), href: '/apply' }, { label: form?.title || slug }]}
      />
      <div className="mx-auto max-w-2xl px-4 py-8">
        {error && !form && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <Lock size={40} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{error}</p>
            <Link href="/apply" className="mt-4 text-sm text-orange-500 hover:underline">{t('common.back', 'Geri Dön')}</Link>
          </div>
        )}
        {form && (
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
            <div className="border-b border-[#d88a67] px-6 py-4">
              <h2 className="font-bold text-[#632811]">{t('applications.form', 'Başvuru Formu')}</h2>
              {form.requireLogin && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8c502e]/80">
                  <Lock size={11} /> {t('applications.requires_login', 'Bu form giriş gerektiriyor')}
                </p>
              )}
            </div>
            <div className="space-y-5 p-6">
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">{error}</p>}
              {form.fields.sort((a, b) => a.order - b.order).map((field) => (
                <div key={field.id}>
                  <label className="mb-1.5 block text-sm font-bold text-[#632811]">
                    {field.label}
                    {field.required && <span className="ml-1 text-red-400">*</span>}
                  </label>
                  {field.description && (
                    <p className="mb-2 text-xs text-[#8c502e]/80">{field.description}</p>
                  )}
                  {field.type === 'short_text' && (
                    <input type="text" value={answers[field.id] || ''} onChange={(e) => setAnswer(field.id, e.target.value)}
                      placeholder={field.placeholder} required={field.required}
                      className="w-full rounded-xl border border-[#d88a67] px-4 py-2.5 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  )}
                  {field.type === 'long_text' && (
                    <textarea value={answers[field.id] || ''} onChange={(e) => setAnswer(field.id, e.target.value)}
                      placeholder={field.placeholder} required={field.required} rows={5}
                      className="w-full resize-none rounded-xl border border-[#d88a67] px-4 py-3 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  )}
                  {field.type === 'email' && (
                    <input type="email" value={answers[field.id] || ''} onChange={(e) => setAnswer(field.id, e.target.value)}
                      placeholder={field.placeholder} required={field.required}
                      className="w-full rounded-xl border border-[#d88a67] px-4 py-2.5 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  )}
                  {field.type === 'number' && (
                    <input type="number" value={answers[field.id] || ''} onChange={(e) => setAnswer(field.id, e.target.value)}
                      placeholder={field.placeholder} required={field.required}
                      className="w-full rounded-xl border border-[#d88a67] px-4 py-2.5 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  )}
                  {field.type === 'date' && (
                    <input type="date" value={answers[field.id] || ''} onChange={(e) => setAnswer(field.id, e.target.value)}
                      required={field.required}
                      className="w-full rounded-xl border border-[#d88a67] px-4 py-2.5 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  )}
                  {field.type === 'select' && (
                    <select value={answers[field.id] || ''} onChange={(e) => setAnswer(field.id, e.target.value)}
                      required={field.required}
                      className="w-full rounded-xl border border-[#d88a67] px-4 py-2.5 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                      <option value="">{t('common.select', 'Seçin...')}</option>
                      {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                  {field.type === 'radio' && (
                    <div className="space-y-2">
                      {field.options.map((opt) => (
                        <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d88a67] px-4 py-2.5 transition-colors hover:bg-[#f7ce9e]"
                          style={{ borderColor: answers[field.id] === opt ? 'var(--accent)' : 'var(--border)', backgroundColor: answers[field.id] === opt ? '#fff7ed' : 'transparent' }}>
                          <input type="radio" name={field.id} value={opt} checked={answers[field.id] === opt}
                            onChange={() => setAnswer(field.id, opt)} required={field.required} className="accent-orange-500" />
                          <span className="text-sm font-semibold text-[#632811]">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {field.type === 'checkbox' && (
                    <div className="space-y-2">
                      {field.options.map((opt) => {
                        const selected = (answers[field.id] || '').split(',').filter(Boolean);
                        const isChecked = selected.includes(opt);
                        return (
                          <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d88a67] px-4 py-2.5 transition-colors hover:bg-[#f7ce9e]"
                            style={{ borderColor: isChecked ? 'var(--accent)' : 'var(--border)', backgroundColor: isChecked ? '#fff7ed' : 'transparent' }}>
                            <input type="checkbox" checked={isChecked}
                              onChange={() => {
                                const next = isChecked ? selected.filter((s) => s !== opt) : [...selected, opt];
                                setAnswer(field.id, next.join(','));
                              }} className="accent-orange-500" />
                            <span className="text-sm font-semibold text-[#632811]">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Link href="/apply" className="flex-1 rounded-xl border border-[#d88a67] py-2.5 text-center text-sm font-semibold text-[#8c502e] transition-colors hover:bg-[#f7ce9e]">
                  İptal
                </Link>
                <button type="submit" disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60">
                  {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Send size={14} /> Başvur</>}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
      <JoinCta />
    </div>
  );
}