import { NextRequest } from "next/server";
import { addCharacter } from "@/lib/characters-admin";
import type { Character } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, character } = body as {
      project: string;
      character: Omit<Character, "id">;
    };

    if (!project || !character) {
      return Response.json(
        { error: "project and character are required" },
        { status: 400 }
      );
    }

    const created = addCharacter(project, character);
    return Response.json({ character: created }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create character";
    return Response.json({ error: message }, { status: 500 });
  }
}
