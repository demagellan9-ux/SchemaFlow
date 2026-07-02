"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/features/uploads/UploadDropzone";
import { UploadTable } from "@/components/features/uploads/UploadTable";
import { useProject } from "@/hooks/useProjects";
import { useUploads } from "@/hooks/useUploads";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  params: { projectId: string };
}

export default function ProjectDetailPage({ params }: Props) {
  const { projectId } = params;
  const qc = useQueryClient();

  const { data: project, isPending: projectLoading, isError } = useProject(projectId);
  const { data: uploadsData, isPending: uploadsLoading } = useUploads(projectId);

  function handleUploaded() {
    qc.invalidateQueries({ queryKey: ["uploads", projectId] });
  }

  if (projectLoading) return <LoadingSpinner />;
  if (isError || !project) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Projects
        </Link>
        <p className="text-sm text-destructive">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="inline h-4 w-4 mr-1" />Projects
        </Link>
      </div>

      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload files
          </CardTitle>
          <CardDescription>
            Drag and drop CSV, XLS, or XLSX files. Maximum 30 MB per file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadDropzone projectId={projectId} onUploaded={handleUploaded} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload history</CardTitle>
          <CardDescription>
            {uploadsData?.items.length ?? 0} file{uploadsData?.items.length !== 1 ? "s" : ""} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <UploadTable
            uploads={uploadsData?.items ?? []}
            isLoading={uploadsLoading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schema & mapping</CardTitle>
          <CardDescription>Define the destination schema and map source columns — available in Phase 8.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled variant="outline">Configure schema</Button>
        </CardContent>
      </Card>
    </div>
  );
}
