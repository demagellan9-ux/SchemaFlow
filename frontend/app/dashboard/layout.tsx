import { AppShell } from "@/components/shared/AppShell";

// TODO: Add server-side session validation before rendering dashboard
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
