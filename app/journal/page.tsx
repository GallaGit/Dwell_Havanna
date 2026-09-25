import { listPublishedPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";
import JournalIndex from "./JournalIndex";

export const metadata = pageMetadata({
  title: "Journal",
  description: "Notes on Havana's architecture, interiors, people and places.",
  path: "/journal",
});
export const revalidate = 3600;

export default async function JournalPage() {
  const journalPosts = await listPublishedPosts();
  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16">
      <p className="meta-label mb-3">Journal — Design authority</p>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-4xl">
        Architecture, interiors, people, places.
      </h1>
      <JournalIndex posts={journalPosts} />
    </div>
  );
}
