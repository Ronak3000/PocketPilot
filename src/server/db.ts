import fs from 'fs';
import path from 'path';
import { 
  FinancialProfile, 
  MoneyConstitution,
  ExtractedDecision,
  ScenarioResult,
  ActionPlan
} from '../contracts';

const DB_FILE = path.join(process.cwd(), 'src', 'server', 'db.json');

export interface DbSchema {
  profile: FinancialProfile | null;
  constitution: MoneyConstitution | null;
  decisions: Record<string, ExtractedDecision>;
  scenarios: Record<string, ScenarioResult>;
  plans: Record<string, ActionPlan>;
}

const defaultDb: DbSchema = {
  profile: null,
  constitution: null,
  decisions: {},
  scenarios: {},
  plans: {}
};

class Database {
  private data: DbSchema;

  constructor() {
    this.data = this.readDb();
  }

  private readDb(): DbSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent) as DbSchema;
      }
    } catch (e) {
      console.error('Failed to read db.json, returning default', e);
    }
    return defaultDb;
  }

  private writeDb() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write to db.json', e);
    }
  }

  public getProfile(): FinancialProfile | null {
    return this.data.profile;
  }

  public setProfile(profile: FinancialProfile) {
    this.data.profile = profile;
    this.writeDb();
  }

  public getConstitution(): MoneyConstitution | null {
    return this.data.constitution;
  }

  public setConstitution(constitution: MoneyConstitution) {
    this.data.constitution = constitution;
    this.writeDb();
  }

  public getDecision(id: string): ExtractedDecision | null {
    return this.data.decisions[id] || null;
  }

  public saveDecision(id: string, decision: ExtractedDecision) {
    this.data.decisions[id] = decision;
    this.writeDb();
  }

  public getScenario(id: string): ScenarioResult | null {
    return this.data.scenarios[id] || null;
  }

  public saveScenario(id: string, scenario: ScenarioResult) {
    this.data.scenarios[id] = scenario;
    this.writeDb();
  }

  public savePlan(id: string, plan: ActionPlan) {
    this.data.plans[id] = plan;
    this.writeDb();
  }

  public getPlan(id: string): ActionPlan | null {
    return this.data.plans[id] || null;
  }
  
  public reset() {
    this.data = JSON.parse(JSON.stringify(defaultDb));
    this.writeDb();
  }
}

export const db = new Database();
