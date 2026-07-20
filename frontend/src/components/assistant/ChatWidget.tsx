"use client";

import React, { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMessageCircle, FiX, FiSend } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import { sendChatMessage, ApiError } from "@/lib/api/client";
import { getUserId, getSessionId } from "@/lib/api/session";
import { toUIProduct } from "@/lib/api/adapters";
import { useToast } from "@/components/ui/Toast";
import SpinnerbLoader from "@/components/ui/SpinnerbLoader";
import type { CartSummary } from "@/lib/api/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  cart?: CartSummary;
}

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm your AI shopping stylist. Tell me what you're looking for — e.g. \"a minimal outfit for college under ₹3000\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-u`, role: "user", text: message },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage({
        user_id: getUserId(),
        session_id: getSessionId(),
        message,
      });
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-a`, role: "assistant", text: res.reply, cart: res.cart },
      ]);
    } catch (err) {
      const description = err instanceof ApiError ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-e`,
          role: "assistant",
          text: "Sorry, I couldn't reach the styling engine just now.",
        },
      ]);
      showToast({ variant: "error", title: "Chat failed", description });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[9998] h-14 w-14 rounded-full bg-black text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        aria-label={open ? "Close AI stylist chat" : "Open AI stylist chat"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <FiX size={22} /> : <FiMessageCircle size={22} />}
          </motion.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-[9998] w-[calc(100vw-2.5rem)] max-w-sm h-[520px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-black/10 flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3 bg-black text-white flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">AI Stylist</p>
                <p className="text-[11px] text-white/60">
                  Powered by the shopping-intelligence engine
                </p>
              </div>
              <Link
                href="/assistant"
                className="text-[11px] underline text-white/80 hover:text-white"
                onClick={() => setOpen(false)}
              >
                Full assistant →
              </Link>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm text-left ${
                      m.role === "user"
                        ? "bg-black text-white rounded-br-sm"
                        : "bg-[#F0F0F0] text-black rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.cart && m.cart.items.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.cart.items.slice(0, 3).map((item) => {
                        const ui = toUIProduct(item.product);
                        return (
                          <Link
                            key={item.product.id}
                            href={`/shop/product/${ui.id}/${ui.title.split(" ").join("-")}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-2 py-1.5 text-left hover:border-black/30 transition-colors"
                          >
                            <Image
                              src={ui.srcUrl}
                              width={32}
                              height={32}
                              alt={ui.title}
                              className="rounded object-cover w-8 h-8"
                            />
                            <span className="text-xs flex-1 truncate">{ui.title}</span>
                            <span className="text-xs font-semibold">${ui.price}</span>
                          </Link>
                        );
                      })}
                      {m.cart.items.length > 3 && (
                        <p className="text-[11px] text-black/50">
                          +{m.cart.items.length - 3} more item(s) — total $
                          {m.cart.total.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-left">
                  <div className="inline-flex items-center gap-2 bg-[#F0F0F0] rounded-2xl px-3 py-2 rounded-bl-sm">
                    <SpinnerbLoader className="w-4 border-2 border-black/20 border-r-black/60" />
                    <span className="text-xs text-black/50">Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-black/10 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for an outfit, budget, style…"
                className="flex-1 rounded-full border border-black/10 bg-[#F7F7F7] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                aria-label="Message the AI stylist"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-9 w-9 shrink-0 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-40"
                aria-label="Send message"
              >
                <FiSend size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
