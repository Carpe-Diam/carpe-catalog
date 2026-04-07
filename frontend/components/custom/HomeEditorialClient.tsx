'use client';

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, { useMemo, useRef } from "react";
import { type Product } from "@/lib/zohoClient";

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_IMAGE = "/images/redesign/collection-hero.png";
const PRIORITY_CATEGORIES = ["Rings", "Earrings", "Necklaces", "Bracelets", "Bangles", "Pendants"];
const TAGLINES = [
  "The language of luxury",
  "Sparkle like there's no tomorrow",
  "Elegance in every facet",
];

type DisplayItem = {
  image: string;
  title: string;
  href: string;
  kind: "category" | "collection";
};

type EditorialGroup = {
  items: DisplayItem[];
  layout: "split" | "feature";
};

function buildEditorialGroups(items: DisplayItem[]): EditorialGroup[] {
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

function EditorialSection({ group, index }: { group: EditorialGroup; index: number }) {
  if (group.layout === "split") {
    return (
      <section className="relative h-screen w-full overflow-hidden">
        <div className="sticky top-0 flex h-screen w-full">
          {group.items.map((item, itemIndex) => (
            <Link
              key={`${item.title}-${itemIndex}`}
              href={item.href}
              className="group relative block h-full flex-1 overflow-hidden"
            >
              <img
                src={item.image || FALLBACK_IMAGE}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
              <div className="editorial-copy absolute inset-x-0 bottom-0 z-10 p-6 text-white md:p-10">
                <p className="mb-3 text-[10px] uppercase tracking-[0.42em] text-white/70">
                  {item.kind === "category" ? "Category Edit" : "Collection Focus"}
                </p>
                <h2 className="max-w-[12ch] text-3xl uppercase tracking-[0.2em] md:text-5xl">
                  {item.title}
                </h2>
                <span className="mt-4 inline-flex border-b border-white/40 pb-1 text-[10px] uppercase tracking-[0.35em] text-white/85">
                  Discover Now
                </span>
              </div>

              {itemIndex === 0 ? (
                <div className="absolute right-0 top-0 z-20 hidden h-full w-px bg-white/20 md:block" />
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  const item = group.items[0];

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <Link href={item.href} className="group sticky top-0 block h-screen w-full overflow-hidden">
        <img
          src={item.image || FALLBACK_IMAGE}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.28)_38%,rgba(0,0,0,0.72)_100%)]" />
        <div className="editorial-copy absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-white">
          <div className="max-w-3xl">
            <p className="mb-4 text-[10px] uppercase tracking-[0.5em] text-white/70">
              {item.kind === "category" ? "Signature Category" : "Featured Collection"}
            </p>
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

export default function HomeEditorialClient({
  products,
  collections,
}: {
  products: Product[];
  collections: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { categoryPool, collectionPool } = useMemo(() => {
    const catMap = new Map<string, DisplayItem>();
    const colMap = new Map<string, DisplayItem>();

    products.forEach((product) => {
      const category = product.product_category || product.category;
      const defaultImage =
        product.record_image ||
        product.variants?.[0]?.media?.[0]?.download_url ||
        FALLBACK_IMAGE;

      if (category && !catMap.has(category)) {
        catMap.set(category, {
          image: defaultImage,
          title: category,
          href: `/catalog?category=${encodeURIComponent(category)}`,
          kind: "category",
        });
      }

      if (Array.isArray(product.collection)) {
        const allMedia = product.variants?.flatMap((variant) => variant.media ?? []) ?? [];
        const lifestyle = allMedia.find((media) => {
          const fileName = media.file_name.toLowerCase();
          return (
            fileName.includes("model") ||
            fileName.includes("lifestyle") ||
            fileName.includes("landscape")
          );
        });

        product.collection.forEach((collection) => {
          if (!colMap.has(collection)) {
            colMap.set(collection, {
              image: lifestyle?.download_url || defaultImage,
              title: collection,
              href: `/catalog?collection=${encodeURIComponent(collection)}`,
              kind: "collection",
            });
          }
        });
      }
    });

    const sortedCategories = Array.from(catMap.values()).sort((left, right) => {
      const leftIndex = PRIORITY_CATEGORIES.indexOf(left.title);
      const rightIndex = PRIORITY_CATEGORIES.indexOf(right.title);

      if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex;
      if (leftIndex !== -1) return -1;
      if (rightIndex !== -1) return 1;
      return left.title.localeCompare(right.title);
    });

    return {
      categoryPool: sortedCategories,
      collectionPool: Array.from(colMap.values()),
    };
  }, [products]);

  const gridCells = useMemo(() => {
    return [...categoryPool, ...collectionPool];
  }, [categoryPool, collectionPool]);

  const editorialPool = useMemo(() => {
    const seen = new Set<string>();
    const featured = [...categoryPool.slice(0, 6), ...collectionPool.slice(0, 4)];

    return featured.filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categoryPool, collectionPool]);

  const editorialGroups = useMemo(() => buildEditorialGroups(editorialPool), [editorialPool]);

  const introImage = editorialPool[0]?.image || gridCells[0]?.image || FALLBACK_IMAGE;
  const storyImage = editorialPool[1]?.image || introImage;
  const appointmentImage = editorialPool[2]?.image || introImage;

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

      gsap.utils.toArray<HTMLElement>(".editorial-copy").forEach((element) => {
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

      gsap.from(".grid-heading", {
        scrollTrigger: {
          trigger: ".grid-heading",
          start: "top 85%",
        },
        opacity: 0,
        y: 40,
        duration: 1.2,
        ease: "power2.out",
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="bg-[#f7f2ec]">
      <section className="relative min-h-screen overflow-hidden">
        <img
          src={introImage}
          alt="Carpe Diam editorial hero"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.22)_0%,rgba(0,0,0,0.35)_45%,rgba(0,0,0,0.68)_100%)]" />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center text-white">
          <p className="hero-copy text-[10px] uppercase tracking-[0.55em] text-white/70">
            {collections.length}+ curated collections
          </p>
          <img
            src="/cd-logo.svg"
            alt="Carpe Diam"
            className="hero-logo mt-6 w-[250px] brightness-0 invert md:w-[420px] lg:w-[520px]"
          />
          <div className="hero-underline mt-5 h-px w-32 bg-white/45 origin-center md:w-52" />
          <p className="hero-copy mt-8 max-w-2xl text-base uppercase tracking-[0.28em] text-white/85 md:text-lg">
            Fine jewelry framed like an editorial story.
          </p>
          <p className="hero-copy mt-4 max-w-xl text-sm text-white/72 md:text-base">
            Scroll through signature categories, featured collections, and then drop straight into the full catalog edit.
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
        <EditorialSection key={`editorial-group-${index}`} group={group} index={index} />
      ))}

      <div className="relative z-30 bg-white">
        <section className="px-4 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24 lg:px-16">
          <div className="grid-heading mx-auto mb-12 max-w-3xl text-center md:mb-16">
            <p className="mb-4 text-[10px] uppercase tracking-[0.45em] text-stone-400">
              Full Home Edit
            </p>
            <h2 className="text-2xl uppercase tracking-[0.2em] text-stone-900 md:text-4xl">
              Shop By Category And Collection
            </h2>
            <div className="mx-auto mt-5 h-px w-14 bg-stone-300" />
          </div>

          <div className="shopby-grid grid grid-cols-2 gap-4 overflow-hidden md:gap-6 lg:grid-cols-4">
            {gridCells.map((item, idx) => {
              const isEvenRow = Math.floor(idx / 2) % 2 === 0;

              const nameBlock = (
                <Link
                  key={`name-${item.title}-${idx}`}
                  href={item.href}
                  className="group relative hidden aspect-square flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-[#111111] transition-all duration-500 hover:-translate-y-1 hover:shadow-xl lg:flex"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
                  <div className="relative z-10 px-6 text-center text-white">
                    <p className="border-b border-white/10 pb-4 font-serif text-xl italic uppercase tracking-wider xl:text-2xl">
                      {item.title}
                    </p>
                    <span className="mt-4 inline-flex text-[8px] uppercase tracking-[0.42em] text-stone-400 transition-colors duration-300 group-hover:text-white">
                      Discover Now
                    </span>
                  </div>
                </Link>
              );

              const imageBlock = (
                <Link
                  key={`img-${item.title}-${idx}`}
                  href={item.href}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-[2rem] bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    unoptimized
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 z-10 p-3 text-center lg:hidden">
                    <div className="mx-2 mb-2 rounded-2xl border border-black/5 bg-white/92 p-3 shadow-lg backdrop-blur-sm">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black md:text-[10px]">
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-black/5" />
                </Link>
              );

              return (
                <React.Fragment key={`${item.title}-${idx}`}>
                  {isEvenRow ? (
                    <>
                      {nameBlock}
                      {imageBlock}
                    </>
                  ) : (
                    <>
                      {imageBlock}
                      {nameBlock}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </section>

        <section className="grid gap-px bg-stone-200 md:grid-cols-2">
          <Link href="/our-story" className="group relative min-h-[60vh] overflow-hidden bg-black">
            <img
              src={storyImage}
              alt="Our Story"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
            <div className="editorial-copy relative z-10 flex min-h-[60vh] flex-col justify-end p-8 text-white md:p-12">
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
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
            <div className="editorial-copy relative z-10 flex min-h-[60vh] flex-col justify-end p-8 text-white md:p-12">
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
