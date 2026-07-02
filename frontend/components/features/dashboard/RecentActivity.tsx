import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";

export function RecentActivity() {
  return (
    <section aria-label="Recent activity">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Project and job events will appear here once you start uploading files."
          />
        </CardContent>
      </Card>
    </section>
  );
}
