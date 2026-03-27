"use client";

import Image from "next/image";
import { useEffect, useState, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { Play, X, Download, Share2 } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface Media {
  id: string | number;
  file_name?: string | null;
  file_type: string;
  preview_url: string;
  download_url?: string | null;
}

interface Variant {
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
  net_weight?: number | null;
  polki_weight?: number | null;
  stone_type?: string | null;
  sub_group?: string | null;
  total_cost: number;
  media: Media[];
  diamond_weight?: number | null;
  website_description?: string | null;
}

interface Product {
  title: string;
  category?: string | null;
  others?: string | null;
  parent_sku: string;
  subcategory?: string | null;
  base_price?: number | null;
  record_image?: string | null;
  product_description?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                          SKU SEGMENT DECODE MAP                             */
/* -------------------------------------------------------------------------- */

const SKU_DECODE: Record<string, string> = {
  G: 'Gold', S: 'Silver', P: 'Platinum', D: 'Diamond',
  BD: 'Beads', PE: 'Pearl', PO: 'Polki', GE: 'Gemstone',
  RB: 'Ruby', SA: 'Sapphire', EM: 'Emerald', AM: 'Amethyst',
  AQ: 'Aquamarine', CI: 'Citrine', GA: 'Garnet', OP: 'Opal',
  TO: 'Topaz', TU: 'Tourmaline', TZ: 'Tanzanite', MO: 'Moissanite',
  CZ: 'Cubic Zirconia', ON: 'Onyx', TS: 'Tsavorite', PD: 'Peridot', SP: 'Spinel',
  W: 'White', Y: 'Yellow', R: 'Rose',
  GF: 'GlassFilled', H: 'Heated', L: 'LabGrown',
  NN: 'Nano', N: 'Natural', NA: 'Not Applicable',
  '95': 'PT950',
};

function decodeSegment(raw: string): string {
  return SKU_DECODE[raw] || raw;
}

function extractStones(segments: string[]) {
  const stones: { type: string; subGroup: string; size: string }[] = [];
  let i = 3;
  while (i + 2 < segments.length) {
    if (segments[i] && segments[i] !== 'NA') {
      let decodedType = decodeSegment(segments[i]);
      let size = segments[i + 2] || '';
      const decodedSize = decodeSegment(size);
      if (decodedType === 'Gemstone' && decodedSize !== size) {
        decodedType = decodedSize;
        size = '';
      }
      stones.push({
        type: decodedType,
        subGroup: segments[i + 1] ? decodeSegment(segments[i + 1]) : '',
        size,
      });
    }
    i += 3;
  }
  return stones;
}

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

interface ShareClientViewProps {
  product: Product;
  variant: Variant;
  orderId: string | number;
}

export default function ShareClientView({ product, variant, orderId }: ShareClientViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  // Generate QR code for the current page URL
  useEffect(() => {
    const url = window.location.href;
    setPageUrl(url);
    import("qrcode").then(({ default: QRCode }) => {
      QRCode.toDataURL(url, { width: 400, margin: 2 }).then(setQrDataUrl).catch(console.error);
    });
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      setDownloadError(null);

      const v = variant;
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentW = pageW - margin * 2;
      let y = margin;

      // --- Helper: load image as data URL ---
      const loadImageAsDataUrl = (url: string): Promise<string> =>
        new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
          };
          img.onerror = reject;
          img.src = url;
        });

      // --- Product Title ---
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.text(product.title || "Product", margin, y);
      y += 10;

      // --- Ref ---
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`REF: ${v?.variant_sku || ""}`, margin, y);
      y += 8;
      pdf.setTextColor(0, 0, 0);

      // --- Product Image (first catalog image) ---
      const imageMedia = mediaArray.filter(m => !m.file_type.includes("video"));
      if (imageMedia.length > 0) {
        const imgUrl = imageMedia[0].download_url || imageMedia[0].preview_url;
        try {
          const imgDataUrl = await loadImageAsDataUrl(imgUrl);
          const imgEl = new window.Image();
          imgEl.src = imgDataUrl;
          await new Promise(r => { imgEl.onload = r; });

          const aspectRatio = imgEl.naturalHeight / imgEl.naturalWidth;
          const imgW = Math.min(contentW, 120);
          const imgH = imgW * aspectRatio;

          // Center the image
          const imgX = margin + (contentW - imgW) / 2;
          pdf.addImage(imgDataUrl, "JPEG", imgX, y, imgW, imgH);
          y += imgH + 10;
        } catch {
          // If image fails to load, skip
          y += 5;
        }
      }

      // --- Description sentence ---
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
      if (metalColor && metalType) {
        const sentence = `${v?.carat_weight} kt ${metalColor} ${metalType} ${categoryLabel}${stoneDesc ? ` set with ${stoneDesc}` : ''}.`;
        pdf.setFontSize(11);
        pdf.setTextColor(80, 80, 80);
        const descLines = pdf.splitTextToSize(sentence.charAt(0).toUpperCase() + sentence.slice(1), contentW);
        pdf.text(descLines, margin, y);
        y += descLines.length * 5 + 8;
      }

      // --- Divider ---
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, y, pageW - margin, y);
      y += 8;

      // --- Product Details ---
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Product Details", margin, y);
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const getSubgroupDisplay = (sg?: string) => {
        if (!sg) return "";
        if (sg.toLowerCase() === 'labgrown') return "Lab-Grown";
        const lower = sg.toLowerCase();
        return lower.replace(/\b\w/g, c => c.toUpperCase());
      };

      const details: string[] = [];

      const pdfTitleCase = (str: string) => str.replace(/\b\w/g, c => c.toUpperCase());

      // Metal
      if (v?.metal_type && v?.carat_weight && v?.metal_color) {
        details.push(`Metal: ${v.carat_weight}K ${pdfTitleCase(v.metal_color)} ${pdfTitleCase(v.metal_type)} (100% Recycled Solid Gold)`);
      }

      // Gold weight (net weight)
      if (v?.net_weight) {
        details.push(`Gold Weight: ${v.net_weight} g`);
      }

      // Polki weight
      if (v?.polki_weight) {
        details.push(`Polki Weight: ${v.polki_weight} g`);
      }

      // Gemstone weight
      if (v?.weight_grams) {
        details.push(`Gemstone Weight: ${v.weight_grams} g`);
      }

      // Total diamond weight
      if (v?.diamond_weight) {
        details.push(`Total Diamond Weight: ${v.diamond_weight} ctw`);
      }

      // Diamond
      const diamondStone = stones.find(s => s.type === 'Diamond');
      if (diamondStone) {
        let diamondText = `Diamond: ${getSubgroupDisplay(diamondStone.subGroup)} Diamond`;
        if (v?.dia_quality) diamondText += ` (${pdfTitleCase(v.dia_quality)} Quality)`;
        details.push(diamondText);
      }

      // Gemstones (combined)
      const gemstones = stones.filter(s => s.type !== 'Diamond');
      if (gemstones.length > 0) {
        const gemDisplay = gemstones.map(s => {
          const origin = getSubgroupDisplay(s.subGroup);
          return origin ? `${pdfTitleCase(origin)} ${pdfTitleCase(s.type)}` : pdfTitleCase(s.type);
        }).join(', ');
        details.push(`Gemstones: ${gemDisplay}`);
      }

      // Render each detail as a bullet point
      details.forEach(detail => {
        const lines = pdf.splitTextToSize(`• ${detail}`, contentW - 5);
        pdf.text(lines, margin + 2, y);
        y += lines.length * 5 + 2;
      });

      // --- QR Code (bottom-right) ---
      if (qrDataUrl) {
        const qrSize = 25;
        const qrX = pageW - margin - qrSize;
        const qrY2 = pdf.internal.pageSize.getHeight() - margin - qrSize;
        pdf.addImage(qrDataUrl, "PNG", qrX, qrY2, qrSize, qrSize);

        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Scan to view online", qrX, qrY2 + qrSize + 3);
      }

      const title = product.title || "Product";
      const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      pdf.save(filename);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      setDownloadError(error?.message || String(error) || "Unknown error generating PDF");
      alert(`Failed to generate PDF: ${error?.message || String(error)}`);
    } finally {
      setIsDownloading(false);
    }
  };

  /* Media — filter to catalog images, fallback to product record image */
  const mediaArray = (() => {
    const catalogMedia = (variant?.media ?? []).filter(
      (m) => m.file_name?.toLowerCase().includes('catalog-image')
    );
    if (catalogMedia.length > 0) return catalogMedia;

    // Fallback: product record image
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
  })();

  const currentMedia = mediaArray[currentIndex] ?? null;
  const getMediaUrl = (m: Media | null) => {
    if (!m) return null;
    return m.file_type.includes("video") ? m.preview_url : (m.download_url ?? m.preview_url);
  };
  const displayMedia = getMediaUrl(currentMedia);
  const isVideo = currentMedia?.file_type?.includes("video") ?? false;

  /* Lightbox keyboard handler */
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setCurrentIndex((i) => (i === 0 ? mediaArray.length - 1 : i - 1));
      if (e.key === "ArrowRight") setCurrentIndex((i) => (i === mediaArray.length - 1 ? 0 : i + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, mediaArray.length]);

  /* GSAP stagger animations */
  const containerRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.fromTo('.stagger-reveal',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out", delay: 0.2 }
    );
  }, { scope: containerRef });

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900" ref={containerRef}>
      {/* Header — outside PDF capture area */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <span className="text-xs uppercase tracking-widest text-gray-500">Ref: {variant?.variant_sku}</span>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setQrModalOpen(true)}
            data-html2canvas-ignore="true"
            className="flex items-center gap-2 text-xs uppercase tracking-widest border border-gray-300 text-gray-700 px-3 md:px-4 py-2 hover:bg-gray-100 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share QR</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            data-html2canvas-ignore="true"
            className="flex items-center gap-2 text-xs uppercase tracking-widest bg-black text-white px-3 md:px-4 py-2 hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isDownloading ? "Generating..." : "Download PDF"}</span>
          </button>
        </div>
      </header>

      <main id="share-page-content" className="flex-grow pb-32 bg-white">
        <section className="container mx-auto px-4 md:px-8 flex flex-col lg:flex-row gap-8 lg:gap-12 mb-16 pt-8">
          {/* Left: Image Gallery (sticky) */}
          <div className="w-full lg:w-2/3 lg:sticky lg:top-24 self-start">
            <ShareMediaSection
              mediaArray={mediaArray}
              onOpenLightbox={() => setLightboxOpen(true)}
              setCurrentIndex={setCurrentIndex}
              productTitle={product.title}
            />
          </div>

          {/* Right: Info */}
          <div className="w-full lg:w-1/3 flex flex-col">
            <div>
              <div className="stagger-reveal">
                <ShareHeaderSection product={product} variant={variant} />
              </div>

              <div className="stagger-reveal mt-6">
                <ShareDetailsSection product={product} variant={variant} />
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* QR Code Share Modal */}
      {qrModalOpen && qrDataUrl && (
        <QrShareModal
          qrDataUrl={qrDataUrl}
          pageUrl={pageUrl}
          productTitle={product.title || "Product"}
          onClose={() => setQrModalOpen(false)}
        />
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <ShareLightbox
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
  );
}

