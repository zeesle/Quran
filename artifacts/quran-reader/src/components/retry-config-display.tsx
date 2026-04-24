import { useQuery } from "@tanstack/react-query"
import { getGetPushConfigQueryOptions } from "@workspace/api-client-react"

export function RetryConfigDisplay() {
  const { data, isLoading, isError } = useQuery({
    ...getGetPushConfigQueryOptions(),
    staleTime: 5 * 60_000,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex gap-4">
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        <div className="h-3 w-20 rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <p className="text-xs text-muted-foreground italic">Config unavailable.</p>
    )
  }

  return (
    <div
      data-testid="retry-config-display"
      className="flex flex-col gap-1 text-xs"
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Max retries</span>
        <span className="font-mono font-medium tabular-nums" data-testid="max-retries-value">
          {data.maxRetries}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Retry delay</span>
        <span className="font-mono font-medium tabular-nums" data-testid="retry-delay-value">
          {data.retryDelayMs >= 1000
            ? `${data.retryDelayMs / 1000}s`
            : `${data.retryDelayMs}ms`}
        </span>
      </div>
    </div>
  )
}
