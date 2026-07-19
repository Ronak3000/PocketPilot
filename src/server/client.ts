import { 
  FinancialProfile, 
  MoneyConstitution, 
  DecisionInput,
  ScenarioInput,
  ScenarioResult,
  ScenarioComparison,
  ActionPlan
} from '../contracts';

/**
 * PocketPilotClient
 * 
 * Provides a strongly typed API client for Task 1 (Frontend) and Task 2 (Finance Engine)
 * to interact with the Task 3 backend without worrying about fetch details.
 */
export class PocketPilotClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // --- Profile & Constitution ---

  async getFinancialProfile(): Promise<FinancialProfile> {
    return this.request<FinancialProfile>('/profile');
  }

  async saveFinancialProfile(profile: FinancialProfile): Promise<FinancialProfile> {
    return this.request<FinancialProfile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async getConstitution(): Promise<MoneyConstitution> {
    return this.request<MoneyConstitution>('/constitution');
  }

  async saveConstitution(constitution: MoneyConstitution): Promise<MoneyConstitution> {
    return this.request<MoneyConstitution>('/constitution', {
      method: 'PUT',
      body: JSON.stringify(constitution),
    });
  }

  // --- AI Workflow ---

  async analyzeDecision(input: DecisionInput): Promise<any> { // Returns the workflow outcome
    return this.request<any>('/decisions/analyze', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // --- Simulations ---

  async createSimulation(input: ScenarioInput): Promise<ScenarioResult> {
    return this.request<ScenarioResult>('/simulations/create', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getSimulation(id: string): Promise<ScenarioResult> {
    return this.request<ScenarioResult>(`/simulations/${id}`);
  }

  // --- Plans ---

  async approvePlan(plan: ActionPlan): Promise<ActionPlan> {
    return this.request<ActionPlan>('/plans/approve', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  // --- Demo Admin ---

  async seedDemo(): Promise<{ profile: FinancialProfile; constitution: MoneyConstitution }> {
    const res = await this.request<{ success: boolean; data: any }>('/demo/seed', { method: 'POST' });
    return res.data;
  }

  async resetDemo(): Promise<void> {
    await this.request<{ success: boolean }>('/demo/reset', { method: 'POST' });
  }
}
