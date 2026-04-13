"use client";

import type { Character } from "@/lib/types";
import { hexId, roleAbbrev, stanceDotClass } from "@/lib/cyber-utils";

interface CharacterCardProps {
  character: Character;
  selected?: boolean;
  onClick?: () => void;
  onChat?: () => void;
}

export function CharacterCard({ character, selected, onClick, onChat }: CharacterCardProps) {
  return (
    <div
      className={`cyber-card ${selected ? "cyber-card-selected" : ""}`}
      onClick={onClick}
    >
      {/* Header Bar — ID & Faction */}
      <div className="flex justify-between items-center px-4 py-2.5 bg-black/40 border-b border-[rgba(0,255,255,0.05)]">
        <span className="font-mono text-[10px] text-[var(--cyber-text-bright)] tracking-[1px] border-l-2 border-[var(--cyber-accent)] pl-1.5">
          {hexId(character.id)}
        </span>
        <span className="font-mono text-[10px] text-[var(--cyber-muted)] uppercase tracking-[1px]">
          {character.faction.replace(/_/g, "_").toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Profile Section — Avatar + Details */}
        <div className="flex gap-4 items-start">
          {/* Avatar */}
          <div className="cyber-avatar">
            <div
              className="cyber-avatar-inner"
              style={{ backgroundColor: character.factionColor }}
            >
              <span className="text-3xl font-black text-white/90 select-none">
                {character.name.charAt(0)}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col gap-2.5 pt-1">
            <h3 className="text-xl font-extrabold uppercase tracking-wider text-[var(--cyber-text-bright)] leading-tight m-0">
              {character.name}
            </h3>
            <div className="cyber-meta-grid font-mono">
              <span className="flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                AGE: {character.age}
              </span>
              <span className="flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                CLS: {character.mbti}
              </span>
              <span className="flex items-center gap-1 col-span-2 text-[var(--cyber-accent)]">
                ROLE: {roleAbbrev(character.profession)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-[var(--cyber-muted)] leading-relaxed m-0 line-clamp-3">
          {character.bio}
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-[var(--cyber-panel-dark)] border-t border-[var(--cyber-border)] flex justify-between items-center mt-auto">
        <div className="font-mono text-[10px] text-[var(--cyber-muted)] flex items-center gap-2 tracking-[0.5px]">
          <span className={`cyber-status-dot ${stanceDotClass(character.stance)}`} />
          ACT: {character.stats.totalActions} // {character.stance.toUpperCase()}
        </div>
        {onChat && (
          <button
            onClick={(e) => { e.stopPropagation(); onChat(); }}
            className="cyber-connect-btn"
          >
            CONNECT
          </button>
        )}
      </div>
    </div>
  );
}
