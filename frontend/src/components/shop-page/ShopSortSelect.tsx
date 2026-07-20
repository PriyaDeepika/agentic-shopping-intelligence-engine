"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS = [
  { value: "featured", label: "Most Popular" },
  { value: "price_asc", label: "Low Price" },
  { value: "price_desc", label: "High Price" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
];

const ShopSortSelect = ({ currentSort }: { currentSort?: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center">
      Sort by:{" "}
      <Select defaultValue={currentSort ?? "featured"} onValueChange={handleChange}>
        <SelectTrigger className="font-medium text-sm px-1.5 sm:text-base w-fit text-black bg-transparent shadow-none border-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ShopSortSelect;
