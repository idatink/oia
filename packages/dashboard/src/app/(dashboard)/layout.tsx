import DashboardShell from '@/components/dashboard/DashboardShell';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
