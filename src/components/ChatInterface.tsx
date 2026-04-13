"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Character, Message, ConversationMode } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }

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

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm mt-1">
                {mode === "solo" && `Talk to ${character.name} — they'll respond in character.`}
                {mode === "confrontation" && `Moderate a conversation between ${character.name} and ${otherCharacter?.name}.`}
                {mode === "room" && `Ask a question — all characters in the room will respond.`}
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const msgChar = getCharacterForMessage(msg);
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && msgChar && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1"
                    style={{ backgroundColor: msgChar.factionColor }}
                  >
                    {msgChar.name.charAt(0)}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? "bg-foreground text-background"
                      : "bg-muted"
                  }`}
                >
                  {!isUser && msgChar && (
                    <p className="text-xs font-semibold mb-1" style={{ color: msgChar.factionColor }}>
                      {msgChar.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {isLoading && mode !== "room" && (
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: character.factionColor }}
              >
                {character.name.charAt(0)}
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "solo"
                ? `Talk to ${character.name}...`
                : mode === "confrontation"
                ? `Moderate the conversation...`
                : `Ask the room a question...`
            }
            className="resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-[44px] w-[44px]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
