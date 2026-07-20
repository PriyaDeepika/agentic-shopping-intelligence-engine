"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ShopPagination = ({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  return (
    <Pagination className="justify-between">
      <PaginationPrevious
        href="#"
        onClick={(e) => {
          e.preventDefault();
          goTo(currentPage - 1);
        }}
        className={`border border-black/10 ${
          currentPage <= 1 ? "pointer-events-none opacity-40" : ""
        }`}
      />
      <PaginationContent>
        {pages.map((p, i) => (
          <PaginationItem key={p}>
            {i > 0 && pages[i - 1] !== p - 1 && (
              <span className="px-1 text-black/40">…</span>
            )}
            <PaginationLink
              href="#"
              isActive={p === currentPage}
              onClick={(e) => {
                e.preventDefault();
                goTo(p);
              }}
              className="text-black/50 font-medium text-sm"
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
      </PaginationContent>
      <PaginationNext
        href="#"
        onClick={(e) => {
          e.preventDefault();
          goTo(currentPage + 1);
        }}
        className={`border border-black/10 ${
          currentPage >= totalPages ? "pointer-events-none opacity-40" : ""
        }`}
      />
    </Pagination>
  );
};

export default ShopPagination;
