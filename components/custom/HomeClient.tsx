'use client';

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { useMemo } from "react";
import { type Product } from "@/lib/zohoClient";

export default function HomeClient({ products }: { products: Product[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    const images: Record<string, string> = {};

    products.forEach(p => {
      if (p.category) {
        const cat = p.category.split(' - ')[0].trim();
        counts[cat] = (counts[cat] || 0) + 1;

        const baseName = cat.split(' ')[0].toLowerCase();
        let image = '';

        if (baseName === 'bracelet' || baseName === 'bracelets') {
          image = '/images/redesign/cat-bracelets.jpeg';
        } else if (baseName === 'earring' || baseName === 'earrings') {
          image = '/images/redesign/Earrings.jpeg';
        } else if (baseName === 'necklace' || baseName === 'necklaces') {
          image = '/images/redesign/Necklace.jpeg';
        } else if (baseName === 'ring' || baseName === 'rings') {
          image = '/images/redesign/Ring.jpeg';
        } else {
          const plural = baseName.endsWith('s') ? baseName : baseName + 's';
          image = `/images/redesign/cat-${plural}.png`;
        }

        images[cat] = image;
      }
    });

    return Object.entries(counts).map(([title, count]) => ({
      title: title.endsWith('s') ? title : `${title}s`,
      rawCategory: title,
      image: images[title] || "/images/redesign/collection-hero.png", // fallback image
      count: `${count} pieces`
    })).sort((a, b) => parseInt(b.count) - parseInt(a.count)).slice(0, 4);
  }, [products]);



  return (
    <div ref={containerRef} className="bg-background text-foreground">
      <section className="relative min-h-[calc(100vh-96px)] w-full flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <h1 className="hero-cta text-[32px] sm:text-[40px] lg:text-[56px] xl:text-[64px] font-serif italic leading-[1.35] tracking-normal">
            <span className="block md:whitespace-nowrap">Before it opens to the world, it opens for you.</span>
            <span className="block md:whitespace-nowrap">Welcome to the Carpe Diam private collection.</span>
          </h1>

          <div className="hero-cta mt-20 flex flex-col sm:flex-row gap-6">
            <Link
              href="/catalog"
              className="min-w-[230px] border border-foreground px-10 py-5 text-[11px] uppercase tracking-[0.35em] font-semibold transition-colors hover:bg-foreground hover:text-background"
            >
              Explore
            </Link>
            <Link
              href="/appointments"
              className="min-w-[240px] border border-border px-10 py-5 text-[11px] uppercase tracking-[0.35em] font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              Request Access
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16 px-6 lg:px-20 max-w-[1800px] mx-auto">
        <div className="cat-heading text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-serif uppercase tracking-[0.35em] text-foreground mb-4">Category</h2>
          <div className="w-12 h-px bg-border mx-auto" />
        </div>
        <div className="cat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <Link key={cat.title} href={`/catalog?category=${encodeURIComponent(cat.rawCategory)}`}>
              <div className="cat-card group relative aspect-[4/5] overflow-hidden cursor-pointer bg-muted">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/70 via-black/25 to-transparent">
                  <h3 className="text-white text-sm uppercase tracking-[0.3em] font-semibold mb-3">{cat.title}</h3>
                  <p className="text-white/60 text-[10px] uppercase tracking-[0.2em]">{cat.count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
