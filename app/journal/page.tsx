import { journalPosts } from "@/lib/data";
import { JournalEntry } from "@/components/Editorial";

export const metadata = { title: "Journal — Dwell Havana" };

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16">
      <p className="meta-label mb-3">Journal — Design authority</p>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-4xl">
        Architecture, interiors, people, places.
      </h1>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y rule py-3">
        {["All", "Architecture", "Interiors", "People", "Places", "Culture", "Design"].map((c, i) => (
          <span key={c} className={`text-[13px] ${i === 0 ? "underline underline-offset-4" : "text-muted"}`}>{c}</span>
        ))}
      </div>
      <div className="editorial-grid mt-12">
        {journalPosts.map((post, i) => (
          <div key={post.slug} className={`col-span-12 sm:col-span-6 lg:col-span-4 ${i % 3 === 1 ? "lg:mt-16" : ""}`}>
            <JournalEntry post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
