import Image from "next/image";
import Link from "next/link";
import { toUIProduct } from "@/lib/api/adapters";
import type { CartSummary } from "@/lib/api/types";

const AgentResultCart = ({ cart }: { cart: CartSummary }) => {
  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-black/50">
        No items yet — the agent didn&apos;t find anything matching that request.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 overflow-hidden">
      <ul className="divide-y divide-black/5">
        {cart.items.map((item) => {
          const ui = toUIProduct(item.product);
          return (
            <li key={item.product.id} className="flex items-center gap-3 p-3">
              <Link
                href={`/shop/product/${ui.id}/${ui.title.split(" ").join("-")}`}
                className="shrink-0"
              >
                <Image
                  src={ui.srcUrl}
                  width={56}
                  height={56}
                  alt={ui.title}
                  className="rounded-lg object-cover w-14 h-14"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/shop/product/${ui.id}/${ui.title.split(" ").join("-")}`}
                  className="font-semibold text-sm truncate block hover:underline"
                >
                  {ui.title}
                </Link>
                <p className="text-xs text-black/50 truncate">
                  {item.product.brand} · {item.product.category} · qty {item.quantity}
                </p>
              </div>
              <span className="font-semibold text-sm shrink-0">
                ${(item.product.price * item.quantity).toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="bg-black/[0.03] px-4 py-3 space-y-1 text-sm">
        <div className="flex justify-between text-black/60">
          <span>Subtotal</span>
          <span>${cart.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-black/60">
          <span>Discount</span>
          <span className="text-green-700">-${cart.discount_total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-1 border-t border-black/10">
          <span>Total</span>
          <span>${cart.total.toFixed(2)}</span>
        </div>
        {cart.budget !== null && (
          <div
            className={`text-xs font-medium pt-1 ${
              cart.over_budget ? "text-red-600" : "text-green-700"
            }`}
          >
            {cart.over_budget
              ? `Over your $${cart.budget.toFixed(2)} budget`
              : `Within your $${cart.budget.toFixed(2)} budget`}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentResultCart;
