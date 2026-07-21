"use client";
import { useRef, useState } from "react";
import { ImagePlus, Mic, SendHorizontal } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div className="border-t border-line p-3">
      <div className="flex items-end gap-2 bg-panel rounded-2xl px-3 py-2">
        {/* Voice input and image upload aren't wired up yet — the AI backend
            (app/api/routes_chat.py) only accepts a text `message` today.
            Kept as visible, disabled affordances rather than omitted so the
            UI communicates what's coming next instead of silently lacking
            the buttons the spec asked for. */}
        <button
          type="button"
          disabled
          aria-label="Voice input (coming soon)"
          title="Voice input — coming soon"
          className="shrink-0 text-ink/25 cursor-not-allowed mb-1.5"
        >
          <Mic size={17} />
        </button>
        <button
          type="button"
          disabled
          aria-label="Image upload (coming soon)"
          title="Image upload — coming soon"
          className="shrink-0 text-ink/25 cursor-not-allowed mb-1.5"
        >
          <ImagePlus size={17} />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Ask for an outfit, budget, style…"
          aria-label="Message the AI stylist"
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed py-1.5 focus:outline-none placeholder:text-ink/35 max-h-24"
        />

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="shrink-0 w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center disabled:opacity-30 transition-opacity"
        >
          <SendHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
