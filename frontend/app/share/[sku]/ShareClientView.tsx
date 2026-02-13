"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { X, Play } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                 TYPE DEFINITIONS                            */
/* -------------------------------------------------------------------------- */

type MediaType = "image" | "video";

export interface MediaItem {
  type: MediaType;
  src: string;
}

export interface Product {
  title: string;
  subcategory: string;
}

export interface Variant {
  total_cost: number;
  setting: string;
  diamond_count: number;
  model: string;
  dimensions: string;
  weight_grams: number;
  dia_quality: string;
  metal_type: string;
  metal_color: string;
  carat_weight: string;
}

interface ShareClientViewProps {
  media: MediaItem[];
  orderId: string | number;
  product: Product;
  variant: Variant;
}

/* -------------------------------------------------------------------------- */
/*                                MAIN COMPONENT                              */
/* -------------------------------------------------------------------------- */

export default function ShareClientView({
  media,
  orderId,
  product,
  variant,
}: ShareClientViewProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  const activeMedia = media[activeIndex];

  /* ---------- Lightbox Keyboard Controls ---------- */
  useEffect(() => {
    if (!lightboxOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft")
        setActiveIndex((i) => (i === 0 ? media.length - 1 : i - 1));
      if (e.key === "ArrowRight")
        setActiveIndex((i) => (i === media.length - 1 ? 0 : i + 1));
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, media.length]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* ========================= HEADER ========================= */}
      <header className="max-w-[1200px] flex items-center justify-between p-4 border bg-white rounded-lg">
        <div className="mx-auto w-full flex items-center justify-between">
          <Image src="/ud-logo.svg" alt="Logo" width={60} height={40} />
          <span className="text-sm sm:text-base text-black">Order #{orderId}</span>
        </div>
      </header>

      {/* ========================= CONTENT ========================= */}
      <main className="max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">

        {/* LEFT SIDE – MEDIA */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border rounded-lg p-2">

            {/* Main Media */}
            <div
              className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-100 cursor-zoom-in"
              onClick={() => activeMedia && setLightboxOpen(true)}
            >
              <MediaRenderer media={activeMedia} />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto mt-2">
              {media.map((m, i) => (
                <Thumbnail
                  key={i}
                  media={m}
                  isActive={activeIndex === i}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – PRODUCT INFO */}
        <div className="space-y-6">
          <section className="bg-white border rounded-lg p-6">
            <h1 className="text-xl font-semibold text-gray-900">{product.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{product.subcategory}</p>
            <p className="text-2xl font-semibold text-[#883734] mt-4">
              ${variant.total_cost}
            </p>
          </section>

          {/* PRODUCT DETAILS */}
          <section className="bg-white border rounded-lg p-6">
            <h3 className="text-base font-medium mb-4">Product Details</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <Detail label="Category" value={product.subcategory} />
              <Detail label="Setting Style" value={variant.setting} />
              <Detail label="Diamond Count" value={`${variant.diamond_count} stones`} />
              <Detail label="Diameter / Band Width" value={variant.model} />
              <Detail label="Dimensions" value={variant.dimensions} />
              <Detail label="Item Weight" value={`${variant.weight_grams} grams`} />
              <Detail label="Diamond Quality" value={variant.dia_quality} />
              <Detail label="Metal Type" value={variant.metal_type} />
              <Detail label="Metal Color" value={variant.metal_color} />
              <Detail label="Carat Weight" value={variant.carat_weight} />
            </div>
          </section>
        </div>
      </main>

      {/* ========================= LIGHTBOX ========================= */}
      {lightboxOpen && (
        <Lightbox
          mediaArray={media}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           MEDIA RENDERING HELPERS                          */
/* -------------------------------------------------------------------------- */

function isIframeVideo(src: string): boolean {
  return src.includes("drive.google.com") || src.includes("preview");
}

function MediaRenderer({ media }: { media?: MediaItem }) {
  if (!media)
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-300">
        No media
      </div>
    );

  if (media.type === "image") {
    return (
      <Image src={media.src} alt="Media" fill className="object-cover" />
    );
  }

  if (isIframeVideo(media.src)) {
    return (
      <iframe
        src={media.src}
        allow="autoplay; fullscreen"
        className="w-full h-full"
      />
    );
  }

  return (
    <video
      src={media.src}
      autoPlay
      loop
      muted
      playsInline
      controls
      className="w-full h-full object-cover"
    />
  );
}

/* ----------------------- Thumbnail Component ----------------------- */

interface ThumbnailProps {
  media: MediaItem;
  isActive: boolean;
  onClick: () => void;
}

function Thumbnail({ media, isActive, onClick }: ThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-24 h-24 rounded-md overflow-hidden border flex-shrink-0",
        isActive ? "border-black" : "border-gray-300"
      )}
    >
      {media.type === "image" && (
        <Image src={media.src} alt="thumbnail" fill className="object-cover" />
      )}

      {media.type === "video" && (
        <>
          {isIframeVideo(media.src) ? (
            <iframe src={media.src} className="object-cover w-full h-full" />
          ) : (
            <video
              src={media.src}
              muted
              autoPlay
              loop
              playsInline
              className="object-cover w-full h-full"
            />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
        </>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  LIGHTBOX                                  */
/* -------------------------------------------------------------------------- */

interface LightboxProps {
  mediaArray: MediaItem[];
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}

function Lightbox({
  mediaArray,
  activeIndex,
  setActiveIndex,
  onClose,
}: LightboxProps) {
  const media = mediaArray[activeIndex];

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white" onClick={onClose}>
        <X className="w-8 h-8" />
      </button>

      {/* Left arrow */}
      {mediaArray.length > 1 && (
        <button
          className="absolute left-4 text-white text-3xl"
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex((i) => (i === 0 ? mediaArray.length - 1 : i - 1));
          }}
        >
          ‹
        </button>
      )}

      {/* Right arrow */}
      {mediaArray.length > 1 && (
        <button
          className="absolute right-4 text-white text-3xl"
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex((i) => (i === mediaArray.length - 1 ? 0 : i + 1));
          }}
        >
          ›
        </button>
      )}

      <div className="max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
        {media.type === "image" ? (
          <Image
            src={media.src}
            alt="lightbox"
            width={1600}
            height={1600}
            className="w-full max-h-[90vh] object-contain rounded-lg"
          />
        ) : isIframeVideo(media.src) ? (
          <iframe
            src={media.src}
            allow="autoplay; fullscreen"
            className="w-full aspect-video rounded-lg"
          />
        ) : (
          <video
            src={media.src}
            autoPlay
            loop
            muted
            controls
            playsInline
            className="w-full max-h-[90vh] object-contain rounded-lg"
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   DETAILS                                  */
/* -------------------------------------------------------------------------- */

interface DetailProps {
  label: string;
  value?: string | number | null;
}

function Detail({ label, value }: DetailProps) {
  if (!value) return null;

  return (
    <>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </>
  );
}
