'use client';
import { useState, useEffect } from 'react';
import JoinCta from '@/components/JoinCta';
import Link from 'next/link';
import { User, Mail, Wallet, ShoppingBag, FileText, Clock, Pencil, History, Crown } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';

interface UserProfile {
  id: string; username: string; email: string; balance: number; totalSpent: number;
  banned: boolean; minecraftUuid: string | null; lastLoginAt: string | null; createdAt: string;
  discordId: string | null; discordUsername: string | null; discordAvatar: string | null;
  role: { id: string; name: string; color: string } | null;
}
interface Ticket {
  id: string; number: number; subject: string;
  category: { name: string; color: string } | null;
  status: { name: string; color: string; isClosed: boolean } | null;
  messageCount: number; lastReplyAt: string; createdAt: string;
}
interface Order {
  id: string; items: { name: string; quantity: number; price: number }[];
  total: number; discount: number; status: string; createdAt: string;
}
interface Application { id: string; formTitle: string; status: string; createdAt: string; }
interface PaymentHistory { id: string; credits: number; status: string; createdAt: string; }
type Tab = 'profile' | 'orders' | 'subscriptions' | 'applications' | 'credits' | 'edit';
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', accepted: '#22c55e', rejected: '#ef4444', completed: '#22c55e', cancelled: '#ef4444', success: '#22c55e', paid: '#22c55e',
};

function DiscordIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.02.015.04.03.05a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function ProfilePage() {
  const { t, locale } = useSiteLang();
  const [discordStatus, setDiscordStatus] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [editErr, setEditErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [discordCanLink, setDiscordCanLink] = useState(false);
  const [discordGuild, setDiscordGuild] = useState('');
  const [unlinking, setUnlinking] = useState(false);
  const dateLocale = locale === 'en' ? 'en-US' : 'tr-TR';

  useEffect(() => {
    fetch('/api/me/profile').then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setEditEmail(d.user.email || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch('/api/me/tickets').then((r) => r.json()).then((d) => setTickets(d.tickets || [])).catch(() => {});
    fetch('/api/me/orders').then((r) => r.json()).then((d) => setOrders(d.orders || [])).catch(() => {});
    fetch('/api/me/applications').then((r) => r.json()).then((d) => setApplications(d.applications || [])).catch(() => {});
    fetch('/api/payment/history?limit=20').then((r) => r.json()).then((d) => setHistory(d.payments || [])).catch(() => {});
    fetch('/api/public/discord-bot').then((r) => r.json()).then((d) => {
      setDiscordEnabled(!!d.enabled);
      setDiscordCanLink(!!d.canLink);
      setDiscordGuild(d.guildName || '');
    }).catch(() => {});
    try {
      const q = new URLSearchParams(window.location.search).get('discord');
      if (q) {
        setDiscordStatus(q);
        const url = new URL(window.location.href);
        url.searchParams.delete('discord');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    } catch {}
  }, []);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function formatDateTime(d: string) {
    return new Date(d).toLocaleString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function statusLabel(s: string) {
    const map: Record<string, string> = {
      pending: t('profile.status.pending', 'Bekliyor'),
      accepted: t('profile.status.accepted', 'Kabul Edildi'),
      rejected: t('profile.status.rejected', 'Reddedildi'),
      completed: t('profile.status.completed', 'Tamamlandı'),
      success: t('profile.status.completed', 'Tamamlandı'),
      paid: t('profile.status.completed', 'Tamamlandı'),
    };
    return map[s] || s;
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="h-8 w-8 animate-spin rounded-full border-4" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
    </div>
  );
  if (!user) return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center" style={{ background: 'var(--bg)' }}>
      <p className="font-bold" style={{ color: 'var(--text-muted)' }}>{t('profile.login_required', 'Giriş yapmalısınız.')}</p>
      <Link href="/login" className="mt-4 text-sm hover:underline" style={{ color: 'var(--accent)' }}>{t('site.login', 'Giriş Yap')}</Link>
    </div>
  );

  const NAV = [
    { g: t('profile.account', 'HESABIM'), items: [
      { id: 'profile' as const, label: t('profile.title', 'Profil'), icon: User },
      { id: 'orders' as const, label: t('profile.orders', 'Siparişler'), icon: ShoppingBag },
      { id: 'subscriptions' as const, label: t('profile.subscriptions', 'Abonelikler'), icon: Crown },
      { id: 'applications' as const, label: t('site.nav.applications', 'Başvurular'), icon: FileText },
    ]},
    { g: t('profile.tools', 'ARAÇLAR'), items: [
      { id: 'edit' as const, label: t('profile.edit', 'Profil Düzenle'), icon: Pencil },
      { id: 'credits' as const, label: t('credits.history', 'Kredi Geçmişi'), icon: History },
    ]},
  ];

  return (
    <div className="min-h-screen pb-0" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--accent)' }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}><User size={14} /></span>
          {t('profile.title', 'Profil')}
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-56">
            <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <img src={`https://mc-heads.net/avatar/${user.username}/80`} alt="" className="mx-auto h-16 w-16 rounded-2xl" />
              <p className="mt-3 text-sm font-black">{user.username}</p>
              {user.role && <span className="mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase text-white" style={{ backgroundColor: user.role.color || 'var(--accent)' }}>{user.role.name}</span>}
              {user.discordId && (
                <p className="mt-2 truncate text-[11px] font-semibold" style={{ color: '#5865F2' }}>
                  {user.discordUsername || t('profile.discord_linked', 'Bağlı')}
                </p>
              )}
            </div>
            <nav className="mt-4 space-y-4">
              {NAV.map((g) => (
                <div key={g.g}>
                  <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{g.g}</p>
                  {g.items.map(({ id, label, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => setTab(id)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-200 hover:translate-x-0.5"
                      style={{ background: tab === id ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', color: tab === id ? 'var(--accent)' : 'var(--text-muted)' }}
                      onMouseEnter={(e) => { if (tab !== id) e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 8%, transparent)'; }}
                      onMouseLeave={(e) => { if (tab !== id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
          <div className="min-w-0 flex-1 space-y-5">
            {(tab === 'profile' || tab === 'edit') && (
              <>
                <div className="overflow-hidden rounded-2xl border relative" style={{ borderColor: 'var(--border)' }}>
                  <img src="/images/auth-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--bg-elevated) 88%, transparent) 0%, color-mix(in srgb, var(--accent) 35%, transparent) 100%)' }} />
                  <div className="relative flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:px-6 sm:pt-6 sm:pb-5">
                    <img src={`https://mc-heads.net/body/${user.username}/180`} alt="" className="mx-auto h-24 w-auto object-contain sm:mx-0 sm:h-28" />
                    <div className="mb-1 min-w-0 flex-1 text-center sm:mb-2 sm:text-left">
                      <h1 className="truncate text-2xl font-black">{user.username}</h1>
                      {user.role && <span className="mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase text-white" style={{ backgroundColor: user.role.color || 'var(--accent)' }}>{user.role.name}</span>}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:mb-2 sm:justify-end">
                      {(discordEnabled || user.discordId) && (
                        user.discordId ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-black uppercase text-white" style={{ background: '#5865F2' }}>
                            <DiscordIcon size={14} />
                            {user.discordUsername || t('profile.discord_linked', 'Bağlı')}
                          </span>
                        ) : (
                          <a href="/api/auth/discord" className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-black uppercase text-white" style={{ background: '#5865F2' }}>
                            <DiscordIcon size={14} />
                            {t('profile.discord_match', 'Discord Eşle')}
                          </a>
                        )
                      )}
                      <button type="button" onClick={() => setTab('edit')} className="rounded-xl px-4 py-2 text-[11px] font-black uppercase" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>{t('profile.edit', 'Profil Düzenle')}</button>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}><Mail size={18} /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{t('profile.email', 'E-posta')}</p>
                      <p className="text-sm font-bold">{user.email}</p>
                      {user.lastLoginAt && <p className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}><Clock size={11} /> {formatDateTime(user.lastLoginAt)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}><Wallet size={18} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{t('site.balance', 'Bakiye')}</p>
                      <p className="text-lg font-black" style={{ color: 'var(--accent)' }}>{user.balance.toFixed(2)} ₺</p>
                    </div>
                    {user.role && <span className="rounded-lg px-2.5 py-1 text-xs font-black text-white" style={{ backgroundColor: user.role.color || 'var(--accent)' }}>{user.role.name}</span>}
                  </div>
                </div>
                {(discordEnabled || user.discordId) && (
                  <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-elevated)', borderColor: user.discordId ? '#5865F2' : 'var(--border)' }}>
                    <div className="flex items-center justify-between gap-3 border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-widest">{t('profile.discord_link_title', 'Discord Eşleme')}</h2>
                        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>{t('profile.discord_link_desc', 'Discord hesabınızı bağlayın; rütbeniz otomatik senkronlanır.')}</p>
                      </div>
                      <span className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase" style={{ background: user.discordId ? '#22c55e22' : '#ef444422', color: user.discordId ? '#22c55e' : '#ef4444' }}>
                        {user.discordId ? t('profile.discord_linked', 'Bağlı') : t('profile.discord_unlinked', 'Bağlı değil')}
                      </span>
                    </div>
                    <div className="p-5">
                      {discordStatus === 'linked' && <p className="mb-3 text-sm font-semibold" style={{ color: '#22c55e' }}>{t('profile.discord_linked_ok', 'Discord hesabınız bağlandı.')}</p>}
                      {discordStatus === 'taken' && <p className="mb-3 text-sm font-semibold" style={{ color: '#ef4444' }}>{t('profile.discord_taken', 'Bu Discord hesabı başka bir kullanıcıya bağlı.')}</p>}
                      {discordStatus === 'error' && <p className="mb-3 text-sm font-semibold" style={{ color: '#ef4444' }}>{t('profile.discord_error', 'Discord bağlantısı başarısız.')}</p>}
                      {discordStatus === 'cancelled' && <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>{t('profile.discord_cancelled', 'Discord yetkilendirmesi iptal edildi.')}</p>}
                      {discordStatus === 'disabled' && <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>{t('profile.discord_disabled', 'Discord hesap bağlama kapalı.')}</p>}
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {user.discordAvatar
                          ? <img src={user.discordAvatar} alt="" className="h-14 w-14 rounded-2xl" />
                          : <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: '#5865F2' }}><DiscordIcon size={26} /></div>}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{t('profile.discord', 'Discord')}</p>
                          <p className="truncate text-base font-black">{user.discordUsername || t('profile.discord_unlinked', 'Bağlı değil')}</p>
                          {discordGuild ? <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{t('profile.discord_guild', 'Sunucu')}: {discordGuild}</p> : null}
                        </div>
                        {user.discordId ? (
                          <button
                            type="button"
                            disabled={unlinking}
                            onClick={async () => {
                              setUnlinking(true);
                              try {
                                const res = await fetch('/api/auth/discord/unlink', { method: 'POST' });
                                if (res.ok) {
                                  setUser((u) => u ? { ...u, discordId: null, discordUsername: null, discordAvatar: null } : u);
                                  setDiscordStatus(null);
                                }
                              } finally { setUnlinking(false); }
                            }}
                            className="rounded-xl border px-4 py-2.5 text-[11px] font-black uppercase disabled:opacity-50"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                          >
                            {unlinking ? t('profile.saving', 'Kaydediliyor...') : t('profile.discord_disconnect', 'Bağlantıyı kaldır')}
                          </button>
                        ) : discordCanLink ? (
                          <a href="/api/auth/discord" className="rounded-xl px-5 py-2.5 text-[11px] font-black uppercase text-white" style={{ background: '#5865F2' }}>
                            {t('profile.discord_connect', 'Discord Eşle')}
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('profile.discord_disabled', 'Discord hesap bağlama kapalı.')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {(tab === 'profile') && (
              <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="text-xs font-black uppercase tracking-widest">{t('profile.tickets', 'Destek Talepleri')}</h2>
                  <Link href="/support" className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>{t('profile.open_ticket', 'talebi aç')}</Link>
                </div>
                {!tickets.length ? <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('support.empty', 'Henüz talebiniz yok')}</p> : (
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                    <thead><tr className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      <th className="px-5 py-2.5">ID</th><th className="px-5 py-2.5">{t('profile.col.subject', 'Konu')}</th><th className="px-5 py-2.5">{t('profile.col.category', 'Kategori')}</th><th className="px-5 py-2.5">{t('profile.col.last_reply', 'Son Güncelleme')}</th><th className="px-5 py-2.5">{t('profile.col.status', 'Durum')}</th>
                    </tr></thead>
                    <tbody>{tickets.map((tk) => (
                      <tr key={tk.id} className="border-t" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                        <td className="px-5 py-3">#{tk.number}</td>
                        <td className="px-5 py-3 font-medium">{tk.subject}</td>
                        <td className="px-5 py-3">{tk.category?.name || '—'}</td>
                        <td className="px-5 py-3">{formatDateTime(tk.lastReplyAt || tk.createdAt)}</td>
                        <td className="px-5 py-3"><span className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: tk.status?.color || '#22c55e' }}>{tk.status?.name || '—'}</span></td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </div>
            )}
            {(tab === 'profile' || tab === 'orders') && (
              <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="text-xs font-black uppercase tracking-widest">{t('profile.orders', 'Siparişler')}</h2>
                  <Link href="/store" className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>{t('profile.see_all', 'hepsini gör')}</Link>
                </div>
                {!orders.length ? <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('profile.no_orders', 'Henüz siparişiniz yok')}</p> : (
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                    <thead><tr className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      <th className="px-5 py-2.5">ID</th><th className="px-5 py-2.5">{t('profile.total', 'Toplam')}</th><th className="px-5 py-2.5">{t('profile.col.status', 'Durum')}</th><th className="px-5 py-2.5">{t('profile.col.date', 'Tarih')}</th>
                    </tr></thead>
                    <tbody>{orders.map((o, i) => (
                      <tr key={o.id} className="border-t" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                        <td className="px-5 py-3">#{String(i + 1).padStart(2, '0')}</td>
                        <td className="px-5 py-3">{o.total.toFixed(2)} ₺</td>
                        <td className="px-5 py-3"><span className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: STATUS_COLORS[o.status] || '#64748b' }}>{statusLabel(o.status)}</span></td>
                        <td className="px-5 py-3">{formatDateTime(o.createdAt)}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </div>
            )}
            {(tab === 'profile' || tab === 'credits') && (
              <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="text-xs font-black uppercase tracking-widest">{t('credits.history', 'Kredi Geçmişi')}</h2>
                  <Link href="/credits" className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>{t('profile.see_all', 'hepsini gör')}</Link>
                </div>
                {!history.length ? <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('credits.no_history', 'Henüz işlem yok.')}</p> : (
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                    <thead><tr className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      <th className="px-5 py-2.5">ID</th><th className="px-5 py-2.5">{t('profile.col.amount', 'Miktar')}</th><th className="px-5 py-2.5">{t('profile.col.status', 'Durum')}</th><th className="px-5 py-2.5">{t('profile.col.date', 'Tarih')}</th>
                    </tr></thead>
                    <tbody>{history.map((h, i) => (
                      <tr key={h.id} className="border-t" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                        <td className="px-5 py-3">#{String(i + 1).padStart(2, '0')}</td>
                        <td className={`px-5 py-3 ${h.credits >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{h.credits >= 0 ? '+' : ''}{h.credits} kredi</td>
                        <td className="px-5 py-3"><span className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: STATUS_COLORS[h.status] || '#22c55e' }}>{statusLabel(h.status)}</span></td>
                        <td className="px-5 py-3">{formatDateTime(h.createdAt)}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </div>
            )}
            {tab === 'applications' && (
              <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="text-xs font-black uppercase tracking-widest">{t('site.nav.applications', 'Başvurular')}</h2>
                  <Link href="/applications" className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>{t('profile.see_all', 'hepsini gör')}</Link>
                </div>
                {!applications.length ? <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('profile.no_applications', 'Henüz başvurunuz yok')}</p> : (
                  <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                    <thead><tr className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      <th className="px-5 py-2.5">{t('profile.col.form', 'Form')}</th><th className="px-5 py-2.5">{t('profile.col.status', 'Durum')}</th><th className="px-5 py-2.5">{t('profile.col.date', 'Tarih')}</th>
                    </tr></thead>
                    <tbody>{applications.map((a) => (
                      <tr key={a.id} className="border-t" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                        <td className="px-5 py-3 font-medium">{a.formTitle}</td>
                        <td className="px-5 py-3"><span className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: STATUS_COLORS[a.status] || '#64748b' }}>{statusLabel(a.status)}</span></td>
                        <td className="px-5 py-3">{formatDateTime(a.createdAt)}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                )}
              </div>
            )}
            {tab === 'subscriptions' && (
              <div className="rounded-2xl border px-5 py-10 text-center text-sm" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>{t('profile.no_subs', 'Aktif aboneliğiniz yok.')}</div>
            )}
            {tab === 'edit' && (
              <form
                className="space-y-4 rounded-2xl border p-5"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditErr(''); setEditMsg(''); setSaving(true);
                  try {
                    const res = await fetch('/api/me/profile', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: editEmail.trim(),
                        currentPassword: currentPassword || undefined,
                        newPassword: newPassword || undefined,
                      }),
                    });
                    const d = await res.json();
                    if (!res.ok) { setEditErr(d.error || t('profile.save_error', 'Kaydedilemedi.')); return; }
                    if (d.user) setUser(d.user);
                    setCurrentPassword(''); setNewPassword('');
                    setEditMsg(t('profile.saved', 'Profil güncellendi.'));
                  } catch {
                    setEditErr(t('profile.save_error', 'Kaydedilemedi.'));
                  } finally { setSaving(false); }
                }}
              >
                <h2 className="text-xs font-black uppercase tracking-widest">{t('profile.edit', 'Profil Düzenle')}</h2>
                <label className="block text-sm">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{t('profile.email', 'E-posta')}</span>
                  <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" required className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-shadow focus:ring-2" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                </label>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{t('profile.change_password', 'Şifre / e-posta değişiminde mevcut şifre zorunlu')}</p>
                <label className="block text-sm">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{t('profile.current_password', 'Mevcut şifre')}</span>
                  <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" autoComplete="current-password" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{t('profile.new_password', 'Yeni şifre')}</span>
                  <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" autoComplete="new-password" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                </label>
                {editErr && <p className="text-sm" style={{ color: '#ef4444' }}>{editErr}</p>}
                {editMsg && <p className="text-sm" style={{ color: 'var(--accent)' }}>{editMsg}</p>}
                <button type="submit" disabled={saving} className="rounded-xl px-5 py-2.5 text-[11px] font-black uppercase disabled:opacity-50 transition-transform hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                  {saving ? t('profile.saving', 'Kaydediliyor...') : t('profile.save', 'Kaydet')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}
