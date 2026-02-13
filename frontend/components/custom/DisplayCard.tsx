import Image from "next/image";
import Link from "next/link";

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
};

interface DisplayCardProps {
  product: Product;
}

const DisplayCard = ({ product }: DisplayCardProps) => {
  const { title, base_price, category, subcategory, variants } = product;

  const firstVariant = variants?.[0];
  const firstMedia = firstVariant?.media?.[0];

  const imageUrl =
    firstMedia?.download_url || firstMedia?.preview_url ||
    "https://plus.unsplash.com/premium_photo-1728892768695-ebebed48ff90?ixlib=rb-4.1.0&q=80&w=3000";

  return (
    <Link href={`/product/${product.parent_sku}`}>
      <div className="rounded-md cursor-pointer transition-all">
        <div className="relative aspect-[10/9] w-full">
          <Image
            className="object-cover rounded-sm"
            alt={title || "Product"}
            src={imageUrl}
            fill
          />
        </div>

        <div className="pt-2">
          <h3 className="text-base font-medium truncate">{title}</h3>
          <p className="text-sm text-gray-500">
            {category} {subcategory && `• ${subcategory}`}
          </p>
          <p className="text-sm pt-1 font-semibold text-gray-800">
            Starting from ${base_price ?? "N/A"}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default DisplayCard;