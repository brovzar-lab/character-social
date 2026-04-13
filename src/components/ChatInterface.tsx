"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Character, Message, ConversationMode } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatInterfaceProps {
  project: string;
  character: Character;
  mode: ConversationMode;
  otherCharacter?: Character;
  roomCharacters?: Character[];
}

export function ChatInterface({
  project,
  character,
  mode,
  otherCharacter,
  roomCharacters,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

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
      if (mode === "room" && roomCharacters) {
        // Room mode: get all character responses
        const res = await fetch("/api/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project,
            characterIds: roomCharacters.map(c => c.id),
            message: userMessage.content,
            roundHistory: messages,
          }),
        });

        const data = await res.json();
        const newMessages: Message[] = data.responses.map((r: { characterId: number; name: string; response: string }) => ({
          id: `char-${r.characterId}-${Date.now()}`,
          role: "assistant" as const,
          content: r.response,
          characterId: r.characterId,
          characterName: r.name,
          timestamp: Date.now(),
        }));

        setMessages(prev => [...prev, ...newMessages]);
      } else {
        // Solo or confrontation: stream single response
        const targetChar = mode === "confrontation" && otherCharacter ? otherCharacter : character;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project,
            characterId: targetChar.id,
            message: userMessage.content,
            history: messages,
            mode,
            otherCharacterId: mode === "confrontation" ? character.id : undefined,
          }),
        });

        // Handle streaming response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        const assistantMessage: Message = {
          id: `char-${targetChar.id}-${Date.now()}`,
          role: "assistant",
          content: "",
          characterId: targetChar.id,
          characterName: targetChar.name,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsStreaming(true);

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(line.slice(6));
                fullContent += parsed.content;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessage.id ? { ...m, content: fullContent } : m
                  )
                );
                scrollToBottom();
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }

        setIsStreaming(false);

        // If streaming didn't work, try JSON fallback
        if (!fullContent) {
          try {
            const text = await res.text();
            const data = JSON.parse(text);
            fullContent = data.response || text;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessage.id ? { ...m, content: fullContent } : m
              )
            );
          } catch {
            // Already handled via streaming
          }
        }

        // Save exchange to Zep memory (background, non-blocking)
        if (fullContent) {
          fetch("/api/memory/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              characterId: targetChar.id,
              characterName: targetChar.name,
              userMessage: userMessage.content,
              assistantResponse: fullContent,
            }),
          }).catch(() => {}); // Silent fail — memory is optional
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getCharacterForMessage = (msg: Message) => {
    if (msg.characterId === undefined) return null;
    if (roomCharacters) return roomCharacters.find(c => c.id === msg.characterId);
    if (otherCharacter && msg.characterId === otherCharacter.id) return otherCharacter;
    if (msg.characterId === character.id) return character;
    return null;
  };

  // Determine if consecutive messages are from the same sender
  const isSameSender = (current: Message, previous: Message | undefined) => {
    if (!previous) return false;
    if (current.role === "user" && previous.role === "user") return true;
    if (current.role === "assistant" && previous.role === "assistant" && current.characterId === previous.characterId) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <p className="text-base font-medium" style={{ color: "var(--cyber-text)" }}>
                Start a conversation
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--cyber-muted)" }}>
                {mode === "solo" && `Talk to ${character.name} — they'll respond in character.`}
                {mode === "confrontation" && `Moderate a conversation between ${character.name} and ${otherCharacter?.name}.`}
                {mode === "room" && `Ask a question — all characters in the room will respond.`}
              </p>
            </div>
          )}

          <div className="flex flex-col">
            {messages.map((msg, index) => {
              const msgChar = getCharacterForMessage(msg);
              const isUser = msg.role === "user";
              const sameSender = isSameSender(msg, messages[index - 1]);
              const showAvatar = !isUser && msgChar && !sameSender;
              const showName = !isUser && msgChar && !sameSender;

              return (
                <div
                  key={msg.id}
                  className={sameSender ? "mt-1" : "mt-3"}
                  style={index === 0 ? { marginTop: 0 } : undefined}
                >
                  <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                    {/* Character avatar spacer / avatar */}
                    {!isUser && (
                      <div className="w-7 shrink-0">
                        {showAvatar && msgChar && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                            style={{ backgroundColor: msgChar.factionColor }}
                          >
                            {msgChar.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className="max-w-[80%]">
                      {/* Character name label */}
                      {showName && msgChar && (
                        <p
                          className="text-[11px] font-mono mb-1 ml-1"
                          style={{ color: "var(--cyber-accent)" }}
                        >
                          {msgChar.name}
                        </p>
                      )}

                      <div
                        className="px-3.5 py-2.5"
                        style={
                          isUser
                            ? {
                                backgroundColor: "rgba(0, 255, 255, 0.03)",
                                border: "1px solid rgba(0, 255, 255, 0.08)",
                                borderRadius: "18px 18px 4px 18px",
                                color: "var(--cyber-text)",
                              }
                            : {
                                backgroundColor: "var(--cyber-panel)",
                                border: "1px solid var(--cyber-border)",
                                borderRadius: "18px 18px 18px 4px",
                                color: "var(--cyber-text)",
                              }
                        }
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Streaming dots indicator */}
            {isLoading && !isStreaming && mode !== "room" && (
              <div className="mt-3">
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-7 shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                      style={{ backgroundColor: character.factionColor }}
                    >
                      {character.name.charAt(0)}
                    </div>
                  </div>
                  <div
                    className="px-4 py-3"
                    style={{
                      backgroundColor: "var(--cyber-panel)",
                      border: "1px solid var(--cyber-border)",
                      borderRadius: "18px 18px 18px 4px",
                    }}
                  >
                    <div className="flex gap-1 items-center">
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: "var(--cyber-accent-dim)", animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: "var(--cyber-accent-dim)", animationDelay: "300ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: "var(--cyber-accent-dim)", animationDelay: "600ms" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Streaming in-progress dots (below the active message) */}
            {isStreaming && (
              <div className="mt-1 ml-9 flex gap-1 items-center px-2 py-1">
                <span
                  className="w-1 h-1 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--cyber-accent-dim)", animationDelay: "0ms" }}
                />
                <span
                  className="w-1 h-1 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--cyber-accent-dim)", animationDelay: "300ms" }}
                />
                <span
                  className="w-1 h-1 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--cyber-accent-dim)", animationDelay: "600ms" }}
                />
              </div>
            )}
          </div>

          {/* Scroll sentinel */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div
        className="px-4 py-3"
        style={{
          backgroundColor: "rgba(5, 5, 10, 0.95)",
          borderTop: "1px solid var(--cyber-border)",
        }}
      >
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--cyber-muted)]"
            style={{
              color: "var(--cyber-text)",
              border: "1px solid var(--cyber-border)",
              borderRadius: "9999px",
              padding: "10px 16px",
              backgroundColor: "rgba(10, 15, 25, 0.6)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(0, 255, 255, 0.3)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0, 255, 255, 0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--cyber-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="shrink-0 flex items-center justify-center transition-opacity"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: !input.trim() || isLoading ? "rgba(0, 255, 255, 0.1)" : "rgba(0, 255, 255, 0.2)",
              border: "1px solid rgba(0, 255, 255, 0.2)",
              cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
              opacity: !input.trim() || isLoading ? 0.4 : 1,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--cyber-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
