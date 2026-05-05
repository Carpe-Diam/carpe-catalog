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
      scale: 0.45,
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
    <div ref={containerRef} className="bg-background text-foreground">
      {/* 1. HERO SECTION – matches the design from the image */}
      <section className="relative min-h-[90vh] w-full flex flex-col items-center justify-center px-6 text-center pt-20">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Pill Tag */}
          <div className="mb-8 px-6 py-2 bg-secondary rounded-full border border-white/5">
            <span className="text-[12px] tracking-[0.2em] font-semibold text-[#84968c] uppercase">
              Private Collection.
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-normal mb-8 leading-[1.1]">
            We turn moments <br /> into real legacy
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
            Elevate your personal style with custom, hand-crafted jewelry. 
            We curate authentic engagement and sustainable elegance for premium lifestyles.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/catalog" 
              className="px-10 py-4 bg-accent text-accent-foreground rounded-full text-sm font-semibold tracking-widest hover:opacity-90 transition-all shadow-xl shadow-accent/10"
            >
              Get in touch
            </Link>
            <Link 
              href="/appointments" 
              className="px-10 py-4 border border-white/20 rounded-full text-sm font-semibold tracking-widest hover:bg-white/5 transition-all"
            >
              Contact us
            </Link>
          </div>
        </div>

        {/* 4 Cards Preview Section (from the image) */}
        <div className="mt-32 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-[1400px]">
          {categories.slice(0, 4).map((cat, idx) => (
            <div 
              key={cat.title} 
              className={`cat-card relative aspect-[3/4] rounded-[3rem] overflow-hidden group border border-white/5 ${idx % 2 === 1 ? 'lg:translate-y-12' : ''}`}
            >
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-10 left-10 text-left">
                <h3 className="text-xl font-medium tracking-wide mb-1">{cat.title}</h3>
                <p className="text-sm text-muted-foreground uppercase tracking-widest">{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. CATEGORY FULL GRID (Preserving functionality) */}
      <section className="py-32 px-6 lg:px-20 max-w-[1800px] mx-auto">
        <div className="cat-heading text-center mb-16">
          <h2 className="text-sm uppercase tracking-[0.4em] text-muted-foreground mb-4">Explore Categories</h2>
          <div className="w-12 h-px bg-white/20 mx-auto" />
        </div>
        <div className="cat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat) => (
            <Link key={cat.title} href={`/catalog?category=${encodeURIComponent(cat.rawCategory)}`}>
              <div className="cat-card group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden cursor-pointer border border-white/5">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-background via-background/20 to-transparent">
                  <h3 className="text-foreground text-sm uppercase tracking-[0.3em] font-semibold mb-2">{cat.title}</h3>
                  <div className="w-0 group-hover:w-full h-px bg-accent transition-all duration-500" />
                  <p className="mt-4 text-muted-foreground text-[10px] uppercase tracking-[0.2em]">{cat.count}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
