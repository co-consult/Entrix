import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 bg-muted rounded w-48 mx-auto animate-pulse" />
          <div className="h-4 bg-muted rounded w-64 mx-auto animate-pulse" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-40 animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>

        <div className="text-center">
          <LoadingSpinner />
        </div>
      </div>
    </div>
  )
}
