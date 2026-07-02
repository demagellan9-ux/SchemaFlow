import { FileCode2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

export default function SchemasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Schemas"
        description="Define destination schemas for consolidation output"
        actions={<Button disabled>New Schema</Button>}
      />
      <EmptyState
        icon={FileCode2}
        title="No schemas yet"
        description="Create a destination schema to define the structure of your output file."
      />
    </div>
  );
}
