"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Character } from "@/lib/types";
import { CharacterForm } from "@/components/admin/CharacterForm";

export default function EditCharacterPage() {
  const params = useParams();
  const project = params.project as string;
  const characterId = parseInt(params.id as string, 10);
  const [character, setCharacter] = useState<Character | null>(null);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/characters?project=${project}`)
      .then((r) => r.json())
      .then((data: Character[]) => {
        setAllCharacters(data);
        const found = data.find((c) => c.id === characterId);
        if (found) {
          setCharacter(found);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [project, characterId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 md:px-20 py-10">
        <div className="font-mono text-[13px] text-[var(--cyber-accent-dim)] flex items-center gap-3 tracking-[1px]">
          <span className="inline-block w-1.5 h-1.5 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)] animate-pulse" />
          LOADING_ENTITY_DATA...
        </div>
      </div>
    );
  }

  if (notFound || !character) {
    return (
      <div className="max-w-4xl mx-auto px-6 md:px-20 py-10">
        <div className="cyber-form-section">
          <div className="font-mono text-[14px] text-[var(--cyber-danger)] uppercase tracking-[2px] mb-4">
            ERROR: ENTITY_NOT_FOUND
          </div>
          <p className="font-mono text-[13px] text-[var(--cyber-muted)]">
            No character with ID {characterId} exists in project &quot;{project}&quot;.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-20 py-10">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-[6px] leading-none text-[var(--cyber-text-bright)] cyber-glow-text m-0 mb-3">
          EDIT: {character.name.toUpperCase()}
        </h1>
        <div className="font-mono text-[13px] text-[var(--cyber-accent-dim)] flex items-center gap-3 tracking-[1px]">
          <span className="inline-block w-1.5 h-1.5 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)]" />
          PROJECT: {project.toUpperCase()} // EDIT_MODE // ID:{character.id}
        </div>
      </header>

      <CharacterForm
        character={character}
        project={project}
        allCharacters={allCharacters}
        mode="edit"
      />
    </div>
  );
}
