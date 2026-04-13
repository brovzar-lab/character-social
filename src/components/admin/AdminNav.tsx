"use client";

import Link from "next/link";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminNavProps {
  breadcrumbs: Breadcrumb[];
}

export function AdminNav({ breadcrumbs }: AdminNavProps) {
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--cyber-border)] bg-[var(--cyber-panel-dark)]">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-[var(--cyber-accent)]">
        ADMIN_CONSOLE
      </span>

      <div className="cyber-breadcrumb">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="separator">{"//"}</span>}
              {crumb.href && !isLast ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span className={isLast ? "text-[var(--cyber-text-bright)] uppercase tracking-[1px]" : ""}>
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
