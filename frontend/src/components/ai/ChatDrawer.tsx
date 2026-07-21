"use client";
import { useEffect, useRef } from "react";
import * as motion from "framer-motion/client";
import { AnimatePresence } from "framer-motion";
import { Minus, Sparkles, Trash2, X } from "lucide-react";
import ChatMessage from "@/components/ai/ChatMessage";
import ChatInput from "@/components/ai/ChatInput";
import TypingIndicator from "@/components/ai/TypingIndicator";
import { QUICK_PROMPTS, type useChat } from "@/lib/hooks/useChat";

interface ChatDrawerProps {
  chatState: ReturnType<typeof useChat>;
  minimized: boolean;
  onMinimizeToggle: () => void;
  onClose: () => void;
}

export default function ChatDrawer({
  chatState,
  minimized,
  onMinimizeToggle,
  onClose,
}: ChatDrawerProps) {
  const { messages, loading, progressStage, send, clear } = chatState;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (minimized) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, progressStage, minimized]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 32, y: 16 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 32, y: 16 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed bottom-24 right-5 z-[999] w-[calc(100vw-2.5rem)] max-w-sm bg-white rounded-3xl shadow-2xl border border-line flex flex-col overflow-hidden"
      style={{ height: minimized ? "auto" : "min(600px, 72vh)" }}
    >
      <div className="px-4 py-3.5 bg-ink text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} />
          <div>
            <p className="font-semibold text-sm leading-none">AI Stylist</p>
            <p className="text-[11px] text-white/50 mt-0.5">Ask me anything about your look</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clear}
            aria-label="Clear chat"
            title="Clear chat"
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onMinimizeToggle}
            aria-label={minimized ? "Expand chat" : "Minimize chat"}
            title={minimized ? "Expand" : "Minimize"}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close chat"
            title="Close"
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col flex-1 min-h-0"
          >
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {loading && <TypingIndicator stage={progressStage} />}
              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => send(p.message)}
                      className="text-[11px] bg-panel hover:bg-panel/70 text-ink/70 px-2.5 py-1.5 rounded-full transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ChatInput onSend={send} disabled={loading} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
