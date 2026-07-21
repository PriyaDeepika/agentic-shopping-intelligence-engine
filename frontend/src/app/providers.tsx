"use client";
import React from "react";
import { CartProvider } from "@/lib/hooks/useCart";
import { WishlistProvider } from "@/lib/hooks/useWishlist";
import FloatingAssistant from "@/components/ai/FloatingAssistant";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        {children}
        <FloatingAssistant />
      </WishlistProvider>
    </CartProvider>
  );
}
