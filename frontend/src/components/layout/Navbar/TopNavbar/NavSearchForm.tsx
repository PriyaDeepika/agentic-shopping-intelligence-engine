"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import InputGroup from "@/components/ui/input-group";

const NavSearchForm = ({ className }: { className?: string }) => {
  const [value, setValue] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      router.push(`/shop?q=${encodeURIComponent(value.trim())}`);
    } else {
      router.push("/shop");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <InputGroup className="bg-[#F0F0F0]">
        <InputGroup.Text>
          <Image
            priority
            src="/icons/search.svg"
            height={20}
            width={20}
            alt="search"
            className="min-w-5 min-h-5"
          />
        </InputGroup.Text>
        <InputGroup.Input
          type="search"
          name="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search for products..."
          className="bg-transparent placeholder:text-black/40"
        />
      </InputGroup>
    </form>
  );
};

export default NavSearchForm;
