"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { Character } from "@/lib/types";
import { ChatInterface } from "@/components/ChatInterface";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = params.project as string;
  const charIds = (searchParams.get("chars") || "").split(",").map(Number).filter(Boolean);

  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    fetch(`/api/characters?project=${project}`)
      .then(r => r.json())
      .then(setCharacters);
  }, [project]);

  const roomCharacters = characters.filter(c => charIds.includes(c.id));

  if (roomCharacters.length === 0) {
    return (
      <div className="cyber-bg flex items-center justify-center min-h-screen font-mono text-[var(--cyber-muted)] text-sm">
        LOADING_ROOM...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--cyber-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--cyber-border)] bg-[var(--cyber-panel-dark)] px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push(`/${project}`)}
          className="font-mono text-[10px] text-[var(--cyber-accent)] uppercase tracking-[1px] hover:drop-shadow-[0_0_8px_var(--cyber-accent)] transition-all bg-transparent border-none cursor-pointer"
        >
          [ SYS.RET ] GALLERY
        </button>
        <div className="w-px h-4 bg-[var(--cyber-border)]" />
        <span className="font-mono text-[9px] px-2 py-0.5 border border-[var(--cyber-accent)] text-[var(--cyber-accent)] uppercase tracking-[1px]">
          THE_ROOM
        </span>

        {/* Character avatars */}
        <div className="flex items-center gap-2 flex-wrap">
          {roomCharacters.map(c => (
            <div key={c.id} className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold"
                style={{
                  backgroundColor: c.factionColor,
                  clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)",
                }}
              >
                {c.name.charAt(0)}
              </div>
              <span className="font-mono text-[11px] font-bold text-[var(--cyber-text-bright)] uppercase tracking-wider">
                {c.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>

        <div className="ml-auto font-mono text-[10px] text-[var(--cyber-muted)] flex items-center gap-2">
          <span className="cyber-status-dot active" />
          {roomCharacters.length} AGENTS_ONLINE
        </div>
      </div>

      <ChatInterface
        project={project}
        character={roomCharacters[0]}
        mode="room"
        roomCharacters={roomCharacters}
      />
    </div>
  );
}
