/**
 * Utility to provide a synchronized "Server Now" to the frontend.
 * This prevents employees from cheating by changing their local computer clock.
 */

let serverOffsetMs = 0;

/**
 * Initializes the clock sync by calculating the difference between 
 * the local browser time and the official server time.
 */
export function initServerClock(serverTimeIso: string) {
  const serverTime = new Date(serverTimeIso).getTime();
  const localTime = Date.now();
  serverOffsetMs = serverTime - localTime;
  console.log(`[Clock Sync] Offset established: ${serverOffsetMs}ms`);
}

/**
 * Returns a Date object representing the current time on the server.
 */
export function getServerNow(): Date {
  return new Date(Date.now() + serverOffsetMs);
}

/**
 * Convenience to get current date string in ISO/local format if needed.
 */
export function getServerTodayStr(): string {
  const now = getServerNow();
  return now.toISOString().split("T")[0];
}
