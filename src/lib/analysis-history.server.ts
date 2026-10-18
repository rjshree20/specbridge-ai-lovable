import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

import { analyzePrd, type PrdAnalysis } from "@/lib/prd-analyzer";
import { prdFormSchema, type PrdFormValues } from "@/lib/prd-validation";
import type { AiReview } from "@/lib/ai-review";

// Set SPECBRIDGE_DB_PATH to a persistent disk location when deploying.
const filePath = resolve(process.env.SPECBRIDGE_DB_PATH || "./.data/specbridge.sqlite");
let database: DatabaseSync | undefined;

function db(): DatabaseSync {
  if (!database) {
    mkdirSync(dirname(filePath), { recursive: true });
    database = new DatabaseSync(filePath);
    database.exec(`CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      feature_title TEXT NOT NULL,
      product_name TEXT NOT NULL,
      values_json TEXT NOT NULL,
      rules_json TEXT NOT NULL,
      ai_json TEXT
    )`);
  }
  return database;
}

export type SavedAnalysis = {
  id: string;
  createdAt: string;
  values: PrdFormValues;
  analysis: PrdAnalysis;
  aiReview: AiReview | null;
};

export type HistoryEntry = { id: string; createdAt: string; featureTitle: string; productName: string; gapCount: number };

export function storeAnalysis(input: {
  values: PrdFormValues;
  aiReview: AiReview | null;
}): string {
  const values = prdFormSchema.parse(input.values);
  const analysis = analyzePrd(values); // Always recompute the deterministic findings server-side.
  const id = randomUUID();
  db().prepare(`INSERT INTO analyses (id, created_at, feature_title, product_name, values_json, rules_json, ai_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      id,
      new Date().toISOString(),
      values.featureTitle.trim(),
      values.productName.trim(),
      JSON.stringify(values),
      JSON.stringify(analysis),
      input.aiReview ? JSON.stringify(input.aiReview) : null,
    );
  return id;
}

export function listAnalyses(): HistoryEntry[] {
  const rows = db().prepare(`SELECT id, created_at, feature_title, product_name, rules_json
    FROM analyses ORDER BY created_at DESC LIMIT 100`).all() as Array<{
    id: string; created_at: string; feature_title: string; product_name: string; rules_json: string;
  }>;
  return rows.map((r) => ({
    id: r.id, createdAt: r.created_at, featureTitle: r.feature_title, productName: r.product_name,
    gapCount: (JSON.parse(r.rules_json) as PrdAnalysis).findings.length,
  }));
}

export function getAnalysis(id: string): SavedAnalysis | null {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const row = db().prepare(`SELECT * FROM analyses WHERE id = ?`).get(id) as {
    id: string; created_at: string; values_json: string; rules_json: string; ai_json: string | null;
  } | undefined;
  if (!row) return null;
  return {
    id: row.id, createdAt: row.created_at,
    values: JSON.parse(row.values_json) as PrdFormValues,
    analysis: JSON.parse(row.rules_json) as PrdAnalysis,
    aiReview: row.ai_json ? (JSON.parse(row.ai_json) as AiReview) : null,
  };
}

export type DashboardSummary = {
  totalAnalyses: number;
  totalGaps: number;
  byCategory: { ambiguity: number; missing_logic: number; undefined_inputs: number };
};

export function getDashboardSummary(): DashboardSummary {
  const rows = db().prepare("SELECT rules_json FROM analyses").all() as Array<{ rules_json: string }>;
  const summary: DashboardSummary = {
    totalAnalyses: rows.length, totalGaps: 0,
    byCategory: { ambiguity: 0, missing_logic: 0, undefined_inputs: 0 },
  };
  for (const row of rows) {
    const findings = (JSON.parse(row.rules_json) as PrdAnalysis).findings;
    summary.totalGaps += findings.length;
    for (const finding of findings) summary.byCategory[finding.category]++;
  }
  return summary;
}
