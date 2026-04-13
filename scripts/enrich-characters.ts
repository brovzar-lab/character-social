/**
 * Enrich characters with simulation memory, merge agents, and clean up roster.
 *
 * This script:
 * 1. Loads all simulation actions (546 posts)
 * 2. Loads the report (4 chapters)
 * 3. Extracts per-character simulation memory (timeline of relevant events)
 * 4. Assigns report sections to characters based on what they'd know
 * 5. Merges duplicate agents (Javier, Lucía, Serrano accounts, Ingrid)
 * 6. Removes junk agents
 * 7. Outputs final 15-character roster
 *
 * Usage: npx tsx scripts/enrich-characters.ts
 */

import * as fs from "fs";
import * as path from "path";

// ─── Types ───

interface RawAction {
  round: number;
  timestamp: string;
  agent_id: number;
  agent_name: string;
  action_type: string;
  action_args?: { content?: string };
}

interface SimEvent {
  round: number;
  agentName: string;
  content: string;
}

// ─── Config ───

const PROJECT = "oro-verde";
const EXPORT_DIR = path.join(process.cwd(), "data", "exports", PROJECT);
const OUTPUT_DIR = path.join(process.cwd(), "src", "data", PROJECT);

// Character-specific search terms for finding relevant simulation posts
const CHARACTER_KEYWORDS: Record<number, string[]> = {
  100: ["benjam", "benjamin", "serrano", "grupo serrano", "CEO", "legitimacy", "performance", "legal threat", "amenaza legal", "corporate", "empresa", "empresa familiar"],
  101: ["karla", "hermana", "sister", "serrano siblings", "pressure", "presión", "moral"],
  102: ["isabel", "youngest", "photograph", "1982", "encrypted", "annex", "anexo", "cifrado", "safe", "caja fuerte", "investigation", "investigación interna", "poppy", "amapola", "ledger"],
  103: ["thief", "ladrón", "robbery", "robo", "safe", "caja fuerte", "blue folder", "carpeta azul", "蓝色文件", "stolen", "robado"],
  104: ["ezequiel", "don ", "cartel", "control", "surveillance", "vigilancia", "criminal", "operation", "operación"],
  105: ["gabriel", "housekeeper", "ama de llaves", "hacienda", "carmen.*secret", "carmen.*truth", "plane", "avión"],
  106: ["valeria", "wife", "esposa", "monterrey", "architect", "arquitecta", "marriage", "matrimonio"],
  107: ["ingrid", "journalist", "periodista", "investigat", "cervantes", "ernesto.*death", "murder", "asesinato", "evidence", "evidencia", "documents", "documentos"],
  108: ["emilio", "vega.*son", "hijo.*vega", "ernesto.*death", "safe.*code", "password", "contraseña", "burglary", "robo", "father.*death", "muerte.*padre"],
};

// Report section assignments per character (what they'd know)
const REPORT_SECTIONS: Record<number, number[]> = {
  100: [1, 4],      // Benjamín: Identity Engine + Asymmetric Games
  101: [1, 2],      // Karla: Identity Engine + Convergence
  102: [2, 3],      // Isabela: Convergence + Carmen's Ghost
  103: [3, 4],      // Thief: Carmen's Ghost + Asymmetric Games (blue folder only)
  104: [4, 1],      // Don Ezequiel: Asymmetric Games + Identity Engine
  105: [3],         // Gabriela: Carmen's Ghost
  106: [],          // Valeria: filtered - knows almost nothing
  107: [2],         // Ingrid: Convergence
  108: [2],         // Emilio: Convergence
};

// ─── Data Loading ───

function loadActions(): RawAction[] {
  const actions: RawAction[] = [];
  for (const file of ["twitter_actions.jsonl", "reddit_actions.jsonl"]) {
    const filePath = path.join(EXPORT_DIR, file);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, "utf-8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const a = JSON.parse(line);
        if (a.action_args?.content && a.agent_id !== undefined) {
          actions.push(a);
        }
      } catch {}
    }
  }
  return actions.sort((a, b) => (a.round || 0) - (b.round || 0));
}

