"use client";

import Link from "next/link";

export default function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t border-white/10 py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="flex flex-col gap-10 h-full lg:col-span-2">
            <Link href="/" className="text-2xl font-serif uppercase tracking-[0.45em] hover:opacity-80 transition-opacity">
              Carpe Diam
            </Link>
            <p className="max-w-md text-[11px] uppercase tracking-[0.2em] leading-loose text-white/35">
              Exclusively for trade partners, our collection remains private until the moment it is yours.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/80">The Brand</p>
            <Link href="/our-story" className="text-[11px] uppercase tracking-[0.3em] text-white/35 hover:text-white transition-colors">
              Philosophy
            </Link>
            <Link href="/our-story" className="text-[11px] uppercase tracking-[0.3em] text-white/35 hover:text-white transition-colors">
              Craftsmanship
            </Link>
            <Link href="/our-story" className="text-[11px] uppercase tracking-[0.3em] text-white/35 hover:text-white transition-colors">
              Stories
            </Link>
          </div>

          <div className="flex flex-col gap-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/80">Services</p>
            <Link href="/catalog" className="text-[11px] uppercase tracking-[0.3em] text-white/35 hover:text-white transition-colors">
              Wholesale
            </Link>
            <Link href="/catalog?collection=Bespoke" className="text-[11px] uppercase tracking-[0.3em] text-white/35 hover:text-white transition-colors">
              Bespoke
            </Link>
            <Link href="/appointments" className="text-[11px] uppercase tracking-[0.3em] text-white/35 hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>

        <div className="mt-24 border-t border-white/10 pt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
            © {currentYear} Carpe Diam. All rights reserved.
          </p>
          <div className="flex gap-10">
            <Link href="/privacy" className="text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
