"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Character } from "@/lib/types";
import { CharacterCard } from "@/components/CharacterCard";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const project = params.project as string;
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch(`/api/characters?project=${project}`)
      .then(r => r.json())
      .then(setCharacters);
  }, [project]);

  const factions = [...new Set(characters.map(c => c.faction))];
  const filtered = filter === "all" ? characters : characters.filter(c => c.faction === filter);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedChars = characters.filter(c => selected.has(c.id));

  const handleGroupAction = () => {
    if (selected.size === 2) {
      const ids = [...selected];
      router.push(`/${project}/confrontation?a=${ids[0]}&b=${ids[1]}`);
    } else if (selected.size >= 2 && selected.size <= 6) {
      router.push(`/${project}/room?chars=${[...selected].join(",")}`);
    }
  };

  return (
    <main className="cyber-bg min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 md:px-20 py-10">
        {/* SYS Header */}
        <div className="flex justify-between items-center font-mono text-[11px] text-[var(--cyber-accent-dim)] uppercase tracking-[2px] mb-8 border-b border-[var(--cyber-border)] pb-3">
          <span>SYS.NODE // SECTOR_7G // UPLINK_ESTABLISHED</span>
          <span className="font-bold text-[var(--cyber-text-bright)] tracking-[4px]">
            ENCRYPTED_CHANNEL
          </span>
        </div>

        {/* Header Section */}
        <header className="mb-10">
          {/* Back Button */}
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 font-mono text-[12px] text-[var(--cyber-accent)] uppercase tracking-[1px] mb-6 cursor-pointer opacity-80 hover:opacity-100 hover:drop-shadow-[0_0_8px_var(--cyber-accent)] transition-all bg-transparent border-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            [ SYS.RET ] ALL PROJECTS
          </button>

          {/* Title Row */}
          <div className="flex justify-between items-end flex-wrap gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-[6px] leading-none text-[var(--cyber-text-bright)] cyber-glow-text m-0 mb-3">
                {project.replace(/-/g, " ").toUpperCase()}
              </h1>
              <div className="font-mono text-[13px] text-[var(--cyber-accent-dim)] flex items-center gap-3 tracking-[1px]">
                <span className="inline-block w-1.5 h-1.5 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)]" />
                STATUS: {characters.length} ENTITIES ONLINE // DIRECTORY_SYNCED
              </div>
            </div>

            {/* INIT_GROUP_LINK — shows when 2+ selected */}
            {selected.size >= 2 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGroupAction}
                  className="cyber-action-btn"
                >
                  {/* Avatar cluster */}
                  <div className="flex items-center">
                    {selectedChars.slice(0, 4).map((c, i) => (
                      <div
                        key={c.id}
                        className="cyber-avatar-mini"
                        style={{
                          backgroundColor: c.factionColor,
                          marginLeft: i > 0 ? "-8px" : "0",
                          zIndex: 4 - i,
                        }}
                      >
                        {c.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  {selected.size === 2 ? "INIT_CONFRONTATION" : "INIT_GROUP_LINK"} ({selected.size})
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 17 10 11 4 5" />
                    <line x1="12" y1="19" x2="20" y2="19" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="font-mono text-[10px] text-[var(--cyber-muted)] hover:text-[var(--cyber-danger)] uppercase tracking-[1px] bg-transparent border-none cursor-pointer transition-colors"
                >
                  [CLEAR]
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Filter Bar */}
        <div className="flex gap-3 mb-8 flex-wrap border-b border-[var(--cyber-border)] pb-4 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`font-mono text-[12px] uppercase tracking-[1px] cursor-pointer px-4 py-1.5 bg-transparent border-none transition-colors relative ${
              filter === "all"
                ? "cyber-filter-active"
                : "text-[var(--cyber-muted)] hover:text-[var(--cyber-text-bright)]"
            }`}
          >
            ALL ({characters.length})
          </button>
          {factions.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-mono text-[12px] uppercase tracking-[1px] cursor-pointer px-4 py-1.5 bg-transparent border-none transition-colors relative ${
                filter === f
                  ? "cyber-filter-active"
                  : "text-[var(--cyber-muted)] hover:text-[var(--cyber-text-bright)]"
              }`}
            >
              {f.toUpperCase()} ({characters.filter(c => c.faction === f).length})
            </button>
          ))}
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-6">
          {filtered.map(character => (
            <CharacterCard
              key={character.id}
              character={character}
              selected={selected.has(character.id)}
              onClick={() => toggleSelect(character.id)}
              onChat={() => router.push(`/${project}/chat/${character.id}`)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
