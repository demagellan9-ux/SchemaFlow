import { Badge } from "@/components/ui/badge";
import type { JobStatus, ExportStatus } from "@/types/job";
import type { UploadStatus } from "@/types/upload";
import type { ProjectStatus } from "@/types/project";

type AnyStatus = JobStatus | ExportStatus | UploadStatus | ProjectStatus;

const STATUS_CONFIG: Record<
  AnyStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }
> = {
  // Job statuses
  queued: { label: "Queued", variant: "secondary" },
  running: { label: "Running", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  completed_with_errors: { label: "Completed with errors", variant: "warning" },
  failed: { label: "Failed", variant: "destructive" },
  // Export statuses
  pending: { label: "Pending", variant: "secondary" },
  available: { label: "Available", variant: "success" },
  expired: { label: "Expired", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
  // Upload statuses
  uploaded: { label: "Uploaded", variant: "default" },
  sliced: { label: "Ready", variant: "success" },
  // Project statuses
  active: { label: "Active", variant: "success" },
  archived: { label: "Archived", variant: "outline" },
};

interface StatusBadgeProps {
  status: AnyStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
