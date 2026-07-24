"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

let globalSocket: Socket | null = null;
let connectionAttempted = false;

export function useSocket() {
  const { data: session } = useSession();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Reuse existing socket if already connected
    if (globalSocket?.connected) {
      socketRef.current = globalSocket;
      setConnected(true);
      return;
    }

    // Don't create another socket if we already tried and failed
    if (connectionAttempted && globalSocket && !globalSocket.connected) {
      return;
    }

    connectionAttempted = true;
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const socket = io(origin, {
      auth:                 { userId: session.user.id, role: session.user.role },
      transports:           ["websocket", "polling"],
      reconnection:         false, // No auto-reconnect — server.ts doesn't run on Vercel
      timeout:              5000,
    });

    socket.on("connect",       () => { setConnected(true);  });
    socket.on("disconnect",    () => { setConnected(false); });
    socket.on("connect_error", () => { socket.close();      }); // Stop retrying immediately

    globalSocket      = socket;
    socketRef.current = socket;
  }, [session?.user?.id]);

  return { socket: socketRef.current, connected };
}

// Singleton getter for use outside React components
export function getSocket(): Socket | null {
  return globalSocket;
}

export function disconnectSocket() {
  globalSocket?.disconnect();
  globalSocket = null;
  connectionAttempted = false;
}
