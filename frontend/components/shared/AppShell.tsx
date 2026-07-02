import { Sidebar } from "@/components/shared/Sidebar";
import { TopNav } from "@/components/shared/TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <footer className="border-t px-6 py-3">
          <p className="text-xs text-muted-foreground">
            SchemaFlow &mdash; Metadata-driven spreadsheet consolidation
          </p>
        </footer>
      </div>
    </div>
  );
}
