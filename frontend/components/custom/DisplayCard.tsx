"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";

type Variant = {
  media?: { download_url?: string; preview_url?: string }[];
};

type Product = {
  title?: string;
  base_price?: number;
  category?: string;
  subcategory?: string;
  variants?: Variant[];
  parent_sku?: string;
  record_image?: string | null;
};

interface DisplayCardProps {
  product: Product;
}

const DisplayCard = memo(function DisplayCard({ product }: DisplayCardProps) {
  const { title, base_price, category, subcategory, variants, record_image } = product;

  const firstVariant = variants?.[0];
  const firstMedia = firstVariant?.media?.[0];

  const preferredUrl = record_image || firstMedia?.download_url || firstMedia?.preview_url;
  const fallbackUrl = "https://plus.unsplash.com/premium_photo-1728892768695-ebebed48ff90?ixlib=rb-4.1.0&q=80&w=3000";

  const [hasError, setHasError] = useState(false);
  const imageUrl = hasError ? fallbackUrl : (preferredUrl || fallbackUrl);

  return (
    <Link href={`/product/${product.parent_sku}`}>
      <div className="group cursor-pointer transition-all">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F9F9F9]">
          <Image
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            alt={title || "Product"}
            src={imageUrl}
            fill
            unoptimized
            onError={() => setHasError(true)}
          />
        </div>

        <div className="pt-4 pb-2 text-center lg:text-left">
          <h3 className="text-[11px] uppercase tracking-[0.2em] font-medium mb-1 truncate">{title}</h3>
          <p className="text-[10px] text-gray-400 italic font-serif mb-2">
            {subcategory || category || "Fine Jewelry"}
          </p>
          <p className="text-xs font-semibold tracking-widest text-gray-900">
            {base_price ? `$${base_price.toLocaleString()}` : "Price upon request"}
          </p>
        </div>
      </div>
    </Link>
  );
});

export default DisplayCard;