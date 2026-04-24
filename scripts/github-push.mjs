#!/usr/bin/env node
// Pushes to GitHub after each task merge.
// Tries GH_PAT first, then falls back to GITHUB_TOKEN.
// Credentials are injected into the remote URL only for the duration of the push
// (never persisted to .git/config). The remote URL is restored to the clean form
// immediately after, whether the push succeeds or fails.
//
// Token expiry: GH_PAT_EXPIRES (YYYY-MM-DD) is auto-detected from the GitHub API
// response header on every push and kept in sync automatically.  You only need to
// set it manually if the API header is absent (e.g. GITHUB_TOKEN fallback path).
//
// Retry tuning (optional env vars):
//   GH_PUSH_MAX_RETRIES    — number of push attempts per token (default: 3)
//   GH_PUSH_RETRY_DELAY_MS — milliseconds to wait between retries  (default: 10000)

import { execFileSync, spawnSync } from "child_process";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Populated by testTokenAccess() when the GitHub API response includes the
// `github-authentication-token-expiration` header.  Only the first successful
// response sets this value (see `!_detectedTokenExpiry` guard in testTokenAccess).
// Because candidates are ordered GH_PAT → GITHUB_TOKEN, this effectively captures
// the GH_PAT expiry when present, keeping it semantically aligned with the secret
// users rotate.  Used by checkTokenExpiry() as the authoritative expiry date and
// persisted to the flag file so sync-pat-expiry.mjs can update GH_PAT_EXPIRES.
let _detectedTokenExpiry = null;

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
  // Capture expiry header before consuming the body.
  // Header format: "2025-06-15 12:00:00 UTC"  (GitHub fine-grained PATs)
  const expiryHeader = resp.headers.get("github-authentication-token-expiration");
  if (expiryHeader && !_detectedTokenExpiry) {
    try {
      // Normalise to an ISO-8601 string Node.js/V8 can parse reliably.
      const iso = expiryHeader.trim().replace(" UTC", "Z").replace(" ", "T");
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        _detectedTokenExpiry = d.toISOString().slice(0, 10); // YYYY-MM-DD
        console.log(`Auto-detected token expiry from GitHub API header: ${_detectedTokenExpiry}`);
      }
    } catch {
      // Malformed header — ignore and fall back to GH_PAT_EXPIRES as before.
    }
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

// Path where expiry status is written so the agent can create a visible project task.
const __dir = dirname(fileURLToPath(import.meta.url));
const EXPIRY_STATUS_FILE = resolve(__dir, "../.local/gh-pat-expiry-status.json");

// Path where push status is written so the UI can surface failures as a banner.
const PUSH_STATUS_FILE = resolve(__dir, "../.local/gh-push-status.json");

// Path where the auto-detected expiry date is written so sync-pat-expiry.mjs
// can pick it up and update GH_PAT_EXPIRES via the Replit API.
const DETECTED_EXPIRY_FILE = resolve(__dir, "../.local/gh-pat-detected-expiry.json");

const PUSH_HISTORY_MAX = 10;

function writePushStatus(status) {
  try {
    mkdirSync(dirname(PUSH_STATUS_FILE), { recursive: true });

    // Read existing history (if any) from the current status file.
    let existingHistory = [];
    try {
      const existing = JSON.parse(readFileSync(PUSH_STATUS_FILE, "utf8"));
      if (Array.isArray(existing.history)) {
        existingHistory = existing.history;
      }
    } catch {
      // File missing or unreadable — start fresh.
    }

    // Build a history entry for this attempt.
    const historyEntry = {
      status: status.status === "success" ? "success" : "failed",
      timestamp: status.pushedAt ?? status.failedAt ?? new Date().toISOString(),
      ...(status.token != null ? { token: status.token } : { token: null }),
    };

    // Append and trim to the last N entries.
    const history = [...existingHistory, historyEntry].slice(-PUSH_HISTORY_MAX);

    writeFileSync(
      PUSH_STATUS_FILE,
      JSON.stringify({ ...status, history }, null, 2) + "\n",
      "utf8"
    );
  } catch (err) {
    console.warn(`WARNING: Could not write push status file: ${err.message}`);
  }
}

function writeExpiryStatus(status) {
  try {
    mkdirSync(dirname(EXPIRY_STATUS_FILE), { recursive: true });
    writeFileSync(EXPIRY_STATUS_FILE, JSON.stringify(status, null, 2) + "\n", "utf8");
  } catch (err) {
    console.warn(`WARNING: Could not write expiry status file: ${err.message}`);
  }
}

function writeDetectedExpiry(expiry) {
  try {
    mkdirSync(dirname(DETECTED_EXPIRY_FILE), { recursive: true });
    writeFileSync(
      DETECTED_EXPIRY_FILE,
      JSON.stringify({ detectedExpiry: expiry, detectedAt: new Date().toISOString() }, null, 2) + "\n",
      "utf8"
    );
  } catch (err) {
    console.warn(`WARNING: Could not write detected expiry file: ${err.message}`);
  }
}

