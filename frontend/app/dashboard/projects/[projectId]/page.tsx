import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: { projectId: string };
}

export default function ProjectDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Detail"
        description={`Project ID: ${params.projectId}`}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uploads</CardTitle>
          <CardDescription>Source files for this project — available in Phase 7.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Upload management coming in Phase 7.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schema</CardTitle>
          <CardDescription>Destination schema configuration — available in Phase 8.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Schema editor coming in Phase 8.</p>
        </CardContent>
      </Card>
    </div>
  );
}
