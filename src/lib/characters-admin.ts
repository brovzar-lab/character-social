import type { Character, ProjectMeta } from "./types";
import * as fs from "fs";
import * as path from "path";
import { getCharacters, getProjectMeta } from "./characters";

const DATA_DIR = path.join(process.cwd(), "src", "data");

function writeJsonSafe(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, filePath);
}

function getNextCharacterId(characters: Character[]): number {
  if (characters.length === 0) return 1;
  return Math.max(...characters.map((c) => c.id)) + 1;
}

export function saveCharacters(
  projectSlug: string,
  characters: Character[]
): void {
  const filePath = path.join(DATA_DIR, projectSlug, "characters.json");
  writeJsonSafe(filePath, characters);
}

export function addCharacter(
  projectSlug: string,
  data: Omit<Character, "id">
): Character {
  const characters = getCharacters(projectSlug);
  const id = getNextCharacterId(characters);
  const character: Character = { id, ...data };
  characters.push(character);
  saveCharacters(projectSlug, characters);
  updateProjectMeta(projectSlug, { characterCount: characters.length });
  return character;
}

export function updateCharacter(
  projectSlug: string,
  id: number,
  data: Character
): Character | null {
  const characters = getCharacters(projectSlug);
  const idx = characters.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  characters[idx] = { ...data, id };
  saveCharacters(projectSlug, characters);
  return characters[idx];
}

export function deleteCharacter(
  projectSlug: string,
  id: number
): boolean {
  const characters = getCharacters(projectSlug);
  const filtered = characters.filter((c) => c.id !== id);
  if (filtered.length === characters.length) return false;
  saveCharacters(projectSlug, filtered);
  updateProjectMeta(projectSlug, { characterCount: filtered.length });
  return true;
}

export function createProject(
  slug: string,
  name: string,
  description: string
): ProjectMeta {
  const projectDir = path.join(DATA_DIR, slug);
  if (fs.existsSync(projectDir)) {
    throw new Error(`Project "${slug}" already exists`);
  }
  fs.mkdirSync(projectDir, { recursive: true });

  const meta: ProjectMeta = {
    slug,
    name,
    description,
    characterCount: 0,
    totalActions: 0,
    exportDate: new Date().toISOString(),
  };
  writeJsonSafe(path.join(projectDir, "meta.json"), meta);
  writeJsonSafe(path.join(projectDir, "characters.json"), []);
  return meta;
}

export function updateProjectMeta(
  projectSlug: string,
  updates: Partial<ProjectMeta>
): ProjectMeta | null {
  const meta = getProjectMeta(projectSlug);
  if (!meta) return null;
  const updated = { ...meta, ...updates, slug: meta.slug };
  writeJsonSafe(path.join(DATA_DIR, projectSlug, "meta.json"), updated);
  return updated;
}
