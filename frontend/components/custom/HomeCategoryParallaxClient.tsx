'use client';

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, { useMemo, useRef } from "react";
import {
  HOME_CATEGORY_CONFIG,
  HOME_SECTION_IMAGES,
} from "@/data/homepageImages";
import { type Product } from "@/lib/zohoClient";

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_IMAGE = "/images/redesign/collection-hero.png";
const TAGLINES = [
  "The language of luxury",
  "Sparkle like there's no tomorrow",
  "Elegance in every facet",
];

type CategoryItem = {
  image: string;
  title: string;
  href: string;
};

function normalizeCategory(value: string | null | undefined) {
  if (!value) return null;
  return value.split(" - ")[0].trim();
}

type EditorialGroup = {
  items: CategoryItem[];
  layout: "split" | "feature";
};

function buildEditorialGroups(items: CategoryItem[]): EditorialGroup[] {
  const groups: EditorialGroup[] = [];
  let cursor = 0;
  let useSplit = true;

  while (cursor < items.length) {
    const remaining = items.length - cursor;
    const take = useSplit && remaining > 1 ? 2 : 1;

    groups.push({
      items: items.slice(cursor, cursor + take),
      layout: take === 2 ? "split" : "feature",
    });

    cursor += take;
    useSplit = !useSplit;
  }

  return groups;
}

