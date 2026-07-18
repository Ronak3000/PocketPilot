import { db } from './db';
import { FinancialProfile, MoneyConstitution, FinancialEvent } from '../contracts';

export const seedAaravDemo = () => {
  // Clear first
  db.reset();

  const rentEvent: FinancialEvent = {
    id: 'evt-rent-1',
    name: 'Rent',
    amountPaise: 1400000, // ₹14,000
    type: 'EXPENSE',
    date: '1st of each month',
    isRecurring: true
  };

  const familyTransferEvent: FinancialEvent = {
    id: 'evt-fam-1',
    name: 'Family Transfer',
    amountPaise: 500000, // ₹5,000
    type: 'EXPENSE',
    date: '5th of each month',
    isRecurring: true
  };

  const aaravProfile: FinancialProfile = {
    id: 'demo-user-aarav',
    currentBalancePaise: 7200000, // ₹72,000
    monthlyIncomePaise: 4800000,  // ₹48,000
    incomeTiming: '1st of each month',
    rentPaise: 1400000,
    recurringObligations: [rentEvent, familyTransferEvent],
    existingEmisPaise: 350000,    // ₹3,500
    activeGoals: ['Emergency Fund: ₹1,50,000']
  };

  db.setProfile(aaravProfile);

  const aaravConstitution: MoneyConstitution = {
    userId: 'demo-user-aarav',
    rules: [
      {
        id: 'rule-floor-1',
        name: 'Protected Balance Floor',
        description: 'Balance must not drop below ₹10,000',
        evaluatorName: 'BALANCE_FLOOR',
        parameters: { floorPaise: 1000000 }
      },
      {
        id: 'rule-save-1',
        name: 'Monthly Savings Target',
        description: 'Aim to save at least ₹8,000 monthly',
        evaluatorName: 'SAVINGS_TARGET',
        parameters: { targetPaise: 800000 }
      }
    ]
  };

  db.setConstitution(aaravConstitution);

  return { profile: aaravProfile, constitution: aaravConstitution };
};

export const resetDemo = () => {
  db.reset();
};
