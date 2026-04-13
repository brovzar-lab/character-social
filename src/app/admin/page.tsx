"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProjectMeta } from "@/lib/types";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProjectCard } from "@/components/admin/ProjectCard";

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ slug: "", name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects);
  }, []);

  async function handleCreate() {
    if (!formData.slug.trim() || !formData.name.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const updated = await fetch("/api/projects").then((r) => r.json());
      setProjects(updated);
      setFormData({ slug: "", name: "", description: "" });
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <AdminNav breadcrumbs={[{ label: "Admin" }]} />

      <div className="max-w-[1440px] mx-auto px-6 md:px-20 py-10">
        {/* SYS Header */}
        <div className="flex justify-between items-center font-mono text-[11px] text-[var(--cyber-accent-dim)] uppercase tracking-[2px] mb-8 border-b border-[var(--cyber-border)] pb-3">
          <span>SYS.ADMIN // CONTROL_LAYER // ROOT_ACCESS</span>
          <Link
            href="/"
            className="font-bold text-[var(--cyber-muted)] tracking-[2px] hover:text-[var(--cyber-accent)] transition-colors no-underline"
          >
            {"[ VIEW_AS_USER ]"}
          </Link>
        </div>

        {/* Title */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-[6px] leading-none text-[var(--cyber-text-bright)] cyber-glow-text m-0 mb-3">
            ADMIN_CONSOLE
          </h1>
          <div className="font-mono text-[13px] text-[var(--cyber-accent-dim)] flex items-center gap-3 tracking-[1px]">
            <span className="inline-block w-1.5 h-1.5 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)]" />
            CONTENT_PIPELINE // {projects.length} PROJECTS LOADED
          </div>
        </header>

        {/* New Project Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="cyber-action-btn"
          >
            {showForm ? "CANCEL" : "+ NEW PROJECT"}
          </button>
        </div>

        {/* Inline Create Form */}
        {showForm && (
          <div className="cyber-form-section mb-8 max-w-xl">
            <div className="cyber-form-section-header">NEW PROJECT</div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                  Slug
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="project-slug"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                  Name
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Project Name"
                />
              </div>
              <div>
                <label className="font-mono text-[11px] text-[var(--cyber-muted)] uppercase tracking-[1px] mb-1 block">
                  Description
                </label>
                <textarea
                  className="cyber-textarea"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Project description..."
                  rows={3}
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="cyber-btn-sm accent self-start"
              >
                {creating ? "CREATING..." : "CREATE PROJECT"}
              </button>
            </div>
          </div>
        )}

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </>
  );
}
