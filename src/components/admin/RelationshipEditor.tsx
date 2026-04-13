"use client";

import type { Relationship } from "@/lib/types";

const RELATIONSHIP_TYPES: Relationship["type"][] = [
  "family",
  "ally",
  "enemy",
  "professional",
  "romantic",
  "unknown",
];

interface RelationshipEditorProps {
  relationships: Relationship[];
  onChange: (relationships: Relationship[]) => void;
  characterNames?: string[];
}

export function RelationshipEditor({
  relationships,
  onChange,
  characterNames,
}: RelationshipEditorProps) {
  function updateRelationship(index: number, field: keyof Relationship, value: string) {
    const updated = [...relationships];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function removeRelationship(index: number) {
    onChange(relationships.filter((_, i) => i !== index));
  }

  function addRelationship() {
    onChange([...relationships, { target: "", type: "unknown", description: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {relationships.map((rel, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 p-3 border border-[var(--cyber-border)] bg-[rgba(0,0,0,0.2)]"
        >
          <div className="flex gap-2 items-center flex-wrap">
            {/* Target */}
            {characterNames && characterNames.length > 0 ? (
              <select
                className="cyber-input flex-1 min-w-[140px]"
                value={rel.target}
                onChange={(e) => updateRelationship(i, "target", e.target.value)}
              >
                <option value="">-- select target --</option>
                {characterNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="cyber-input flex-1 min-w-[140px]"
                value={rel.target}
                onChange={(e) => updateRelationship(i, "target", e.target.value)}
                placeholder="Target character"
              />
            )}

            {/* Type */}
            <select
              className="cyber-input w-[150px]"
              value={rel.type}
              onChange={(e) => updateRelationship(i, "type", e.target.value)}
            >
              {RELATIONSHIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Remove */}
            <button
              type="button"
              className="cyber-btn-sm danger"
              onClick={() => removeRelationship(i)}
            >
              DEL
            </button>
          </div>

          {/* Description */}
          <input
            type="text"
            className="cyber-input"
            value={rel.description}
            onChange={(e) => updateRelationship(i, "description", e.target.value)}
            placeholder="Relationship description"
          />
        </div>
      ))}

      <button type="button" className="cyber-btn-sm accent self-start" onClick={addRelationship}>
        + ADD RELATIONSHIP
      </button>
    </div>
  );
}
