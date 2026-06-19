import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold">ScriptGuard</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        用户脚本健康监控与管理平台
      </p>
      <Link
        href="/docs"
        className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
      >
        阅读文档
      </Link>
    </main>
  )
}
