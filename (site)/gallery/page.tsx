'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight as ChevronRightIcon, ZoomIn, Upload, ImageIcon, Check } from 'lucide-react';
import { useSiteLang } from '@/lib/site/SiteLangContext';
import PageHero from '@/components/PageHero';
import JoinCta from '@/components/JoinCta';
interface GalleryItem {
  id: string;
  image: string;
  caption: string;
  uploaderName: string;
  createdAt: string;
}
export default function GalleryPage() {
  const { t } = useSiteLang();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    fetch('/api/public/gallery')
      .then((r) => r.json())
      .then((d) => { if (d.items) setItems(d.items); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (activeIndex === null) return;
      if (e.key === 'Escape') setActiveIndex(null);
      if (e.key === 'ArrowRight') setActiveIndex((p) => p !== null ? Math.min(p + 1, items.length - 1) : null);
      if (e.key === 'ArrowLeft') setActiveIndex((p) => p !== null ? Math.max(p - 1, 0) : null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, items.length]);
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadError('');
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadError('');
  }
  async function handleUpload() {
    if (!file) { setUploadError(t('gallery.select', 'Lütfen bir görsel seçin.')); return; }
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);
    const res = await fetch('/api/public/gallery/upload', { method: 'POST', body: formData });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setUploadError(data.error || t('gallery.failed', 'Yükleme başarısız.')); return; }
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadModal(false);
      setUploadSuccess(false);
      setFile(null);
      setPreview(null);
      setCaption('');
    }, 2000);
  }
  function closeUpload() {
    setUploadModal(false);
    setFile(null);
    setPreview(null);
    setCaption('');
    setUploadError('');
    setUploadSuccess(false);
  }
  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d88a67] border-t-orange-500" />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#f7ce9e] text-[#632811]">
      <PageHero
        badge={t('gallery.badge', 'Galeri')}
        title={t('gallery.title', 'Sunucu Galerimiz')}
        description={`${items.length} fotoğraf`}
        crumbs={[{ label: t('common.home', 'Anasayfa'), href: '/' }, { label: t('gallery.badge', 'Galeri') }]}
      >
        <button
          onClick={() => setUploadModal(true)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Upload size={15} /> {t('gallery.upload', 'Görsel Yükle')}
        </button>
      </PageHero>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d88a67] bg-[#f1b978] py-20 text-center shadow-sm">
            <ImageIcon size={48} className="mb-4 text-slate-200" />
            <p className="font-bold text-[#8c502e]">{t('gallery.empty', 'Henüz görsel yok')}</p>
            <p className="mt-1 text-sm text-[#8c502e]/80">{t('gallery.empty_desc', 'İlk görseli sen yükle!')}</p>
            <button onClick={() => setUploadModal(true)} className="mt-5 flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600">
              <Upload size={14} /> {t('gallery.upload', 'Görsel Yükle')}
            </button>
          </div>
        ) : (
          <div className="columns-2 gap-4 sm:columns-3 md:columns-4">
            {items.map((item, i) => (
              <div
                key={item.id}
                onClick={() => setActiveIndex(i)}
                className="group mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative overflow-hidden">
                  <img src={item.image} alt={item.caption || 'Galeri görseli'} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                    <ZoomIn size={28} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
                {(item.caption || item.uploaderName) && (
                  <div className="px-3 py-2.5">
                    {item.caption && <p className="text-xs font-semibold text-[#632811] line-clamp-2">{item.caption}</p>}
                    {item.uploaderName && <p className="mt-0.5 text-[10px] text-[#8c502e]/80">{item.uploaderName}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {activeIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setActiveIndex(null)}>
          <button onClick={(e) => { e.stopPropagation(); setActiveIndex(null); }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1b978]/10 text-white transition-colors hover:bg-[#f1b978]/20">
            <X size={20} />
          </button>
          {activeIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setActiveIndex((p) => p !== null ? p - 1 : null); }}
              className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f1b978]/10 text-white transition-colors hover:bg-[#f1b978]/20">
              <ChevronLeft size={24} />
            </button>
          )}
          {activeIndex < items.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setActiveIndex((p) => p !== null ? p + 1 : null); }}
              className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f1b978]/10 text-white transition-colors hover:bg-[#f1b978]/20">
              <ChevronRightIcon size={24} />
            </button>
          )}
          <div className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={items[activeIndex].image} alt={items[activeIndex].caption || 'Galeri görseli'}
              className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" />
            {(items[activeIndex].caption || items[activeIndex].uploaderName) && (
              <div className="text-center">
                {items[activeIndex].caption && <p className="text-sm font-semibold text-white">{items[activeIndex].caption}</p>}
                {items[activeIndex].uploaderName && <p className="text-xs text-white/50">{items[activeIndex].uploaderName}</p>}
              </div>
            )}
            <p className="text-xs text-white/30">{activeIndex + 1} / {items.length}</p>
          </div>
        </div>
      )}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[#f1b978] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d88a67] px-6 py-4">
              <h3 className="font-black text-[#632811]">{t('gallery.upload', 'Görsel Yükle')}</h3>
              <button onClick={closeUpload} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#8c502e]/80 hover:bg-[#f1b978]">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {uploadSuccess ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <Check size={32} className="text-emerald-500" />
                  </div>
                  <p className="font-bold text-[#632811]">{t('gallery.uploaded', 'Görsel Yüklendi!')}</p>
                  <p className="mt-1 text-sm text-[#8c502e]/80">{t('gallery.pending', 'Görseliniz inceleme sonrası yayınlanacak.')}</p>
                </div>
              ) : (
                <>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d88a67] bg-[#f7ce9e] p-8 transition-colors hover:border-orange-400 hover:bg-orange-50"
                  >
                    {preview ? (
                      <img src={preview} alt="Önizleme" className="max-h-40 max-w-full rounded-xl object-contain" />
                    ) : (
                      <>
                        <Upload size={32} className="mb-3 text-slate-300" />
                        <p className="text-sm font-semibold text-[#8c502e]">{t('gallery.drop', 'Tıkla veya sürükle bırak')}</p>
                        <p className="mt-1 text-xs text-[#8c502e]/80">{t('gallery.formats', 'JPG, PNG, WEBP • Maks 5MB')}</p>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 rounded-xl bg-[#f7ce9e] px-3 py-2">
                      <ImageIcon size={14} className="text-[#8c502e]/80" />
                      <span className="flex-1 truncate text-xs text-[#8c502e]">{file.name}</span>
                      <button onClick={() => { setFile(null); setPreview(null); }} className="text-[#8c502e]/80 hover:text-red-400">
                        <X size={13} />
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#8c502e]">{t('gallery.caption', 'Açıklama (isteğe bağlı)')}</label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder={t('gallery.caption_ph', 'Görsel hakkında kısa bir açıklama...')}
                      maxLength={300}
                      className="w-full rounded-xl border border-[#d88a67] px-4 py-2.5 text-sm text-[#632811] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div className="rounded-xl bg-orange-50 px-3 py-2.5 text-xs text-[#8c502e]">
                    {t('gallery.moderation', 'Yüklenen görseller yayınlanmadan önce moderatörler tarafından incelenir.')}
                  </div>
                  {uploadError && <p className="text-xs font-semibold text-red-500">{uploadError}</p>}
                  <div className="flex gap-3">
                    <button onClick={closeUpload} className="flex-1 rounded-xl border border-[#d88a67] py-2.5 text-sm font-semibold text-[#8c502e] transition-colors hover:bg-[#f7ce9e]">
                      {t('common.cancel', 'İptal')}
                    </button>
                    <button onClick={handleUpload} disabled={uploading || !file}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60">
                      {uploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Upload size={14} /> {t('common.save', 'Yükle')}</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <JoinCta />
    </div>
  );
}