function StackedHeroSection({ group, index }: { group: EditorialGroup; index: number }) {
  if (group.layout === "split") {
    return (
      <section className="relative flex h-screen w-full overflow-hidden sticky top-0">
        {group.items.map((item, itemIndex) => (
          <Link
            key={`${item.title}-${itemIndex}`}
            href={item.href}
            className="group relative block h-full flex-1 overflow-hidden"
          >
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5" />
            <div className="stack-copy absolute inset-0 z-10 flex items-end p-6 text-white md:p-10">
              <div>
                <p className="mb-3 text-[10px] uppercase tracking-[0.42em] text-white/70">
                  Category Edit
                </p>
                <h2 className="max-w-[12ch] text-3xl uppercase tracking-[0.2em] md:text-5xl">
                  {item.title}
                </h2>
                <span className="mt-4 inline-flex border-b border-white/40 pb-1 text-[10px] uppercase tracking-[0.35em] text-white/85">
                  Discover Now
                </span>
              </div>
            </div>

            {itemIndex === 0 ? (
              <div className="absolute right-0 top-0 bottom-0 z-20 hidden w-px bg-white/20 md:block" />
            ) : null}
          </Link>
        ))}
      </section>
    );
  }

  const item = group.items[0];

  return (
    <section className="relative flex h-screen w-full overflow-hidden sticky top-0">
      <Link href={item.href} className="group block h-full w-full overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.28)_38%,rgba(0,0,0,0.72)_100%)]" />
        <div className="stack-copy absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-white">
          <div className="max-w-3xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-white/70">Signature Category</p>
            <h2 className="text-4xl uppercase tracking-[0.22em] md:text-6xl lg:text-7xl">
              {item.title}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm uppercase tracking-[0.2em] text-white/80 md:text-base">
              {TAGLINES[index % TAGLINES.length]}
            </p>
            <span className="mt-8 inline-flex border-b border-white/50 pb-1 text-[10px] uppercase tracking-[0.38em] text-white/90">
              Explore The Edit
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

export default function HomeCategoryParallaxClient({ products }: { products: Product[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const categoryPool = useMemo(() => {
    const availableCategories = new Set<string>();

    products.forEach((product) => {
      const category = normalizeCategory(product.category || product.product_category);
      if (category) availableCategories.add(category);
    });

    const configuredCategories = HOME_CATEGORY_CONFIG
      .filter((item) => availableCategories.has(item.category))
      .map((item) => ({
        image: item.image || FALLBACK_IMAGE,
        title: item.title,
        href: `/catalog?category=${encodeURIComponent(item.category)}`,
      }));

    const remainingCategories = Array.from(availableCategories)
      .filter((category) => !HOME_CATEGORY_CONFIG.some((item) => item.category === category))
      .sort((left, right) => left.localeCompare(right))
      .map((category) => ({
        image: FALLBACK_IMAGE,
        title: category,
        href: `/catalog?category=${encodeURIComponent(category)}`,
      }));

    return [...configuredCategories, ...remainingCategories];
  }, [products]);

  const editorialPool = useMemo(() => categoryPool.slice(0, 8), [categoryPool]);
  const editorialGroups = useMemo(() => buildEditorialGroups(editorialPool), [editorialPool]);

  const introImage = HOME_SECTION_IMAGES.intro || FALLBACK_IMAGE;
  const storyImage = HOME_SECTION_IMAGES.story || introImage;
  const appointmentImage = HOME_SECTION_IMAGES.appointments || introImage;

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.from(".hero-logo", {
        opacity: 0,
        scale: 0.9,
        duration: 1.6,
        ease: "power2.out",
      });

      tl.from(
        ".hero-underline",
        {
          scaleX: 0,
          duration: 1.1,
          ease: "power2.inOut",
        },
        "-=0.6",
      );

      tl.from(
        ".hero-copy, .hero-cta",
        {
          opacity: 0,
          y: 18,
          duration: 0.85,
          ease: "power2.out",
          stagger: 0.12,
        },
        "-=0.45",
      );

      gsap.utils.toArray<HTMLElement>(".stack-copy").forEach((element) => {
        gsap.from(element, {
          scrollTrigger: {
            trigger: element,
            start: "top 82%",
          },
          opacity: 0,
          y: 36,
          duration: 1,
          ease: "power2.out",
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="bg-[#f7f2ec]">
      <section className="relative min-h-screen overflow-hidden sticky top-0">
        <img
          src={introImage}
          alt="Carpe Diam editorial hero"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.22)_0%,rgba(0,0,0,0.35)_45%,rgba(0,0,0,0.68)_100%)]" />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center text-white">
          <p className="hero-copy text-[10px] uppercase tracking-[0.55em] text-white/70">
            {categoryPool.length}+ signature categories
          </p>
          <img
            src="/cd-logo.svg"
            alt="Carpe Diam"
            className="hero-logo mt-6 w-[250px] brightness-0 invert md:w-[420px] lg:w-[520px]"
          />
          <div className="hero-underline mt-5 h-px w-32 bg-white/45 origin-center md:w-52" />
          <p className="hero-copy mt-8 max-w-2xl text-base uppercase tracking-[0.28em] text-white/85 md:text-lg">
            Fine jewelry framed like a stacked editorial story.
          </p>
          <p className="hero-copy mt-4 max-w-xl text-sm text-white/72 md:text-base">
            Scroll through a parallax sequence built entirely around your core categories.
          </p>
          <Link
            href="/catalog"
            className="hero-cta mt-10 inline-flex border border-white/40 bg-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.4em] text-white transition-colors hover:bg-white hover:text-black"
          >
            Explore Collection
          </Link>
        </div>
      </section>

      {editorialGroups.map((group, index) => (
        <StackedHeroSection key={`editorial-group-${index}`} group={group} index={index} />
      ))}

      <div className="relative z-30 bg-white">
        <section className="grid gap-px bg-stone-200 md:grid-cols-2">
          <Link href="/our-story" className="group relative min-h-[60vh] overflow-hidden bg-black">
            <img
              src={storyImage}
              alt="Our Story"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
            <div className="stack-copy relative z-10 flex min-h-[60vh] flex-col justify-end p-8 text-white md:p-12">
              <p className="mb-3 text-[10px] uppercase tracking-[0.42em] text-white/70">Brand World</p>
              <h3 className="text-3xl uppercase tracking-[0.2em] md:text-4xl">Our Story</h3>
              <span className="mt-4 inline-flex border-b border-white/40 pb-1 text-[10px] uppercase tracking-[0.35em] text-white/85">
                Read More
              </span>
            </div>
          </Link>

          <Link href="/appointments" className="group relative min-h-[60vh] overflow-hidden bg-black">
            <img
              src={appointmentImage}
              alt="Appointments"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
            <div className="stack-copy relative z-10 flex min-h-[60vh] flex-col justify-end p-8 text-white md:p-12">
              <p className="mb-3 text-[10px] uppercase tracking-[0.42em] text-white/70">Private Service</p>
              <h3 className="text-3xl uppercase tracking-[0.2em] md:text-4xl">Book Appointment</h3>
              <span className="mt-4 inline-flex border-b border-white/40 pb-1 text-[10px] uppercase tracking-[0.35em] text-white/85">
                Reserve Time
              </span>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
