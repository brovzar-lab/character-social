import { NextRequest } from "next/server";
import { getCharacter } from "@/lib/characters";
import { buildSystemPrompt, buildMessages } from "@/lib/prompts";
import { streamChat } from "@/lib/llm";
import { createMemoryProvider } from "@/lib/memory-provider";
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

  // Memory is saved by the client via /api/memory/save after streaming completes
  // (includes both user message and full assistant response)

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
