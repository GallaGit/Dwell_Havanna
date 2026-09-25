"use client";

import { useState } from "react";
import type { JournalPost } from "@/lib/data";
import { JournalEntry } from "@/components/Editorial";

const designTopics = ["Architecture", "Interiors", "People", "Places", "Culture", "Design"] as const;

function topicsFor(posts: JournalPost[]): string[] {
  const fromPosts = posts
    .map((post) => post.category)
    .filter((category) => !designTopics.some((topic) => topic === category));
  return ["All", ...designTopics, ...new Set(fromPosts)];
}

export default function JournalIndex({ posts }: { posts: JournalPost[] }) {
  const topics = topicsFor(posts);
  const [topic, setTopic] = useState("All");
  const filtered = topic === "All" ? posts : posts.filter((post) => post.category === topic);

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-y rule py-3" role="group" aria-label="Filter journal by topic">
        {topics.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={topic === item}
            onClick={() => setTopic(item)}
            className={`min-h-8 text-[13px] ${topic === item ? "underline underline-offset-4" : "text-muted hover:text-ink"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-charcoal/80" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "story" : "stories"}
        {topic === "All" ? "" : ` in ${topic}`}
      </p>
      <div className="editorial-grid mt-8">
        {filtered.length === 0 ? (
          <p className="col-span-12 text-sm leading-7 text-charcoal/85">No stories in this topic yet.</p>
        ) : (
          filtered.map((post, index) => (
            <div key={post.slug} className={`col-span-12 sm:col-span-6 lg:col-span-4 ${index % 3 === 1 ? "lg:mt-16" : ""}`}>
              <JournalEntry post={post} heading="h2" priorityImage={index === 0} />
            </div>
          ))
        )}
      </div>
    </>
  );
}
