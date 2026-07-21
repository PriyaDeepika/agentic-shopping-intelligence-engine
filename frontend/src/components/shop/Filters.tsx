"use client";
import { X } from "lucide-react";
import type { Facets, FilterState } from "@/lib/catalog";
import { formatINR } from "@/lib/utils";

interface Props {
  facets: Facets;
  value: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
}

function FacetGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected?: string;
  onSelect: (v?: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(selected === opt ? undefined : opt)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
              selected === opt
                ? "bg-ink text-white border-ink"
                : "bg-white text-ink/70 border-line hover:border-ink/40"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Filters({ facets, value, onChange, onClear }: Props) {
  const activeCount = [
    value.category,
    value.gender,
    value.articleType,
    value.color,
    value.usage,
    value.season,
  ].filter(Boolean).length;

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold">Filters</p>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-ink/50 flex items-center gap-1 hover:text-ink"
          >
            <X size={12} /> Clear ({activeCount})
          </button>
        )}
      </div>

      <FacetGroup
        label="Gender"
        options={facets.genders}
        selected={value.gender}
        onSelect={(v) => onChange({ ...value, gender: v })}
      />
      <FacetGroup
        label="Category"
        options={facets.categories}
        selected={value.category}
        onSelect={(v) => onChange({ ...value, category: v })}
      />
      <FacetGroup
        label="Article type"
        options={facets.articleTypes}
        selected={value.articleType}
        onSelect={(v) => onChange({ ...value, articleType: v })}
      />
      <FacetGroup
        label="Colour"
        options={facets.colors}
        selected={value.color}
        onSelect={(v) => onChange({ ...value, color: v })}
      />
      <FacetGroup
        label="Usage"
        options={facets.usages}
        selected={value.usage}
        onSelect={(v) => onChange({ ...value, usage: v })}
      />
      <FacetGroup
        label="Season"
        options={facets.seasons}
        selected={value.season}
        onSelect={(v) => onChange({ ...value, season: v })}
      />

      <div className="mb-2">
        <p className="text-sm font-semibold mb-2">Price</p>
        <p className="text-xs text-ink/50 mb-2">
          {formatINR(facets.priceRange[0])} – {formatINR(facets.priceRange[1])}
        </p>
        <input
          type="range"
          min={facets.priceRange[0]}
          max={facets.priceRange[1]}
          value={value.maxPrice ?? facets.priceRange[1]}
          onChange={(e) => onChange({ ...value, maxPrice: Number(e.target.value) })}
          className="w-full accent-ink"
        />
      </div>
    </aside>
  );
}
