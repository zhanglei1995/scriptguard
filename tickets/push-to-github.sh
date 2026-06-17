#!/usr/bin/env bash
# push-to-github.sh
# 使用 GitHub CLI 批量创建 Issue。运行前请确保：
#   1. gh auth login 已完成
#   2. 当前目录是 ScriptGuard repo（GitHub remote 已配置）
#   3. 已有创建 issues / labels / milestones 的权限

set -euo pipefail

echo "→ 创建 labels..."
gh label create "area:plugin" --color "1d76db" --description "浏览器插件相关" 2>/dev/null || true
gh label create "area:popup" --color "1d76db" --description "Popup 页面" 2>/dev/null || true
gh label create "area:options" --color "1d76db" --description "Options 后台" 2>/dev/null || true
gh label create "area:overlay" --color "1d76db" --description "页面内浮层" 2>/dev/null || true
gh label create "area:server" --color "5319e7" --description "云端服务" 2>/dev/null || true
gh label create "area:runner" --color "5319e7" --description "Playwright Runner" 2>/dev/null || true
gh label create "area:db" --color "5319e7" --description "数据库" 2>/dev/null || true
gh label create "area:notify" --color "fbca04" --description "通知系统" 2>/dev/null || true
gh label create "area:infra" --color "0e8a16" --description "基础设施" 2>/dev/null || true
gh label create "area:design" --color "e99695" --description "设计" 2>/dev/null || true
gh label create "type:feature" --color "a2eeef" --description "新功能" 2>/dev/null || true
gh label create "type:bug" --color "d73a4a" --description "缺陷" 2>/dev/null || true
gh label create "type:chore" --color "cfd3d7" --description "杂项/重构" 2>/dev/null || true
gh label create "type:docs" --color "0075ca" --description "文档" 2>/dev/null || true
gh label create "type:test" --color "bfd4f2" --description "测试" 2>/dev/null || true
gh label create "type:spike" --color "d4c5f9" --description "调研" 2>/dev/null || true
gh label create "prio:P0" --color "b60205" --description "P0 - 必须" 2>/dev/null || true
gh label create "prio:P1" --color "d93f0b" --description "P1 - 强烈建议" 2>/dev/null || true
gh label create "prio:P2" --color "fbca04" --description "P2 - 可选" 2>/dev/null || true
gh label create "m:foundation" --color "7057ff" --description "Milestone: Foundation" 2>/dev/null || true
gh label create "m:alpha" --color "008672" --description "Milestone: Alpha" 2>/dev/null || true
gh label create "m:beta" --color "008672" --description "Milestone: Beta" 2>/dev/null || true
gh label create "m:ga" --color "008672" --description "Milestone: GA" 2>/dev/null || true

echo "→ 创建 milestones..."
gh api repos/:owner/:repo/milestones -f title="Foundation (Sprint 1)" -f due_on="2026-07-01T00:00:00Z" -f description="基础设施与脚手架" 2>/dev/null || true
gh api repos/:owner/:repo/milestones -f title="Alpha (Sprint 2-3)" -f due_on="2026-08-15T00:00:00Z" -f description="MVP Alpha 版本" 2>/dev/null || true
gh api repos/:owner/:repo/milestones -f title="Beta (Sprint 4-7)" -f due_on="2026-10-15T00:00:00Z" -f description="MVP Beta 版本" 2>/dev/null || true
gh api repos/:owner/:repo/milestones -f title="GA v1.0 (Sprint 8-9)" -f due_on="2026-11-30T00:00:00Z" -f description="v1.0 GA 正式发布" 2>/dev/null || true

echo "→ 批量创建 issues..."
for f in tickets/SG-*.md; do
  id=$(basename "$f" .md)
  title=$(awk '/^title: /{gsub(/^title: *"|"$/,""); print; exit}' "$f")
  labels=$(awk '/^labels: \[/,/\]/' "$f" | grep -oE '"[^"]+"' | tr -d '"' | paste -sd "," -)
  echo "  + $id : $title"
  gh issue create \
    --title "[$id] $title" \
    --body-file "$f" \
    --label "$labels" || echo "  ! $id 创建失败"
  sleep 0.5  # 避免触发 GitHub API 速率限制
done

echo ""
echo "✅ 全部 issue 创建完成"
echo "查看: gh issue list --label prio:P0"
