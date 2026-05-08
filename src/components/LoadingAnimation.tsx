import { Skeleton } from "@/components/ui/skeleton";

const LoadingAnimation = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <Skeleton className="h-5 w-32 mx-auto rounded-full" />
        <Skeleton className="h-10 w-80 mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="space-y-4">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-border/30 space-y-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingAnimation;
