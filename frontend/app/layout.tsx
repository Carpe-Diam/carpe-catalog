import type { Metadata } from "next";
import { Amiri } from "next/font/google";
import "./globals.css";
import GlobalHeader from "@/components/custom/GlobalHeader";
import { getProducts, type Product } from "@/lib/zohoClient";

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["latin", "arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Carpe Diam",
  description: "A collection of Carpe Diam",
  icons: {
    icon: "/Favicon_450x.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let categoryTree: Record<string, string[]> = {};
  
  try {
    const products = await getProducts();
    const tree: Record<string, Set<string>> = {};
    const collectionSet = new Set<string>();
    
    products?.forEach((p: Product) => {
      if (p.category) {
        const baseCat = p.category.split(' - ')[0].trim();
        if (!tree[baseCat]) tree[baseCat] = new Set();
        
        if (p.subcategory) {
          const sub = p.subcategory.split(' - ')[0].trim();
          tree[baseCat].add(sub);
        }
      }

      if (Array.isArray(p.collection)) {
        p.collection.forEach((c) => collectionSet.add(c));
      }
    });

    for (const key in tree) {
      categoryTree[key] = Array.from(tree[key]);
    }
  } catch (error) {
    console.error("Layout fetch error:", error);
  }

  return (
    <html lang="en" className={`${amiri.variable}`}>
      <body className="bg-white text-[#111] antialiased min-h-screen flex flex-col font-serif">
        {/* Global Dynamic Hooked Header */}
        <GlobalHeader categoryTree={categoryTree} />

        <main className="flex-grow">
          {children}
        </main>

      </body>
    </html>
  );
}

