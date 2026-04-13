import { NextRequest } from "next/server";
import { updateCharacter, deleteCharacter } from "@/lib/characters-admin";
import type { Character } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { project, character } = body as {
      project: string;
      character: Character;
    };

    if (!project || !character) {
      return Response.json(
        { error: "project and character are required" },
        { status: 400 }
      );
    }

    const updated = updateCharacter(project, parseInt(id), character);
    if (!updated) {
      return Response.json({ error: "Character not found" }, { status: 404 });
    }

    return Response.json({ character: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update character";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { project } = body as { project: string };

    if (!project) {
      return Response.json(
        { error: "project is required" },
        { status: 400 }
      );
    }

    const deleted = deleteCharacter(project, parseInt(id));
    if (!deleted) {
      return Response.json({ error: "Character not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete character";
    return Response.json({ error: message }, { status: 500 });
  }
}
