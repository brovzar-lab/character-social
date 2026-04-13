import { NextRequest } from "next/server";
import { createProject } from "@/lib/characters-admin";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, name, description } = body as {
      slug: string;
      name: string;
      description: string;
    };

    if (!slug || !name || !description) {
      return Response.json(
        { error: "slug, name, and description are required" },
        { status: 400 }
      );
    }

    if (!SLUG_PATTERN.test(slug)) {
      return Response.json(
        { error: "slug must be lowercase alphanumeric with hyphens only" },
        { status: 400 }
      );
    }

    const project = createProject(slug, name, description);
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("already exists")
    ) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to create project";
    return Response.json({ error: message }, { status: 500 });
  }
}
