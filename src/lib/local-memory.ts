import * as fs from "fs";
import * as path from "path";
import type { MemoryProvider, MemoryEntry, SearchResult } from "./memory-provider";

/** Slugify a character name for use as a filename */
function slugifyName(characterName: string): string {
  return characterName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Get the full file path for a character's memory JSON */
function getMemoryFilePath(projectSlug: string, characterName: string): string {
  return path.join(
    process.cwd(),
    "src",
    "data",
    projectSlug,
    "memories",
    `${slugifyName(characterName)}.json`
  );
}

/** Read memories from disk, returning empty array if file doesn't exist */
function readMemories(filePath: string): MemoryEntry[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as MemoryEntry[];
  } catch {
    return [];
  }
}

/** Write memories to disk atomically (write to .tmp then rename) */
function writeMemories(filePath: string, memories: MemoryEntry[]): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(memories, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}

/** Extract character name from a userId string like "char_engine_3_karla_serrano" */
function extractCharacterName(userId: string): string {
  const parts = userId.split("_");
  // Format: char_engine_{id}_{name_with_underscores}
  if (parts.length >= 4 && parts[0] === "char" && parts[1] === "engine") {
    return parts
      .slice(3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return userId;
}

export class LocalMemoryProvider implements MemoryProvider {
  public readonly providerType = "local" as const;
  private projectSlug: string;

  constructor(projectSlug: string) {
    this.projectSlug = projectSlug;
  }

  async searchMemory(
    characterName: string,
    query: string,
    limit = 10
  ): Promise<SearchResult> {
    const filePath = getMemoryFilePath(this.projectSlug, characterName);
    const memories = readMemories(filePath);

    if (memories.length === 0) {
      return { facts: [], edges: [] };
    }

    // Tokenize query into lowercase keywords, filtering short words
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    // Score each memory
    const scored = memories.map((mem) => {
      const factLower = mem.fact.toLowerCase();
      let score = 0;

      // Count keyword matches
      for (const kw of keywords) {
        if (factLower.includes(kw)) {
          score++;
        }
      }

      // Recency bonus
      const age = now - new Date(mem.createdAt).getTime();
      if (age < sevenDays) {
        score += 2;
      } else if (age < thirtyDays) {
        score += 1;
      }

      return { mem, score };
    });

    // Sort by score descending, take top limit
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit).filter((s) => s.score > 0);

    return {
      facts: top.map((s) => s.mem.fact),
      edges: top.map((s) => ({ uuid: s.mem.id, fact: s.mem.fact })),
    };
  }

  async saveMemory(
    userId: string,
    messages: Array<{ role: string; content: string; roleType?: string }>
  ): Promise<void> {
    const characterName = extractCharacterName(userId);
    const filePath = getMemoryFilePath(this.projectSlug, characterName);

    // Find the last assistant message
    const assistantMsg = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!assistantMsg) return;

    // Truncate content to 500 characters
    const truncated =
      assistantMsg.content.length > 500
        ? assistantMsg.content.slice(0, 500) + "..."
        : assistantMsg.content;

    const fact = `${characterName} said: ${truncated}`;
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const entry: MemoryEntry = {
      id,
      fact,
      createdAt: new Date().toISOString(),
      source: "conversation",
    };

    const memories = readMemories(filePath);

    // Deduplication: skip if a very similar fact was saved in the last 60 seconds
    const now = Date.now();
    const factWords = new Set(fact.toLowerCase().split(/\s+/));
    const isDuplicate = memories.some((existing) => {
      const age = now - new Date(existing.createdAt).getTime();
      if (age > 60_000) return false;
      const existingWords = new Set(existing.fact.toLowerCase().split(/\s+/));
      const overlap = [...factWords].filter((w) => existingWords.has(w)).length;
      const similarity = overlap / Math.max(factWords.size, existingWords.size);
      return similarity > 0.8;
    });

    if (isDuplicate) return;

    memories.push(entry);
    writeMemories(filePath, memories);
  }

  async getCharacterMemories(
    characterName: string,
    limit = 30
  ): Promise<Array<{ uuid: string; fact: string; createdAt?: string }>> {
    const filePath = getMemoryFilePath(this.projectSlug, characterName);
    const memories = readMemories(filePath);

    // Sort by createdAt descending
    memories.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return memories.slice(0, limit).map((m) => ({
      uuid: m.id,
      fact: m.fact,
      createdAt: m.createdAt,
    }));
  }

  async deleteMemory(uuid: string): Promise<boolean> {
    // We need to search across all memory files for this project
    const memoriesDir = path.join(
      process.cwd(),
      "src",
      "data",
      this.projectSlug,
      "memories"
    );
    if (!fs.existsSync(memoriesDir)) return false;

    const files = fs.readdirSync(memoriesDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(memoriesDir, file);
      const memories = readMemories(filePath);
      const filtered = memories.filter((m) => m.id !== uuid);

      if (filtered.length < memories.length) {
        writeMemories(filePath, filtered);
        return true;
      }
    }

    return false;
  }

  async forgetAbout(characterName: string, topic: string): Promise<number> {
    const filePath = getMemoryFilePath(this.projectSlug, characterName);
    const memories = readMemories(filePath);
    const topicLower = topic.toLowerCase();

    const remaining = memories.filter(
      (m) => !m.fact.toLowerCase().includes(topicLower)
    );
    const deletedCount = memories.length - remaining.length;

    if (deletedCount > 0) {
      writeMemories(filePath, remaining);
    }

    return deletedCount;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
