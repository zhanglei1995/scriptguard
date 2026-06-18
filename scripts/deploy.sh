#!/bin/bash
set -euo pipefail

# ScriptGuard - 生产部署脚本
# 用法: ./scripts/deploy.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/.env"

echo "🚀 ScriptGuard - 生产部署"
echo "=========================="

# 1. 检查 .env 文件
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "   请复制 .env.example 并配置:"
    echo "   cp .env.example .env"
    exit 1
fi

# 2. 检查 Docker
if ! command -v docker &>/dev/null; then
    echo "❌ 错误: Docker 未安装"
    exit 1
fi

if ! docker compose version &>/dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    exit 1
fi

# 3. 构建镜像
echo ""
echo "📦 正在构建 Docker 镜像..."
docker compose -f "$COMPOSE_FILE" build

# 4. 启动服务
echo ""
echo "🔄 正在启动服务..."
docker compose -f "$COMPOSE_FILE" up -d

# 5. 等待健康检查
echo ""
echo "⏳ 等待服务就绪..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
        echo "✅ 服务已就绪"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   等待中... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "⚠️  警告: 健康检查超时，请手动检查服务状态"
    docker compose -f "$COMPOSE_FILE" logs server --tail=20
    exit 1
fi

# 6. 显示状态
echo ""
echo "📊 服务状态:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "🔗 访问地址:"
echo "   API:     http://localhost:3000"
echo "   Docs:    http://localhost:3000/docs"
echo "   Health:  http://localhost:3000/health"
echo ""
echo "✨ 部署完成！"
