"use client";

import Image from "next/image";
import { useEffect, useState, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { Play, X, Download, Share2 } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

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
  stone_type?: string | null;
  sub_group?: string | null;
  total_cost: number;
  media: Media[];
  diamond_weight?: number | null;
}

interface Product {
  title: string;
  category?: string | null;
  others?: string | null;
  parent_sku: string;
  subcategory?: string | null;
  base_price?: number | null;
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
    QRCode.toDataURL(url, { width: 400, margin: 2 }).then(setQrDataUrl).catch(console.error);
  }, []);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("share-page-content");
    if (!element) return;

    try {
      setIsDownloading(true);
      setDownloadError(null);

      const imgData = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const img = new window.Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      // Add QR code to the PDF (bottom-right corner)
      if (qrDataUrl) {
        const qrSize = 30; // mm
        const qrX = pdfWidth - qrSize - 8;
        const qrY = Math.min(pdfHeight, pdf.internal.pageSize.getHeight()) - qrSize - 8;
        pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
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

  /* Media — filter to catalog images only */
  const mediaArray = (variant?.media ?? []).filter(
    (m) => m.file_name?.toLowerCase().includes('catalog-image')
  );

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
    <div id="share-page-content" className="min-h-screen bg-white flex flex-col font-sans text-gray-900" ref={containerRef}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 py-4">
        <Image src="/ud-logo.svg" alt="Logo" width={70} height={28} unoptimized />
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-widest text-gray-500">Ref: {variant?.variant_sku}</span>
          <button
            onClick={() => setQrModalOpen(true)}
            data-html2canvas-ignore="true"
            className="flex items-center gap-2 text-xs uppercase tracking-widest border border-gray-300 text-gray-700 px-4 py-2 hover:bg-gray-100 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share QR
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            data-html2canvas-ignore="true"
            className="flex items-center gap-2 text-xs uppercase tracking-widest bg-black text-white px-4 py-2 hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </header>

      <main className="flex-grow pb-32">
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

  return (
    <section>
      <h1 className="text-xl md:text-2xl font-semibold mb-2 uppercase tracking-wide">
        {product.title}
      </h1>

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

/* --------- DETAILS SECTION --------- */

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
          {v?.dimensions && <li>Dimensions: {v.dimensions}</li>}
          {v?.model && <li>Band width / model: {v.model}</li>}
          {v?.weight_grams && <li>Weight: {v.weight_grams} g</li>}
          {product.subcategory && <li>Type: {product.subcategory}</li>}
          {v?.setting && <li>Setting: {v.setting}</li>}
        </ul>
      </div>

      {/* Accordions */}
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
      </div>

      {/* Category tags */}
      <div className="mt-8 flex flex-wrap gap-4 text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">
        <span className="cursor-pointer hover:underline hover:text-black transition">All rings</span>
        <span className="cursor-pointer hover:underline hover:text-black transition">Diamond Rings</span>
        <span className="cursor-pointer hover:underline hover:text-black transition">Eternity Rings</span>
        <span className="cursor-pointer hover:underline hover:text-black transition">Solitary Rings</span>
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
      // fallback
      const input = document.createElement("input");
      input.value = pageUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
