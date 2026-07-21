import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-panel/40">
      <div className="max-w-frame mx-auto px-4 xl:px-0 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <p className="font-display text-2xl font-bold mb-3">
            Thread<span className="text-accent">loop</span>
          </p>
          <p className="text-sm text-ink/60 max-w-xs">
            Every product on this site is generated from a live product dataset —
            swap the dataset and the whole catalog updates automatically.
          </p>
          <div className="flex gap-3 mt-5">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <span
                key={i}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-line"
              >
                <Icon size={16} />
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold text-sm mb-3">Shop</p>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><Link href="/shop?gender=women">Women</Link></li>
            <li><Link href="/shop?gender=men">Men</Link></li>
            <li><Link href="/shop">All products</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-sm mb-3">Help</p>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><Link href="/cart">Cart</Link></li>
            <li><Link href="/wishlist">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-sm mb-3">About</p>
          <ul className="space-y-2 text-sm text-ink/60">
            <li>Dataset-driven storefront</li>
            <li>Built with Next.js</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} Threadloop. Demo storefront for portfolio use.
      </div>
    </footer>
  );
}
