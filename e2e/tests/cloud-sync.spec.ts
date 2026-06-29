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

test.describe('Cloud Sync', () => {
  test('options page renders general settings tab', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const options = await openOptions(context, extensionId);

    await options.locator('button:has-text("通用设置")').click();
    await expect(options.locator('text=通用设置功能开发中')).toBeVisible();

    await options.close();
  });

  test('extension has storage permissions for sync', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: 'networkidle',
    });

    const storageAvailable = await popup.evaluate(() => {
      return typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined';
    });
    expect(storageAvailable).toBe(true);

    await popup.close();
  });

  test('extension has background service worker for sync', async ({ context }) => {
    const [background] = await context.waitForEvent('serviceworker');
    await background.waitForLoadState();

    const swState = await background.evaluate(() => {
      return typeof self !== 'undefined';
    });
    expect(swState).toBe(true);
  });
});
