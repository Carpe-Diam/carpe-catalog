"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";
import { ImageIcon } from "lucide-react";
import { type Product } from "@/lib/zohoClient";

interface DisplayCardProps {
  product: Product;
}

const DisplayCard = memo(function DisplayCard({ product }: DisplayCardProps) {
  const { title, base_price, category, subcategory, variants, record_image } = product;

  const firstVariant = variants?.[0];
  const firstMedia = firstVariant?.media?.[0];

  const preferredUrl = record_image || firstMedia?.download_url || firstMedia?.preview_url;

  const [hasError, setHasError] = useState(false);
  const showFallback = hasError || !preferredUrl;

  // Proxy URLs can't go through Next.js image optimization — only R2/external URLs can
  const isProxyUrl = (preferredUrl ?? '').startsWith('/api/image-proxy');

  return (
    <Link href={`/product/${product.parent_sku}`}>
      <div className="group cursor-pointer transition-all">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary rounded-[2rem] border border-white/5">
          {showFallback ? (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          ) :
            <Image
              className="object-cover bg-none transition-transform duration-1000 group-hover:scale-110"
              alt={title || "Product"}
              src={preferredUrl}
              fill
              unoptimized={isProxyUrl}
              onError={() => setHasError(true)}
            />
          }
        </div>

        <div className="pt-6 pb-2 text-center lg:text-left">
          <h3 className="text-[12px] uppercase tracking-[0.25em] font-semibold mb-2 whitespace-normal break-words group-hover:text-accent transition-colors">{title}</h3>
          <p className="text-[11px] text-muted-foreground tracking-widest uppercase mb-2">
            {subcategory || category || "Fine Jewelry"}
          </p>
        </div>
      </div>
    </Link>
  );
});

export default DisplayCard;
