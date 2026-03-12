'use client';

import { Input } from "@/components/ui/input";
import { useState, useRef, useMemo, useCallback, memo } from "react";
import DisplayCard from "@/components/custom/DisplayCard";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search } from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function ExplorePage({ products }: { products: any[] }) {
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter based on search query
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      (p?.title ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (p?.product_category ?? "").toLowerCase().includes(query.toLowerCase())
    );
  }, [products, query]);

  // Categorize products
  const stockProducts = useMemo(() => filteredProducts.filter(p => p.type_of_order?.toLowerCase().includes('stock')), [filteredProducts]);
  const customProducts = useMemo(() => filteredProducts.filter(p => p.type_of_order?.toLowerCase().includes('customer') || p.type_of_order?.toLowerCase().includes('custom')), [filteredProducts]);
  const sketchProducts = useMemo(() => filteredProducts.filter(p => p.type_of_order?.toLowerCase().includes('sketch')), [filteredProducts]);

  // Products that don't match any of the above
  const otherProducts = useMemo(() => filteredProducts.filter(p =>
    !p.type_of_order?.toLowerCase().includes('stock') &&
    !p.type_of_order?.toLowerCase().includes('customer') &&
    !p.type_of_order?.toLowerCase().includes('custom') &&
    !p.type_of_order?.toLowerCase().includes('sketch')
  ), [filteredProducts]);

  useGSAP(() => {
    // Reveal animation for category sections
    const sections = gsap.utils.toArray('.category-section') as HTMLElement[];
    sections.forEach((section) => {
      gsap.fromTo(section,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // Stagger items in the grid
    const grids = gsap.utils.toArray('.product-grid') as HTMLElement[];
    grids.forEach(grid => {
      const cards = grid.querySelectorAll('.product-card');
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power1.out",
            scrollTrigger: {
              trigger: grid,
              start: "top 90%",
            }
          }
        );
      }
    });

  }, { scope: containerRef, dependencies: [query] }); // Re-run when query changes

  const scrollToCategory = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen text-[#1A1A1A] font-sans" ref={containerRef}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-[#EAEAEA] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
        <div className="flex items-center w-full md:w-auto justify-between">
          <Link href="/">
            <Image src="/ud-logo.svg" alt="Logo" width={70} height={28} unoptimized className="cursor-pointer" />
          </Link>
        </div>

        {/* Category Links */}
        <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-medium text-gray-500">
          {stockProducts.length > 0 && (
            <button onClick={() => scrollToCategory('stock')} className="hover:text-black transition-colors">Stock</button>
          )}
          {customProducts.length > 0 && (
            <button onClick={() => scrollToCategory('custom')} className="hover:text-black transition-colors">Custom</button>
          )}
          {sketchProducts.length > 0 && (
            <button onClick={() => scrollToCategory('sketch')} className="hover:text-black transition-colors">Sketch</button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-auto max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search collections..."
            className="pl-9 bg-transparent border-[#EAEAEA] focus-visible:ring-1 focus-visible:ring-black rounded-none shadow-none w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </nav>

      {/* Hero Header */}
      <header className="py-16 md:py-24 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif text-[#111] mb-4">Our Collections</h1>
        <p className="text-gray-500 text-sm md:text-base leading-relaxed tracking-wide">
          Discover our curated selection of fine jewelry. From instantly available stock pieces to unique custom customer orders and visionary sketches ready to be brought to life.
        </p>
      </header>

      {/* Categories */}
      <main className="px-6 md:px-12 pb-24 space-y-24 max-w-[1600px] mx-auto">
        {stockProducts.length > 0 && (
          <CategorySection id="stock" title="Stock Products" products={stockProducts} />
        )}

        {customProducts.length > 0 && (
          <CategorySection id="custom" title="Custom Products" products={customProducts} />
        )}

        {sketchProducts.length > 0 && (
          <CategorySection id="sketch" title="Sketch Products" products={sketchProducts} />
        )}

        {otherProducts.length > 0 && (
          <CategorySection id="other" title="Other Products" products={otherProducts} />
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No products found matching your search.
          </div>
        )}
      </main>
    </div>
  );
}

const CategorySection = memo(function CategorySection({ id, title, products }: { id: string, title: string, products: any[] }) {
  return (
    <section id={id} className="category-section scroll-mt-24">
      <div className="flex items-center justify-between mb-8 border-b border-[#EAEAEA] pb-4">
        <h2 className="text-2xl font-serif text-[#111]">{title}</h2>
        <span className="text-sm text-gray-500">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span>
      </div>

      <div className="product-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
        {products.map((product) => (
          <div key={product.parent_sku} className="product-card group relative">
            <DisplayCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
});