'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Check, Gift, Zap, Clock, ArrowUpRight } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import { useSitePrice } from '@/lib/site/useSitePrice';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
interface SessionUser {
  id: string;
  username: string;
  email: string;
  balance: number;
}
interface CreditPackage {
  id: string;
  name: string;
  price: number;
  credits: number;
  bonus: number;
  image: string;
}
interface Gateway {
  gateway: string;
  name: string;
  logo: string;
}
interface PaymentHistory {
  id: string;
  amount: number;
  credits: number;
  gateway: string;
  status: string;
  createdAt: string;
}
interface ShopSettings {
  currencyName: string;
  currencySymbol: string;
  hideDecimals: boolean;
  minPayment: number;
  maxPayment: number;
  creditPackageMode: boolean;
}
const TURKISH_GATEWAYS = [
  'paytr', 'iyzico', 'paywant', 'vallet', 'shopinext', 'param',
  'moka', 'ipara', 'rubikpara', 'payguru', 'moneypay', 'paratika',
  'nomupay', 'odeal', 'shipy', 'gpay', 'papara', 'tosla', 'fups',
  'sipay', 'weepay', 'lidio', 'paybull', 'bakiyem', 'hepsipay',
];
const GLOBAL_GATEWAYS = [
  'tebex', 'stripe', 'xsolla', 'paypal', 'mercadopago',
  'paymentwall', 'cryptomus', 'coinbase', 'mollie', 'paddle',
  'payu', 'nowpayments', 'paynow',
];
function GatewayLogo({ gateway, name, logo }: { gateway: string; name: string; logo: string }) {
  const [failed, setFailed] = useState(false);
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < gateway.length; i++) hash = gateway.charCodeAt(i) + ((hash << 5) - hash);
  const color = colors[Math.abs(hash) % colors.length];
  if (failed) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-black text-white" style={{ backgroundColor: color }}>
        {name.substring(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f1b978] p-0.5 shadow-sm border border-[#d88a67]">
      <img src={logo} alt={name} className="h-full w-full object-contain" onError={() => setFailed(true)} />
    </div>
  );
}
export default function CreditsPage() {
  const { t } = useSiteLang();
  const { format: fmtPrice, formatRaw, convert, convertBack, symbol: curSym } = useSitePrice();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'tr' | 'global'>('tr');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) { window.location.href = '/login?redirect=/credits'; return; }
        const meData = await meRes.json();
        setUser(meData.user);
        const [gwData, histData, settingsData] = await Promise.all([
          fetch('/api/settings/payment-gateways/public').then((r) => r.json()),
          fetch('/api/payment/history?limit=5').then((r) => r.json()),
          fetch('/api/public/shop/settings').then((r) => r.json()),
        ]);
        setGateways(gwData.gateways || []);
        setHistory(histData.payments || []);
        setSettings(settingsData.settings || null);
        if (settingsData.settings?.creditPackageMode) {
          const pkgData = await fetch('/api/public/credit-packages').then((r) => r.json());
          setPackages(pkgData.packages || []);
        }
      } catch {
        window.location.href = '/login?redirect=/credits';
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);
  const trGateways = gateways.filter((g) => TURKISH_GATEWAYS.includes(g.gateway));
  const globalGateways = gateways.filter((g) => GLOBAL_GATEWAYS.includes(g.gateway));
  const activeGateways = activeTab === 'tr' ? trGateways : globalGateways;
  const selectedPkg = packages.find((p) => p.id === selectedPackage);
  const creditPackageMode = settings?.creditPackageMode ?? false;
  const currencyName = settings?.currencyName || 'Kredi';
  const canPay = creditPackageMode
    ? !!(selectedPackage && selectedGateway)
    : !!(customAmount && convertBack(parseFloat(customAmount)) > 0 && selectedGateway);
  const handlePay = async () => {
    if (!canPay) return;
    setPaying(true);
    setError('');
    try {
      const body = creditPackageMode
        ? { packageId: selectedPackage, gateway: selectedGateway }
        : { amount: convertBack(parseFloat(customAmount)), gateway: selectedGateway };
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ödeme başlatılamadı.'); setPaying(false); return; }
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else if (data.htmlForm) {
        const div = document.createElement('div');
        div.innerHTML = data.htmlForm;
        document.body.appendChild(div);
        const form = div.querySelector('form');
        form?.submit();
      }
    } catch {
      setError('Bir hata oluştu.');
      setPaying(false);
    }
  };
  if (loading) return (
    <div className="flex justify-center py-24 bg-[#f7ce9e] text-[#632811]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div className="bg-[#f7ce9e] text-[#632811]">
      <PageHero
        badge={t('credits.title', 'Kredi Yükle')}
        title={t('credits.title', 'Kredi Yükle')}
        description={creditPackageMode
          ? t('credits.package', 'Paket')
          : t('credits.custom_amount_desc', 'Yüklemek istediğin tutarı gir')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('credits.title', 'Kredi Yükle') }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-6">
            {user && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#d88a67] bg-[#f1b978] px-5 py-4 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <CreditCard size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-[#8c502e]/80">Mevcut Bakiye</p>
                  <p className="text-xl font-black text-[#632811]">
                    {user.balance}
                    <span className="ml-1 text-sm font-semibold text-[#8c502e]/80">{currencyName}</span>
                  </p>
                </div>
              </div>
            )}
            {creditPackageMode ? (
              <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                <div className="border-b border-[#d88a67] px-5 py-4">
                  <p className="font-bold text-[#632811]">{t('credits.package', 'Paket')} Seç</p>
                  <p className="mt-0.5 text-xs text-[#8c502e]/80">Yüklemek istedişin kredi paketini seç</p>
                </div>
                <div className="p-5">
                  {packages.length === 0 ? (
                    <div className="rounded-xl border border-[#d88a67] py-10 text-center">
                      <Zap size={32} className="mx-auto mb-2 text-slate-200" />
                      <p className="text-sm text-[#8c502e]/80">Henüz aktif paket yok.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {packages.map((pkg) => {
                        const isSelected = selectedPackage === pkg.id;
                        const totalCredits = pkg.credits + pkg.bonus;
                        return (
                          <button
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg.id)}
                            className="relative overflow-hidden rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                            style={{
                              borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                              backgroundColor: isSelected ? '#fff7ed' : '#f8fafc',
                              boxShadow: isSelected ? '0 0 0 2px var(--accent)' : undefined,
                            }}
                          >
                            {pkg.bonus > 0 && (
                              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold text-yellow-600">
                                <Gift size={9} />+{pkg.bonus} Bonus
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500">
                                <Check size={11} className="text-white" />
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              {pkg.image ? (
                                <img src={pkg.image} alt={pkg.name} className="h-12 w-12 rounded-xl object-cover" />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                                  <Zap size={20} className="text-orange-500" />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-[#632811]">{pkg.name}</p>
                                <p className="text-lg font-black text-orange-500">
                                  {totalCredits}
                                  <span className="ml-1 text-xs font-medium text-[#8c502e]/80">{currencyName}</span>
                                </p>
                                {pkg.bonus > 0 && (
                                  <p className="text-[11px] text-[#8c502e]/80">
                                    {pkg.credits} + <span className="font-semibold text-yellow-600">{pkg.bonus} bonus</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-[#d88a67] pt-3">
                              <span className="text-xs text-[#8c502e]/80">{t('credits.price', 'Fiyat')}</span>
                              <span className="text-base font-black text-orange-500">{fmtPrice(pkg.price)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                <div className="border-b border-[#d88a67] px-5 py-4">
                  <p className="font-bold text-[#632811]">{t('credits.custom_amount', 'Miktar Gir')}</p>
                  <p className="mt-0.5 text-xs text-[#8c502e]/80">
                    {t('credits.custom_amount_desc', 'Yüklemek istediğin tutarı gir')}
                    {settings?.minPayment || settings?.maxPayment ? (
                      <> (Min: {fmtPrice(settings?.minPayment || 0)} - Maks: {fmtPrice(settings?.maxPayment || 0)})</>
                    ) : null}
                  </p>
                </div>
                <div className="p-5">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8c502e]/80">{curSym}</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min={convert(settings?.minPayment || 1)}
                      max={settings?.maxPayment ? convert(settings.maxPayment) : undefined}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-[#d88a67] bg-[#f7ce9e] py-3.5 pl-8 pr-4 text-lg font-black text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  {(settings?.minPayment ?? 0) > 0 && customAmount && convertBack(parseFloat(customAmount)) < (settings?.minPayment ?? 0) && (
                    <p className="mt-2 text-xs text-red-500">Minimum tutar {fmtPrice(settings?.minPayment || 0)}</p>
                  )}
                  {(settings?.maxPayment ?? 0) > 0 && customAmount && convertBack(parseFloat(customAmount)) > (settings?.maxPayment ?? 0) && (
                    <p className="mt-2 text-xs text-red-500">Maksimum tutar {fmtPrice(settings?.maxPayment || 0)}</p>
                  )}
                </div>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
              <div className="border-b border-[#d88a67] px-5 py-4">
                <p className="font-bold text-[#632811]">{t('credits.payment_method', 'Ödeme Yöntemi')}</p>
                <p className="mt-0.5 text-xs text-[#8c502e]/80">{t('credits.payment_method_desc', 'Ödeme yapmak istediğin yöntemi seç')}</p>
              </div>
              <div className="p-5">
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => { setActiveTab('tr'); setSelectedGateway(null); }}
                    className="rounded-lg px-4 py-2 text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: activeTab === 'tr' ? 'var(--accent)' : 'var(--bg)',
                      color: activeTab === 'tr' ? 'white' : 'var(--text-muted)',
                    }}
                  >
                    {t('credits.turkey', 'Türkiye')} ({trGateways.length})
                  </button>
                  <button
                    onClick={() => { setActiveTab('global'); setSelectedGateway(null); }}
                    className="rounded-lg px-4 py-2 text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: activeTab === 'global' ? 'var(--accent)' : 'var(--bg)',
                      color: activeTab === 'global' ? 'white' : 'var(--text-muted)',
                    }}
                  >
                    {t('credits.global', 'Global')} ({globalGateways.length})
                  </button>
                </div>
                {activeGateways.length === 0 ? (
                  <div className="rounded-xl border border-[#d88a67] py-8 text-center">
                    <p className="text-sm text-[#8c502e]/80">{t('credits.no_gateway', 'Bu kategoride aktif ödeme yöntemi yok.')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {activeGateways.map((gw) => {
                      const isSelected = selectedGateway === gw.gateway;
                      return (
                        <button
                          key={gw.gateway}
                          onClick={() => setSelectedGateway(gw.gateway)}
                          className="flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5"
                          style={{
                            borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                            backgroundColor: isSelected ? '#fff7ed' : '#f8fafc',
                            boxShadow: isSelected ? '0 0 0 2px var(--accent)' : undefined,
                          }}
                        >
                          <GatewayLogo gateway={gw.gateway} name={gw.name} logo={gw.logo} />
                          <span className="truncate text-xs font-semibold text-[#632811]">{gw.name}</span>
                          {isSelected && (
                            <div className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500">
                              <Check size={9} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {((creditPackageMode && selectedPkg && selectedGateway) || (!creditPackageMode && customAmount && selectedGateway)) && (
              <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                <div className="border-b border-[#d88a67] px-5 py-4">
                  <p className="font-bold text-[#632811]">{t('credits.summary', 'Özet')}</p>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  {creditPackageMode && selectedPkg ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#8c502e]/80">{t('credits.package', 'Paket')}</span>
                        <span className="font-semibold text-[#632811]">{selectedPkg.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8c502e]/80">{currencyName}</span>
                        <span className="font-semibold text-[#632811]">{selectedPkg.credits + selectedPkg.bonus} {currencyName}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-[#8c502e]/80">{t('credits.amount', 'Yüklenecek Tutar')}</span>
                      <span className="font-semibold text-[#632811]">{formatRaw(parseFloat(customAmount || '0'))}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#8c502e]/80">{t('credits.payment_method', 'Ödeme Yöntemi')}</span>
                    <span className="font-semibold text-[#632811]">{gateways.find((g) => g.gateway === selectedGateway)?.name}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#d88a67] pt-3">
                    <span className="font-bold text-[#632811]">{t('credits.total', 'Toplam')}</span>
                    <span className="text-lg font-black text-orange-500">
                      {creditPackageMode && selectedPkg ? fmtPrice(selectedPkg.price) : formatRaw(parseFloat(customAmount || '0'))}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}
            <button
              onClick={handlePay}
              disabled={!canPay || paying}
              className="w-full rounded-xl py-4 text-sm font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {paying ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('credits.starting', 'Ödeme başlatılıyor...')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CreditCard size={16} />
                  {creditPackageMode && selectedPkg
                    ? `${fmtPrice(selectedPkg.price)} Öde`
                    : customAmount && convertBack(parseFloat(customAmount)) > 0
                      ? `${formatRaw(parseFloat(customAmount))} Öde`
                      : t('credits.pay_now', 'Ödemeye Geç')
                  }
                </span>
              )}
            </button>
          </div>
          <aside className="w-full shrink-0 space-y-4 lg:w-72">
            <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#d88a67] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8c502e]/80">{t('credits.history', 'Kredi Geçmişi')}</p>
                <Link href="/credits/history" className="flex items-center gap-1 text-[10px] font-bold text-orange-500 hover:text-orange-600">
                  {t('credits.see_all', 'Hepsini Gör')} <ArrowUpRight size={10} />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {history.length === 0 ? (
                  <div className="py-10 text-center">
                    <Clock size={28} className="mx-auto mb-2 text-slate-200" />
                    <p className="text-xs text-[#8c502e]/80">{t('credits.no_history', 'Henüz işlem yok.')}</p>
                  </div>
                ) : (
                  history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-[#632811]">+{h.credits} {currencyName}</p>
                        <p className="text-[11px] text-[#8c502e]/80">{h.gateway}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-orange-500">{fmtPrice(h.amount)}</p>
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: h.status === 'completed' ? '#22c55e' : h.status === 'pending' ? '#f59e0b' : '#ef4444' }}
                        >
                          {h.status === 'completed' ? t('credits.status_completed', 'Tamamlandı') : h.status === 'pending' ? t('credits.status_pending', 'Bekliyor') : t('credits.status_failed', 'Başarısız')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] p-4 shadow-sm">
              <p className="mb-3 text-xs font-black text-[#632811]">{t('credits.secure', 'Güvenli Ödeme')}</p>
              <div className="space-y-2">
                {['SSL ile şifrelenmiş başlantı', 'Anlık bakiye yükleme', '7/24 destek'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check size={9} className="text-emerald-500" />
                    </div>
                    <p className="text-[11px] text-[#8c502e]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}