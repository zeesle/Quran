#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

node /home/runner/workspace/scripts/github-push.mjs
