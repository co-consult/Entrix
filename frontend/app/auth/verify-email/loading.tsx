import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function VerifyEmailLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-40 mx-auto animate-pulse" />
          <div className="h-4 bg-muted rounded w-56 mx-auto animate-pulse" />
        </div>

        <LoadingSpinner size="lg" />

        <div className="h-4 bg-muted rounded w-48 mx-auto animate-pulse" />
      </div>
    </div>
  )
}
