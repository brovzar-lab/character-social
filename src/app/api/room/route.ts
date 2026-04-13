import { NextRequest, NextResponse } from "next/server";
import { getCharacter, getCharacters } from "@/lib/characters";
import { buildSystemPrompt, buildMessages } from "@/lib/prompts";
import { chat } from "@/lib/llm";
import type { Message } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    project,
    characterIds,
    message,
    roundHistory = [],
  } = body as {
    project: string;
    characterIds: number[];
    message: string;
    roundHistory: Message[];
  };

  const allCharacters = getCharacters(project);
  const roomCharacters = characterIds
    .map(id => allCharacters.find(c => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c != null);

  if (roomCharacters.length === 0) {
    return NextResponse.json({ error: "No characters found" }, { status: 404 });
  }

  // Call each character in sequence, feeding previous responses
  const responses: Array<{ characterId: number; name: string; response: string }> = [];
  const currentRoundMessages: Message[] = [];

  for (const character of roomCharacters) {
    const systemPrompt = buildSystemPrompt(character, "room", null, roomCharacters);

    // Build history including other characters' responses in this round
    const historyWithRound = [...roundHistory, ...currentRoundMessages];
    const messages = buildMessages(systemPrompt, message, historyWithRound);

    // Add previous responses from this round as context
    if (currentRoundMessages.length > 0) {
      const contextMsg = currentRoundMessages
        .map(m => `${m.characterName}: ${m.content}`)
        .join("\n\n");
      messages.push({
        role: "user",
        content: `[The following characters have already responded]\n\n${contextMsg}\n\n[Now it's your turn, ${character.name}. React to what was said and share your perspective.]`,
      });
    }

    const response = await chat(messages, { temperature: 0.85, maxTokens: 512 });

    responses.push({
      characterId: character.id,
      name: character.name,
      response,
    });

    currentRoundMessages.push({
      id: `room-${character.id}-${Date.now()}`,
      role: "assistant",
      content: response,
      characterId: character.id,
      characterName: character.name,
      timestamp: Date.now(),
    });
  }

  return NextResponse.json({ responses });
}