function loadReportSections(): Record<number, string> {
  const sections: Record<number, string> = {};
  for (let i = 1; i <= 4; i++) {
    const filePath = path.join(EXPORT_DIR, "report", `section_0${i}.md`);
    if (fs.existsSync(filePath)) {
      sections[i] = fs.readFileSync(filePath, "utf-8");
    }
  }
  return sections;
}

// ─── Simulation Memory Extraction ───

function extractSimulationMemory(characterId: number, actions: RawAction[]): string {
  const keywords = CHARACTER_KEYWORDS[characterId] || [];
  if (keywords.length === 0) return "";

  const relevant: SimEvent[] = [];

  for (const action of actions) {
    const content = action.action_args?.content || "";
    const contentLower = content.toLowerCase();

    for (const kw of keywords) {
      if (contentLower.includes(kw.toLowerCase())) {
        relevant.push({
          round: action.round || 0,
          agentName: action.agent_name || "unknown",
          content: content.slice(0, 500),
        });
        break;
      }
    }
  }

  if (relevant.length === 0) return "";

  // Group by round ranges and summarize
  const timeline: string[] = [];
  const grouped = new Map<string, SimEvent[]>();

  for (const event of relevant) {
    const range = event.round < 10 ? "0-10" :
                  event.round < 30 ? "10-30" :
                  event.round < 60 ? "30-60" :
                  event.round < 90 ? "60-90" :
                  event.round < 120 ? "90-120" : "120+";
    if (!grouped.has(range)) grouped.set(range, []);
    grouped.get(range)!.push(event);
  }

  for (const [range, events] of grouped) {
    const summaries = events.slice(0, 5).map(e =>
      `[${e.agentName}, round ${e.round}]: "${e.content.slice(0, 250)}..."`
    );
    timeline.push(`Rounds ${range}:\n${summaries.join("\n")}`);
  }

  return timeline.join("\n\n");
}

// ─── Report Memory Assignment ───

function extractReportMemory(characterId: number, sections: Record<number, string>): string {
  const sectionIds = REPORT_SECTIONS[characterId] || [];
  if (sectionIds.length === 0) {
    if (characterId === 106) {
      return "You sense something has changed in Benjamín. He's more tense, more controlled, more absent. He comes home later. His phone is always face-down. When you ask what's wrong, he smiles the CEO smile — the one you've started to hate because it's the one he gives strangers. You don't know about Don Ezequiel, the criminal empire, the blue folder, or the investigation. You only know the man you married is dissolving, and something professional is replacing him.";
    }
    return "";
  }

  const parts: string[] = [];
  for (const id of sectionIds) {
    if (sections[id]) {
      // Truncate each section to ~2000 chars to keep prompt manageable
      const section = sections[id].slice(0, 2000);
      parts.push(section);
    }
  }

  return parts.join("\n\n---\n\n");
}

// ─── Voice Sample Extraction ───

function getVoiceSamples(agentIds: number[], actions: RawAction[], max = 8): string[] {
  const posts = actions
    .filter(a => agentIds.includes(a.agent_id) && a.action_type === "CREATE_POST" && a.action_args?.content)
    .map(a => a.action_args!.content!)
    .filter(c => c.length > 50 && c.length < 1500);

  if (posts.length <= max) return posts;
  const step = Math.floor(posts.length / max);
  return posts.filter((_, i) => i % step === 0).slice(0, max);
}

// ─── Main Build ───

