
async function run() {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const data = await res.json();
    console.log(data.models.map(m => m.name));
  } catch (e) {
    console.error("AI ERROR:", e);
  }
}
run();
