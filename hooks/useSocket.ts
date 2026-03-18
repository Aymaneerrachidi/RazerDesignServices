"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

let globalSocket: Socket | null = null;

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

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const socket = io(origin, {
      auth:       { userId: session.user.id, role: session.user.role },
      transports: ["websocket", "polling"],
      reconnection:         true,
      reconnectionAttempts: 3,   // Give up quickly on serverless (Vercel)
      reconnectionDelay:    3000,
      timeout:              8000,
    });

    socket.on("connect",    () => { setConnected(true);  });
    socket.on("disconnect", () => { setConnected(false); });

    globalSocket       = socket;
    socketRef.current  = socket;

    return () => {
      // Don't disconnect on component unmount — keep connection alive
    };
  }, [session?.user?.id]);

  return { socket: socketRef.current, connected };
}

// Singleton getter for use outside React components
export function getSocket(): Socket | null {
  return globalSocket;
}
