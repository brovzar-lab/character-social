"use client";

import Link from "next/link";
import type { ProjectMeta } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectMeta;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/admin/${project.slug}`} className="block no-underline">
      <div className="cyber-admin-card p-5 flex flex-col gap-4 cursor-pointer">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-extrabold uppercase tracking-[3px] text-[var(--cyber-text-bright)] cyber-glow-text m-0 font-mono">
            {project.name.toUpperCase()}
          </h3>
          <span className="font-mono text-[10px] text-[var(--cyber-accent-dim)] uppercase tracking-[1px]">
            {project.slug}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-[12px] text-[var(--cyber-muted)] leading-relaxed m-0 font-mono line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex gap-6 font-mono text-[11px] text-[var(--cyber-muted)] border-t border-[var(--cyber-border)] pt-3">
          <span>
            ENTITIES:{" "}
            <span className="text-[var(--cyber-accent)]">
              {project.characterCount}
            </span>
          </span>
          <span>
            ACTIONS:{" "}
            <span className="text-[var(--cyber-accent)]">
              {project.totalActions}
            </span>
          </span>
        </div>

        {/* Export date */}
        <div className="font-mono text-[10px] text-[var(--cyber-muted)] tracking-[1px]">
          EXPORTED: {project.exportDate}
        </div>
      </div>
    </Link>
  );
}
