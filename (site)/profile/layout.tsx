import { requireLogin } from '@/lib/auth/requireLogin';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  await requireLogin('/profile');
  return <>{children}</>;
}
