import { getProducts, type Product } from "@/lib/zohoClient";
import HomeClient from "@/components/custom/HomeClient";

export default async function Home() {
  try {
    const products = await getProducts();

    // Extract unique collections from products
    const collectionSet = new Set<string>();
    (products ?? []).forEach((p: Product) => {
      if (Array.isArray(p.collection)) {
        p.collection.forEach((c) => collectionSet.add(c));
      }
    });
    const collections = Array.from(collectionSet);

    return (
      <HomeClient products={products ?? []} collections={collections} />
    );
  } catch (error) {
    console.error("Zoho fetch error:", error);
    return <div className="p-6 text-red-500">Error fetching products.</div>;
  }
}