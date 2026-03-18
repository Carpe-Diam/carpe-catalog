"use client";

import Image from "next/image";
import { useEffect, useState, useRef, Dispatch, SetStateAction, useMemo, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
// Zoho media URLs are used directly (absolute URLs from Zoho WorkDrive)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderRequestDrawer } from "@/components/custom/OrderDrawer";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface Media {
  id: string | number;
  file_name?: string | null;
  file_type: string;
  preview_url: string;
  download_url?: string | null;
}

export interface Variant {
  variant_sku: string;
  sku_segments: string[];
  carat_weight?: string | number | null;
  dia_quality?: string | null;
  metal_type?: string | null;
  metal_color?: string | null;
  setting?: string | null;
  diamond_count?: number | null;
  model?: string | null;
  dimensions?: string | null;
  weight_grams?: number | null;
  stone_type?: string | null;
  sub_group?: string | null;
  parsed_size?: string | null;
  sub_sub_group?: string | null;
  total_cost: number;
  media: Media[];
  diamond_weight?: number | null;
}

/* -------------------------------------------------------------------------- */
/*                          SKU SEGMENT DECODE MAP                             */
/* -------------------------------------------------------------------------- */

// Maps raw SKU codes to human-readable labels
const SKU_DECODE: Record<string, string> = {
  // Materials
  G: 'Gold', S: 'Silver', P: 'Platinum', D: 'Diamond',
  BD: 'Beads', PE: 'Pearl', PO: 'Polki', GE: 'Gemstone',
  // Specific Gemstones
  RB: 'Ruby', SA: 'Sapphire', EM: 'Emerald', AM: 'Amethyst',
  AQ: 'Aquamarine', CI: 'Citrine', GA: 'Garnet', OP: 'Opal',
  TO: 'Topaz', TU: 'Tourmaline', TZ: 'Tanzanite', MO: 'Moissanite',
  CZ: 'Cubic Zirconia', ON: 'Onyx', TS: 'Tsavorite', PD: 'Peridot', SP: 'Spinel',
  // Colors
  W: 'White', Y: 'Yellow', R: 'Rose',
  // Sub Groups
  GF: 'GlassFilled', H: 'Heated', L: 'LabGrown',
  NN: 'Nano', N: 'Natural', NA: 'Not Applicable',
  '95': 'PT950',
};

/** Decode a raw SKU code to its label, or return the raw code if unknown */
function decodeSegment(raw: string): string {
  return SKU_DECODE[raw] || raw;
}

export interface Product {
  title: string;
  category?: string | null;
  others?: string | null;
  parent_sku: string;

  base_price?: number | null;

  subcategory?: string | null;
  record_image?: string | null;
  variants: Variant[];
}

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

interface ProductClientProps {
  product: Product;
}

