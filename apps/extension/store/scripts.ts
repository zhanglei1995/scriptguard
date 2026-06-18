import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { z } from 'zod'
import { ScriptCurrent, type Script } from '../storage/schemas'

// ====== Chrome Storage Adapter ======
const chromeStorageAdapter: StateStorage = {
  getItem: async (name: string) => {
    const result = await chrome.storage.local.get(name)
    return result[name] as string | null
  },
  setItem: async (name: string, value: string) => {
    await chrome.storage.local.set({ [name]: value })
  },
  removeItem: async (name: string) => {
    await chrome.storage.local.remove(name)
  },
}

// ====== Filter Schema ======
export const ScriptFilter = z.object({
  tags: z.array(z.string()).optional(),
  groupId: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
})
export type ScriptFilter = z.infer<typeof ScriptFilter>

// ====== Input Schema for Create ======
export const CreateScriptInput = ScriptCurrent.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  description: true,
  code: true,
  matchRules: true,
  runAt: true,
  enabled: true,
  tags: true,
  groupId: true,
  config: true,
  alertLevel: true,
  version: true,
})
export type CreateScriptInput = z.infer<typeof CreateScriptInput>

// ====== Input Schema for Update ======
export const UpdateScriptInput = ScriptCurrent.omit({
  id: true,
  createdAt: true,
}).partial()
export type UpdateScriptInput = z.infer<typeof UpdateScriptInput>

// ====== Store State ======
export interface ScriptsState {
  scripts: Script[]
  filter: ScriptFilter
  createScript: (input: CreateScriptInput) => Script
  updateScript: (id: string, patch: UpdateScriptInput) => Script | null
  deleteScript: (id: string) => boolean
  enableScript: (id: string) => Script | null
  disableScript: (id: string) => Script | null
  getScript: (id: string) => Script | undefined
  getFilteredScripts: () => Script[]
  setFilter: (filter: ScriptFilter) => void
}

export const useScriptsStore = create<ScriptsState>()(
  persist(
    (set, get) => ({
      scripts: [],
      filter: {},

      createScript: (input) => {
        const now = Date.now()
        const script = ScriptCurrent.parse({
          id: crypto.randomUUID(),
          name: input.name,
          version: input.version ?? '1.0.0',
          alertLevel: input.alertLevel ?? 'medium',
          description: input.description ?? '',
          code: input.code ?? '',
          matchRules: input.matchRules ?? [],
          runAt: input.runAt ?? 'document_idle',
          enabled: input.enabled ?? true,
          tags: input.tags ?? [],
          groupId: input.groupId ?? null,
          config: input.config ?? {},
          createdAt: now,
          updatedAt: now,
        })
        set((state) => ({ scripts: [...state.scripts, script] }))
        return script
      },

      updateScript: (id, patch) => {
        const { scripts } = get()
        const index = scripts.findIndex((s) => s.id === id)
        if (index === -1) return null
        const updated = ScriptCurrent.parse({
          ...scripts[index],
          ...patch,
          updatedAt: Date.now(),
        })
        const newScripts = [...scripts]
        newScripts[index] = updated
        set({ scripts: newScripts })
        return updated
      },

      deleteScript: (id) => {
        const { scripts } = get()
        const index = scripts.findIndex((s) => s.id === id)
        if (index === -1) return false
        set({ scripts: scripts.filter((s) => s.id !== id) })
        return true
      },

      enableScript: (id) => {
        return get().updateScript(id, { enabled: true })
      },

      disableScript: (id) => {
        return get().updateScript(id, { enabled: false })
      },

      getScript: (id) => {
        return get().scripts.find((s) => s.id === id)
      },

      getFilteredScripts: () => {
        const { scripts, filter } = get()
        let result = [...scripts]

        if (filter.tags && filter.tags.length > 0) {
          result = result.filter((s) =>
            filter.tags!.some((tag) => s.tags.includes(tag))
          )
        }

        if (filter.groupId !== undefined) {
          result = result.filter((s) => s.groupId === filter.groupId)
        }

        if (filter.enabled !== undefined) {
          result = result.filter((s) => s.enabled === filter.enabled)
        }

        result.sort((a, b) => b.updatedAt - a.updatedAt)
        return result
      },

      setFilter: (filter) => {
        set({ filter })
      },
    }),
    {
      name: 'sg-scripts',
      storage: createJSONStorage(() => chromeStorageAdapter),
    }
  )
)
