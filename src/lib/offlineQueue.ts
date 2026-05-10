import { captureFrontendException, captureFrontendMessage } from './monitoring';

const STORAGE_KEY = 'anqor-offline-queue';
const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 15000;

type OfflineActionType = 'predictClaim' | 'createBatch';

interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: unknown;
  createdAt: string;
  attempts: number;
}

function readQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineAction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getOfflineQueue() {
  return readQueue();
}

export function enqueueOfflineAction(type: OfflineActionType, payload: unknown) {
  const queue = readQueue();
  const action: OfflineAction = {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  queue.push(action);
  writeQueue(queue);
  captureFrontendMessage('Queued offline action', { type, queueSize: queue.length });
  return action;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function flushOfflineQueue(executors: Record<OfflineActionType, (payload: unknown) => Promise<unknown>>) {
  const queue = readQueue();
  if (queue.length === 0) return [];

  const remaining: OfflineAction[] = [];
  const completed: OfflineAction[] = [];

  for (const action of queue) {
    try {
      await executors[action.type](action.payload);
      completed.push(action);
    } catch (error) {
      action.attempts += 1;
      remaining.push(action);
      captureFrontendException(error, { offlineActionType: action.type, attempts: action.attempts });
      const backoff = Math.min(RETRY_BASE_MS * 2 ** Math.min(action.attempts, 4), RETRY_MAX_MS);
      await delay(backoff);
    }
  }

  writeQueue(remaining);
  return completed;
}