export default function ProductClient({ product }: ProductClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlVariant = searchParams.get("variant");
  const initialVariant = product.variants?.[0] ?? null;

  /* --------------------------- Local State --------------------------- */
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(initialVariant);
  const [quantity, setQuantity] = useState<number>(1);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Config = raw SKU segments array (e.g. ["G", "14", "Y", "D", "L", "2", "NA"])
  const [segmentConfig, setSegmentConfig] = useState<string[]>(
    initialVariant?.sku_segments ?? []
  );

  /* ---------------------- Variant Selection from URL ---------------------- */
  useEffect(() => {
    if (!urlVariant) return;

    const match = product.variants.find(v => v.variant_sku === urlVariant);
    if (match) {
      setSelectedVariant(match);
      setSegmentConfig([...match.sku_segments]);
    }
  }, [urlVariant, product.variants]);

  /* -------------------------- Media Logic -------------------------- */
  const mediaArray = useMemo(() => {
    const rawMediaArray: Media[] = selectedVariant?.media ?? [];
    const catalogMedia = rawMediaArray.filter(m => m.file_name?.toLowerCase().includes('catalog-image'));

    // If variant has catalog images, use those
    if (catalogMedia.length > 0) return catalogMedia;

    // Fallback: use the product record image
    if (product.record_image) {
      return [{
        id: `product-record-${product.parent_sku}`,
        file_name: 'product-record-image',
        file_type: 'image/jpeg',
        preview_url: product.record_image,
        download_url: product.record_image,
      }] as Media[];
    }

    return [];
  }, [selectedVariant, product.record_image, product.parent_sku]);

  const currentMedia = mediaArray[currentIndex] ?? null;

  const getMediaUrl = useCallback((m: Media | null) => {
    if (!m) return null;
    return m.file_type.includes("video")
      ? m.preview_url
      : (m.download_url ?? m.preview_url);
  }, []);

  const displayMedia = getMediaUrl(currentMedia);
  const isVideo = currentMedia?.file_type?.includes("video") ?? false;

  /* ---------------- Reset config + media when variant changes ---------------- */
  useEffect(() => {
    if (!selectedVariant) return;
    setSegmentConfig([...selectedVariant.sku_segments]);
    setCurrentIndex(0);
  }, [selectedVariant]);

  /* --------------------- Lightbox Keyboard Controls --------------------- */
  useEffect(() => {
    if (!lightboxOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft")
        setCurrentIndex(i => (i === 0 ? mediaArray.length - 1 : i - 1));
      if (e.key === "ArrowRight")
        setCurrentIndex(i => (i === mediaArray.length - 1 ? 0 : i + 1));
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, mediaArray.length]);

  /* ------------ Segment-based options + variant matching ------------ */

  // Find the max number of segments across all variants
  const maxSegments = useMemo(() => 
    Math.max(...product.variants.map(v => v.sku_segments.length), 0),
  [product.variants]);

  // For each segment position, get unique values across all variants
  const segmentOptions = useMemo(() => {
    const options: string[][] = [];
    for (let i = 0; i < maxSegments; i++) {
        const uniqueVals = [...new Set(
        product.variants.map(v => v.sku_segments[i]).filter(Boolean)
        )];
        options.push(uniqueVals);
    }
    return options;
  }, [maxSegments, product.variants]);

  // Segment position labels (intelligently calculates based on string structure)
  const getSegmentLabel = useCallback((idx: number) => {
    if (idx === 0) return 'Metal Type';
    if (idx === 1) return 'Metal Carat';
    if (idx === 2) return 'Metal Color';

    const hasRingSizeAtEnd = (maxSegments - 3) % 3 === 1;
    if (hasRingSizeAtEnd && idx === maxSegments - 1) return 'Ring Size';

    const stoneIndex = Math.floor((idx - 3) / 3) + 1;
    const mod = (idx - 3) % 3;

    // Dynamically label based on the selected stone type at this position
    const typeIdx = idx - mod;
    let baseTypeLabel = segmentConfig[typeIdx] ? decodeSegment(segmentConfig[typeIdx]) : `Stone ${stoneIndex}`;

    // If we have a specific gemstone abbreviation sitting in the size slot, 
    // we should label the segment block as Emerald instead of Gemstone
    if (baseTypeLabel === 'Gemstone' && segmentConfig[typeIdx + 2]) {
      const specific = decodeSegment(segmentConfig[typeIdx + 2]);
      if (specific !== segmentConfig[typeIdx + 2]) {
        baseTypeLabel = specific;
      }
    }

    if (mod === 0) return `${baseTypeLabel} Type`;
    if (mod === 1) return `${baseTypeLabel} Origin`; // e.g., LabGrown / Natural
    if (mod === 2) return `${baseTypeLabel} Size`;

    return `Segment ${idx + 1}`;
  }, [maxSegments, segmentConfig]);

  /* ---------------------- Segment Change → Update Variant ---------------------- */
  const handleSegmentChange = useCallback((segmentIndex: number, value: string) => {
    const newSegments = [...segmentConfig];
    // Ensure the array is long enough
    while (newSegments.length <= segmentIndex) newSegments.push('');
    newSegments[segmentIndex] = value;
    setSegmentConfig(newSegments);

    // 1. Try exact match: variant whose sku_segments match newSegments exactly
    let match = product.variants.find(v =>
      v.sku_segments.length === newSegments.length &&
      v.sku_segments.every((seg, i) => seg === newSegments[i])
    );

    // 2. Fallback: variant that matches the changed segment + most others
    if (!match) {
      let bestScore = -1;
      for (const v of product.variants) {
        // The changed segment MUST match
        if (v.sku_segments[segmentIndex] !== value) continue;

        let score = 0;
        for (let i = 0; i < newSegments.length; i++) {
          if (i === segmentIndex) continue;
          if (v.sku_segments[i] === newSegments[i]) score++;
        }

        if (score > bestScore) {
          bestScore = score;
          match = v;
        }
      }
    }

    if (match) {
      setSelectedVariant(match);
      setSegmentConfig([...match.sku_segments]);
      router.replace(
        `/product/${product.parent_sku}?variant=${match.variant_sku}`,
        { scroll: false }
      );
    }
  }, [segmentConfig, product.variants, product.parent_sku, router]);

  /* ------------------------------ RENDER ------------------------------ */

  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleOpenLightbox = useCallback(() => setLightboxOpen(true), []);
  const handleCloseLightbox = useCallback(() => setLightboxOpen(false), []);

  useGSAP(() => {
    // Fade in text content on the right
    gsap.fromTo('.stagger-reveal',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out", delay: 0.2 }
    );
  }, { scope: containerRef });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900" ref={containerRef}>
      <main className="flex-grow pb-32">
        <section className="container mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-8 lg:gap-16 mb-16 pt-12">
          {/* Left: Image Gallery */}
          <div className="w-full lg:w-[60%] lg:sticky lg:top-32 self-start">
            <MediaSection
              mediaArray={mediaArray}
              onOpenLightbox={handleOpenLightbox}
              setCurrentIndex={setCurrentIndex}
              productTitle={product.title}
            />
          </div>

          {/* Right: Product Info */}
          <div className="w-full lg:w-1/3 flex flex-col">
            <div>
              <div className="stagger-reveal">
                <HeaderSection product={product} selectedVariant={selectedVariant} />
              </div>

              <div className="stagger-reveal">
                <ConfigurationSection
                  segmentConfig={segmentConfig}
                  segmentOptions={segmentOptions}
                  getSegmentLabel={getSegmentLabel}
                  handleSegmentChange={handleSegmentChange}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  product={product}
                  selectedVariant={selectedVariant}
                  router={router}
                />
              </div>

              <div className="stagger-reveal mt-2">
                <DetailsSection product={product} selectedVariant={selectedVariant} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {lightboxOpen && (
        <Lightbox
          mediaArray={mediaArray}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          onClose={handleCloseLightbox}
          isVideo={isVideo}
          displayMedia={displayMedia}
          currentMedia={currentMedia}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SUB COMPONENTS                              */
/* -------------------------------------------------------------------------- */

interface MediaSectionProps {
  mediaArray: Media[];
  onOpenLightbox: () => void;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  productTitle: string;
}

const MediaSection = memo(function MediaSection({ mediaArray, onOpenLightbox, setCurrentIndex, productTitle }: MediaSectionProps) {
  if (!mediaArray.length) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-gray-400 font-serif italic border border-gray-200 bg-gray-50">
        No media available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {mediaArray.map((m, i) => {
        const url = m.file_type.includes("video") ? m.preview_url : (m.download_url ?? m.preview_url);
        const isVid = m.file_type.includes("video");

        return (
          <div
            key={m.id}
            className="w-full relative aspect-[3/4] bg-gray-50 cursor-zoom-in group overflow-hidden"
            onClick={() => {
              setCurrentIndex(i);
              onOpenLightbox();
            }}
          >
            {isVid ? (
              <>
                <iframe src={m.preview_url} className="w-full h-full object-cover pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition">
                  <Play className="w-12 h-12 text-white/80" />
                </div>
              </>
            ) : (
              <Image src={url} alt={`${productTitle} Image ${i + 1}`} fill className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500 ease-out" unoptimized />
            )}
          </div>
        );
      })}
    </div>
  );
});

function extractStones(segments: string[]) {
  const stones = [];
  let i = 3;
  while (i + 2 < segments.length) {
    if (segments[i] && segments[i] !== 'NA') {
      let decodedType = decodeSegment(segments[i]);
      let size = segments[i + 2] || '';

      // If the stone type is generic "Gemstone" but the size field contains a specific
      // gemstone abbreviation (like EM -> Emerald), swap it out so it displays properly.
      const decodedSize = decodeSegment(size);
      if (decodedType === 'Gemstone' && decodedSize !== size) {
        decodedType = decodedSize;
        size = ''; // It wasn't a size, it was the specific stone name
      }

      stones.push({
        type: decodedType,
        subGroup: segments[i + 1] ? decodeSegment(segments[i + 1]) : '',
        size: size
      });
    }
    i += 3;
  }
  return stones;
}

interface HeaderSectionProps {
  product: Product;
  selectedVariant: Variant | null;
}

const HeaderSection = memo(function HeaderSection({ product, selectedVariant }: HeaderSectionProps) {
  const v = selectedVariant;
  const metalColor = v?.metal_color?.toLowerCase() || "";
  const metalType = v?.metal_type?.toLowerCase() || "";

  const stones = extractStones(v?.sku_segments || []);

  const stoneDescParts = stones.map(s => {
    let desc = s.type.toLowerCase();
    if (s.subGroup === 'LabGrown') desc = `lab-grown ${desc}`;
    else if (s.subGroup === 'Natural') desc = `natural ${desc}`;

    return desc.endsWith('y') ? `${desc.slice(0, -1)}ies` : `${desc}s`;
  });

  let stoneDesc = "";
  if (stoneDescParts.length === 1) stoneDesc = stoneDescParts[0];
  else if (stoneDescParts.length === 2) stoneDesc = `${stoneDescParts[0]} and ${stoneDescParts[1]}`;
  else if (stoneDescParts.length > 2) stoneDesc = `${stoneDescParts.slice(0, -1).join(', ')} and ${stoneDescParts[stoneDescParts.length - 1]}`;

  const categoryLabel = product.category?.split('-')[0]?.trim()?.toLowerCase() || 'ring';

  const sentence = metalColor && metalType
    ? `${v?.carat_weight} kt ${metalColor} ${metalType} ${categoryLabel}${stoneDesc ? ` set with ${stoneDesc}` : ''}.`
    : "";

  return (
    <section className="mb-10">
      <h1 className="text-2xl md:text-4xl font-serif italic mb-4 leading-tight">
        {product.title}
      </h1>
      <p className="text-lg tracking-widest font-medium text-[#C5A059] mb-8">
        {v?.total_cost ? `$${v.total_cost.toLocaleString()}` : "Price upon request"}
      </p>

      <div className="mb-4">
        <span className="inline-block border border-gray-300 px-2 py-1 text-[10px] md:text-xs uppercase tracking-wider text-gray-600">
          {product.category?.split('-')[0]?.trim() || "FINE JEWELRY"}
        </span>
      </div>

      {sentence && (
        <p className="text-sm text-gray-700 mb-6">
          {sentence.charAt(0).toUpperCase() + sentence.slice(1)}
        </p>
      )}

      {product.others && <p className="text-gray-600 text-sm mb-6">{product.others}</p>}
    </section>
  );
});

interface ConfigSectionProps {
  segmentConfig: string[];
  segmentOptions: string[][];
  getSegmentLabel: (idx: number) => string;
  handleSegmentChange: (segmentIndex: number, value: string) => void;
  quantity: number;
  setQuantity: (n: number) => void;
  product: Product;
  selectedVariant: Variant | null;
  router: ReturnType<typeof useRouter>;
}

const ConfigurationSection = memo(function ConfigurationSection({
  segmentConfig,
  segmentOptions,
  getSegmentLabel,
  handleSegmentChange,
  quantity,
  setQuantity,
  product,
  selectedVariant,
  router,
}: ConfigSectionProps) {
  return (
    <section>
      <div className="mb-6 space-y-6">
        {segmentOptions.map((options, idx) => {
          if (options.length <= 1) return null;
          return (
            <ConfigGroup
              key={idx}
              title={getSegmentLabel(idx)}
              options={options}
              selected={segmentConfig[idx] ?? ''}
              onSelect={v => handleSegmentChange(idx, v)}
              decode
            />
          );
        })}

        {/* Quantity */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium uppercase tracking-wider">Quantity</p>
          </div>
          <div className="flex border border-gray-300 w-fit">
            <button className="px-4 py-2 hover:bg-gray-50 text-gray-500 transition outline-none" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span className="w-10 text-center text-sm flex items-center justify-center font-medium">{quantity}</span>
            <button className="px-4 py-2 hover:bg-gray-50 text-gray-500 transition outline-none" onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>
        </div>




        {/* <div className="mb-6">
          <Button
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50 uppercase tracking-widest py-4 h-auto rounded-none text-xs font-semibold"
            onClick={() => {
              const orderId = Math.floor(100000 + Math.random() * 900000);
              if (selectedVariant)
                router.push(
                  `/share/${product.parent_sku}?variant=${selectedVariant.variant_sku}&order=${orderId}`
                );
            }}
          >
            Share to Customer
          </Button>
        </div> */}

        <div className="mb-6">
          <Button
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50 uppercase tracking-widest py-4 h-auto rounded-none text-xs font-semibold"
            onClick={() => {
              const orderId = Math.floor(100000 + Math.random() * 900000);
              
              // 1. Build the base URL with the parent SKU and order ID
              let shareUrl = `/share/${product.parent_sku}?order=${orderId}`;
              
              // 2. Append the variant SKU only if a variant is currently selected
              if (selectedVariant) {
                shareUrl += `&variant=${selectedVariant.variant_sku}`;
              }
              
              // 3. Push the finalized URL
              router.push(shareUrl);
            }}
          >
            Share to Customer
          </Button>
        </div>

        {/* Benefits list */}
        {/* <div className="text-xs text-center text-gray-500 mb-6 border-b border-gray-200 pb-6">
          3 payments of ${(selectedVariant?.total_cost || 0) / 3 || 0} interest-free (0% APR) with <span className="font-bold">Klarna</span>. <a className="underline cursor-pointer">Learn more</a>
        </div> */}

        <ul className="text-sm space-y-3 mb-6 text-gray-700">
          {/* <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="underline cursor-pointer">30 days for exchanges and returns</span>
          </li> */}
          {/* <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="underline cursor-pointer">Free shipping worldwide</span>
          </li> */}
          {/* <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="underline cursor-pointer">3 years warranty</span>
          </li> */}
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>Lifetime personal assistance</span>
          </li>
        </ul>
      </div>
    </section>
  );
});

interface DetailsSectionProps {
  product: Product;
  selectedVariant: Variant | null;
}

const DetailsSection = memo(function DetailsSection({ product, selectedVariant }: DetailsSectionProps) {
  const v = selectedVariant;

  const getSubgroupDisplay = (sg?: string | null) => {
    if (!sg) return "";
    if (sg.toLowerCase() === 'labgrown') return "lab-grown";
    return sg.toLowerCase();
  };

  const getMetalDisplay = () => {
    if (!v?.metal_type || !v?.carat_weight || !v?.metal_color) return null;
    return `${v.carat_weight}K ${v.metal_color} ${v.metal_type} (100% recycled solid gold)`;
  };

  const stones = extractStones(v?.sku_segments || []);

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase text-gray-400 mb-2">Ref: {v?.variant_sku}</p>
        <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
          {getMetalDisplay() && <li>Metal: <span className="underline">{getMetalDisplay()}</span></li>}
          {stones.map((stone, idx) => {
            const isDiamond = stone.type === 'Diamond';
            const isSpecificGemstone = !['Diamond', 'Pearl', 'Gemstone', 'Beads'].includes(stone.type);
            const prefix = isDiamond || stone.type === 'Pearl' ? stone.type : (isSpecificGemstone ? 'Gemstone' : stone.type);

            return (
              <li key={`stone-${idx}`}>
                {prefix}: {getSubgroupDisplay(stone.subGroup)} <span className="capitalize">{stone.type}</span>
                {isDiamond && v?.dia_quality ? ` (${v.dia_quality} quality)` : ''}
              </li>
            );
          })}
          {v?.diamond_weight ? <li>Total diamond weight: {v.diamond_weight} ctw</li> : null}
          {/* {v?.diamond_count ? <li>Number of diamonds: {v.diamond_count}</li> : null} */}
          {v?.dimensions && <li>Dimensions: {v.dimensions}</li>}
          {v?.model && <li>Band width / model: {v.model}</li>}
          {v?.weight_grams && <li>Weight: {v.weight_grams} g</li>}
          {product.subcategory && <li>Type: {product.subcategory}</li>}
          {v?.setting && <li>Setting: {v.setting}</li>}
        </ul>
      </div>

      {/* Accordions Mock */}
      <div className="border-t border-gray-200">
        <button className="w-full py-4 flex justify-between items-center text-sm uppercase tracking-wider font-medium border-b border-gray-200 hover:text-gray-600 transition">
          About Fine Jewelry
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
        <button className="w-full py-4 flex justify-between items-center text-sm uppercase tracking-wider font-medium border-b border-gray-200 hover:text-gray-600 transition">
          More Information
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
        <button className="w-full py-4 flex justify-between items-center text-sm uppercase tracking-wider font-medium border-b border-gray-200 hover:text-gray-600 transition">
          Delivery
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
        <button className="w-full py-4 flex justify-between items-center text-sm uppercase tracking-wider font-medium border-b border-gray-200 hover:text-gray-600 transition">
          Responsible Jewellery Council
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
        </button>
      </div>

      {/* Categories & Share */}
      <div className="mt-8 flex flex-wrap gap-4 text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">
        <span className="cursor-pointer hover:underline hover:text-black transition">All rings</span>
        <span className="cursor-pointer hover:underline hover:text-black transition">Diamond Rings</span>
        <span className="cursor-pointer hover:underline hover:text-black transition">Eternity Rings</span>
        <span className="cursor-pointer hover:underline hover:text-black transition">Solitary Rings</span>
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-wide font-medium cursor-pointer text-gray-600 hover:text-black transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
        Share Product
      </div>
    </section>
  );
});

interface LightboxProps {
  mediaArray: Media[];
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  onClose: () => void;
  isVideo: boolean;
  displayMedia: string | null;
  currentMedia: Media | null;
}

const Lightbox = memo(function Lightbox({
  mediaArray,
  currentIndex,
  setCurrentIndex,
  onClose,
  isVideo,
  displayMedia,
  currentMedia,
}: LightboxProps) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white">
        <X className="w-8 h-8" />
      </button>

      {mediaArray.length > 1 && (
        <>
          <button
            className="absolute left-4 text-white text-3xl p-2"
            onClick={e => {
              e.stopPropagation();
              setCurrentIndex(i => (i === 0 ? mediaArray.length - 1 : i - 1));
            }}
          >
            ‹
          </button>

          <button
            className="absolute right-4 text-white text-3xl p-2"
            onClick={e => {
              e.stopPropagation();
              setCurrentIndex(i => (i === mediaArray.length - 1 ? 0 : i + 1));
            }}
          >
            ›
          </button>
        </>
      )}

      <div className="max-w-5xl w-full px-4" onClick={e => e.stopPropagation()}>
        {isVideo ? (
          <iframe
            src={currentMedia?.preview_url}
            allow="autoplay; fullscreen"
            className="w-full aspect-video rounded-lg"
          />
        ) : (
          <Image
            src={displayMedia ?? ""}
            alt="Lightbox view"
            width={1200}
            height={800}
            className="w-full max-h-[90vh] object-contain rounded-lg"
          />
        )}
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

interface ConfigGroupProps {
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  decode?: boolean;
}

const ConfigGroup = memo(function ConfigGroup({ title, options, selected, onSelect, decode: shouldDecode }: ConfigGroupProps) {
  if (!options?.length) return null;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium uppercase tracking-wider">{title}</p>
        {title === 'Ring Size' && <span className="text-[10px] md:text-xs text-gray-500 cursor-pointer underline">Size guide</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={cn(
              "border px-4 py-2 text-xs md:text-sm text-center transition-all min-w-[3rem]",
              selected === option ? "border-black text-black" : "border-gray-300 text-gray-500 hover:border-black hover:text-black"
            )}
          >
            {shouldDecode ? decodeSegment(option) : option}
          </button>
        ))}
      </div>
    </div>
  );
});

interface DetailProps {
  label: string;
  value: string | number | null | undefined;
}

const Detail = memo(function Detail({ label, value }: DetailProps) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#EAEAEA] last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-[#111]">{value}</span>
    </div>
  );
});
