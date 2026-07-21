import { cn } from "@/lib/utils";
import ProductSuggestion from "@/components/ai/ProductSuggestion";
import AgentTimeline from "@/components/ai/AgentTimeline";
import type { ChatMessage as ChatMessageT } from "@/lib/hooks/useChat";

export default function ChatMessage({ message }: { message: ChatMessageT }) {
  const isUser = message.role === "user";

  const reasonFor = (productId: string): string | undefined =>
    message.explanations?.find((e) => e.product_id === productId)?.reasons?.[0];

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-ink text-white rounded-br-sm"
            : message.isError
            ? "bg-red-50 text-red-700 rounded-bl-sm"
            : "bg-panel text-ink rounded-bl-sm"
        )}
      >
        {message.text}
      </div>

      {message.products && message.products.length > 0 && (
        <div className="mt-2 -mx-1 flex gap-3 overflow-x-auto pb-1 max-w-full px-1">
          {message.products.map((item) => (
            <ProductSuggestion
              key={item.product.id}
              product={item.product}
              reason={reasonFor(item.product.id)}
            />
          ))}
        </div>
      )}

      {!isUser && !message.isError && message.agentTimeline && (
        <AgentTimeline timeline={message.agentTimeline} />
      )}
    </div>
  );
}
