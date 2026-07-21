"use client";
import Link from "next/link";
import * as motion from "framer-motion/client";
import { ArrowRight } from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

export default function Hero({ productCount }: { productCount: number }) {
  return (
    <header className="bg-panel/60 pt-14 md:pt-20 pb-10 md:pb-0 overflow-hidden">
      <div className="max-w-frame mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-4 xl:px-0 items-center">
        <section>
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl lg:text-6xl leading-[1.05] font-bold mb-5"
          >
            Wear your own <span className="text-accent">story</span>, every day.
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-ink/60 max-w-md mb-8"
          >
            A curated catalog pulled straight from your own product data — browse,
            filter, and find pieces that actually match your style.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-ink text-white px-7 py-3.5 rounded-full font-medium hover:bg-ink/85 transition-colors"
            >
              Shop the collection <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="flex gap-8 mt-12"
          >
            <div>
              <p className="font-display text-3xl font-bold">
                <AnimatedCounter to={productCount} />+
              </p>
              <p className="text-xs text-ink/50">Products cataloged</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold">
                <AnimatedCounter to={12} />
              </p>
              <p className="text-xs text-ink/50">Categories</p>
            </div>
            <div>
              <p className="font-display text-3xl font-bold">
                <AnimatedCounter to={100} />%
              </p>
              <p className="text-xs text-ink/50">Your dataset</p>
            </div>
          </motion.div>
        </section>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative h-[320px] md:h-[420px]"
        >
          <div className="absolute inset-0 grid grid-cols-2 gap-3">
            <div className="bg-white/40 rounded-3xl animate-floatY" />
            <div className="bg-white/60 rounded-3xl mt-8 animate-floatY [animation-delay:1s]" />
          </div>
        </motion.div>
      </div>
    </header>
  );
}
