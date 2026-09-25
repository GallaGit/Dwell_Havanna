"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/journal", label: "Journal" },
  { href: "/properties", label: "Properties" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b rule">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-baseline gap-3 md:flex-1">
              <span className="font-display text-[22px] md:text-[26px] font-semibold tracking-tight leading-none">
                Dwell Havana
              </span>
              <span className="hidden sm:inline meta-label !text-[10px]">
                Architecture · Homes · Culture
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 md:gap-10">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="text-[13px] md:text-sm tracking-wide hover:opacity-60 transition-opacity">
                  {link.label}
                </Link>
              ))}
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

      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setMenuOpen((open) => !open)}
        className="mobile-nav-toggle fixed bottom-[var(--mobile-nav-bottom)] right-[var(--mobile-nav-side)] z-[60] inline-flex size-14 items-center justify-center rounded-full border border-ink bg-ink text-paper shadow-lg md:hidden"
      >
        <span className="sr-only">{menuOpen ? "Close navigation" : "Open navigation"}</span>
        {menuOpen ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 5 19 19M19 5 5 19" strokeLinecap="round" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      <div id="mobile-navigation" aria-hidden={!menuOpen} className={`mobile-nav-panel fixed bottom-[var(--mobile-nav-bottom)] left-[var(--mobile-nav-side)] right-[calc(var(--mobile-nav-side)+4.25rem)] z-50 md:hidden ${menuOpen ? "is-open" : ""}`}>
        <nav aria-label="Mobile navigation" className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-full border border-ink bg-paper/95 p-1.5 shadow-lg backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} className="mobile-nav-link rounded-full px-3 py-2.5 text-[11px] uppercase tracking-[0.08em] hover:bg-ink hover:text-paper">
              {link.label}
            </Link>
          ))}
          <Link href="/about#contact" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} className="mobile-nav-link rounded-full border border-ink px-3 py-2.5 text-[11px] uppercase tracking-[0.08em] hover:bg-ink hover:text-paper">
            Enquire
          </Link>
        </nav>
      </div>
    </>
  );
}
