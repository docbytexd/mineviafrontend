'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
function ResetPasswordForm() {
  const { t } = useSiteLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('auth.reset.mismatch', 'Şifreler eşleşmiyor.'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.reset.min', 'Şifre en az 6 karakter olmalıdır.'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('auth.reset.failed', 'İşlem başarısız.'));
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2500);
      }
    } catch {
      setError(t('common.server_error', 'Sunucuya bağlanılamadı.'));
    } finally {
      setLoading(false);
    }
  };
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7ce9e] px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#f1b978] p-8 shadow-lg text-center">
          <p className="text-sm font-semibold text-red-500">{t('auth.reset.invalid', 'Geçersiz bağlantı. Lütfen tekrar şifre sıfırlama isteği gönderin.')}</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-sm font-bold text-orange-500 hover:underline">{t('auth.login.forgot', 'Şifremi Unuttum')}</Link>
        </div>
      </div>
    );
  }
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7ce9e] px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#f1b978] p-8 shadow-lg text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-xl font-black text-[#632811]">{t('auth.reset.changed_title', 'Şifre Değiştirildi')}</h2>
          <p className="mt-2 text-sm text-[#8c502e]">{t('auth.reset.changed_desc', 'Şifreniz başarıyla sıfırlandı. Giriş sayfasına yönlendiriliyorsunuz...')}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7ce9e] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#f1b978] p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-[#632811]">{t('auth.reset.title', 'Yeni Şifre Belirle')}</h1>
          <p className="mt-1 text-sm text-[#8c502e]/80">{t('auth.reset.desc', 'Yeni şifrenizi girin.')}</p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[#d88a67] bg-[#f7ce9e] px-4 py-3 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <Lock size={18} className="shrink-0 text-orange-400" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.reset.new', 'Yeni şifre')}
              autoComplete="new-password"
              required
              className="flex-1 bg-transparent text-sm text-[#632811] outline-none placeholder:text-[#8c502e]/80"
            />
            <button type="button" onClick={() => setShowPw((p) => !p)} className="shrink-0 text-[#8c502e]/80 hover:text-[#8c502e]">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#d88a67] bg-[#f7ce9e] px-4 py-3 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <Lock size={18} className="shrink-0 text-orange-400" />
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t('auth.reset.confirm', 'Şifreyi tekrarla')}
              autoComplete="new-password"
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
            {loading ? t('auth.reset.submitting', 'Kaydediliyor...') : t('auth.reset.submit', 'Şifremi Sıfırla')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#8c502e]">
          <Link href="/login" className="font-bold text-orange-500 hover:underline">{t('site.login', 'Giriş Yap')}</Link>
        </p>
      </div>
    </div>
  );
}
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f7ce9e]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}