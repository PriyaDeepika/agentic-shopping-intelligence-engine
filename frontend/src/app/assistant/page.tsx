import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import AssistantTabs from "@/components/assistant/AssistantTabs";

export const metadata = {
  title: "AI Stylist — TEEZ.LO",
  description: "Get AI-powered outfit recommendations, wardrobe insights, and budget optimization.",
};

export default function AssistantPage() {
  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1
            className={cn([
              integralCF.className,
              "text-[32px] md:text-5xl uppercase mb-3",
            ])}
          >
            AI Stylist
          </h1>
          <p className="text-black/60 text-sm md:text-base">
            Powered by the Agentic Shopping Intelligence Engine — get outfit
            recommendations, track your wardrobe, and optimize your cart to a budget.
            You can also chat with the stylist any time using the button in the
            bottom-right corner.
          </p>
        </div>
        <AssistantTabs />
      </div>
    </main>
  );
}
