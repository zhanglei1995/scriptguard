import { filterMatchingScripts } from '../matcher';
import { CheckRule, ScriptCurrent, type CheckRule as CheckRuleType, type Script } from './schemas';

const ZUSTAND_SCRIPT_KEY = 'sg-scripts';
const LEGACY_SCRIPT_KEY = 'scripts';
const RULES_KEY = 'rules';

function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function extractScripts(raw: unknown): unknown[] {
  const parsed = parseJson(raw);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const state = obj.state as Record<string, unknown> | undefined;
    if (Array.isArray(state?.scripts)) return state.scripts;
    if (Array.isArray(obj.scripts)) return obj.scripts;
  }
  return [];
}

function normalizeScripts(raw: unknown[]): Script[] {
  return raw.flatMap((item) => {
    const candidate =
      item && typeof item === 'object'
        ? {
            name: `Script ${(item as { id?: string }).id ?? ''}`.trim(),
            version: '1.0.0',
            alertLevel: 'medium',
            description: '',
            code: '',
            matchRules: [],
            runAt: 'document_idle',
            enabled: true,
            tags: [],
            groupId: null,
            config: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...item,
          }
        : item;
    const parsed = ScriptCurrent.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function getStoredScripts(): Promise<Script[]> {
  const result = await chrome.storage.local.get([ZUSTAND_SCRIPT_KEY, LEGACY_SCRIPT_KEY]);
  const preferred = extractScripts(result[ZUSTAND_SCRIPT_KEY]);
  if (preferred.length > 0 || result[ZUSTAND_SCRIPT_KEY] !== undefined) {
    return normalizeScripts(preferred);
  }
  return normalizeScripts(extractScripts(result[LEGACY_SCRIPT_KEY]));
}

export async function setStoredScripts(scripts: Script[]): Promise<void> {
  const normalized = scripts.map((script) => ScriptCurrent.parse(script));
  await chrome.storage.local.set({
    [ZUSTAND_SCRIPT_KEY]: JSON.stringify({
      state: { scripts: normalized, filter: {} },
      version: 0,
    }),
    // Keep the legacy array key in sync for one release so older views/tests do not see stale data.
    [LEGACY_SCRIPT_KEY]: normalized,
  });
}

export async function getEnabledScripts(): Promise<Script[]> {
  const scripts = await getStoredScripts();
  return scripts.filter((script) => script.enabled);
}

export async function findMatchingScriptsForUrl(url: string): Promise<Script[]> {
  const scripts = await getEnabledScripts();
  return filterMatchingScripts(url, scripts);
}

export async function getStoredCheckRules(): Promise<CheckRuleType[]> {
  const result = await chrome.storage.local.get(RULES_KEY);
  const raw = result[RULES_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = CheckRule.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function setStoredCheckRules(rules: CheckRuleType[]): Promise<void> {
  const normalized = rules.map((rule) => CheckRule.parse(rule));
  await chrome.storage.local.set({ [RULES_KEY]: normalized });
}

export async function getCheckRulesForScript(scriptId: string): Promise<CheckRuleType[]> {
  const rules = await getStoredCheckRules();
  return rules
    .filter((rule) => rule.scriptId === scriptId && rule.enabled)
    .sort((a, b) => a.order - b.order);
}
