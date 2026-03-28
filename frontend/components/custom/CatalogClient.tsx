'use client';

import { useState, useRef, useMemo, memo, useEffect } from "react";
import DisplayCard from "@/components/custom/DisplayCard";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type Product } from "@/lib/zohoClient";

gsap.registerPlugin(ScrollTrigger);


/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function CatalogClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams();
  const initCategory = searchParams.get('category');
  const initSubcategory = searchParams.get('subcategory');
  const initOrderType = searchParams.get('orderType');
  const initCollection = searchParams.get('collection');

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(initCategory);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(initSubcategory);
  const [activeOrderType, setActiveOrderType] = useState<string | null>(initOrderType);
  const [activeCollection, setActiveCollection] = useState<string | null>(initCollection);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveCategory(searchParams.get('category'));
    setActiveSubcategory(searchParams.get('subcategory'));
    setActiveOrderType(searchParams.get('orderType'));
    setActiveCollection(searchParams.get('collection'));
  }, [searchParams]);

  const filterData = useMemo(() => {
    const cats = new Set<string>();
    const subs = new Set<string>();
    const catSubMap: Record<string, Set<string>> = {};
    const orderTypes = new Set<string>();
    const metals = new Set<string>();
    const stones = new Set<string>();
    const collectionSet = new Set<string>();

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

      if (Array.isArray(p.collection)) {
        p.collection.forEach((c: string) => collectionSet.add(c));
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
      collections: Array.from(collectionSet).sort(),
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

      const matchCollection = !activeCollection || (Array.isArray(p.collection) && p.collection.includes(activeCollection));

      return matchQuery && matchCat && matchSub && matchOrd && matchCollection;
    });
  }, [products, query, activeCategory, activeSubcategory, activeOrderType, activeCollection]);

  const heroImage = "/collection1.png"

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans">
      {/* 1. COLLECTION HERO */}
      <section className="relative h-[50vh] w-full overflow-hidden flex items-center justify-center">
        <Image
          src={heroImage}
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

      {/* Mobile Filter Button */}
      <div className="lg:hidden px-6 py-4 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-widest font-medium border border-gray-300 text-gray-700 hover:border-black hover:text-black transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {(activeCategory || activeOrderType || activeCollection) && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
          )}
        </button>
        <span className="text-[11px] uppercase tracking-[0.2em] text-gray-400">
          {filteredProducts.length} Items
        </span>
        {(activeCategory || activeSubcategory || activeOrderType || activeCollection) && (
          <button
            onClick={() => { setActiveCategory(null); setActiveSubcategory(null); setActiveOrderType(null); setActiveCollection(null); }}
            className="ml-auto text-[10px] uppercase tracking-wider text-gray-400 underline hover:text-black transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50 lg:hidden" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-[300px] bg-white z-50 shadow-2xl flex flex-col lg:hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-black">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-gray-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter content — same as sidebar */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-10">
              {/* Category */}
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-4 text-black">Category</h3>
                <div className="space-y-3">
                  {filterData.categories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 border-gray-200 rounded-none accent-[#C5A059]"
                        checked={activeCategory === cat}
                        onChange={() => {
                          setActiveCategory(prev => prev === cat ? null : cat);
                          setActiveSubcategory(null);
                        }}
                      />
                      <span className={`text-xs tracking-wider transition-colors ${activeCategory === cat ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-black'}`}>
                        {cat.endsWith('s') ? cat : `${cat}s`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subcategory */}
              {(activeCategory || filterData.subcategories.length > 0) && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-4 text-black">Subcategory</h3>
                  <div className="space-y-3">
                    {filterData.subcategories
                      .filter(sub => !activeCategory || filterData.categorySubcategoryMap[activeCategory]?.includes(sub))
                      .map(sub => (
                        <label key={sub} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 border-gray-200 rounded-none accent-[#C5A059]"
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

              {/* Order Type */}
              {filterData.orderTypes.length > 0 && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-4 text-black">Type of Order</h3>
                  <div className="space-y-3">
                    {filterData.orderTypes.map(ord => (
                      <label key={ord} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 border-gray-200 rounded-none accent-[#C5A059]"
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

              {/* Collection Filter (Mobile) */}
              {filterData.collections.length > 0 && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-4 text-black">Collection</h3>
                  <div className="space-y-3">
                    {filterData.collections.map(col => (
                      <label key={col} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 border-gray-200 rounded-none accent-[#C5A059]"
                          checked={activeCollection === col}
                          onChange={() => setActiveCollection(prev => prev === col ? null : col)}
                        />
                        <span className={`text-xs tracking-wider transition-colors ${activeCollection === col ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-black'}`}>
                          {col}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 text-xs uppercase tracking-widest font-medium bg-black text-white hover:bg-gray-800 transition-all"
              >
                View {filteredProducts.length} Results
              </button>
              {(activeCategory || activeSubcategory || activeOrderType || activeCollection) && (
                <button
                  onClick={() => { setActiveCategory(null); setActiveSubcategory(null); setActiveOrderType(null); setActiveCollection(null); }}
                  className="w-full py-2.5 text-xs uppercase tracking-widest font-medium border border-gray-300 text-gray-600 hover:border-black hover:text-black transition-all"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <div className="max-w-[1800px] mx-auto px-6 lg:px-20 py-16 flex flex-col lg:flex-row gap-16">
        {/* 2. SIDEBAR FILTERS — Desktop only */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-12">
            {/* Category Filter */}
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-6 text-black">Category</h3>
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
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-6 text-black">Subcategory</h3>
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
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-6 text-black">Type of Order</h3>
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

            {/* Collection Filter (Desktop) */}
            {filterData.collections.length > 0 && (
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-6 text-black">Collection</h3>
                <div className="space-y-3">
                  {filterData.collections.map(col => (
                    <label key={col} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 border-gray-200 rounded-none accent-[#C5A059] checked:bg-[#C5A059]"
                        checked={activeCollection === col}
                        onChange={() => setActiveCollection(prev => prev === col ? null : col)}
                      />
                      <span className={`text-xs tracking-wider transition-colors ${activeCollection === col ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-black'}`}>
                        {col}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* 3. PRODUCT GRID */}
        <div className="flex-grow">
          <div className="flex items-center mb-12 border-b border-gray-100 pb-6">
            <span className="text-[11px] uppercase tracking-[0.2em] text-gray-400">
              {filteredProducts.length} Items found
            </span>
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
                onClick={() => { setActiveCategory(null); setActiveSubcategory(null); setActiveOrderType(null); setActiveCollection(null); setQuery(''); }}
                className="mt-6 text-[11px] uppercase tracking-[0.2em] underline hover:text-black transition-all"
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