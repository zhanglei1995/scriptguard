# 贡献指南

感谢你对 ScriptGuard 的关注！我们欢迎任何形式的贡献。

## 📋 行为准则

- 🤝 尊重他人
- 💬 建设性反馈
- 🎯 聚焦问题本身
- 🚀 拥抱开源精神

---

## 🐛 报告 Bug

请使用 [Bug 报告模板](https://github.com/zhanglei1995/scriptguard/issues/new?template=bug.md) 提交 issue。

请包含：

- 复现步骤
- 预期行为
- 实际行为
- 截图/日志（如有）
- 环境信息（浏览器版本、操作系统、插件版本）

---

## 💡 功能建议

使用 [Feature Request 模板](https://github.com/zhanglei1995/scriptguard/issues/new?template=feature.md) 提交。

---

## 🔧 提交 PR

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/scriptguard.git
cd scriptguard
pnpm install
```

### 2. 创建分支

```bash
git checkout -b feat/your-feature
# 或
git checkout -b fix/your-bug
```

### 3. 开发

```bash
# 启动 dev 模式
pnpm dev

# 在修改的包下运行测试
pnpm --filter @scriptguard/<package> test

# 全量检查
pnpm lint
pnpm typecheck
pnpm test
```

### 4. Commit

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git commit -m "feat(extension): add selector helper"
git commit -m "fix(server): resolve race condition"
git commit -m "docs: update README"
```

类型：

- `feat` 新功能
- `fix` 缺陷修复
- `docs` 仅文档
- `style` 格式（不影响代码）
- `refactor` 重构
- `test` 测试
- `chore` 构建/工具

### 5. Push & PR

```bash
git push origin feat/your-feature
```

在 GitHub 上创建 PR。确保：

- [ ] 所有测试通过
- [ ] 代码符合 ESLint + Prettier 规范
- [ ] 提交了对应的 issue 编号（如 `Closes #123`）
- [ ] 更新了相关文档

### 6. Code Review

- 至少 1 个 reviewer 通过
- CI 全部绿
- 通过所有 AC

---

## 📁 目录约定

- `apps/<name>/` — 可独立部署的应用
- `packages/<name>/` — 可被多个 app 引用的库
- `packages/shared/` — 共享类型、Zod schema、队列/消息契约（前后端与 Runner 通用）
- `packages/db/` — Drizzle schema 与数据库工具
- `packages/sdk/` — 嵌入用户脚本的 SDK（规划中 / 占位）
- `packages/ui/` — 共享 UI 组件（规划中 / 占位）

---

## 🧪 测试

```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e

# 包含 E2E 在内的所有 test 任务
pnpm test:all

# 覆盖率
pnpm --filter <package> test:coverage
```

**覆盖率要求**：核心逻辑 ≥ 80%

---

## 🎨 代码规范

- TypeScript strict 模式
- ESLint + Prettier（`pnpm format` 自动修复）
- 命名约定：
  - 文件：`kebab-case.ts`
  - 类/组件：`PascalCase`
  - 函数/变量：`camelCase`
  - 常量：`UPPER_SNAKE_CASE`
  - 类型/接口：`PascalCase`

---

## 📜 许可证

提交 PR 即表示你同意以 **MIT 协议** 发布你的贡献。

---

## 📮 联系方式

- GitHub Issues: 主要沟通渠道
- Discussions: 一般问题
- Email: maintainers@scriptguard.dev (待定)

感谢你的贡献！🎉
