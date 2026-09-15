import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer id="contact" className="border-t rule mt-24">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-14 md:py-20">
        <div className="editorial-grid">
          <div className="col-span-12 md:col-span-5">
            <p className="meta-label mb-4">Dwell Havana</p>
            <p className="font-display text-3xl md:text-4xl leading-[1.1] max-w-md">
              An editorial guide to Havana&apos;s architecture, design and
              distinctive homes.
            </p>
            <p className="mt-5 text-sm leading-7 text-charcoal/80 max-w-md">
              Photography first. Story before sale. We document how spaces are
              actually inhabited — light, material, imperfection and everyday
              life.
            </p>
          </div>
          <div className="col-span-6 md:col-span-2 md:col-start-7">
            <p className="meta-label mb-4">Index</p>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:opacity-60" href="/journal">Journal</Link></li>
              <li><Link className="hover:opacity-60" href="/properties">Properties</Link></li>
              <li><Link className="hover:opacity-60" href="/about">About</Link></li>
            </ul>
          </div>
          <div className="col-span-6 md:col-span-2">
            <p className="meta-label mb-4">Journal</p>
            <ul className="space-y-2 text-sm">
              <li>Architecture</li>
              <li>Interiors</li>
              <li>People</li>
              <li>Places</li>
              <li>Culture</li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-3">
            <p className="meta-label mb-4">Contact</p>
            <p className="text-sm leading-7">
              hola@dwellhavana.example
              <br />
              Havana, Cuba
            </p>
            <Link
              href="/about#contact"
              className="mt-5 inline-flex text-[13px] border border-ink px-5 py-2.5 hover:bg-ink hover:text-paper transition-colors"
            >
              Start a conversation
            </Link>
          </div>
        </div>
        <div className="mt-14 pt-6 border-t rule flex flex-col md:flex-row justify-between gap-3">
          <p className="meta-label">© 2026 Dwell Havana — Editorial prototype</p>
          <p className="meta-label">Not a catalogue. A magazine.</p>
        </div>
      </div>
    </footer>
  );
}
