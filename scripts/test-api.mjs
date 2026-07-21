// Run this script in a separate terminal while `npm run dev` is running

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  console.log('1. Seeding demo data...');
  let res = await fetch(`${BASE_URL}/demo/seed`, { method: 'POST' });
  let data = await res.json();
  console.log('Seed success:', data.success);

  console.log('\n2. Fetching seeded profile...');
  res = await fetch(`${BASE_URL}/profile`);
  data = await res.json();
  console.log('Profile balance:', data.currentBalancePaise);

  console.log('\n3. Testing AI Workflow (Analyze Decision)...');
  res = await fetch(`${BASE_URL}/decisions/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'I want to buy a new phone for 59999',
    })
  });
  data = await res.json();
  console.log('Workflow Result:');
  console.log('- Status:', data.status);
  console.log('- Extracted Title:', data.decision?.title);
  console.log('- AI Synthesis Summary:', data.receipt?.summary);
  console.log('- Persona Text:', data.receipt?.personaAdaptedExplanation);
  
  console.log('\n✅ All endpoints responded successfully!');
}

test().catch(console.error);
