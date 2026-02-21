import { getProductBySku } from "@/lib/zohoClient";
import ProductClient from "./ProductClient";

export default async function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;

  try {
    const product = await getProductBySku(sku);
    console.log("product", product);

    if (!product) {
      return <div className="p-6 text-gray-500">No product found.</div>;
    }

    return <ProductClient product={product} />;
  } catch (error: any) {
    return <div className="p-6 text-red-500">Error: {error.message}</div>;
  }
}