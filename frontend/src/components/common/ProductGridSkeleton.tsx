const ProductGridSkeleton = ({
  title,
  count = 4,
}: {
  title: string;
  count?: number;
}) => {
  return (
    <div className="max-w-frame mx-auto px-4 xl:px-0">
      <h2 className="font-integralCF text-[32px] md:text-5xl mb-5 md:mb-10 text-center capitalize animate-pulse text-black/20">
        {title}
      </h2>
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-2 animate-pulse">
            <div className="bg-black/10 rounded-[13px] w-full aspect-square" />
            <div className="h-4 bg-black/10 rounded w-3/4" />
            <div className="h-4 bg-black/10 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGridSkeleton;
