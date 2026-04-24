#!/usr/bin/env node
// Pushes to GitHub after each task merge.
// Tries GH_PAT first, then falls back to GITHUB_TOKEN.
// Credentials are injected into the remote URL only for the duration of the push
// (never persisted to .git/config). The remote URL is restored to the clean form
// immediately after, whether the push succeeds or fails.

import { execFileSync, spawnSync } from "child_process";

const GITHUB_REPO = "zeesle/Quran";
const GITHUB_REMOTE_URL = `https://github.com/${GITHUB_REPO}.git`;
const REMOTE_NAME = "github";

function setRemote(url) {
  try {
    execFileSync("git", ["remote", "get-url", REMOTE_NAME], { stdio: "pipe" });
    execFileSync("git", ["remote", "set-url", REMOTE_NAME, url], { stdio: "pipe" });
  } catch {
    execFileSync("git", ["remote", "add", REMOTE_NAME, url], { stdio: "pipe" });
  }
}

async function testTokenAccess(token) {
  const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
    headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
  });
  if (!resp.ok) return false;
  const data = await resp.json();
  // Classic PATs include a permissions object; fine-grained PATs do not.
  if (data.permissions !== undefined) {
    return data.permissions.push === true;
  }
  // Fine-grained PAT: if we can read the repo, assume write (will fail at push if not).
  return true;
}

function gitPushWithToken(token) {
  // Temporarily embed the token in the remote URL for the push only.
  // This bypasses all credential helpers (including Replit's injected GIT_ASKPASS).
  const authedUrl = `https://x-access-token:${token}@github.com/${GITHUB_REPO}.git`;
  setRemote(authedUrl);
  try {
    // Use --force to ensure Replit is always the source of truth.
    // Remote may have diverged if the repo was initialised separately.
    const result = spawnSync(
      "git",
      ["-c", "credential.helper=", "push", "--force", REMOTE_NAME, "main"],
      { encoding: "utf8", stdio: "pipe" }
    );
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    const out = (result.stdout || "") + (result.stderr || "");
    return result.status === 0 || out.includes("Everything up-to-date");
  } finally {
    // Always restore the clean (token-free) remote URL.
    setRemote(GITHUB_REMOTE_URL);
  }
}

async function main() {
  // Prefer GH_PAT (user-supplied fine-grained PAT scoped to zeesle/Quran, Contents: write).
  // Fall back to GITHUB_TOKEN (Replit's OAuth token — works if org allows it).
  const candidates = [
    { name: "GH_PAT", value: (process.env.GH_PAT || "").replace(/\s+/g, "") },
    { name: "GITHUB_TOKEN", value: (process.env.GITHUB_TOKEN || "").replace(/\s+/g, "") },
  ].filter((c) => c.value.length > 0);

  if (candidates.length === 0) {
    console.error("ERROR: No GitHub token available. Set GH_PAT or GITHUB_TOKEN secret.");
    process.exit(1);
  }

  // Ensure remote exists with clean URL before we start.
  setRemote(GITHUB_REMOTE_URL);

  for (const { name, value } of candidates) {
    const hasAccess = await testTokenAccess(value);
    if (!hasAccess) {
      console.log(`${name}: no push access to ${GITHUB_REPO}, skipping.`);
      continue;
    }
    console.log(`Using ${name} for GitHub push ...`);
    if (gitPushWithToken(value)) {
      console.log("GitHub push succeeded.");
      return;
    }
    console.error(`${name}: push attempt failed.`);
  }

  console.error(`ERROR: GitHub push to ${GITHUB_REPO} failed with all available tokens.`);
  process.exit(1);
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
