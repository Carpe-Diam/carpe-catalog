import type { Metadata } from "next";
import { Amiri, Outfit } from "next/font/google";
import "./globals.css";
import GlobalHeader from "@/components/custom/GlobalHeader";
import GlobalFooter from "@/components/custom/GlobalFooter";
import { getProducts, type Product } from "@/lib/zohoClient";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next"

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["latin", "arabic"],
  weight: ["400", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
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
  let collections: string[] = [];

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
    collections = Array.from(collectionSet);
  } catch (error) {
    console.error("Layout fetch error:", error);
  }

  const themeScript = `
    (() => {
      try {
        const stored = localStorage.getItem("carpe-theme");
        document.documentElement.classList.toggle("dark", stored ? stored === "dark" : true);
      } catch {
        document.documentElement.classList.remove("dark");
      }
    })();
  `;

  return (
    <html lang="en" className={`${amiri.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col font-serif">
        {/* Global Dynamic Hooked Header */}
        <Suspense fallback={null}>
          <GlobalHeader categoryTree={categoryTree} collections={collections} />
        </Suspense>

        <main className="flex-grow">
          {children}
        </main>

        <GlobalFooter />

        <Analytics />
      </body>
    </html>
  );
}
