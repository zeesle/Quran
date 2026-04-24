#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

node /home/runner/workspace/scripts/github-push.mjs || echo "WARNING: GitHub push failed after all retries — continuing post-merge steps."
