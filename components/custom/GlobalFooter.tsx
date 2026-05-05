"use client";

import Link from "next/link";

export default function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-white/5 py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Logo/Brand */}
          <div className="flex flex-col justify-between h-full">
            <Link href="/" className="text-2xl font-medium tracking-tight hover:opacity-80 transition-opacity">
              carpe diam
            </Link>
          </div>

          {/* Policy Links */}
          <div className="flex flex-col gap-4">
            <Link href="/privacy" className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
              Instagram
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
              Linkedin
            </a>
          </div>

          {/* Copyright */}
          <div className="flex flex-col justify-end h-full">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50 leading-relaxed">
              © {currentYear} BLOOM SOCIAL GROWTH. <br /> ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
