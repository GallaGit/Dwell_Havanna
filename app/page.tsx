import Image from "next/image";
import Link from "next/link";
import { listPublishedProperties, listPublishedPosts } from "@/lib/content";
import { SectionHeading, PropertyEntry, JournalEntry } from "@/components/Editorial";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const revalidate = 3600;

export default async function Home() {
  const [properties, journalPosts] = await Promise.all([
    listPublishedProperties(),
    listPublishedPosts(),
  ]);
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const [featured, ...rest] = properties;

  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10">
      {/* 1 — Featured property / editorial story : magazine cover */}
      <section className="pt-8 md:pt-14 pb-14 md:pb-20">
        <div className="flex items-center justify-between mb-5">
          <p className="meta-label">Issue No. 04 — Havana · September 2026</p>
          <p className="meta-label hidden md:block">Photography first</p>
        </div>
        <Link href={`/properties/${featured.slug}`} className="group block">
          <div className="img-editorial reveal aspect-[3/4] sm:aspect-[16/10] md:aspect-[21/10]">
            <Image
              src={featured.cover}
              alt={featured.name}
              width={2200}
              height={1050}
              priority
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
          <div className="col-span-12 md:col-span-7 reveal">
            <JournalEntry post={journalPosts[0]} />
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-9 flex flex-col gap-8">
            {journalPosts.slice(1, 3).map((post) => (
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
            <PropertyEntry property={rest[0]} />
          </div>
          <div className="col-span-12 md:col-span-6 md:col-start-7 md:mt-24">
            <PropertyEntry property={rest[1]} />
          </div>
        </div>
      </section>

      {/* 4 — Architecture / design story : grid-breaking */}
      <section className="py-14 md:py-20">
        <SectionHeading index="03" label="Architecture" title="The patio house endures" />
        <div className="editorial-grid items-end">
          <div className="col-span-12 md:col-span-8 img-editorial aspect-[16/10]">
            <Image
              src={journalPosts[2].image}
              alt="Patio house Havana"
              width={1600}
              height={1000}
              quality={70}
              sizes="(max-width: 768px) calc(100vw - 40px), min(930px, 67vw)"
              className="h-full w-full object-cover"
            />
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
            <Link href="/journal/patio-houses" className="mt-5 inline-flex text-[13px] border border-ink px-5 py-2.5 hover:bg-ink hover:text-paper transition-colors">
              Read the essay
            </Link>
          </div>
        </div>
      </section>

      {/* 5 — Havana editorial content */}
      <section className="py-14 md:py-20">
        <SectionHeading index="04" label="Havana" title="Material, light, everyday life" />
        <div className="editorial-grid">
          <div className="col-span-6 md:col-span-3">
            <div className="img-editorial aspect-[3/4]">
              <Image src="https://images.unsplash.com/photo-1503174971373-b1f69850bded?q=80&w=800&auto=format&fit=crop" alt="Havana detail" width={800} height={1066} quality={70} sizes="(max-width: 768px) 50vw, 25vw" className="h-full w-full object-cover" />
            </div>
            <p className="meta-label mt-3">Texture — Lime and time</p>
          </div>
          <div className="col-span-6 md:col-span-5 md:mt-16">
            <div className="img-editorial aspect-[4/3]">
              <Image src="https://images.unsplash.com/photo-1536500152107-01ab1422f932?q=80&w=1200&auto=format&fit=crop" alt="Havana street life" width={1200} height={900} quality={70} sizes="(max-width: 768px) 50vw, 42vw" className="h-full w-full object-cover" />
            </div>
            <p className="meta-label mt-3">Context — Street as room</p>
          </div>
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
            <Link href={user ? "/contribuir" : "/iniciar-sesion?next=/contribuir"} className="mt-5 inline-flex border border-ink px-5 py-2.5 text-[13px] hover:bg-ink hover:text-paper transition-colors">
              {user ? "Contribute a story" : "Sign in to contribute"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
