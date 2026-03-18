import { getProducts } from "@/lib/zohoClient";
import CatalogClient from "@/components/custom/CatalogClient";

export default async function CatalogPage() {
  try {
    const products = await getProducts();
    return (
      <CatalogClient products={products ?? []} />
    );
  } catch (error) {
    console.error("Zoho fetch error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center font-serif italic text-gray-500">
        Our collection is currently being updated. Please check back shortly.
      </div>
    );
  }
}
