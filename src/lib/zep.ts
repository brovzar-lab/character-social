import { ZepClient } from "@getzep/zep-cloud";

const apiKey = process.env.ZEP_API_KEY || "";
const graphId = process.env.ZEP_GRAPH_ID || "";

let client: ZepClient | null = null;

function getClient(): ZepClient {
  if (!client) {
    client = new ZepClient({ apiKey });
  }
  return client;
}

/** Build a unique user ID for a character in the Zep graph */
export function characterUserId(characterId: number, characterName: string): string {
  return `char_engine_${characterId}_${characterName.toLowerCase().replace(/\s+/g, "_")}`;
}

/** Search the Zep graph for facts relevant to a character + query */
export async function searchMemory(
  characterName: string,
  query: string,
  limit = 10
): Promise<{ facts: string[]; edges: Array<{ uuid: string; fact: string }> }> {
  if (!apiKey || !graphId) return { facts: [], edges: [] };

  try {
    const zep = getClient();
    const result = await zep.graph.search({
      graphId,
      query: `${characterName}: ${query}`,
      limit,
    });

    const facts: string[] = [];
    const edges: Array<{ uuid: string; fact: string }> = [];

    if (result.edges) {
      for (const edge of result.edges) {
        if (edge.fact) {
          facts.push(edge.fact);
          edges.push({ uuid: edge.uuid || "", fact: edge.fact });
        }
      }
    }

    return { facts, edges };
  } catch (error) {
    console.error("Zep search error:", error);
    return { facts: [], edges: [] };
  }
}

/** Get all known facts about a character from the graph */
export async function getCharacterMemories(
  characterName: string,
  limit = 30
): Promise<Array<{ uuid: string; fact: string; createdAt?: string }>> {
  if (!apiKey || !graphId) return [];

  try {
    const zep = getClient();
    const result = await zep.graph.search({
      graphId,
      query: characterName,
      limit,
    });

    const memories: Array<{ uuid: string; fact: string; createdAt?: string }> = [];

    if (result.edges) {
      for (const edge of result.edges) {
        if (edge.fact) {
          memories.push({
            uuid: edge.uuid || "",
            fact: edge.fact,
            createdAt: edge.createdAt || undefined,
          });
        }
      }
    }

    return memories;
  } catch (error) {
    console.error("Zep get memories error:", error);
    return [];
  }
}

/** Save a conversation exchange to the Zep graph */
export async function saveMemory(
  userId: string,
  messages: Array<{ role: string; content: string; roleType?: string }>
): Promise<void> {
  if (!apiKey || !graphId) return;

  try {
    const zep = getClient();
    await zep.graph.add({
      graphId,
      type: "message",
      userId,
      data: JSON.stringify({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          roleType: m.roleType || m.role,
        })),
      }),
    });
  } catch (error) {
    console.error("Zep save error:", error);
  }
}

/** Delete a specific fact/edge from the graph by UUID */
export async function deleteMemory(edgeUuid: string): Promise<boolean> {
  if (!apiKey || !graphId || !edgeUuid) return false;

  try {
    const zep = getClient();
    await zep.graph.edge.delete(edgeUuid);
    return true;
  } catch (error) {
    console.error("Zep delete error:", error);
    return false;
  }
}

/** Delete all memories matching a search query for a character */
export async function forgetAbout(
  characterName: string,
  topic: string
): Promise<number> {
  if (!apiKey || !graphId) return 0;

  try {
    const { edges } = await searchMemory(characterName, topic, 20);
    let deleted = 0;

    for (const edge of edges) {
      if (edge.uuid) {
        const success = await deleteMemory(edge.uuid);
        if (success) deleted++;
      }
    }

    return deleted;
  } catch (error) {
    console.error("Zep forget error:", error);
    return 0;
  }
}

/** Check if Zep is configured and reachable */
export async function isZepAvailable(): Promise<boolean> {
  if (!apiKey || !graphId) return false;
  try {
    const zep = getClient();
    await zep.graph.search({ graphId, query: "test", limit: 1 });
    return true;
  } catch {
    return false;
  }
}

export { graphId };
