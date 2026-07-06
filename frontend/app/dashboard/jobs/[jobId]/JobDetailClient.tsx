"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useJobStatus } from "@/hooks/useJobStatus";

interface Props {
  jobId: string;
}

export default function JobDetailClient({ jobId }: Props) {
  const { data: job, isPending, isError } = useJobStatus(jobId);

  if (isPending) return <LoadingSpinner />;
  if (isError || !job) return <p className="text-sm text-destructive">Failed to load job.</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Status"
        description={`Job ID: ${jobId}`}
        actions={<StatusBadge status={job.status} />}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress</CardTitle>
          <CardDescription>
            {job.completed_files} of {job.total_files} files processed
            {job.failed_files > 0 && ` · ${job.failed_files} failed`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Per-file status panel available in Phase 9.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
