import { NextRequest, NextResponse } from "next/server";
import { createMemoryProvider } from "@/lib/memory-provider";

/** GET /api/memory?character=Benjamin Serrano — list memories for a character */
export async function GET(request: NextRequest) {
  const characterName = request.nextUrl.searchParams.get("character");
  if (!characterName) {
    return NextResponse.json({ error: "character param required" }, { status: 400 });
  }

  const provider = await createMemoryProvider("oro-verde");
  const available = await provider.isAvailable();
  if (!available) {
    return NextResponse.json({ memories: [], available: false, provider: provider.providerType });
  }

  const memories = await provider.getCharacterMemories(characterName);
  return NextResponse.json({ memories, available: true, provider: provider.providerType });
}

/** POST /api/memory — actions: delete, forget, search */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, characterName, edgeUuid, topic, query } = body;

  const provider = await createMemoryProvider("oro-verde");
  const available = await provider.isAvailable();
  if (!available) {
    return NextResponse.json(
      { error: "Memory provider not available", available: false, provider: provider.providerType },
      { status: 503 }
    );
  }

  if (action === "delete" && edgeUuid) {
    const success = await provider.deleteMemory(edgeUuid);
    return NextResponse.json({ success });
  }

  if (action === "forget" && characterName && topic) {
    const deleted = await provider.forgetAbout(characterName, topic);
    return NextResponse.json({ deleted, topic });
  }

  if (action === "search" && characterName && query) {
    const result = await provider.searchMemory(characterName, query);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
