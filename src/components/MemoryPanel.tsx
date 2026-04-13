"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Memory {
  uuid: string;
  fact: string;
  createdAt?: string;
}

interface MemoryPanelProps {
  characterName: string;
  open: boolean;
  onClose: () => void;
}

export function MemoryPanel({ characterName, open, onClose }: MemoryPanelProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [forgetTopic, setForgetTopic] = useState("");
  const [forgetting, setForgetting] = useState(false);
  const [available, setAvailable] = useState(true);
  const [provider, setProvider] = useState<"local" | "zep" | null>(null);

  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memory?character=${encodeURIComponent(characterName)}`);
      const data = await res.json();
      setMemories(data.memories || []);
      setAvailable(data.available !== false);
      setProvider(data.provider ?? null);
    } catch {
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }, [characterName]);

  useEffect(() => {
    if (open) loadMemories();
  }, [open, loadMemories]);

  const handleDeleteOne = async (uuid: string) => {
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", edgeUuid: uuid }),
    });
    const data = await res.json();
    if (data.success) {
      setMemories(prev => prev.filter(m => m.uuid !== uuid));
    }
  };

  const handleForgetTopic = async () => {
    if (!forgetTopic.trim()) return;
    setForgetting(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "forget",
          characterName,
          topic: forgetTopic.trim(),
        }),
      });
      const data = await res.json();
      setForgetTopic("");
      loadMemories();
      if (data.deleted > 0) {
        alert(`Deleted ${data.deleted} memories about "${data.topic}"`);
      } else {
        alert(`No memories found about "${data.topic}"`);
      }
    } finally {
      setForgetting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="w-80 border-l bg-background flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Memory</h3>
          <p className="text-[10px] text-muted-foreground">{characterName}</p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={loadMemories} disabled={loading}>
            {loading ? "..." : "Refresh"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {!available && (
        <div className="p-4 text-xs text-muted-foreground text-center">
          Memory system error. Unable to load memories.
        </div>
      )}

      {/* Selective Forget */}
      {available && (
        <div className="p-3 border-b">
          <p className="text-[10px] text-muted-foreground mb-2">
            Selective forget — tell {characterName.split(" ")[0]} to forget something
          </p>
          <div className="flex gap-1">
            <Input
              value={forgetTopic}
              onChange={(e) => setForgetTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleForgetTopic(); }}
              placeholder="e.g. the purple car"
              className="text-xs h-8"
              disabled={forgetting}
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={handleForgetTopic}
              disabled={!forgetTopic.trim() || forgetting}
              className="h-8 text-xs px-2 shrink-0"
            >
              Forget
            </Button>
          </div>
        </div>
      )}

      {/* Memory List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {memories.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground text-center py-8">
              {available ? "No memories yet. Start chatting to build them." : ""}
            </p>
          )}

          {memories.map((m) => (
            <div key={m.uuid} className="group relative bg-muted rounded-lg p-2.5 text-xs leading-relaxed">
              <p>{m.fact}</p>
              {m.createdAt && (
                <p className="text-[9px] text-muted-foreground mt-1">
                  {new Date(m.createdAt).toLocaleDateString()}
                </p>
              )}
              <button
                onClick={() => handleDeleteOne(m.uuid)}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 text-[10px] bg-background rounded px-1"
              >
                delete
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      {available && memories.length > 0 && (
        <div className="p-3 border-t flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {memories.length} memories
          </Badge>
          {provider === "zep" && (
            <Badge variant="outline" className="text-[10px] border-primary text-primary">
              Zep Cloud
            </Badge>
          )}
          {provider === "local" && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Local
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
