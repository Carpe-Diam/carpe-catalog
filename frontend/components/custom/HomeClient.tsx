'use client';

import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

import DisplayCard from "@/components/custom/DisplayCard";
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

  useGSAP(() => {
    const tl = gsap.timeline();

    /* 1. Logo fades in slowly */
    tl.from(".hero-logo", {
      opacity: 0,
      scale: 0.85,
      duration: 2,
      ease: "power2.out",
    });

    /* 2. Underline sweeps in from left */
    tl.from(".hero-underline", {
      scaleX: 0,
      duration: 1.2,
      ease: "power2.inOut",
    }, "-=0.6");

    /* 3. CTA link fades in */
    tl.from(".hero-cta", { opacity: 0, y: 15, duration: 0.8, ease: "power2.out" }, "-=0.3");

    /* Scroll-triggered: Category heading slides up gently */
    gsap.from(".cat-heading", {
      scrollTrigger: {
        trigger: ".cat-heading",
        start: "top 85%",
      },
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: "power2.out"
    });

    /* Scroll-triggered: Category cards stagger in one by one */
    gsap.from(".cat-card", {
      scrollTrigger: {
        trigger: ".cat-grid",
        start: "top 80%",
      },
      opacity: 0,
      y: 60,
      duration: 1,
      stagger: 0.15,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-white">
      {/* 1. HERO SECTION – clean white with black logo */}
      <section className="relative h-[40vh] md:h-[55vh] w-full flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center justify-center hero-content">
          {/* Logo (black on white) */}
          <div className="hero-logo-wrapper flex flex-col items-center">
            <img
              src="/cd-logo.svg"
              alt="Carpe Diam"
              className="hero-logo w-[280px] md:w-[420px] lg:w-[500px]"
            />
            {/* Underline that reveals on load */}
            <div
              className="hero-underline mt-4 md:mt-6 h-[1px] w-[200px] md:w-[320px] bg-black/30 origin-left"
            />
          </div>

          {/* Simple text link */}
          <Link href="/catalog" className="hero-cta mt-10 text-[11px] uppercase tracking-[0.25em] text-gray-500 hover:text-black transition-colors">
            Explore Collection →
          </Link>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY */}
      <section className="py-24 px-6 lg:px-20 max-w-[1800px] mx-auto">
        <div className="cat-heading text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-serif tracking-widest mb-4">CATEGORY</h2>
          <div className="w-12 h-px bg-gray-300 mx-auto" />
        </div>
        <div className="cat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.title} href={`/catalog?category=${encodeURIComponent(cat.rawCategory)}`}>
              <div className="cat-card group relative aspect-[3/4] overflow-hidden cursor-pointer">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
                  <h3 className="text-white text-xs uppercase tracking-[0.2em] font-semibold mb-1">{cat.title}</h3>
                  <p className="text-white/60 text-[10px] uppercase tracking-widest">{cat.count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>


    </div>
  );
}
