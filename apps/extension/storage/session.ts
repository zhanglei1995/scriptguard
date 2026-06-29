import { z } from 'zod';

// ====== Session Schema ======
const PageCheckState = z.object({
  url: z.string(),
  scriptId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  startedAt: z.number(),
});
type PageCheckState = z.infer<typeof PageCheckState>;

const CommunicationToken = z.object({
  token: z.string(),
  createdAt: z.number(),
  expiresAt: z.number(),
});
type CommunicationToken = z.infer<typeof CommunicationToken>;

const TabCheckStatus = z.object({
  tabId: z.number(),
  isChecking: z.boolean(),
  scriptIds: z.array(z.string()),
  startedAt: z.number().optional(),
});
type TabCheckStatus = z.infer<typeof TabCheckStatus>;

// ====== Session Storage Wrapper ======
class ChromeSessionStorage {
  private get storage() {
    return chrome.storage.session;
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.storage) return undefined;
    const result = await this.storage.get(key);
    return result[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.storage) return;
    await this.storage.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    if (!this.storage) return;
    await this.storage.remove(key);
  }
}

const session = new ChromeSessionStorage();

// ====== Page Check State ======
export async function setPageCheckState(
  tabId: number,
  state: Omit<PageCheckState, 'tabId'>,
): Promise<void> {
  await session.set(`pageCheck:${tabId}`, state);
}

export async function getPageCheckState(tabId: number): Promise<PageCheckState | undefined> {
  return session.get<PageCheckState>(`pageCheck:${tabId}`);
}

export async function clearPageCheckState(tabId: number): Promise<void> {
  await session.remove(`pageCheck:${tabId}`);
}

// ====== Communication Tokens ======
export async function setCommToken(
  tabId: number,
  token: string,
  ttlMs: number = 60000,
): Promise<void> {
  const now = Date.now();
  const commToken: CommunicationToken = {
    token,
    createdAt: now,
    expiresAt: now + ttlMs,
  };
  await session.set(`commToken:${tabId}`, commToken);
}

export async function getCommToken(tabId: number): Promise<string | null> {
  const commToken = await session.get<CommunicationToken>(`commToken:${tabId}`);
  if (!commToken) return null;
  if (Date.now() > commToken.expiresAt) {
    await session.remove(`commToken:${tabId}`);
    return null;
  }
  return commToken.token;
}

export async function clearCommToken(tabId: number): Promise<void> {
  await session.remove(`commToken:${tabId}`);
}

// ====== Tab Check Status ======
export async function setTabCheckStatus(status: TabCheckStatus): Promise<void> {
  await session.set(`tabCheck:${status.tabId}`, status);
}

export async function getTabCheckStatus(tabId: number): Promise<TabCheckStatus | undefined> {
  return session.get<TabCheckStatus>(`tabCheck:${tabId}`);
}

export async function clearTabCheckStatus(tabId: number): Promise<void> {
  await session.remove(`tabCheck:${tabId}`);
}

// ====== Cleanup for tab ======
export async function cleanupSessionForTab(tabId: number): Promise<void> {
  await Promise.all([
    clearPageCheckState(tabId),
    clearCommToken(tabId),
    clearTabCheckStatus(tabId),
  ]);
}
