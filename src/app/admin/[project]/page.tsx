"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Character } from "@/lib/types";
import { CharacterGridCard } from "@/components/admin/CharacterGridCard";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export default function AdminProjectPage() {
  const params = useParams();
  const router = useRouter();
  const project = params.project as string;
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);

  useEffect(() => {
    fetch(`/api/characters?project=${project}`)
      .then((r) => r.json())
      .then(setCharacters);
  }, [project]);

  const factions = [...new Set(characters.map((c) => c.faction))];
  const filtered =
    filter === "all"
      ? characters
      : characters.filter((c) => c.faction === filter);

  async function handleDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/characters/${deleteTarget.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    });
    const updated = await fetch(`/api/characters?project=${project}`).then(
      (r) => r.json()
    );
    setCharacters(updated);
    setDeleteTarget(null);
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-20 py-10">
      {/* SYS Header */}
      <div className="flex justify-between items-center font-mono text-[11px] text-[var(--cyber-accent-dim)] uppercase tracking-[2px] mb-8 border-b border-[var(--cyber-border)] pb-3">
        <span>SYS.ADMIN // PROJECT_EDITOR // WRITE_ACCESS</span>
        <span className="font-bold text-[var(--cyber-text-bright)] tracking-[4px]">
          ADMIN_MODE
        </span>
      </div>

      {/* Header Section */}
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-[6px] leading-none text-[var(--cyber-text-bright)] cyber-glow-text m-0 mb-3">
          {project.replace(/-/g, " ").toUpperCase()}
        </h1>
        <div className="font-mono text-[13px] text-[var(--cyber-accent-dim)] flex items-center gap-3 tracking-[1px]">
          <span className="inline-block w-1.5 h-1.5 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)]" />
          STATUS: {characters.length} ENTITIES LOADED // EDIT_MODE
        </div>
      </header>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          onClick={() => router.push(`/admin/${project}/character/new`)}
          className="cyber-action-btn"
        >
          + NEW CHARACTER
        </button>
        <button
          onClick={() => router.push(`/admin/${project}/import`)}
          className="cyber-action-btn"
        >
          IMPORT
        </button>
      </div>

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
        {factions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-mono text-[12px] uppercase tracking-[1px] cursor-pointer px-4 py-1.5 bg-transparent border-none transition-colors relative ${
              filter === f
                ? "cyber-filter-active"
                : "text-[var(--cyber-muted)] hover:text-[var(--cyber-text-bright)]"
            }`}
          >
            {f.toUpperCase()} (
            {characters.filter((c) => c.faction === f).length})
          </button>
        ))}
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-6">
        {filtered.map((character) => (
          <CharacterGridCard
            key={character.id}
            character={character}
            onEdit={() =>
              router.push(`/admin/${project}/character/${character.id}`)
            }
            onDelete={() => setDeleteTarget(character)}
          />
        ))}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="CONFIRM_DELETE"
        message={
          deleteTarget
            ? `Permanently delete character "${deleteTarget.name}" (${deleteTarget.username})? This action cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
