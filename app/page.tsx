import Image from "next/image";
import Link from "next/link";
import { listPublishedProperties, listPublishedPosts } from "@/lib/content";
import { SectionHeading, PropertyEntry, JournalEntry } from "@/components/Editorial";
import ContributeLink from "@/components/ContributeLink";
import { havanaStudies } from "@/lib/placeholders";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function Home() {
  const [properties, journalPosts] = await Promise.all([
    listPublishedProperties(),
    listPublishedPosts(),
  ]);
  const [featured, ...rest] = properties;
  const featuredPost = journalPosts[0];
  const architecturePost =
    journalPosts.find((post) => post.slug === "patio-houses" && post !== featuredPost) ??
    journalPosts.find((post) => post !== featuredPost);
  const sidePosts = journalPosts
    .filter((post) => post !== featuredPost && post.image !== architecturePost?.image)
    .slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: siteDescription,
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* 1 — Featured property / editorial story : magazine cover */}
      <section className="pt-8 md:pt-14 pb-14 md:pb-20">
        <div className="flex items-center justify-between mb-5">
          <p className="meta-label">Issue No. 04 — Havana · September 2026</p>
          <p className="meta-label hidden md:block">Photography first</p>
        </div>
        <Link href={`/properties/${featured.slug}`} className="group block">
          <div className="img-editorial aspect-[3/4] sm:aspect-[16/10] md:aspect-[21/10]">
            <Image
              src={featured.cover}
              alt={featured.name}
              width={2200}
              height={1050}
              preload
              fetchPriority="high"
              quality={70}
              sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 768px) calc(100vw - 80px), min(1400px, calc(100vw - 80px))"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="editorial-grid mt-6 md:mt-8 reveal reveal-1">
            <div className="col-span-12 md:col-span-7">
              <p className="meta-label mb-3">
                Featured story — {featured.location}
              </p>
              <h1 className="font-display text-[42px] leading-[0.95] sm:text-6xl md:text-7xl lg:text-[86px] group-hover:opacity-80 transition-opacity">
                {featured.name}:<br />
                <span className="italic font-normal">sea light, terrazzo, patio.</span>
              </h1>
            </div>
            <div className="col-span-12 md:col-span-4 md:col-start-9 flex flex-col justify-end">
              <p className="text-[15px] leading-7 text-charcoal/90 max-w-sm">
                {featured.description} An editorial visit — how the house is
                inhabited, not staged.
              </p>
              <p className="mt-4 text-[13px] underline underline-offset-4 decoration-line group-hover:decoration-ink">
                Read the story
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* 2 — Journal */}
      <section className="py-14 md:py-20">
        <SectionHeading index="01" label="Journal" title="Notes on building and living" href="/journal" linkLabel="All journal" />
        <div className="editorial-grid">
          <div className="col-span-12 md:col-span-7">
            {featuredPost ? (
              <JournalEntry
                post={featuredPost}
                sizes="(max-width: 768px) calc(100vw - 40px), min(816px, 58vw)"
              />
            ) : null}
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-9 flex flex-col gap-8">
            {sidePosts.map((post) => (
              <Link key={post.slug} href={`/journal/${post.slug}`} className="group grid grid-cols-12 gap-4 border-t rule pt-5">
                <div className="col-span-4 img-editorial aspect-square">
                  <Image src={post.image} alt={post.title} width={400} height={400} quality={70} sizes="(max-width: 768px) 33vw, 140px" className="h-full w-full object-cover" />
                </div>
                <div className="col-span-8">
                  <p className="meta-label mb-1">{post.category}</p>
                  <h3 className="font-display text-lg leading-snug group-hover:opacity-70">{post.title}</h3>
                  <p className="meta-label mt-2">{post.readingTime}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Featured homes (editorial, not catalogue) */}
      <section className="py-14 md:py-20">
        <SectionHeading index="02" label="Featured homes" title="Distinctive homes, inhabited" href="/properties" linkLabel="All properties" />
        <div className="editorial-grid">
          <div className="col-span-12 md:col-span-5">
            {rest[0] ? (
              <PropertyEntry
                property={rest[0]}
                sizes="(max-width: 768px) calc(100vw - 40px), min(580px, 42vw)"
              />
            ) : null}
          </div>
          <div className="col-span-12 md:col-span-6 md:col-start-7 md:mt-24">
            {rest[1] ? (
              <PropertyEntry
                property={rest[1]}
                sizes="(max-width: 768px) calc(100vw - 40px), min(700px, 50vw)"
              />
            ) : null}
          </div>
        </div>
      </section>

      {/* 4 — Architecture / design story : grid-breaking */}
      <section className="py-14 md:py-20">
        <SectionHeading index="03" label="Architecture" title="The patio house endures" />
        <div className="editorial-grid items-end">
          <div className="col-span-12 md:col-span-8 img-editorial aspect-[16/10]">
            {architecturePost ? (
              <Image
                src={architecturePost.image}
                alt={architecturePost.title}
                width={1600}
                height={1000}
                quality={70}
                sizes="(max-width: 768px) calc(100vw - 40px), min(930px, 67vw)"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="col-span-12 md:col-span-3 md:col-start-10">
            <p className="meta-label mb-3">Design story</p>
            <p className="font-display text-2xl leading-snug">
              Two centuries on, the patio remains Havana&apos;s most intelligent room.
            </p>
            <p className="mt-4 text-sm leading-7 text-charcoal/85">
              Climate, privacy and community in a single void. We visited three
              houses in Centro to understand why the type refuses to disappear.
            </p>
            <Link href={architecturePost ? `/journal/${architecturePost.slug}` : "/journal"} className="mt-5 inline-flex text-[13px] border border-ink px-5 py-2.5 hover:bg-ink hover:text-paper transition-colors">
              Read the essay
            </Link>
          </div>
        </div>
      </section>

      {/* 5 — Havana editorial content */}
      <section className="py-14 md:py-20">
        <SectionHeading index="04" label="Havana" title="Material, light, everyday life" />
        <div className="editorial-grid">
          {havanaStudies.map((study) => (
            <div key={study.src} className={study.frame}>
              <div className={`img-editorial ${study.aspect}`}>
                <Image
                  src={study.src}
                  alt={study.alt}
                  width={study.width}
                  height={study.height}
                  quality={70}
                  sizes={study.sizes}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="meta-label mt-3">{study.caption}</p>
            </div>
          ))}
          <div className="col-span-12 md:col-span-3 md:col-start-10 md:mt-32">
            <p className="font-display text-2xl leading-snug">Authentic visual storytelling over staging.</p>
            <p className="mt-3 text-sm leading-7 text-charcoal/85">
              Architecture, interiors, materials, people. How spaces are actually
              experienced — imperfection included.
            </p>
          </div>
        </div>
      </section>

      {/* 6 — About */}
      <section className="py-14 md:py-20 border-t rule">
        <div className="editorial-grid">
          <div className="col-span-12 md:col-span-3">
            <p className="meta-label">05 — About</p>
          </div>
          <div className="col-span-12 md:col-span-7">
            <h2 className="font-display text-3xl md:text-5xl leading-[1.05]">
              Not another real-estate website. An editorial guide to Havana&apos;s
              architecture and homes.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-8 text-charcoal/90">
              Dwell Havana documents distinctive houses with the rigour of a
              design magazine: measured photography, architectural reading, and
              the human story of each place. Commercial information comes last —
              narrative first.
            </p>
            <Link href="/about" className="mt-6 inline-flex text-[13px] border border-ink px-5 py-2.5 hover:bg-ink hover:text-paper transition-colors">
              About Dwell Havana
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t rule py-14 md:py-20">
        <div className="editorial-grid items-end">
          <div className="col-span-12 md:col-span-7">
            <p className="meta-label mb-3">Community</p>
            <h2 className="font-display text-3xl md:text-5xl leading-[1.05]">Have a Havana story to share?</h2>
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-9">
            <p className="text-[15px] leading-7 text-charcoal/85">Verified contributors can send a photograph and its story for editorial review.</p>
            <ContributeLink />
          </div>
        </div>
      </section>
    </div>
  );
}
