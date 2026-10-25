import { requireLogin } from '@/lib/auth/requireLogin';

export default async function CreditsLayout({ children }: { children: React.ReactNode }) {
  await requireLogin('/credits');
  return <>{children}</>;
}
