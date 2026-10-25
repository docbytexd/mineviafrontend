'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, X, Minus, FolderOpen, Grid2X2, ChevronRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import { useSitePrice } from '@/lib/site/useSitePrice';
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parent: string | null;
}
interface Product {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  price: number;
  finalPrice: number;
  category: string | null;
  discount: { active: boolean; type: string; value: number };
  stockEnabled: boolean;
  stock: number;
}
interface RecentPurchase {
  username: string;
  item: string;
  itemImage: string;
  itemSlug: string;
  total: number;
  createdAt: string;
}
interface ShopSettings {
  currencySymbol: string;
  hideDecimals: boolean;
}
interface ComparisonFeature {
  label: string;
  values: Record<string, string>;
}
interface ComparisonTable {
  id: string;
  name: string;
  products: { id: string; name: string; image: string; price: number; slug: string }[];
  features: ComparisonFeature[];
}
export default function StorePage() {
  const { t } = useSiteLang();
  const { format: fmtPrice } = useSitePrice();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({ currencySymbol: '₺', hideDecimals: false });
  const [comparisons, setComparisons] = useState<ComparisonTable[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/public/shop')
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setProducts(d.products || []);
        setRecentPurchases(d.recentPurchases || []);
        if (d.settings) setSettings(d.settings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!activeCategory) return;
    fetch(`/api/public/shop/comparison?category=${activeCategory}`)
      .then((r) => r.json())
      .then((d) => setComparisons(d.tables || []))
      .catch(() => {});
  }, [activeCategory]);
  const rootCategories = categories.filter((c) => !c.parent);
  const filteredProducts = activeCategory ? products.filter((p) => p.category === activeCategory) : [];
  const activecat = categories.find((c) => c.id === activeCategory);
  const hasComparisons = comparisons.length > 0;
  function fmt(n: number) {
    return fmtPrice(n);
  }
  function renderValue(val: string) {
    if (val === 'true' || val === '✓') return <Check size={16} className="mx-auto text-emerald-500" />;
    if (val === 'false' || val === '✗') return <X size={16} className="mx-auto text-red-400" />;
    if (val === '-') return <Minus size={16} className="mx-auto text-slate-300" />;
    return <span className="text-xs font-semibold text-[#632811]">{val}</span>;
  }
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] pb-16">
      <PageHero
        badge={t('store.badge', 'Mağaza')}
        title={t('store.title', "Mağaza'ya Hoş geldiniz!")}
        description={t('store.desc', 'Oyuncularının deneyimini geliştirmenize olanak sağlayan ürünleri sunuyoruz.')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('store.badge', 'Mağaza') }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-60">
            <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
              <div className="border-b border-[#d88a67] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8c502e]/80">{t('store.categories', 'Kategoriler')}</p>
              </div>
              <div className="p-2 space-y-0.5">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors"
                  style={{ backgroundColor: activeCategory === null ? 'var(--accent)' : 'transparent', color: activeCategory === null ? '#fff' : 'var(--text-muted)' }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: activeCategory === null ? 'rgba(255,255,255,0.2)' : 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                    <Grid2X2 size={16} style={{ color: activeCategory === null ? '#fff' : 'var(--accent)' }} />
                  </div>
                  <span className="flex-1 text-left">{t('store.all', 'Tümü')}</span>
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ backgroundColor: activeCategory === null ? 'rgba(255,255,255,0.25)' : 'color-mix(in srgb, var(--accent) 10%, transparent)', color: activeCategory === null ? '#fff' : 'var(--accent)' }}>
                    {rootCategories.length}
                  </span>
                </button>
                {rootCategories.map((cat) => {
                  const count = products.filter((p) => p.category === cat.id).length;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors"
                      style={{ backgroundColor: isActive ? 'var(--accent)' : 'transparent', color: isActive ? '#fff' : 'var(--text-muted)' }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                        {cat.image ? <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" /> : <FolderOpen size={16} style={{ color: isActive ? '#fff' : 'var(--accent)' }} />}
                      </div>
                      <span className="flex-1 text-left">{cat.name}</span>
                      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg)', color: isActive ? '#fff' : 'var(--text-muted)' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
          <div className="min-w-0 flex-1 space-y-8">
            {activeCategory === null && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#632811]">{t('store.all_categories', 'Tüm Kategoriler')}</h2>
                  <span className="text-xs text-[#8c502e]/80">{rootCategories.length} kategori</span>
                </div>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                  {rootCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className="group cursor-pointer overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 text-left"
                    >
                      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FolderOpen size={48} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-black text-[#632811]">{cat.name}</p>
                          <p className="text-[11px] font-semibold text-[#8c502e]/80">{products.filter((p) => p.category === cat.id).length} ürün</p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activeCategory !== null && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <button onClick={() => { setActiveCategory(null); setComparisons([]); }} className="mb-1 flex cursor-pointer items-center gap-1 text-xs text-[#8c502e]/80 hover:text-orange-500 transition-colors">
                      ← {t('store.back_categories', 'Tüm Kategoriler')}
                    </button>
                    <h2 className="text-xl font-bold text-[#632811]">{activecat?.name}</h2>
                  </div>
                  <span className="text-xs text-[#8c502e]/80">{filteredProducts.length} ürün</span>
                </div>
                {hasComparisons ? (
                  <div className="space-y-6">
                    {comparisons.map((table) => (
                      <div key={table.id} className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                        <div className="border-b border-[#d88a67] px-6 py-4">
                          <h3 className="font-bold text-[#632811]">{table.name}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-[#d88a67]">
                                <th className="w-40 px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#8c502e]/80">{t('store.feature', 'Özellik')}</th>
                                {table.products.map((p) => (
                                  <th key={p.id} className="px-4 py-4 text-center">
                                    <Link href={`/store/${p.slug}`} className="flex flex-col items-center gap-2 hover:opacity-80">
                                      {p.image ? (
                                        <img src={p.image} alt={p.name} className="h-14 w-14 rounded-xl object-cover" />
                                      ) : (
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#f1b978]">
                                          <ShoppingCart size={22} className="text-slate-300" />
                                        </div>
                                      )}
                                      <span className="text-xs font-bold text-[#632811]">{p.name}</span>
                                      <span className="text-sm font-black text-orange-500">{fmt(p.price)}</span>
                                    </Link>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.features.map((feature, fi) => (
                                <tr key={fi} className={fi % 2 === 0 ? 'bg-[#f7ce9e]/50' : ''}>
                                  <td className="px-6 py-3 text-xs font-semibold text-[#8c502e]">{feature.label}</td>
                                  {table.products.map((p) => (
                                    <td key={p.id} className="px-4 py-3 text-center">{renderValue(feature.values[p.id] || '-')}</td>
                                  ))}
                                </tr>
                              ))}
                              <tr>
                                <td className="px-6 py-4" />
                                {table.products.map((p) => (
                                  <td key={p.id} className="px-4 py-4 text-center">
                                    <Link href={`/store/${p.slug}`} className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600">
                                      {t('store.buy', 'Satın Al')} <ChevronRight size={12} />
                                    </Link>
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-[#d88a67] bg-[#f1b978] py-16 text-center shadow-sm">
                    <ShoppingCart size={40} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-sm text-[#8c502e]/80">{t('store.empty_category', 'Bu kategoride ürün bulunmuyor.')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                    {filteredProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/store/${product.slug}`}
                        className="group overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingCart size={40} className="text-slate-300" />
                            </div>
                          )}
                          {product.discount.active && (
                            <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                              -{product.discount.type === 'percent' ? `%${product.discount.value}` : fmt(product.discount.value)}
                            </span>
                          )}
                          {product.stockEnabled && product.stock === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <span className="rounded-full bg-[#f1b978] px-3 py-1 text-xs font-bold text-[#632811]">{t('store.out_of_stock', 'Stok Yok')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="mb-0.5 line-clamp-1 text-sm font-black text-[#632811] group-hover:text-orange-500">{product.name}</p>
                            <div className="flex items-center gap-2">
                              {product.discount.active ? (
                                <>
                                  <span className="text-base font-black text-orange-500">{fmt(product.finalPrice)}</span>
                                  <span className="text-xs text-[#8c502e]/80 line-through">{fmt(product.price)}</span>
                                </>
                              ) : (
                                <span className="text-base font-black text-orange-500">{fmt(product.price)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            {recentPurchases.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#632811]">{t('store.recent', 'Son Satın Alımlar')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {recentPurchases.map((p, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                        {p.itemImage ? (
                          <img src={p.itemImage} alt={p.item} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingCart size={28} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-1 text-xs font-bold text-[#632811]">{p.item}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <img src={`https://mc-heads.net/avatar/${p.username}/20`} alt={p.username} className="h-5 w-5 rounded object-contain" />
                          <span className="truncate text-[11px] font-semibold text-[#8c502e]">{p.username}</span>
                        </div>
                        <p className="mt-1 text-xs font-black text-orange-500">{fmt(p.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <JoinCta />
    </div>
  );
}