'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
function ForgotPasswordForm() {
  const { t } = useSiteLang();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('auth.forgot.failed', 'İşlem başarısız.'));
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t('common.server_error', 'Sunucuya bağlanılamadı.'));
    } finally {
      setLoading(false);
    }
  };
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7ce9e] px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#f1b978] p-8 shadow-lg text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-xl font-black text-[#632811]">{t('auth.forgot.sent_title', 'E-posta Gönderildi')}</h2>
          <p className="mt-2 text-sm text-[#8c502e]">
            {t('auth.forgot.sent_desc', 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.')}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            <ArrowLeft size={14} />
            {t('auth.forgot.back', 'Giriş Sayfasına Dön')}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7ce9e] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#f1b978] p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-[#632811]">{t('auth.forgot.title', 'Şifremi Unuttum')}</h1>
          <p className="mt-1 text-sm text-[#8c502e]/80">
            {t('auth.forgot.desc', 'E-posta adresinizi girin, size sıfırlama bağlantısı göndereceğiz.')}
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[#d88a67] bg-[#f7ce9e] px-4 py-3 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <Mail size={18} className="shrink-0 text-orange-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.forgot.email', 'E-posta adresiniz')}
              autoComplete="email"
              required
              className="flex-1 bg-transparent text-sm text-[#632811] outline-none placeholder:text-[#8c502e]/80"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {loading ? t('auth.forgot.submitting', 'Gönderiliyor...') : t('auth.forgot.submit', 'Sıfırlama Bağlantısı Gönder')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#8c502e]">
          <Link href="/login" className="inline-flex items-center gap-1 font-bold text-orange-500 hover:underline">
            <ArrowLeft size={12} />
            {t('auth.forgot.back', 'Giriş sayfasına dön')}
          </Link>
        </p>
      </div>
    </div>
  );
}
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f7ce9e]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}