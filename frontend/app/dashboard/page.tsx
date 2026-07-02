// TODO: Fetch projects list via GET /api/v1/projects and render ProjectGrid
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        {/* TODO: CreateProjectButton */}
      </div>
      {/* TODO: ProjectGrid component — TanStack Query powered */}
      <p className="text-muted-foreground text-sm">No projects yet.</p>
    </div>
  );
}
