import type { Character, ProjectMeta } from "./types";
import * as fs from "fs";
import * as path from "path";

export function getProjects(): ProjectMeta[] {
  const dataDir = path.join(process.cwd(), "src", "data");
  if (!fs.existsSync(dataDir)) return [];

  return fs.readdirSync(dataDir)
    .filter(d => fs.existsSync(path.join(dataDir, d, "meta.json")))
    .map(d => {
      const meta = JSON.parse(fs.readFileSync(path.join(dataDir, d, "meta.json"), "utf-8"));
      return meta as ProjectMeta;
    });
}

export function getCharacters(projectSlug: string): Character[] {
  const filePath = path.join(process.cwd(), "src", "data", projectSlug, "characters.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function getCharacter(projectSlug: string, characterId: number): Character | null {
  const characters = getCharacters(projectSlug);
  return characters.find(c => c.id === characterId) || null;
}

export function getProjectMeta(projectSlug: string): ProjectMeta | null {
  const filePath = path.join(process.cwd(), "src", "data", projectSlug, "meta.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
