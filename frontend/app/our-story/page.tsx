'use client';

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function OurStoryPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Hero Text Reveal
    gsap.from(".hero-text", {
      opacity: 0,
      y: 30,
      duration: 1.5,
      ease: "power3.out",
      stagger: 0.3
    });

    // Section Reveals
    const sections = gsap.utils.toArray(".reveal-section");
    sections.forEach((section: any) => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
        },
        opacity: 0,
        y: 40,
        duration: 1.2,
        ease: "power2.out"
      });
    });

    // Image Paralax / Reveal
    gsap.from(".reveal-image", {
      scrollTrigger: {
        trigger: ".reveal-image",
        start: "top 85%",
      },
      opacity: 0,
      scale: 1.05,
      duration: 2,
      ease: "power2.out"
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans text-gray-900 selection:bg-gray-100">

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 text-center pt-20">
        <div className="max-w-4xl mx-auto">
          <p className="hero-text text-[10px] uppercase tracking-[0.5em] text-gray-400 mb-12">The House of Carpe Diam</p>
          <h1 className="hero-text text-3xl md:text-5xl lg:text-6xl font-serif italic leading-tight mb-16">
            "Carpe Diam began not as a business idea, but as a shared way of seeing."
          </h1>
          <div className="hero-text w-16 h-px bg-black/20 mx-auto mb-16" />
          <p className="hero-text max-w-2xl mx-auto text-sm md:text-base text-gray-500 leading-relaxed tracking-wide uppercase px-4">
            Two people from different disciplines, moving through different worlds, gradually realizing they spoke the same language—one of form, precision, and intention.
          </p>
        </div>
      </section>

      {/* 2. THE PARTNERSHIP */}
      <section className="reveal-section py-32 px-6 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative aspect-[4/5] overflow-hidden reveal-image order-2 lg:order-1">
            <Image
              src="/WhatsApp_Image_2025-08-30_at_16.29.52.webp"
              alt="Joohi & Rushabh - Carpe Diam"
              fill
              className="object-cover transition-all duration-1000"
            />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl md:text-3xl font-serif italic mb-8">The Brainchild of<br />Joohi & Rushabh</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Partners in life and in process, united by a belief that fine jewelry can be both contemporary and deeply rooted. Their approach is built on contrast and balance: instinct paired with structure, imagination grounded in expertise.
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Founded with Certainty</p>
          </div>
        </div>
      </section>

      {/* 3. THE FOUNDATION (Rushabh) */}
      <section className="reveal-section py-32 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-6">The Foundation</p>
            <h3 className="text-3xl md:text-4xl font-serif mb-10 leading-snug">Expertise, Trust, and Long-term Thinking.</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Rushabh brings over a decade of international fine jewelry experience spanning operations, sourcing, quality, and craftsmanship. His deep understanding of materials, processes, and global standards forms the backbone of Carpe Diam.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Guided by a commitment to integrity and precision, he ensures that every piece is executed with purpose and accountability. At Carpe Diam, Rushabh anchors the house—shaping its foundation through expertise and trust.
            </p>
          </div>
          <div className="pt-12 lg:pt-32">
            <div className="w-full h-px bg-gray-100 mb-12" />
            <p className="text-sm font-serif italic text-gray-500 leading-relaxed">
              "The decision to create Carpe Diam together was neither impulsive nor emotional. It emerged from a quiet certainty—that our strengths were complementary."
            </p>
          </div>
        </div>
      </section>

      {/* 4. THE VISION (Joohi) */}
      <section className="reveal-section py-32 px-6 bg-black text-white overflow-hidden">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative aspect-[4/5] overflow-hidden reveal-image">
            <Image 
              src="/Vision.webp" 
              alt="Joohi's Creative Vision" 
              fill 
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-6 font-sans">The Creative Vision</p>
            <h3 className="text-3xl md:text-4xl font-serif mb-10 leading-snug italic">Art-led perspective, rooted in Indian sensibilities.</h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Joohi leads the creative vision, designing jewelry that feels intimate, thoughtful, and destined to become modern heirlooms. Her background in art, fashion, and design allows her to develop a nuanced understanding of contemporary design.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Beginning her journey in 2016 at international export houses catering to French and Italian luxury brands, she creates pieces that feel both juxtaposed and harmonious.
            </p>
          </div>
        </div>
      </section>

      {/* 5. THE JOURNEY */}
      <section className="reveal-section py-40 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-10">The Journey</p>
          <h2 className="text-2xl md:text-4xl font-serif italic mb-12 leading-tight">
            In late 2022, they relocated from Los Angeles to India to lay the foundation of Carpe Diam.
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
            What began as conversations around design, material, and craft evolved into a shared pursuit: to shape a modern fine jewelry house that reflects both where they come from and where they are headed.
          </p>
        </div>
      </section>

      {/* 6. THE INTERPRETATION */}
      <section className="reveal-section py-32 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-serif italic text-gray-400 mb-12">The Interpretation</p>
          <h2 className="text-3xl md:text-5xl font-serif mb-16 decoration-gray-200 decoration-1 underline-offset-8">
            Contemporary, restrained, and quietly confident.
          </h2>
          <p className="text-xs uppercase tracking-[0.5em] text-gray-400">
            Carpe Diam ©
          </p>
        </div>
      </section>

      <style jsx>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>

    </div>
  );
}
