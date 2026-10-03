import { Response } from 'express';

/**
 * In-memory map of userId → active SSE response objects.
 * Each user can have multiple open tabs/connections.
 */
const clients = new Map<string, Set<Response>>();

/**
 * Register a new SSE client for a given user.
 */
export const addSseClient = (userId: string, res: Response): void => {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(res);
  console.log(`📡 [SSE] Client connected. userId=${userId} | active connections=${clients.get(userId)!.size}`);
};

/**
 * Remove an SSE client (e.g. when connection closes).
 */
export const removeSseClient = (userId: string, res: Response): void => {
  const userClients = clients.get(userId);
  if (!userClients) return;
  userClients.delete(res);
  if (userClients.size === 0) clients.delete(userId);
  console.log(`📡 [SSE] Client disconnected. userId=${userId}`);
};

/**
 * Push a named SSE event to all open connections for a user.
 */
export const pushToUser = (userId: string, event: string, data: unknown): void => {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const res of userClients) {
    try {
      res.write(payload);
    } catch {
      // Connection broken — clean up silently
      userClients.delete(res);
    }
  }
};

/**
 * Return total number of active SSE connections (useful for admin/debug).
 */
export const getActiveSseCount = (): number => {
  let total = 0;
  for (const set of clients.values()) total += set.size;
  return total;
};
