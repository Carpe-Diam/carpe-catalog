import { getProducts } from "@/lib/zohoClient";
import HomeClient from "@/components/custom/HomeClient";

export default async function Home() {
  try {
    const products = await getProducts();

    return (
      <HomeClient products={products ?? []} />
    );
  } catch (error) {
    console.error("Zoho fetch error:", error);
    return <div className="p-6 text-red-500">Error fetching products.</div>;
  }
}