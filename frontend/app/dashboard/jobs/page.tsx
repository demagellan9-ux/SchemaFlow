import { Cpu } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Monitor ETL consolidation jobs"
      />
      <EmptyState
        icon={Cpu}
        title="No jobs yet"
        description="Run a consolidation job from a project to see it here."
      />
    </div>
  );
}
