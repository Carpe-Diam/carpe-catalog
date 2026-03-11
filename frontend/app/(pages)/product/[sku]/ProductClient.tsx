"use client";

import Image from "next/image";
import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";
// Zoho media URLs are used directly (absolute URLs from Zoho WorkDrive)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderRequestDrawer } from "@/components/custom/OrderDrawer";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface Media {
  id: string | number;
  file_type: string;
  preview_url: string;
  download_url?: string | null;
}

export interface BillOfMaterialsRow {
  group?: string | null;
  sub_group?: string | null;
  sub_sub_group?: string | null;
  shape?: string | null;
  size?: string | null;
  weight?: number | null;
  pieces?: number | null;
  total_weight?: number | null;
  rate_per_unit?: number | null;
  price?: number | null;
  gross_weight?: number | null;
  a_sell_rate_per_unit?: number | null;
  b_sell_rate_per_unit?: number | null;
  c_sell_rate_per_unit?: number | null;
  d_sell_rate_per_unit?: number | null;
}

export interface OtherOperationsRow {
  operations?: string | null;
  sub_operations?: string | null;
  weight?: number | null;
  rate_per_unit?: number | null;
  price?: number | null;
  a_sell_rate_per_unit?: number | null;
  b_sell_rate_per_unit?: number | null;
  c_sell_rate_per_unit?: number | null;
  d_sell_rate_per_unit?: number | null;
  sell_price_a?: number | null;
  sell_price_b?: number | null;
  sell_price_c?: number | null;
  sell_price_d?: number | null;
}

export interface Variant {
  variant_sku: string;
  sku_segments: string[];
  carat_weight?: string | number | null;
  dia_quality?: string | null;
  metal_type?: string | null;
  metal_color?: string | null;

  /* details */
  setting?: string | null;
  diamond_count?: number | null;
  model?: string | null;
  dimensions?: string | null;
  weight_grams?: number | null;
  stone_type?: string | null;
  sub_group?: string | null;
  parsed_size?: string | null;
  sub_sub_group?: string | null;
  product_url?: string | null;
  product_variant_name?: string | null;
  cad_person_name?: string | null;
  ring_size?: string | null;
  style_size_inch?: string | null;
  website_name?: string | null;
  website_description?: string | null;
  raw_material_details?: string | null;
  work_drive_download_link?: string | null;
  portal_user?: string | null;

  /* pricing + media */
  total_cost: number;
  media: Media[];
  sell_price_a?: number | null;
  sell_price_b?: number | null;
  sell_price_c?: number | null;
  sell_price_d?: number | null;
  total_sell_price_a?: number | null;
  total_sell_price_b?: number | null;
  total_sell_price_c?: number | null;
  total_sell_price_d?: number | null;
  cost_price?: number | null;
  operations_total_price?: number | null;

  /* weights */
  net_weight?: number | null;
  diamond_weight?: number | null;
  polki_weight?: number | null;
  stone_weight?: number | null;

  /* subforms */
  bill_of_materials?: BillOfMaterialsRow[];
  other_operations?: OtherOperationsRow[];
}

/* -------------------------------------------------------------------------- */
/*                          SKU SEGMENT DECODE MAP                             */
/* -------------------------------------------------------------------------- */

