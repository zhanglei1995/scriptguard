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

async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
    waitUntil: 'networkidle',
  });
  return popup;
}

test.describe('Health Check Flow', () => {
  test('popup shows test button', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const testButton = popup.locator('button:has-text("测试")').first();
    await expect(testButton).toBeVisible();

    await popup.close();
  });

  test('test button is disabled when no scripts matched', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const testButton = popup.locator('button:has-text("立即测试")').first();
    const isDisabled = await testButton.isDisabled();
    expect(isDisabled).toBe(true);

    await popup.close();
  });

  test('options page has alerts settings tab', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`, {
      waitUntil: 'networkidle',
    });

    await options.locator('button:has-text("告警设置")').click();
    await expect(options.locator('text=告警设置功能开发中')).toBeVisible();

    await options.close();
  });

  test('service worker background script is active', async ({ context }) => {
    const [background] = await context.waitForEvent('serviceworker');
    await background.waitForLoadState();
    expect(background.url()).toContain('chrome-extension://');
  });
});
