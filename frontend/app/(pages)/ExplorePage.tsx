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

gsap.registerPlugin(ScrollTrigger);

/* -------------------------------------------------------------------------- */
/*                       CATEGORY ↔ SUBCATEGORY MAP                            */
/* -------------------------------------------------------------------------- */

// The canonical dependency map from Zoho CRM (screenshot reference).
// Keys are category values exactly as they appear in the payload.
const CATEGORY_SUBCATEGORY_MAP: Record<string, string[]> = {
  'Ring - R': ['Wedding Ring - W', 'Engagement Ring - E'],
  'Earring - E': [
    'Hoop Earring - H',
    'Dangle Earring - D',
    'Stud Earring - S',
    'Drop Earring - DE',
    'Earpin - EP',
  ],
  'Pendant - P': ['Engagement Ring - E'],
};

/** Strip the trailing code from a Zoho label, e.g. "Ring - R" → "Rings" */
function prettyCategoryName(raw: string): string {
  const base = raw.split(' - ')[0].trim();
  // Pluralise simply – works for Ring→Rings, Earring→Earrings, Pendant→Pendants
  if (base.endsWith('s')) return base;
  return `${base}s`;
}

/** Strip the trailing code from a sub-category label */
function prettySubName(raw: string): string {
  return raw.split(' - ')[0].trim();
}

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function ExplorePage({ products }: { products: any[] }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  /* -------------------- Derived: categories present in data -------------------- */

  const categoriesInData = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p?.category) cats.add(p.category); });
    // Return them in the order they appear in our canonical map, then any extras
    const ordered: string[] = [];
    for (const key of Object.keys(CATEGORY_SUBCATEGORY_MAP)) {
      if (cats.has(key)) ordered.push(key);
    }
    cats.forEach(c => { if (!ordered.includes(c)) ordered.push(c); });
    return ordered;
  }, [products]);

  /* -------------------- Derived: filtered products (search) -------------------- */

  const filteredProducts = useMemo(() => {
    let list = products;

    // Filter by search query first
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        (p?.title ?? "").toLowerCase().includes(q) ||
        (p?.product_category ?? "").toLowerCase().includes(q) ||
        (p?.category ?? "").toLowerCase().includes(q) ||
        (p?.subcategory ?? "").toLowerCase().includes(q)
      );
    }

    // Then filter by active category / subcategory
    if (activeCategory) {
      list = list.filter(p => p?.category === activeCategory);
      if (activeSubcategory) {
        list = list.filter(p => p?.subcategory === activeSubcategory);
      }
    }

    return list;
  }, [products, query, activeCategory, activeSubcategory]);

  /* -------------------- Order-type grouping (kept as-is) -------------------- */

  const stockProducts = useMemo(() => filteredProducts.filter(p => p.type_of_order?.toLowerCase().includes('stock')), [filteredProducts]);
  const customProducts = useMemo(() => filteredProducts.filter(p => p.type_of_order?.toLowerCase().includes('customer') || p.type_of_order?.toLowerCase().includes('custom')), [filteredProducts]);
  const sketchProducts = useMemo(() => filteredProducts.filter(p => p.type_of_order?.toLowerCase().includes('sketch')), [filteredProducts]);

  const otherProducts = useMemo(() => filteredProducts.filter(p =>
    !p.type_of_order?.toLowerCase().includes('stock') &&
    !p.type_of_order?.toLowerCase().includes('customer') &&
    !p.type_of_order?.toLowerCase().includes('custom') &&
    !p.type_of_order?.toLowerCase().includes('sketch')
  ), [filteredProducts]);

  /* -------------------- GSAP Animations -------------------- */

  useGSAP(() => {
    const sections = gsap.utils.toArray('.category-section') as HTMLElement[];
    sections.forEach((section) => {
      gsap.fromTo(section,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    const grids = gsap.utils.toArray('.product-grid') as HTMLElement[];
    grids.forEach(grid => {
      const cards = grid.querySelectorAll('.product-card');
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power1.out",
            scrollTrigger: {
              trigger: grid,
              start: "top 90%",
            }
          }
        );
      }
    });

  }, { scope: containerRef, dependencies: [query, activeCategory, activeSubcategory] });

  /* -------------------- Callbacks -------------------- */

  const scrollToCategory = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleCategoryClick = useCallback((cat: string | null) => {
    setActiveCategory(prev => prev === cat ? null : cat);
    setActiveSubcategory(null);
  }, []);

  const handleSubcategoryClick = useCallback((sub: string) => {
    setActiveSubcategory(prev => prev === sub ? null : sub);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveCategory(null);
    setActiveSubcategory(null);
  }, []);

  /* -------------------- Active filter label -------------------- */
  const activeFilterLabel = useMemo(() => {
    if (!activeCategory) return null;
    const catName = prettyCategoryName(activeCategory);
    if (activeSubcategory) return `${catName} › ${prettySubName(activeSubcategory)}`;
    return catName;
  }, [activeCategory, activeSubcategory]);

  /* -------------------- RENDER -------------------- */

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen text-[#1A1A1A] font-sans" ref={containerRef}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-[#EAEAEA] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
        <div className="flex items-center w-full md:w-auto justify-between">
          <Link href="/">
            <Image src="/ud-logo.svg" alt="Logo" width={70} height={28} unoptimized className="cursor-pointer" />
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm uppercase tracking-widest font-medium text-gray-500">
          {/* Order-type links (kept) */}
          {stockProducts.length > 0 && (
            <button onClick={() => scrollToCategory('stock')} className="hover:text-black transition-colors">Stock</button>
          )}
          {customProducts.length > 0 && (
            <button onClick={() => scrollToCategory('custom')} className="hover:text-black transition-colors">Custom</button>
          )}
          {sketchProducts.length > 0 && (
            <button onClick={() => scrollToCategory('sketch')} className="hover:text-black transition-colors">Sketch</button>
          )}

          {/* Divider */}
          {categoriesInData.length > 0 && (stockProducts.length > 0 || customProducts.length > 0 || sketchProducts.length > 0) && (
            <div className="w-px h-5 bg-gray-300" />
          )}

          {/* Category dropdown links */}
          {categoriesInData.map(cat => (
            <CategoryNavItem
              key={cat}
              category={cat}
              isActive={activeCategory === cat}
              activeSubcategory={activeSubcategory}
              onCategoryClick={handleCategoryClick}
              onSubcategoryClick={handleSubcategoryClick}
            />
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-auto max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search collections..."
            className="pl-9 bg-transparent border-[#EAEAEA] focus-visible:ring-1 focus-visible:ring-black rounded-none shadow-none w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </nav>

      {/* Active filter pill */}
      {activeFilterLabel && (
        <div className="flex items-center justify-center gap-2 py-3 bg-[#F5F5F5] border-b border-[#EAEAEA]">
          <span className="text-xs uppercase tracking-widest text-gray-600">
            Showing: <strong className="text-black">{activeFilterLabel}</strong>
          </span>
          <button
            onClick={clearFilters}
            className="ml-2 text-xs text-gray-400 hover:text-black transition-colors underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Hero Header */}
      <header className="py-16 md:py-24 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif text-[#111] mb-4">Our Collections</h1>
        <p className="text-gray-500 text-sm md:text-base leading-relaxed tracking-wide">
          Discover our curated selection of fine jewelry. From instantly available stock pieces to unique custom customer orders and visionary sketches ready to be brought to life.
        </p>
      </header>

      {/* Mobile category filter pills */}
      <div className="md:hidden px-4 pb-6 flex flex-wrap gap-2">
        <button
          onClick={clearFilters}
          className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-all ${!activeCategory ? 'border-black text-black' : 'border-gray-300 text-gray-500'}`}
        >
          All
        </button>
        {categoriesInData.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-all ${activeCategory === cat ? 'border-black text-black' : 'border-gray-300 text-gray-500'}`}
          >
            {prettyCategoryName(cat)}
          </button>
        ))}
      </div>

      {/* Categories */}
      <main className="px-6 md:px-12 pb-24 space-y-24 max-w-[1600px] mx-auto">
        {stockProducts.length > 0 && (
          <CategorySection id="stock" title="Stock Products" products={stockProducts} />
        )}

        {customProducts.length > 0 && (
          <CategorySection id="custom" title="Custom Products" products={customProducts} />
        )}

        {sketchProducts.length > 0 && (
          <CategorySection id="sketch" title="Sketch Products" products={sketchProducts} />
        )}

        {otherProducts.length > 0 && (
          <CategorySection id="other" title="Other Products" products={otherProducts} />
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No products found matching your search.
          </div>
        )}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            CATEGORY NAV ITEM                                */
/* -------------------------------------------------------------------------- */

interface CategoryNavItemProps {
  category: string;
  isActive: boolean;
  activeSubcategory: string | null;
  onCategoryClick: (cat: string) => void;
  onSubcategoryClick: (sub: string) => void;
}

const CategoryNavItem = memo(function CategoryNavItem({
  category,
  isActive,
  activeSubcategory,
  onCategoryClick,
  onSubcategoryClick,
}: CategoryNavItemProps) {
  const subcategories = CATEGORY_SUBCATEGORY_MAP[category] ?? [];
  const prettyName = prettyCategoryName(category);

  return (
    <div className="relative group">
      <button
        onClick={() => onCategoryClick(category)}
        className={`flex items-center gap-1 transition-colors ${isActive ? 'text-black' : 'hover:text-black'}`}
      >
        {prettyName}
        {subcategories.length > 0 && (
          <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Subcategory dropdown */}
      {subcategories.length > 0 && (
        <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="bg-white border border-[#EAEAEA] shadow-lg min-w-[200px] py-2">
            {subcategories.map(sub => (
              <button
                key={sub}
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryClick(category);
                  onSubcategoryClick(sub);
                }}
                className={`block w-full text-left px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                  isActive && activeSubcategory === sub
                    ? 'text-black bg-gray-50 font-semibold'
                    : 'text-gray-500 hover:text-black hover:bg-gray-50'
                }`}
              >
                {prettySubName(sub)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

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

      <div className="product-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
        {products.map((product) => (
          <div key={product.parent_sku} className="product-card group relative">
            <DisplayCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
});