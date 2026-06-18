#!/bin/bash
set -euo pipefail

# ScriptGuard - Chrome Web Store 打包脚本
# 用法: ./chrome-store/submit.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
EXTENSION_DIR="$ROOT_DIR/apps/extension"
BUILD_DIR="$EXTENSION_DIR/build/chrome-mv3-prod"
OUTPUT_DIR="$SCRIPT_DIR/dist"

echo "🔧 ScriptGuard - Chrome Web Store 打包"
echo "========================================"

# 1. 构建生产版本
echo ""
echo "📦 正在构建扩展生产版本..."
cd "$ROOT_DIR"
pnpm --filter @scriptguard/extension build:prod

# 2. 验证构建产物
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ 错误: 构建目录不存在: $BUILD_DIR"
    echo "   请检查构建日志"
    exit 1
fi

echo "✅ 构建完成: $BUILD_DIR"

# 3. 创建打包目录
mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_FILE="$OUTPUT_DIR/scriptguard-chrome-${TIMESTAMP}.zip"

# 4. 创建 zip 文件
echo ""
echo "📋 正在创建 ZIP 包..."
cd "$BUILD_DIR"
zip -r "$ZIP_FILE" . -x "*.map"
cd "$ROOT_DIR"

echo "✅ ZIP 包已创建: $ZIP_FILE"
echo "   文件大小: $(du -h "$ZIP_FILE" | cut -f1)"

# 5. 显示上传指引
echo ""
echo "========================================"
echo "📤 Chrome Web Store 上传指引"
echo "========================================"
echo ""
echo "1. 访问 Chrome Web Store Developer Dashboard:"
echo "   https://chrome.google.com/webstore/devconsole"
echo ""
echo "2. 点击 'New Item' 上传以下文件:"
echo "   $ZIP_FILE"
echo ""
echo "3. 填写商品信息:"
echo "   - Store Name: ScriptGuard"
echo "   - Description: 参见 chrome-store/store-listing.md"
echo "   - Category: Productivity"
echo "   - Screenshots: 参见 chrome-store/store-listing.md 中的说明"
echo ""
echo "4. 隐私实践:"
echo "   - 参见 chrome-store/privacy-policy.md"
echo "   - 填写隐私政策 URL"
echo ""
echo "5. 提交审核"
echo ""
echo "或使用 Chrome Web Store API 自动上传:"
echo "  ZIP 文件: $ZIP_FILE"
echo "  API 文档: https://developer.chrome.com/docs/webstore/api"
echo ""
echo "✨ 完成！"
