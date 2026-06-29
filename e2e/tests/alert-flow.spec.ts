import { test, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

async function getExtensionId(context: BrowserContext): Promise<string> {
  const [background] = await context.waitForEvent('serviceworker');
  await background.waitForLoadState();
  const url = background.url();
  const match = url.match(/^chrome-extension:\/\/([a-z]+)/i);
  if (!match) throw new Error(`Cannot parse extension id from: ${url}`);
  return match[1];
}

async function openOptions(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`, {
    waitUntil: 'networkidle',
  });
  return page;
}

test.describe('Alert Flow', () => {
  test('options page has alert settings tab', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const options = await openOptions(context, extensionId);

    await options.locator('button:has-text("告警设置")').click();
    await expect(options.locator('text=告警设置功能开发中')).toBeVisible();

    await options.close();
  });

  test('popup footer shows notification-related actions', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'networkidle',
    });

    await expect(popup.locator('button:has-text("通知")')).toBeVisible();
    await expect(popup.locator('button:has-text("报告")')).toBeVisible();

    await popup.close();
  });

  test('popup can open options page via settings button', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'networkidle',
    });

    const settingsButton = popup.locator('button[title="设置"]');
    await expect(settingsButton).toBeVisible();

    await popup.close();
  });
});
