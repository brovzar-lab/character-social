import { NextRequest, NextResponse } from "next/server";
import { getCharacters } from "@/lib/characters";

export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get("project");
  if (!project) return NextResponse.json({ error: "project required" }, { status: 400 });
  const characters = getCharacters(project);
  return NextResponse.json(characters);
}
