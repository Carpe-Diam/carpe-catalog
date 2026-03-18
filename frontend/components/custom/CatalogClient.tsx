'use client';

import { Input } from "@/components/ui/input";
import { useState, useRef, useMemo, useCallback, memo } from "react";
import DisplayCard from "@/components/custom/DisplayCard";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);


/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function CatalogClient({ products }: { products: any[] }) {
  const searchParams = useSearchParams();
  const initCategory = searchParams.get('category');
  const initSubcategory = searchParams.get('subcategory');
  const initOrderType = searchParams.get('orderType');

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(initCategory);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(initSubcategory);
  const [activeOrderType, setActiveOrderType] = useState<string | null>(initOrderType);
  const [activeMetals, setActiveMetals] = useState<string[]>([]);
  const [activeStones, setActiveStones] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const filterData = useMemo(() => {
    const cats = new Set<string>();
    const subs = new Set<string>();
    const catSubMap: Record<string, Set<string>> = {};
    const orderTypes = new Set<string>();
    const metals = new Set<string>();
    const stones = new Set<string>();

    products.forEach(p => {
      if (p.category) {
        const cBase = p.category.split(' - ')[0].trim();
        cats.add(cBase);
        if (!catSubMap[cBase]) catSubMap[cBase] = new Set();
      }

      if (p.subcategory) {
        const sBase = p.subcategory.split(' - ')[0].trim();
        subs.add(sBase);
        if (p.category) {
          const cBase = p.category.split(' - ')[0].trim();
          catSubMap[cBase].add(sBase);
        }
      }

      if (p.type_of_order) {
        orderTypes.add(p.type_of_order.split(' - ')[0].trim());
      }

      if (p.metal_type) metals.add(p.metal_type);
      if (p.stone_type) stones.add(p.stone_type);
    });

    const formattedMap: Record<string, string[]> = {};
    Object.keys(catSubMap).forEach(k => {
      formattedMap[k] = Array.from(catSubMap[k]);
    });

    return {
      categories: Array.from(cats),
      subcategories: Array.from(subs),
      categorySubcategoryMap: formattedMap,
      orderTypes: Array.from(orderTypes),
      metals: Array.from(metals),
      stones: Array.from(stones)
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchQuery = !query || p.title?.toLowerCase().includes(query.toLowerCase());

      const pCat = p.category ? p.category.split(' - ')[0].trim() : null;
      const matchCat = !activeCategory || pCat === activeCategory;

      const pSub = p.subcategory ? p.subcategory.split(' - ')[0].trim() : null;
      const matchSub = !activeSubcategory || pSub === activeSubcategory;

      const pOrd = p.type_of_order ? p.type_of_order.split(' - ')[0].trim() : null;
      const matchOrd = !activeOrderType || pOrd === activeOrderType;

      const matchMetal = activeMetals.length === 0 || activeMetals.includes(p.metal_type);
      const matchStone = activeStones.length === 0 || activeStones.includes(p.stone_type);

      return matchQuery && matchCat && matchSub && matchOrd && matchMetal && matchStone;
    });
  }, [products, query, activeCategory, activeSubcategory, activeOrderType, activeMetals, activeStones]);

  const toggleMetal = (metal: string) => {
    setActiveMetals(prev => prev.includes(metal) ? prev.filter(m => m !== metal) : [...prev, metal]);
  };

  const toggleStone = (stone: string) => {
    setActiveStones(prev => prev.includes(stone) ? prev.filter(s => s !== stone) : [...prev, stone]);
  };

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans">
      {/* 1. COLLECTION HERO */}
      <section className="relative h-[50vh] w-full overflow-hidden flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?q=80&w=3000&auto=format&fit=crop"
          alt="The Collection"
          fill
          priority
          unoptimized
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative text-center text-white px-6">
          <p className="text-[10px] uppercase tracking-[0.4em] mb-4 opacity-80">Home &bull; Collections</p>
          <h1 className="text-4xl md:text-6xl font-serif italic leading-tight">
            {activeCategory ? `The ${activeCategory} Collection` : "All Collections"}
          </h1>
          <p className="mt-6 text-sm md:text-base font-light tracking-wide max-w-2xl mx-auto opacity-70">
            Timeless craftsmanship meeting contemporary brilliance. Discover a piece for every promise.
          </p>
        </div>
      </section>

      <div className="max-w-[1800px] mx-auto px-6 lg:px-20 py-16 flex flex-col lg:flex-row gap-16">
        {/* 2. SIDEBAR FILTERS */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-12">
            {/* Category Filter */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-6 text-[#C5A059]">Category</h3>
              <div className="space-y-3">
                {filterData.categories.map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 border-gray-200 rounded-none accent-[#C5A059] checked:bg-[#C5A059]"
                      checked={activeCategory === cat}
                      onChange={() => {
                        setActiveCategory(prev => prev === cat ? null : cat);
                        setActiveSubcategory(null); // reset sub when category changes
                      }}
                    />
                    <span className={`text-xs tracking-wider transition-colors ${activeCategory === cat ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-black'}`}>
                      {cat.endsWith('s') ? cat : `${cat}s`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subcategory Filter */}
            {(activeCategory || filterData.subcategories.length > 0) && (
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-6 text-[#C5A059]">Subcategory</h3>
                <div className="space-y-3">
                  {filterData.subcategories
                    .filter(sub => !activeCategory || filterData.categorySubcategoryMap[activeCategory]?.includes(sub))
                    .map(sub => (
                      <label key={sub} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 border-gray-200 rounded-none accent-[#C5A059] checked:bg-[#C5A059]"
                          checked={activeSubcategory === sub}
                          onChange={() => setActiveSubcategory(prev => prev === sub ? null : sub)}
                        />
                        <span className={`text-xs tracking-wider transition-colors ${activeSubcategory === sub ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-black'}`}>
                          {sub}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Order Type Filter */}
            {filterData.orderTypes.length > 0 && (
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-6 text-[#C5A059]">Type of Order</h3>
                <div className="space-y-3">
                  {filterData.orderTypes.map(ord => (
                    <label key={ord} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 border-gray-200 rounded-none accent-[#C5A059] checked:bg-[#C5A059]"
                        checked={activeOrderType === ord}
                        onChange={() => setActiveOrderType(prev => prev === ord ? null : ord)}
                      />
                      <span className={`text-xs tracking-wider transition-colors ${activeOrderType === ord ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-black'}`}>
                        {ord}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Metal Filter */}
            {/* <div>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-6 text-[#C5A059]">Metal</h3>
              <div className="flex flex-wrap gap-2">
                {filterData.metals.map(metal => (
                  <button
                    key={metal}
                    onClick={() => toggleMetal(metal)}
                    className={`px-4 py-2 border text-[10px] uppercase tracking-widest transition-all ${activeMetals.includes(metal) ? 'border-black bg-black text-white' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}
                  >
                    {metal}
                  </button>
                ))}
              </div>
            </div> */}

            {/* Stone Type Filter */}
            {/* <div>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-6 text-[#C5A059]">Stone Type</h3>
              <div className="space-y-3">
                {filterData.stones.map(stone => (
                  <label key={stone} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 border-gray-200 rounded-none accent-[#C5A059]"
                      checked={activeStones.includes(stone)}
                      onChange={() => toggleStone(stone)}
                    />
                    <span className={`text-xs tracking-wider transition-colors ${activeStones.includes(stone) ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-black'}`}>
                      {stone}
                    </span>
                  </label>
                ))}
              </div>
            </div> */}
          </div>
        </aside>

        {/* 3. PRODUCT GRID */}
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-12 border-b border-gray-100 pb-6">
            <span className="text-[11px] uppercase tracking-[0.2em] text-gray-400">
              {filteredProducts.length} Items found
            </span>
            <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.2em]">
              <span className="text-gray-400">Sort by:</span>
              <select className="bg-transparent font-semibold outline-none cursor-pointer">
                <option>Featured</option>
                <option>Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
            {filteredProducts.map((product) => (
              <div key={product.parent_sku} className="product-card reveal">
                <DisplayCard product={product} />
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-32">
              <p className="text-gray-400 font-serif italic uppercase tracking-widest">No styles match your selection</p>
              <button
                onClick={() => { setActiveCategory(null); setActiveSubcategory(null); setActiveOrderType(null); setActiveMetals([]); setActiveStones([]); setQuery(''); }}
                className="mt-6 text-[11px] uppercase tracking-[0.2em] underline hover:text-[#C5A059] transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}

          <div className="mt-24 pt-12 border-t border-gray-100 text-center">
            <button className="px-12 py-4 border border-black text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-black hover:text-white transition-all">
              Load More Styles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




/* -------------------------------------------------------------------------- */
/*                            CATEGORY SECTION                                 */
/* -------------------------------------------------------------------------- */

const CategorySection = memo(function CategorySection({ id, title, products }: { id: string, title: string, products: any[] }) {
  return (
    <section id={id} className="category-section scroll-mt-24">
      <div className="flex items-center justify-between mb-8 border-b border-[#EAEAEA] pb-4">
        <h2 className="text-2xl font-serif text-[#111]">{title}</h2>
        <span className="text-sm text-gray-500">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</span>
      </div>

      <div className="product-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 sm:gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-12">
        {products.map((product) => (
          <div key={product.parent_sku} className="product-card group relative">
            <DisplayCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
});