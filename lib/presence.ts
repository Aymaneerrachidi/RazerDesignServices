export const PRESENCE_HEARTBEAT_MS = 25_000;
export const PRESENCE_TIMEOUT_MS = 70_000;

type PresenceFields = {
  isOnline: boolean;
  lastSeenAt: Date | string | null;
};

/**
 * A stored online flag is only valid while the browser is still sending
 * heartbeats. This prevents crashed browsers and expired sessions from
 * leaving a user online forever.
 */
export function withFreshPresence<T extends PresenceFields>(user: T): T {
  const lastSeenAt = user.lastSeenAt
    ? new Date(user.lastSeenAt).getTime()
    : Number.NaN;
  const isFresh = Number.isFinite(lastSeenAt)
    && Date.now() - lastSeenAt < PRESENCE_TIMEOUT_MS;

  return {
    ...user,
    isOnline: user.isOnline && isFresh,
  };
}

