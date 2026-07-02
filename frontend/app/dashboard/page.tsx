import { FolderOpen, Upload, Cpu, FileDown } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { RecentActivity } from "@/components/features/dashboard/RecentActivity";

// Mock data — replaced with TanStack Query calls in Phase 7
const MOCK_STATS = [
  {
    title: "Active Projects",
    value: 0,
    description: "No projects created yet",
    icon: FolderOpen,
  },
  {
    title: "Recent Uploads",
    value: 0,
    description: "Files uploaded this week",
    icon: Upload,
  },
  {
    title: "Running Jobs",
    value: 0,
    description: "ETL jobs in progress",
    icon: Cpu,
  },
  {
    title: "Completed Exports",
    value: 0,
    description: "Files ready for download",
    icon: FileDown,
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your consolidation workspace"
      />

      {/* Stat cards */}
      <section aria-label="Summary statistics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_STATS.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <RecentActivity />
    </div>
  );
}
