import { test, expect } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'

async function getExtensionId(context: BrowserContext): Promise<string> {
  const [background] = await context.waitForEvent('serviceworker')
  await background.waitForLoadState()
  const url = background.url()
  const match = url.match(/^chrome-extension:\/\/([a-z]+)/i)
  if (!match) throw new Error(`Cannot parse extension id from: ${url}`)
  return match[1]
}

async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const popup = await context.newPage()
  await popup.goto(`chrome-extension://${extensionId}/popup.html`, {
    waitUntil: 'networkidle',
  })
  return popup
}

async function openOptions(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/options.html`, {
    waitUntil: 'networkidle',
  })
  return page
}

test.describe('Cross-Browser Compatibility', () => {
  test('extension loads successfully', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    expect(extensionId).toBeTruthy()
    expect(extensionId.length).toBeGreaterThan(10)
  })

  test('popup renders correctly', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const popup = await openPopup(context, extensionId)

    await expect(popup.locator('text=ScriptGuard')).toBeVisible()
    await expect(popup.locator('header')).toBeVisible()
    await expect(popup.locator('footer')).toBeVisible()

    await popup.close()
  })

  test('popup layout dimensions are correct', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const popup = await openPopup(context, extensionId)

    const box = await popup.locator('.w-\\[380px\\]').first().boundingBox()
    if (box) {
      expect(box.width).toBe(380)
    }

    await popup.close()
  })

  test('options page renders correctly', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const options = await openOptions(context, extensionId)

    await expect(options.locator('h1:has-text("ScriptGuard 设置")')).toBeVisible()
    await expect(options.locator('[role="tablist"]')).toBeVisible()

    await options.close()
  })

  test('content script can be injected via scripting API', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const [background] = await context.waitForEvent('serviceworker')
    await background.waitForLoadState()

    const page = await context.newPage()
    await page.goto('data:text/html,<html><body><p id="test-content">Test</p></body></html>')

    const result = await background.evaluate(async (extId: string) => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tabs[0]?.id) return { success: false, error: 'no tab' }
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            return document.getElementById('test-content')?.textContent
          },
        })
        return { success: true }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }, extensionId)

    expect(result.success).toBe(true)
    await page.close()
  })
})
