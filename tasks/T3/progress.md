# T3 Progress: SG-007 shadcn/ui 组件库初始化

## Status: DONE

## Summary
初始化了 shadcn/ui 组件库，添加了 17 个组件到 `apps/extension/components/ui/`，包含完整的主题切换支持。

## Completed
- [x] `components.json` 配置文件（new-york style, rsc: false）
- [x] `lib/utils.ts` cn 工具函数
- [x] 17 个 shadcn/ui 组件：
  - Button (6 variants: default/secondary/outline/ghost/destructive/link, 4 sizes)
  - Card (CardHeader/CardTitle/CardDescription/CardContent/CardFooter)
  - Badge (7 variants: default/secondary/destructive/outline/success/warning/muted)
  - Input, Textarea
  - Select (SelectTrigger/SelectContent/SelectItem/SelectValue)
  - Dialog (DialogContent/DialogHeader/DialogTitle/DialogDescription/DialogFooter/DialogTrigger)
  - Tabs (TabsList/TabsTrigger/TabsContent)
  - Switch
  - Tooltip (TooltipContent/TooltipProvider/TooltipTrigger)
  - Table (TableHeader/TableBody/TableRow/TableHead/TableCell/TableFooter/TableCaption)
  - Skeleton
  - Toast (Toaster/ToastProvider/useToast - custom implementation)
  - Empty (自定义空态组件)
  - Command (⌘K 搜索 - cmdk)
  - ThemeProvider/ThemeToggle (亮/暗主题切换)
- [x] `components-showcase.tsx` 展示页验证所有组件
- [x] TypeScript 类型检查通过（仅 pre-existing 错误）
- [x] `@/*` path alias 添加到 tsconfig.json

## Dependencies Added
- clsx
- class-variance-authority
- @radix-ui/react-dialog
- @radix-ui/react-select
- @radix-ui/react-tabs
- @radix-ui/react-switch
- @radix-ui/react-tooltip
- @radix-ui/react-slot
- cmdk

## Commit
`feat(ui): initialize shadcn/ui component library (SG-007)`
SHA: 18c3a92
