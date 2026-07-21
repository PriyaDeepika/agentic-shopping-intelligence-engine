import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-frame mx-auto px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold mb-3">Page not found</h1>
      <p className="text-ink/50 mb-6">That product or page doesn&apos;t exist.</p>
      <Link href="/shop" className="inline-block bg-ink text-white px-6 py-3 rounded-full font-medium">
        Back to shop
      </Link>
    </main>
  );
}
