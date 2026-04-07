import { getProducts, type Product } from "@/lib/zohoClient";
import HomeCategoryParallaxClient from "@/components/custom/HomeCategoryParallaxClient";

export default async function Home() {
  let products: Product[] = [];

  try {
    products = (await getProducts()) ?? [];
  } catch (error) {
    console.error("Zoho fetch error:", error);
    return <div className="p-6 text-red-500">Error fetching products.</div>;
  }

  return <HomeCategoryParallaxClient products={products} />;
}
