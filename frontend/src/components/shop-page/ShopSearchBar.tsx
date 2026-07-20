"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FiSearch } from "react-icons/fi";

const ShopSearchBar = ({ initialQuery }: { initialQuery?: string }) => {
  const [value, setValue] = useState(initialQuery ?? "");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products…"
        className="w-full rounded-full border border-black/10 bg-[#F0F0F0] pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 transition-shadow"
        aria-label="Search products"
      />
    </form>
  );
};

export default ShopSearchBar;
