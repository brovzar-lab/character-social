"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { ImportPanel } from "@/components/admin/ImportPanel";

export default function ImportPage() {
  const params = useParams();
  const project = params.project as string;

  return (
    <main className="cyber-bg min-h-screen">
      <AdminNav
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: project, href: `/admin/${project}` },
          { label: "Import" },
        ]}
      />

      <div className="max-w-[900px] mx-auto px-6 md:px-12 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/${project}`}
            className="inline-flex items-center gap-2 font-mono text-[12px] text-[var(--cyber-accent)] uppercase tracking-[1px] mb-6 opacity-80 hover:opacity-100 hover:drop-shadow-[0_0_8px_var(--cyber-accent)] transition-all no-underline"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            [ RET ] CHARACTER GALLERY
          </Link>

          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-[6px] leading-none text-[var(--cyber-text-bright)] cyber-glow-text m-0 mb-3">
            IMPORT_PIPELINE
          </h1>
          <div className="font-mono text-[13px] text-[var(--cyber-accent-dim)] flex items-center gap-3 tracking-[1px]">
            <span className="inline-block w-1.5 h-1.5 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)]" />
            {`PROJECT: ${project.replace(/-/g, "_").toUpperCase()} // MIROFISH_IMPORT`}
          </div>
        </div>

        {/* Import Panel */}
        <ImportPanel project={project} />
      </div>
    </main>
  );
}
