'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, ChevronRight, Package, Tag, Check, X } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
import { useCart } from '@/lib/store/cartStore';
import { useSitePrice } from '@/lib/site/useSitePrice';
interface ShopSettings {
  currencySymbol: string;
  currencyName: string;
  hideDecimals: boolean;
  taxEnabled: boolean;
  taxRate: number;
  taxIncludedInPrice: boolean;
  deliveryMode: 'chest' | 'direct';
}
interface CouponResult {
  code: string;
  type: string;
  value: number;
  discountAmount: number;
}
export default function CartPage() {
  const { t } = useSiteLang();
  const { items, removeItem, updateQty, clear, total, count } = useCart();
  const { format: fmtPrice } = useSitePrice();
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  useEffect(() => {
    fetch('/api/public/shop')
      .then((r) => r.json())
      .then((d) => { if (d.settings) setSettings(d.settings); })
      .catch(() => {});
  }, []);
  function fmt(n: number) {
    return fmtPrice(n);
  }
  const subtotal = total();
  const couponDiscount = coupon?.discountAmount || 0;
  const tax = settings?.taxEnabled && !settings?.taxIncludedInPrice
    ? Math.round((subtotal - couponDiscount) * ((settings.taxRate || 0) / 100) * 100) / 100
    : 0;
  const grandTotal = Math.max(0, Math.round((subtotal - couponDiscount + tax) * 100) / 100);
  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCoupon(null);
    const res = await fetch('/api/public/shop/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: couponCode,
        cartTotal: subtotal,
        items: items.map((i) => ({ id: i.id, finalPrice: i.finalPrice, quantity: i.quantity })),
      }),
    });
    const data = await res.json();
    setCouponLoading(false);
    if (!res.ok) {
      setCouponError(data.error || t('store.invalid_coupon', 'Geçersiz kupon.'));
      return;
    }
    setCoupon(data);
  }
  function removeCoupon() {
    setCoupon(null);
    setCouponCode('');
    setCouponError('');
  }
  async function handleCheckout() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/public/shop/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        coupon: coupon?.code || '',
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || t('common.error', 'Bir hata oluştu.'));
      return;
    }
    setOrderId(data.orderId);
    setNewBalance(data.newBalance);
    setSuccess(true);
    clear();
  }
  if (success) return (
    <div className="min-h-[60vh] bg-[#f7ce9e] text-[#632811]">
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-black text-[#632811]">{t('store.success', 'Satın Alma Başarılı!')}</h1>
        <p className="mb-1 text-sm text-[#8c502e]">{t('store.order_no', 'Sipariş No:')} <span className="font-mono font-bold text-[#632811]">{orderId}</span></p>
        {newBalance !== null && (
          <p className="mb-6 text-sm text-[#8c502e]">
            {t('store.remaining', 'Kalan Bakiye:')} <span className="font-bold text-orange-500">{fmt(newBalance)}</span>
          </p>
        )}
        <Link href="/store" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600">
          {t('store.back', 'Mağazaya Dön')} <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
  return (
    <div className="bg-[#f7ce9e] text-[#632811]">
      <PageHero
        title={t('store.cart_title', 'Sepetim')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('store.badge', 'Mağaza'), href: '/store' }, { label: t('store.cart', 'Sepet') }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingCart size={56} className="mb-4 text-slate-200" />
            <h2 className="mb-2 text-lg font-bold text-[#8c502e]">{t('store.empty', 'Sepetiniz boş')}</h2>
            <p className="mb-6 text-sm text-[#8c502e]/80">{t('store.empty_desc', 'Mağazadan ürün ekleyerek başlayabilirsiniz.')}</p>
            <Link href="/store" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600">
              {t('store.go_store', 'Mağazaya Git')} <ChevronRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-[#632811]">{count()} ürün</h2>
                <button onClick={clear} className="flex cursor-pointer items-center gap-1.5 text-xs text-red-400 transition-colors hover:text-red-600">
                  <Trash2 size={13} /> {t('store.clear', 'Sepeti Temizle')}
                </button>
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] p-4 shadow-sm">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f1b978]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package size={24} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#632811]">{item.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-sm font-black text-orange-500">{fmt(item.finalPrice)}</span>
                      {item.discount.active && (
                        <span className="text-xs text-[#8c502e]/80 line-through">{fmt(item.price)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center overflow-hidden rounded-xl border border-[#d88a67]">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center text-[#8c502e] transition-colors hover:bg-[#f7ce9e]">
                        <Minus size={12} />
                      </button>
                      <span className="flex h-8 w-10 items-center justify-center text-sm font-bold text-[#632811]">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="flex h-8 w-8 cursor-pointer items-center justify-center text-[#8c502e] transition-colors hover:bg-[#f7ce9e]">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-red-400 transition-colors hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="w-20 text-right">
                    <p className="font-black text-[#632811]">{fmt(item.finalPrice * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full shrink-0 space-y-4 lg:w-80">
              <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                <div className="border-b border-[#d88a67] px-6 py-4">
                  <h3 className="font-bold text-[#632811]">{t('store.summary', 'Sipariş Özeti')}</h3>
                </div>
                <div className="space-y-3 p-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8c502e]">{t('store.subtotal', 'Ara Toplam')}</span>
                    <span className="font-semibold text-[#632811]">{fmt(subtotal)}</span>
                  </div>
                  {coupon ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Check size={13} className="text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-600">{coupon.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600">-{fmt(coupon.discountAmount)}</span>
                        <button onClick={removeCoupon} className="cursor-pointer text-emerald-400 hover:text-emerald-600">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c502e]/80" />
                        <input
                          type="text"
                          placeholder={t('store.coupon', 'Kupon kodu')}
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          className="w-full rounded-xl border border-[#d88a67] bg-[#f7ce9e] py-2 pl-8 pr-3 text-sm text-[#8c502e] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="cursor-pointer rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                      >
                        {couponLoading ? '...' : t('store.apply', 'Uygula')}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-xs font-semibold text-red-500">{couponError}</p>}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8c502e]">{t('store.discount', 'İndirim')}</span>
                      <span className="font-semibold text-emerald-600">-{fmt(couponDiscount)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#8c502e]">Vergi (%{settings?.taxRate})</span>
                      <span className="font-semibold text-[#632811]">{fmt(tax)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#d88a67] pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-[#632811]">{t('store.total', 'Toplam')}</span>
                      <span className="text-lg font-black text-orange-500">{fmt(grandTotal)}</span>
                    </div>
                  </div>
                  {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">{error}</p>}
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                  >
                    {loading ? (
                      <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> {t('store.processing', 'İşleniyor...')}</>
                    ) : (
                      <><ShoppingCart size={16} /> Satın Al ({fmt(grandTotal)})</>
                    )}
                  </button>
                  <Link href="/store" className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d88a67] py-2.5 text-sm font-semibold text-[#8c502e] transition-colors hover:bg-[#f7ce9e]">
                    {t('store.continue', 'Alışverişe Devam Et')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <JoinCta />
    </div>
  );
}