// Maps raw SKU codes to human-readable labels
const SKU_DECODE: Record<string, string> = {
  // Materials
  G: 'Gold', S: 'Silver', P: 'Platinum', D: 'Diamond',
  BD: 'Beads', PE: 'Pearl', PO: 'Polki', GE: 'Gemstone',
  // Colors
  W: 'White', Y: 'Yellow', R: 'Rose',
  // Sub Groups
  GF: 'GlassFlied', H: 'Heated', L: 'LabGrown',
  NN: 'Nano', N: 'Natural', NA: 'Not Applicable',
  '95': 'PT950',
  // Stone types (same codes, already covered above)
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
  const mediaArray: Media[] = selectedVariant?.media ?? [];
  const currentMedia = mediaArray[currentIndex] ?? null;

  const getMediaUrl = (m: Media | null) => {
    if (!m) return null;
    return m.file_type.includes("video")
      ? m.preview_url
      : (m.download_url ?? m.preview_url);
  };

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
  const maxSegments = Math.max(...product.variants.map(v => v.sku_segments.length), 0);

  // For each segment position, get unique values across all variants
  const segmentOptions: string[][] = [];
  for (let i = 0; i < maxSegments; i++) {
    const uniqueVals = [...new Set(
      product.variants.map(v => v.sku_segments[i]).filter(Boolean)
    )];
    segmentOptions.push(uniqueVals);
  }

  // Segment position labels (intelligently calculates based on string structure)
  const getSegmentLabel = (idx: number) => {
    if (idx === 0) return 'Metal Type';
    if (idx === 1) return 'Metal Carat';
    if (idx === 2) return 'Metal Color';

    // Check if the last segment is the ring size
    // Standard sku starts with 3 metal segments. Stones take 3 segments each.
    // If the remaining modulo is 1, the last item is Ring Size.
    const hasRingSizeAtEnd = (maxSegments - 3) % 3 === 1;
    if (hasRingSizeAtEnd && idx === maxSegments - 1) return 'Ring Size';

    // Stone components (sets of 3)
    const stoneIndex = Math.floor((idx - 3) / 3) + 1;
    const mod = (idx - 3) % 3;

    if (mod === 0) return `Stone ${stoneIndex} Type`;
    if (mod === 1) return `Stone ${stoneIndex} Sub Group`;
    if (mod === 2) return `Stone ${stoneIndex} Size`;

    return `Segment ${idx + 1}`;
  };

  /* ---------------------- Segment Change → Update Variant ---------------------- */
  const handleSegmentChange = (segmentIndex: number, value: string) => {
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
  };

  /* ------------------------------ RENDER ------------------------------ */

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">

      <header className="max-w-7xl flex items-center justify-between p-4 border bg-white rounded-lg">
        <div className=" mx-auto w-full flex items-center justify-between">
          <Image src="/ud-logo.svg" alt="Logo" width={60} height={40} />
          <span className="text-sm sm:text-base text-black">SKU #{selectedVariant?.variant_sku}</span>
        </div>
      </header>
      <div className="bg-neutral-50 min-h-screen  flex justify-center">

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">

          <MediaSection
            mediaArray={mediaArray}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            displayMedia={displayMedia}
            isVideo={isVideo}
            onOpenLightbox={() => setLightboxOpen(true)}
            currentMedia={currentMedia}
            productTitle={product.title}
          />

          <div className="space-y-6">
            <HeaderSection product={product} selectedVariant={selectedVariant} />

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

            <DetailsSection product={product} selectedVariant={selectedVariant} />
          </div>
        </div>

        {lightboxOpen && (
          <Lightbox
            mediaArray={mediaArray}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            onClose={() => setLightboxOpen(false)}
            isVideo={isVideo}
            displayMedia={displayMedia}
            currentMedia={currentMedia}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SUB COMPONENTS                              */
/* -------------------------------------------------------------------------- */

interface MediaSectionProps {
  mediaArray: Media[];
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  displayMedia: string | null;
  isVideo: boolean;
  onOpenLightbox: () => void;
  currentMedia: Media | null;
  productTitle: string;
}

function MediaSection({ mediaArray, currentIndex, setCurrentIndex, displayMedia, isVideo, onOpenLightbox, currentMedia, productTitle }: MediaSectionProps) {
  return (
    <div className="flex flex-col gap-4 sticky top-6 self-start">
      <div className="bg-white border rounded-lg p-2">
        <div
          className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-100 cursor-zoom-in"
          onClick={onOpenLightbox}
        >
          {!displayMedia ? (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              No media available
            </div>
          ) : isVideo ? (
            <iframe src={currentMedia?.preview_url} allow="autoplay; fullscreen" className="w-full h-full rounded-md" />
          ) : (
            <Image src={displayMedia} alt={productTitle} fill className="object-cover" />
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto mt-2">
          {mediaArray.map((m, i) => {
            const url = m.file_type.includes("video")
              ? m.preview_url
              : (m.download_url ?? m.preview_url);

            const isVid = m.file_type.includes("video");

            return (
              <button
                key={m.id}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "relative w-24 h-24 rounded-md overflow-hidden border flex-shrink-0",
                  currentIndex === i ? "border-black" : "border-gray-300"
                )}
              >
                {isVid ? (
                  <>
                    <iframe src={m.preview_url} className="object-cover w-full h-full pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <Image src={url} alt="thumb" fill className="object-cover" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface HeaderSectionProps {
  product: Product;
  selectedVariant: Variant | null;
}

function HeaderSection({ product, selectedVariant }: HeaderSectionProps) {
  return (
    <section className="bg-white border rounded-lg p-6">
      <h1 className="text-xl font-semibold text-gray-900">{product.title}</h1>
      <p className="text-gray-500 text-sm mt-1">{product.category}</p>
      <p className="text text-md mt-2">{product.others}</p>
      <p className="text-2xl font-semibold text-[#883734] mt-4">
        ${selectedVariant?.total_cost ?? product.base_price}
      </p>
    </section>
  );
}

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

function ConfigurationSection({
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
    <section className="bg-white border rounded-lg p-6">
      <h2 className="text-base font-medium mb-4">Product Configuration</h2>

      <div className="space-y-4">
        {segmentOptions.map((options, idx) => {
          // Only show selectors for positions that actually have multiple options
          // or a single meaningful value
          if (!options.length) return null;
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
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Quantity</p>
          <div className="flex items-center gap-2">
            <Button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-16 text-center"
            />
            <Button onClick={() => setQuantity(quantity + 1)}>+</Button>
          </div>
        </div>

        <div className="border-t pt-4 text-sm text-black space-y-4">
          <p>Prices quoted are for stock variants.</p>
          <p>
            <strong>Lead Time:</strong> In stock ships in 1 day. Made-to-order ships in ~3 weeks.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          {selectedVariant && (
            <OrderRequestDrawer variant={selectedVariant} product={product} />
          )}

          <Button
            variant="outline"
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
        </div>
      </div>
    </section>
  );
}

interface DetailsSectionProps {
  product: Product;
  selectedVariant: Variant | null;
}

function DetailsSection({ product, selectedVariant }: DetailsSectionProps) {
  const v = selectedVariant;

  return (
    <section className="bg-white border rounded-lg p-6">
      <h3 className="text-base font-medium mb-4">Product Details</h3>
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <Detail label="Type of Jewelry" value={product.subcategory} />
        <Detail label="Setting Style" value={v?.setting} />
        <Detail label="Diamond Count" value={v?.diamond_count ? `${v.diamond_count} stones` : null} />
        <Detail label="Diameter / Band Width" value={v?.model} />
        <Detail label="Dimensions" value={v?.dimensions} />
        <Detail label="Item Weight" value={v?.weight_grams ? `${v.weight_grams} grams` : null} />
      </div>
    </section>
  );
}

interface LightboxProps {
  mediaArray: Media[];
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  onClose: () => void;
  isVideo: boolean;
  displayMedia: string | null;
  currentMedia: Media | null;
}

function Lightbox({
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
}

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

function ConfigGroup({ title, options, selected, onSelect, decode: shouldDecode }: ConfigGroupProps) {
  if (!options?.length) return null;

  return (
    <div>
      <p className="text-sm text-gray-700 mb-1">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <Button
            key={option}
            variant="ghost"
            onClick={() => onSelect(option)}
            className={cn(
              "rounded-md text-xs px-3 py-1.5 border",
              selected === option ? "border-black" : "border-gray-400"
            )}
          >
            {shouldDecode ? decodeSegment(option) : option}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface DetailProps {
  label: string;
  value: string | number | null | undefined;
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
