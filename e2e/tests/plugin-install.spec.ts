import { test, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

const SERVICE_WORKER_REG = /\/background\/index\.ts$/;
const POPUP_URL = 'chrome-extension://<id>/popup.html';

async function getExtensionId(context: BrowserContext): Promise<string> {
  const [background] = await context.waitForEvent('serviceworker');
  await background.waitForLoadState();
  const url = background.url();
  const match = url.match(/^chrome-extension:\/\/([a-z]+)/i);
  if (!match) throw new Error(`Cannot parse extension id from: ${url}`);
  return match[1];
}

async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`, {
    waitUntil: 'networkidle',
  });
  return popupPage;
}

test.describe('Plugin Installation & Popup', () => {
  test('extension loads and service worker is active', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    expect(extensionId).toBeTruthy();
    expect(extensionId.length).toBeGreaterThan(0);
  });

  test('popup renders with correct title and header', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    await expect(popup.locator('text=ScriptGuard')).toBeVisible();
    await expect(popup.locator('header')).toBeVisible();

    await popup.close();
  });

  test('popup shows empty state for page with no matched scripts', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const body = await popup.locator('body').innerText();
    expect(body).toContain('当前页面');

    await popup.close();
  });

  test('popup has correct dimensions', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const viewport = popup.viewportSize();
    expect(viewport?.width).toBe(380);

    await popup.close();
  });

  test('popup action buttons are visible', async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    await expect(popup.locator('button:has-text("测试")')).toBeVisible();
    await expect(popup.locator('button:has-text("打开后台")')).toBeVisible();

    await popup.close();
  });
});
