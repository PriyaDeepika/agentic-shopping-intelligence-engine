import { redirect } from "next/navigation";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = decodeURIComponent(slug).replace(/-/g, " ");
  redirect(`/shop?category=${encodeURIComponent(category)}`);
}
