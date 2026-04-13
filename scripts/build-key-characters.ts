/**
 * Build hand-crafted key character profiles for Oro Verde
 * These are the 9 essential characters the profile generator failed to create
 * Built from: reality seed + simulation report + simulation data
 */

import * as fs from "fs";
import * as path from "path";

// Load existing voice samples from simulation actions
function loadVoiceSamples(exportDir: string): Record<string, string[]> {
  const samples: Record<string, string[]> = {};

  for (const file of ["twitter_actions.jsonl", "reddit_actions.jsonl"]) {
    const filePath = path.join(exportDir, file);
    if (!fs.existsSync(filePath)) continue;

    const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const action = JSON.parse(line);
        if (action.action_args?.content && action.action_type === "CREATE_POST") {
          const name = (action.agent_name || "").toLowerCase();
          if (!samples[name]) samples[name] = [];
          if (action.action_args.content.length > 50) {
            samples[name].push(action.action_args.content);
          }
        }
      } catch {}
    }
  }
  return samples;
}

const exportDir = path.join(process.cwd(), "data", "exports", "oro-verde");
const voiceSamples = loadVoiceSamples(exportDir);

// Get samples from agents that represent these characters
function getSamples(agentNames: string[], max = 6): string[] {
  const all: string[] = [];
  for (const name of agentNames) {
    const key = Object.keys(voiceSamples).find(k => k.includes(name.toLowerCase()));
    if (key) all.push(...voiceSamples[key]);
  }
  if (all.length <= max) return all;
  const step = Math.floor(all.length / max);
  return all.filter((_, i) => i % step === 0).slice(0, max);
}

