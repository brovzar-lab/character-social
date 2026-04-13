"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { Character, Message } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ConfrontationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = params.project as string;
  const aId = parseInt(searchParams.get("a") || "0", 10);
  const bId = parseInt(searchParams.get("b") || "1", 10);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turn, setTurn] = useState<"a" | "b">("a");

  const charA = characters.find(c => c.id === aId);
  const charB = characters.find(c => c.id === bId);

  useEffect(() => {
    fetch(`/api/characters?project=${project}`)
      .then(r => r.json())
      .then(setCharacters);
  }, [project]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !charA || !charB) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const respondingChar = turn === "a" ? charA : charB;
      const otherChar = turn === "a" ? charB : charA;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          characterId: respondingChar.id,
          message: userMessage.content,
          history: messages,
          mode: "confrontation",
          otherCharacterId: otherChar.id,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      const assistantMessage: Message = {
        id: `char-${respondingChar.id}-${Date.now()}`,
        role: "assistant",
        content: "",
        characterId: respondingChar.id,
        characterName: respondingChar.name,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              fullContent += parsed.content;
              setMessages(prev =>
                prev.map(m => m.id === assistantMessage.id ? { ...m, content: fullContent } : m)
              );
            } catch { /* skip */ }
          }
        }
      }

      setTurn(turn === "a" ? "b" : "a");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, charA, charB, turn, messages, project]);

  if (!charA || !charB) {
    return (
      <div className="cyber-bg flex items-center justify-center min-h-screen font-mono text-[var(--cyber-muted)] text-sm">
        LOADING_CONFRONTATION...
      </div>
    );
  }

  const nextChar = turn === "a" ? charA : charB;

  return (
    <div className="h-screen flex flex-col bg-[var(--cyber-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--cyber-border)] bg-[var(--cyber-panel-dark)] px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => router.push(`/${project}`)}
          className="font-mono text-[10px] text-[var(--cyber-accent)] uppercase tracking-[1px] hover:drop-shadow-[0_0_8px_var(--cyber-accent)] transition-all bg-transparent border-none cursor-pointer"
        >
          [ SYS.RET ] GALLERY
        </button>
        <div className="w-px h-4 bg-[var(--cyber-border)]" />
        <span className="font-mono text-[9px] px-2 py-0.5 border border-[var(--cyber-danger)] text-[var(--cyber-danger)] uppercase tracking-[1px]">
          CONFRONTATION
        </span>

        {/* Character A */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold"
            style={{
              backgroundColor: charA.factionColor,
              clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)",
            }}
          >
            {charA.name.charAt(0)}
          </div>
          <span className="font-mono text-sm font-bold text-[var(--cyber-text-bright)] uppercase tracking-wider">
            {charA.name}
          </span>
        </div>

        <span className="font-mono text-[var(--cyber-danger)] text-xs font-bold">VS</span>

        {/* Character B */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold"
            style={{
              backgroundColor: charB.factionColor,
              clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)",
            }}
          >
            {charB.name.charAt(0)}
          </div>
          <span className="font-mono text-sm font-bold text-[var(--cyber-text-bright)] uppercase tracking-wider">
            {charB.name}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 font-mono text-[10px] text-[var(--cyber-muted)]">
          NEXT_TURN:
          <span className="text-[var(--cyber-accent)]">{nextChar.name.toUpperCase()}</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <p className="font-mono text-sm text-[var(--cyber-text-bright)] uppercase tracking-[2px] mb-2">
                CONFRONTATION_MODE
              </p>
              <p className="font-mono text-[12px] text-[var(--cyber-muted)]">
                Set the scene or ask a provocative question. {nextChar.name} responds first.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const msgChar = msg.characterId === charA.id ? charA : msg.characterId === charB.id ? charB : null;
            const isCharA = msg.characterId === charA.id;

            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? "justify-center" : isCharA ? "justify-start" : "justify-end"}`}>
                {!isUser && isCharA && msgChar && (
                  <div
                    className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1"
                    style={{
                      backgroundColor: msgChar.factionColor,
                      clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)",
                    }}
                  >
                    {msgChar.name.charAt(0)}
                  </div>
                )}
                <div className={`max-w-[65%] px-4 py-2.5 ${
                  isUser
                    ? "bg-[rgba(255,255,255,0.05)] border border-[var(--cyber-border)] text-center italic font-mono text-[12px]"
                    : isCharA
                      ? "bg-[var(--cyber-panel)] border border-[var(--cyber-border)]"
                      : "bg-[rgba(0,255,255,0.03)] border border-[var(--cyber-accent-dim)]"
                }`} style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
                  {!isUser && msgChar && (
                    <p className="font-mono text-[10px] font-bold mb-1 uppercase tracking-[1px]" style={{ color: msgChar.factionColor }}>
                      {msgChar.name}
                    </p>
                  )}
                  {isUser && <p className="font-mono text-[9px] text-[var(--cyber-accent-dim)] mb-1 uppercase tracking-[1px]">MODERATOR</p>}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-[var(--cyber-text)]">{msg.content}</p>
                </div>
                {!isUser && !isCharA && msgChar && (
                  <div
                    className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1"
                    style={{
                      backgroundColor: msgChar.factionColor,
                      clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)",
                    }}
                  >
                    {msgChar.name.charAt(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-[var(--cyber-border)] bg-[var(--cyber-panel-dark)] p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={`>_ Moderate — ${nextChar.name} responds next...`}
            className="resize-none min-h-[44px] max-h-[120px] bg-[var(--cyber-panel)] border-[var(--cyber-border)] text-[var(--cyber-text)] font-mono text-sm placeholder:text-[var(--cyber-muted)] focus:border-[var(--cyber-accent-dim)]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-[44px] w-[44px] flex items-center justify-center bg-[var(--cyber-accent)] text-black disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border-none transition-opacity hover:opacity-90"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
