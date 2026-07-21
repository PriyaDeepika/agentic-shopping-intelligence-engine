import { AlertTriangle } from "lucide-react";

export default function OfflineBanner({ error }: { error?: string }) {
  return (
    <div className="max-w-frame mx-auto px-4 xl:px-0 mt-4">
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>
          Couldn&apos;t reach the backend at the moment{error ? ` (${error})` : ""}. Make
          sure the API server is running and NEXT_PUBLIC_API_URL is set correctly.
        </span>
      </div>
    </div>
  );
}
