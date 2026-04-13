import { NextRequest } from "next/server";
import { updateProjectMeta } from "@/lib/characters-admin";
import type { ProjectMeta } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project } = await params;
    const body = (await request.json()) as Partial<
      Pick<ProjectMeta, "name" | "description">
    >;

    if (!body.name && !body.description) {
      return Response.json(
        { error: "At least one of name or description is required" },
        { status: 400 }
      );
    }

    const updated = updateProjectMeta(project, body);
    if (!updated) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ project: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update project";
    return Response.json({ error: message }, { status: 500 });
  }
}
