import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getGetPushStatusQueryOptions } from "@workspace/api-client-react"
import type { PushHistoryEntry } from "@workspace/api-client-react"

type FilterMode = "all" | "failures" | "successes"

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

const FILTER_OPTIONS: { label: string; value: FilterMode }[] = [
  { label: "All", value: "all" },
  { label: "Failures", value: "failures" },
  { label: "Successes", value: "successes" },
]

export function SyncHistoryChart() {
  const [filter, setFilter] = useState<FilterMode>("all")

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

  const filteredHistory = history.filter((e) => {
    if (filter === "failures") return e.status !== "success"
    if (filter === "successes") return e.status === "success"
    return true
  })

  const successCount = filteredHistory.filter((e) => e.status === "success").length
  const failCount = filteredHistory.length - successCount

  return (
    <div data-testid="sync-history-chart">
      <div className="flex items-center gap-1 mb-2" data-testid="sync-filter">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            aria-pressed={filter === opt.value}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
              filter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {filteredHistory.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No {filter === "failures" ? "failed" : "successful"} syncs in history.
        </p>
      ) : (
        <div className="flex gap-1.5 items-center flex-wrap">
          {filteredHistory.map((entry, i) => (
            <HistoryDot key={`${entry.timestamp}-${i}`} entry={entry} index={i} />
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1.5">
        {successCount} succeeded · {failCount} failed · {filteredHistory.length} of {history.length} push
        {history.length === 1 ? "" : "es"}
        {filter !== "all" && ` (${filter} only)`}
      </p>
    </div>
  )
}
