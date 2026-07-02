"use client";

import { useState } from "react";
import { FolderOpen, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/features/projects/ProjectCard";
import { CreateProjectDialog } from "@/components/features/projects/CreateProjectDialog";
import { useProjects } from "@/hooks/useProjects";

export default function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isPending, isError } = useProjects();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your consolidation projects"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Button>
        }
      />

      {isPending && <LoadingSpinner />}

      {isError && (
        <p className="text-sm text-destructive">Failed to load projects. Please try again.</p>
      )}

      {!isPending && !isError && data?.items.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create a project to start consolidating spreadsheets."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              Create your first project
            </Button>
          }
        />
      )}

      {!isPending && data && data.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
