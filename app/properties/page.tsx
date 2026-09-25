import { listPublishedProperties } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";
import PropertyFilters from "./PropertyFilters";

export const metadata = pageMetadata({
  title: "Properties",
  description: "Distinctive Havana homes presented as editorial stories, not a catalogue.",
  path: "/properties",
});
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

      <PropertyFilters properties={properties} />
    </div>
  );
}
