'use client';

import { Input } from "@/components/ui/input";
import { useState } from "react";
import DisplayCard from "@/components/custom/DisplayCard";
import Image from "next/image";

export default function  ExplorePage({ products }: { products: any[] }) {
  const [query, setQuery] = useState('');

    const filtered = products.filter(p =>
        (p?.title ?? "").toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className="w-full">
      <nav className="border-b border-[#E9EAEB] px-5 py-3 flex items-center justify-between">
        <Image src="/ud-logo.svg" alt="Logo" width={60} height={24} />
        <Input
          type="input"
          placeholder="Search..."
          className="max-w-lg sm:max-w-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </nav>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-5">
        {filtered.map((product) => (
          <div key={product.parent_sku}>
            <DisplayCard key={product.parent_sku} product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}