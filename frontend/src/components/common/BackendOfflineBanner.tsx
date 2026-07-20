const BackendOfflineBanner = ({ error }: { error?: string }) => {
  return (
    <div className="max-w-frame mx-auto px-4 xl:px-0 mb-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm px-4 py-3">
        <strong className="font-semibold">AI backend unreachable.</strong>{" "}
        Showing sample data instead of the live catalog.
        {error ? <span className="opacity-70"> ({error})</span> : null}
      </div>
    </div>
  );
};

export default BackendOfflineBanner;
