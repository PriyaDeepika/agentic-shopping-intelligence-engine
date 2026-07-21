import { CHAT_PROGRESS_STAGES } from "@/lib/hooks/useChat";

export default function TypingIndicator({ stage }: { stage: number }) {
  return (
    <div className="inline-flex items-center gap-2 bg-panel rounded-2xl rounded-bl-sm px-3 py-2">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-ink/40 animate-bounce" />
      </span>
      <span className="text-xs text-ink/50">{CHAT_PROGRESS_STAGES[stage]}</span>
    </div>
  );
}
