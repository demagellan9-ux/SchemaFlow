// TODO: Fetch project detail via GET /api/v1/projects/:projectId
// Renders: upload list, schema selector, job history
export default function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Project</h1>
      {/* TODO: ProjectDetail component */}
      <p className="text-muted-foreground text-sm">Project ID: {params.projectId}</p>
    </div>
  );
}
