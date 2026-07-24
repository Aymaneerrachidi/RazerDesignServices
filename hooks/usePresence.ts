"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { PRESENCE_HEARTBEAT_MS } from "@/lib/presence";

async function reportPresence(online: boolean, keepalive = false) {
  try {
    await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ online }),
      cache: "no-store",
      keepalive,
    });
  } catch {
    // The freshness timeout on reads handles browsers that disappear abruptly.
  }
}

export function usePresence() {
  const { data: session, status } = useSession();
  const reportingEnabled = useRef(false);

  const markOffline = useCallback(async () => {
    reportingEnabled.current = false;
    await reportPresence(false, true);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      reportingEnabled.current = false;
      return;
    }

    reportingEnabled.current = true;

    const reportOnlineIfVisible = () => {
      if (reportingEnabled.current && document.visibilityState === "visible") {
        void reportPresence(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        reportOnlineIfVisible();
      } else {
        void reportPresence(false, true);
      }
    };

    const handlePageHide = () => {
      void reportPresence(false, true);
    };

    reportOnlineIfVisible();
    const heartbeat = window.setInterval(
      reportOnlineIfVisible,
      PRESENCE_HEARTBEAT_MS,
    );

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      reportingEnabled.current = false;
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [session?.user?.id, status]);

  return { markOffline };
}

