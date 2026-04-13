export interface MemoryEntry {
  id: string;
  fact: string;
  createdAt: string;
  source: "conversation" | "manual" | "seed";
}

export interface SearchResult {
  facts: string[];
  edges: Array<{ uuid: string; fact: string }>;
}

export interface MemoryProvider {
  searchMemory(
    characterName: string,
    query: string,
    limit?: number
  ): Promise<SearchResult>;
  saveMemory(
    userId: string,
    messages: Array<{ role: string; content: string; roleType?: string }>
  ): Promise<void>;
  getCharacterMemories(
    characterName: string,
    limit?: number
  ): Promise<Array<{ uuid: string; fact: string; createdAt?: string }>>;
  deleteMemory(uuid: string): Promise<boolean>;
  forgetAbout(characterName: string, topic: string): Promise<number>;
  isAvailable(): Promise<boolean>;
  providerType: "local" | "zep";
}

// Re-export for backward compatibility
export { characterUserId } from "./zep";

// --- Zep wrapper (adapts existing zep.ts functions to MemoryProvider) ---

class ZepMemoryProvider implements MemoryProvider {
  public readonly providerType = "zep" as const;

  async searchMemory(
    characterName: string,
    query: string,
    limit = 10
  ): Promise<SearchResult> {
    const { searchMemory } = await import("./zep");
    return searchMemory(characterName, query, limit);
  }

  async saveMemory(
    userId: string,
    messages: Array<{ role: string; content: string; roleType?: string }>
  ): Promise<void> {
    const { saveMemory } = await import("./zep");
    return saveMemory(userId, messages);
  }

  async getCharacterMemories(
    characterName: string,
    limit = 30
  ): Promise<Array<{ uuid: string; fact: string; createdAt?: string }>> {
    const { getCharacterMemories } = await import("./zep");
    return getCharacterMemories(characterName, limit);
  }

  async deleteMemory(uuid: string): Promise<boolean> {
    const { deleteMemory } = await import("./zep");
    return deleteMemory(uuid);
  }

  async forgetAbout(characterName: string, topic: string): Promise<number> {
    const { forgetAbout } = await import("./zep");
    return forgetAbout(characterName, topic);
  }

  async isAvailable(): Promise<boolean> {
    const { isZepAvailable } = await import("./zep");
    return isZepAvailable();
  }
}

// --- Factory with caching ---

let cachedProvider: MemoryProvider | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Create (or return cached) MemoryProvider.
 * Prefers Zep when configured and reachable; falls back to local JSON storage.
 */
export async function createMemoryProvider(
  projectSlug = "oro-verde"
): Promise<MemoryProvider> {
  const now = Date.now();
  if (cachedProvider && now - cachedAt < CACHE_TTL) {
    return cachedProvider;
  }

  const apiKey = process.env.ZEP_API_KEY;
  const graphId = process.env.ZEP_GRAPH_ID;

  if (apiKey && graphId) {
    try {
      const { isZepAvailable } = await import("./zep");
      const available = await isZepAvailable();
      if (available) {
        cachedProvider = new ZepMemoryProvider();
        cachedAt = now;
        return cachedProvider;
      }
    } catch {
      // Zep import or connection failed — fall through to local
    }
  }

  const { LocalMemoryProvider } = await import("./local-memory");
  cachedProvider = new LocalMemoryProvider(projectSlug);
  cachedAt = now;
  return cachedProvider;
}
