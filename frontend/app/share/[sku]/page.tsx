import { getProductBySku } from "@/lib/zohoClient";
import { notFound } from "next/navigation";
import ShareClientView, {
  MediaItem,
  Product,
  Variant,
} from "./ShareClientView";

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

interface PageParams {
  sku: string;
}

interface PageSearchParams {
  variant?: string;
  order?: string;
}

/* -------------------------------------------------------------------------- */
/*                               PAGE COMPONENT                               */
/* -------------------------------------------------------------------------- */

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  const sku = resolvedParams.sku;
  const variantSku = resolvedSearch.variant;
  const orderId = resolvedSearch.order ?? "00000";

  /* ---------------------------------------------------------------------- */
  /*                         FETCH FROM ZOHO CRM                              */
  /* ---------------------------------------------------------------------- */

  const product = await getProductBySku(sku);

  if (!product) return notFound();

  /* ---------------------------------------------------------------------- */
  /*                        RESOLVE VARIANT & MEDIA                         */
  /* ---------------------------------------------------------------------- */

  const variant =
    product.variants.find((v: any) => v.variant_sku === variantSku) ??
    product.variants[0];

  const formattedMedia: MediaItem[] = (variant?.media ?? []).map((m: any) => {
    const isVideo = m.file_type?.includes("video") ?? false;

    return {
      type: isVideo ? "video" : "image",
      src: isVideo ? m.preview_url : m.download_url || m.preview_url,
    };
  });

  /* ---------------------------------------------------------------------- */
  /*                              RENDER CLIENT                             */
  /* ---------------------------------------------------------------------- */

  return (
    <ShareClientView
      media={formattedMedia}
      orderId={orderId}
      product={product as Product}
      variant={variant as Variant}
    />
  );
}