function checkTokenExpiry() {
  const raw = (process.env.GH_PAT_EXPIRES || "").trim();

  // If GH_PAT_EXPIRES is missing but the API header gave us a date, use it and
  // note that the env var will be updated automatically by sync-pat-expiry.mjs.
  if (!raw) {
    if (_detectedTokenExpiry) {
      console.log(
        `GH_PAT_EXPIRES not set — using auto-detected expiry from GitHub API header: ${_detectedTokenExpiry}. ` +
        "GH_PAT_EXPIRES will be updated automatically."
      );
    } else {
      console.log(
        "REMINDER: Set GH_PAT_EXPIRES (YYYY-MM-DD) so this script can warn you before the token lapses."
      );
      return;
    }
  }

  // Prefer the API-detected date when available: it is authoritative (comes
  // directly from GitHub) and avoids false expiry warnings immediately after
  // token rotation when GH_PAT_EXPIRES hasn't been synced yet.
  const effectiveExpiry = _detectedTokenExpiry || raw;

  const expiryMs = Date.parse(effectiveExpiry);
  if (isNaN(expiryMs)) {
    const source = _detectedTokenExpiry ? "auto-detected" : "GH_PAT_EXPIRES";
    console.warn(`WARNING: ${source} expiry value "${effectiveExpiry}" is not a valid date (use YYYY-MM-DD). Skipping expiry check.`);
    return;
  }

  const nowMs = Date.now();
  const daysRemaining = Math.ceil((expiryMs - nowMs) / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    console.error(
      `ERROR: GH_PAT expired on ${effectiveExpiry} (${Math.abs(daysRemaining)} day(s) ago). ` +
      "Create a new token at https://github.com/settings/tokens and update the GH_PAT secret."
    );
    writeExpiryStatus({ expiresOn: effectiveExpiry, daysRemaining, needsReminder: true, checkedAt: new Date().toISOString() });
  } else if (daysRemaining <= WARN_DAYS_BEFORE) {
    console.warn(
      `WARNING: GH_PAT expires on ${effectiveExpiry} — only ${daysRemaining} day(s) remaining. ` +
      "Rotate it soon at https://github.com/settings/tokens and update the GH_PAT secret."
    );
    writeExpiryStatus({ expiresOn: effectiveExpiry, daysRemaining, needsReminder: true, checkedAt: new Date().toISOString() });
  } else {
    console.log(`GH_PAT expiry: ${effectiveExpiry} (${daysRemaining} days remaining — no action needed).`);
    // Clear any stale reminder file now that the token is healthy.
    writeExpiryStatus({ expiresOn: effectiveExpiry, daysRemaining, needsReminder: false, checkedAt: new Date().toISOString() });
  }
}

const _parseEnvInt = (name, defaultVal) => {
  const n = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) ? n : defaultVal;
};
const MAX_RETRIES = _parseEnvInt("GH_PUSH_MAX_RETRIES", 3);
const RETRY_DELAY_MS = _parseEnvInt("GH_PUSH_RETRY_DELAY_MS", 10_000);

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

  console.log(`Push config: max retries = ${MAX_RETRIES}, retry delay = ${RETRY_DELAY_MS} ms`);

  if (candidates.length === 0) {
    const msg = "No GitHub token available. Set GH_PAT or GITHUB_TOKEN secret.";
    console.error(`ERROR: ${msg}`);
    writePushStatus({ status: "failed", failedAt: new Date().toISOString(), message: msg });
    process.exit(1);
  }

  // Run preflight checks for all candidates up-front.
  // This populates _detectedTokenExpiry from the API response header so that
  // checkTokenExpiry() can use it as a fallback when GH_PAT_EXPIRES is not set.
  const accessResults = new Map();
  for (const { name, value } of candidates) {
    accessResults.set(name, await testTokenAccess(value));
  }

  // Check token expiry after preflight so _detectedTokenExpiry is available.
  checkTokenExpiry();

  // If we auto-detected a new expiry, persist it to the flag file so
  // sync-pat-expiry.mjs (called from post-merge.sh) can update GH_PAT_EXPIRES.
  if (_detectedTokenExpiry) {
    const current = (process.env.GH_PAT_EXPIRES || "").trim();
    if (_detectedTokenExpiry !== current) {
      console.log(`Writing auto-detected expiry ${_detectedTokenExpiry} to flag file for env-var update.`);
      writeDetectedExpiry(_detectedTokenExpiry);
    } else {
      console.log(`GH_PAT_EXPIRES is already up-to-date (${current}).`);
    }
  }

  // Ensure remote exists with clean URL before we start.
  setRemote(GITHUB_REMOTE_URL);

  let lastAttemptedToken = null;
  for (const { name, value } of candidates) {
    const hasAccess = accessResults.get(name);
    if (hasAccess === false) {
      // Definitive auth/permission failure — skip this token entirely.
      console.log(`${name}: no push access to ${GITHUB_REPO}, skipping.`);
      continue;
    }
    if (hasAccess === null) {
      // Transient preflight failure — proceed anyway; push retries may still succeed.
      console.log(`${name}: preflight check inconclusive (transient error), attempting push anyway ...`);
    }
    lastAttemptedToken = name;
    if (await gitPushWithRetry(name, value)) {
      writePushStatus({ status: "success", pushedAt: new Date().toISOString(), token: name });
      return;
    }
    console.error(`${name}: all ${MAX_RETRIES} push attempts failed.`);
  }

  const failedAt = new Date().toISOString();
  console.error(`ERROR: GitHub push to ${GITHUB_REPO} failed with all available tokens after ${MAX_RETRIES} attempts each.`);
  writePushStatus({ status: "failed", failedAt, message: `All tokens exhausted after ${MAX_RETRIES} attempts each.`, token: lastAttemptedToken });
  process.exit(1);
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  writePushStatus({ status: "failed", failedAt: new Date().toISOString(), message: err.message });
  process.exit(1);
});
