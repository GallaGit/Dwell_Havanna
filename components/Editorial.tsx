import Image from "next/image";
import Link from "next/link";
import type { Property, JournalPost } from "@/lib/data";

export function SectionHeading({
  index,
  label,
  title,
  href,
  linkLabel,
}: {
  index: string;
  label: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between border-t rule pt-4 mb-8 md:mb-12">
      <div>
        <p className="meta-label mb-2">
          {index} — {label}
        </p>
        <h2 className="font-display text-3xl md:text-5xl leading-[1.05]">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="hidden md:inline text-[13px] underline underline-offset-4 decoration-line hover:decoration-ink transition"
        >
          {linkLabel ?? "View all"}
        </Link>
      )}
    </div>
  );
}

export function PropertyEntry({ property, large = false }: { property: Property; large?: boolean }) {
  return (
    <Link href={`/properties/${property.slug}`} className="group block">
      <div className="img-editorial aspect-[4/3]">
        <Image
          src={property.cover}
          alt={property.name}
          width={1400}
          height={1050}
          quality={70}
          sizes="(max-width: 768px) calc(100vw - 40px), 50vw"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="pt-4 grid md:grid-cols-12 gap-2">
        <div className="md:col-span-7">
          <p className="meta-label mb-1.5">{property.location}</p>
          <h3
            className={`font-display leading-tight group-hover:opacity-70 transition-opacity ${
              large ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
            }`}
          >
            {property.name}
          </h3>
        </div>
        <div className="md:col-span-5">
          <p className="meta-label mb-1.5">{property.character}</p>
          <p className="text-sm leading-6 text-charcoal/85">{property.description}</p>
        </div>
      </div>
    </Link>
  );
}

export function JournalEntry({ post }: { post: JournalPost }) {
  return (
    <Link href={`/journal/${post.slug}`} className="group block">
      <div className="img-editorial aspect-[3/2]">
        <Image
          src={post.image}
          alt={post.title}
          width={1200}
          height={800}
          quality={70}
          sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) 50vw, 58vw"
          className="h-full w-full object-cover"
        />
      </div>
      <p className="meta-label mt-4 mb-2">
        {post.category} · {post.date}
      </p>
      <h3 className="font-display text-xl md:text-2xl leading-snug group-hover:opacity-70 transition-opacity">
        {post.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-charcoal/80">{post.excerpt}</p>
      <p className="meta-label mt-3">{post.readingTime} read</p>
    </Link>
  );
}
