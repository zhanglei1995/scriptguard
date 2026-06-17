#!/usr/bin/env bash
# =============================================================================
# ScriptGuard · GitHub Project 自动化设置
# =============================================================================
# 用法: ./setup-github-project.sh <github-owner> <repo-name> [options]
#
# 阶段:
#   1. 准备 (验证 gh, jq, 认证)
#   2. 创建 Project
#   3. 创建 9 个自定义字段
#   4. 创建 55 个 Issues
#   5. 添加 Issues 到 Project
#   6. 设置字段值 (Status/Priority/Epic/Sprint/Type/Owner/Estimate)
#   7. 创建 Views 指引
#   8. 设置 Workflows 指引
#
# 选项:
#   --reset         删除已有 Project 并重建
#   --skip-issues   跳过创建 issues (假设已存在)
#   --skip-fields   跳过设置字段值
#   --phase N       只执行第 N 阶段
#   --dry-run       只显示要做什么，不实际执行
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$SCRIPT_DIR/config.json"
TICKETS_DIR="$SCRIPT_DIR/../tickets"
LIB_DIR="$SCRIPT_DIR/lib"
CACHE_DIR="$SCRIPT_DIR/.cache"

# ---------- 颜色 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${BLUE}ℹ${NC}  $*"; }
success() { echo -e "${GREEN}✓${NC}  $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✗${NC}  $*"; }
phase()   { echo -e "\n${CYAN}═══ $* ═══${NC}"; }

# 加载库
source "$LIB_DIR/set-field-value.sh"

# ---------- 参数 ----------
OWNER=""
REPO=""
RESET=false
SKIP_ISSUES=false
SKIP_FIELDS=false
ONLY_PHASE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reset)        RESET=true; shift ;;
    --skip-issues)  SKIP_ISSUES=true; shift ;;
    --skip-fields)  SKIP_FIELDS=true; shift ;;
    --phase)        ONLY_PHASE="$2"; shift 2 ;;
    --dry-run)      DRY_RUN=true; shift ;;
    --help|-h)
      sed -n '2,30p' "$0"
      exit 0 ;;
    *) OWNER="$1"; REPO="$2"; shift 2 ;;
  esac
done

if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  error "缺少参数"
  echo "用法: $0 <github-owner> <repo-name> [--reset] [--phase N] [--dry-run]"
  exit 1
fi

# 创建缓存目录
mkdir -p "$CACHE_DIR"

should_run() {
  [ -z "$ONLY_PHASE" ] || [ "$ONLY_PHASE" = "$1" ]
}

# ============================================================================
# 阶段 0: 准备
# ============================================================================
phase "阶段 0: 准备"

if ! command -v gh &> /dev/null; then
  error "gh CLI 未安装: https://cli.github.com"
  exit 1
fi
success "gh CLI: $(gh --version | head -1)"

if ! command -v jq &> /dev/null; then
  error "jq 未安装: brew install jq"
  exit 1
fi
success "jq: $(jq --version)"

if ! gh auth status &> /dev/null; then
  error "gh 未认证: gh auth login"
  exit 1
fi
GH_USER=$(gh api user --jq '.login')
success "认证: $GH_USER"

if ! gh repo view "$OWNER/$REPO" &> /dev/null; then
  error "仓库不存在: $OWNER/$REPO"
  exit 1
fi
success "仓库: $OWNER/$REPO"

TICKET_COUNT=$(ls "$TICKETS_DIR"/SG-*.md 2>/dev/null | wc -l | tr -d ' ')
success "Tickets: $TICKET_COUNT"

PROJECT_TITLE=$(jq -r '.project.title' "$CONFIG")
PROJECT_DESC=$(jq -r '.project.description' "$CONFIG")

