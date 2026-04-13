import { NextRequest, NextResponse } from "next/server";
import { createMemoryProvider } from "@/lib/memory-provider";
import { characterUserId } from "@/lib/zep";

/** POST /api/memory/save — save a conversation exchange to memory after streaming completes */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { characterId, characterName, userMessage, assistantResponse } = body;

  if (!characterId || !characterName || !userMessage || !assistantResponse) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const userId = characterUserId(characterId, characterName);

  try {
    const provider = await createMemoryProvider("oro-verde");
    await provider.saveMemory(userId, [
      { role: "user", content: userMessage, roleType: "interviewer" },
      { role: "assistant", content: assistantResponse, roleType: characterName },
    ]);
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Memory save error:", error);
    return NextResponse.json({ saved: false, error: String(error) }, { status: 500 });
  }
}
