'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, CreditCard, ArrowRight } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import Link from 'next/link';
type ResultStatus = 'loading' | 'success' | 'failed' | 'pending';
function PaymentResult() {
  const { t } = useSiteLang();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ResultStatus>('loading');
  const [payment, setPayment] = useState<{
    amount: number;
    credits: number;
    gateway: string;
    transactionId: string;
  } | null>(null);
  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    if (!paymentId) { setStatus('failed'); return; }
    let attempts = 0;
    const check = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/payment/status?id=${paymentId}`);
        const data = await res.json();
        if (!res.ok) { setStatus('failed'); return; }
        if (data.status === 'completed') {
          setStatus('success');
          setPayment(data.payment);
        } else if (data.status === 'failed') {
          setStatus('failed');
        } else if (attempts < 10) {
          setTimeout(check, 3000);
        } else {
          setStatus('pending');
        }
      } catch {
        setStatus('failed');
      }
    };
    check();
  }, [searchParams]);
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--bg)' }}>
        <Loader2 size={40} className="animate-spin text-indigo-500" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('payment.processing', 'Ödeme işleniyor...')}</p>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
              <Loader2 size={40} className="animate-spin text-yellow-500" />
            </div>
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>{t('payment.pending', 'Ödeme Beklemede')}</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('payment.pending_desc', 'Ödemeniz doğrulanıyor. Bu işlem birkaç dakika sürebilir.')}
          </p>
          <div className="mt-6">
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white"
              style={{ backgroundColor: '#6366f1' }}
            >
              {t('payment.go_profile', 'Profile Git')} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}
        >
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>{t('payment.success', 'Ödeme Başarılı!')}</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('payment.success_desc', 'Bakiyeniz başarıyla güncellendi')}
          </p>
          {payment && (
            <div
              className="mt-6 rounded-xl border p-4 text-left space-y-2 text-sm"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
            >
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>{t('payment.amount', 'Ödenen Tutar')}</span>
                <span className="font-bold" style={{ color: 'var(--text)' }}>${payment.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>{t('payment.credits', 'Eklenen Kredi')}</span>
                <span className="font-bold text-indigo-500">{payment.credits} Credits</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>{t('payment.method', 'Ödeme Yöntemi')}</span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{payment.gateway}</span>
              </div>
              {payment.transactionId && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>{t('payment.tx', 'İşlem No')}</span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {payment.transactionId.length > 20
                      ? `${payment.transactionId.substring(0, 20)}...`
                      : payment.transactionId
                    }
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white"
              style={{ backgroundColor: '#6366f1' }}
            >
              {t('payment.go_profile', 'Profile Git')} <ArrowRight size={15} />
            </Link>
            <Link
              href="/credits"
              className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <CreditCard size={15} /> {t('payment.add_more', 'Daha Fazla Kredi Yükle')}
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div
        className="w-full max-w-md rounded-2xl border p-8 text-center"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <XCircle size={40} className="text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>{t('payment.failed', 'Ödeme Başarısız')}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('payment.failed_desc', 'Ödeme tamamlanamadı. Lütfen tekrar deneyin.')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/credits"
            className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white"
            style={{ backgroundColor: '#6366f1' }}
          >
            <CreditCard size={15} /> {t('payment.retry', 'Tekrar Dene')}
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {t('payment.home', 'Ana Sayfaya Dön')}
          </Link>
        </div>
      </div>
    </div>
  );
}
export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    }>
      <PaymentResult />
    </Suspense>
  );
}