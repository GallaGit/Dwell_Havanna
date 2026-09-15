import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b rule">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-display text-[22px] md:text-[26px] font-semibold tracking-tight leading-none">
              Dwell Havana
            </span>
            <span className="hidden sm:inline meta-label !text-[10px]">
              Architecture · Homes · Culture
            </span>
          </Link>
          <nav className="flex items-center gap-6 md:gap-10">
            <Link
              href="/journal"
              className="text-[13px] md:text-sm tracking-wide hover:opacity-60 transition-opacity"
            >
              Journal
            </Link>
            <Link
              href="/properties"
              className="text-[13px] md:text-sm tracking-wide hover:opacity-60 transition-opacity"
            >
              Properties
            </Link>
            <Link
              href="/about"
              className="text-[13px] md:text-sm tracking-wide hover:opacity-60 transition-opacity"
            >
              About
            </Link>
            <Link
              href="/about#contact"
              className="hidden md:inline-flex text-[13px] border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
            >
              Enquire
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
