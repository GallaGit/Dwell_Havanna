import { listPublishedProperties } from "@/lib/content";
import { PropertyEntry } from "@/components/Editorial";

export const metadata = { title: "Properties — Dwell Havana" };
export const revalidate = 3600;

export default async function PropertiesPage() {
  const properties = await listPublishedProperties();
  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16 pb-10">
      <p className="meta-label mb-3">Properties — Editorial index</p>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-4xl">
        Homes presented as <span className="italic font-normal">stories</span>, not listings.
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-7 text-charcoal/85">
        Image, name, location, architectural character and a short editorial
        description. Minimal filters — curation over database.
      </p>

      <div className="mt-12 flex gap-6 border-y rule py-3">
        {["All", "Miramar", "Vedado", "Centro"].map((f, i) => (
          <span key={f} className={`text-[13px] ${i === 0 ? "underline underline-offset-4" : "text-muted"}`}>
            {f}
          </span>
        ))}
      </div>

      <div className="editorial-grid mt-12">
        {properties.map((p, i) => (
          <div key={p.slug} className={`col-span-12 md:col-span-6 ${i === 1 ? "md:mt-20" : ""} ${i === 2 ? "md:col-start-4" : ""}`}>
            <PropertyEntry property={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
