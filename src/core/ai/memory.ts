export type MemoryKind = "fact" | "preference" | "goal" | "behavior";

export interface UserMemory {
  id: string;
  userId: string;
  kind: MemoryKind;
  key: string;
  content: string;
  confidence: number;
  source: string;
  sourceMessageId?: string;
  createdAt: string;
  validFrom: string;
  validTo?: string;
  supersedesMemoryId?: string;
}

export interface MemoryCandidate {
  kind: MemoryKind;
  key: string;
  content: string;
  confidence: number;
}

const FORBIDDEN_MEMORY_TERMS = [
  "ignore previous",
  "ignore all",
  "system prompt",
  "developer message",
  "reveal secret",
  "password",
  "passcode",
  "upi pin",
  "otp",
  "cvv",
  "card number",
  "account number",
  "you must",
  "assistant must",
  "follow these instructions",
  "use the tool",
  "call the tool",
  "send money",
  "transfer money",
];

export type MemoryCommand =
  | { type: "remember"; content: string }
  | { type: "forget"; query: string }
  | { type: "forget_all" }
  | { type: "list" };

export function parseMemoryCommand(text: string): MemoryCommand | null {
  const trimmed = text.trim();
  if (/what do you remember|show (me )?my memor/i.test(trimmed)) {
    return { type: "list" };
  }
  if (/forget (everything|all memories|all about me)/i.test(trimmed)) {
    return { type: "forget_all" };
  }
  const forget = trimmed.match(/(?:please )?forget(?: that| about)?\s+(.+)/i);
  if (forget?.[1]) return { type: "forget", query: forget[1].trim() };
  const remember = trimmed.match(/(?:please )?remember(?: that)?\s+(.+)/i);
  if (remember?.[1]) {
    return { type: "remember", content: remember[1].trim() };
  }
  return null;
}

export function extractMemoryCandidates(text: string): MemoryCandidate[] {
  const trimmed = text.trim();
  const candidates: MemoryCandidate[] = [];
  const patterns: Array<{
    regex: RegExp;
    kind: MemoryKind;
    key: string;
    prefix: string;
  }> = [
    {
      regex: /\bi prefer\s+(.+)/i,
      kind: "preference",
      key: "preference.general",
      prefix: "Prefers ",
    },
    {
      regex: /\b(?:speak|reply|talk) (?:to me )?in\s+(.+)/i,
      kind: "preference",
      key: "preference.language",
      prefix: "Prefers responses in ",
    },
    {
      regex: /\bmy (?:financial )?goal is\s+(.+)/i,
      kind: "goal",
      key: "goal.primary",
      prefix: "Financial goal: ",
    },
    {
      regex: /\bi am saving for\s+(.+)/i,
      kind: "goal",
      key: "goal.primary",
      prefix: "Saving for ",
    },
    {
      regex: /\bi usually\s+(.+)/i,
      kind: "behavior",
      key: "behavior.usual",
      prefix: "Usually ",
    },
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern.regex);
    if (!match?.[1]) continue;
    const content = `${pattern.prefix}${match[1].trim()}`.slice(0, 240);
    if (isSafeMemoryContent(content)) {
      candidates.push({
        kind: pattern.kind,
        key: pattern.key,
        content,
        confidence: 0.9,
      });
    }
  }
  return candidates;
}

export function isSafeMemoryContent(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  return (
    normalized.length >= 3 &&
    normalized.length <= 240 &&
    !FORBIDDEN_MEMORY_TERMS.some((term) => normalized.includes(term))
  );
}

export function upsertMemory(
  memories: UserMemory[],
  memory: UserMemory,
): UserMemory[] {
  if (!isSafeMemoryContent(memory.content)) return memories;
  const duplicate = memories.some(
    (item) =>
      item.userId === memory.userId &&
      !item.validTo &&
      item.content.toLowerCase() === memory.content.toLowerCase(),
  );
  if (duplicate) return memories;

  let supersedesMemoryId: string | undefined;
  const next = memories.map((item) => {
    if (
      item.userId === memory.userId &&
      item.key === memory.key &&
      !item.validTo
    ) {
      supersedesMemoryId = item.id;
      return { ...item, validTo: memory.validFrom };
    }
    return item;
  });
  return [...next, { ...memory, supersedesMemoryId }];
}

export function forgetMemories(
  memories: UserMemory[],
  userId: string,
  query: string,
): { memories: UserMemory[]; removed: number } {
  const words = tokenize(query);
  if (words.length === 0) return { memories, removed: 0 };
  const kept = memories.filter((memory) => {
    if (memory.userId !== userId) return true;
    const haystack = `${memory.key} ${memory.content}`.toLowerCase();
    return !words.every((word) => haystack.includes(word));
  });
  return { memories: kept, removed: memories.length - kept.length };
}

export function retrieveRelevantMemories(
  memories: UserMemory[],
  userId: string,
  query: string,
  limit = 8,
): UserMemory[] {
  const words = tokenize(query);
  return memories
    .filter((memory) => memory.userId === userId && !memory.validTo)
    .map((memory) => ({
      memory,
      score:
        (memory.kind === "preference" ? 2 : 0) +
        words.filter((word) =>
          `${memory.key} ${memory.content}`.toLowerCase().includes(word),
        ).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.memory.createdAt.localeCompare(a.memory.createdAt) ||
        a.memory.id.localeCompare(b.memory.id),
    )
    .slice(0, limit)
    .map(({ memory }) => memory);
}

function tokenize(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .match(/[a-z0-9₹]+/g)
        ?.filter((word) => word.length > 2) ?? [],
    ),
  ];
}
