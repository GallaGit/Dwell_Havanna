export const metadata = { title: "About — Dwell Havana" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 md:px-10 pt-10 md:pt-16">
      <p className="meta-label mb-3">About</p>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-5xl">
        An editorial guide, <span className="italic font-normal">not a portal.</span>
      </h1>
      <div className="editorial-grid mt-12">
        <div className="col-span-12 md:col-span-6 prose-editorial text-[15px]">
          <p>
            Dwell Havana covers architecture, interiors, culture and distinctive
            homes in Havana with the pace and care of a contemporary design
            magazine.
          </p>
          <p>
            Our principles: photography first, editorial composition, strong
            typography, generous whitespace, structured but asymmetric grids,
            minimal interface, authentic storytelling and a contemporary Cuban
            identity — timeless rather than trendy.
          </p>
          <p>
            We avoid corporate aesthetics, luxury clichés, tourism clichés and
            generic card-based interfaces. Accent colour is restrained; the
            photography carries the emotion.
          </p>
        </div>
        <div className="col-span-12 md:col-span-4 md:col-start-9">
          <p className="meta-label mb-3">Principles</p>
          <ol className="text-sm leading-8 border-t rule">
            {[
              "Photography first",
              "Editorial composition",
              "Strong typography",
              "Generous whitespace",
              "Structured grid",
              "Asymmetric compositions",
              "Minimal interface",
              "Authentic storytelling",
              "Contemporary Cuban identity",
              "Timeless, not trendy",
            ].map((p, i) => (
              <li key={p} className="border-b rule py-1 flex gap-4">
                <span className="meta-label w-6">{String(i + 1).padStart(2, "0")}</span>
                {p}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div id="contact" className="mt-16 border rule p-8 md:p-12">
        <p className="meta-label mb-3">Contact</p>
        <a href="mailto:hola@dwellhavana.example" className="block max-w-full break-all font-display text-3xl md:text-4xl underline decoration-line underline-offset-4 hover:opacity-70">
          hola@dwellhavana.example
        </a>
        <p className="mt-3 text-sm leading-7 text-charcoal/80 max-w-lg">
          For visits, dossiers, editorial submissions or collaborations.
          Photography and narrative first — we reply within two working days.
        </p>
      </div>
    </div>
  );
}
