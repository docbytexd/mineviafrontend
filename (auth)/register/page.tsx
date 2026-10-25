'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
interface SettingsData {
  serverName: string;
  logo2: string;
  authVideo: string;
}
export default function RegisterPage() {
  const { t } = useSiteLang();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
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
      .then((data) => {
        if (data?.user) router.replace('/');
        else setChecking(false);
      })
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
  }, [router]);
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
      s.id = scriptId; s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true; s.onload = load;
      document.head.appendChild(s);
    } else { load(); }
    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, [turnstileSiteKey]);
  const passwordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  };
  const strengthLabel = () => {
    const s = passwordStrength();
    if (s <= 1) return { label: t('auth.register.strength_very_weak', 'Çok Zayıf'), color: '#ef4444' };
    if (s === 2) return { label: t('auth.register.strength_weak', 'Zayıf'), color: 'var(--accent)' };
    if (s === 3) return { label: t('auth.register.strength_medium', 'Orta'), color: '#eab308' };
    if (s === 4) return { label: t('auth.register.strength_strong', 'Güçlü'), color: '#22c55e' };
    return { label: t('auth.register.strength_very_strong', 'Çok Güçlü'), color: '#16a34a' };
  };
  const VALID_USERNAME = /^[a-zA-Z0-9_]+$/;
  const handleUsernameChange = (val: string) => {
    const filtered = val.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(filtered);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.length < 3) { setError(t('auth.register.username_min', 'Kullanıcı adı en az 3 karakter olmalıdır.')); return; }
    if (!VALID_USERNAME.test(username)) { setError(t('auth.register.username_chars', 'Kullanıcı adı sadece İngilizce harf, rakam ve alt çizgi (_) içerebilir.')); return; }
    if (password !== passwordConfirm) { setError(t('auth.register.password_mismatch', 'Şifreler eşleşmiyor.')); return; }
    if (password.length < 6) { setError(t('auth.register.password_min', 'Şifre en az 6 karakter olmalıdır.')); return; }
    if (turnstileSiteKey && !turnstileToken) { setError(t('auth.register.captcha', 'Lütfen robot olmadığınızı doğrulayın.')); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, passwordConfirm, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t('auth.register.failed', 'Kayıt başarısız.')); setLoading(false); return; }
      window.location.replace('/');
    } catch {
      setError(t('common.server_error', 'Sunucuya bağlanılamadı.'));
      setLoading(false);
    }
  };
  if (checking) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6d7a8]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  const strength = strengthLabel();
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
          <h2 className="text-4xl font-black text-white">{t('auth.register.welcome', 'Aramıza katıl')}</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">{t('auth.register.welcome_sub', 'Hesabını oluştur, sunucuya gir ve oynamaya başla.')}</p>
          <p className="mt-6 text-sm text-white/70">{t('auth.register.have_account', 'Zaten hesabınız var mı?')}{' '}<Link href="/login" className="font-bold text-[#7a3e1d] hover:underline">{t('site.login', 'Giriş Yap')}</Link></p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-6 flex items-center justify-center gap-3 md:hidden">
            {settings.logo2 ? <img src={settings.logo2} alt="" className="h-9 object-contain" /> : null}
            <span className="text-lg font-black text-[#7a3e1d]">{settings.serverName || 'Minevia'}</span>
          </Link>
          <h1 className="text-center text-2xl font-black text-[#7a3e1d]">{t('auth.register.title', 'Kayıt Ol')}</h1>
          <p className="mt-2 text-center text-sm text-[#7a3e1d]/60">{t('auth.register.subtitle', 'Hesap oluşturmak için formu doldurun.')}</p>
          {error && <div className="mt-5 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div className={field}>
              <User size={18} className="shrink-0 text-[#7a3e1d]/70" />
              <input type="text" value={username} onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder={t('auth.register.username', 'Kullanıcı Adı')} autoComplete="username" maxLength={32}
                className="flex-1 bg-transparent text-sm text-[#7a3e1d] outline-none placeholder:text-[#7a3e1d]/40" />
              {username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username) && <CheckCircle size={16} className="shrink-0 text-emerald-400" />}
            </div>
            <div className={field}>
              <Mail size={18} className="shrink-0 text-[#7a3e1d]/70" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.register.email', 'E-posta')} autoComplete="email"
                className="flex-1 bg-transparent text-sm text-[#7a3e1d] outline-none placeholder:text-[#7a3e1d]/40" />
            </div>
            <div>
              <div className={field}>
                <Lock size={18} className="shrink-0 text-[#7a3e1d]/70" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.register.password', 'Şifre')} autoComplete="new-password"
                  className="flex-1 bg-transparent text-sm text-[#7a3e1d] outline-none placeholder:text-[#7a3e1d]/40" />
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="shrink-0 text-[#7a3e1d]/50 hover:text-[#7a3e1d]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ backgroundColor: i <= passwordStrength() ? strength.color : 'rgba(247,206,158,0.2)' }} />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div className={field}>
              <Lock size={18} className="shrink-0 text-[#7a3e1d]/70" />
              <input type={showPasswordConfirm ? 'text' : 'password'} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder={t('auth.register.password_confirm', 'Şifre Tekrar')} autoComplete="new-password"
                className="flex-1 bg-transparent text-sm text-[#7a3e1d] outline-none placeholder:text-[#7a3e1d]/40" />
              <button type="button" onClick={() => setShowPasswordConfirm((p) => !p)} className="shrink-0 text-[#7a3e1d]/50 hover:text-[#7a3e1d]">
                {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {passwordConfirm && password === passwordConfirm && <CheckCircle size={16} className="shrink-0 text-emerald-400" />}
            </div>
            {turnstileSiteKey && <div className="flex justify-center"><div ref={turnstileRef} /></div>}
            <button type="submit" disabled={loading || (!!turnstileSiteKey && !turnstileToken)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e8883a] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#d4742a] disabled:opacity-60">
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7a3e1d]/30 border-t-[#7a3e1d]" />}
              {loading ? t('auth.register.submitting', 'Kayıt yapılıyor...') : t('auth.register.submit', 'Kayıt Ol')}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[#7a3e1d]/60 md:hidden">
            {t('auth.register.have_account', 'Zaten hesabınız var mı?')}{' '}
            <Link href="/login" className="font-bold text-[#7a3e1d] hover:underline">{t('site.login', 'Giriş Yap')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
