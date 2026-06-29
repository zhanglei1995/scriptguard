import { preferencesStore } from '../storage/chrome';

const ICON_URL = 'assets/icon.png';

export class Notifier {
  async notifyFailure(scriptName: string, reason: string, scriptId: string): Promise<void> {
    if (!(await this.isEnabled())) return;

    await chrome.notifications.create(`failure:${scriptId}`, {
      type: 'basic',
      iconUrl: ICON_URL,
      title: `脚本检查失败: ${scriptName}`,
      message: reason,
      priority: 2,
    });
  }

  async notifyRecovered(scriptName: string, scriptId: string): Promise<void> {
    if (!(await this.isEnabled())) return;

    await chrome.notifications.create(`recovered:${scriptId}`, {
      type: 'basic',
      iconUrl: ICON_URL,
      title: `脚本已恢复: ${scriptName}`,
      message: '之前检测到的问题已解决。',
      priority: 1,
    });
  }

  private async isEnabled(): Promise<boolean> {
    try {
      const prefs = await preferencesStore.get();
      return prefs?.notificationsEnabled ?? true;
    } catch {
      return true;
    }
  }
}

export const notifier = new Notifier();
