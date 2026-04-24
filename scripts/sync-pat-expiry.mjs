#!/usr/bin/env node
// Syncs GH_PAT_EXPIRES with the expiry date auto-detected by github-push.mjs.
//
// github-push.mjs reads the `github-authentication-token-expiration` header from
// the GitHub API preflight call and writes the date to
// .local/gh-pat-detected-expiry.json whenever it differs from GH_PAT_EXPIRES.
//
// This script is the second half of that pipeline:
//
//   USAGE — from the shell (called by post-merge.sh):
//     node scripts/sync-pat-expiry.mjs
//   → Reads the flag file.  When a new expiry is found it writes a KV key
//     (gh-pat-detected-expiry-pending) so the agent picks it up on the next
//     code_execution run and calls setEnvVars automatically.
//
//   USAGE — from the code_execution sandbox:
//     const { syncPatExpiry } = await import('/home/runner/workspace/scripts/sync-pat-expiry.mjs');
//     await syncPatExpiry();
//   → Reads the flag file (or KV key) and calls setEnvVars({ values: { GH_PAT_EXPIRES: date } }).
//
// The script is idempotent: if GH_PAT_EXPIRES already equals the detected date it exits silently.

import { readFileSync, unlinkSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dir, "..");
const DETECTED_EXPIRY_FILE = resolve(WORKSPACE_ROOT, ".local/gh-pat-detected-expiry.json");

// KV key used to signal "env-var update pending".
const KV_PENDING_KEY = "gh-pat-detected-expiry-pending";

// ── KV store helpers ───────────────────────────────────────────────────────────

async function kvSet(key, value) {
  const url = process?.env?.REPLIT_DB_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    });
  } catch { /* ignore */ }
}

async function kvGet(key) {
  const url = process?.env?.REPLIT_DB_URL;
  if (!url) return null;
  try {
    const resp = await fetch(`${url}/${encodeURIComponent(key)}`);
    if (!resp.ok) return null;
    return await resp.text();
  } catch { return null; }
}

async function kvDelete(key) {
  const url = process?.env?.REPLIT_DB_URL;
  if (!url) return;
  try {
    await fetch(`${url}/${encodeURIComponent(key)}`, { method: "DELETE" });
  } catch { /* ignore */ }
}

// ── Read detected expiry ───────────────────────────────────────────────────────

function readDetectedExpiry() {
  try {
    const data = JSON.parse(readFileSync(DETECTED_EXPIRY_FILE, "utf8"));
    return (data && data.detectedExpiry) ? data.detectedExpiry : null;
  } catch {
    return null;
  }
}

function removeDetectedExpiryFile() {
  try { unlinkSync(DETECTED_EXPIRY_FILE); } catch { /* already gone */ }
}

// ── Main exported function ─────────────────────────────────────────────────────

export async function syncPatExpiry() {
  // In code_execution process.env is a stub, so also check the KV store.
  let detectedExpiry = readDetectedExpiry();

  if (!detectedExpiry) {
    // Try the KV pending key (written by a previous shell-context run).
    const pending = await kvGet(KV_PENDING_KEY);
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        detectedExpiry = parsed.detectedExpiry || null;
      } catch { detectedExpiry = null; }
    }
  }

  if (!detectedExpiry) {
    console.log("sync-pat-expiry: no detected expiry found — nothing to update.");
    return;
  }

  const hasEnvVarAPI = typeof setEnvVars !== "undefined";

  if (!hasEnvVarAPI) {
    // Running in the shell (post-merge.sh context).  Persist the detected expiry
    // to the KV store so the agent can apply it via setEnvVars on the next
    // code_execution cycle.
    //
    // NOTE: the local .local/gh-pat-detected-expiry.json flag file is NOT removed
    // here — cleanup is deferred to the code_execution path below, which also
    // calls setEnvVars.  This means GH_PAT_EXPIRES update completes after the
    // next agent run, not immediately in shell-only contexts.
    await kvSet(KV_PENDING_KEY, JSON.stringify({ detectedExpiry, pendingSince: new Date().toISOString() }));
    console.log(
      `sync-pat-expiry: auto-detected expiry ${detectedExpiry} queued for GH_PAT_EXPIRES update.\n` +
      "  GH_PAT_EXPIRES will be set automatically on the next agent run."
    );
    return;
  }

  // Running inside code_execution — update the env var directly.
  try {
    await setEnvVars({ values: { GH_PAT_EXPIRES: detectedExpiry } });
    console.log(`sync-pat-expiry: GH_PAT_EXPIRES updated to ${detectedExpiry}.`);
    // Clean up: remove flag file and KV key so we don't re-run needlessly.
    removeDetectedExpiryFile();
    await kvDelete(KV_PENDING_KEY);
  } catch (err) {
    console.warn(`sync-pat-expiry: setEnvVars failed — ${err.message}`);
  }
}

// ── CLI entry point ────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncPatExpiry().catch((err) => {
    console.error("ERROR in syncPatExpiry:", err.message);
    process.exit(1);
  });
}
