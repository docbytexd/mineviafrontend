'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Send, Search, Box, Check, X, Clock, Play, ChevronRight } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  status: 'in_chest' | 'used' | 'gifted';
  productId: string | null;
  giftedFrom: string | null;
  usedAt: string | null;
  createdAt: string;
}
export default function InventoryPage() {
  const { t } = useSiteLang();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'chest' | 'direct'>('chest');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [transferModal, setTransferModal] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null });
  const [toUsername, setToUsername] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [useLoading, setUseLoading] = useState<string | null>(null);
  const [useSuccess, setUseSuccess] = useState<string | null>(null);
  const [useError, setUseError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([
      fetch('/api/me/inventory').then((r) => r.json()),
      fetch('/api/public/shop').then((r) => r.json()),
    ]).then(([inv, shop]) => {
      if (inv.inventory) setInventory(inv.inventory);
      if (shop.settings?.deliveryMode) setDeliveryMode(shop.settings.deliveryMode);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const filtered = inventory.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  async function handleUse(item: InventoryItem) {
    setUseLoading(item.id);
    setUseError(null);
    setUseSuccess(null);
    const res = await fetch('/api/me/inventory/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: item.id }),
    });
    const data = await res.json();
    setUseLoading(null);
    if (!res.ok) {
      setUseError(data.error || 'Bir hata oluştu.');
      return;
    }
    setUseSuccess(data.message);
    setInventory((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, status: 'used', usedAt: new Date().toISOString() } : i)
    );
    setTimeout(() => setUseSuccess(null), 3000);
  }
  async function handleTransfer() {
    if (!transferModal.item) return;
    setTransferLoading(true);
    setTransferError('');
    setTransferSuccess('');
    const res = await fetch('/api/me/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: transferModal.item.id, toUsername }),
    });
    const data = await res.json();
    setTransferLoading(false);
    if (!res.ok) {
      setTransferError(data.error || 'Bir hata oluştu.');
      return;
    }
    setTransferSuccess(`"${transferModal.item.name}" başarıyla ${toUsername} adlı kullanıcıya gönderildi.`);
    setInventory((prev) =>
      prev.map((i) => i.id === transferModal.item!.id ? { ...i, status: 'gifted' } : i)
    );
    setTimeout(() => {
      setTransferModal({ open: false, item: null });
      setToUsername('');
      setTransferSuccess('');
    }, 2000);
  }
  const statusLabel = (status: string) => {
    if (status === 'in_chest') return { label: t('inventory.status_chest', 'Sandıkta'), color: 'bg-blue-100 text-blue-600' };
    if (status === 'used') return { label: t('inventory.status_used', 'Kullanıldı'), color: 'bg-[#f1b978] text-[#8c502e]' };
    if (status === 'gifted') return { label: t('inventory.status_gifted', 'Gönderildi'), color: 'bg-purple-100 text-purple-600' };
    return { label: status, color: 'bg-[#f1b978] text-[#8c502e]' };
  };
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        badge={t('inventory.badge', 'Sandık')}
        title={t('inventory.title', 'Envanterim')}
        description={deliveryMode === 'chest'
          ? t('inventory.desc_chest', 'Satın aldığın ürünler burada listelenir. Kullan butonuna basarak oyun içinde aktif edebilirsin.')
          : t('inventory.desc_direct', 'Satın aldığın ürünler otomatik olarak hesabına eklenir.')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('inventory.badge', 'Sandık') }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {(useSuccess || useError) && (
          <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${useSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {useSuccess || useError}
          </div>
        )}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-orange-500" />
            <span className="font-bold text-[#632811]">{inventory.filter((i) => i.status === 'in_chest').length} ürün sandıkta</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c502e]/80" />
            <input
              type="text"
              placeholder={t('inventory.search', 'Ürün ara...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#d88a67] bg-[#f1b978] py-2.5 pl-9 pr-3 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <Box size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{t('inventory.empty', 'Envanter boş')}</p>
            <p className="mt-1 text-sm text-[#8c502e]/80">{t('inventory.empty_desc', 'Mağazadan ürün satın alarak başlayabilirsin.')}</p>
            <Link href="/store" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600">
              {t('inventory.go_store', 'Mağazaya Git')} <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((item) => {
              const { label, color } = statusLabel(item.status);
              return (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm transition-all hover:shadow-md">
                  <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <Package size={36} className="text-slate-200" />
                    {item.quantity > 1 && (
                      <span className="absolute right-2 top-2 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">
                        x{item.quantity}
                      </span>
                    )}
                    {item.giftedFrom && (
                      <span className="absolute left-2 top-2 rounded-full bg-purple-500 px-2 py-0.5 text-[9px] font-bold text-white">
                        {t('inventory.gift', 'Hediye')}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-xs font-bold text-[#632811]">{item.name}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}>
                      {label}
                    </span>
                    {item.createdAt && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-[#8c502e]/80">
                        <Clock size={10} />
                        {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                    {item.status === 'in_chest' && (
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => handleUse(item)}
                          disabled={useLoading === item.id}
                          className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-orange-500 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                        >
                          {useLoading === item.id ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          ) : (
                            <><Play size={10} /> {t('inventory.use', 'Kullan')}</>
                          )}
                        </button>
                        <button
                          onClick={() => { setTransferModal({ open: true, item }); setToUsername(''); setTransferError(''); setTransferSuccess(''); }}
                          className="flex cursor-pointer items-center justify-center rounded-lg border border-[#d88a67] px-2 py-1.5 text-[11px] font-bold text-[#8c502e] transition-colors hover:bg-[#f7ce9e]"
                        >
                          <Send size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {transferModal.open && transferModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#f1b978] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-black text-[#632811]">{t('inventory.send', 'Ürün Gönder')}</h3>
              <button onClick={() => setTransferModal({ open: false, item: null })} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-[#8c502e]/80 hover:bg-[#f1b978]">
                <X size={16} />
              </button>
            </div>
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#f7ce9e] p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200">
                <Package size={24} className="text-[#8c502e]/80" />
              </div>
              <div>
                <p className="font-bold text-[#632811]">{transferModal.item.name}</p>
                {transferModal.item.quantity > 1 && <p className="text-xs text-[#8c502e]/80">x{transferModal.item.quantity} adet</p>}
              </div>
            </div>
            {transferSuccess ? (
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <Check size={28} className="text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-emerald-600">{transferSuccess}</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-bold text-[#8c502e]">{t('inventory.username', 'Kullanıcı Adı')}</label>
                  <input
                    type="text"
                    placeholder={t('inventory.username_ph', 'Gönderilecek oyuncu adı')}
                    value={toUsername}
                    onChange={(e) => setToUsername(e.target.value)}
                    className="w-full rounded-xl border border-[#d88a67] px-4 py-2.5 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                  {transferError && <p className="mt-2 text-xs font-semibold text-red-500">{transferError}</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTransferModal({ open: false, item: null })}
                    className="flex-1 cursor-pointer rounded-xl border border-[#d88a67] py-2.5 text-sm font-semibold text-[#8c502e] transition-colors hover:bg-[#f7ce9e]"
                  >
                    {t('common.cancel', 'İptal')}
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={transferLoading || !toUsername.trim()}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
                  >
                    {transferLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <><Send size={14} /> {t('common.submit', 'Gönder')}</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <JoinCta />
    </div>
  );
}