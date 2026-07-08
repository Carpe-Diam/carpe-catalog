"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface GlobalHeaderProps {
  categoryTree: Record<string, string[]>;
  collections: string[];
}

export default function GlobalHeader({ categoryTree, collections }: GlobalHeaderProps) {
  const categories = Object.keys(categoryTree);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Collections excluding Bespoke
  const displayCollections = collections.filter(c => c.toLowerCase() !== "bespoke");
  const hasBespoke = collections.some(c => c.toLowerCase() === "bespoke");
  const hasCollections = displayCollections.length > 0;
  const hasCategories = categories.length > 0;

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextTheme = root.classList.contains("dark") ? "light" : "dark";
    root.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("carpe-theme", nextTheme);
    setTheme(nextTheme);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setExpandedSection(null);
    setExpandedCat(null);
  }, [pathname, searchParams]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (pathname === "/form") return null;

  return (
    <>
      <header className="sticky top-0 z-[500] bg-background/90 backdrop-blur-md border-b border-border">
        <div className="px-6 md:px-12 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image
              src="/cd-logo.svg"
              alt="Carpe Diam"
              width={140}
              height={40}
              className="w-auto h-8 md:h-10 transition-[filter] duration-500 dark:invert"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop nav -- centered */}
          <nav className="hidden lg:flex items-center gap-10 text-[13px] tracking-[0.15em] font-medium text-foreground/70 uppercase">

            {/* Collections dropdown */}
            {hasCollections && (
              <div className="relative group">
                <Link href="/catalog" className="flex items-center gap-1 hover:text-foreground transition-colors py-2">
                  Collections
                  <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="bg-popover border border-border shadow-2xl min-w-[220px] py-3 overflow-hidden">
                    {displayCollections.map(col => (
                      <Link
                        key={col}
                        href={`/catalog?collection=${encodeURIComponent(col)}`}
                        className="block w-full text-left px-6 py-2.5 text-[12px] tracking-widest text-muted-foreground hover:text-popover-foreground hover:bg-accent transition-all"
                      >
                        {col}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Categories dropdown */}
            {hasCategories && (
              <div className="relative group">
                <span className="flex items-center gap-1 hover:text-foreground transition-colors py-2 cursor-default">
                  Categories
                  <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </span>
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="bg-popover border border-border shadow-2xl min-w-[240px] py-3 overflow-hidden">
                    <Link
                      href="/catalog"
                      className="block px-6 py-2.5 text-[12px] tracking-widest font-semibold text-foreground/90 hover:text-popover-foreground hover:bg-accent border-b border-border/50 pb-3 mb-2 transition-all"
                    >
                      Shop All
                    </Link>
                    {categories.map(cat => (
                      <div key={cat} className="group/cat relative">
                        <Link
                          href={`/catalog?category=${encodeURIComponent(cat)}`}
                          className="flex items-center justify-between px-6 py-2.5 text-[12px] tracking-widest text-muted-foreground hover:text-popover-foreground hover:bg-accent transition-all"
                        >
                          {cat.endsWith('s') ? cat : `${cat}s`}
                          {categoryTree[cat].length > 0 && (
                            <ChevronDown className="w-3 h-3 -rotate-90 opacity-40" />
                          )}
                        </Link>
                        {categoryTree[cat].length > 0 && (
                          <div className="absolute left-full top-0 ml-1 opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-300">
                            <div className="bg-popover border border-border shadow-2xl min-w-[200px] py-3 overflow-hidden">
                              {categoryTree[cat].map(sub => (
                                <Link
                                  key={sub}
                                  href={`/catalog?category=${encodeURIComponent(cat)}&subcategory=${encodeURIComponent(sub)}`}
                                  className="block px-6 py-2 text-[12px] tracking-widest text-muted-foreground hover:text-popover-foreground hover:bg-accent transition-all"
                                >
                                  {sub}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {hasBespoke && (
              <Link href="/catalog?collection=Bespoke" className="hover:text-foreground transition-colors py-2">Bespoke</Link>
            )}

            <Link href="/appointments" className="hover:text-foreground transition-colors py-2">Contact Us</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/70 text-foreground transition-colors hover:bg-accent"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Hamburger button -- mobile only */}
            <button
              className="lg:hidden flex items-center justify-center w-10 h-10 text-foreground"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu -- outside header to avoid backdrop-filter stacking context issue */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[80px] md:max-lg:top-[96px] z-[400] bg-background overflow-y-auto">
          <nav className="flex flex-col py-6 px-6 text-[12px] tracking-[0.2em] font-medium text-muted-foreground">

            {/* Collections */}
            {hasCollections && (
              <div className="border-b border-border">
                <div className="flex items-center justify-between">
                  <Link href="/catalog" className="py-4 hover:text-foreground transition-colors flex-1">
                    Collections
                  </Link>
                  <button
                    onClick={() => setExpandedSection(prev => prev === 'collections' ? null : 'collections')}
                    className="p-2"
                    aria-label="Toggle collections"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSection === 'collections' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {expandedSection === 'collections' && (
                  <div className="pb-3 pl-4">
                    {displayCollections.map(col => (
                      <Link
                        key={col}
                        href={`/catalog?collection=${encodeURIComponent(col)}`}
                        className="block py-2 text-[10px] tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {col}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Categories */}
            {hasCategories && (
              <div className="border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="py-4 flex-1">Categories</span>
                  <button
                    onClick={() => setExpandedSection(prev => prev === 'categories' ? null : 'categories')}
                    className="p-2"
                    aria-label="Toggle categories"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSection === 'categories' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {expandedSection === 'categories' && (
                  <div className="pb-3 pl-4">
                    <Link
                      href="/catalog"
                      className="block py-3 text-[10px] tracking-wider font-semibold text-foreground/90 hover:text-foreground border-b border-border/50 mb-2 transition-colors"
                    >
                      Shop All
                    </Link>
                    {categories.map(cat => (
                      <div key={cat}>
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/catalog?category=${encodeURIComponent(cat)}`}
                            className="py-2 text-[10px] tracking-wider text-muted-foreground hover:text-foreground transition-colors flex-1"
                          >
                            {cat.endsWith('s') ? cat : `${cat}s`}
                          </Link>
                          {categoryTree[cat].length > 0 && (
                            <button
                              onClick={() => setExpandedCat(prev => prev === cat ? null : cat)}
                              className="p-1"
                              aria-label={`Toggle ${cat} subcategories`}
                            >
                              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedCat === cat ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                        {expandedCat === cat && categoryTree[cat].length > 0 && (
                          <div className="pb-2 pl-4">
                            {categoryTree[cat].map(sub => (
                              <Link
                                key={sub}
                                href={`/catalog?category=${encodeURIComponent(cat)}&subcategory=${encodeURIComponent(sub)}`}
                                className="block py-1.5 text-[15px] tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {sub}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bespoke -- only if products exist */}
            {hasBespoke && (
              <Link href="/catalog?collection=Bespoke" className="py-4 border-b border-border hover:text-foreground transition-colors">
                Bespoke
              </Link>
            )}

            <Link href="/our-story" className="py-4 border-b border-border hover:text-foreground transition-colors">
              Our Story
            </Link>
            <Link href="/appointments" className="py-4 border-b border-border hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
