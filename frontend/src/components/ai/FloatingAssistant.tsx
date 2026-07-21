"use client";
import { useEffect, useState } from "react";
import * as motion from "framer-motion/client";
import { AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import ChatDrawer from "@/components/ai/ChatDrawer";
import { useChat } from "@/lib/hooks/useChat";

// Other parts of the site (the product page's "Ask AI about this product"
// button, the shop page's search-fallback) open the assistant and send a
// message via this event, so they don't need to import/mount their own copy
// of the chat state or reach into this component's props.
export const ASK_AI_EVENT = "ai:ask";

export function askAI(message: string) {
  window.dispatchEvent(new CustomEvent<string>(ASK_AI_EVENT, { detail: message }));
}

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const chatState = useChat();

  useEffect(() => {
    const handler = (e: Event) => {
      const message = (e as CustomEvent<string>).detail;
      if (!message) return;
      setOpen(true);
      setMinimized(false);
      chatState.send(message);
    };
    window.addEventListener(ASK_AI_EVENT, handler);
    return () => window.removeEventListener(ASK_AI_EVENT, handler);
    // chatState.send is stable across renders (useCallback with no deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            setOpen(true);
            setMinimized(false);
          }
        }}
        aria-label={open ? "Close AI stylist" : "Open AI stylist"}
        className="fixed bottom-5 right-5 z-[999] h-14 w-14 rounded-full bg-ink text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform animate-[float_3s_ease-in-out_infinite]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X size={22} /> : <Sparkles size={22} />}
          </motion.span>
        </AnimatePresence>
      </button>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>

      <AnimatePresence>
        {open && (
          <ChatDrawer
            chatState={chatState}
            minimized={minimized}
            onMinimizeToggle={() => setMinimized((v) => !v)}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
