"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Character, Relationship, CharacterStats } from "@/lib/types";
import { TagInput } from "@/components/admin/TagInput";
import { ListEditor } from "@/components/admin/ListEditor";
import { RelationshipEditor } from "@/components/admin/RelationshipEditor";
import { StatsDisplay } from "@/components/admin/StatsDisplay";

const MBTI_TYPES = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const;

const GENDERS = ["male", "female", "non-binary", "other"] as const;
const STANCES = ["protagonist", "antagonist", "supportive", "opposing", "neutral"] as const;
const ENNEAGRAM_TYPES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

interface FormData {
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
  coreMemories: string[];
  simulationMemory: string;
  stats: CharacterStats;
}

const DEFAULT_CHARACTER: FormData = {
  name: "",
  username: "",
  age: 30,
  gender: "male",
  profession: "",
  country: "",
  mbti: "INTJ",
  bio: "",
  persona: "",
  faction: "unknown",
  factionColor: "#8b9bb4",
  stance: "neutral",
  influence: 1,
  interests: [],
  voiceSamples: [],
  relationships: [],
  arc: "",
  secrets: [],
  coreMemories: [],
  simulationMemory: "",
  stats: { totalActions: 0, postCount: 0, commentCount: 0, rounds: 0 },
};

interface CharacterFormProps {
  character?: Character;
  project: string;
  allCharacters?: Character[];
  mode: "create" | "edit";
}

function getEnneagramWingOptions(type?: number): number[] {
  if (!type) return [];
  const prev = type === 1 ? 9 : type - 1;
  const next = type === 9 ? 1 : type + 1;
  return [prev, next];
}

type SectionKey =
  | "identity"
  | "psychology"
  | "narrative"
  | "faction"
  | "interests"
  | "voice"
  | "relationships"
  | "secrets"
  | "coreMemories"
  | "stats"
  | "memory";