/* -------------------------------------------------------------------------- */
/*                            SUB-COMPONENTS                                   */
/* -------------------------------------------------------------------------- */

/* --------- MEDIA SECTION --------- */

const ShareMediaSection = memo(function ShareMediaSection({
  mediaArray,
  onOpenLightbox,
  setCurrentIndex,
  productTitle,
}: {
  mediaArray: Media[];
  onOpenLightbox: () => void;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  productTitle: string;
}) {
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
              <Image 
                src={url} 
                alt={`${productTitle} Image ${i + 1}`} 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                priority 
                className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-500 ease-out" 
                unoptimized 
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

/* --------- HEADER SECTION --------- */

const ShareHeaderSection = memo(function ShareHeaderSection({
  product,
  variant,
}: {
  product: Product;
  variant: Variant;
}) {
  const metalColor = variant?.metal_color?.toLowerCase() || "";
  const metalType = variant?.metal_type?.toLowerCase() || "";

  const stones = extractStones(variant?.sku_segments || []);

  const stoneDescParts = stones.map((s) => {
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
    ? `${variant?.carat_weight} kt ${metalColor} ${metalType} ${categoryLabel}${stoneDesc ? ` set with ${stoneDesc}` : ''}.`
    : "";

  // Prefer variant website_description, then product_description, then auto-generated sentence
  const description = variant?.website_description || product.product_description || sentence;

  return (
    <section>
      <h1 className="text-xl md:text-2xl font-semibold mb-2 uppercase tracking-wide">
        {product.title}
      </h1>

      {description && (
        <p className="text-lg md:text-xl font-serif italic text-gray-700 mb-6 leading-tight">
          {description.charAt(0).toUpperCase() + description.slice(1)}
        </p>
      )}

      {product.others && <p className="text-gray-600 text-sm mb-6">{product.others}</p>}
    </section>
  );
});

/* --------- DETAILS SECTION --------- */

const titleCase = (str: string) =>
  str.replace(/\b\w/g, c => c.toUpperCase());

const ShareDetailsSection = memo(function ShareDetailsSection({
  product,
  variant,
}: {
  product: Product;
  variant: Variant;
}) {
  const v = variant;

  const getSubgroupDisplay = (sg?: string | null) => {
    if (!sg) return "";
    if (sg.toLowerCase() === 'labgrown') return "Lab-Grown";
    return titleCase(sg.toLowerCase());
  };

  const getMetalDisplay = () => {
    if (!v?.metal_type || !v?.carat_weight || !v?.metal_color) return null;
    return `${v.carat_weight}K ${titleCase(v.metal_color)} ${titleCase(v.metal_type)} (100% Recycled Solid Gold)`;
  };

  const stones = extractStones(v?.sku_segments || []);

  // Separate diamonds and gemstones
  const diamondStone = stones.find(s => s.type === 'Diamond');
  const gemstones = stones.filter(s => !['Diamond'].includes(s.type));

  // Build gemstone display: combine all under one "Gemstones" label, comma-separated
  const gemstoneDisplay = gemstones.map(s => {
    const origin = getSubgroupDisplay(s.subGroup);
    return origin ? `${titleCase(origin)} ${titleCase(s.type)}` : titleCase(s.type);
  }).join(', ');

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs uppercase text-gray-400 mb-2">Ref: {v?.variant_sku}</p>
        <ul className="text-sm text-gray-700 list-disc pl-4 space-y-1">
          {getMetalDisplay() && <li>Metal: <span className="underline">{getMetalDisplay()}</span></li>}
          {v?.net_weight && <li>Gold Weight: {v.net_weight} g</li>}
          {v?.polki_weight && <li>Polki Weight: {v.polki_weight} g</li>}
          {v?.weight_grams && <li>Gemstone Weight: {v.weight_grams} g</li>}
          {v?.diamond_weight ? <li>Total Diamond Weight: {v.diamond_weight} ctw</li> : null}
          {diamondStone && (
            <li>
              Diamond: {getSubgroupDisplay(diamondStone.subGroup)} {titleCase(diamondStone.type)}
              {v?.dia_quality ? ` (${titleCase(v.dia_quality)} Quality)` : ''}
            </li>
          )}
          {gemstoneDisplay && <li>Gemstones: {gemstoneDisplay}</li>}
        </ul>
      </div>
    </section>
  );
});

/* --------- LIGHTBOX --------- */

const ShareLightbox = memo(function ShareLightbox({
  mediaArray,
  currentIndex,
  setCurrentIndex,
  onClose,
  isVideo,
  displayMedia,
  currentMedia,
}: {
  mediaArray: Media[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
  isVideo: boolean;
  displayMedia: string | null;
  currentMedia: Media | null;
}) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white">
        <X className="w-8 h-8" />
      </button>

      {mediaArray.length > 1 && (
        <>
          <button
            className="absolute left-4 text-white text-3xl p-2"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => (i === 0 ? mediaArray.length - 1 : i - 1)); }}
          >
            ‹
          </button>
          <button
            className="absolute right-4 text-white text-3xl p-2"
            onClick={(e) => { e.stopPropagation(); setCurrentIndex((i) => (i === mediaArray.length - 1 ? 0 : i + 1)); }}
          >
            ›
          </button>
        </>
      )}

      <div className="max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
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
            unoptimized
          />
        )}
      </div>
    </div>
  );
});

