import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, listPublishedPosts } from "@/lib/content";

export const revalidate = 3600;

export async function generateStaticParams() {
  const journalPosts = await listPublishedPosts();
  return journalPosts.map((p) => ({ slug: p.slug }));
}

export default async function JournalDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  return (
    <article className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16">
      <p className="meta-label mb-3">{post.category} — {post.date} — {post.readingTime}</p>
      <h1 className="font-display text-4xl md:text-6xl leading-[1.02] max-w-4xl">{post.title}</h1>
      <p className="mt-5 max-w-xl text-[15px] leading-8 text-charcoal/85">{post.excerpt}</p>
      <div className="img-editorial mt-10 aspect-[16/9]">
        <Image src={post.image} alt={post.title} width={2000} height={1125} className="h-full w-full object-cover" />
      </div>
      <div className="editorial-grid mt-10">
        <div className="col-span-12 md:col-span-6 md:col-start-4 prose-editorial text-[15px]">
          <p>
            Havana rewards slow looking. In this house — as in so many across
            Miramar, Vedado and Centro — the essential decisions are about
            light and air before they are about objects.
          </p>
          <p>
            Thick walls hold the cool of the night. Shutters and breeze-block
            break the sun into workable bands. A patio, a balcony or a gallery
            does the work that mechanical systems do elsewhere.
          </p>
          <p>
            Dwell Havana documents these logics with photography first: material
            close-ups, inhabited rooms, traces of repair. Imperfection is not
            styled out — it is the evidence that a place is lived in.
          </p>
        </div>
      </div>
      <div className="mt-12 flex justify-between border-t rule pt-4">
        <Link href="/journal" className="text-[13px] underline underline-offset-4">← All journal</Link>
        <Link href="/properties" className="text-[13px] underline underline-offset-4">Properties →</Link>
      </div>
    </article>
  );
}
