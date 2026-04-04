'use client';

import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, { useRef, useMemo } from "react";
import { type Product } from "@/lib/zohoClient";

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- */
/*                         SHOP BY CONFIGURATION                                */
/* -------------------------------------------------------------------------- */

const TAGLINES = [
  { line1: 'The', line2: 'language of', accent: 'luxury' },
  { line1: 'Sparkle', line2: 'like there\'s', accent: 'no tomorrow' },
  { line1: 'Elegance', line2: 'in every', accent: 'facet' },
];

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function HomeClient({ products, collections }: { products: Product[]; collections: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* ---- Build separate pools for Product and Lifestyle (Model) images ---- */
  /* ---- Build pools for Categories and Collections ---- */
  const { categoryPool, collectionPool } = useMemo(() => {
    const catMap = new Map<string, { image: string; title: string; href: string }>();
    const colMap = new Map<string, { image: string; title: string; href: string }>();

    // Priority Categories
    const CATEGORIES = ['Rings', 'Earrings', 'Necklaces', 'Bracelets', 'Bangles', 'Pendants'];

    products.forEach(p => {
      const cat = p.product_category || p.category;
      if (cat && !catMap.has(cat)) {
        const img = p.record_image || p.variants?.[0]?.media?.[0]?.download_url || '/images/redesign/collection-hero.png';
        catMap.set(cat, {
          image: img,
          title: cat,
          href: `/catalog?category=${encodeURIComponent(cat)}`
        });
      }

      if (p.collection && Array.isArray(p.collection)) {
        p.collection.forEach(col => {
          if (!colMap.has(col)) {
            // Find a lifestyle/model image for the collection if possible
            let img = p.record_image || p.variants?.[0]?.media?.[0]?.download_url || '/images/redesign/collection-hero.png';
            const lifestyle = p.variants.flatMap(v => v.media).find(m => 
              m.file_name.toLowerCase().includes('model') || 
              m.file_name.toLowerCase().includes('lifestyle') ||
              m.file_name.toLowerCase().includes('landscape')
            );
            if (lifestyle) img = lifestyle.download_url;

            colMap.set(col, {
              image: img,
              title: col,
              href: `/catalog?collection=${encodeURIComponent(col)}`
            });
          }
        });
      }
    });

    // Sort categories to put priority ones first
    const sortedCats = Array.from(catMap.values()).sort((a, b) => {
      const aIdx = CATEGORIES.indexOf(a.title);
      const bIdx = CATEGORIES.indexOf(b.title);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.title.localeCompare(b.title);
    });

    return { 
      categoryPool: sortedCats, 
      collectionPool: Array.from(colMap.values()) 
    };
  }, [products]);

  /* ---- Create the Dynamic Grid Pattern (Name + Image Pairs) ---- */
  const gridCells = useMemo(() => {
    // Combine all categories and collections into a single pool
    const displayPool = [...categoryPool, ...collectionPool];
    return displayPool;
  }, [categoryPool, collectionPool]);

  /* ---- GSAP ---- */
  useGSAP(() => {
    const tl = gsap.timeline();

    tl.from(".hero-logo", {
      opacity: 0,
      scale: 0.85,
      duration: 2,
      ease: "power2.out",
    });

    tl.from(".hero-underline", {
      scaleX: 0,
      duration: 1.2,
      ease: "power2.inOut",
    }, "-=0.6");

    tl.from(".hero-cta", { opacity: 0, y: 15, duration: 0.8, ease: "power2.out" }, "-=0.3");

    /* Grid heading */
    gsap.from(".grid-heading", {
      scrollTrigger: {
        trigger: ".grid-heading",
        start: "top 85%",
      },
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-white">
      {/* ── HERO SECTION ── */}
      <section className="relative h-[40vh] md:h-[55vh] w-full flex flex-col items-center justify-center bg-white overflow-hidden">
        <div className="flex flex-col items-center justify-center hero-content">
          <div className="hero-logo-wrapper flex flex-col items-center">
            <img
              src="/cd-logo.svg"
              alt="Carpe Diam"
              className="hero-logo w-[280px] md:w-[420px] lg:w-[500px]"
            />
            <div className="hero-underline mt-4 md:mt-6 h-[1px] w-[200px] md:w-[320px] bg-black/30 origin-left" />
          </div>
          <Link href="/catalog" className="hero-cta mt-10 text-[11px] uppercase tracking-[0.25em] text-gray-500 hover:text-black transition-colors">
            Explore Collection →
          </Link>
        </div>
      </section>

      {/* ── SHOP BY GRID SECTION (DYNAMIC COLUMNS) ── */}
      <section className="pb-16 md:pb-24 w-full">
        <div className="grid-heading text-center mb-12 md:mb-16 px-6">
          <h2 className="text-2xl md:text-3xl font-serif tracking-widest mb-4 uppercase">Shop By</h2>
          <div className="w-12 h-px bg-gray-300 mx-auto" />
        </div>

        {/* 
          Grid Structure:
          - Added padding and gaps to make curved borders visible
          - Enhanced stagger layout
        */}
        <div className="shopby-grid grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-10 lg:px-16 overflow-hidden">
          {gridCells.map((item, idx) => {
            const isEvenRow = Math.floor(idx / 2) % 2 === 0;
            
            // Name Block Component
            const NameBlock = (
              <Link
                key={`name-${item.title}-${idx}`}
                href={item.href}
                className="hidden lg:flex shopby-cell relative aspect-square flex-col items-center justify-center overflow-hidden bg-black group transition-all duration-500 rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative z-10 text-center px-6">
                  <p className="font-serif italic text-white text-xl xl:text-2xl leading-tight border-b border-white/10 pb-4 mb-4 uppercase tracking-wider">
                    {item.title}
                  </p>
                  <span className="text-gray-500 text-[8px] xl:text-[9px] uppercase tracking-[0.4em] font-medium group-hover:text-white transition-all duration-300">
                    Discover Now
                  </span>
                </div>
              </Link>
            );

            // Image Block Component
            const ImageBlock = (
              <Link
                key={`img-${item.title}-${idx}`}
                href={item.href}
                className="shopby-cell group relative aspect-square overflow-hidden bg-white cursor-pointer rounded-[2rem] md:rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  unoptimized
                />
                
                <div className="absolute inset-x-0 bottom-0 p-3 z-10 lg:hidden text-center">
                  <div className="bg-white p-3 shadow-lg border border-black/5 rounded-2xl mx-2 mb-2">
                    <p className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-black font-semibold">
                      {item.title}
                    </p>
                  </div>
                </div>

                <div className="absolute inset-0 border-[0.5px] border-black/5 pointer-events-none rounded-[2rem] md:rounded-[2.5rem]" />
              </Link>
            );

            return (
              <React.Fragment key={`${item.title}-${idx}`}>
                {isEvenRow ? (
                  <>
                    {NameBlock}
                    {ImageBlock}
                  </>
                ) : (
                  <>
                    {ImageBlock}
                    {NameBlock}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>
    </div>
  );
}
