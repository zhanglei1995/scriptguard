#!/usr/bin/env node
/**
 * generate-tickets.js
 * Parses tickets.md and generates:
 *   - tickets/SG-XXX.md         (one file per ticket, with YAML frontmatter)
 *   - tickets/INDEX.md           (linked index grouped by epic)
 *   - tickets/tickets.csv        (CSV for bulk import)
 *   - tickets/tickets.json       (JSON for programmatic import)
 *   - tickets/push-to-github.sh  (helper script to push to GitHub Issues)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'tickets.md');
const OUT = path.join(ROOT, 'tickets');

// ---------- 1. Parse tickets.md ----------
const src = fs.readFileSync(SRC, 'utf8');
const lines = src.split('\n');

const tickets = [];
let current = null;

for (const line of lines) {
  const m = line.match(/^#### (SG-\d+) \| ([^|]+) \| (.+)$/);
  if (m) {
    if (current) tickets.push(current);
    current = { id: m[1].trim(), type: m[2].trim(), title: m[3].trim(), lines: [] };
  } else if (current) {
    current.lines.push(line);
  }
}
if (current) tickets.push(current);

console.log('✓ Parsed ' + tickets.length + ' tickets from tickets.md');

// ---------- 2. Helpers ----------
function getMeta(body) {
  const meta = {};
  let inTable = false;
  for (const line of body.split('\n')) {
    if (/^\| 字段 \|/.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable && /^\|---/.test(line)) continue;
    if (inTable && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      if (cells.length >= 2) meta[cells[0].replace(/\*\*/g, '')] = cells[1];
    } else if (inTable && line.trim() === '') {
      inTable = false;
    }
  }
  return meta;
}

function getSection(body, name) {
  const re = new RegExp(
    '\\*\\*' + name + '\\*\\*[：:]\\s*([\\s\\S]*?)(?=\\n\\n\\*\\*|\\n---|\\n## |\\n### |\\Z)',
  );
  const m = body.match(re);
  return m ? m[1].trim() : '';
}

function stripMetaTable(body) {
  return body.replace(/(?:^\s*\n)?\| 字段[\s\S]*?\n(?=\n)/, '').trim();
}

function escapeCsv(s) {
  return '"' + String(s).replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '') + '"';
}

function toLabels(meta) {
  return (meta['Labels'] || '')
    .split(',')
    .map((s) => s.trim().replace(/^`+|`+$/g, ''))
    .filter(Boolean);
}

