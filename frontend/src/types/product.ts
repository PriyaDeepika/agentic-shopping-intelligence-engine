export interface UIProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  brand: string;
  category: string;
  subcategory: string;
  color: string;
  style: string;
  gender: string;
  season: string;
  usage: string;
  tags: string[];
  description: string;
  sizes: string[];
  image: string;
  inventory: number;
  discountPct: number;
  rating: number;
}

const GENDERS = ["men", "women", "boys", "girls", "unisex"];
const SEASONS = ["summer", "winter", "fall", "spring"];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickFromTags(tags: string[], pool: string[], fallback: string): string {
  const hit = tags.find((t) => pool.includes(t.toLowerCase()));
  return hit ? hit : fallback;
}

export function toUIProduct(p: {
  id: string;
  name: string;
  price: number;
  brand: string;
  category: string;
  subcategory: string;
  color: string;
  style: string;
  occasion: string[];
  tags: string[];
  description: string;
  sizes: string[];
  image_url: string;
  inventory: number;
  discount: number;
  rating: number;
}): UIProduct {
  const tags = p.tags.map((t) => t.toLowerCase());
  return {
    id: p.id,
    name: p.name,
    slug: slugify(p.name),
    price: p.price,
    finalPrice: Math.round(p.price * (1 - p.discount)),
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    color: p.color,
    style: p.style,
    gender: pickFromTags(tags, GENDERS, "unisex"),
    season: pickFromTags(tags, SEASONS, ""),
    usage: p.occasion[0] || "Casual",
    tags,
    description: p.description,
    sizes: p.sizes,
    image: p.image_url,
    inventory: p.inventory,
    discountPct: Math.round(p.discount * 100),
    rating: p.rating,
  };
}
