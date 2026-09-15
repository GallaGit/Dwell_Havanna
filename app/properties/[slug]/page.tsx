import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyBySlug, listPublishedProperties } from "@/lib/content";
import { canonicalFor } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};
  const url = canonicalFor(`/properties/${property.slug}`);
  const title = `${property.name} — Dwell Havana`;
  return {
    title,
    description: property.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: property.description,
      url,
      type: "article",
      images: [{ url: property.cover, alt: property.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: property.description,
      images: [property.cover],
    },
  };
}

export async function generateStaticParams() {
  const properties = await listPublishedProperties();
  return properties.map((p) => ({ slug: p.slug }));
}

export default async function PropertyDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return notFound();

  return (
    <article>
      {/* 1 hero */}
      <div className="img-editorial aspect-[3/4] sm:aspect-[16/9] md:aspect-[21/9]">
        <Image src={property.cover} alt={property.name} width={2400} height={1100} priority className="h-full w-full object-cover" />
      </div>

      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        {/* 2-4 title / location / intro */}
        <div className="editorial-grid pt-10 md:pt-14">
          <div className="col-span-12 md:col-span-7">
            <p className="meta-label mb-3">{property.location} — {property.character}</p>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">{property.name}</h1>
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-9">
            <p className="text-[15px] leading-8 text-charcoal/90 prose-editorial">{property.description}</p>
            <p className="mt-4 text-[15px] leading-8 text-charcoal/90">
              Photography and narrative before the commercial call to action —
              as the editorial direction requires.
            </p>
          </div>
        </div>

        {/* 5 gallery */}
        <div className="editorial-grid mt-12 md:mt-16">
          {property.images.slice(1).map((src, i) => (
            <div key={src} className={`img-editorial ${i === 0 ? "col-span-12 md:col-span-7 aspect-[4/3]" : "col-span-12 md:col-span-5 aspect-[4/3] md:mt-16"}`}>
              <Image src={src} alt={`${property.name} — ${i + 2}`} width={1400} height={1050} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        {/* 6-8 architecture / interior / story */}
        <div className="editorial-grid mt-14 md:mt-20 border-t rule pt-10">
          {[
            { k: "Architecture", v: property.architecture },
            { k: "Interior", v: property.interior },
            { k: "Story / History", v: property.story },
          ].map((s) => (
            <div key={s.k} className="col-span-12 md:col-span-4">
              <p className="meta-label mb-3">{s.k}</p>
              <p className="text-[15px] leading-8 text-charcoal/90">{s.v}</p>
            </div>
          ))}
        </div>

        {/* 9 facts */}
        <div className="mt-14 border-t rule">
          <p className="meta-label py-4">Property information</p>
          <dl>
            {property.facts.map((f) => (
              <div key={f.label} className="grid grid-cols-12 gap-4 border-t rule py-3 text-sm">
                <dt className="col-span-4 md:col-span-3 meta-label">{f.label}</dt>
                <dd className="col-span-8 md:col-span-9">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 10 CTA */}
        <div className="mt-14 border rule p-8 md:p-12 grid md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8">
            <p className="meta-label mb-3">Private enquiries</p>
            <p className="font-display text-3xl md:text-4xl leading-tight">Visit or ask for the full dossier.</p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <Link href="/about#contact" className="inline-flex text-sm bg-ink text-paper px-7 py-3 hover:opacity-80 transition">
              Contact Dwell Havana
            </Link>
          </div>
        </div>

        <div className="mt-12 flex justify-between border-t rule pt-4">
          <Link href="/properties" className="text-[13px] underline underline-offset-4">← All properties</Link>
          <Link href="/journal" className="text-[13px] underline underline-offset-4">Journal →</Link>
        </div>
      </div>
    </article>
  );
}