function toDeps(meta) {
  const raw = (meta['Dependencies'] || '').trim();
  if (!raw || raw === '无' || raw === '—' || raw === '-') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseEstimate(meta) {
  const raw = meta['Estimate'] || '0';
  const m = raw.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// Epic → milestone mapping (also used to backfill empty milestones)
function getEpicMilestone(ticketId) {
  const num = parseInt(ticketId.split('-')[1], 10);
  if (num <= 10) return { epic: 'E1', milestone: 'Foundation' };
  if (num <= 18) return { epic: 'E2', milestone: 'Alpha' };
  if (num <= 19) return { epic: 'E3', milestone: 'Alpha' };
  if (num <= 27) return { epic: 'E4', milestone: 'Alpha' };
  if (num <= 34) return { epic: 'E5', milestone: 'Beta' };
  if (num <= 39) return { epic: 'E6', milestone: 'Beta' };
  if (num <= 43) return { epic: 'E7', milestone: 'Beta' };
  if (num <= 46) return { epic: 'E8', milestone: 'Beta' };
  return { epic: 'E9', milestone: 'GA' };
}

function resolveMilestone(meta, ticketId) {
  const source = (meta['Milestone'] || '').trim();
  if (source) return source;
  return getEpicMilestone(ticketId).milestone;
}

// ---------- 3. Generate per-ticket .md files ----------
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

for (const t of tickets) {
  const body = t.lines.join('\n');
  const meta = getMeta(body);
  const cleanedBody = stripMetaTable(body);
  const labels = toLabels(meta);
  const deps = toDeps(meta);
  const estimate = parseEstimate(meta);
  const milestone = resolveMilestone(meta, t.id);
  const epic = getEpicMilestone(t.id).epic;
  const titleSafe = t.title.replace(/"/g, '\\"');

  // Add a milestone label if not present
  if (!labels.includes('m:' + milestone.toLowerCase())) {
    labels.push('m:' + milestone.toLowerCase());
  }

  const frontmatter = [
    '---',
    'id: ' + t.id,
    'title: "' + titleSafe + '"',
    'type: ' + (meta['Type'] || t.type),
    'priority: ' + (meta['Priority'] || ''),
    'estimate: ' + estimate,
    'owner: ' + (meta['Owner'] || ''),
    'epic: ' + epic,
    'milestone: "' + milestone + '"',
    'dependencies: [' + deps.map((d) => '"' + d + '"').join(', ') + ']',
    'labels: [' + labels.map((l) => '"' + l + '"').join(', ') + ']',
    'status: open',
    '---',
    '',
  ].join('\n');

  const depsDisplay = deps.length ? deps.join(', ') : '无';
  const labelsDisplay = labels.length ? labels.map((l) => '`' + l + '`').join(' ') : '`unlabeled`';
  const milestoneNote = (meta['Milestone'] || '').trim() ? '' : ' *(自动从 Epic 推导)*';

  const file = [
    frontmatter,
    '# ' + t.id + ' | ' + (meta['Type'] || t.type) + ' | ' + t.title,
    '',
    '## 📋 元信息',
    '',
    '| 字段 | 值 |',
    '|---|---|',
    '| **Type** | ' + (meta['Type'] || '') + ' |',
    '| **Priority** | ' + (meta['Priority'] || '') + ' |',
    '| **Estimate** | ' + estimate + ' pt |',
    '| **Owner** | ' + (meta['Owner'] || '') + ' |',
    '| **Epic** | ' + epic + ' |',
    '| **Dependencies** | ' + depsDisplay + ' |',
    '| **Labels** | ' + labelsDisplay + ' |',
    '| **Milestone** | ' + milestone + milestoneNote + ' |',
    '',
    '---',
    '',
    cleanedBody,
    '',
    '---',
    '',
    '> 自动生成自 `tickets.md` v1.0 · 关联 `PRD.md` / `TDD.md` / `Wireframes.md`',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(OUT, t.id + '.md'), file);
}
console.log('✓ Generated ' + tickets.length + ' ticket .md files in tickets/');

// ---------- 4. Generate INDEX.md ----------
const indexLines = [
  '# ScriptGuard Tickets Index',
  '',
  '> 自动生成 · 共 **' + tickets.length + '** 张 ticket',
  '',
  '## 按 ID 顺序浏览',
  '',
  '| ID | 标题 | Type | Priority | Estimate | Owner | Epic | Milestone |',
  '|---|---|---|---|---|---|---|---|',
];
for (const t of tickets) {
  const meta = getMeta(t.lines.join('\n'));
  const estimate = parseEstimate(meta);
  const epic = getEpicMilestone(t.id).epic;
  const milestone = resolveMilestone(meta, t.id);
  indexLines.push(
    '| [' +
      t.id +
      '](./' +
      t.id +
      '.md) | ' +
      t.title +
      ' | ' +
      (meta['Type'] || '') +
      ' | ' +
      (meta['Priority'] || '') +
      ' | ' +
      estimate +
      ' pt | ' +
      (meta['Owner'] || '') +
      ' | ' +
      epic +
      ' | ' +
      milestone +
      ' |',
  );
}
indexLines.push('', '## 按 Epic 分组', '');

const groups = groupByEpic(tickets);
for (const g of groups) {
  indexLines.push('### ' + g.epic + ' — ' + g.title, '');
  for (const t of g.tickets) {
    indexLines.push('- [' + t.id + '](./' + t.id + '.md) - ' + t.title);
  }
  indexLines.push('');
}

indexLines.push(
  '---',
  '',
  '## 配套文件',
  '',
  '- `tickets.csv` — 适用于 GitHub Issues 批量导入、Linear / Jira',
  '- `tickets.json` — 适用于 API 集成、CI 自动化',
  '- `SG-XXX.md` — 单个 ticket 的完整内容（带 YAML frontmatter），可直接 `gh issue create --body-file`',
  '- `push-to-github.sh` — 自动创建 labels / milestones / issues 的 shell 脚本',
  '',
);

fs.writeFileSync(path.join(OUT, 'INDEX.md'), indexLines.join('\n'));
console.log('✓ Generated INDEX.md');

function groupByEpic(tickets) {
  const epicMap = {
    E1: '基础设施与脚手架 (Sprint 1)',
    E2: '插件核心架构 (Sprint 2)',
    E3: '健康检查引擎 (Sprint 3)',
    E4: '插件 UI Alpha (Sprint 3)',
    E5: '云端服务 (Sprint 4)',
    E6: '云端测试引擎 (Sprint 5)',
    E7: '通知与集成 (Sprint 6)',
    E8: 'Beta 完善 (Sprint 7)',
    E9: 'GA 收尾 (Sprint 8-9)',
  };
  const groups = {};
  for (const t of tickets) {
    const num = parseInt(t.id.split('-')[1], 10);
    let epic = 'E9';
    if (num <= 10) epic = 'E1';
    else if (num <= 18) epic = 'E2';
    else if (num <= 19) epic = 'E3';
    else if (num <= 27) epic = 'E4';
    else if (num <= 34) epic = 'E5';
    else if (num <= 39) epic = 'E6';
    else if (num <= 43) epic = 'E7';
    else if (num <= 46) epic = 'E8';
    if (!groups[epic]) groups[epic] = [];
    groups[epic].push(t);
  }
  return Object.keys(epicMap)
    .filter((k) => groups[k])
    .map((k) => ({ epic: k, title: epicMap[k], tickets: groups[k] }));
}

// ---------- 5. Generate tickets.csv ----------
const csvHeader = [
  'id',
  'title',
  'type',
  'priority',
  'estimate',
  'owner',
  'epic',
  'dependencies',
  'labels',
  'milestone',
  'description',
  'acceptance_criteria',
  'technical_notes',
];
const csvRows = [csvHeader.join(',')];

for (const t of tickets) {
  const body = t.lines.join('\n');
  const meta = getMeta(body);
  const desc = getSection(body, 'Description');
  const ac = getSection(body, 'Acceptance Criteria');
  const tn = getSection(body, 'Technical Notes');
  const epic = getEpicMilestone(t.id).epic;
  const milestone = resolveMilestone(meta, t.id);

  const row = [
    t.id,
    escapeCsv(t.title),
    escapeCsv(meta['Type'] || ''),
    escapeCsv(meta['Priority'] || ''),
    escapeCsv(parseEstimate(meta).toString()),
    escapeCsv(meta['Owner'] || ''),
    escapeCsv(epic),
    escapeCsv(toDeps(meta).join(', ')),
    escapeCsv(toLabels(meta).join(', ')),
    escapeCsv(milestone),
    escapeCsv(desc),
    escapeCsv(ac),
    escapeCsv(tn),
  ];
  csvRows.push(row.join(','));
}
fs.writeFileSync(path.join(OUT, 'tickets.csv'), csvRows.join('\n') + '\n');
console.log('✓ Generated tickets.csv');

// ---------- 6. Generate tickets.json ----------
const json = tickets.map((t) => {
  const body = t.lines.join('\n');
  const meta = getMeta(body);
  return {
    id: t.id,
    title: t.title,
    type: meta['Type'] || '',
    priority: meta['Priority'] || '',
    estimate: parseEstimate(meta),
    owner: meta['Owner'] || '',
    epic: getEpicMilestone(t.id).epic,
    milestone: resolveMilestone(meta, t.id),
    dependencies: toDeps(meta),
    labels: toLabels(meta),
    description: getSection(body, 'Description'),
    acceptance_criteria: getSection(body, 'Acceptance Criteria'),
    technical_notes: getSection(body, 'Technical Notes'),
  };
});
fs.writeFileSync(path.join(OUT, 'tickets.json'), JSON.stringify(json, null, 2) + '\n');
console.log('✓ Generated tickets.json');

// ---------- 7. Generate push-to-github.sh ----------
const pushSh = [
  '#!/usr/bin/env bash',
  '# push-to-github.sh',
  '# 使用 GitHub CLI 批量创建 Issue。运行前请确保：',
  '#   1. gh auth login 已完成',
  '#   2. 当前目录是 ScriptGuard repo（GitHub remote 已配置）',
  '#   3. 已有创建 issues / labels / milestones 的权限',
  '',
  'set -euo pipefail',
  '',
  'echo "→ 创建 labels..."',
  'gh label create "area:plugin" --color "1d76db" --description "浏览器插件相关" 2>/dev/null || true',
  'gh label create "area:popup" --color "1d76db" --description "Popup 页面" 2>/dev/null || true',
  'gh label create "area:options" --color "1d76db" --description "Options 后台" 2>/dev/null || true',
  'gh label create "area:overlay" --color "1d76db" --description "页面内浮层" 2>/dev/null || true',
  'gh label create "area:server" --color "5319e7" --description "云端服务" 2>/dev/null || true',
  'gh label create "area:runner" --color "5319e7" --description "Playwright Runner" 2>/dev/null || true',
  'gh label create "area:db" --color "5319e7" --description "数据库" 2>/dev/null || true',
  'gh label create "area:notify" --color "fbca04" --description "通知系统" 2>/dev/null || true',
  'gh label create "area:infra" --color "0e8a16" --description "基础设施" 2>/dev/null || true',
  'gh label create "area:design" --color "e99695" --description "设计" 2>/dev/null || true',
  'gh label create "type:feature" --color "a2eeef" --description "新功能" 2>/dev/null || true',
  'gh label create "type:bug" --color "d73a4a" --description "缺陷" 2>/dev/null || true',
  'gh label create "type:chore" --color "cfd3d7" --description "杂项/重构" 2>/dev/null || true',
  'gh label create "type:docs" --color "0075ca" --description "文档" 2>/dev/null || true',
  'gh label create "type:test" --color "bfd4f2" --description "测试" 2>/dev/null || true',
  'gh label create "type:spike" --color "d4c5f9" --description "调研" 2>/dev/null || true',
  'gh label create "prio:P0" --color "b60205" --description "P0 - 必须" 2>/dev/null || true',
  'gh label create "prio:P1" --color "d93f0b" --description "P1 - 强烈建议" 2>/dev/null || true',
  'gh label create "prio:P2" --color "fbca04" --description "P2 - 可选" 2>/dev/null || true',
  'gh label create "m:foundation" --color "7057ff" --description "Milestone: Foundation" 2>/dev/null || true',
  'gh label create "m:alpha" --color "008672" --description "Milestone: Alpha" 2>/dev/null || true',
  'gh label create "m:beta" --color "008672" --description "Milestone: Beta" 2>/dev/null || true',
  'gh label create "m:ga" --color "008672" --description "Milestone: GA" 2>/dev/null || true',
  '',
  'echo "→ 创建 milestones..."',
  'gh api repos/:owner/:repo/milestones -f title="Foundation (Sprint 1)" -f due_on="2026-07-01T00:00:00Z" -f description="基础设施与脚手架" 2>/dev/null || true',
  'gh api repos/:owner/:repo/milestones -f title="Alpha (Sprint 2-3)" -f due_on="2026-08-15T00:00:00Z" -f description="MVP Alpha 版本" 2>/dev/null || true',
  'gh api repos/:owner/:repo/milestones -f title="Beta (Sprint 4-7)" -f due_on="2026-10-15T00:00:00Z" -f description="MVP Beta 版本" 2>/dev/null || true',
  'gh api repos/:owner/:repo/milestones -f title="GA v1.0 (Sprint 8-9)" -f due_on="2026-11-30T00:00:00Z" -f description="v1.0 GA 正式发布" 2>/dev/null || true',
  '',
  'echo "→ 批量创建 issues..."',
  'for f in tickets/SG-*.md; do',
  '  id=$(basename "$f" .md)',
  '  title=$(awk \'/^title: /{gsub(/^title: *"|"$/,""); print; exit}\' "$f")',
  '  labels=$(awk \'/^labels: \\[/,/\\]/\' "$f" | grep -oE \'"[^"]+"\' | tr -d \'"\' | paste -sd "," -)',
  '  echo "  + $id : $title"',
  '  gh issue create \\',
  '    --title "[$id] $title" \\',
  '    --body-file "$f" \\',
  '    --label "$labels" || echo "  ! $id 创建失败"',
  '  sleep 0.5  # 避免触发 GitHub API 速率限制',
  'done',
  '',
  'echo ""',
  'echo "✅ 全部 issue 创建完成"',
  'echo "查看: gh issue list --label prio:P0"',
  '',
].join('\n');

fs.writeFileSync(path.join(OUT, 'push-to-github.sh'), pushSh);
fs.chmodSync(path.join(OUT, 'push-to-github.sh'), 0o755);
console.log('✓ Generated push-to-github.sh');

// ---------- 8. Stats summary ----------
const stats = {};
for (const t of tickets) {
  const meta = getMeta(t.lines.join('\n'));
  const m = resolveMilestone(meta, t.id);
  stats[m] = (stats[m] || 0) + 1;
}
console.log('');
console.log('📊 Milestone distribution:');
for (const [m, c] of Object.entries(stats)) {
  console.log('   ' + m + ': ' + c + ' tickets');
}

console.log('');
console.log('✅ Done. Output: ' + OUT + '/');
console.log('   - ' + tickets.length + ' ticket .md files');
console.log('   - INDEX.md');
console.log('   - tickets.csv');
console.log('   - tickets.json');
console.log('   - push-to-github.sh');
