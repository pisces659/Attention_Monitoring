import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/hooks/use-auth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
