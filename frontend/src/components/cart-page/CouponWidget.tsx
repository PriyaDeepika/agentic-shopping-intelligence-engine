"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import InputGroup from "@/components/ui/input-group";
import { MdOutlineLocalOffer } from "react-icons/md";
import { findCoupons, ApiError } from "@/lib/api/client";
import { useToast } from "@/components/ui/Toast";
import SpinnerbLoader from "@/components/ui/SpinnerbLoader";
import type { Coupon } from "@/lib/api/types";

const CouponWidget = ({ cartTotal }: { cartTotal: number }) => {
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const { showToast } = useToast();

  const handleFindCoupons = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartTotal <= 0) {
      showToast({
        variant: "error",
        title: "Your cart is empty",
        description: "Add an item before checking for coupons.",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await findCoupons({ cart_total: cartTotal });
      setCoupons(res.applicable_coupons);
      if (res.applicable_coupons.length > 0) {
        showToast({
          variant: "success",
          title: `Found ${res.applicable_coupons.length} coupon(s)`,
          description: `Best savings: $${res.best_savings.toFixed(2)}`,
        });
      } else {
        showToast({
          variant: "info",
          title: "No coupons apply right now",
          description: "Add more items to unlock available offers.",
        });
      }
    } catch (err) {
      showToast({
        variant: "error",
        title: "Couldn't check coupons",
        description: err instanceof ApiError ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleFindCoupons} className="flex space-x-3">
        <InputGroup className="bg-[#F0F0F0]">
          <InputGroup.Text>
            <MdOutlineLocalOffer className="text-black/40 text-2xl" />
          </InputGroup.Text>
          <InputGroup.Input
            type="text"
            name="code"
            placeholder="Check available coupons"
            className="bg-transparent placeholder:text-black/40"
            readOnly
          />
        </InputGroup>
        <Button
          type="submit"
          disabled={loading}
          className="bg-black rounded-full w-full max-w-[119px] h-[48px] disabled:opacity-60"
        >
          {loading ? (
            <SpinnerbLoader className="w-5 border-2 border-white/30 border-r-white" />
          ) : (
            "Apply"
          )}
        </Button>
      </form>
      {coupons && coupons.length > 0 && (
        <ul className="space-y-2">
          {coupons.map((c) => (
            <li
              key={c.code}
              className="flex items-center justify-between rounded-lg border border-black/10 bg-black/[0.03] px-4 py-2 text-sm"
            >
              <div>
                <span className="font-bold">{c.code}</span>
                <span className="text-black/60 ml-2">{c.description}</span>
              </div>
              <span className="font-semibold text-green-700">
                -${c.savings.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CouponWidget;
