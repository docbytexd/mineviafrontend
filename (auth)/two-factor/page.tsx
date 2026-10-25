'use client';
import { useState, Suspense, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
function TwoFactorForm() {
  const { t } = useSiteLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('auth.2fa.failed', 'Doğrulama başarısız.'));
        setCode('');
      } else {
        window.location.replace(redirectTo);
      }
    } catch {
      setError(t('common.server_error', 'Sunucuya bağlanılamadı.'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7ce9e] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#f1b978] p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
            <ShieldCheck size={28} className="text-orange-500" />
          </div>
          <h1 className="text-2xl font-black text-[#632811]">{t('auth.2fa.title', 'İki Faktörlü Doğrulama')}</h1>
          <p className="mt-1 text-sm text-[#8c502e]/80">
            {t('auth.2fa.desc', 'Google Authenticator uygulamasındaki 6 haneli kodu girin.')}
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9A-Za-z]*"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
            placeholder="000000"
            required
            className="w-full rounded-2xl border border-[#d88a67] bg-[#f7ce9e] px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300 placeholder:tracking-normal"
          />
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {loading ? t('auth.2fa.submitting', 'Doğrulanıyor...') : t('auth.2fa.submit', 'Doğrula')}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-[#8c502e]/80">
          {t('auth.2fa.backup', 'Yedek kodunuz varsa onu da kullanabilirsiniz.')}
        </p>
        <p className="mt-3 text-center text-sm">
          <Link href="/login" className="font-bold text-orange-500 hover:underline text-xs">
            {t('auth.2fa.other', 'Farklı hesapla giriş yap')}
          </Link>
        </p>
      </div>
    </div>
  );
}
export default function TwoFactorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f7ce9e]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
      </div>
    }>
      <TwoFactorForm />
    </Suspense>
  );
}