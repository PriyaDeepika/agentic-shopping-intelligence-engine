"use client";

import React, { useState } from "react";
import RecommendPanel from "./RecommendPanel";
import WardrobePanel from "./WardrobePanel";
import OptimizePanel from "./OptimizePanel";

const TABS = [
  { id: "recommend", label: "Get Recommendations" },
  { id: "wardrobe", label: "My Wardrobe" },
  { id: "optimize", label: "Budget Optimizer" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const AssistantTabs = () => {
  const [active, setActive] = useState<TabId>("recommend");

  return (
    <div>
      <div className="flex gap-1 mb-8 border-b border-black/10 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active === tab.id
                ? "border-black text-black"
                : "border-transparent text-black/50 hover:text-black/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active === "recommend" && <RecommendPanel />}
      {active === "wardrobe" && <WardrobePanel />}
      {active === "optimize" && <OptimizePanel />}
    </div>
  );
};

export default AssistantTabs;
