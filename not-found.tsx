import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Sayfa Bulunamadı · Areofy',
};
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center bg-[#f7ce9e] text-[#632811]">
      <div className="mb-6 select-none text-[120px] font-black leading-none text-slate-200 md:text-[180px]">
        404
      </div>
      <div className="mb-2 flex items-center justify-center gap-3">
        <div className="h-px w-12 bg-orange-400" />
        <span className="text-xs font-black uppercase tracking-widest text-orange-500">Sayfa Bulunamadı</span>
        <div className="h-px w-12 bg-orange-400" />
      </div>
      <h1 className="mb-3 text-2xl font-black text-[#632811] md:text-3xl">
        Aradığınız sayfa mevcut değil
      </h1>
      <p className="mb-8 max-w-md text-sm text-[#8c502e]/80">
        Sayfa kaldırılmış, adı değiştirilmiş veya hiç var olmamış olabilir.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
        >
          Anasayfaya Dön
        </Link>
        <Link
          href="/support"
          className="rounded-xl border border-[#d88a67] bg-[#f1b978] px-6 py-3 text-sm font-bold text-[#8c502e] transition-colors hover:bg-[#f7ce9e]"
        >
          Destek Al
        </Link>
      </div>
      <div className="mt-16 flex flex-wrap items-center justify-center gap-4 text-xs text-[#8c502e]/80">
        <Link href="/store" className="transition-colors hover:text-orange-500">Mağaza</Link>
        <span>·</span>
        <Link href="/faq" className="transition-colors hover:text-orange-500">Yardım</Link>
        <span>·</span>
        <Link href="/support" className="transition-colors hover:text-orange-500">Destek</Link>
        <span>·</span>
        <Link href="/play" className="transition-colors hover:text-orange-500">Nasıl Oynanır</Link>
      </div>
    </div>
  );
}