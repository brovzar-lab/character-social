/**
 * Process a MiroFish simulation export into characters.json
 * Usage: npx tsx scripts/process-export.ts <export-folder-name>
 * Example: npx tsx scripts/process-export.ts oro-verde
 */

import * as fs from "fs";
import * as path from "path";

interface RawRedditProfile {
  user_id: number;
  username: string;
  name: string;
  bio: string;
  persona: string;
  karma: number;
  created_at: string;
  age: number;
  gender: string;
  mbti: string;
  country: string;
  profession: string;
  interested_topics: string[];
}

interface RawAgentConfig {
  agent_id: number;
  entity_uuid: string;
  entity_name: string;
  entity_type: string;
  activity_level: number;
  posts_per_hour: number;
  comments_per_hour: number;
  active_hours: number[];
  response_delay_min: number;
  response_delay_max: number;
  sentiment_bias: number;
  stance: string;
  influence_weight: number;
}

interface RawAction {
  round: number;
  timestamp: string;
  agent_id: number;
  agent_name: string;
  action_type: string;
  action_args?: { content?: string };
  success?: boolean;
}

const FACTION_KEYWORDS: Record<string, string[]> = {
  serrano_family: ["serrano", "家族", "siblings", "hermano", "hermana", "matriarch", "estate", "庄园", "继承"],
  cartel: ["cartel", "narco", "criminal", "don ezequiel", "ezequiel", "操控", "犯罪", "毒品"],
  investigators: ["journalist", "periodista", "investigat", "记者", "调查", "律师", "lawyer", "attorney"],
  business: ["ceo", "cfo", "executive", "企业", "集团", "grupo", "investor", "financial"],
  public: ["citizen", "activist", "community", "公众", "社区", "工人", "worker"],
};

const FACTION_COLORS: Record<string, string> = {
  serrano_family: "#8B5CF6",
  cartel: "#DC2626",
  investigators: "#2563EB",
  business: "#059669",
  public: "#D97706",
  unknown: "#6B7280",
};

function deriveFaction(profile: RawRedditProfile, config?: RawAgentConfig): string {
  const text = `${profile.persona} ${profile.bio} ${profile.profession} ${profile.name}`.toLowerCase();
  const entityType = config?.entity_name?.toLowerCase() || "";

  for (const [faction, keywords] of Object.entries(FACTION_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase()) || entityType.includes(kw.toLowerCase())) {
        return faction;
      }
    }
  }
  return "public";
}

function extractVoiceSamples(actions: RawAction[], agentId: number, maxSamples = 8): string[] {
  const posts = actions
    .filter(a => a.agent_id === agentId && a.action_args?.content && a.action_type === "CREATE_POST")
    .map(a => a.action_args!.content!)
    .filter(c => c.length > 50 && c.length < 1500);

  // Pick evenly spaced samples to show voice across the simulation
  if (posts.length <= maxSamples) return posts;
  const step = Math.floor(posts.length / maxSamples);
  return posts.filter((_, i) => i % step === 0).slice(0, maxSamples);
}

function extractRelationships(profile: RawRedditProfile, allProfiles: RawRedditProfile[]): Array<{target: string; type: string; description: string}> {
  const relationships: Array<{target: string; type: string; description: string}> = [];
  const persona = profile.persona.toLowerCase();

  for (const other of allProfiles) {
    if (other.user_id === profile.user_id) continue;
    const otherName = other.name.toLowerCase();
    if (persona.includes(otherName)) {
      let type = "unknown";
      // Simple heuristic for relationship type
      const context = persona.substring(
        Math.max(0, persona.indexOf(otherName) - 100),
        Math.min(persona.length, persona.indexOf(otherName) + 100)
      );
      if (context.match(/family|兄|妹|弟|姐|父|母|wife|husband|婚|亲/i)) type = "family";
      else if (context.match(/enemy|rival|threat|威胁|对手|敌/i)) type = "enemy";
      else if (context.match(/friend|ally|trust|朋友|盟友|信任/i)) type = "ally";
      else if (context.match(/love|romantic|girlfriend|boyfriend|恋|爱/i)) type = "romantic";
      else if (context.match(/boss|colleague|work|employ|同事|工作|上司/i)) type = "professional";

      relationships.push({
        target: other.name,
        type,
        description: context.trim(),
      });
    }
  }

  return relationships;
}

