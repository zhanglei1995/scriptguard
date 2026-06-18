# @scriptguard/server

ScriptGuard Cloud Server - Fastify 5 + TypeScript 5 + Drizzle ORM

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 开发模式（热重载）
pnpm dev

# 生产构建
pnpm build

# 启动生产服务
pnpm start

# 测试
pnpm test
```

## 📍 端点

| 路径 | 方法 | 说明 |
|---|---|---|
| `/` | GET | API 根信息 |
| `/api/v1/health` | GET | Liveness probe |
| `/api/v1/ready` | GET | Readiness probe (DB/Redis) |
| `/docs` | GET | Swagger UI |

## 🐳 Docker

```bash
# 构建镜像
docker build -f Dockerfile.server -t scriptguard-server .

# 运行
docker run -p 3000:3000 --env-file .env scriptguard-server
```

## 📁 结构

```
src/
├── config.ts              # 环境变量 + Zod 校验
├── index.ts                # 主入口
├── lib/
│   ├── logger.ts           # Pino 日志
│   └── errors.ts           # 统一错误响应
├── plugins/
│   └── error-handler.ts    # 全局错误处理
├── routes/
│   ├── api.ts              # API 根路由
│   ├── health.ts           # 健康检查
│   └── *.test.ts           # 单元测试
└── ...
```

## 🔗 相关

- [TDD §3.1.2 Fastify 服务](../TDD.md)
- [TDD §5.2 REST API](../TDD.md)
- [TDD §11.4 Docker 部署](../TDD.md)
