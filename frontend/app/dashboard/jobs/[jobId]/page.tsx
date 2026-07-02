// TODO: Poll job status via GET /api/v1/jobs/:jobId (refetch every 2s while running)
// Renders: per-file status list, progress bar, error accordion, download button
export default function JobDetailPage({
  params,
}: {
  params: { jobId: string };
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Job Status</h1>
      {/* TODO: JobStatusPanel component */}
      <p className="text-muted-foreground text-sm">Job ID: {params.jobId}</p>
    </div>
  );
}
