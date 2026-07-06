import JobDetailClient from "./JobDetailClient";

interface Props {
  params: Promise<{
    jobId: string;
  }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { jobId } = await params;

  return <JobDetailClient jobId={jobId} />;
}
