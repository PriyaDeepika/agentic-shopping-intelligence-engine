"use client";
import { useState } from "react";
import { ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentTrace } from "@/lib/api/types";

export default function AgentTimeline({ timeline }: { timeline: AgentTrace[] }) {
  const [open, setOpen] = useState(false);
  if (!timeline || timeline.length === 0) return null;

  const totalMs = Math.round(timeline.reduce((s, t) => s + t.duration_seconds, 0) * 1000);

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[10px] text-ink/40 hover:text-ink/60"
      >
        <ChevronDown size={11} className={cn("transition-transform", open && "rotate-180")} />
        {timeline.length} agent{timeline.length > 1 ? "s" : ""} · {totalMs}ms
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1 border-l border-line pl-2.5">
          {timeline.map((t, i) => (
            <li key={i} className="text-[10px] text-ink/50">
              <div className="flex items-center gap-1.5">
                {t.success ? (
                  <CheckCircle2 size={10} className="text-green-600 shrink-0" />
                ) : (
                  <XCircle size={10} className="text-red-500 shrink-0" />
                )}
                <span className="font-medium text-ink/70">{t.agent}</span>
                <span className="text-ink/35">{Math.round(t.duration_seconds * 1000)}ms</span>
              </div>
              {t.reasoning_summary && <p className="pl-4 text-ink/40">{t.reasoning_summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
