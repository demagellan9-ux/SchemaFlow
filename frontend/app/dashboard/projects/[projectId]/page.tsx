import ProjectDetailClient from "./ProjectDetailClient";

interface Props {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;

  return <ProjectDetailClient projectId={projectId} />;
}
