"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Character } from "@/lib/types";
import { CharacterForm } from "@/components/admin/CharacterForm";

export default function NewCharacterPage() {
  const params = useParams();
  const project = params.project as string;
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/characters?project=${project}`)
      .then((r) => r.json())
      .then((data) => {
        setAllCharacters(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [project]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 md:px-20 py-10">
        <div className="font-mono text-[13px] text-[var(--cyber-accent-dim)] flex items-center gap-3 tracking-[1px]">
          <span className="inline-block w-1.5 h-1.5 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)] animate-pulse" />
          LOADING_DATA...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-20 py-10">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-[6px] leading-none text-[var(--cyber-text-bright)] cyber-glow-text m-0 mb-3">
          NEW CHARACTER
        </h1>
        <div className="font-mono text-[13px] text-[var(--cyber-accent-dim)] flex items-center gap-3 tracking-[1px]">
          <span className="inline-block w-1.5 h-1.5 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)]" />
          PROJECT: {project.toUpperCase()} // CREATE_MODE
        </div>
      </header>

      <CharacterForm
        project={project}
        allCharacters={allCharacters}
        mode="create"
      />
    </div>
  );
}
