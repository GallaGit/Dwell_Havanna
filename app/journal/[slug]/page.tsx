import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, listPublishedPosts } from "@/lib/content";
import { deliveryImageUrl } from "@/lib/image-delivery";
import { canonicalFor, siteName } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const url = canonicalFor(`/journal/${post.slug}`);
  const title = post.title;
  const image = deliveryImageUrl(post.image);
  return {
    title,
    description: post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      title: `${title} — Dwell Havana`,
      description: post.excerpt,
      url,
      type: "article",
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Dwell Havana`,
      description: post.excerpt,
      images: [image],
    },
  };
}

export async function generateStaticParams() {
  const journalPosts = await listPublishedPosts();
  return journalPosts.map((p) => ({ slug: p.slug }));
}

export default async function JournalDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: deliveryImageUrl(post.image),
    mainEntityOfPage: canonicalFor(`/journal/${post.slug}`),
    publisher: { "@type": "Organization", name: siteName },
  };

  return (
    <article className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <p className="meta-label mb-3">{post.category} — {post.date} — {post.readingTime}</p>
      <h1 className="font-display text-4xl md:text-6xl leading-[1.02] max-w-4xl">{post.title}</h1>
      <p className="mt-5 max-w-xl text-[15px] leading-8 text-charcoal/85">{post.excerpt}</p>
      <div className="img-editorial mt-10 aspect-[16/9]">
        <Image
          src={post.image}
          alt={post.title}
          width={2000}
          height={1125}
          preload
          fetchPriority="high"
          quality={70}
          sizes="(max-width: 768px) calc(100vw - 40px), (max-width: 1480px) calc(100vw - 80px), 1320px"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="editorial-grid mt-10">
        <div className="col-span-12 md:col-span-6 md:col-start-4 prose-editorial text-[15px]">
          {post.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      <div className="mt-12 flex justify-between border-t rule pt-4">
        <Link href="/journal" className="text-[13px] underline underline-offset-4">← All journal</Link>
        <Link href="/properties" className="text-[13px] underline underline-offset-4">Properties →</Link>
      </div>
    </article>
  );
}
