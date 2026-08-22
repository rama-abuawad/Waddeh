import ReadingExperience from "@/components/reading/reading-experience";

export default async function ReadingPage({ params }: { params: Promise<{ readingId: string }> }) {
  const { readingId } = await params;
  return <ReadingExperience readingId={readingId} />;
}
