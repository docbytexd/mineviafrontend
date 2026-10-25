'use client';
import { useState, useEffect } from 'react';
import { Copy, Check, Download, Gamepad2, Users, Wifi, WifiOff } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';

interface Settings {
  serverName: string; serverIp: string; logo1: string;
  javaEditionEnabled?: boolean; bedrockEditionEnabled?: boolean;
  javaIp?: string; javaPort?: string; bedrockIp?: string; bedrockPort?: string;
}
interface ServerStatus { online: boolean; players: { online: number; max: number }; ip?: string; }

export default function PlayPage() {
  const { t } = useSiteLang();
  const [settings, setSettings] = useState<Settings>({ serverName: '', serverIp: '', logo1: '' });
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/settings').then((r) => r.json()),
      fetch('/api/public/server-status').then((r) => r.json()).catch(() => null),
    ]).then(([s, status]) => {
      if (s) setSettings(s);
      if (status) setServerStatus(status);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const javaIp = settings.javaIp || settings.serverIp || '';
  const bedrockIp = settings.bedrockIp || settings.serverIp || '';
  const onlineCount = serverStatus?.players?.online ?? 0;
  const maxCount = serverStatus?.players?.max ?? 0;
  const isOnline = serverStatus?.online ?? false;

  function copyIp(ip: string, key: string) {
    if (!ip) return;
    navigator.clipboard.writeText(ip).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="h-8 w-8 animate-spin rounded-full border-4" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7ce9e] pb-16">
      <PageHero badge={t('play.title', 'Oyna')}
        title={settings.serverName ? t('play.join_named', "{name}'a Katıl", { name: settings.serverName }) : t('play.join', 'Sunucuya Katıl')}
        description={t('play.desc', 'Aşağıdaki IP adresini kopyalayarak sunucumuza bağlanabilirsin.')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('play.title', 'Oyna') }]}
        image="/images/shop-hero.jpg" />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 flex flex-col gap-2 rounded-2xl px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            {isOnline ? <Wifi size={20} style={{ color: '#22c55e' }} /> : <WifiOff size={20} style={{ color: '#ef4444' }} />}
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{isOnline ? t('play.online', 'Sunucu Çevrimiçi') : t('play.offline', 'Sunucu Çevrimdışı')}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{settings.serverName || t('play.mc_server', 'Minecraft Sunucusu')}</p>
            </div>
          </div>
          {isOnline && <div className="flex items-center gap-2">
            <Users size={15} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{onlineCount}</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/ {maxCount}</span>
          </div>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                <Gamepad2 size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text)' }}>{t('play.java', 'Java Edition')}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{settings.javaPort ? t('play.port', 'Port') + ': ' + settings.javaPort : t('play.default_port', 'Varsayılan Port')}</p>
              </div>
            </div>
            <div className="mb-3 flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
              <code className="text-sm font-mono font-bold" style={{ color: 'var(--text)' }}>{javaIp}{settings.javaPort && settings.javaPort !== '25565' ? ':' + settings.javaPort : ''}</code>
              <button onClick={() => copyIp(javaIp, 'java')} className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105" style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                {copied === 'java' ? <Check size={13} /> : <Copy size={13} />}
                {copied === 'java' ? t('play.copied', 'Kopyalandı') : t('play.copy', 'Kopyala')}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Java Edition 1.8 — 1.21 desteklenir.</p>
          </div>

          {settings.bedrockEditionEnabled ? (
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, #8b5cf6 15%, transparent)' }}>
                  <Gamepad2 size={20} style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>{t('play.bedrock', 'Bedrock Edition')}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{settings.bedrockPort ? t('play.port', 'Port') + ': ' + settings.bedrockPort : t('play.default_port', 'Varsayılan Port')}</p>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <code className="text-sm font-mono font-bold" style={{ color: 'var(--text)' }}>{bedrockIp}{settings.bedrockPort ? ':' + settings.bedrockPort : ''}</code>
                <button onClick={() => copyIp(bedrockIp, 'bedrock')} className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
                  {copied === 'bedrock' ? <Check size={13} /> : <Copy size={13} />}
                  {copied === 'bedrock' ? t('play.copied', 'Kopyalandı') : t('play.copy', 'Kopyala')}
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('play.bedrock_hint', 'PE, Xbox, PS4, Switch desteklenir.')}</p>
            </div>
          ) : (
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                  <Download size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>{t('play.download', 'Minecraft İndir')}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('play.download_hint', "Henüz Minecraft'ın yok mu?")}</p>
                </div>
              </div>
              <a href="https://www.minecraft.net/tr-tr/download" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}>
                <Download size={15} /> {t('play.download', 'Minecraft İndir')}
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--text)' }}>{t('play.how', 'Nasıl Bağlanılır?')}</h2>
          <ol className="space-y-3">
            {[t('play.step1', "Minecraft Java Edition'ı başlat."), t('play.step2', '"Çok Oyunculu" menüsüne gir.'), t('play.step3', '"Sunucu Ekle" butonuna tıkla.'), t('play.step4', 'Sunucu adresini yapıştır: {ip}', { ip: javaIp || 'sunucu.ip' }), t('play.step5', '"Bitti" ve "Sunucuya Bağlan"a tıkla.')].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: 'var(--accent)' }}>{i + 1}</span>
                <span className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}
