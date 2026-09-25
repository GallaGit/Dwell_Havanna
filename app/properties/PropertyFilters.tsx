"use client";

import { useState } from "react";
import type { Property } from "@/lib/data";
import { PropertyEntry } from "@/components/Editorial";

const cities = ["All", "Miramar", "Vedado", "Centro"] as const;

export default function PropertyFilters({ properties }: { properties: Property[] }) {
  const [selectedCity, setSelectedCity] = useState<(typeof cities)[number]>("All");
  const filtered = selectedCity === "All"
    ? properties
    : properties.filter((property) => property.location.startsWith(selectedCity));

  return (
    <>
      <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 border-y rule py-3" aria-label="Filter properties by city">
        {cities.map((city) => (
          <button
            key={city}
            type="button"
            aria-pressed={selectedCity === city}
            onClick={() => setSelectedCity(city)}
            className={`min-h-8 text-[13px] ${selectedCity === city ? "underline underline-offset-4" : "text-muted hover:text-ink"}`}
          >
            {city}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-charcoal/70" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "property" : "properties"} in {selectedCity === "All" ? "Havana" : selectedCity}
      </p>
      <div className="editorial-grid mt-8">
        {filtered.map((property, index) => (
          <div key={property.slug} className={`col-span-12 md:col-span-6 ${index === 1 ? "md:mt-20" : ""} ${index === 2 ? "md:col-start-4" : ""}`}>
            <PropertyEntry property={property} />
          </div>
        ))}
      </div>
    </>
  );
}
