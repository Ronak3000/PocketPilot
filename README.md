# PocketPilot

PocketPilot is an intelligent financial and decision-making assistant built with Next.js and the AI SDK. It helps users manage their finances, make informed spending decisions, and provides conversational AI capabilities tailored for personal finance.

## Project Story

### Inspiration
The complexity of modern personal finance inspired the creation of PocketPilot. Managing budgets, deciding if a purchase is "safe to spend," and navigating financial decisions often require complex mental math and spreadsheet tracking. We wanted to build an AI-powered co-pilot that simplifies this process using natural language interactions. The goal was to bridge the gap between raw financial data and actionable, intelligent advice.

### What it does
PocketPilot serves as a conversational financial assistant. It evaluates spending decisions using a math-driven approach to calculate whether a purchase is "safe to spend" given a user's budget constraints, and it provides general financial guidance using advanced AI models.

### How we built it
The application is built on a modern web stack:
- **Frontend & Framework:** We used **Next.js 16** with **React 19** for a robust, server-rendered application.
- **Styling:** **Tailwind CSS v4** for utility-first, responsive design.
- **AI Integration:** We leveraged the **Vercel AI SDK** (`@ai-sdk/react`, `@ai-sdk/google`, `@ai-sdk/openai`) to power the conversational interface and decision-making endpoints.
- **Testing:** We implemented comprehensive testing using **Vitest** for unit tests and **Playwright** for end-to-end testing to ensure reliability.

### Challenges we ran into
One of the main challenges was accurately modeling the financial decision-making process. We had to ensure the AI's responses were not just conversational but mathematically sound. We utilized complex formulas to determine budget viability. For instance, calculating the projected impact of a recurring expense over time required strict mathematical formulations, such as computing the future value of savings:
$$ FV = P \times \left(1 + \frac{r}{n}\right)^{nt} $$
Integrating the AI SDK to stream responses while simultaneously handling structured data for the "safe to spend" logic was also a significant technical hurdle.

### What we learned
Building PocketPilot deepened our understanding of integrating Large Language Models (LLMs) into specialized domains like finance. We learned how to effectively prompt models to act as financial advisors and how to seamlessly blend deterministic mathematical functions with generative AI. We also gained valuable experience with the latest features in Next.js and React 19.

## Built with
`next.js`, `react`, `typescript`, `tailwind-css`, `vercel-ai-sdk`, `openai`, `google-gemini`, `playwright`, `vitest`, `zod`

## Getting Started

To run the PocketPilot application locally, follow these steps:

1. **Install dependencies:**
   Ensure you have Node.js installed. Then, run:
   ```bash
   npm install
   ```

2. **Environment Variables:**
   You will need to set up the necessary API keys for the AI providers (OpenAI, Google) in a `.env.local` file at the root of the project.

3. **Run the development server:**
   Start the local development server by running:
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser to interact with PocketPilot.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Runs the built production app.
- `npm run lint`: Runs ESLint to check for code issues.
- `npm run typecheck`: Runs TypeScript compiler checks.
- `npm run test`: Runs unit tests using Vitest.
- `npm run test:e2e`: Runs end-to-end tests using Playwright.
