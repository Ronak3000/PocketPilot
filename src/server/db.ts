import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import {
  forgetMemories,
  upsertMemory,
  type MemoryCandidate,
  type UserMemory,
} from "@/core/ai/memory";
import {
  DEFAULT_PERSONALIZATION,
  type PersonalizationSettings,
} from "@/core/ai/personalization";
import type {
  FinancialProfile,
  MoneyConstitution,
  ExtractedDecision,
  ScenarioComparison,
  FutureReceipt,
  ActionPlan,
  SafeToSpend,
  HistoryEntry,
} from "@/features/types";

// Runtime writes go to the OS temp directory so git-tracked src/server/db.json
// is never mutated. On first use the runtime file is seeded from the read-only
// snapshot if it exists.
const SEED_FILE = path.join(process.cwd(), "src", "server", "db.json");
const DB_FILE = path.join(
  os.tmpdir(),
  `pocketpilot-${path.basename(process.cwd())}-db.json`,
);


export interface DbSchema {
  profile: FinancialProfile | null;
  constitution: MoneyConstitution | null;
  lastDecision: ExtractedDecision | null;
  lastComparison: ScenarioComparison | null;
  lastReceipt: FutureReceipt | null;
  lastPlan: ActionPlan | null;
  safeToSpend: SafeToSpend | null;
  history: HistoryEntry[];
  memories: UserMemory[];
  personalization: PersonalizationSettings;
}

const defaultDb: DbSchema = {
  profile: null,
  constitution: null,
  lastDecision: null,
  lastComparison: null,
  lastReceipt: null,
  lastPlan: null,
  safeToSpend: null,
  history: [],
  memories: [],
  personalization: DEFAULT_PERSONALIZATION,
};

export class Database {
  private data: DbSchema;

  // ponytail: single-user JSON store; replace with authenticated Postgres before multi-user use.
  constructor(private readonly filePath = DB_FILE) {
    this.data = this.readDb();
  }

  private readDb(): DbSchema {
    // If the runtime file doesn't exist yet, seed it from the read-only snapshot.
    if (!fs.existsSync(this.filePath) && fs.existsSync(SEED_FILE)) {
      try {
        fs.copyFileSync(SEED_FILE, this.filePath);
      } catch (e) {
        console.error("Failed to seed runtime db from snapshot", e);
      }
    }
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, "utf-8");
        const stored = JSON.parse(fileContent) as Partial<DbSchema>;
        return {
          ...defaultDb,
          ...stored,
          history: stored.history ?? [],
          memories: stored.memories ?? [],
          personalization: {
            ...DEFAULT_PERSONALIZATION,
            ...stored.personalization,
          },
        };
      }
    } catch (e) {
      console.error("Failed to read runtime db, returning default", e);
    }
    return { ...defaultDb, history: [] };
  }


  private writeDb() {
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(this.data, null, 2),
      "utf-8",
    );
  }

  // ── Profile ──
  public getProfile(): FinancialProfile | null {
    return this.data.profile;
  }

  public setProfile(profile: FinancialProfile) {
    this.data.profile = profile;
    this.writeDb();
  }

  public patchProfile(updates: Partial<FinancialProfile>): FinancialProfile | null {
    if (!this.data.profile) return null;
    this.data.profile = { ...this.data.profile, ...updates, updatedAt: new Date().toISOString() };
    this.writeDb();
    return this.data.profile;
  }

  // ── Constitution ──
  public getConstitution(): MoneyConstitution | null {
    return this.data.constitution;
  }

  public setConstitution(constitution: MoneyConstitution) {
    this.data.constitution = constitution;
    this.writeDb();
  }

  // ── Decision / Scenarios / Receipt / Plan ──
  public setLastDecision(decision: ExtractedDecision) {
    this.data.lastDecision = decision;
    this.writeDb();
  }

  public getLastDecision(): ExtractedDecision | null {
    return this.data.lastDecision;
  }

  public setLastComparison(comparison: ScenarioComparison) {
    this.data.lastComparison = comparison;
    this.writeDb();
  }

  public getLastComparison(): ScenarioComparison | null {
    return this.data.lastComparison;
  }

  public setLastReceipt(receipt: FutureReceipt) {
    this.data.lastReceipt = receipt;
    this.writeDb();
  }

  public getLastReceipt(): FutureReceipt | null {
    return this.data.lastReceipt;
  }

  public setLastPlan(plan: ActionPlan) {
    this.data.lastPlan = plan;
    this.writeDb();
  }

  public getLastPlan(): ActionPlan | null {
    return this.data.lastPlan;
  }

  // ── Safe to Spend ──
  public setSafeToSpend(sts: SafeToSpend) {
    this.data.safeToSpend = sts;
    this.writeDb();
  }

  public getSafeToSpend(): SafeToSpend | null {
    return this.data.safeToSpend;
  }

  // ── History ──
  public getHistory(): HistoryEntry[] {
    return this.data.history;
  }

  public addHistoryEntry(entry: HistoryEntry) {
    this.data.history.unshift(entry);
    this.writeDb();
  }

  // ── Personalization ──
  public getMemories(userId: string): UserMemory[] {
    return this.data.memories.filter(
      (memory) => memory.userId === userId && !memory.validTo,
    );
  }

  public remember(
    userId: string,
    candidate: MemoryCandidate,
    source: string,
    sourceMessageId?: string,
  ): UserMemory | null {
    const now = new Date().toISOString();
    const memory: UserMemory = {
      ...candidate,
      id: randomUUID(),
      userId,
      source,
      sourceMessageId,
      createdAt: now,
      validFrom: now,
    };
    const next = upsertMemory(this.data.memories, memory);
    if (next === this.data.memories) return null;
    this.data.memories = next;
    this.writeDb();
    return memory;
  }

  public forgetMemories(userId: string, query: string): number {
    const result = forgetMemories(this.data.memories, userId, query);
    if (result.removed > 0) {
      this.data.memories = result.memories;
      this.writeDb();
    }
    return result.removed;
  }

  public clearMemories(userId: string): number {
    const before = this.data.memories.length;
    this.data.memories = this.data.memories.filter(
      (memory) => memory.userId !== userId,
    );
    const removed = before - this.data.memories.length;
    if (removed > 0) this.writeDb();
    return removed;
  }

  public getPersonalization(): PersonalizationSettings {
    return { ...this.data.personalization };
  }

  public patchPersonalization(
    updates: Partial<PersonalizationSettings>,
  ): PersonalizationSettings {
    this.data.personalization = {
      ...this.data.personalization,
      ...updates,
    };
    this.writeDb();
    return this.getPersonalization();
  }

  // ── Reset ──
  public reset() {
    this.data = {
      ...defaultDb,
      history: [],
      memories: [],
      personalization: { ...DEFAULT_PERSONALIZATION },
    };
    this.writeDb();
  }
}

export const db = new Database();
