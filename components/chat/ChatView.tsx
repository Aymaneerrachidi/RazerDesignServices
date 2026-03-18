"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  CheckCheck,
  Check,
  Smile,
  Lock,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { getUserStatusColor, formatDateTime, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface ChatViewProps {
  conversationId: string;      // = artistId
  currentUser: User;
  otherUser: User;
  privateLabel?: string;
}

export function ChatView({
  conversationId,
  currentUser,
  otherUser,
  privateLabel = "Private Channel",
}: ChatViewProps) {
  const { messages, sendMessage, sendTyping, stopTyping, typingUsers, connected, isLoading } =
    useRealtimeChat(conversationId);
  const typingUser = Object.values(typingUsers)[0] ?? null;

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    stopTyping();
    await sendMessage(content);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value.trim()) {
      sendTyping();
    } else {
      stopTyping();
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col max-w-3xl mx-auto">
      {/* Header bar */}
      <div className="card-premium rounded-t-2xl px-5 py-4 border-b border-[var(--border)] flex items-center gap-4 flex-shrink-0 relative overflow-hidden">
        <div className="neon-line absolute top-0 left-0 right-0" />
        <Avatar
          name={otherUser.name}
          avatar={otherUser.avatar}
          size="md"
          status={otherUser.status}
          showStatus
        />
        <div className="flex-1">
          <p className="text-sm font-display font-bold text-text-primary">{otherUser.name}</p>
          <div className="flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full", getUserStatusColor(otherUser.status))} />
            <span className="text-xs text-text-muted font-body capitalize">
              {otherUser.status === "online" ? "Online" : otherUser.status}
            </span>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-xs text-text-muted font-body truncate max-w-[180px]">
              {otherUser.bio ?? otherUser.email}
            </span>
          </div>
        </div>

        {/* Connection status */}
        <div
          className={cn(
            "flex items-center gap-1.5 text-2xs font-mono px-3 py-1.5 rounded-full border transition-all duration-500",
            connected
              ? "bg-neon/5 border-neon/15 text-neon"
              : "bg-red-500/5 border-red-500/15 text-red-400"
          )}
        >
          {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
          {connected ? "Live" : "Reconnecting…"}
        </div>

        <div className="flex items-center gap-1.5 text-2xs text-text-muted font-mono bg-white/3 border border-[var(--border)] px-3 py-1.5 rounded-full">
          <Lock size={10} className="text-neon" />
          {privateLabel}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-1 bg-void/50">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 rounded-full border-2 border-neon/20 border-t-neon animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-white/3 border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
              <Lock size={22} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted font-body">No messages yet.</p>
            <p className="text-xs text-text-muted font-body mt-1">Start the conversation below.</p>
          </div>
        )}

        {!isLoading && messages.map((msg, i) => {
          const isSelf = msg.senderId === currentUser.id;
          const msgTime = msg.createdAt;
          const sender = isSelf ? currentUser : otherUser;

          // Group consecutive messages from same sender (show avatar only on last)
          const nextMsg = messages[i + 1];
          const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

          // Show timestamp divider if gap > 5 minutes
          const prevMsg = messages[i - 1];
          const showTimeDivider =
            !prevMsg ||
            new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300_000;

          return (
            <div key={msg.id}>
              {showTimeDivider && (
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-2xs text-text-muted font-mono whitespace-nowrap bg-void px-2">
                    {formatDateTime(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
              )}

              <div
                className={cn(
                  "flex gap-2.5 group",
                  isSelf ? "flex-row-reverse" : "flex-row",
                  isLastInGroup ? "mb-3" : "mb-0.5"
                )}
                style={{ animation: "slideUp 0.2s ease-out" }}
              >
                {/* Avatar — only on last message in group */}
                <div className="flex-shrink-0 w-7">
                  {isLastInGroup ? (
                    <Avatar name={sender.name ?? sender.fullName} avatar={(sender as any).avatar ?? (sender as any).avatarUrl} size="xs" />
                  ) : null}
                </div>

                <div className={cn("flex flex-col max-w-[75%]", isSelf ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "px-4 py-2.5 text-sm font-body leading-relaxed break-words",
                      isSelf
                        ? "msg-bubble-sent text-text-primary"
                        : "msg-bubble-received text-text-primary"
                    )}
                  >
                    {msg.content}
                  </div>

                  {/* Timestamp + read receipt — only on last in group */}
                  {isLastInGroup && (
                    <div
                      className={cn(
                        "flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        isSelf ? "flex-row-reverse" : ""
                      )}
                    >
                      <span className="text-2xs text-text-muted font-mono">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                      {isSelf && (
                        msg.readReceipts?.length > 0 ? (
                          <CheckCheck size={11} className="text-neon" />
                        ) : (
                          <Check size={11} className="text-text-muted" />
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUser && (
          <div
            className="flex gap-2.5 items-end mb-3"
            style={{ animation: "slideUp 0.2s ease-out" }}
          >
            <Avatar name={otherUser.name} avatar={otherUser.avatar} size="xs" className="flex-shrink-0" />
            <div className="msg-bubble-received px-4 py-3 flex items-center gap-1.5">
              <span className="text-xs text-text-muted font-body mr-1">{typingUser}</span>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-text-muted"
                  style={{
                    animation: `pulseNeon 1.2s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="card-premium rounded-b-2xl px-4 py-4 border-t border-[var(--border)] flex-shrink-0">
        <div className="flex items-end gap-3">
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-neon hover:bg-neon/8 transition-all flex-shrink-0">
            <Paperclip size={17} />
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              onBlur={stopTyping}
              placeholder={`Message ${otherUser.name}…`}
              className="input-base w-full rounded-xl h-11 text-sm font-body px-4 pr-10"
              autoFocus
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
              <Smile size={16} />
            </button>
          </div>

          <Button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            size="sm"
            className="h-11 w-11 !px-0 flex-shrink-0"
            icon={<Send size={16} />}
          >
            {""}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Lock size={10} className="text-text-muted" />
          <p className="text-2xs text-text-muted font-body">
            End-to-end private · Press Enter to send
          </p>
          {!connected && (
            <span className="text-2xs text-red-400 font-mono ml-2">⚡ Reconnecting…</span>
          )}
        </div>
      </div>
    </div>
  );
}
