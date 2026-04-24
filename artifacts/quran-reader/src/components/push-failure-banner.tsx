import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getGetPushStatusQueryOptions } from "@workspace/api-client-react";

const STORAGE_KEY = "dismissedSyncFailure";
const EXPIRY_STORAGE_KEY = "dismissedExpiryUpdate";
const FLAKY_STORAGE_KEY = "dismissedFlakyHistory";

const FLAKY_HISTORY_WINDOW = 5;
const FLAKY_HISTORY_THRESHOLD = 3;

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

function getDismissedExpiryKey(): string | null {
  try {
    return localStorage.getItem(EXPIRY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setDismissedExpiryKey(key: string): void {
  try {
    localStorage.setItem(EXPIRY_STORAGE_KEY, key);
  } catch {
  }
}

function getDismissedFlakyKey(): string | null {
  try {
    return localStorage.getItem(FLAKY_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistDismissedFlakyKey(key: string): void {
  try {
    localStorage.setItem(FLAKY_STORAGE_KEY, key);
  } catch {
  }
}

function buildHistorySummary(
  history: Array<{ status: string }> | null | undefined
): string | null {
  if (!history || history.length < 2) return null;
  const window = history.slice(-FLAKY_HISTORY_WINDOW);
  const failCount = window.filter((e) => e.status === "failed").length;
  if (failCount === 0) return null;
  return `${failCount} of the last ${window.length} sync${window.length === 1 ? "" : "s"} failed`;
}

function buildFlakySummary(
  history: Array<{ status: string }> | null | undefined
): string | null {
  if (!history || history.length < 2) return null;
  const window = history.slice(-FLAKY_HISTORY_WINDOW);
  const failCount = window.filter((e) => e.status === "failed").length;
  if (failCount < FLAKY_HISTORY_THRESHOLD) return null;
  return `${failCount} of the last ${window.length} sync${window.length === 1 ? "" : "s"} failed`;
}

export function PushFailureBanner() {
  const [dismissedKey, setDismissedKey] = useState<string | null>(
    () => getDismissedTimestamp()
  );
  const [dismissedExpiry, setDismissedExpiry] = useState<string | null>(
    () => getDismissedExpiryKey()
  );
  const [dismissedFlakyKey, setDismissedFlakyKey] = useState<string | null>(
    () => getDismissedFlakyKey()
  );

  const { data } = useQuery({
    ...getGetPushStatusQueryOptions(),
    refetchInterval: 60_000,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data?.status && data.status !== "failed") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
      }
      setDismissedKey(null);
    }
  }, [data?.status]);

  const showFailure =
    data?.status === "failed" &&
    dismissedKey !== (data.failedAt ?? "unknown");

  const isExpiryApplied =
    !!data?.tokenExpiryAppliedAt &&
    (!data?.tokenExpiryAutoUpdatedAt ||
      data.tokenExpiryAppliedAt >= data.tokenExpiryAutoUpdatedAt);

  const expiryUpdateKey = data?.tokenExpiryAutoUpdatedTo
    ? `${data.tokenExpiryAutoUpdatedTo}__${data.tokenExpiryAutoUpdatedAt ?? ""}__${isExpiryApplied ? "applied" : "pending"}`
    : null;
  const showExpiryUpdate =
    expiryUpdateKey !== null && dismissedExpiry !== expiryUpdateKey;

  const latestHistoryTimestamp = data?.history?.length
    ? data.history[data.history.length - 1].timestamp
    : null;
  const flakyKey = data?.status === "success"
    ? (data.pushedAt ?? latestHistoryTimestamp ?? null)
    : null;
  const flakySummary = data?.status === "success"
    ? buildFlakySummary(data?.history)
    : null;
  const showFlakyWarning =
    flakyKey !== null &&
    flakySummary !== null &&
    dismissedFlakyKey !== flakyKey;

  if (!showFailure && !showExpiryUpdate && !showFlakyWarning) return null;

  const failureKey = data?.failedAt ?? "unknown";
  const failedAt = data?.failedAt
    ? new Date(data.failedAt).toLocaleString()
    : null;
  const historySummary = buildHistorySummary(data?.history);
  const expiryUpdatedAt = data?.tokenExpiryAutoUpdatedAt
    ? new Date(data.tokenExpiryAutoUpdatedAt).toLocaleString()
    : null;
  const expiryAppliedAt = data?.tokenExpiryAppliedAt
    ? new Date(data.tokenExpiryAppliedAt).toLocaleString()
    : null;

  function handleDismissFailure() {
    setDismissedTimestamp(failureKey);
    setDismissedKey(failureKey);
  }

  function handleDismissExpiry() {
    if (expiryUpdateKey) {
      setDismissedExpiryKey(expiryUpdateKey);
      setDismissedExpiry(expiryUpdateKey);
    }
  }

  function handleDismissFlaky() {
    if (flakyKey) {
      persistDismissedFlakyKey(flakyKey);
      setDismissedFlakyKey(flakyKey);
    }
  }

  return (
    <>
      {showFailure && (
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
            onClick={handleDismissFailure}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {showFlakyWarning && !showFailure && (
        <div
          role="status"
          className="w-full bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2.5 flex items-start gap-3"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
          <p className="flex-1 text-sm leading-snug">
            <span className="font-semibold">Sync history has frequent failures.</span>{" "}
            The last push succeeded, but {flakySummary?.toLowerCase()}.{" "}
            Your GitHub token may be intermittently invalid.
          </p>
          <button
            aria-label="Dismiss flaky sync warning"
            onClick={handleDismissFlaky}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {showExpiryUpdate && (
        <div
          role="status"
          className="w-full bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2.5 flex items-start gap-3"
        >
          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="flex-1 text-sm leading-snug">
            {isExpiryApplied ? (
              <>
                <span className="font-semibold">Token expiry applied</span>{" "}
                — GH_PAT_EXPIRES was set to{" "}
                <span className="font-mono">{data?.tokenExpiryAutoUpdatedTo}</span>
                {expiryAppliedAt ? ` on ${expiryAppliedAt}` : ""}.
              </>
            ) : (
              <>
                <span className="font-semibold">Token expiry detected</span>{" "}
                — a new expiry of{" "}
                <span className="font-mono">{data?.tokenExpiryAutoUpdatedTo}</span>
                {expiryUpdatedAt ? ` was detected on ${expiryUpdatedAt}` : ""}.{" "}
                GH_PAT_EXPIRES will be applied on the next agent run.
              </>
            )}
          </p>
          <button
            aria-label="Dismiss expiry update notice"
            onClick={handleDismissExpiry}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