/* --------- QR SHARE MODAL --------- */

const QrShareModal = memo(function QrShareModal({
  qrDataUrl,
  pageUrl,
  productTitle,
  onClose,
}: {
  qrDataUrl: string;
  pageUrl: string;
  productTitle: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silent fail
    }
  };

  const handleDownloadQr = () => {
    const link = document.createElement("a");
    link.download = `${productTitle.replace(/[^a-z0-9]/gi, "_")}_QR.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    // Convert data URL to blob for native share
    const res = await fetch(qrDataUrl);
    const blob = await res.blob();
    const file = new File([blob], `${productTitle.replace(/[^a-z0-9]/gi, "_")}_QR.png`, { type: "image/png" });

    try {
      await navigator.share({
        title: productTitle,
        text: `Check out ${productTitle}`,
        url: pageUrl,
        files: [file],
      });
    } catch {
      // User cancelled or share failed — try without files
      try {
        await navigator.share({ title: productTitle, text: `Check out ${productTitle}`, url: pageUrl });
      } catch { /* user cancelled */ }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 flex flex-col items-center gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-sm uppercase tracking-widest font-medium text-gray-800">Share this product</h3>

        {/* QR Code */}
        <img src={qrDataUrl} alt="QR code" className="w-52 h-52" />

        <p className="text-xs text-gray-400 text-center">Scan to open this page directly</p>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-2">
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 text-xs uppercase tracking-widest bg-black text-white px-4 py-3 hover:bg-gray-800 transition cursor-pointer rounded-lg"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}

          <button
            onClick={handleDownloadQr}
            className="w-full flex items-center justify-center gap-2 text-xs uppercase tracking-widest border border-gray-300 text-gray-700 px-4 py-3 hover:bg-gray-50 transition cursor-pointer rounded-lg"
          >
            <Download className="w-4 h-4" />
            Download QR Image
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 text-xs uppercase tracking-widest border border-gray-300 text-gray-700 px-4 py-3 hover:bg-gray-50 transition cursor-pointer rounded-lg"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
});