export function CharacterForm({
  character,
  project,
  allCharacters,
  mode,
}: CharacterFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const initialData: FormData = character
    ? {
        name: character.name,
        username: character.username,
        age: character.age,
        gender: character.gender,
        profession: character.profession,
        country: character.country,
        mbti: character.mbti,
        enneagramType: character.enneagramType,
        enneagramWing: character.enneagramWing,
        enneagramDescription: character.enneagramDescription,
        bio: character.bio,
        persona: character.persona,
        faction: character.faction,
        factionColor: character.factionColor,
        stance: character.stance,
        influence: character.influence,
        interests: character.interests,
        voiceSamples: character.voiceSamples,
        relationships: character.relationships,
        arc: character.arc,
        secrets: character.secrets,
        coreMemories: character.coreMemories || [],
        simulationMemory: character.simulationMemory,
        stats: character.stats,
      }
    : DEFAULT_CHARACTER;

  const [form, setForm] = useState<FormData>(initialData);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set(["identity", "narrative"])
  );

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const characterNames = (allCharacters ?? [])
    .filter((c) => c.name !== form.name)
    .map((c) => c.name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === "create") {
        await fetch("/api/admin/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project, character: form }),
        });
      } else {
        await fetch(`/api/admin/characters/${character!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project, character: form }),
        });
      }
      router.push(`/admin/${project}`);
    } finally {
      setSaving(false);
    }
  }

  const wingOptions = getEnneagramWingOptions(form.enneagramType);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* SECTION: IDENTITY */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("identity")}
        >
          <span className="flex-1">IDENTITY</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("identity") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("identity") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Name
              </label>
              <input
                type="text"
                className="cyber-input"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Character name"
                required
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Username
              </label>
              <input
                type="text"
                className="cyber-input"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                placeholder="@username"
                required
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Age
              </label>
              <input
                type="number"
                className="cyber-input"
                value={form.age}
                onChange={(e) =>
                  updateField("age", parseInt(e.target.value, 10) || 0)
                }
                min={0}
                max={200}
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Gender
              </label>
              <select
                className="cyber-input"
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Profession
              </label>
              <input
                type="text"
                className="cyber-input"
                value={form.profession}
                onChange={(e) => updateField("profession", e.target.value)}
                placeholder="Profession / Role"
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Country
              </label>
              <input
                type="text"
                className="cyber-input"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION: PSYCHOLOGY */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("psychology")}
        >
          <span className="flex-1">PSYCHOLOGY</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("psychology") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("psychology") && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                  MBTI
                </label>
                <select
                  className="cyber-input"
                  value={form.mbti}
                  onChange={(e) => updateField("mbti", e.target.value)}
                >
                  {MBTI_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                  Enneagram Type
                </label>
                <select
                  className="cyber-input"
                  value={form.enneagramType ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined;
                    updateField("enneagramType", val);
                    updateField("enneagramWing", undefined);
                  }}
                >
                  <option value="">-- none --</option>
                  {ENNEAGRAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      Type {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                  Enneagram Wing
                </label>
                <select
                  className="cyber-input"
                  value={form.enneagramWing ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined;
                    updateField("enneagramWing", val);
                  }}
                  disabled={!form.enneagramType}
                >
                  <option value="">-- none --</option>
                  {wingOptions.map((w) => (
                    <option key={w} value={w}>
                      w{w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Enneagram Description
              </label>
              <textarea
                className="cyber-textarea"
                value={form.enneagramDescription ?? ""}
                onChange={(e) =>
                  updateField("enneagramDescription", e.target.value)
                }
                placeholder="Core fear, desire, and defense mechanism..."
                rows={3}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION: NARRATIVE */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("narrative")}
        >
          <span className="flex-1">NARRATIVE</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("narrative") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("narrative") && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Bio
              </label>
              <textarea
                className="cyber-textarea"
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Character bio..."
                rows={3}
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Persona
              </label>
              <textarea
                className="cyber-textarea"
                value={form.persona}
                onChange={(e) => updateField("persona", e.target.value)}
                placeholder="Detailed persona / system prompt..."
                rows={10}
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Arc
              </label>
              <textarea
                className="cyber-textarea"
                value={form.arc}
                onChange={(e) => updateField("arc", e.target.value)}
                placeholder="Character arc description..."
                rows={5}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION: FACTION & INFLUENCE */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("faction")}
        >
          <span className="flex-1">FACTION & INFLUENCE</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("faction") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("faction") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Faction
              </label>
              <input
                type="text"
                className="cyber-input"
                value={form.faction}
                onChange={(e) => updateField("faction", e.target.value)}
                placeholder="Faction name"
              />
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Faction Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  className="w-10 h-10 border border-[var(--cyber-border)] bg-transparent cursor-pointer"
                  value={form.factionColor}
                  onChange={(e) => updateField("factionColor", e.target.value)}
                />
                <input
                  type="text"
                  className="cyber-input flex-1"
                  value={form.factionColor}
                  onChange={(e) => updateField("factionColor", e.target.value)}
                  placeholder="#hex"
                />
              </div>
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Stance
              </label>
              <select
                className="cyber-input"
                value={form.stance}
                onChange={(e) => updateField("stance", e.target.value)}
              >
                {STANCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                Influence (0-10)
              </label>
              <input
                type="number"
                className="cyber-input"
                value={form.influence}
                onChange={(e) =>
                  updateField(
                    "influence",
                    Math.min(10, Math.max(0, parseInt(e.target.value, 10) || 0))
                  )
                }
                min={0}
                max={10}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION: INTERESTS */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("interests")}
        >
          <span className="flex-1">INTERESTS</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("interests") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("interests") && (
          <TagInput
            tags={form.interests}
            onChange={(tags) => updateField("interests", tags)}
            placeholder="Add interest..."
          />
        )}
      </div>

      {/* SECTION: VOICE SAMPLES */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("voice")}
        >
          <span className="flex-1">VOICE SAMPLES</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("voice") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("voice") && (
          <ListEditor
            items={form.voiceSamples}
            onChange={(items) => updateField("voiceSamples", items)}
            label="Voice Sample"
            multiline
            placeholder="Write a sample of how this character speaks..."
          />
        )}
      </div>

      {/* SECTION: RELATIONSHIPS */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("relationships")}
        >
          <span className="flex-1">RELATIONSHIPS</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("relationships") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("relationships") && (
          <RelationshipEditor
            relationships={form.relationships}
            onChange={(rels) => updateField("relationships", rels)}
            characterNames={characterNames}
          />
        )}
      </div>

      {/* SECTION: SECRETS */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("secrets")}
        >
          <span className="flex-1">SECRETS</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("secrets") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("secrets") && (
          <ListEditor
            items={form.secrets}
            onChange={(items) => updateField("secrets", items)}
            label="Secret"
            multiline
            placeholder="A secret this character holds..."
          />
        )}
      </div>

      {/* SECTION: CORE MEMORIES */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("coreMemories")}
        >
          <span className="flex-1">CORE MEMORIES</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("coreMemories") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("coreMemories") && (
          <div>
            <p className="font-mono text-[10px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-3">
              Critical facts injected at highest priority in every conversation. Characters will ALWAYS know these.
            </p>
            <ListEditor
              items={form.coreMemories}
              onChange={(items) => updateField("coreMemories", items)}
              label="Core Memory"
              multiline
              placeholder="Critical fact this character must always know..."
            />
          </div>
        )}
      </div>

      {/* SECTION: STATS */}
      <div className="cyber-form-section">
        <div
          className="cyber-form-section-header"
          onClick={() => toggleSection("stats")}
        >
          <span className="flex-1">STATS</span>
          <span className="text-[var(--cyber-muted)]">
            {openSections.has("stats") ? "[-]" : "[+]"}
          </span>
        </div>
        {openSections.has("stats") && (
          <div>
            {mode === "edit" && (
              <p className="font-mono text-[10px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-3">
                Read-only -- stats are computed from simulation data
              </p>
            )}
            <StatsDisplay stats={form.stats} />
          </div>
        )}
      </div>

      {/* SECTION: SIMULATION MEMORY */}
      {form.simulationMemory && (
        <div className="cyber-form-section">
          <div
            className="cyber-form-section-header"
            onClick={() => toggleSection("memory")}
          >
            <span className="flex-1">SIMULATION MEMORY</span>
            <span className="text-[var(--cyber-muted)]">
              {openSections.has("memory") ? "[-]" : "[+]"}
            </span>
          </div>
          {openSections.has("memory") && (
            <div>
              <p className="font-mono text-[10px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-3">
                Read-only -- generated by simulation engine
              </p>
              <div className="cyber-terminal whitespace-pre-wrap">
                {form.simulationMemory}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-4 mt-8 mb-12">
        <button
          type="submit"
          disabled={saving}
          className="cyber-action-btn"
        >
          {saving
            ? "SAVING..."
            : mode === "create"
            ? "CREATE CHARACTER"
            : "SAVE CHANGES"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/${project}`)}
          className="cyber-btn-sm accent"
          style={{ padding: "8px 20px", fontSize: "13px" }}
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
