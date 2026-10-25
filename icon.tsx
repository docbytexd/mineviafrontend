import { connectDB } from '@/lib/db/connect';
import { getGeneralSettings } from '@/lib/db/models/settings/GeneralSettings';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

function resolveLocal(url: string): string | null {
  if (!url || url.startsWith('http://') || url.startsWith('https://')) return null;
  const clean = url.split('?')[0];
  if (!clean.startsWith('/')) return null;
  return path.join(process.cwd(), 'public', clean.replace(/^\//, ''));
}

export default async function Icon() {
  let favicon = '';
  try {
    await connectDB();
    const settings = await getGeneralSettings();
    favicon = settings.favicon || '';
  } catch {
    favicon = '';
  }

  if (favicon) {
    try {
      const local = resolveLocal(favicon);
      if (local) {
        const buf = await readFile(local);
        return new Response(buf, {
          headers: {
            'Content-Type': /\.ico$/i.test(local) ? 'image/x-icon' : 'image/png',
            'Cache-Control': 'no-store, must-revalidate',
          },
        });
      }
      const res = await fetch(favicon, { cache: 'no-store' });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        return new Response(buf, {
          headers: {
            'Content-Type': res.headers.get('content-type') || 'image/png',
            'Cache-Control': 'no-store, must-revalidate',
          },
        });
      }
    } catch {
      // fall through
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#4f46e5"/><text x="16" y="22" text-anchor="middle" font-size="16" font-family="sans-serif" fill="white">A</text></svg>`;
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
