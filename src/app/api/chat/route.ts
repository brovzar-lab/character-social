import { NextRequest } from "next/server";
import { getCharacter } from "@/lib/characters";
import { buildSystemPrompt, buildMessages } from "@/lib/prompts";
import { streamChat } from "@/lib/llm";
import { createMemoryProvider } from "@/lib/memory-provider";
import { characterUserId } from "@/lib/zep";
import type { Message, ConversationMode } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    project,
    characterId,
    message,
    history = [],
    mode = "solo",
    otherCharacterId,
  } = body as {
    project: string;
    characterId: number;
    message: string;
    history: Message[];
    mode: ConversationMode;
    otherCharacterId?: number;
  };

  const character = getCharacter(project, characterId);
  if (!character) {
    return new Response(JSON.stringify({ error: "Character not found" }), { status: 404 });
  }

  const otherCharacter = otherCharacterId != null ? getCharacter(project, otherCharacterId) : null;

  // Query memory provider for relevant memories
  let facts: string[] = [];
  try {
    const provider = await createMemoryProvider("oro-verde");
    const result = await provider.searchMemory(character.name, message, 8);
    facts = result.facts;
  } catch (e) {
    console.error("Memory recall error (non-fatal):", e);
  }

  // Build prompt with memory facts passed directly
  const systemPrompt = buildSystemPrompt(character, mode, otherCharacter, undefined, facts);
  const messages = buildMessages(systemPrompt, message, history);

  // Stream the response
  const stream = await streamChat(messages);

  // Save this exchange to memory in background (don't block the stream)
  const userId = characterUserId(characterId, character.name);
  createMemoryProvider("oro-verde")
    .then(provider =>
      provider.saveMemory(userId, [
        { role: "user", content: message, roleType: "interviewer" },
        // We'll save the assistant response after streaming completes on the client side
        // For now, save the question so the provider knows what was asked
      ])
    )
    .catch(e => console.error("Memory save error (non-fatal):", e));

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
