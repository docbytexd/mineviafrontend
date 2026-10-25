'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShoppingCart, Minus, Plus, Truck, Check, Package, ChevronRight } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
import { useCart } from '@/lib/store/cartStore';
import { useSitePrice } from '@/lib/site/useSitePrice';
import { useServerName } from '@/lib/site/useServerName';
interface Product {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  price: number;
  finalPrice: number;
  category: { id: string; name: string; slug: string } | null;
  discount: { active: boolean; type: string; value: number; expiresAt?: string };
  stockEnabled: boolean;
  stock: number;
}
interface Related {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  finalPrice: number;
  discount: { active: boolean; type: string; value: number };
}
interface ShopSettings {
  currencySymbol: string;
  hideDecimals: boolean;
  taxEnabled: boolean;
  taxRate: number;
  taxIncludedInPrice: boolean;
  deliveryMode: 'chest' | 'direct';
}
export default function ProductPage() {
  const { t } = useSiteLang();
  const { format: fmtPrice } = useSitePrice();
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Related[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  useEffect(() => {
    Promise.all([
      fetch(`/api/public/shop/product/${slug}`).then((r) => r.json()),
      fetch('/api/public/shop').then((r) => r.json()),
    ]).then(([pd, sd]) => {
      if (pd.product) setProduct(pd.product);
      if (pd.related) setRelated(pd.related);
      if (sd.settings) setSettings(sd.settings);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);
  const serverName = useServerName();
  useEffect(() => {
    if (product) document.title = `${serverName} · ${product.name}`;
  }, [product, serverName]);
  function fmt(n: number) {
    return fmtPrice(n);
  }
  function handleAdd() {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      finalPrice: product.finalPrice,
      quantity: qty,
      discount: product.discount,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  if (!product) return (
    <div className="flex flex-col items-center justify-center py-24 text-[#8c502e]/80">
      <ShoppingCart size={48} className="mb-4 text-slate-200" />
      <p>{t('store.not_found', 'Ürün bulunamadı.')}</p>
      <Link href="/store" className="mt-4 text-sm text-orange-500 hover:underline">{t('store.back', 'Mağazaya Dön')}</Link>
    </div>
  );
  const outOfStock = product.stockEnabled && product.stock === 0;
  return (
    <div className="bg-[#f7ce9e] text-[#632811]">
      <PageHero
        title={product.name}
        crumbs={[
          { label: t('common.home', 'Anasayfa'), href: '/' },
          { label: t('store.badge', 'Mağaza'), href: '/store' },
          ...(product.category ? [{ label: product.category.name }] : []),
          { label: product.name },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
              <div className="flex flex-col gap-0 md:flex-row">
                <div className="relative h-72 w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 md:h-auto md:w-80">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingCart size={64} className="text-slate-300" />
                    </div>
                  )}
                  {product.discount.active && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
                      -{product.discount.type === 'percent' ? `%${product.discount.value}` : fmt(product.discount.value)}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    {product.category && (
                      <span className="mb-2 inline-block rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-500">
                        {product.category.name}
                      </span>
                    )}
                    <h1 className="mb-3 text-2xl font-black text-[#632811]">{product.name}</h1>
                    <div className="mb-4 flex items-end gap-3">
                      <span className="text-3xl font-black text-orange-500">
                        {fmt(product.finalPrice)}
                      </span>
                      {product.discount.active && (
                        <span className="mb-1 text-lg text-[#8c502e]/80 line-through">
                          {fmt(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="mb-4 flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 rounded-xl bg-[#f7ce9e] px-3 py-2 text-xs font-semibold text-[#8c502e]">
                        <Truck size={14} className="text-orange-500" />
                        {settings?.deliveryMode === 'direct' ? t('store.delivery_direct', 'Anında Teslim') : t('store.delivery_chest', 'Sandığa Teslim')}
                      </div>
                      {product.stockEnabled && (
                        <div className="flex items-center gap-2 rounded-xl bg-[#f7ce9e] px-3 py-2 text-xs font-semibold text-[#8c502e]">
                          <ShoppingCart size={14} className="text-orange-500" />
                          {outOfStock ? t('store.out_of_stock', 'Stok Yok') : `${product.stock} ${t('store.stock_count', 'adet stok')}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center overflow-hidden rounded-xl border border-[#d88a67]">
                        <button
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          className="flex h-10 w-10 cursor-pointer items-center justify-center text-[#8c502e] transition-colors hover:bg-[#f7ce9e]"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="flex h-10 w-12 items-center justify-center text-sm font-bold text-[#632811]">
                          {qty}
                        </span>
                        <button
                          onClick={() => setQty((q) => product.stockEnabled ? Math.min(product.stock, q + 1) : q + 1)}
                          className="flex h-10 w-10 cursor-pointer items-center justify-center text-[#8c502e] transition-colors hover:bg-[#f7ce9e]"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={handleAdd}
                        disabled={outOfStock}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: added ? '#22c55e' : 'var(--accent)' }}
                      >
                        {added ? <><Check size={16} /> {t('store.added', 'Sepete Eklendi')}</> : <><ShoppingCart size={16} /> {t('store.add_cart', 'Sepete Ekle')}</>}
                      </button>
                    </div>
                    <Link
                      href="/store/cart"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500 py-2.5 text-sm font-bold text-orange-500 transition-colors hover:bg-orange-50"
                    >
                      {t('store.go_cart', 'Sepete Git')} <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {product.description && (
              <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                <div className="border-b border-[#d88a67] px-6 py-4">
                  <h2 className="font-bold text-[#632811]">{t('store.description', 'Ürün Açıklaması')}</h2>
                </div>
                <div
                  className="prose prose-slate max-w-none p-6 text-sm leading-relaxed text-[#8c502e]"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
          <aside className="w-full shrink-0 space-y-4 lg:w-72">
            {related.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                <div className="border-b border-[#d88a67] px-4 py-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c502e]/80">{t('store.related', 'Benzer Ürünler')}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      href={`/store/${r.slug}`}
                      className="group flex items-center gap-3 p-4 transition-colors hover:bg-[#f7ce9e]"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f1b978]">
                        {r.image ? (
                          <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package size={20} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-xs font-bold text-[#632811] group-hover:text-orange-500">{r.name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-sm font-black text-orange-500">{fmt(r.finalPrice)}</span>
                          {r.discount.active && (
                            <span className="text-[10px] text-[#8c502e]/80 line-through">{fmt(r.price)}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className="shrink-0 text-slate-300 group-hover:text-orange-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#8c502e]/80">{t('store.delivery', 'Teslimat Bilgisi')}</h3>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Truck size={15} className="mt-0.5 shrink-0 text-orange-500" />
                  <p className="text-xs text-[#8c502e]">
                    {settings?.deliveryMode === 'direct'
                      ? 'Satın alma işlemi tamamlandığında ürün hesabınıza anında yüklenir.'
                      : 'Satın alma işlemi tamamlandığında ürün oyun içi sandığınıza teslim edilir.'}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShoppingCart size={15} className="mt-0.5 shrink-0 text-orange-500" />
                  <p className="text-xs text-[#8c502e]">{t('store.pay_balance', 'Ödeme bakiyenizden gerçekleştirilir.')}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}