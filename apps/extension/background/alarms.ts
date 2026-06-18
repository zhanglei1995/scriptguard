/**
 * chrome.alarms 封装
 * SW 休眠后用 alarms 唤醒，不要用 setTimeout
 */

export async function createCheckAlarm(scriptId: string, intervalSeconds: number) {
  await chrome.alarms.create(`check:${scriptId}`, {
    delayInMinutes: intervalSeconds / 60,
    periodInMinutes: intervalSeconds / 60,
  })
}

export async function clearCheckAlarm(scriptId: string) {
  await chrome.alarms.clear(`check:${scriptId}`)
}

export async function clearAllCheckAlarms() {
  const alarms = await chrome.alarms.getAll()
  for (const alarm of alarms) {
    if (alarm.name.startsWith('check:')) {
      await chrome.alarms.clear(alarm.name)
    }
  }
}

export function parseAlarmScriptId(alarmName: string): string | null {
  if (alarmName.startsWith('check:')) {
    return alarmName.slice(6)
  }
  return null
}
