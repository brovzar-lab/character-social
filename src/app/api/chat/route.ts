import { NextRequest } from "next/server";
import { getCharacter } from "@/lib/characters";
import { buildSystemPrompt, buildMessages } from "@/lib/prompts";
import { streamChat } from "@/lib/llm";
import { searchMemory, saveMemory, characterUserId } from "@/lib/zep";
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

  // Query Zep for relevant memories before building the prompt
  let memoryContext = "";
  try {
    const { facts } = await searchMemory(character.name, message, 8);
    if (facts.length > 0) {
      memoryContext = `\n\nMEMORIES (things you know from the simulation and past conversations — reference these naturally when relevant):\n${facts.map(f => `- ${f}`).join("\n")}`;
    }
  } catch (e) {
    console.error("Zep recall error (non-fatal):", e);
  }

  // Build prompt with memory injected
  let systemPrompt = buildSystemPrompt(character, mode, otherCharacter);
  if (memoryContext) {
    systemPrompt += memoryContext;
  }

  const messages = buildMessages(systemPrompt, message, history);

  // Stream the response
  const stream = await streamChat(messages);

  // Save this exchange to Zep in background (don't block the stream)
  const userId = characterUserId(characterId, character.name);
  saveMemory(userId, [
    { role: "user", content: message, roleType: "interviewer" },
    // We'll save the assistant response after streaming completes on the client side
    // For now, save the question so Zep knows what was asked
  ]).catch(e => console.error("Zep save error (non-fatal):", e));

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
