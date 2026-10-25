import { connectDB } from '@/lib/db/connect';
import { News } from '@/lib/db/models/content/News';
import { NewsComment } from '@/lib/db/models/content/NewsComment';
import { User } from '@/lib/db/models/User';
import { getSessionUser } from '@/lib/auth/session';
import { getGeneralSettings } from '@/lib/db/models/settings/GeneralSettings';
import '@/lib/db/models/content/NewsCategory';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Eye, Tag, ChevronRight, ArrowLeft, MessageCircle } from 'lucide-react';
import NewsCommentForm from '@/components/news/NewsCommentForm';
import SiteT from '@/components/SiteT';
interface PageProps {
  params: Promise<{ slug: string }>;
}
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  await connectDB();
  const [news, settings] = await Promise.all([
    News.findOne({ slug, status: 'published' }).select('title excerpt').lean(),
    getGeneralSettings(),
  ]);
  const serverName = settings?.serverName || 'Areofy';
  if (!news) return { title: `${serverName} · Haber Bulunamadı` };
  return {
    title: `${serverName} · ${news.title}`,
    description: news.excerpt || undefined,
  };
}
interface Category {
  _id: string;
  name: string;
  color: string;
}
interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  publishedAt: string | Date;
  views: number;
  tags: string[];
  category?: Category;
  allowComments: boolean;
  author?: { _id: string; username: string } | null;
}
interface CommentItem {
  _id: string;
  authorName: string;
  content: string;
  createdAt: Date;
  user?: { username: string } | null;
}
interface RelatedItem {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string;
  publishedAt: string | Date;
  category?: Category;
}
async function getData(slug: string) {
  await connectDB();
  void User;
  const news = await News.findOneAndUpdate(
    { slug, status: 'published' },
    { $inc: { views: 1 } },
    { returnDocument: 'after' }
  )
    .populate('category', 'name color')
    .populate('author', 'username')
    .lean<NewsItem>();
  if (!news) return null;
  const categoryId = (news.category as any)?._id || null;
  const [related, comments] = await Promise.all([
    News.find({
      status: 'published',
      slug: { $ne: slug },
      ...(categoryId ? { category: categoryId } : {}),
    })
      .populate('category', 'name color')
      .sort({ publishedAt: -1 })
      .limit(4)
      .select('title slug coverImage publishedAt category')
      .lean<RelatedItem[]>(),
    NewsComment.find({ news: (news as any)._id, status: 'approved' })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .lean<CommentItem[]>(),
  ]);
  return {
    news: JSON.parse(JSON.stringify(news)) as NewsItem,
    related: JSON.parse(JSON.stringify(related)) as RelatedItem[],
    comments: JSON.parse(JSON.stringify(comments)) as CommentItem[],
  };
}
function formatDate(date: Date | string | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [data, user] = await Promise.all([getData(slug), getSessionUser()]);
  if (!data) notFound();
  const { news, related, comments } = data;
  const category = news.category as unknown as Category | undefined;
  const author = news.author as unknown as { username: string } | null;
  return (
    <div className="bg-[#f7ce9e] text-[#632811]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-[#8c502e]/80">
          <Link href="/" className="transition-colors hover:text-orange-500"><SiteT k="common.home" fb="Anasayfa" /></Link>
          <span>/</span>
          <Link href="/" className="transition-colors hover:text-orange-500"><SiteT k="news.crumb" fb="Haber" /></Link>
          <span>/</span>
          <span className="line-clamp-1 font-medium text-[#8c502e]">{news.title}</span>
        </nav>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1">
            <article className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
              {news.coverImage && (
                <div className="relative h-72 w-full overflow-hidden md:h-96">
                  <Image src={news.coverImage} alt={news.title} fill sizes="100vw" className="object-cover" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {category && (
                    <div className="absolute bottom-4 left-4">
                      <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: category.color }}>
                        {category.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="p-6 md:p-8">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  {author && (
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://mc-heads.net/avatar/${author.username}/32`}
                        alt={author.username}
                        className="h-8 w-8 rounded-lg object-contain"
                      />
                      <span className="text-sm font-semibold text-[#632811]">{author.username}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8c502e]/80">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={12} />
                      {formatDate(news.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye size={12} />
                      {news.views} <SiteT k="news.views" fb="görüntülenme" />
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle size={12} />
                      {comments.length} <SiteT k="news.comment_count" fb="yorum" />
                    </span>
                    {category && !news.coverImage && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: `${category.color}15`, color: category.color }}
                      >
                        {category.name}
                      </span>
                    )}
                  </div>
                </div>
                <h1 className="mb-4 text-2xl font-black leading-tight text-[#632811] md:text-3xl">
                  {news.title}
                </h1>
                {news.excerpt && (
                  <p className="mb-6 rounded-xl border-l-4 border-[#8c502e] bg-[#f7ce9e] px-4 py-3 text-sm font-medium leading-relaxed text-[#632811]">
                    {news.excerpt}
                  </p>
                )}
                <div
                  className="prose max-w-none"
                  style={{ color: '#3f2a1d', lineHeight: '1.8', fontSize: '0.9rem' }}
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
                {news.tags?.length > 0 && (
                  <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[#d88a67] pt-6">
                    <Tag size={13} className="text-[#8c502e]/80" />
                    {news.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-[#d88a67] bg-[#f7ce9e] px-3 py-1 text-xs font-medium text-[#8c502e]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
            {news.allowComments && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
                <div className="border-b border-[#d88a67] px-6 py-4">
                  <h3 className="font-bold text-[#632811]"><SiteT k="news.comments" fb="Yorumlar" /> ({comments.length})</h3>
                </div>
                {comments.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-[#8c502e]/80">
                    <SiteT k="news.no_comments" fb="Henüz yorum yok. İlk yorumu sen yap!" />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {comments.map((c) => {
                      const username = c.user?.username || c.authorName || 'Anonim';
                      return (
                        <div key={String(c._id)} className="flex items-start gap-3 px-6 py-4">
                          <img
                            src={`https://mc-heads.net/avatar/${username}/40`}
                            alt={username}
                            className="h-10 w-10 shrink-0 rounded-lg object-contain"
                          />
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-sm font-bold text-[#632811]">{username}</span>
                              <span className="text-[11px] text-[#8c502e]/80">{formatDate(c.createdAt)}</span>
                            </div>
                            <p className="text-sm leading-relaxed text-[#8c502e]">{c.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="border-t border-[#d88a67] p-6">
                  {user ? (
                    <NewsCommentForm slug={slug} username={user.username} />
                  ) : (
                    <div className="rounded-xl bg-[#f7ce9e] p-4 text-center">
                      <p className="mb-3 text-sm text-[#8c502e]"><SiteT k="news.login_to_comment" fb="Yorum yazmak için giriş yapmalısınız." /></p>
                      <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600">
                        <SiteT k="site.login" fb="Giriş Yap" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d88a67] bg-[#f1b978] px-4 py-2.5 text-sm font-semibold text-[#8c502e] shadow-sm transition-colors hover:bg-[#f7ce9e] hover:text-orange-500"
              >
                <ArrowLeft size={15} /> <SiteT k="news.back" fb="Haberlere Dön" />
              </Link>
            </div>
          </div>
          <aside className="w-full shrink-0 space-y-4 lg:w-72">
            <div className="overflow-hidden rounded-2xl border border-[#d88a67] bg-[#f1b978] shadow-sm">
              <div className="border-b border-[#d88a67] px-4 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c502e]/80"><SiteT k="news.related" fb="Diğer Haberlere Göz At" /></h3>
              </div>
              {related.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8c502e]/80"><SiteT k="news.no_related" fb="Başka haber bulunamadı." /></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {related.map((item) => (
                    <Link
                      key={String(item._id)}
                      href={`/news/${item.slug}`}
                      className="group flex items-start gap-3 p-4 transition-colors hover:bg-[#f7ce9e]"
                    >
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f1b978]">
                        {item.coverImage ? (
                          <Image src={item.coverImage} alt={item.title} fill sizes="80px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-indigo-100 to-purple-100" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 line-clamp-2 text-xs font-semibold text-[#632811] transition-colors group-hover:text-orange-500">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-[#8c502e]/80">{formatDate(item.publishedAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="border-t border-[#d88a67] p-3">
                <Link
                  href="/"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2 text-xs font-bold text-white transition-colors hover:bg-orange-600"
                >
                  Tüm Haberler <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}