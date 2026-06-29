/**
 * SyncManager - 双向增量同步
 * SG-031: 同步协议（增量同步 + 冲突解决）
 */

import { scriptsStore, rulesStore, syncMetaStore } from '../storage/chrome';
import type { Script, CheckRule as CheckRuleType } from '../storage/schemas';

export interface Conflict {
  entity: 'script' | 'rule';
  id: string;
  local: unknown;
  server: unknown;
}

export interface SyncResponse {
  serverVersion: number;
  syncedAt: number;
  changes: {
    scripts: Script[];
    rules: CheckRuleType[];
    deletedScriptIds: string[];
  };
  conflicts: Conflict[];
}

export class SyncManager {
  private baseUrl: string;
  private syncInProgress = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Push local changes to server
   */
  async push(): Promise<SyncResponse> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    try {
      const token = await this.getAuthToken();
      const syncMeta = await syncMetaStore.get();
      const scripts = (await scriptsStore.get()) ?? [];
      const rules = (await rulesStore.get()) ?? [];

      const body = {
        clientVersion: syncMeta?.lastSyncVersion ? parseInt(syncMeta.lastSyncVersion) : 0,
        lastSyncAt: syncMeta?.lastSyncAt ?? 0,
        changes: {
          scripts: scripts.map((s) => ({
            ...s,
            createdAt: new Date(s.createdAt).toISOString(),
            updatedAt: new Date(s.updatedAt).toISOString(),
          })),
          rules,
          deletedScriptIds: [],
        },
      };

      const response = await fetch(`${this.baseUrl}/v1/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Sync push failed: ${response.status}`);
      }

      const data: SyncResponse = await response.json();

      // Update sync meta
      await syncMetaStore.set({
        lastSyncAt: data.syncedAt,
        lastSyncVersion: data.serverVersion.toString(),
      });

      // Resolve conflicts with last-write-wins
      if (data.conflicts.length > 0) {
        await this.resolveConflicts(data.conflicts);
      }

      return data;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Pull changes from server since lastSyncAt
   */
  async pull(lastSyncAt: number): Promise<SyncResponse> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    try {
      const token = await this.getAuthToken();
      const syncMeta = await syncMetaStore.get();

      const body = {
        clientVersion: syncMeta?.lastSyncVersion ? parseInt(syncMeta.lastSyncVersion) : 0,
        lastSyncAt,
        changes: {},
      };

      const response = await fetch(`${this.baseUrl}/v1/sync/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Sync pull failed: ${response.status}`);
      }

      const data: SyncResponse = await response.json();

      // Apply changes to local storage
      await this.applyServerChanges(data);

      // Update sync meta
      await syncMetaStore.set({
        lastSyncAt: data.syncedAt,
        lastSyncVersion: data.serverVersion.toString(),
      });

      return data;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Resolve conflicts with last-write-wins strategy
   */
  async resolveConflicts(conflicts: Conflict[]): Promise<void> {
    for (const conflict of conflicts) {
      await this.resolveConflict(conflict, 'server');
    }
  }

  /**
   * Resolve a single conflict
   */
  async resolveConflict(
    conflict: Conflict,
    resolution: 'local' | 'server' | 'merge',
  ): Promise<void> {
    if (conflict.entity === 'script') {
      const scripts = (await scriptsStore.get()) ?? [];
      const localScript = scripts.find((s) => s.id === conflict.id);
      const serverScript = conflict.server as Script;

      if (resolution === 'server' && serverScript) {
        // Keep server version
        const updated = scripts.map((s) =>
          s.id === conflict.id ? { ...serverScript, updatedAt: Date.now() } : s,
        );
        await scriptsStore.set(updated);
      } else if (resolution === 'local' && localScript) {
        // Keep local version — no change needed, it's already there
        // Just update timestamp to trigger server sync
        const updated = scripts.map((s) =>
          s.id === conflict.id ? { ...s, updatedAt: Date.now() } : s,
        );
        await scriptsStore.set(updated);
      } else if (resolution === 'merge') {
        // Simple merge: take non-null fields from server, keep local for conflicts
        if (localScript && serverScript) {
          const merged = {
            ...serverScript,
            ...localScript,
            updatedAt: Date.now(),
          };
          const updated = scripts.map((s) => (s.id === conflict.id ? merged : s));
          await scriptsStore.set(updated);
        }
      }
    } else if (conflict.entity === 'rule') {
      const rules = (await rulesStore.get()) ?? [];
      const serverRule = conflict.server as CheckRuleType;

      if (resolution === 'server' && serverRule) {
        const updated = rules.map((r) => (r.id === conflict.id ? serverRule : r));
        await rulesStore.set(updated);
      }
      // For local/merge, keep existing rule
    }
  }

  /**
   * Apply server changes to local storage
   */
  private async applyServerChanges(data: SyncResponse): Promise<void> {
    const { changes } = data;

    // Apply script changes
    if (changes.scripts.length > 0) {
      const localScripts = (await scriptsStore.get()) ?? [];

      for (const serverScript of changes.scripts) {
        const existingIndex = localScripts.findIndex((s) => s.id === serverScript.id);
        if (existingIndex >= 0) {
          // Update existing — server wins
          localScripts[existingIndex] = {
            ...localScripts[existingIndex],
            ...serverScript,
            createdAt: new Date(serverScript.createdAt).getTime(),
            updatedAt: new Date(serverScript.updatedAt).getTime(),
          };
        } else {
          // Add new script
          localScripts.push({
            ...serverScript,
            createdAt: new Date(serverScript.createdAt).getTime(),
            updatedAt: new Date(serverScript.updatedAt).getTime(),
          } as Script);
        }
      }

      await scriptsStore.set(localScripts);
    }

    // Apply rule changes
    if (changes.rules.length > 0) {
      const localRules = (await rulesStore.get()) ?? [];

      for (const serverRule of changes.rules) {
        const existingIndex = localRules.findIndex((r) => r.id === serverRule.id);
        if (existingIndex >= 0) {
          localRules[existingIndex] = serverRule;
        } else {
          localRules.push(serverRule);
        }
      }

      await rulesStore.set(localRules);
    }

    // Apply deletions
    if (changes.deletedScriptIds.length > 0) {
      const localScripts = (await scriptsStore.get()) ?? [];
      const filtered = localScripts.filter((s) => !changes.deletedScriptIds.includes(s.id));
      await scriptsStore.set(filtered);
    }
  }

  /**
   * Full bidirectional sync
   */
  async sync(): Promise<SyncResponse> {
    const syncMeta = await syncMetaStore.get();
    const lastSyncAt = syncMeta?.lastSyncAt ?? 0;

    // Pull first to get server changes
    const pullResult = await this.pull(lastSyncAt);

    // Then push local changes
    const pushResult = await this.push();

    // Return the more recent result
    return pushResult.syncedAt >= pullResult.syncedAt ? pushResult : pullResult;
  }

  private async getAuthToken(): Promise<string> {
    const result = await chrome.storage.local.get('authToken');
    return result.authToken ?? '';
  }
}
