"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GlobalHeader({ categoryTree }: { categoryTree: Record<string, string[]> }) {
  const categories = Object.keys(categoryTree);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [showLogo, setShowLogo] = useState(!isHome);

  useEffect(() => {
    if (!isHome) { setShowLogo(true); return; }
    const onScroll = () => setShowLogo(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header className="sticky top-0 z-500 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-center">
        <Link href="/" className="absolute left-4 md:left-6 flex items-center hover:opacity-80 transition-opacity">
          <Image src="/cd-logo.svg" alt="Carpe Diam" width={140} height={40} className={`w-auto h-8 md:h-12 transition-opacity duration-500 ${showLogo ? 'opacity-100' : 'opacity-0'}`} priority unoptimized />
        </Link>

        {/* Desktop nav — centered */}
        <nav className="hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-medium text-gray-500">
          <Link href="/catalog" className="hover:text-black transition-colors">All Collections</Link>

          {categories.slice(0, 4).map(cat => (
            <div key={cat} className="relative group">
              <Link href={`/catalog?category=${encodeURIComponent(cat)}`} className="flex items-center gap-1 hover:text-black transition-colors py-2">
                {cat.endsWith('s') ? cat : `${cat}s`}
                {categoryTree[cat].length > 0 && (
                  <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                )}
              </Link>

              {categoryTree[cat].length > 0 && (
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white border border-[#EAEAEA] shadow-lg min-w-[200px] py-2">
                    {categoryTree[cat].map(sub => (
                      <Link
                        key={sub}
                        href={`/catalog?category=${encodeURIComponent(cat)}&subcategory=${encodeURIComponent(sub)}`}
                        className="block w-full text-left px-4 py-2 text-[10px] uppercase tracking-wider text-gray-500 hover:text-black hover:bg-gray-50 transition-colors"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Link href="/our-story" className="hover:text-black transition-colors py-2">Our Story</Link>
          <Link href="/appointments" className="hover:text-black transition-colors py-2">Appointments</Link>
        </nav>
      </div>
    </header>
  );
}