function extractArcFromReport(report: string, characterName: string): string {
  const lines = report.split("\n");
  const relevantLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(characterName.toLowerCase())) {
      // Grab the surrounding paragraph
      let start = i;
      let end = i;
      while (start > 0 && lines[start - 1].trim() !== "") start--;
      while (end < lines.length - 1 && lines[end + 1].trim() !== "") end++;
      const paragraph = lines.slice(start, end + 1).join("\n").trim();
      if (paragraph.length > 30 && !relevantLines.includes(paragraph)) {
        relevantLines.push(paragraph);
      }
    }
  }

  return relevantLines.slice(0, 3).join("\n\n") || "No specific arc data available from the simulation report.";
}

function main() {
  const projectSlug = process.argv[2] || "oro-verde";
  const exportDir = path.join(process.cwd(), "data", "exports", projectSlug);

  if (!fs.existsSync(exportDir)) {
    console.error(`Export directory not found: ${exportDir}`);
    process.exit(1);
  }

  console.log(`Processing export: ${projectSlug}`);
  console.log(`Export dir: ${exportDir}`);

  // 1. Load reddit profiles
  const profilesPath = path.join(exportDir, "simulation_data", "reddit_profiles.json");
  const profiles: RawRedditProfile[] = JSON.parse(fs.readFileSync(profilesPath, "utf-8"));
  console.log(`Loaded ${profiles.length} character profiles`);

  // 2. Load simulation config
  const configPath = path.join(exportDir, "simulation_data", "simulation_config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const agentConfigs: RawAgentConfig[] = config.agent_configs || [];

  // 3. Load actions
  const twitterActionsPath = path.join(exportDir, "twitter_actions.jsonl");
  const redditActionsPath = path.join(exportDir, "reddit_actions.jsonl");

  const loadActions = (filePath: string): RawAction[] => {
    if (!fs.existsSync(filePath)) return [];
    return fs.readFileSync(filePath, "utf-8")
      .split("\n")
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter((a): a is RawAction => a !== null && a.agent_id !== undefined);
  };

  const allActions = [...loadActions(twitterActionsPath), ...loadActions(redditActionsPath)];
  console.log(`Loaded ${allActions.length} total actions`);

  // 4. Load report
  const reportPath = path.join(exportDir, "report", "full_report.md");
  const report = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, "utf-8") : "";

  // 5. Process each character
  const characters = profiles.map((profile) => {
    const agentConfig = agentConfigs.find(c => c.agent_id === profile.user_id);
    const faction = deriveFaction(profile, agentConfig);
    const voiceSamples = extractVoiceSamples(allActions, profile.user_id);
    const relationships = extractRelationships(profile, profiles);
    const arc = extractArcFromReport(report, profile.name);

    const agentActions = allActions.filter(a => a.agent_id === profile.user_id);
    const postCount = agentActions.filter(a => a.action_type === "CREATE_POST").length;
    const commentCount = agentActions.filter(a => a.action_type === "CREATE_COMMENT").length;
    const maxRound = agentActions.reduce((max, a) => Math.max(max, a.round || 0), 0);

    return {
      id: profile.user_id,
      name: agentConfig?.entity_name || profile.name,
      username: profile.username,
      age: profile.age,
      gender: profile.gender,
      profession: profile.profession,
      country: profile.country,
      mbti: profile.mbti,
      bio: profile.bio,
      persona: profile.persona,
      faction,
      factionColor: FACTION_COLORS[faction] || FACTION_COLORS.unknown,
      stance: agentConfig?.stance || "neutral",
      influence: agentConfig?.influence_weight || 1.0,
      interests: profile.interested_topics || [],
      voiceSamples,
      relationships,
      arc,
      secrets: [], // Can be manually curated later
      stats: {
        totalActions: agentActions.length,
        postCount,
        commentCount,
        rounds: maxRound,
      },
    };
  });

  // 6. Build project meta
  const meta = {
    slug: projectSlug,
    name: config.simulation_requirement
      ? config.simulation_requirement.substring(0, 100)
      : projectSlug,
    description: `${characters.length} characters, ${allActions.length} actions across ${Math.max(...allActions.map(a => a.round || 0))} rounds`,
    characterCount: characters.length,
    totalActions: allActions.length,
    exportDate: new Date().toISOString(),
    simulationRequirement: config.simulation_requirement || "",
  };

  // 7. Write output
  const outputDir = path.join(process.cwd(), "src", "data", projectSlug);
  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "characters.json"),
    JSON.stringify(characters, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, "meta.json"),
    JSON.stringify(meta, null, 2)
  );

  console.log(`\nOutput written to ${outputDir}`);
  console.log(`  characters.json: ${characters.length} characters`);
  console.log(`  meta.json: project metadata`);
  console.log(`\nCharacter summary:`);
  characters.forEach(c => {
    console.log(`  [${c.id}] ${c.name} — ${c.faction} (${c.stance}) — ${c.stats.totalActions} actions, ${c.voiceSamples.length} voice samples`);
  });
}

main();
