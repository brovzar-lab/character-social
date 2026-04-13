"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Character } from "@/lib/types";
import { ChatInterface } from "@/components/ChatInterface";
import { MemoryPanel } from "@/components/MemoryPanel";
import { hexId, roleAbbrev, stanceDotClass } from "@/lib/cyber-utils";

export default function SoloChatPage() {
  const params = useParams();
  const router = useRouter();
  const project = params.project as string;
  const characterId = parseInt(params.characterId as string, 10);
  const [character, setCharacter] = useState<Character | null>(null);
  const [showProfile, setShowProfile] = useState(true);
  const [showMemory, setShowMemory] = useState(false);

  useEffect(() => {
    fetch(`/api/characters?project=${project}`)
      .then(r => r.json())
      .then((chars: Character[]) => {
        setCharacter(chars.find(c => c.id === characterId) || null);
      });
  }, [project, characterId]);

  if (!character) {
    return (
      <div className="cyber-bg flex items-center justify-center min-h-screen font-mono text-[var(--cyber-muted)] text-sm">
        LOADING_AGENT_PROFILE...
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[var(--cyber-bg)]">
      {/* Profile Sidebar */}
      {showProfile && (
        <div className="w-72 border-r border-[var(--cyber-border)] bg-[var(--cyber-panel)] overflow-y-auto shrink-0 flex flex-col">
          {/* Sidebar Header */}
          <div className="px-4 py-3 border-b border-[var(--cyber-border)] bg-black/40">
            <button
              onClick={() => router.push(`/${project}`)}
              className="font-mono text-[10px] text-[var(--cyber-accent)] uppercase tracking-[1px] hover:drop-shadow-[0_0_8px_var(--cyber-accent)] transition-all bg-transparent border-none cursor-pointer"
            >
              [ SYS.RET ] GALLERY
            </button>
          </div>

          {/* Agent Identity */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="cyber-avatar" style={{ width: 56, height: 56 }}>
                <div
                  className="cyber-avatar-inner"
                  style={{ backgroundColor: character.factionColor }}
                >
                  <span className="text-xl font-black text-white/90">
                    {character.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="font-extrabold text-lg uppercase tracking-wider text-[var(--cyber-text-bright)] leading-tight">
                  {character.name}
                </h2>
                <p className="font-mono text-[10px] text-[var(--cyber-muted)] tracking-[1px] mt-0.5">
                  {hexId(character.id)} // {roleAbbrev(character.profession)}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="font-mono text-[9px] uppercase tracking-[1px] px-2 py-0.5 border border-[var(--cyber-accent-dim)] text-[var(--cyber-accent)]">
                {character.faction.replace(/_/g, " ")}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[1px] px-2 py-0.5 border border-[var(--cyber-border)] text-[var(--cyber-muted)]">
                {character.mbti}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[1px] px-2 py-0.5 border border-[var(--cyber-border)] text-[var(--cyber-muted)]">
                {character.stance}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[1px] px-2 py-0.5 border border-[var(--cyber-border)] text-[var(--cyber-muted)]">
                AGE:{character.age}
              </span>
              {character.enneagramType && character.enneagramWing && (
                <span className="font-mono text-[9px] uppercase tracking-[1px] px-2 py-0.5 border border-[var(--cyber-border)] text-[var(--cyber-muted)]">
                  E{character.enneagramType}w{character.enneagramWing}
                </span>
              )}
            </div>

            {/* Separator */}
            <div className="border-b border-[var(--cyber-border)] mb-4" />

            {/* Bio */}
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-mono text-[9px] uppercase tracking-[1px] text-[var(--cyber-accent-dim)] mb-1.5">BIO</h3>
                <p className="text-[12px] text-[var(--cyber-text)] leading-relaxed">{character.bio}</p>
              </div>

              {character.enneagramType && (() => {
                const typeNames: Record<number, string> = {
                  1: "Reformer", 2: "Helper", 3: "Performer", 4: "Individualist",
                  5: "Investigator", 6: "Loyalist", 7: "Enthusiast", 8: "Challenger", 9: "Peacemaker",
                };
                const guardedness = character.guardedness ?? 5;
                const filled = guardedness;
                const empty = 10 - filled;
                return (
                  <div>
                    <h3 className="font-mono text-[9px] uppercase tracking-[1px] text-[var(--cyber-accent-dim)] mb-1.5">PSYCHOLOGY</h3>
                    <p className="font-mono text-[11px] text-[var(--cyber-text-bright)]">
                      Type {character.enneagramType} — The {typeNames[character.enneagramType] ?? "Unknown"}
                    </p>
                    {character.enneagramWing && (
                      <p className="font-mono text-[11px] text-[var(--cyber-muted)]">
                        Wing {character.enneagramWing}
                      </p>
                    )}
                    <div className="font-mono text-[11px] text-[var(--cyber-muted)] mt-1">
                      <span>Guardedness: </span>
                      <span className="text-[var(--cyber-accent)]">{"█".repeat(filled)}</span>
                      <span className="text-[var(--cyber-border)]">{"░".repeat(empty)}</span>
                      <span className="ml-1">{guardedness}/10</span>
                    </div>
                    {character.enneagramDescription && (
                      <p className="text-[11px] text-[var(--cyber-text)] leading-relaxed mt-1.5">
                        {character.enneagramDescription}
                      </p>
                    )}
                  </div>
                );
              })()}

              {character.relationships.length > 0 && (
                <div>
                  <h3 className="font-mono text-[9px] uppercase tracking-[1px] text-[var(--cyber-accent-dim)] mb-1.5">RELATIONSHIPS</h3>
                  <div className="space-y-1">
                    {character.relationships.slice(0, 8).map((r, i) => (
                      <p key={i} className="text-[11px] font-mono">
                        <span className="text-[var(--cyber-text-bright)]">{r.target}</span>
                        <span className="text-[var(--cyber-muted)]"> // {r.type}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-mono text-[9px] uppercase tracking-[1px] text-[var(--cyber-accent-dim)] mb-1.5">STATS</h3>
                <div className="font-mono text-[11px] text-[var(--cyber-muted)] flex items-center gap-2">
                  <span className={`cyber-status-dot ${stanceDotClass(character.stance)}`} />
                  ACT:{character.stats.totalActions} // POST:{character.stats.postCount} // INF:{character.influence}
                </div>
              </div>

              {character.interests.length > 0 && (
                <div>
                  <h3 className="font-mono text-[9px] uppercase tracking-[1px] text-[var(--cyber-accent-dim)] mb-1.5">INTERESTS</h3>
                  <div className="flex flex-wrap gap-1">
                    {character.interests.slice(0, 6).map((interest, i) => (
                      <span key={i} className="font-mono text-[9px] px-1.5 py-0.5 bg-black/30 text-[var(--cyber-muted)] border border-[var(--cyber-border)]">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Center: Chat tablet + right side memory */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat centering area */}
        <div className="flex-1 flex flex-col items-center justify-center py-4 px-4">
          {/* Tablet-sized chat window */}
          <div
            className="flex flex-col w-full rounded-lg overflow-hidden"
            style={{
              maxWidth: 640,
              height: "calc(100vh - 32px)",
              maxHeight: 860,
              border: "1px solid var(--cyber-border)",
              boxShadow: "0 0 40px rgba(0, 255, 255, 0.04), 0 8px 32px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Chat Header */}
            <div className="border-b border-[var(--cyber-border)] bg-[var(--cyber-panel-dark)] px-4 py-2.5 flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="font-mono text-[10px] text-[var(--cyber-muted)] hover:text-[var(--cyber-accent)] uppercase tracking-[1px] bg-transparent border-none cursor-pointer transition-colors"
              >
                [{showProfile ? "HIDE" : "SHOW"}_PROFILE]
              </button>
              <div className="w-px h-4 bg-[var(--cyber-border)]" />
              <div
                className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold"
                style={{
                  backgroundColor: character.factionColor,
                  clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)",
                }}
              >
                {character.name.charAt(0)}
              </div>
              <span className="font-mono text-sm font-bold text-[var(--cyber-text-bright)] uppercase tracking-wider">
                {character.name}
              </span>
              <span className="font-mono text-[9px] px-2 py-0.5 border border-[var(--cyber-accent-dim)] text-[var(--cyber-accent)] uppercase tracking-[1px]">
                SOLO_INTERVIEW
              </span>

              <button
                onClick={() => setShowMemory(!showMemory)}
                className={`ml-auto font-mono text-[10px] uppercase tracking-[1px] px-3 py-1.5 border cursor-pointer transition-all ${
                  showMemory
                    ? "bg-[var(--cyber-accent)] text-black border-[var(--cyber-accent)]"
                    : "bg-transparent text-[var(--cyber-muted)] border-[var(--cyber-border)] hover:border-[var(--cyber-accent-dim)] hover:text-[var(--cyber-text-bright)]"
                }`}
              >
                {showMemory ? "HIDE_MEMORY" : "MEMORY"}
              </button>
            </div>

            {/* Chat content */}
            <div className="flex-1 overflow-hidden" style={{ backgroundColor: "var(--cyber-bg)" }}>
              <ChatInterface
                project={project}
                character={character}
                mode="solo"
              />
            </div>
          </div>
        </div>

        {/* Memory Panel — right sidebar, outside the tablet */}
        <MemoryPanel
          characterName={character.name}
          open={showMemory}
          onClose={() => setShowMemory(false)}
        />
      </div>
    </div>
  );
}
