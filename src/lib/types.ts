export interface Relationship {
  target: string;
  type: "family" | "ally" | "enemy" | "professional" | "romantic" | "unknown";
  description: string;
}

export interface CharacterStats {
  totalActions: number;
  postCount: number;
  commentCount: number;
  rounds: number;
}

export interface Character {
  id: number;
  name: string;
  username: string;
  age: number;
  gender: string;
  profession: string;
  country: string;
  mbti: string;
  enneagramType?: number;
  enneagramWing?: number;
  enneagramDescription?: string;
  bio: string;
  persona: string;
  faction: string;
  factionColor: string;
  stance: string;
  influence: number;
  interests: string[];
  voiceSamples: string[];
  relationships: Relationship[];
  arc: string;
  secrets: string[];
  simulationMemory: string;
  stats: CharacterStats;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  characterId?: number;
  characterName?: string;
  timestamp: number;
}

export interface Room {
  id: string;
  characterIds: number[];
  messages: Message[];
  createdAt: number;
}

export type ConversationMode = "solo" | "confrontation" | "room";

export interface ChatRequest {
  characterId: number;
  message: string;
  history: Message[];
  mode: ConversationMode;
  otherCharacterId?: number;
}

export interface RoomRequest {
  characterIds: number[];
  message: string;
  roundHistory: Message[];
}

export interface ProjectMeta {
  slug: string;
  name: string;
  description: string;
  characterCount: number;
  totalActions: number;
  exportDate: string;
  simulationRequirement?: string;
}
