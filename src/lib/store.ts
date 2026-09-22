/* ════════════════════════════════════════════════════════════════
   The local store.

   One JSON file under `.data/`, read into memory once per server
   process and written back on every mutation. It exists so the whole
   owner app runs with `npm run dev` and nothing else installed — no
   Postgres, no Docker, no connection string.

   Every function is async and every query is scoped by owner, which
   is the shape a real database layer needs anyway. Swapping in
   Postgres later means rewriting this file and nothing above it.
   ════════════════════════════════════════════════════════════════ */

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { DB } from "@/lib/types";
import { seed } from "@/lib/seed";

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "store.json");

const globalForStore = globalThis as unknown as { _db?: DB };

function load(): DB {
  if (globalForStore._db) return globalForStore._db;
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    globalForStore._db = JSON.parse(raw) as DB;
  } catch {
    globalForStore._db = seed();
    flush();
  }
  return globalForStore._db!;
}

function flush() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(globalForStore._db, null, 2));
  } catch (err) {
    // A failed write must not take the request down with it — the in-memory
    // copy is still correct for the life of this process.
    console.error("[store] could not persist", err);
  }
}

/** Read-only view. Never mutate what comes back from here. */
export async function db(): Promise<DB> {
  return load();
}

/** Mutate and persist in one step, so no caller can forget the write. */
export async function mutate<T>(fn: (d: DB) => T): Promise<T> {
  const d = load();
  const out = fn(d);
  flush();
  return out;
}

export const uid = () => randomUUID();
export const now = () => new Date().toISOString();

/** Wipes the store so the next read re-seeds it. Used by `npm run reset`. */
export function resetStore() {
  globalForStore._db = undefined;
  try { fs.rmSync(FILE, { force: true }); } catch { /* already gone */ }
}

/* ── references people can read out over the phone ─────────────
   Always one past the highest we have issued, so a new bill never
   lands on a number an older one already used. */
const pad = (n: number) => String(n).padStart(4, "0");
const nextNumber = (refs: string[], floor: number) =>
  Math.max(floor, ...refs.map((r) => Number(r.split("-").pop()) || 0)) + 1;

export const visitRef = (d: DB) => `VIS-${new Date().getFullYear()}-${pad(nextNumber(d.visits.map((x) => x.ref), 411))}`;
export const reportRef = (d: DB) => `RPT-${new Date().getFullYear()}-${pad(nextNumber(d.reports.map((x) => x.ref), 411))}`;
export const issueRef = (d: DB) => `ISS-${pad(nextNumber(d.issues.map((x) => x.ref), 916))}`;
export const invoiceRef = (d: DB) => `INV-${new Date().getFullYear()}-${pad(nextNumber(d.invoices.map((x) => x.ref), 27))}`;
