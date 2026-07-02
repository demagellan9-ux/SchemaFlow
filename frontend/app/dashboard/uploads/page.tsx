import { Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileDropzone } from "@/components/shared/FileDropzone";

export default function UploadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Uploads"
        description="Upload source spreadsheets to a project"
      />
      {/* Phase 7: FileDropzone wired into useFileUpload mutation */}
      <FileDropzone disabled />
      <EmptyState
        icon={Upload}
        title="No uploads yet"
        description="Select a project and upload your spreadsheet files."
      />
    </div>
  );
}
