# ScriptGuard 品牌物料

## Logo

- `icon.svg` — 矢量 Logo（盾牌 + 代码符号 + 对勾）
- `icon.png` — 128x128 PNG（Plasmo 自动生成 16/32/48/128 尺寸）

### 生成 PNG

```bash
# 使用 npm 包 svg2png-cli 或在线工具将 icon.svg 转为 icon.png
npx svg2png-cli icon.svg --output icon.png --width 128 --height 128
```

或手动放置 `icon.png` 到此目录，Plasmo 会自动处理多尺寸。

## 品牌色

| 名称           | 色值      | 用途             |
| -------------- | --------- | ---------------- |
| Primary Blue   | `#2563EB` | 主色、按钮、链接 |
| Dark           | `#0F172A` | 深色背景、文字   |
| Success Green  | `#22C55E` | 健康状态、通过   |
| Warning Yellow | `#EAB308` | 警告状态         |
| Error Red      | `#EF4444` | 错误状态、告警   |
| Muted Gray     | `#6B7280` | 次要文字、边框   |

## 字体

- **标题**: Inter (700)
- **正文**: Inter (400)
- **代码**: JetBrains Mono

## 使用规范

1. Logo 最小尺寸: 16x16px
2. Logo 周围留白: 不小于 Logo 宽度的 20%
3. 深色模式使用白色版本 Logo
4. 禁止拉伸、旋转、添加阴影
