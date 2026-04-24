import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getGetPushStatusQueryOptions } from "@workspace/api-client-react"
import type { PushHistoryEntry } from "@workspace/api-client-react"

interface DotProps {
  entry: PushHistoryEntry
  index: number
}

function HistoryDot({ entry, index }: DotProps) {
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const tooltip = hovered || pinned
  const isSuccess = entry.status === "success"

  const formattedTime = (() => {
    try {
      return new Date(entry.timestamp).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return entry.timestamp
    }
  })()

  function handleClick() {
    setPinned((prev) => !prev)
  }

  return (
    <div className="relative" data-testid={`sync-dot-${index}`}>
      <button
        type="button"
        aria-label={`Sync attempt ${index + 1}: ${entry.status} at ${formattedTime}`}
        aria-pressed={pinned}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={handleClick}
        className={`w-3 h-3 rounded-full border transition-transform hover:scale-125 focus:scale-125 focus:outline-none ${
          isSuccess
            ? "bg-emerald-500 border-emerald-600"
            : "bg-destructive border-destructive/80"
        }`}
      />
      {tooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-max max-w-[180px] rounded-md bg-popover text-popover-foreground border border-border shadow-md px-2.5 py-1.5 text-[11px] leading-tight pointer-events-none"
        >
          <p className={`font-semibold ${isSuccess ? "text-emerald-600" : "text-destructive"}`}>
            {isSuccess ? "Success" : "Failed"}
          </p>
          <p className="text-muted-foreground mt-0.5">{formattedTime}</p>
          {entry.token && (
            <p className="text-muted-foreground font-mono truncate">{entry.token}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function SyncHistoryChart() {
  const { data, isLoading } = useQuery({
    ...getGetPushStatusQueryOptions(),
    refetchInterval: 60_000,
    retry: false,
    staleTime: 30_000,
  })

  const history = data?.history

  if (isLoading) {
    return (
      <div className="flex gap-1.5 items-center h-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-muted animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No sync history yet.</p>
    )
  }

  const successCount = history.filter((e) => e.status === "success").length
  const failCount = history.length - successCount

  return (
    <div data-testid="sync-history-chart">
      <div className="flex gap-1.5 items-center flex-wrap">
        {history.map((entry, i) => (
          <HistoryDot key={`${entry.timestamp}-${i}`} entry={entry} index={i} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">
        {successCount} succeeded · {failCount} failed · last {history.length} push
        {history.length === 1 ? "" : "es"}
      </p>
    </div>
  )
}
