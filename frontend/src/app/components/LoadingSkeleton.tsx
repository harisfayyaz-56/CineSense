export function MovieCardSkeleton() {
  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[2/3] bg-zinc-800" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-800 rounded w-1/2" />
        <div className="flex gap-1">
          <div className="h-6 bg-zinc-800 rounded w-16" />
          <div className="h-6 bg-zinc-800 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-zinc-900 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-zinc-800 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-8 bg-zinc-800 rounded w-48" />
              <div className="h-4 bg-zinc-800 rounded w-64" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
