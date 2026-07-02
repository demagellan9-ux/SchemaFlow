"use client";

import { useQuery } from "@tanstack/react-query";
import { getJob } from "@/lib/api/jobs";

const TERMINAL_STATUSES = new Set(["completed", "completed_with_errors", "failed"]);

export function useJobStatus(jobId: string) {
  return useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => getJob(jobId),
    refetchInterval: (query) =>
      query.state.data && !TERMINAL_STATUSES.has(query.state.data.status) ? 3000 : false,
    enabled: !!jobId,
  });
}
