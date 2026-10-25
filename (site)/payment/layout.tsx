import { requireLogin } from '@/lib/auth/requireLogin';

export default async function PaymentLayout({ children }: { children: React.ReactNode }) {
  await requireLogin('/payment');
  return <>{children}</>;
}
