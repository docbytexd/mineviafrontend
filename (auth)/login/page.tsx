'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';

interface SettingsData {
  serverName: string;
  logo2: string;
  authVideo: string;
}

function LoginForm() {
  const { t } = useSiteLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState<SettingsData>({ serverName: '', logo2: '', authVideo: '' });
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.user) router.replace(redirectTo); else setChecking(false); })
      .catch(() => setChecking(false));
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setSettings({ serverName: d.serverName || '', logo2: d.logo2 || d.logo1 || '', authVideo: d.authVideo || '' });
          if (d.turnstileSiteKey) setTurnstileSiteKey(d.turnstileSiteKey);
        }
      })
      .catch(() => {});
  }, [router, redirectTo]);

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileRef.current) return;
    const scriptId = 'cf-turnstile-script';
    const load = () => {
      if (window.turnstile && turnstileRef.current && !turnstileWidgetId.current) {
        turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: turnstileSiteKey,
          callback: (token: string) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
          theme: 'dark',
        });
      }
    };
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      s.onload = load;
      document.head.appendChild(s);
    } else { load(); }
    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, [turnstileSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (turnstileSiteKey && !turnstileToken) {
      setError(t('auth.login.captcha', 'Lütfen robot olmadığınızı doğrulayın.'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('auth.login.failed', 'Giriş başarısız.')); setLoading(false); return; }
      if (data.requiresTwoFactor) {
        window.location.replace(`/two-factor?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }
      window.location.replace(redirectTo);
    } catch {
      setError(t('common.server_error', 'Sunucuya bağlanılamadı.'));
      setLoading(false);
    }
  };

  if (checking) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6d7a8]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8c502e] border-t-[#f7ce9e]" />
    </div>
  );

  const field = 'flex items-center gap-3 rounded-2xl border border-[#e0a56a] bg-white/40 px-4 py-3 focus-within:border-[#c9783a] focus-within:ring-2 focus-within:ring-[#c9783a]/25 transition-all';

  return (
    <div className="flex min-h-screen flex-col bg-[#f6d7a8] md:flex-row">
      <div className="relative hidden overflow-hidden md:block md:w-1/2">
        {settings.authVideo ? (
          <video src={settings.authVideo} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <img src="/images/auth-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#3b2416]/85 via-[#3b2416]/25 to-transparent" />
        <Link href="/" className="absolute left-10 top-10 flex items-center gap-3">
          {settings.logo2 ? <img src={settings.logo2} alt="" className="h-10 object-contain" /> : null}
          <span className="text-xl font-black tracking-wide text-white">{settings.serverName || 'Minevia'}</span>
        </Link>
        <div className="absolute bottom-12 left-10 right-10">
          <h2 className="text-4xl font-black text-white">{t('auth.login.welcome', 'Tekrar hoş geldiniz')}</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
            {t('auth.login.welcome_sub', 'Hesabına gir, sunucuya katıl ve maceraya devam et.')}
          </p>
          <p className="mt-6 text-sm text-white/70">
            {t('auth.login.no_account', 'Hesabınız yok mu?')}{' '}
            <Link href="/register" className="font-bold text-[#7a3e1d] hover:underline">{t('site.register', 'Kayıt Ol')}</Link>
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center justify-center gap-3 md:hidden">
            {settings.logo2 ? <img src={settings.logo2} alt="" className="h-9 object-contain" /> : null}
            <span className="text-lg font-black text-[#7a3e1d]">{settings.serverName || 'Minevia'}</span>
          </Link>
          <h1 className="text-center text-2xl font-black text-[#7a3e1d]">{t('auth.login.title', 'Giriş Yap')}</h1>
          <p className="mt-2 text-center text-sm text-[#7a3e1d]/60">
            {t('auth.login.subtitle', 'Tekrar hoş geldiniz. Hesabına giriş yap.')}
          </p>
          {error && <div className="mt-5 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div className={field}>
              <User size={18} className="shrink-0 text-[#7a3e1d]/70" />
              <input type="text" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={t('auth.login.username', 'Kullanıcı adı veya e-posta')} autoComplete="username"
                className="flex-1 bg-transparent text-sm text-[#7a3e1d] outline-none placeholder:text-[#7a3e1d]/40" />
            </div>
            <div className={field}>
              <Lock size={18} className="shrink-0 text-[#7a3e1d]/70" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.login.password', 'Şifre')} autoComplete="current-password"
                className="flex-1 bg-transparent text-sm text-[#7a3e1d] outline-none placeholder:text-[#7a3e1d]/40" />
              <button type="button" onClick={() => setShowPassword((p) => !p)} className="shrink-0 text-[#7a3e1d]/50 hover:text-[#7a3e1d]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-end text-xs">
              <Link href="/forgot-password" className="font-bold uppercase tracking-wider text-[#7a3e1d]/70 hover:text-[#7a3e1d]">
                {t('auth.login.forgot', 'Şifremi Unuttum')}
              </Link>
            </div>
            {turnstileSiteKey && <div className="flex justify-center"><div ref={turnstileRef} /></div>}
            <button type="submit" disabled={loading || (!!turnstileSiteKey && !turnstileToken)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e8883a] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#d4742a] disabled:opacity-60">
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7a3e1d]/30 border-t-[#7a3e1d]" />}
              {loading ? t('auth.login.submitting', 'Giriş yapılıyor...') : t('auth.login.submit', 'Giriş Yap')}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[#7a3e1d]/60 md:hidden">
            {t('auth.login.no_account', 'Hesabınız yok mu?')}{' '}
            <Link href="/register" className="font-bold text-[#7a3e1d] hover:underline">{t('site.register', 'Kayıt Ol')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f6d7a8]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8c502e] border-t-[#f7ce9e]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
