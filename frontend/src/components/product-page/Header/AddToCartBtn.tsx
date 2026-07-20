"use client";

import { addToCart } from "@/lib/features/carts/cartsSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import { Product } from "@/types/product.types";
import { useToast } from "@/components/ui/Toast";
import React from "react";

const AddToCartBtn = ({
  data,
}: {
  data: Product & { quantity: number; backendId?: string };
}) => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { sizeSelection, colorSelection } = useAppSelector(
    (state: RootState) => state.products
  );

  return (
    <button
      type="button"
      className="bg-black w-full ml-3 sm:ml-5 rounded-full h-11 md:h-[52px] text-sm sm:text-base text-white hover:bg-black/80 transition-all"
      onClick={() => {
        dispatch(
          addToCart({
            id: data.id,
            name: data.title,
            srcUrl: data.srcUrl,
            price: data.price,
            attributes: [sizeSelection, colorSelection.name],
            discount: data.discount,
            quantity: data.quantity,
            backendId: data.backendId,
          })
        );
        showToast({
          variant: "success",
          title: "Added to cart",
          description: `${data.title} (${sizeSelection}, ${colorSelection.name})`,
        });
      }}
    >
      Add to Cart
    </button>
  );
};

export default AddToCartBtn;
