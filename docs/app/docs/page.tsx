import { source } from '@/lib/source'
import { DocsPage, DocsBody } from 'fumadocs-ui/page'
import defaultMdxComponents from 'fumadocs-ui/mdx'

export default function Page() {
  return (
    <DocsPage>
      <DocsBody>
        <h1>ScriptGuard 文档</h1>
        <p className="text-lg text-muted-foreground">
          欢迎来到 ScriptGuard 文档。在这里你可以找到安装指南、架构说明、API 参考和 SDK 使用教程。
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a href="/docs/getting-started" className="block rounded-lg border p-4 hover:bg-muted">
            <h3 className="font-semibold">快速开始</h3>
            <p className="text-sm text-muted-foreground">安装、配置和创建第一个脚本</p>
          </a>
          <a href="/docs/architecture" className="block rounded-lg border p-4 hover:bg-muted">
            <h3 className="font-semibold">系统架构</h3>
            <p className="text-sm text-muted-foreground">系统整体架构概览</p>
          </a>
          <a href="/docs/api-reference" className="block rounded-lg border p-4 hover:bg-muted">
            <h3 className="font-semibold">API 参考</h3>
            <p className="text-sm text-muted-foreground">REST API 接口文档</p>
          </a>
          <a href="/docs/sdk-guide" className="block rounded-lg border p-4 hover:bg-muted">
            <h3 className="font-semibold">SDK 指南</h3>
            <p className="text-sm text-muted-foreground">用户脚本 SDK 使用教程</p>
          </a>
          <a href="/docs/self-hosting" className="block rounded-lg border p-4 hover:bg-muted">
            <h3 className="font-semibold">自托管部署</h3>
            <p className="text-sm text-muted-foreground">Docker 部署指南</p>
          </a>
        </div>
      </DocsBody>
    </DocsPage>
  )
}
