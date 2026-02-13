import { getProducts } from "@/lib/strapiClient";
import ExplorePage from "@/app/(pages)/ExplorePage";

export default async function Home() {
  try {
    const products = await getProducts();

    return (
      <div className="bg-white rounded-lg">
        <ExplorePage products={products ?? []} />
      </div>
    );
  } catch (error) {
    console.error("Strapi error:", error);
    return <div className="p-6 text-red-500">Error fetching products.</div>;
  }
}