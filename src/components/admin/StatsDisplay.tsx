"use client";

interface StatsDisplayProps {
  stats: {
    totalActions: number;
    postCount: number;
    commentCount: number;
    rounds: number;
  };
}

const STAT_LABELS: { key: keyof StatsDisplayProps["stats"]; label: string }[] = [
  { key: "totalActions", label: "ACTIONS" },
  { key: "postCount", label: "POSTS" },
  { key: "commentCount", label: "COMMENTS" },
  { key: "rounds", label: "ROUNDS" },
];

export function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STAT_LABELS.map(({ key, label }) => (
        <div
          key={key}
          className="flex flex-col items-center gap-1 bg-[rgba(0,0,0,0.3)] border border-[var(--cyber-border)] px-4 py-3"
        >
          <span className="font-mono text-2xl font-bold text-[var(--cyber-accent)]">
            {stats[key]}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[2px] text-[var(--cyber-muted)]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