# ============================================================================
# 阶段 1: 创建 Project
# ============================================================================
phase "阶段 1: 创建 Project"
if should_run 1; then
  EXISTING_NUM=$(gh project list --owner "$OWNER" --format json 2>/dev/null | \
    jq -r --arg t "$PROJECT_TITLE" '.projects[]? | select(.title == $t) | .number' | head -1)
  
  if [ -n "$EXISTING_NUM" ] && [ "$RESET" = true ]; then
    warn "删除 Project #$EXISTING_NUM"
    gh project delete "$EXISTING_NUM" --owner "$OWNER" 2>&1 | tail -1
    EXISTING_NUM=""
  fi
  
  if [ -z "$EXISTING_NUM" ]; then
    if [ "$DRY_RUN" = true ]; then
      PROJECT_NUM="<new>"
      info "[DRY-RUN] gh project create --owner $OWNER --title \"$PROJECT_TITLE\""
    else
      CREATE_OUT=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" \
        --description "$PROJECT_DESC" --format json 2>&1) || {
        error "Project 创建失败: $CREATE_OUT"
        exit 1
      }
      PROJECT_NUM=$(echo "$CREATE_OUT" | jq -r '.number')
      success "创建: #$PROJECT_NUM"
    fi
  else
    PROJECT_NUM="$EXISTING_NUM"
    info "复用: #$PROJECT_NUM"
  fi
  
  if [ "$DRY_RUN" = false ] && [ "$PROJECT_NUM" != "<new>" ]; then
    PROJECT_ID=$(gh project view "$PROJECT_NUM" --owner "$OWNER" --format json | jq -r '.id')
    echo "$PROJECT_NUM" > "$CACHE_DIR/project-number"
    echo "$PROJECT_ID" > "$CACHE_DIR/project-id"
    success "Project ID: $PROJECT_ID"
  fi
fi
PROJECT_NUM=$(cat "$CACHE_DIR/project-number" 2>/dev/null || echo "")
PROJECT_ID=$(cat "$CACHE_DIR/project-id" 2>/dev/null || echo "")
[ -n "$PROJECT_NUM" ] && info "当前 Project: #$PROJECT_NUM"

# ============================================================================
# 阶段 2: 创建自定义字段
# ============================================================================
phase "阶段 2: 创建 9 个自定义字段"
if should_run 2; then
  if [ "$DRY_RUN" = true ]; then
    jq -r '.fields[] | "  · \(.name) (\(.type))"' "$CONFIG"
  else
    FIELD_IDS_FILE="$CACHE_DIR/field-ids.tsv"
    > "$FIELD_IDS_FILE"
    
    for field_name in $(jq -r '.fields[].name' "$CONFIG"); do
      field_type=$(jq -r --arg n "$field_name" '.fields[] | select(.name == $n) | .type' "$CONFIG")
      
      # 检查是否已存在
      existing_id=$(gh project field-list "$PROJECT_NUM" --owner "$OWNER" --format json 2>/dev/null | \
        jq -r --arg n "$field_name" '.[] | select(.name == $n) | .id')
      
      if [ -n "$existing_id" ]; then
        success "已存在: $field_name → $existing_id"
        echo -e "$field_name\t$existing_id\t$field_type" >> "$FIELD_IDS_FILE"
        continue
      fi
      
      info "创建: $field_name ($field_type)"
      
      if [ "$field_type" = "single_select" ]; then
        OPTIONS_JSON=$(jq -c --arg n "$field_name" \
          '[.fields[] | select(.name == $n) | .options[] | {name: .name, color: .color}]' "$CONFIG")
        
        MUTATION=$(cat <<GQL
mutation {
  createProjectV2Field(input: {
    projectId: "$PROJECT_ID"
    dataType: SINGLE_SELECT
    name: "$field_name"
    options: $OPTIONS_JSON
  }) {
    projectV2Field { id name }
  }
}
GQL
)
        field_id=$(gh api graphql -f query="$MUTATION" --jq '.data.createProjectV2Field.projectV2Field.id // empty' 2>/dev/null)
        if [ -n "$field_id" ]; then
          success "  → $field_id"
          echo -e "$field_name\t$field_id\t$field_type" >> "$FIELD_IDS_FILE"
        else
          warn "  创建失败"
        fi
      elif [ "$field_type" = "number" ]; then
        MUTATION="mutation { createProjectV2Field(input: { projectId: \"$PROJECT_ID\", dataType: NUMBER, name: \"$field_name\" }) { projectV2Field { id name } } }"
        field_id=$(gh api graphql -f query="$MUTATION" --jq '.data.createProjectV2Field.projectV2Field.id // empty' 2>/dev/null)
        [ -n "$field_id" ] && success "  → $field_id" || warn "  创建失败"
        echo -e "$field_name\t$field_id\t$field_type" >> "$FIELD_IDS_FILE"
      elif [ "$field_type" = "date" ]; then
        MUTATION="mutation { createProjectV2Field(input: { projectId: \"$PROJECT_ID\", dataType: DATE, name: \"$field_name\" }) { projectV2Field { id name } } }"
        field_id=$(gh api graphql -f query="$MUTATION" --jq '.data.createProjectV2Field.projectV2Field.id // empty' 2>/dev/null)
        [ -n "$field_id" ] && success "  → $field_id" || warn "  创建失败"
        echo -e "$field_name\t$field_id\t$field_type" >> "$FIELD_IDS_FILE"
      fi
      sleep 0.3
    done
  fi
