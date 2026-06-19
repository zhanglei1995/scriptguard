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

async function openOptions(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/options.html`, {
    waitUntil: 'networkidle',
  })
  return page
}

test.describe('Script CRUD via Options Page', () => {
  test('options page renders with tabs', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const options = await openOptions(context, extensionId)

    await expect(options.locator('h1:has-text("ScriptGuard 设置")')).toBeVisible()
    await expect(options.locator('text=脚本管理')).toBeVisible()
    await expect(options.locator('text=运行日志')).toBeVisible()
    await expect(options.locator('text=告警设置')).toBeVisible()
    await expect(options.locator('text=通用设置')).toBeVisible()

    await options.close()
  })

  test('can switch between tabs', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const options = await openOptions(context, extensionId)

    await options.locator('button:has-text("运行日志")').click()
    await expect(options.locator('text=暂无日志').or(options.locator('text=加载中'))).toBeVisible()

    await options.locator('button:has-text("脚本管理")').click()
    await expect(options.locator('text=脚本管理功能开发中')).toBeVisible()

    await options.close()
  })

  test('logs tab shows filter controls', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const options = await openOptions(context, extensionId)

    await options.locator('button:has-text("运行日志")').click()

    await expect(options.locator('button:has-text("清除筛选")')).toBeVisible()
    await expect(options.locator('button:has-text("导出 CSV")')).toBeVisible()

    await options.close()
  })
})
