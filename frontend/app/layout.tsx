import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import GlobalHeader from "@/components/custom/GlobalHeader";
import { getProducts } from "@/lib/zohoClient";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carpe Diam",
  description: "A collection of Carpe Diam",
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
    
    products?.forEach((p: any) => {
      if (p.category) {
        // Strip out the random dashes like "Ring - R" -> "Ring"
        const baseCat = p.category.split(' - ')[0].trim();
        if (!tree[baseCat]) tree[baseCat] = new Set();
        
        if (p.subcategory) {
          const sub = p.subcategory.split(' - ')[0].trim();
          tree[baseCat].add(sub);
        }
      }

      // Collect unique collection names
      if (Array.isArray(p.collection)) {
        p.collection.forEach((c: string) => collectionSet.add(c));
      }
    });

    for (const key in tree) {
      categoryTree[key] = Array.from(tree[key]);
    }
    collections = Array.from(collectionSet).sort();
  } catch (error) {
    console.error("Layout fetch error:", error);
  }

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-white text-[#111] antialiased min-h-screen flex flex-col font-sans">
        {/* Global Dynamic Hooked Header */}
        <GlobalHeader categoryTree={categoryTree} collections={collections} />

        <main className="flex-grow">
          {children}
        </main>

        {/* Global Footer (Commented out per request) */}
        {/* <footer className="bg-white border-t border-gray-100 pt-20 pb-10 px-6 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 text-center lg:text-left">
            <div>
              <h4 className="font-serif text-lg tracking-widest mb-6">L'ÉCLAT</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Defining elegance since 1924. Our commitment to purity and perfection shines through every hand-set stone.
              </p>
              <div className="flex justify-center lg:justify-start gap-4">
                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-all cursor-pointer">
                   <span className="text-[10px]">IG</span>
                </div>
                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-black hover:border-black transition-all cursor-pointer">
                   <span className="text-[10px]">FB</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-6">Collections</h5>
              <ul className="text-xs text-gray-500 space-y-3">
                <li><Link href="/" className="hover:text-black transition-colors">High Jewelry</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors">Engagement Rings</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors">Metal Collection</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors">Bespoke Services</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-6">Information</h5>
              <ul className="text-xs text-gray-500 space-y-3">
                <li><Link href="/" className="hover:text-black transition-colors">Our Story</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors">Shipping & Returns</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors">Care Guide</Link></li>
                <li><Link href="/" className="hover:text-black transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-6">Contact Us</h5>
              <ul className="text-xs text-gray-500 space-y-3 italic">
                <li>173 Fifth Avenue, New York, NY 10003</li>
                <li>+1 (212) 555-0123</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-gray-300 uppercase tracking-widest">© 2024 L'ÉCLAT JOAILLIERS. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6 text-[10px] text-gray-300 uppercase tracking-widest">
              <span className="hover:text-gray-600 cursor-pointer">Sitemap</span>
              <span className="hover:text-gray-600 cursor-pointer">Cookies</span>
              <span className="hover:text-gray-600 cursor-pointer">Accessibility</span>
            </div>
          </div>
        </footer> */}
      </body>
    </html>
  );
}

