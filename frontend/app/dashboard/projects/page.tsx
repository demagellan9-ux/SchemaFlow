import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your consolidation projects"
        actions={
          // Phase 7: wire to CreateProjectForm + mutation
          <Button disabled>New Project</Button>
        }
      />
      <EmptyState
        icon={FolderOpen}
        title="No projects yet"
        description="Create a project to start consolidating spreadsheets."
        action={<Button disabled>Create your first project</Button>}
      />
    </div>
  );
}
