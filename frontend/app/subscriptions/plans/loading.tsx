export default function SubscriptionPlansLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-10 bg-muted rounded w-80 mb-4 animate-pulse" />
          <div className="h-6 bg-muted rounded w-96 animate-pulse" />
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 bg-muted rounded flex-1 animate-pulse" />
            <div className="h-10 bg-muted rounded w-40 animate-pulse" />
            <div className="h-10 bg-muted rounded w-32 animate-pulse" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-muted rounded w-32" />
                <div className="h-5 bg-muted rounded w-16" />
              </div>
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="text-center space-y-2">
                <div className="h-8 bg-muted rounded w-20 mx-auto" />
                <div className="h-4 bg-muted rounded w-16 mx-auto" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
              <div className="space-y-2">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
