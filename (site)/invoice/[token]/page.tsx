'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Receipt, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
interface InvoiceData {
  orderId: string;
  status: string;
  total: number;
  currency: string;
  currencySymbol: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
  serverName: string;
  logo: string;
  paymentMethod: string;
  buyerUsername?: string;
}
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid: { label: 'Ödendi', color: '#22c55e', icon: CheckCircle },
  pending: { label: 'Bekliyor', color: 'var(--accent)', icon: Clock },
  failed: { label: 'Başarısız', color: '#ef4444', icon: XCircle },
  refunded: { label: 'İade Edildi', color: '#6366f1', icon: XCircle },
};
export default function InvoicePage() {
  const { t } = useSiteLang();
  const params = useParams();
  const token = params.token as string;
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/invoice/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setInvoice(d);
      })
      .catch(() => setError(t('invoice.load_error', 'Fatura yüklenemedi.')))
      .finally(() => setLoading(false));
  }, [token]);
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-indigo-500" />
      </div>
    );
  }
  if (error || !invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <XCircle size={48} className="text-red-400" />
        <p className="text-lg font-semibold text-[#632811]">{error || t('invoice.not_found', 'Fatura bulunamadı.')}</p>
        <p className="text-sm text-[#8c502e]/80">{t('invoice.expired', 'Bu bağlantı süresi dolmuş ya da geçersiz olabilir.')}</p>
      </div>
    );
  }
  const statusInfo = STATUS_MAP[invoice.status] || { label: invoice.status, color: '#94a3b8', icon: Clock };
  const StatusIcon = statusInfo.icon;
  return (
    <div className="min-h-screen bg-[#f7ce9e] py-10 px-4">
      <div className="mx-auto max-w-lg rounded-2xl bg-[#f1b978] shadow-xl overflow-hidden">
        <div className="bg-slate-900 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {invoice.logo ? (
                <img src={invoice.logo} alt={invoice.serverName} className="h-8 object-contain" />
              ) : (
                <Receipt size={24} />
              )}
              <span className="text-lg font-bold">{invoice.serverName}</span>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
            >
              <StatusIcon size={12} />
              {statusInfo.label}
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-black">{t('invoice.title', 'Fatura')}</h1>
          <p className="text-sm text-[#8c502e]/80">#{invoice.orderId}</p>
        </div>
        <div className="px-8 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-[#8c502e]/80 uppercase tracking-wide">Tarih</p>
              <p className="mt-0.5 font-semibold text-[#632811]">
                {new Date(invoice.createdAt).toLocaleDateString('tr-TR', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#8c502e]/80 uppercase tracking-wide">{t('invoice.method', 'Ödeme Yöntemi')}</p>
              <p className="mt-0.5 font-semibold text-[#632811] capitalize">{invoice.paymentMethod || '—'}</p>
            </div>
            {invoice.buyerUsername && (
              <div>
                <p className="text-xs font-medium text-[#8c502e]/80 uppercase tracking-wide">Alıcı</p>
                <p className="mt-0.5 font-semibold text-[#632811]">{invoice.buyerUsername}</p>
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#8c502e]/80">{t('invoice.items', 'Ürünler')}</p>
            <div className="divide-y divide-slate-100 rounded-xl border border-[#d88a67] overflow-hidden">
              {invoice.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                    <Package size={14} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#632811] truncate">{item.name}</p>
                    <p className="text-xs text-[#8c502e]/80">Adet: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-[#632811]">
                    {invoice.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#f7ce9e] px-5 py-4">
            <p className="text-sm font-semibold text-[#8c502e]">{t('invoice.total', 'Toplam Tutar')}</p>
            <p className="text-2xl font-black text-slate-900">
              {invoice.currencySymbol}{invoice.total.toFixed(2)}
              <span className="ml-1 text-sm font-medium text-[#8c502e]/80">{invoice.currency}</span>
            </p>
          </div>
        </div>
        <div className="border-t border-dashed border-[#d88a67] px-8 py-4 text-center">
          <p className="text-xs text-[#8c502e]/80">Bu fatura {invoice.serverName} tarafından oluşturulmuştur.</p>
        </div>
      </div>
    </div>
  );
}