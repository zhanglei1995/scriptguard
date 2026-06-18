import { db } from './drizzle'
import { users, scripts, checkRules } from './schema'

async function seed() {
  console.log('Seeding database...')

  const result = await db
    .insert(users)
    .values({
      email: 'test@scriptguard.dev',
      plan: 'free',
    })
    .returning()

  const user = result[0]!
  console.log('Created user:', user.id)

  const scriptResult = await db
    .insert(scripts)
    .values({
      userId: user.id,
      name: 'Example Script',
      description: 'A sample Tampermonkey script for testing',
      version: '1.0.0',
      code: '// ==UserScript==\n// @name Example Script\n// ==/UserScript==\nconsole.log("hello")',
      matchRules: ['https://example.com/*'],
      runAt: 'document_idle',
    })
    .returning()

  const script = scriptResult[0]!
  console.log('Created script:', script.id)

  await db.insert(checkRules).values([
    {
      scriptId: script.id,
      name: 'Page title exists',
      type: 'selector_exists',
      config: { selector: 'title' },
      required: true,
      alertLevel: 'medium',
    },
    {
      scriptId: script.id,
      name: 'No console errors',
      type: 'console_clean',
      config: {},
      required: false,
      alertLevel: 'low',
    },
  ])

  console.log('Created check rules')
  console.log('Seed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
