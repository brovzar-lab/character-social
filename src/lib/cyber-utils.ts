/** Format character ID as hex badge: 100 → "ID:0x064" */
export function hexId(id: number): string {
  return `ID:0x${id.toString(16).toUpperCase().padStart(3, "0")}`;
}

/** Abbreviate profession for meta grid ROLE field */
const ROLE_MAP: Record<string, string> = {
  "CEO of Grupo Serrano": "CEO",
  "Operations Director, Grupo Serrano": "DIR",
  "Artist / Recovery advocate": "ART",
  "Unknown — petty criminal turned accidental power broker": "THIEF",
  "Cartel operator / Shadow controller of Grupo Serrano": "OPR",
  "Head housekeeper of the Serrano hacienda": "HSK",
  "Architect": "ARCH",
  "Investigative journalist": "JOURNO",
  "Son of Ernesto Vega / Reluctant investigator": "INV",
  "CFO of Grupo Serrano": "CFO",
  "Environmental activist": "ACT",
  "Grupo Serrano Official Social Media": "MEDIA",
  "Press corps — composite journalist entity": "PRESS",
};

export function roleAbbrev(profession: string): string {
  if (ROLE_MAP[profession]) return ROLE_MAP[profession];
  // Fuzzy match on keywords
  const lower = profession.toLowerCase();
  if (lower.includes("ceo")) return "CEO";
  if (lower.includes("director")) return "DIR";
  if (lower.includes("journalist")) return "JOURNO";
  if (lower.includes("architect")) return "ARCH";
  if (lower.includes("housekeeper")) return "HSK";
  if (lower.includes("thief") || lower.includes("criminal")) return "THIEF";
  if (lower.includes("cartel") || lower.includes("operator")) return "OPR";
  if (lower.includes("artist")) return "ART";
  if (lower.includes("activist")) return "ACT";
  if (lower.includes("investigat")) return "INV";
  if (lower.includes("social") || lower.includes("media")) return "MEDIA";
  if (lower.includes("press") || lower.includes("corps")) return "PRESS";
  return profession.slice(0, 4).toUpperCase();
}

/** Map stance to status dot CSS class */
export function stanceDotClass(stance: string): string {
  if (["protagonist", "supportive"].includes(stance)) return "active";
  if (["antagonist", "opposing"].includes(stance)) return "danger";
  return "";
}
