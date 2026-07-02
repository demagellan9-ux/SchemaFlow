import { useQuery } from "@tanstack/react-query";
import type { Job } from "@/types/job";

// TODO: Import typed API client once lib/api/jobs.ts is implemented
async function fetchJob(jobId: string): Promise<Job> {
  const res = await fetch(`/api/v1/jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch job");
  return res.json();
}

export function useJobStatus(jobId: string) {
  return useQuery({
    queryKey: ["jobs", jobId],
    queryFn: () => fetchJob(jobId),
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 2000 : false,
    enabled: !!jobId,
  });
}