fi

# ============================================================================
# 阶段 3: 创建 Issues
# ============================================================================
phase "阶段 3: 创建 55 个 Issues"
if should_run 3; then
  if [ "$SKIP_ISSUES" = true ]; then
    info "跳过 (--skip-issues)"
  elif [ -x "$TICKETS_DIR/push-to-github.sh" ]; then
    info "调用 push-to-github.sh..."
    if [ "$DRY_RUN" = true ]; then
      info "[DRY-RUN] bash tickets/push-to-github.sh"
    else
      (cd "$SCRIPT_DIR/.." && bash tickets/push-to-github.sh) || warn "部分 issue 创建可能失败"
    fi
  else
    warn "找不到 tickets/push-to-github.sh, 请先手动运行"
  fi
  
  if [ "$DRY_RUN" = false ]; then
    # 建立 issue 编号映射
    info "建立 issue 映射..."
    > "$CACHE_DIR/issue-map.tsv"
    for f in "$TICKETS_DIR"/SG-*.md; do
      tid=$(basename "$f" .md)
      issue_num=$(gh issue list --repo "$OWNER/$REPO" --limit 200 --state all --search "in:title \"[$tid]\"" --json number --jq '.[0].number // empty' 2>/dev/null || echo "")
      if [ -n "$issue_num" ]; then
        echo -e "$tid\t$issue_num" >> "$CACHE_DIR/issue-map.tsv"
      fi
    done
    mapped=$(wc -l < "$CACHE_DIR/issue-map.tsv" | tr -d ' ')
    success "已映射 $mapped / $TICKET_COUNT 个 issue"
  fi
fi

# ============================================================================
# 阶段 4: 添加到 Project
# ============================================================================
phase "阶段 4: 添加 Issues 到 Project"
if should_run 4; then
  if [ ! -f "$CACHE_DIR/issue-map.tsv" ]; then
    error "缺少 issue 映射, 请先执行阶段 3"
    exit 1
  fi
  
  # 获取已添加的 items
  EXISTING=$(gh project item-list "$PROJECT_NUM" --owner "$OWNER" --format json --limit 200 2>/dev/null | \
    jq -r '.items[]?.content.number // empty')
  
  added=0; skipped=0; failed=0
  total=$(wc -l < "$CACHE_DIR/issue-map.tsv" | tr -d ' ')
  info "开始添加 $total 个 issue..."
  
  while IFS=$'\t' read -r tid issue_num; do
    [ -z "$tid" ] && continue
    
    if echo "$EXISTING" | grep -qx "$issue_num" 2>/dev/null; then
      skipped=$((skipped + 1))
      continue
    fi
    
    if [ "$DRY_RUN" = true ]; then
      info "[DRY-RUN] 添加 $tid (#$issue_num)"
      added=$((added + 1))
    else
      if gh project item-add "$PROJECT_NUM" --owner "$OWNER" \
        --url "https://github.com/$OWNER/$REPO/issues/$issue_num" &> /dev/null; then
        added=$((added + 1))
      else
        failed=$((failed + 1))
      fi
    fi
    sleep 0.2
  done < "$CACHE_DIR/issue-map.tsv"
  
  echo ""
  success "添加: $added  跳过: $skipped  失败: $failed"
fi

