"use client";

import { useCallback, useRef, useState } from "react";

interface LogLine {
  text: string;
  type: "success" | "error" | "info";
}

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "complete"; count: number }
  | { kind: "error"; message: string };

const STEPS = [
  { id: "process-export", label: "Process Export", script: "process-export.ts" },
  { id: "build-key-characters", label: "Build Key Characters", script: "build-key-characters.ts" },
  { id: "enrich-characters", label: "Enrich Characters", script: "enrich-characters.ts" },
] as const;

function classifyLine(line: string): LogLine["type"] {
  const lower = line.toLowerCase();
  if (lower.includes("error") || lower.includes("fail") || lower.includes("fatal")) return "error";
  if (lower.includes("success") || lower.includes("complete") || lower.includes("done") || lower.includes("wrote") || lower.includes("saved")) return "success";
  return "info";
}

function parseCharacterCount(lines: LogLine[]): number | null {
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const match = lines[i].text.match(/(\d+)\s*characters?/i);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

interface ImportPanelProps {
  project: string;
}

export function ImportPanel({ project }: ImportPanelProps) {
  const [exportPath, setExportPath] = useState(`data/exports/${project}`);
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(
    new Set(STEPS.map((s) => s.id))
  );
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const terminalRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = terminalRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const appendLog = useCallback(
    (text: string) => {
      const line: LogLine = { text, type: classifyLine(text) };
      setLogs((prev) => [...prev, line]);
      // schedule scroll after render
      requestAnimationFrame(() => scrollToBottom());
    },
    [scrollToBottom]
  );

  const toggleStep = (id: string) => {
    setSelectedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRun = async () => {
    if (selectedSteps.size === 0) return;

    setLogs([]);
    setStatus({ kind: "running" });
    appendLog(`> Starting pipeline for project: ${project}`);
    appendLog(`> Export path: ${exportPath}`);
    appendLog(`> Steps: ${[...selectedSteps].join(", ")}`);
    appendLog("");

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          steps: [...selectedSteps],
          exportPath,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        appendLog(`[ERROR] HTTP ${res.status}: ${errText}`);
        setStatus({ kind: "error", message: `HTTP ${res.status}` });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        appendLog("[ERROR] No response stream available");
        setStatus({ kind: "error", message: "No response stream" });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      const allLines: LogLine[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // keep incomplete last line in buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.trim() === "") continue;
          const logLine: LogLine = { text: line, type: classifyLine(line) };
          allLines.push(logLine);
          setLogs((prev) => [...prev, logLine]);
          requestAnimationFrame(() => scrollToBottom());
        }
      }

      // flush remaining buffer
      if (buffer.trim()) {
        const logLine: LogLine = { text: buffer, type: classifyLine(buffer) };
        allLines.push(logLine);
        setLogs((prev) => [...prev, logLine]);
      }

      // determine outcome
      const hasError = allLines.some((l) => l.type === "error");
      if (hasError) {
        const errorLine = allLines.filter((l) => l.type === "error").pop();
        setStatus({
          kind: "error",
          message: errorLine?.text ?? "Pipeline encountered errors",
        });
      } else {
        const count = parseCharacterCount(allLines);
        setStatus({ kind: "complete", count: count ?? 0 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      appendLog(`[ERROR] ${message}`);
      setStatus({ kind: "error", message });
    }
  };

  const isRunning = status.kind === "running";

  return (
    <div className="flex flex-col gap-4">
      {/* Export Path */}
      <div className="cyber-form-section">
        <div className="cyber-form-section-header">Export Path</div>
        <input
          type="text"
          value={exportPath}
          onChange={(e) => setExportPath(e.target.value)}
          className="cyber-input"
          placeholder="data/exports/my-project"
          disabled={isRunning}
        />
      </div>

      {/* Step Selection */}
      <div className="cyber-form-section">
        <div className="cyber-form-section-header">Pipeline Steps</div>
        <div className="flex flex-col gap-3">
          {STEPS.map((step) => (
            <label
              key={step.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedSteps.has(step.id)}
                onChange={() => toggleStep(step.id)}
                disabled={isRunning}
                className="accent-[var(--cyber-accent)] w-4 h-4 cursor-pointer"
              />
              <span className="font-mono text-[13px] text-[var(--cyber-text)] group-hover:text-[var(--cyber-text-bright)] transition-colors">
                {step.label}
              </span>
              <span className="font-mono text-[11px] text-[var(--cyber-muted)]">
                ({step.script})
              </span>
            </label>
          ))}
          <p className="font-mono text-[11px] text-[var(--cyber-muted)] mt-1 ml-7 opacity-70">
            Note: Build Key Characters is currently hardcoded for oro-verde
          </p>
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={isRunning || selectedSteps.size === 0}
        className="cyber-action-btn self-start disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isRunning && (
          <span className="inline-block w-2 h-2 bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)] animate-pulse" />
        )}
        {isRunning ? "RUNNING..." : "RUN_PIPELINE"}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      </button>

      {/* Terminal Log Output */}
      <div className="cyber-form-section">
        <div className="cyber-form-section-header">Log Output</div>
        <div ref={terminalRef} className="cyber-terminal">
          {logs.length === 0 ? (
            <span className="log-info">Awaiting pipeline execution...</span>
          ) : (
            logs.map((line, i) => (
              <div key={i} className={`log-${line.type}`}>
                {line.text}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[1px] px-1">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            status.kind === "idle"
              ? "bg-[var(--cyber-muted)]"
              : status.kind === "running"
                ? "bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)] animate-pulse"
                : status.kind === "complete"
                  ? "bg-[var(--cyber-accent)] shadow-[0_0_8px_var(--cyber-accent)]"
                  : "bg-[var(--cyber-danger)] shadow-[0_0_8px_var(--cyber-danger)]"
          }`}
        />
        {status.kind === "idle" && (
          <span className="text-[var(--cyber-muted)]">IDLE</span>
        )}
        {status.kind === "running" && (
          <span className="text-[var(--cyber-accent)]">RUNNING...</span>
        )}
        {status.kind === "complete" && (
          <span className="text-[var(--cyber-accent)]">
            COMPLETE: {status.count} characters
          </span>
        )}
        {status.kind === "error" && (
          <span className="text-[var(--cyber-danger)]">
            ERROR: {status.message}
          </span>
        )}
      </div>

      {/* View Gallery Link (after success) */}
      {status.kind === "complete" && (
        <a
          href={`/admin/${project}`}
          className="cyber-connect-btn self-start mt-2"
        >
          VIEW GALLERY
        </a>
      )}
    </div>
  );
}
