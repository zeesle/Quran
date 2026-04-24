import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getGetPushStatusQueryOptions } from "@workspace/api-client-react";

const STORAGE_KEY = "dismissedSyncFailure";

function getDismissedTimestamp(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setDismissedTimestamp(timestamp: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, timestamp);
  } catch {
  }
}

function buildHistorySummary(
  history: Array<{ status: string }> | null | undefined
): string | null {
  if (!history || history.length < 2) return null;
  const window = history.slice(-5);
  const failCount = window.filter((e) => e.status === "failed").length;
  if (failCount === 0) return null;
  return `${failCount} of the last ${window.length} sync${window.length === 1 ? "" : "s"} failed`;
}

export function PushFailureBanner() {
  const [dismissedKey, setDismissedKey] = useState<string | null>(
    () => getDismissedTimestamp()
  );

  const { data } = useQuery({
    ...getGetPushStatusQueryOptions(),
    refetchInterval: 60_000,
    retry: false,
    staleTime: 30_000,
  });

  if (!data || data.status !== "failed") return null;

  const failureKey = data.failedAt ?? "unknown";

  if (dismissedKey === failureKey) return null;

  const failedAt = data.failedAt
    ? new Date(data.failedAt).toLocaleString()
    : null;

  const historySummary = buildHistorySummary(data.history);

  function handleDismiss() {
    setDismissedTimestamp(failureKey);
    setDismissedKey(failureKey);
  }

  return (
    <div
      role="alert"
      className="w-full bg-destructive/10 border-b border-destructive/30 text-destructive px-4 py-2.5 flex items-start gap-3"
    >
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <p className="flex-1 text-sm leading-snug">
        <span className="font-semibold">GitHub sync failed.</span>{" "}
        The last push to GitHub did not succeed
        {failedAt ? ` (${failedAt})` : ""}.{" "}
        {historySummary && (
          <span className="opacity-80">{historySummary}. </span>
        )}
        Check the post-merge logs and verify your GitHub token is valid.
      </p>
      <button
        aria-label="Dismiss"
        onClick={handleDismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
