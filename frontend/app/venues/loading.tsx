export default function VenuesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-6 bg-muted rounded w-2/3 animate-pulse" />
          </div>

          {/* Search skeleton */}
          <div className="flex gap-4">
            <div className="h-10 bg-muted rounded flex-1 animate-pulse" />
            <div className="h-10 bg-muted rounded w-32 animate-pulse" />
            <div className="h-10 bg-muted rounded w-32 animate-pulse" />
          </div>

          {/* Grid skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
