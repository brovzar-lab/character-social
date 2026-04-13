import Link from "next/link";
import { getProjects } from "@/lib/characters";

export default function HomePage() {
  const projects = getProjects();

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

        {/* Title */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-[6px] text-[var(--cyber-text-bright)] cyber-glow-text leading-none mb-4">
            Character Engine
          </h1>
          <p className="font-mono text-[13px] text-[var(--cyber-accent-dim)] flex items-center gap-3 tracking-[1px]">
            <span className="inline-block w-1.5 h-1.5 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)]" />
            MIROFISH_SIMULATION_INTERVIEWS // SELECT_PROJECT
          </p>
        </div>

        {/* Project List */}
        {projects.length === 0 ? (
          <div className="cyber-card p-8 text-center">
            <p className="text-[var(--cyber-muted)] font-mono text-sm">NO PROJECTS FOUND</p>
            <p className="text-[var(--cyber-muted)] font-mono text-xs mt-2 opacity-60">
              Run <code className="text-[var(--cyber-accent)] bg-black/40 px-2 py-0.5">npx tsx scripts/process-export.ts your-project</code> to process a MiroFish export.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => (
              <Link key={project.slug} href={`/${project.slug}`} className="block group">
                <div className="cyber-card hover:border-[var(--cyber-accent-dim)] transition-all">
                  {/* Header bar */}
                  <div className="flex justify-between items-center px-4 py-2.5 bg-black/40 border-b border-[rgba(0,255,255,0.05)]">
                    <span className="font-mono text-[10px] text-[var(--cyber-text-bright)] tracking-[1px] border-l-2 border-[var(--cyber-accent)] pl-1.5">
                      PROJECT:{project.slug.toUpperCase().replace(/-/g, "_")}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--cyber-muted)] uppercase tracking-[1px]">
                      {project.exportDate || "SYNCED"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex items-start justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-extrabold uppercase tracking-[3px] text-[var(--cyber-text-bright)] mb-2 group-hover:text-[var(--cyber-accent)] transition-colors">
                        {project.slug.replace(/-/g, " ").toUpperCase()}
                      </h2>
                      <p className="text-[13px] text-[var(--cyber-muted)] leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex gap-4 font-mono text-[11px] text-[var(--cyber-muted)] shrink-0">
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--cyber-accent)]">{project.characterCount}</div>
                        <div className="uppercase tracking-[1px]">AGENTS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-[var(--cyber-text-bright)]">{project.totalActions}</div>
                        <div className="uppercase tracking-[1px]">ACTIONS</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 bg-[var(--cyber-panel-dark)] border-t border-[var(--cyber-border)] flex justify-between items-center">
                    <div className="font-mono text-[10px] text-[var(--cyber-muted)] flex items-center gap-2">
                      <span className="cyber-status-dot active" />
                      DIRECTORY_SYNCED
                    </div>
                    <span className="cyber-connect-btn text-[10px]">
                      ENTER
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
