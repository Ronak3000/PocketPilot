import fs from "fs";
import path from "path";
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

const DB_FILE = path.join(process.cwd(), "src", "server", "db.json");

export interface DbSchema {
  profile: FinancialProfile | null;
  constitution: MoneyConstitution | null;
  lastDecision: ExtractedDecision | null;
  lastComparison: ScenarioComparison | null;
  lastReceipt: FutureReceipt | null;
  lastPlan: ActionPlan | null;
  safeToSpend: SafeToSpend | null;
  history: HistoryEntry[];
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
};

class Database {
  private data: DbSchema;

  constructor() {
    this.data = this.readDb();
  }

  private readDb(): DbSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(fileContent) as DbSchema;
      }
    } catch (e) {
      console.error("Failed to read db.json, returning default", e);
    }
    return { ...defaultDb, history: [] };
  }

  private writeDb() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write to db.json", e);
    }
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

  // ── Reset ──
  public reset() {
    this.data = { ...defaultDb, history: [] };
    this.writeDb();
  }
}

export const db = new Database();