# ============================================================================
# 阶段 5: 设置字段值 (核心)
# ============================================================================
phase "阶段 5: 设置字段值 (Status / Priority / Epic / Sprint / Type / Owner Role / Estimate)"
if should_run 5; then
  if [ "$SKIP_FIELDS" = true ]; then
    info "跳过 (--skip-fields)"
  elif [ "$DRY_RUN" = true ]; then
    info "[DRY-RUN] 字段值设置预览:"
    echo "  Status:    → Todo (全部 55 个)"
    echo "  Priority:  → 来自 frontmatter (P0/P1/P2)"
    echo "  Epic:      → 来自 frontmatter (E1-E9)"
    echo "  Sprint:    → 来自 milestone (Sprint 1-9)"
    echo "  Type:      → 来自 frontmatter"
    echo "  Owner Role:→ 来自 frontmatter (FE/BE/etc)"
    echo "  Estimate:  → 来自 frontmatter (数字)"
  else
    # 加载字段 ID
    declare -A FIELD_IDS
    declare -A OPTION_IDS
    while IFS=$'\t' read -r name id type; do
      FIELD_IDS["$name"]="$id"
    done < "$CACHE_DIR/field-ids.tsv"
    
    # 加载所有 single select 的 options
    info "加载字段 options..."
    for field_name in Status Priority Epic Sprint Type "Owner Role"; do
      fid="${FIELD_IDS[$field_name]:-}"
      [ -z "$fid" ] && continue
      
      while IFS=$'\t' read -r opt_name opt_id; do
        OPTION_IDS["$field_name|$opt_name"]="$opt_id"
      done < <(get_field_options "$PROJECT_ID" "$fid")
    done
    success "已加载 $((${#OPTION_IDS[@]})) 个 option 映射"
    
    # 处理每个 ticket
    info "开始设置字段值..."
    total=$(wc -l < "$CACHE_DIR/issue-map.tsv" | tr -d ' ')
    done_count=0; failed_count=0
    current=0
    
    while IFS=$'\t' read -r tid issue_num; do
      [ -z "$tid" ] && continue
      current=$((current + 1))
      md="$TICKETS_DIR/$tid.md"
      [ ! -f "$md" ] && continue
      
      # 解析 frontmatter
      priority=$(awk -F'"' '/^priority:/{print $2}' "$md")
      epic_full="E$(awk -F'"' '/^epic:/{print $2}' "$md" | grep -oE '[0-9]')"
      epic_raw=$(awk -F'"' '/^epic:/{print $2}' "$md")
      estimate=$(awk -F': ' '/^estimate:/{print $2}' "$md")
      type=$(awk '/^type:/{print $2}' "$md")
      owner=$(awk -F': ' '/^owner:/{print $2}' "$md" | awk '{print $1}')
      milestone=$(awk -F'"' '/^milestone:/{print $2}' "$md")
      
      # milestone → sprint 映射
      case "$milestone" in
        Foundation) sprint_opt="Sprint 1 (T+0-2w)" ;;
        Alpha)       sprint_opt="Sprint 2 (T+2-4w)" ;;
        Beta)        sprint_opt="Sprint 4 (T+6-8w)" ;;
        GA)          sprint_opt="Sprint 8 (T+14-16w)" ;;
        *)           sprint_opt="" ;;
      esac
      
      # Epic ID → 完整名
      case "$epic_raw" in
        E1) epic_opt="E1 - 基础设施" ;;
        E2) epic_opt="E2 - 插件核心" ;;
        E3) epic_opt="E3 - 规则引擎" ;;
        E4) epic_opt="E4 - 插件 UI" ;;
        E5) epic_opt="E5 - 云端服务" ;;
        E6) epic_opt="E6 - 云端测试" ;;
        E7) epic_opt="E7 - 通知集成" ;;
        E8) epic_opt="E8 - Beta 完善" ;;
        E9) epic_opt="E9 - GA 收尾" ;;
        *)  epic_opt="" ;;
      esac
      
      # 获取 item ID
      item_id=$(get_item_id "$OWNER" "$REPO" "$issue_num")
      [ -z "$item_id" ] && { warn "[$current/$total] $tid: 未找到 item"; failed_count=$((failed_count + 1)); continue; }
      
      # 设置 Status = Todo
      status_id="${OPTION_IDS[Status|Todo]:-}"
      [ -n "$status_id" ] && set_field_value "$PROJECT_ID" "$item_id" "${FIELD_IDS[Status]}" single_select "$status_id"
      
      # 设置 Priority
      [ -n "$priority" ] && {
        pid="${OPTION_IDS[Priority|$priority]:-}"
        [ -n "$pid" ] && set_field_value "$PROJECT_ID" "$item_id" "${FIELD_IDS[Priority]}" single_select "$pid"
      }
      
      # 设置 Epic
      [ -n "$epic_opt" ] && {
        eid="${OPTION_IDS[Epic|$epic_opt]:-}"
        [ -n "$eid" ] && set_field_value "$PROJECT_ID" "$item_id" "${FIELD_IDS[Epic]}" single_select "$eid"
      }
      
      # 设置 Sprint
      [ -n "$sprint_opt" ] && {
        sid="${OPTION_IDS[Sprint|$sprint_opt]:-}"
        [ -n "$sid" ] && set_field_value "$PROJECT_ID" "$item_id" "${FIELD_IDS[Sprint]}" single_select "$sid"
      }
      
      # 设置 Type
      [ -n "$type" ] && {
        tid_type="${OPTION_IDS[Type|$type]:-}"
        [ -n "$tid_type" ] && set_field_value "$PROJECT_ID" "$item_id" "${FIELD_IDS[Type]}" single_select "$tid_type"
      }
      
      # 设置 Owner Role
      [ -n "$owner" ] && {
        oid="${OPTION_IDS[Owner Role|$owner]:-}"
        [ -n "$oid" ] && set_field_value "$PROJECT_ID" "$item_id" "${FIELD_IDS[Owner Role]}" single_select "$oid"
      }
      
      # 设置 Estimate (number)
      [ -n "$estimate" ] && [ "$estimate" -gt 0 ] 2>/dev/null && \
        set_field_value "$PROJECT_ID" "$item_id" "${FIELD_IDS[Estimate]}" number "$estimate"
      
      done_count=$((done_count + 1))
      # 进度输出
      if [ $((current % 10)) -eq 0 ] || [ "$current" = "$total" ]; then
        echo -ne "  进度: $current / $total\r"
      fi
      sleep 0.3
    done < "$CACHE_DIR/issue-map.tsv"
    
    echo ""
    success "完成: $done_count, 失败: $failed_count"
  fi
