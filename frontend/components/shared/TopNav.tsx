import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export function TopNav() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <Breadcrumbs />
      {/* User menu placeholder — Phase 7 (auth) */}
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-muted" aria-label="User menu placeholder" />
      </div>
    </header>
  );
}