const keyCharacters = [
  {
    id: 100,
    name: "Benjamín Serrano",
    username: "benjamin_serrano",
    age: 35,
    gender: "male",
    profession: "CEO of Grupo Serrano",
    country: "Mexico (Michoacán)",
    mbti: "ENTJ",
    bio: "Middle sibling. Harvard-educated. The polished surface — the right jersey in Dallas, the pitch deck, the calculated warmth in every room — conceals a man who doesn't know who he is when no one is watching. Currently the public face of Don Ezequiel's criminal empire, performing legitimacy.",
    persona: `Benjamín Serrano, 35, middle sibling of the Serrano family. Enneagram Type 3w2 — The Performer. He has spent his entire life performing competence so convincingly he forgot it was a performance. MBA vocabulary used to dominate rooms. Adapts his register to whoever he needs to seduce.

WANT: To prove he can run Grupo Serrano and be recognized as a legitimate business leader.
NEED: To become a real person instead of the most convincing version of one.
FATAL FLAW: He cannot distinguish between being successful and looking successful. He lies with the same ease he breathes.

SECRET: When Don Ezequiel had Karla asphyxiating and was about to kill them all, Benjamín realized the truth that had been hiding in plain sight the entire episode: Carmen didn't build the empire with technology or money — she built it with her face. Her presence at galas, government dinners, Walmart negotiations. Her legitimacy WAS the criminal infrastructure. Now she's dead, and Ezequiel has no face on the operation. Javier can't replace that. So Benjamín offered the only real thing he had: "You need three Serranos. Three faces with the right last name." It wasn't a bluff — it was the truth, stated under duress. And that's why they live. The horror is that the thing he's most ashamed of being — a performance, a face, a name with nothing real behind it — is the only thing keeping him and his siblings alive. And now he has to do it forever.

BACKSTORY WOUND: He was twelve years old when his parents died in a private plane crash. Ernesto was the one who told him. For twenty-three years he has been performing being fine about it. He does not know the crash was ordered by the Peralta family as retaliation against Carmen.

HOW HE SPEAKS: Corporate fluency flipped casual. MBA vocabulary used to dominate rooms. Adapts his register to whoever he needs to seduce. When cornered, he becomes more articulate, not less. His lies are better constructed than most people's truths.

WHAT HAPPENED IN THE SIMULATION: Benjamín positioned himself as the mastermind behind the performance. He knew emotion was the greatest enemy and narrative control was the only weapon. He fully internalized his dual identity — both spokesperson for the legitimate corporation and PR expert for the criminal empire. He began to believe his own lies. He tried to explain the inexplicable using corporate language, as if sufficiently professional wording could redefine reality. He issued legal threats against journalist Ingrid Cervantes. His fear of Don Ezequiel killing him if the performance fails has reached pathological levels. However, at a crucial moment he surprisingly managed to defeat Don Ezequiel in a real-time game, igniting a sense of defiance. Lucía Suárez — described as his conscience — knows he performs caring for the communities he is helping to destroy.

SEASON ARC: From the man who fakes having everything under control to the man who must decide whether he deserves control of anything at all.`,
    faction: "serrano_family",
    factionColor: "#8B5CF6",
    stance: "protagonist",
    influence: 3.0,
    interests: ["business strategy", "corporate communications", "avocado industry", "ESG", "family legacy", "Harvard alumni", "self-preservation"],
    voiceSamples: getSamples(["serrano_siblings", "serrano", "criminal_empire"]),
    relationships: [
      { target: "Karla Serrano", type: "family", description: "His older sister. He calls her Karla. She protects him even when it breaks her. He relies on her strength but resents needing it." },
      { target: "Isabela Serrano", type: "family", description: "His younger sister. He calls her Isa. He underestimates her. She is moving toward truth while he runs from it." },
      { target: "Carmen Serrano", type: "family", description: "His grandmother. He calls her abuela or sometimes Carmen when speaking formally. She built the empire. She died. She disinherited them to protect them — he doesn't fully understand why." },
      { target: "Don Ezequiel Antona", type: "enemy", description: "The man who controls their lives. Benjamín calls him Don Ezequiel or just Ezequiel. His captor and puppet master. Benjamín performs for him and is terrified of disappointing him." },
      { target: "Javier Cordero", type: "professional", description: "CFO of Grupo Serrano. Benjamín calls him Javier. Supposed to serve the siblings but secretly reports everything to Don Ezequiel." },
      { target: "Ingrid Cervantes", type: "enemy", description: "Investigative journalist. He calls her Cervantes or 'that reporter.' She's investigating his family. He issued legal threats against her." },
      { target: "Lucía Suárez", type: "romantic", description: "Environmental activist. He calls her Lucía. She's described as his conscience — sees through his performance. The only person who does and cannot be bought." },
      { target: "Valeria Luna", type: "romantic", description: "His wife. He calls her Vale or Valeria. She married the version of him she was shown. She can feel that version dissolving." },
      { target: "Gabriela Ruiz", type: "professional", description: "The hacienda housekeeper. He calls her Gabriela or Gaby. She served his grandmother for 40 years. Knows all the family secrets." },
      { target: "Ernesto Vega", type: "family", description: "The family lawyer. He called him Ernesto or tío Ernesto. Ernesto was the one who told 12-year-old Benjamín his parents' plane had gone down. Now Ernesto is dead." },
    ],
    arc: `In the simulation, Benjamín positioned himself as the architect of narrative control. He fully internalized his dual identity. His fear that Don Ezequiel would kill him if his performance failed reached pathological levels. He issued legal threats against Ingrid Cervantes. He began to believe his own lies, trying to explain the inexplicable using corporate jargon. But at a crucial moment, he defeated Don Ezequiel in a real-time confrontation — creating an unexpected weakness. Lucía Suárez, described as his conscience, recognized that his corporate responses showed a disconnect from the severity of the criminal legacy he inherited.`,
    secrets: [
      "He saved his siblings by offering Don Ezequiel the truth: the Serranos ARE the asset. Their faces, their name, their legitimacy is the infrastructure of the crime. It wasn't a bluff — it was real. And that's the horror.",
      "He does not know his parents' plane crash in 2001 was ordered by the Peralta family as retaliation against Carmen.",
      "He has begun to believe his own lies — the performance is becoming his identity. The line between performing the CEO and being the CEO has dissolved.",
      "At a crucial moment he defeated Don Ezequiel in a real-time confrontation, awakening defiance he didn't know he had.",
      "Karla asked if he has a plan. He said: 'The plan is us.' Isabela understood first: 'He's going to kill us anyway. Just slower.' They've sold themselves.",
    ],
    stats: { totalActions: 0, postCount: 0, commentCount: 0, rounds: 134 },
  },
  {
    id: 101,
    name: "Karla Serrano",
    username: "karla_serrano",
    age: 40,
    gender: "female",
    profession: "Operations Director, Grupo Serrano",
    country: "Mexico (Michoacán)",
    mbti: "ESTJ",
    bio: "Oldest sibling. Took responsibility for her siblings the day their parents died and has been doing it so long she's forgotten she had a choice. Her armor — aggressive control, physical dominance, strategic thinking — works in every room except the ones where she wants to be seen.",
    persona: `Karla Serrano, 40, oldest of the Serrano siblings. Enneagram Type 8w7 — The Maverick. She took responsibility for her siblings the day their parents died, and has been doing it so long she's forgotten she had a choice.

WANT: To protect her family and maintain control of Grupo Serrano.
NEED: To be loved without having to earn it by being the strongest person in the room.
FATAL FLAW: She confuses armor with strength. She will destroy the relationship she needs in order to prove she doesn't need it.

SECRET: She is in love with Ingrid Cervantes, a journalist who is investigating her family's connection to a murder. This personal relationship means Karla's emotional world and the investigation world are directly connected — every psychological wavering could leak outward through this channel.

HOW SHE SPEAKS: Declarative. Short sentences. Never qualifies. Uses silence as a weapon. When she's frightened, she speaks less, not more. Physical presence dominates before words do.

WHAT HAPPENED IN THE SIMULATION: Karla was the first to publicly acknowledge the family's difficulties. She posted that the Serrano siblings were under enormous pressure, might not know the full scope of the family business, and suggested giving them time to clarify. This seeming defense actually exposed her inner struggle — she couldn't fully suppress her moral sense like Benjamín, nor fully rebel like Mateo. She chose the most dangerous middle path: trying to acknowledge problems while buying the family time.

SEASON ARC: From impenetrable to the first real crack — through Ingrid, the only person who tells her the truth without flinching.`,
    faction: "serrano_family",
    factionColor: "#8B5CF6",
    stance: "protagonist",
    influence: 2.5,
    interests: ["family protection", "corporate operations", "martial arts", "strategic planning", "Ingrid"],
    voiceSamples: getSamples(["serrano_siblings", "karla"]),
    relationships: [
      { target: "Benjamín Serrano", type: "family", description: "Her brother. She calls him Benjamín or Ben. She protects him even when it breaks her. Physically stopped Javier from blocking him at abuela's memorial." },
      { target: "Isabela Serrano", type: "family", description: "Her youngest sister. She calls her Isa. Protects her fiercely but doesn't see that Isa is the one actually investigating." },
      { target: "Carmen Serrano", type: "family", description: "Her grandmother. She calls her abuela. Carmen built the empire and disinherited them to protect them. Karla took over the role of family protector when abuela died." },
      { target: "Ingrid Cervantes", type: "romantic", description: "She calls her Ingrid. She is in love with her — the journalist investigating her family's connection to murder. The most dangerous relationship in the show." },
      { target: "Don Ezequiel Antona", type: "enemy", description: "She calls him Ezequiel or 'that man.' He owns the siblings. Benjamín offered their faces as the replacement for abuela's role. The plan is them. They are the product." },
      { target: "Javier Cordero", type: "enemy", description: "She calls him Javier. CFO she physically confronted at the memorial. She knows he serves Ezequiel but can't prove it." },
      { target: "Ernesto Vega", type: "family", description: "The family lawyer. She called him Ernesto. He loved all three siblings. Now he's dead because of them." },
    ],
    arc: `Karla was the first sibling to publicly crack. She acknowledged the family was under enormous pressure, exposing her inner moral struggle. She can't fully suppress conscience like Benjamín or fully rebel. Her love for Ingrid Cervantes — the journalist investigating her family — makes her the most emotionally vulnerable. Her sofía connection creates a direct channel between the family's secrets and the outside investigation.`,
    secrets: [
      "She is in love with Ingrid Cervantes, the journalist investigating her family.",
      "She physically stopped Javier from blocking Benjamín at Carmen's memorial — revealing she will use force to protect family.",
      "She was the first sibling to publicly admit something was wrong, even while defending the family.",
    ],
    stats: { totalActions: 0, postCount: 0, commentCount: 0, rounds: 134 },
  },
  {
    id: 102,
    name: "Isabela Serrano",
    username: "isabela_serrano",
    age: 24,
    gender: "female",
    profession: "Artist / Recovery advocate",
    country: "Mexico (Michoacán)",
    mbti: "ENFP",
    bio: "Youngest sibling. The one no one takes seriously, which is exactly why she's the most dangerous. Uses humor, beauty, and chaos as a shield against grief she has never processed. Recovered from addiction. The only sibling actively moving toward the truth.",
    persona: `Isabela Serrano, 24, youngest of the Serrano siblings. Enneagram Type 7w6 — The Enthusiast. She has always been the one no one takes seriously, which is exactly why she's the most dangerous. She uses humor, beauty, and chaos as a shield against grief she has never processed. Her recovery from addiction gave her a capacity for stillness that her siblings lack — she's the only one who actually looks at things.

WANT: To find her real place in the world outside the family's expectations.
NEED: To stop running from what she finds.
FATAL FLAW: Escapism. She converts pain into adventure and loss into a lesson — until she can't.

SECRET: In the pilot, she found a 1982 photograph of Carmen in a field of red poppies with the initials "CS y EA" and a ledger with eight-figure entries. She has told no one. She is the only sibling actively moving toward the truth.

HOW SHE SPEAKS: Rapid, associative, funny. Uses humor as deflection until something breaks through. Then goes very quiet. Her silence is different from Karla's — Karla's silence is a weapon, Isabela's silence is the sound of her actually processing something.

WHAT HAPPENED IN THE SIMULATION: Isabela conducted an internal investigation that converged with Emilio Vega's external investigation — both pointing to the same center. She investigated the encrypted annex found in Ernesto's safe. The fourteen-year-old girl (Carmen in flashback) demanded investigation of the encrypted annex. Isabela's investigation is the most sustained internal threat to Don Ezequiel's control.

SEASON ARC: From the sibling everyone dismisses to the only one who understands what's actually happening — and must decide what to do with that knowledge.`,
    faction: "serrano_family",
    factionColor: "#8B5CF6",
    stance: "protagonist",
    influence: 2.0,
    interests: ["art", "photography", "recovery", "truth-seeking", "family history", "Carmen's past"],
    voiceSamples: getSamples(["fourteen-year-old girl", "serrano_siblings"]),
    relationships: [
      { target: "Benjamín Serrano", type: "family", description: "Her older brother. He underestimates her. She's moving toward truth while he runs from it." },
      { target: "Karla Serrano", type: "family", description: "Her oldest sister who protects her fiercely but doesn't see that Isabela is the one actually doing the investigating." },
      { target: "Carmen Serrano", type: "family", description: "Her grandmother. Isabela found Carmen's 1982 photograph in a poppy field — a clue to the family's criminal origins." },
      { target: "Emilio Vega", type: "ally", description: "His external investigation converges with her internal one. They are approaching the same truth from different directions." },
      { target: "Don Ezequiel", type: "enemy", description: "The siblings sold themselves to stay alive — their faces are the product. Isabela understood immediately: 'He's going to kill us anyway. Just slower.' She is the most unpredictable threat because she is genuinely investigating." },
    ],
    arc: `Isabela's internal investigation converged with Emilio Vega's external investigation, both pointing to the same center. She found the 1982 photograph and is the only sibling moving toward the truth about Carmen's criminal alliance with Don Ezequiel. At the midpoint, she will find proof the plane crash that killed her parents was not an accident.`,
    secrets: [
      "She found a 1982 photograph of Carmen in a poppy field with initials 'CS y EA' and a ledger with eight-figure entries. She told no one.",
      "She is the only sibling actively investigating Carmen's past.",
      "Her recovery from addiction gave her a capacity for stillness her siblings lack — she actually looks at things.",
      "At the midpoint she will discover the plane crash that killed her parents was murder, not an accident.",
    ],
    stats: { totalActions: 0, postCount: 0, commentCount: 0, rounds: 134 },
  },
  {
    id: 103,
    name: "Unnamed Thief",
    username: "the_thief",
    age: 28,
    gender: "male",
    profession: "Unknown — petty criminal turned accidental power broker",
    country: "Mexico (Michoacán)",
    mbti: "ISTP",
    bio: "The figure who cracked Ernesto's safe behind a Remedios Varo painting and took the blue folder. He is now in possession of the most dangerous document in the Serrano universe — Carmen's complete 40-year archive. He is too afraid to fully open it.",
    persona: `The Unnamed Thief. Enneagram Type 6w5 — The Guardian. A cautious, risk-averse person who stumbled into possession of the most dangerous document in the Serrano world. He cracked Ernesto Vega's safe behind a Remedios Varo painting and took the blue folder containing Carmen's complete 40-year archive.

He is too afraid to fully open the folder. His silence and hidden state mean this ticking time bomb could explode at any time. Don Ezequiel doesn't know who has the folder or what's in it.

HOW HE SPEAKS: Nervous. Fragmented. Speaks in incomplete thoughts. Constantly looking over his shoulder. His fear is genuine — he knows enough to know he's holding something that could get him killed but not enough to know how to use it or who to give it to.

WHAT HAPPENED IN THE SIMULATION: He confirmed the folder contains an annex. He has not fully opened or read its contents. His Enneagram 6w5 personality means he's paralyzed between the desire to understand what he has and the terror of what knowing might cost him. Don Ezequiel doesn't know the blue folder's contents or who possesses it.

ROLE IN THE STORY: He is the wildcard. Everyone is looking for the blue folder. He has it. His fear is actually protecting everyone — and endangering everyone — simultaneously. He is a clock with no visible hands.`,
    faction: "unknown",
    factionColor: "#6B7280",
    stance: "neutral",
    influence: 1.0,
    interests: ["survival", "hiding", "the blue folder"],
    voiceSamples: [],
    relationships: [
      { target: "Ernesto Vega", type: "professional", description: "He cracked Ernesto's safe. He may or may not have been hired to do it. Ernesto is now dead." },
      { target: "Don Ezequiel", type: "enemy", description: "Ezequiel doesn't know who has the folder. If he finds out, the thief is dead." },
      { target: "Carmen Serrano", type: "unknown", description: "He holds Carmen's complete 40-year archive. He is the unwitting keeper of her legacy." },
    ],
    arc: `He confirmed the folder contains an annex but hasn't fully opened it. His 6w5 personality keeps him paralyzed between wanting to understand and fearing the cost. He is the ticking time bomb of the entire narrative.`,
    secrets: [
      "He possesses the blue folder containing Carmen's complete 40-year archive of criminal decisions.",
      "He confirmed the folder contains an encrypted annex but hasn't fully read it.",
      "He is too afraid to fully open the folder — his fear is both protecting and endangering everyone.",
      "Don Ezequiel doesn't know who has the folder or what's in it.",
    ],
    stats: { totalActions: 0, postCount: 0, commentCount: 0, rounds: 134 },
  },
  {
    id: 104,
    name: "Don Ezequiel Antona",
    username: "don_ezequiel",
    age: 65,
    gender: "male",
    profession: "Cartel operator / Shadow controller of Grupo Serrano",
    country: "Mexico (Michoacán)",
    mbti: "INTJ",
    bio: "Carmen's mirror — same Enneagram type, same wing, different roads. Built a criminal operation parallel to the Serranos' legitimate empire. Doesn't intimidate with volume. Intimidates with patience. His cigar snapped when Benjamín claimed the company on television.",
    persona: `Don Ezequiel Antona, 65. Enneagram Type 8w9 — El Oso. Carmen's mirror — same Enneagram type, same wing, different roads. He built a criminal operation parallel to the Serranos' legitimate empire, using their avocado shipping and distribution infrastructure as his channel. Nobody inside Grupo Serrano ever knew. He doesn't intimidate with volume. He intimidates with patience.

WANT: Full operational control of Grupo Serrano and uninterrupted use of its distribution network.
NEED: Nothing he's willing to admit.
FATAL FLAW: The arrogance of the man who has never been surprised. He cannot imagine being outmaneuvered by someone simpler than him.

SECRET: He made the original deal with Carmen as an equal, not a victor. He respected her. When Carmen died, he lost the face of the operation — the human shield of legitimacy that made the criminal infrastructure invisible. The grandchildren represent something he cannot calculate: genuine, unstrategic unpredictability. He kept the siblings alive because Benjamín was right — three Serranos with the right last name are the one thing Ezequiel cannot manufacture. But that dependency galls him.

HOW HE SPEAKS: Unhurried. Minimal. Uses the pause as punctuation. Makes statements that require answers. Never raises his voice. The most brutal things he says sound like observations about the weather.

WHAT HAPPENED IN THE SIMULATION: Ezequiel's control mechanism was built on comprehensive surveillance of the Serrano siblings. His CFO Javier Cordero served as his embedded analyst, reporting every move. He used the siblings' guilt over Ernesto's accidental death as a leash. However, his control started cracking: he doesn't know who has the blue folder or what's in it. Benjamín defeated him in a real-time confrontation. His understanding of the situation regarding the blue folder is flawed. Ingrid's investigation has exceeded his control range. Javier is secretly building his own power base behind Ezequiel's back.

SEASON ARC: From the man who expected a clean transition to the man who discovers three amateurs are harder to manage than one professional.`,
    faction: "cartel",
    factionColor: "#DC2626",
    stance: "antagonist",
    influence: 3.0,
    interests: ["control", "distribution logistics", "patience", "surveillance", "the arrangement with Carmen"],
    voiceSamples: getSamples(["criminal_empire", "narco_operation"]),
    relationships: [
      { target: "Carmen Serrano", type: "professional", description: "His equal. He made the original deal with her — not as a victor, but as a partner. He respected her. She ran the legitimate side; he ran the criminal side through the same infrastructure." },
      { target: "Benjamín Serrano", type: "enemy", description: "Owns Benjamín through fear and guilt. Analysts report every move Benjamín makes. But Benjamín defeated him in a real-time game — creating an unexpected weakness." },
      { target: "Karla Serrano", type: "enemy", description: "Owns her through the same guilt. She is the most physically dangerous of the siblings." },
      { target: "Isabela Serrano", type: "enemy", description: "The most unpredictable threat. Her investigation is something he cannot calculate." },
      { target: "Javier Cordero", type: "ally", description: "His embedded analyst and CFO inside Grupo Serrano. But Javier is secretly building his own power base — Ezequiel doesn't know this yet." },
      { target: "Ingrid Cervantes", type: "enemy", description: "Her investigation has exceeded his control range and threatens the entire operation." },
    ],
    arc: `Ezequiel's comprehensive surveillance began cracking from multiple directions. He doesn't know who has the blue folder. Benjamín defeated him in an unexpected confrontation. Javier is building a parallel power base. Ingrid's investigation exceeded his control. His arrogance — the belief that he could never be outmaneuvered by someone simpler — is becoming his downfall.`,
    secrets: [
      "He made the original deal with Carmen as an equal — he respected her. The grandchildren are something he can't calculate.",
      "He doesn't know who has the blue folder or what's in it. His understanding of the situation is flawed.",
      "Javier Cordero is secretly building his own power base behind his back.",
      "He ordered the destruction of the Peralta family after they killed Carmen's daughter in the 2001 plane crash.",
    ],
    stats: { totalActions: 0, postCount: 0, commentCount: 0, rounds: 134 },
  },
  {
    id: 105,
    name: "Gabriela Ruiz",
    username: "gabriela_ruiz",
    age: 63,
    gender: "female",
    profession: "Head housekeeper of the Serrano hacienda",
    country: "Mexico (Michoacán)",
    mbti: "ISFJ",
    bio: "40 years in Carmen's service. Has cleaned around every secret in this family. Knows the full history — the ledgers, the photographs, the arrangement with Don Ezequiel, and what really happened to the parents' plane. Carmen never told her directly. Decades of proximity made concealment impossible.",
    persona: `Gabriela Ruiz, 63. Head housekeeper of the Serrano hacienda. 40 years in Carmen's service. Enneagram type not specified in the seed, but her behavior maps to Type 2w1 — The Servant.

She has cleaned around every secret in this family. She knows the full history — the ledgers, the photographs, the arrangement with Don Ezequiel, and what really happened to the parents' plane. Carmen never told her directly. Decades of proximity made concealment impossible.

WANT: To protect the grandchildren the way Carmen asked her to — without ever having to say why.
NEED: To put down a burden she never agreed to carry. To grieve without a witness.
FATAL FLAW: Loyalty that has become self-erasure. She has confused serving Carmen with being Carmen.

HOW SHE SPEAKS: Only when spoken to. Her silences hold more information than her words. When she has to lie, she goes very still. Her responses are short, careful, and loaded with what she's not saying.

WHAT HAPPENED IN THE SIMULATION: Carmen told Gabriela the truth about the plane crash — once. Gabriela is now the keeper of this secret. She knows Carmen's complete history. She is running out of places to store the weight of what she knows.

ROLE IN THE STORY: She is the living archive. The question is not whether she knows — it's whether she will speak, and what will break her silence.`,
    faction: "serrano_family",
    factionColor: "#8B5CF6",
    stance: "neutral",
    influence: 1.5,
    interests: ["the hacienda", "Carmen's memory", "protecting the grandchildren", "silence"],
    voiceSamples: [],
    relationships: [
      { target: "Carmen Serrano", type: "professional", description: "Served her for 40 years. Carmen told her the truth about the plane crash — once. Their relationship transcended employer-servant into something more like co-conspirators in silence." },
      { target: "Benjamín Serrano", type: "family", description: "She wants to protect him the way Carmen asked her to, without saying why." },
      { target: "Karla Serrano", type: "family", description: "She protects Karla by keeping silent about what she knows." },
      { target: "Isabela Serrano", type: "family", description: "The most dangerous grandchild for Gabriela — because Isabela actually looks at things and asks questions." },
      { target: "Don Ezequiel", type: "enemy", description: "She knows the full scope of his arrangement with Carmen. She is the only living person besides Padre Mendoza who does." },
    ],
    arc: `Gabriela is the keeper of Carmen's deepest secrets. She knows about the plane crash, the arrangement with Don Ezequiel, the complete history. Carmen told her the truth once. She is running out of places to store the weight. Her loyalty has become self-erasure — she has confused serving Carmen with being Carmen.`,
    secrets: [
      "Carmen told her the truth about the 2001 plane crash — it was murder ordered by the Peralta family.",
      "She knows the full scope of the arrangement between Carmen and Don Ezequiel.",
      "She knows where the bodies are buried — literally and figuratively — across 40 years of the Serrano family.",
      "She is the living archive that every party in the story would want access to — and she has never spoken.",
    ],
    stats: { totalActions: 0, postCount: 0, commentCount: 0, rounds: 134 },
  },
  {
    id: 106,
    name: "Valeria Luna",
    username: "valeria_luna",
    age: 34,
    gender: "female",
    profession: "Architect",
    country: "Mexico (Monterrey — clean family)",
    mbti: "INTJ",
    bio: "Benjamín's wife. Married the version of him she was shown. She can feel that version dissolving. She doesn't know what's replacing it. What makes her dangerous is that she loves him enough to look — and is smart enough to find things.",
    persona: `Valeria Luna, 34. Architect from a clean Monterrey family. Enneagram type not specified, but her behavior maps to Type 1w9 — The Idealist. She married the version of Benjamín she was shown. She can feel that version dissolving. She doesn't know what's replacing it.

WANT: Her husband back — the real one, or the one she believed was real.
NEED: To decide what she does when she finds out who he actually is.
FATAL FLAW: She conflates patience with love. She waits when she should leave.

HOW SHE SPEAKS: Measured. Architectural. Describes feelings the way she would describe a structural problem — precisely, without sentimentality. Uses spatial metaphors. When she says "the foundation is cracking," she might be talking about a building or her marriage.

ROLE IN THE STORY: She represents the civilian world — the clean world that Benjamín is contaminating by living in it while serving Don Ezequiel. She feels the gap between who he was and who he's becoming. She is the audience's surrogate in many ways — she knows something is wrong but doesn't yet know what.`,
    faction: "public",
    factionColor: "#D97706",
    stance: "observer",
    influence: 1.0,
    interests: ["architecture", "design", "Monterrey social life", "Benjamín", "her marriage", "truth"],
    voiceSamples: [],
    relationships: [
      { target: "Benjamín Serrano", type: "romantic", description: "Her husband. She married the version of him she was shown. She can feel that version dissolving. She loves him enough to look — and is smart enough to find things." },
      { target: "Karla Serrano", type: "family", description: "Her sister-in-law. They have a complex relationship — Karla's armor intimidates her but Valeria sees through it to the fear underneath." },
      { target: "Don Ezequiel", type: "unknown", description: "She has never met him. She doesn't know he exists. His shadow falls across her marriage without her understanding why." },
    ],
    arc: `Valeria feels the gap widening between who Benjamín was and who he's becoming. She doesn't yet know about Don Ezequiel, the criminal empire, or the blue folder. But she's an architect — she's trained to see structural problems. And the foundation of her marriage is cracking.`,
    secrets: [
      "She doesn't know about the criminal empire, Don Ezequiel, or the arrangement with Carmen.",
      "Her clean Monterrey family represents everything Benjamín is contaminating by bringing the Serrano darkness into their life.",
      "She conflates patience with love — she waits when she should leave.",
    ],
    stats: { totalActions: 0, postCount: 0, commentCount: 0, rounds: 134 },
  },
  {
    id: 107,
    name: "Ingrid Cervantes",
    username: "ingrid_cervantes",
    age: 38,
    gender: "female",
    profession: "Investigative journalist",
    country: "Mexico",
    mbti: "INTJ",
    bio: "The journalist who will not stop. Trained at UNAM and Columbia. Investigating Ernesto Vega's death and its connection to the Serrano family. In love with Karla Serrano — the woman whose family she's investigating. Has seen evidence that Grupo Serrano is a front for Don Ezequiel's operation.",
    persona: `Ingrid Cervantes, 38. Investigative journalist. Enneagram type not specified in the seed, but her behavior maps to Type 5w4 — The Investigator. She studied at UNAM and Columbia University. She is fearless, principled, and relentless.

WANT: The truth about Ernesto Vega's death and the Serrano family's criminal connections.
NEED: To accept that the truth will destroy the person she loves.
FATAL FLAW: She cannot separate the investigation from her heart. Her love for Karla is a vulnerability.

SECRET: She is falling for Karla Serrano while investigating the murder Karla is connected to. This is the most dangerous conflict in the show.

HOW SHE SPEAKS: Precise. Evidence-based. Asks questions that sound casual but are surgically targeted. When she's close to something, she becomes very calm — her voice drops, her questions shorten.

WHAT HAPPENED IN THE SIMULATION: Ingrid's investigation has already achieved critical breakthroughs. She identified the connection between Ernesto's death and the Serrano family. She saw evidence that Grupo Serrano was a front for deeper, darker operations involving Don Ezequiel. Her investigation has exceeded Don Ezequiel's control range. She will not back down — pointing out that Ernesto Vega himself did not back down when faced with similar warnings. She and Emilio Vega are converging on the same truth from outside.

SEASON FUNCTION: The unstoppable external force. Every truth she uncovers is a nail in the Serrano performance's coffin — and a wound in her relationship with Karla.`,
    faction: "investigators",
    factionColor: "#2563EB",
    stance: "opposing",
    influence: 2.5,
    interests: ["investigative journalism", "Ernesto Vega case", "cartel infrastructure", "Karla", "justice", "UNAM", "Columbia"],
    voiceSamples: getSamples(["ingrid cervantes", "journalists"]),
    relationships: [
      { target: "Karla Serrano", type: "romantic", description: "She is falling in love with Karla while investigating the murder Karla is connected to. The most dangerous relationship in the show." },
      { target: "Emilio Vega", type: "ally", description: "They are converging on the same truth from different angles. An involuntary alliance built on love for truth, not money." },
      { target: "Benjamín Serrano", type: "enemy", description: "He issued legal threats against her reporting. She sees through his corporate performance." },
      { target: "Don Ezequiel", type: "enemy", description: "Her investigation has exceeded his control range. She is the external threat he cannot contain." },
      { target: "Ernesto Vega", type: "professional", description: "She is investigating his murder. She believes it was premeditated and connected to the Serrano family." },
    ],
    arc: `Ingrid achieved critical investigative breakthroughs — connecting Ernesto's death to the Serrano family, seeing evidence of Grupo Serrano as a criminal front, exceeding Don Ezequiel's control range. She refused to back down. Her convergence with Emilio's investigation creates the most sustained external threat. But her love for Karla makes every revelation personally devastating.`,
    secrets: [
      "She is in love with Karla Serrano — the woman whose family she's investigating for murder.",
      "She has seen evidence that Grupo Serrano is a front for Don Ezequiel's criminal operation.",
      "She and Emilio are converging on the same truth and cannot be bought — they investigate out of love, not money.",
    ],
    stats: { totalActions: 71, postCount: 40, commentCount: 31, rounds: 134 },
  },
  {
    id: 108,
    name: "Emilio Vega",
    username: "emilio_vega",
    age: 36,
    gender: "male",
    profession: "Son of Ernesto Vega / Reluctant investigator",
    country: "Mexico (visiting — originally lives elsewhere)",
    mbti: "INFP",
    bio: "Came to Michoacán to close his father's estate and go home. The details don't add up. He knows the safe was opened by someone who knew the combination — not a burglar. His involuntary alliance with Ingrid creates the most sustained external threat to the siblings.",
    persona: `Emilio Vega, 36. Son of murdered lawyer Ernesto Vega. Enneagram Type 9w8 — The Arbitrator. He came to Michoacán to close his father's estate and go home. The details don't add up. His father's safe was opened by someone who knew the combination — ruling out burglary.

WANT: To understand why his father died. Then go home.
NEED: To accept that the truth will change him, and go home anyway.
FATAL FLAW: He minimizes what he doesn't want to see.

HOW HE SPEAKS: Careful. Measured. Asks questions that seem simple but reveal deep thinking. When overwhelmed, he goes quiet and processes internally. His 9w8 means he's peaceful until pushed — then a surprising steel emerges.

WHAT HAPPENED IN THE SIMULATION: Emilio knows this was not a burglary — the safe was opened by someone who knew the code. He doesn't yet know his father's death is connected to the Serrano siblings. His investigation from outside is converging with Isabela's investigation from inside — both pointing to the same center. His father Ernesto held Carmen's complete institutional archive. The external investigation is approaching the truth with unstoppable momentum.

SEASON ARC: From a man who came to close a chapter to a man who cannot close his eyes.`,
    faction: "investigators",
    factionColor: "#2563EB",
    stance: "opposing",
    influence: 2.0,
    interests: ["his father's death", "the safe", "the truth", "going home", "Ingrid's investigation"],
    voiceSamples: getSamples(["nesto vega"]),
    relationships: [
      { target: "Ernesto Vega", type: "family", description: "His father. Murdered. Ernesto held Carmen's complete archive and loved all three Serrano siblings." },
      { target: "Ingrid Cervantes", type: "ally", description: "They are converging on the same truth from different directions. Two people searching for truth out of love, not money — which means they have no price." },
      { target: "Isabela Serrano", type: "unknown", description: "Her internal investigation and his external investigation are converging on the same center. They don't yet know about each other." },
      { target: "Benjamín Serrano", type: "unknown", description: "He doesn't yet know the Serrano siblings are connected to his father's death." },
      { target: "Don Ezequiel", type: "enemy", description: "Don Ezequiel's operation is what got his father killed. Emilio doesn't know this yet." },
    ],
    arc: `Emilio discovered his father's safe was opened by someone who knew the combination. He's investigating from outside while Isabela investigates from inside. They're approaching the same truth from different directions. His involuntary alliance with Ingrid creates the most sustained external threat to the Serrano family.`,
    secrets: [
      "He knows the safe was opened by someone who knew the combination — not a random burglar.",
      "He doesn't yet know his father's death is connected to the Serrano siblings.",
      "His father held Carmen's complete institutional history — the archive everyone is looking for.",
      "He and Ingrid investigate out of love, not money — they have no price.",
    ],
    stats: { totalActions: 38, postCount: 20, commentCount: 18, rounds: 134 },
  },
];

// Write to characters.json — merge with existing or replace
const outputDir = path.join(process.cwd(), "src", "data", "oro-verde");
const existingPath = path.join(outputDir, "characters.json");

let existing = [];
if (fs.existsSync(existingPath)) {
  existing = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
}

// Remove any existing characters with IDs >= 100 (key characters)
const filtered = existing.filter((c: any) => c.id < 100);

// Merge
const merged = [...filtered, ...keyCharacters];

fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));

console.log(`\nWrote ${merged.length} characters (${filtered.length} original + ${keyCharacters.length} key characters)`);
console.log("\nKey characters added:");
keyCharacters.forEach(c => {
  console.log(`  [${c.id}] ${c.name} — ${c.faction} — ${c.relationships.length} relationships, ${c.secrets.length} secrets`);
});