fi

# ============================================================================
# 阶段 6-7: 手动指引
# ============================================================================
phase "阶段 6: 创建 Views (需在 UI 中手动)"

cat <<VIEW_DOC
访问: https://github.com/$OWNER/$REPO/projects/$PROJECT_NUM

点击右上角 "+ New view" 创建以下 6 个视图：

  1. 📋 Board (by Status)  - Board layout, group by Status
  2. 🎯 By Priority        - Board layout, group by Priority
  3. 🚀 By Sprint          - Board layout, group by Sprint
  4. 📦 By Epic            - Board layout, group by Epic
  5. 👤 By Owner           - Board layout, group by Owner Role
  6. 📊 Backlog Table      - Table layout (无分组)

VIEW_DOC

phase "阶段 7: 设置 Workflows (需在 UI 中手动)"

cat <<'WORKFLOW_DOC'
进入 Project → ⚙️ Settings → Workflows → 添加:

  ✓ Item added to project         → Set Status to "Todo"
  ✓ Pull request opened           → Set Status to "In Review"
  ✓ Item closed                   → Set Status to "Done"
  ✓ Pull request merged           → Set Status to "Done"
  ✓ Label "prio:P0" added         → Set Priority to "P0"
  ✓ Item assigned                 → Set Status to "In Progress"
WORKFLOW_DOC

# ============================================================================
# 总结
# ============================================================================
phase "完成！"

if [ "$DRY_RUN" = false ] && [ -n "$PROJECT_NUM" ] && [ "$PROJECT_NUM" != "<new>" ]; then
  echo ""
  info "Project URL:  https://github.com/$OWNER/$REPO/projects/$PROJECT_NUM"
  info "缓存目录:     $CACHE_DIR"
  info "Issue 映射:   $CACHE_DIR/issue-map.tsv"
fi

echo ""
info "下一步:"
echo "  1. 访问 Project URL, 按上述创建 6 个 Views"
echo "  2. 在 Settings → Workflows 配置自动化"
echo "  3. 把 Project 添加到 repo 的 Pin"
echo ""
info "故障排查详见 README.md"
