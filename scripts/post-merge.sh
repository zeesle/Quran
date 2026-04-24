#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

node /home/runner/workspace/scripts/github-push.mjs || echo "WARNING: GitHub push failed after all retries — continuing post-merge steps."

# Check for token expiry and write a task-creation request if within the warning window.
# The project task itself is created by the agent via code_execution after post-merge.
node /home/runner/workspace/scripts/ensure-expiry-task.mjs || true