function main() {
  console.log("Loading simulation data...");
  const actions = loadActions();
  console.log(`  ${actions.length} actions loaded`);

  const reportSections = loadReportSections();
  console.log(`  ${Object.keys(reportSections).length} report sections loaded`);

  // Load existing characters (the key characters from build-key-characters.ts)
  const existingPath = path.join(OUTPUT_DIR, "characters.json");
  const allChars = JSON.parse(fs.readFileSync(existingPath, "utf-8"));

  // Separate key characters (100+) from originals
  const keyChars = allChars.filter((c: any) => c.id >= 100 && c.id < 200);
  const originals = allChars.filter((c: any) => c.id < 100);

  console.log(`  ${keyChars.length} key characters, ${originals.length} original agents`);

  // ─── Step 1: Enrich key characters with simulation memory ───
  console.log("\nEnriching key characters with simulation memory...");
  for (const char of keyChars) {
    const simMemory = extractSimulationMemory(char.id, actions);
    const reportMemory = extractReportMemory(char.id, reportSections);

    char.simulationMemory = [
      simMemory ? `WHAT THE WORLD SAID (posts from the simulation that relate to you):\n\n${simMemory}` : "",
      reportMemory ? `WHAT HAPPENED (from the simulation analysis report — these are events you lived through):\n\n${reportMemory}` : "",
    ].filter(Boolean).join("\n\n===\n\n");

    const memorySize = char.simulationMemory.length;
    console.log(`  [${char.id}] ${char.name}: ${memorySize} chars of simulation memory`);
  }

  // ─── Step 2: Merge Ingrid (#1 → #107) ───
  console.log("\nMerging agents...");
  const ingridOriginal = originals.find((c: any) => c.id === 1);
  const ingridKey = keyChars.find((c: any) => c.id === 107);
  if (ingridOriginal && ingridKey) {
    // Merge voice samples from original agent
    const ingridSamples = getVoiceSamples([1], actions, 10);
    ingridKey.voiceSamples = ingridSamples;
    ingridKey.stats = {
      totalActions: ingridOriginal.stats?.totalActions || 71,
      postCount: ingridOriginal.stats?.postCount || 40,
      commentCount: ingridOriginal.stats?.commentCount || 31,
      rounds: 134,
    };
    console.log(`  Ingrid: merged ${ingridSamples.length} voice samples from agent #1`);
  }

  // ─── Step 3: Build merged agents ───

  // Javier merged (#9 + #12 → #200)
  const javierOriginals = originals.filter((c: any) => [9, 12].includes(c.id));
  const javierSamples = getVoiceSamples([9, 12], actions, 10);
  const javierProfile = originals.find((c: any) => c.id === 9);
  const javierMerged = {
    id: 200,
    name: "Javier Cordero",
    username: "javier_cordero",
    age: 40,
    gender: "male",
    profession: "CFO of Grupo Serrano",
    country: "Mexico (Michoacán)",
    mbti: "INTJ",
    bio: "Harvard MBA, bespoke suits, smile like a spreadsheet. Don Ezequiel's embedded analyst for years — accumulating information with the precision of a man who knows that knowledge withheld at the right moment is a weapon.",
    persona: `Javier Cordero, 40. CFO of Grupo Serrano. Enneagram Type 5w6 — The Strategist. Harvard MBA. He's been Don Ezequiel's embedded analyst for years — accumulating information with the precision of a man who knows that knowledge withheld at the right moment is a weapon.

WANT: Real power — to be the actual operator behind whoever sits in the CEO chair.
NEED: To admit he's not above the system he serves — he's its instrument.
FATAL FLAW: He believes he controls Don Ezequiel. He doesn't.

HOW HE SPEAKS: Clinical. Always prepared. References data before making any point. Uses financial metaphors. Rarely emotional — when he shows feeling, it's a calculated display.`,
    faction: "cartel",
    factionColor: "#DC2626",
    stance: "supportive",
    influence: 2.0,
    interests: ["financial strategy", "corporate governance", "Harvard alumni", "data analysis", "power"],
    voiceSamples: javierSamples,
    relationships: [
      { target: "Don Ezequiel Antona", type: "professional", description: "His real boss. He calls him Don Ezequiel. Reports the siblings' every move. But secretly building his own power base behind Ezequiel's back." },
      { target: "Benjamín Serrano", type: "professional", description: "The CEO he's supposed to serve. He calls him Benjamín. Tried to block him at the funeral. Knows Benjamín can do what he never can — perform for cameras." },
      { target: "Karla Serrano", type: "enemy", description: "She physically stopped him at the memorial. He calls her Karla. She intimidates him — she's the only one who acts on instinct." },
      { target: "Carmen Serrano", type: "professional", description: "The woman he could never replace. He calls her Doña Carmen. She was the face. He's just the numbers." },
    ],
    arc: "Javier is quietly building what the main players can't see — positioning himself as the real operator behind the CEO chair. He understands the criminal operation completely, unlike Don Ezequiel who doesn't know about the blue folder. He watched Benjamín deliver the funeral speech and recognized: he could never do that. That single recognition is his weakness.",
    secrets: [
      "He's secretly building his own power base behind Don Ezequiel's back.",
      "He knows the full criminal operation — more than Don Ezequiel knows about the blue folder.",
      "He recognized at the funeral that Benjamín can do what he never can — be the face.",
      "Don Ezequiel believes he controls Javier, but Javier is doing things Ezequiel doesn't know about.",
    ],
    simulationMemory: extractSimulationMemory(200, actions) || "Javier operated as the embedded financial analyst, maintaining Grupo Serrano's corporate facade while feeding intelligence to Don Ezequiel. His social media presence projected Harvard-polished financial expertise and ESG commitment — the perfect cover.",
    stats: {
      totalActions: javierOriginals.reduce((sum: number, c: any) => sum + (c.stats?.totalActions || 0), 0),
      postCount: javierOriginals.reduce((sum: number, c: any) => sum + (c.stats?.postCount || 0), 0),
      commentCount: 0,
      rounds: 134,
    },
  };
  console.log(`  Javier: merged agents #9 + #12 → ${javierSamples.length} voice samples, ${javierMerged.stats.totalActions} actions`);

  // Lucía merged (#15 + #16 → #201)
  const luciaSamples = getVoiceSamples([15, 16], actions, 10);
  const luciaMerged = {
    id: 201,
    name: "Lucía Suárez",
    username: "lucia_suarez",
    age: 35,
    gender: "female",
    profession: "Environmental activist",
    country: "Mexico (Michoacán)",
    mbti: "ENFJ",
    bio: "She fights against Grupo Serrano's destruction of Michoacán's rivers and forests with a megaphone, a live feed, and a moral clarity that makes Benjamín feel transparent. The only character who says exactly what she thinks.",
    persona: `Lucía Suárez, 35. Environmental activist. Enneagram Type 1w2 — The Defender. She fights against Grupo Serrano's destruction of Michoacán's rivers and forests with a megaphone, a live feed, and a moral clarity that makes Benjamín feel transparent.

WANT: A sustainable avocado industry that doesn't destroy the communities it depends on.
NEED: To allow for human complexity without abandoning her principles.
FATAL FLAW: She sees in black and white. The grey zone where Benjamín lives is, to her, simply moral failure.

HOW SHE SPEAKS: Direct, specific, grounded in concrete examples. Knows the name of every family whose land was taken. Uses data and emotion together. Never abstract when she can be personal.`,
    faction: "public",
    factionColor: "#D97706",
    stance: "opposing",
    influence: 2.0,
    interests: ["environmental justice", "anti-corruption", "community organizing", "Michoacán rivers", "sustainable agriculture"],
    voiceSamples: luciaSamples,
    relationships: [
      { target: "Benjamín Serrano", type: "romantic", description: "She calls him Benjamín. She's described as his conscience. She sees through his performance — the only person who does and cannot be bought. She told him: '¿Sabes qué es peor que no hacer nada? Hacer como que te importa.'" },
      { target: "Carmen Serrano", type: "enemy", description: "She references Carmen as the matriarch who built an empire on stolen land. She received information Carmen mentioned about Ernesto knowing an encrypted annex — she considers this 'Carmen speaking from beyond the grave.'" },
      { target: "Grupo Serrano", type: "enemy", description: "The corporation she's fighting. She has publicly confronted their 'transparency theater.'" },
    ],
    arc: "Lucía is the thermometer for Benjamín's corruption. Every step he takes toward Don Ezequiel is a step away from her. She publicly confronted Grupo Serrano, received death threats, and kept fighting. She validated evidence that emerged as 'Carmen speaking from beyond the grave.' She knows Benjamín performs caring for the communities he is helping to destroy.",
    secrets: [
      "She received information about Carmen mentioning an encrypted annex held by Ernesto.",
      "She considers this information as 'Carmen speaking from beyond the grave.'",
      "She knows Benjamín's corporate responses show a disconnect from the severity of the criminal legacy.",
      "She has received multiple death threats for her activism against the Serranos.",
    ],
    simulationMemory: extractSimulationMemory(201, actions) || "",
    stats: {
      totalActions: 128,
      postCount: 80,
      commentCount: 48,
      rounds: 134,
    },
  };
  console.log(`  Lucía: merged agents #15 + #16 → ${luciaSamples.length} voice samples, 128 actions`);

  // Serrano Social (merge #4, #10, #11, #17, #18 → #202)
  const serranoIds = [4, 10, 11, 17, 18];
  const serranoSamples = getVoiceSamples(serranoIds, actions, 10);
  const serranoSocial = {
    id: 202,
    name: "Serrano Social",
    username: "grupo_serrano_oficial",
    age: 0,
    gender: "organization",
    profession: "Grupo Serrano Official Social Media",
    country: "Mexico",
    mbti: "N/A",
    bio: "The official public voice of Grupo Serrano — the family's curated social media presence. Everything posted here is performance. ESG commitments, sustainability reports, community engagement. The legitimate face of a criminal empire.",
    persona: `This is the official social media account of Grupo Serrano, the Serrano family's agricultural business empire. Everything posted here is performance — carefully curated corporate communications designed to maintain the appearance of a clean, ESG-committed agribusiness.

HOW IT SPEAKS: Corporate polish. Sustainability buzzwords. Community engagement language. Never acknowledges the criminal infrastructure beneath. This account is the embodiment of the Serrano performance.`,
    faction: "serrano_family",
    factionColor: "#8B5CF6",
    stance: "supportive",
    influence: 1.5,
    interests: ["ESG", "sustainability", "avocado industry", "corporate communications"],
    voiceSamples: serranoSamples,
    relationships: [],
    arc: "The family's corporate social media maintained a perfect facade throughout the simulation — posting about sustainability, community engagement, and agricultural innovation while the family's criminal connections were being investigated.",
    secrets: [],
    simulationMemory: "",
    stats: {
      totalActions: serranoIds.reduce((sum, id) => {
        const orig = originals.find((c: any) => c.id === id);
        return sum + (orig?.stats?.totalActions || 0);
      }, 0),
      postCount: 0,
      commentCount: 0,
      rounds: 134,
    },
  };
  console.log(`  Serrano Social: merged agents #4,#10,#11,#17,#18 → ${serranoSamples.length} voice samples, ${serranoSocial.stats.totalActions} actions`);

  // ─── Step 4: Keep Reynaldo (#0) and Journalists (#14) ───
  const reynaldo = originals.find((c: any) => c.id === 0);
  const journalists = originals.find((c: any) => c.id === 14);

  // Add simulationMemory to kept originals
  if (reynaldo) {
    reynaldo.simulationMemory = reynaldo.simulationMemory || "";
    const samples = getVoiceSamples([0], actions, 6);
    if (samples.length > 0) reynaldo.voiceSamples = samples;
  }
  if (journalists) {
    journalists.simulationMemory = journalists.simulationMemory || "";
    const samples = getVoiceSamples([14], actions, 8);
    if (samples.length > 0) journalists.voiceSamples = samples;
  }

  // ─── Step 5: Assemble final roster ───
  const finalRoster = [
    ...keyChars,           // 9 key characters (100-108)
    ...(reynaldo ? [reynaldo] : []),  // Reynaldo (#0)
    ...(journalists ? [journalists] : []),  // Journalists (#14)
    javierMerged,          // Javier (#200)
    luciaMerged,           // Lucía (#201)
    serranoSocial,         // Serrano Social (#202)
  ];

  // ─── Step 6: Write output ───
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "characters.json"),
    JSON.stringify(finalRoster, null, 2)
  );

  // Update meta
  const metaPath = path.join(OUTPUT_DIR, "meta.json");
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  meta.characterCount = finalRoster.length;
  meta.description = `${finalRoster.length} characters (9 key + 5 supporting), enriched with simulation memory`;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  console.log(`\n=== FINAL ROSTER: ${finalRoster.length} characters ===`);
  finalRoster.forEach((c: any) => {
    const memSize = (c.simulationMemory || "").length;
    const samplesCount = (c.voiceSamples || []).length;
    console.log(`  [${c.id}] ${c.name} — ${c.faction} — ${memSize} chars memory, ${samplesCount} voice samples, ${c.stats?.totalActions || 0} actions`);
  });
}

main();
