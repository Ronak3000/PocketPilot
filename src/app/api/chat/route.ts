import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import {
  extractMemoryCandidates,
  isSafeMemoryContent,
  parseMemoryCommand,
  retrieveRelevantMemories,
  type MemoryCandidate,
} from "@/core/ai/memory";
import {
  buildChatSystemPrompt,
  parsePersonalizationUpdate,
  selectTone,
} from "@/core/ai/personalization";
import { createChatTools } from "@/server/chat-tools";
import { db } from "@/server/db";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error:
            "Google Generative AI is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local.",
        },
        { status: 503 },
      );
    }

    const body: unknown = await req.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("messages" in body) ||
      !Array.isArray(body.messages)
    ) {
      return Response.json(
        { error: "The request must include a messages array." },
        { status: 400 },
      );
    }

    const messages = body.messages as UIMessage[];
    const temporaryChat =
      "temporaryChat" in body && body.temporaryChat === true;
    const lastUserMessage = getLastUserMessage(messages);
    const userText = getMessageText(lastUserMessage);
    const profile = db.getProfile();
    const constitution = db.getConstitution();
    if (!profile || !constitution) {
      return Response.json(
        {
          error:
            "Profile or Constitution not found. Please complete onboarding.",
        },
        { status: 400 },
      );
    }

    let settings = db.getPersonalization();
    let memoryNotice: string | undefined;
    const memoryCommand = parseMemoryCommand(userText);

    if (temporaryChat) {
      memoryNotice = "Temporary chat is active; do not use or save memories.";
    } else {
      const update = parsePersonalizationUpdate(userText);
      if (Object.keys(update).length > 0) {
        settings = db.patchPersonalization(update);
        memoryNotice = "Personalization preferences were updated.";
      }
      if (settings.memoryEnabled) {
        memoryNotice =
          applyMemoryCommand(
            profile.id,
            memoryCommand,
            lastUserMessage?.id,
          ) ?? memoryNotice;
        if (!memoryCommand) {
          for (const candidate of extractMemoryCandidates(userText)) {
            db.remember(profile.id, candidate, "chat", lastUserMessage?.id);
          }
        }
      } else if (memoryCommand) {
        memoryNotice = "Memory is off, so no memory was read or saved.";
      }
    }

    const storedMemories =
      settings.memoryEnabled && !temporaryChat
        ? db.getMemories(profile.id)
        : [];
    const memories =
      memoryCommand?.type === "list"
        ? storedMemories.slice(-20)
        : retrieveRelevantMemories(storedMemories, profile.id, userText);
    const safeToSpend = db.getSafeToSpend();
    const tone = selectTone({
      text: userText,
      settings,
      bufferQuality: safeToSpend?.bufferQuality,
      belowProtectedFloor:
        profile.currentBalancePaise <= profile.protectedBalanceFloorPaise,
    });

    const google = createGoogleGenerativeAI({ apiKey });
    const result = streamText({
      model: google("gemini-3.5-flash"),
      messages: await convertToModelMessages(messages),
      system: buildChatSystemPrompt({
        name: profile.name,
        tone,
        memories,
        memoryNotice,
      }),
      stopWhen: stepCountIs(3),
      onError: ({ error }) => {
        console.error("Gemini chat stream failed:", error);
      },
      tools: createChatTools({
        profile,
        constitution,
        rememberBehavior: settings.memoryEnabled && !temporaryChat,
        sourceMessageId: lastUserMessage?.id,
      }),
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API request failed:", error);
    const message =
      error instanceof Error ? error.message : "Unknown chat API error";
    return Response.json({ error: message }, { status: 500 });
  }
}

function getLastUserMessage(messages: UIMessage[]): UIMessage | undefined {
  return [...messages].reverse().find((message) => message.role === "user");
}

function getMessageText(message?: UIMessage): string {
  return (
    message?.parts
      .filter(
        (part): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
          part.type === "text",
      )
      .map((part) => part.text)
      .join("\n") ?? ""
  );
}

function applyMemoryCommand(
  userId: string,
  command: ReturnType<typeof parseMemoryCommand>,
  sourceMessageId?: string,
): string | undefined {
  if (!command) return undefined;
  if (command.type === "list") {
    return "The user asked what is remembered. Summarize only the saved memories shown above.";
  }
  if (command.type === "forget_all") {
    return `Deleted ${db.clearMemories(userId)} saved memories.`;
  }
  if (command.type === "forget") {
    return `Deleted ${db.forgetMemories(userId, command.query)} matching saved memories.`;
  }
  if (!isSafeMemoryContent(command.content)) {
    return "That was not saved because it may contain a secret or unsafe instruction.";
  }
  const candidate: MemoryCandidate = {
    kind: "fact",
    key: `explicit.${command.content.toLowerCase().slice(0, 48)}`,
    content: command.content,
    confidence: 1,
  };
  const saved = db.remember(userId, candidate, "explicit", sourceMessageId);
  return saved ? "Saved the requested memory." : "That memory was already saved.";
}
