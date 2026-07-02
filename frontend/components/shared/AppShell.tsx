// TODO: Implement sidebar navigation, header, and main content area
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* TODO: Sidebar */}
      <aside className="w-60 border-r bg-muted/40 p-4">
        <p className="text-xs text-muted-foreground">Navigation placeholder</p>
      </aside>
      <div className="flex flex-1 flex-col">
        {/* TODO: Header with user menu */}
        <header className="h-14 border-b px-6 flex items-center">
          <p className="text-xs text-muted-foreground">Header placeholder</p>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
