#!/bin/bash
set -e
export CI=true
pnpm install --frozen-lockfile
pnpm --filter db push

node /home/runner/workspace/scripts/github-push.mjs || echo "WARNING: GitHub push failed after all retries — continuing post-merge steps."

# Sync the auto-detected token expiry date to GH_PAT_EXPIRES.
# github-push.mjs reads the expiry from the GitHub API response header and writes
# a flag file; this script queues it for the Replit env-var API on the next agent run.
node /home/runner/workspace/scripts/sync-pat-expiry.mjs || true

# Check for token expiry and write a task-creation request if within the warning window.
# The project task itself is created by the agent via code_execution after post-merge.
node /home/runner/workspace/scripts/ensure-expiry-task.mjs || true
