/**
 * In-memory real-time message store.
 * Module-level singleton — shared across all API route invocations
 * in the same Next.js server process.
 *
 * For production: replace with Redis pub/sub + PostgreSQL.
 */

import type { Message } from "./types";
import { MOCK_CONVERSATIONS } from "./mock-data";

// Seed from mock data on first load
const seedMessages = (): Map<string, Message[]> => {
  const store = new Map<string, Message[]>();
  for (const conv of MOCK_CONVERSATIONS) {
    // conversationId = artistId (supervisor is always the other party)
    store.set(conv.artistId, [...conv.messages]);
  }
  return store;
};

// Persist across hot-reloads in dev via globalThis
const g = globalThis as typeof globalThis & {
  __rds_messages?: Map<string, Message[]>;
  __rds_sse_clients?: Map<string, Set<ReadableStreamDefaultController>>;
  __rds_typing?: Map<string, { name: string; until: number }>;
};

if (!g.__rds_messages) g.__rds_messages = seedMessages();
if (!g.__rds_sse_clients) g.__rds_sse_clients = new Map();
if (!g.__rds_typing) g.__rds_typing = new Map();

export const messageStore = g.__rds_messages;
export const sseClients = g.__rds_sse_clients;
export const typingStore = g.__rds_typing;

export function getMessages(conversationId: string): Message[] {
  return messageStore.get(conversationId) ?? [];
}

export function addMessage(conversationId: string, msg: Message): void {
  if (!messageStore.has(conversationId)) messageStore.set(conversationId, []);
  messageStore.get(conversationId)!.push(msg);
  broadcastToConversation(conversationId, { type: "message", payload: msg });
}

export function setTyping(conversationId: string, name: string): void {
  typingStore.set(conversationId, { name, until: Date.now() + 3000 });
  broadcastToConversation(conversationId, { type: "typing", payload: { name } });
}

export function clearTyping(conversationId: string): void {
  typingStore.delete(conversationId);
  broadcastToConversation(conversationId, { type: "typing_stop", payload: {} });
}

export function registerSSEClient(
  conversationId: string,
  controller: ReadableStreamDefaultController
): void {
  if (!sseClients.has(conversationId)) sseClients.set(conversationId, new Set());
  sseClients.get(conversationId)!.add(controller);
}

export function unregisterSSEClient(
  conversationId: string,
  controller: ReadableStreamDefaultController
): void {
  sseClients.get(conversationId)?.delete(controller);
}

function broadcastToConversation(conversationId: string, data: unknown): void {
  const clients = sseClients.get(conversationId);
  if (!clients || clients.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(payload);
  const dead: ReadableStreamDefaultController[] = [];
  for (const ctrl of clients) {
    try {
      ctrl.enqueue(encoded);
    } catch {
      dead.push(ctrl);
    }
  }
  dead.forEach((c) => clients.delete(c));
}
