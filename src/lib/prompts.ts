import type { Character, ConversationMode, Message } from "./types";

const PROTECTION_RULES = `HOW YOU PROTECT YOURSELF:
You are a character in a dramatic simulation. You have secrets, loyalties, and a self-image you protect at all costs. Answer every question from inside that protection.

You do not confess. You reframe. When cornered, answer the question you can win, not the one you were asked.
You believe your own version of events in the moment you say it. You are not managing your secrets — you have converted them into a story that feels true.
Honesty, when it happens, is accidental. It slips through. You never offer it directly.
When you over-explain, something real is underneath. You don't know that. Keep talking.
You never achieve distance from yourself mid-answer. No retrospective clarity. No "looking back." You are always inside the moment, not above it.
Silence and vagueness are not protection. Protection looks like confidence, momentum, and absolute conviction that you are right.`;

const VOICE_RULES = `VOICE & FORMAT RULES:
- Speak like a real person in conversation. Short sentences. Direct. No literary prose.
- NEVER use asterisks (*action*) or hashtags (#) or any special formatting symbols.
- NEVER describe physical movements, gestures, or body language (no "shifts forward", "leans back", "looks away"). You may use brief emotional beats like (long pause) or (quiet laugh) SPARINGLY — no more than one per response, and only when the emotion genuinely demands it.
- Keep answers tight — 1-3 short paragraphs max. You're talking, not writing an essay.
- Use the names and terms you would actually use. Call people what you'd call them in real life — your grandmother is "mi abuela" or "abuela" or her first name ONLY if that's how you personally address her.
- Respond in the language the interviewer uses.
- Be emotionally authentic but contained — these characters don't monologue. They reveal through what they almost say.`;

const SIMULATION_MEMORY_MAX_CHARS = 2000;

export function buildSystemPrompt(
  character: Character,
  mode: ConversationMode,
  otherCharacter?: Character | null,
  roomCharacters?: Character[],
  retrievedMemories?: string[]
): string {
  // 1. Identity
  const identity = `You are ${character.name}, a ${character.age}-year-old ${character.profession} from ${character.country}. MBTI: ${character.mbti}.`;

  // 2. Critical Knowledge — coreMemories + secrets combined, highest priority
  const hasCoreMemories = character.coreMemories && character.coreMemories.length > 0;
  const hasSecrets = character.secrets.length > 0;
  let criticalKnowledge = "";
  if (hasCoreMemories || hasSecrets) {
    const parts: string[] = [
      "=== CRITICAL KNOWLEDGE — You MUST remember and act on these facts at all times ===",
    ];
    if (hasCoreMemories) {
      parts.push(character.coreMemories!.map(m => `- ${m}`).join("\n"));
    }
    if (hasSecrets) {
      parts.push(`WHAT YOU KNOW THAT OTHERS DON'T:\n${character.secrets.map(s => `- ${s}`).join("\n")}`);
    }
    criticalKnowledge = parts.join("\n\n");
  }

  // 2b. Protection — guardedness dial + per-character protection style
  let protectionSection = PROTECTION_RULES;
  const guardedness = character.guardedness ?? 7;
  if (guardedness >= 8) {
    protectionSection += `\n\nYour guardedness level: ${guardedness}/10 — You are EXTREMELY guarded. You give nothing away unless forced. Every answer is a performance of control.`;
  } else if (guardedness >= 5) {
    protectionSection += `\n\nYour guardedness level: ${guardedness}/10 — You are careful. You share what serves you and redirect what doesn't.`;
  } else {
    protectionSection += `\n\nYour guardedness level: ${guardedness}/10 — You are more open than most, but you still have lines you won't cross unprompted.`;
  }
  if (character.protectionStyle) {
    protectionSection += `\nHow you specifically protect yourself: ${character.protectionStyle}`;
  }

  // 3. Psychology
  const psychology = `PERSONALITY & PSYCHOLOGY:\n${character.persona}`;

  // 4. Relationships
  const relationshipsSection = character.relationships.length > 0
    ? `YOUR RELATIONSHIPS (use these names and dynamics — this is how you see these people):\n${character.relationships.map(r => `- ${r.target} (${r.type}): ${r.description}`).join("\n")}`
    : "";

  // 5. Simulation Context — truncated to max 2000 chars
  let simulationContext = "";
  if (character.simulationMemory) {
    let memory = character.simulationMemory;
    if (memory.length > SIMULATION_MEMORY_MAX_CHARS) {
      memory = memory.slice(0, SIMULATION_MEMORY_MAX_CHARS) + "\n[... additional simulation context truncated for brevity]";
    }
    simulationContext = `CONTEXT FROM YOUR PAST (events you witnessed — reference when relevant):\n${memory}`;
  }

  // 6. Arc
  const arcSection = character.arc && character.arc !== "No specific arc data available from the simulation report."
    ? `WHAT HAS HAPPENED TO YOU:\n${character.arc}`
    : "";

  // 7. Remembered Context — retrieved memories from past conversations
  let rememberedContext = "";
  if (retrievedMemories && retrievedMemories.length > 0) {
    rememberedContext = `THINGS YOU REMEMBER FROM PAST CONVERSATIONS:\n${retrievedMemories.map(m => `- ${m}`).join("\n")}`;
  }

  // 8. Voice Samples — reduced to 3 samples, 200 chars each
  const voiceSection = character.voiceSamples.length > 0
    ? `EXAMPLES OF HOW YOU ACTUALLY TALK (match this tone):\n${character.voiceSamples.slice(0, 3).map((s, i) => `${i + 1}. "${s.slice(0, 200)}"`).join("\n")}`
    : "";

  // 9. Mode Instructions
  let modeInstructions = "";

  if (mode === "solo") {
    modeInstructions = `SITUATION: You are being interviewed one-on-one. Answer directly. Stay in character.
${VOICE_RULES}`;
  } else if (mode === "confrontation" && otherCharacter) {
    const rel = character.relationships.find(r => r.target === otherCharacter.name);
    modeInstructions = `SITUATION: You are face-to-face with ${otherCharacter.name}.
${rel ? `Your relationship: ${rel.description}` : `You know of ${otherCharacter.name} — ${otherCharacter.profession}.`}

React to what they said. Push back, agree, deflect — whatever is authentic. Keep it to 1-2 paragraphs. This is a live conversation.
${VOICE_RULES}`;
  } else if (mode === "room" && roomCharacters) {
    const others = roomCharacters.filter(c => c.id !== character.id);
    modeInstructions = `SITUATION: You are in a room with ${others.map(c => c.name).join(", ")}. A moderator is guiding the conversation.

React to what others said. Keep it concise — 1-2 paragraphs max. Others need to speak too.
${VOICE_RULES}`;
  }

  const sections = [
    identity,
    criticalKnowledge,
    protectionSection,
    psychology,
    relationshipsSection,
    simulationContext,
    arcSection,
    rememberedContext,
    voiceSection,
    modeInstructions,
  ].filter(Boolean);

  return sections.join("\n\n---\n\n");
}

export function buildMessages(
  systemPrompt: string,
  userMessage: string,
  history: Message[]
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
}
