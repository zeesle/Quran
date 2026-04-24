#!/usr/bin/env node
// Pushes to GitHub after each task merge.
// Tries GH_PAT first, then falls back to GITHUB_TOKEN.
// Credentials are injected into the remote URL only for the duration of the push
// (never persisted to .git/config). The remote URL is restored to the clean form
// immediately after, whether the push succeeds or fails.
//
// Token expiry reminder: set GH_PAT_EXPIRES to the PAT's expiry date (YYYY-MM-DD).
// This script will warn when fewer than 30 days remain, and error if already expired.

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

// Returns:
//   true  — token confirmed to have push access
//   false — token definitively lacks access (401 / 403)
//   null  — transient error (network failure, 5xx, etc.); caller should still attempt push
async function testTokenAccess(token) {
  let resp;
  try {
    resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
    });
  } catch (err) {
    // Network-level failure — treat as transient, not as "no access".
    console.warn(`WARNING: GitHub API check failed with a network error (${err.message}). Will still attempt push.`);
    return null;
  }
  // Explicit auth/permission rejection — skip this token.
  if (resp.status === 401 || resp.status === 403) return false;
  // Any other non-OK response (5xx, rate-limit, etc.) — treat as transient.
  if (!resp.ok) {
    console.warn(`WARNING: GitHub API check returned HTTP ${resp.status}. Will still attempt push.`);
    return null;
  }
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

// Warn (or error) based on GH_PAT_EXPIRES (YYYY-MM-DD).
// WARN_DAYS_BEFORE: how many days ahead to start showing the reminder.
const WARN_DAYS_BEFORE = 30;

function checkTokenExpiry() {
  const raw = (process.env.GH_PAT_EXPIRES || "").trim();
  if (!raw) {
    console.log(
      "REMINDER: Set GH_PAT_EXPIRES (YYYY-MM-DD) so this script can warn you before the token lapses."
    );
    return;
  }

  const expiryMs = Date.parse(raw);
  if (isNaN(expiryMs)) {
    console.warn(`WARNING: GH_PAT_EXPIRES="${raw}" is not a valid date (use YYYY-MM-DD). Skipping expiry check.`);
    return;
  }

  const nowMs = Date.now();
  const daysRemaining = Math.ceil((expiryMs - nowMs) / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    console.error(
      `ERROR: GH_PAT expired on ${raw} (${Math.abs(daysRemaining)} day(s) ago). ` +
      "Create a new token at https://github.com/settings/tokens and update the GH_PAT secret."
    );
  } else if (daysRemaining <= WARN_DAYS_BEFORE) {
    console.warn(
      `WARNING: GH_PAT expires on ${raw} — only ${daysRemaining} day(s) remaining. ` +
      "Rotate it soon at https://github.com/settings/tokens and update the GH_PAT secret."
    );
  } else {
    console.log(`GH_PAT expiry: ${raw} (${daysRemaining} days remaining — no action needed).`);
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gitPushWithRetry(name, token) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Using ${name} for GitHub push (attempt ${attempt}/${MAX_RETRIES}) ...`);
    if (gitPushWithToken(token)) {
      console.log(`GitHub push succeeded on attempt ${attempt}/${MAX_RETRIES}.`);
      return true;
    }
    console.error(`${name}: push attempt ${attempt}/${MAX_RETRIES} failed.`);
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s ...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
  return false;
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

  // Check token expiry first so the reminder always appears, even if the push later fails.
  checkTokenExpiry();

  // Ensure remote exists with clean URL before we start.
  setRemote(GITHUB_REMOTE_URL);

  for (const { name, value } of candidates) {
    const hasAccess = await testTokenAccess(value);
    if (hasAccess === false) {
      // Definitive auth/permission failure — skip this token entirely.
      console.log(`${name}: no push access to ${GITHUB_REPO}, skipping.`);
      continue;
    }
    if (hasAccess === null) {
      // Transient preflight failure — proceed anyway; push retries may still succeed.
      console.log(`${name}: preflight check inconclusive (transient error), attempting push anyway ...`);
    }
    if (await gitPushWithRetry(name, value)) {
      return;
    }
    console.error(`${name}: all ${MAX_RETRIES} push attempts failed.`);
  }

  console.error(`ERROR: GitHub push to ${GITHUB_REPO} failed with all available tokens after ${MAX_RETRIES} attempts each.`);
  process.exit(1);
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
