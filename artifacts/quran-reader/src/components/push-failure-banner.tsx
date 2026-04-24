import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getGetPushStatusQueryOptions } from "@workspace/api-client-react";

export function PushFailureBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery({
    ...getGetPushStatusQueryOptions(),
    refetchInterval: 60_000,
    retry: false,
    staleTime: 30_000,
  });

  if (dismissed || !data || data.status !== "failed") return null;

  const failedAt = data.failedAt
    ? new Date(data.failedAt).toLocaleString()
    : null;

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
        Check the post-merge logs and verify your GitHub token is valid.
      </p>
      <button
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
