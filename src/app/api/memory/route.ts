import { NextRequest, NextResponse } from "next/server";
import {
  getCharacterMemories,
  deleteMemory,
  forgetAbout,
  searchMemory,
  isZepAvailable,
} from "@/lib/zep";

/** GET /api/memory?character=Benjamín Serrano — list memories for a character */
export async function GET(request: NextRequest) {
  const characterName = request.nextUrl.searchParams.get("character");
  if (!characterName) {
    return NextResponse.json({ error: "character param required" }, { status: 400 });
  }

  const available = await isZepAvailable();
  if (!available) {
    return NextResponse.json({ memories: [], available: false });
  }

  const memories = await getCharacterMemories(characterName);
  return NextResponse.json({ memories, available: true });
}

/** POST /api/memory — actions: delete, forget, search */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, characterName, edgeUuid, topic, query } = body;

  const available = await isZepAvailable();
  if (!available) {
    return NextResponse.json({ error: "Zep not available", available: false }, { status: 503 });
  }

  if (action === "delete" && edgeUuid) {
    const success = await deleteMemory(edgeUuid);
    return NextResponse.json({ success });
  }

  if (action === "forget" && characterName && topic) {
    const deleted = await forgetAbout(characterName, topic);
    return NextResponse.json({ deleted, topic });
  }

  if (action === "search" && characterName && query) {
    const result = await searchMemory(characterName, query);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
