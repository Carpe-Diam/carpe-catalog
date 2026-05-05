import { getProductBySku } from "@/lib/zohoClient";
import { notFound } from "next/navigation";
import ShareClientView from "./ShareClientView";

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
  const orderId = "00000";

  /* ---------------------------------------------------------------------- */
  /*                         FETCH FROM ZOHO CRM                              */
  /* ---------------------------------------------------------------------- */

  const product = await getProductBySku(sku);

  if (!product) return notFound();

  /* ---------------------------------------------------------------------- */
  /*                        RESOLVE VARIANT                                  */
  /* ---------------------------------------------------------------------- */

  const variant =
    product.variants.find((v: any) => v.variant_sku === variantSku) ??
    product.variants[0];

  /* ---------------------------------------------------------------------- */
  /*                              RENDER CLIENT                             */
  /* ---------------------------------------------------------------------- */

  return (
    <ShareClientView
      product={product}
      variant={variant}
      orderId={orderId}
    />
  );
}