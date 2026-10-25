'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Plus, Clock, CheckCircle, AlertCircle, Inbox, ChevronRight } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import JoinCta from '@/components/JoinCta';
interface Ticket {
  id: string;
  number: number;
  subject: string;
  status: { name: string; color: string; isClosed: boolean } | null;
  category: { name: string } | null;
  lastReplyAt: string;
  lastReplyBy: 'user' | 'staff';
  messageCount: number;
}
export default function SupportPage() {
  const { t } = useSiteLang();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/me/tickets')
      .then((r) => r.json())
      .then((d) => { if (d.tickets) setTickets(d.tickets); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('support.just_now', 'Az önce');
    if (mins < 60) return `${mins}${t('support.mins_ago', 'dk önce')}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t('support.hours_ago', 'sa önce')}`;
    return `${Math.floor(hours / 24)}${t('support.days_ago', 'g önce')}`;
  }
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }}>
      <PageHero
        badge={t('support.title', 'Destek')}
        title={t('support.my_tickets', 'Destek Taleplerim')}
        description={t('support.desc', 'Sorunlarını buradan iletebilir, mevcut taleplerinizi takip edebilirsin.')}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('support.title', 'Destek') }]}
        image="/images/support-hero.jpg"
      />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-orange-500" />
            <span className="font-bold text-[#632811]">{tickets.length} {t('support.ticket_count', 'talep')}</span>
          </div>
          <Link
            href="/support/new"
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            <Plus size={15} /> {t('support.new', 'Yeni Talep')}
          </Link>
        </div>
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <Inbox size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{t('support.empty', 'Henüz talebiniz yok')}</p>
            <p className="mt-1 text-sm text-[#8c502e]/80">{t('support.empty_desc', 'Yardıma mı ihtiyacın var? Hemen bir talep aç.')}</p>
            <Link href="/support/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600">
              <Plus size={14} /> {t('support.open_new', 'Yeni Talep Aç')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/support/${ticket.id}`}
                className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] p-4 shadow-sm transition-all hover:shadow-md hover:border-orange-200"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: ticket.status?.isClosed ? 'var(--bg)' : '#fff7ed' }}>
                  {ticket.status?.isClosed
                    ? <CheckCircle size={22} className="text-[#8c502e]/80" />
                    : ticket.lastReplyBy === 'staff'
                      ? <AlertCircle size={22} className="text-orange-500" />
                      : <MessageCircle size={22} className="text-orange-400" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#8c502e]/80">#{ticket.number}</span>
                    {ticket.category && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: '#6366f1' }}>
                        {ticket.category.name}
                      </span>
                    )}
                    {ticket.lastReplyBy === 'staff' && !ticket.status?.isClosed && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                        {t('support.reply', 'Yanıt Var')}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm font-bold text-[#632811] group-hover:text-orange-500">
                    {ticket.subject}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-[#8c502e]/80">
                    <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(ticket.lastReplyAt)}</span>
                    <span>{ticket.messageCount} {t('support.messages', 'mesaj')}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {ticket.status && (
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                      style={{ backgroundColor: ticket.status.color }}>
                      {ticket.status.name}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <JoinCta />
    </div>
  );
}