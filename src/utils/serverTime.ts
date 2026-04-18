// src/utils/serverTime.ts

let serverOffset = 0;

/**
 * Initializes the server clock synchronization offset.
 * Called by AuthContext when system info is fetched.
 */
export const initServerClock = (serverTimeStr: string | null | undefined) => {
  if (!serverTimeStr) return;
  const serverTime = new Date(serverTimeStr).getTime();
  const localTime = Date.now();
  serverOffset = serverTime - localTime;
  console.log(`[TimeSync] Server clock synced. Offset: ${serverOffset}ms`);
};

/**
 * Returns a Date object representing the current time on the server.
 */
export const getServerNow = (): Date => {
  return new Date(Date.now() + serverOffset);
};

