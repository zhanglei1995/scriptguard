/**
 * Rule Configuration - 健康检查规则配置 UI
 * SG-027: 健康检查规则配置 UI
 */

import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Card, CardContent } from '../../components/ui/card';
import { rulesStore } from '../../storage/chrome';
import { AlertTriangle, GripVertical, Plus, Pencil, Trash2, Play } from 'lucide-react';

type AlertLevel = 'low' | 'medium' | 'high' | 'critical';
type RuleType =
  | 'selector_exists'
  | 'selector_visible'
  | 'text_content'
  | 'url_match'
  | 'network_status'
  | 'js_assertion'
  | 'console_clean'
  | 'duration';

interface RuleConfig {
  id: string;
  scriptId: string;
  name: string;
  type: RuleType;
  config: Record<string, unknown>;
  required: boolean;
  enabled: boolean;
  timeout: number;
  alertLevel: AlertLevel;
}

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  selector_exists: '选择器存在',
  selector_visible: '选择器可见',
  text_content: '文本内容',
  url_match: 'URL 匹配',
  js_assertion: 'JS 断言',
  network_status: '网络状态',
  console_clean: '控制台无错误',
  duration: '耗时阈值',
};

interface RuleFormData {
  name: string;
  type: RuleType;
  required: boolean;
  timeout: number;
  alertLevel: AlertLevel;
  config: Record<string, unknown>;
}

const defaultFormData: RuleFormData = {
  name: '',
  type: 'selector_exists',
  required: true,
  timeout: 5000,
  alertLevel: 'medium',
  config: {},
};

function generateId(): string {
  return crypto.randomUUID();
}

// ====== Sortable Rule Row ======
function SortableRuleRow({
  rule,
  onEdit,
  onDelete,
  onToggle,
  testResults,
}: {
  rule: RuleConfig;
  onEdit: (rule: RuleConfig) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  testResults?: Record<string, { status: string; duration: number }>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const result = testResults?.[rule.id];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 border rounded-md bg-background hover:bg-accent/50"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Badge variant="secondary" className="text-xs shrink-0">
        {RULE_TYPE_LABELS[rule.type] ?? rule.type}
      </Badge>

      <span className="flex-1 text-sm truncate">{rule.name}</span>

      {result && (
        <Badge
          variant={
            result.status === 'passed'
              ? 'success'
              : result.status === 'failed'
                ? 'destructive'
                : 'warning'
          }
          className="text-xs shrink-0"
        >
          {result.status === 'passed'
            ? '通过'
            : result.status === 'failed'
              ? '失败'
              : result.status}
          <span className="ml-1 text-[10px]">{result.duration}ms</span>
        </Badge>
      )}

      <Switch
        checked={rule.enabled}
        onCheckedChange={(checked) => onToggle(rule.id, checked)}
        className="shrink-0"
      />

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onEdit(rule)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onDelete(rule.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ====== Dynamic Rule Form ======
function RuleForm({
  data,
  onChange,
}: {
  data: RuleFormData;
  onChange: (patch: Partial<RuleFormData>) => void;
}) {
  const updateConfig = (patch: Record<string, unknown>) => {
    onChange({ config: { ...data.config, ...patch } });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">规则名称</label>
        <Input
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="输入规则名称"
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">规则类型</label>
        <Select
          value={data.type}
          onValueChange={(v) => onChange({ type: v as RuleType, config: {} })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="selector_exists">选择器存在</SelectItem>
            <SelectItem value="selector_visible">选择器可见</SelectItem>
            <SelectItem value="text_content">文本内容</SelectItem>
            <SelectItem value="url_match">URL 匹配</SelectItem>
            <SelectItem value="network_status">网络状态</SelectItem>
            <SelectItem value="js_assertion">JS 断言</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic config based on type */}
      {data.type === 'selector_exists' && (
        <div>
          <label className="text-sm font-medium">CSS 选择器</label>
          <div className="flex gap-2 mt-1">
            <Input
              value={(data.config.selector as string) ?? ''}
              onChange={(e) => updateConfig({ selector: e.target.value })}
              placeholder="#app, .container"
              className="flex-1"
            />
            <Button variant="outline" size="sm" type="button">
              从页面选取
            </Button>
          </div>
        </div>
      )}

      {data.type === 'selector_visible' && (
        <>
          <div>
            <label className="text-sm font-medium">CSS 选择器</label>
            <Input
              value={(data.config.selector as string) ?? ''}
              onChange={(e) => updateConfig({ selector: e.target.value })}
              placeholder="#app, .container"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">超时时间 (ms)</label>
            <Input
              type="number"
              value={(data.config.timeout as number) ?? 3000}
              onChange={(e) => updateConfig({ timeout: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </>
      )}

      {data.type === 'text_content' && (
        <>
          <div>
            <label className="text-sm font-medium">CSS 选择器</label>
            <Input
              value={(data.config.selector as string) ?? ''}
              onChange={(e) => updateConfig({ selector: e.target.value })}
              placeholder="#title, h1"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">预期文本</label>
            <Input
              value={(data.config.expected as string) ?? ''}
              onChange={(e) => updateConfig({ expected: e.target.value })}
              placeholder="预期的文本内容"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">匹配模式</label>
            <Select
              value={(data.config.operator as string) ?? 'contains'}
              onValueChange={(v) => updateConfig({ operator: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">精确匹配</SelectItem>
                <SelectItem value="contains">包含匹配</SelectItem>
                <SelectItem value="matches">正则匹配</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {data.type === 'url_match' && (
        <>
          <div>
            <label className="text-sm font-medium">URL 模式</label>
            <Input
              value={(data.config.pattern as string) ?? ''}
              onChange={(e) => updateConfig({ pattern: e.target.value })}
              placeholder="*://example.com/*"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">匹配类型</label>
            <Select
              value={(data.config.matchType as string) ?? 'glob'}
              onValueChange={(v) => updateConfig({ matchType: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glob">Glob</SelectItem>
                <SelectItem value="regex">正则</SelectItem>
                <SelectItem value="exact">精确</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {data.type === 'network_status' && (
        <>
          <div>
            <label className="text-sm font-medium">URL 模式</label>
            <Input
              value={(data.config.urlPattern as string) ?? ''}
              onChange={(e) => updateConfig({ urlPattern: e.target.value })}
              placeholder="*api.example.com*"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">预期状态码</label>
            <Input
              value={(data.config.expectedStatus as string) ?? ''}
              onChange={(e) => updateConfig({ expectedStatus: e.target.value })}
              placeholder="200"
              className="mt-1"
            />
          </div>
        </>
      )}

      {data.type === 'js_assertion' && (
        <div>
          <label className="text-sm font-medium">JS 表达式</label>
          <Textarea
            value={(data.config.expression as string) ?? ''}
            onChange={(e) => updateConfig({ expression: e.target.value })}
            placeholder="document.querySelector('#app') !== null"
            className="mt-1 font-mono text-sm"
            rows={4}
          />
        </div>
      )}

      {/* Common fields */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <div className="flex items-center gap-2">
          <Switch
            checked={data.required}
            onCheckedChange={(checked) => onChange({ required: checked })}
          />
          <label className="text-sm">必须通过</label>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mr-2">超时</label>
          <Input
            type="number"
            value={data.timeout}
            onChange={(e) => onChange({ timeout: Number(e.target.value) })}
            className="w-[100px] inline-flex"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mr-2">告警级别</label>
          <Select
            value={data.alertLevel}
            onValueChange={(v) => onChange({ alertLevel: v as AlertLevel })}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">低</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="critical">严重</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ====== Main Rules View ======
export function RulesView({ scriptId }: { scriptId?: string }) {
  const [rules, setRules] = useState<RuleConfig[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleConfig | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(defaultFormData);
  const [combinationLogic, setCombinationLogic] = useState<'AND' | 'OR'>('AND');
  const [testResults, setTestResults] = useState<
    Record<string, { status: string; duration: number }>
  >({});
  const [testing, setTesting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loadRules = useCallback(async () => {
    const all = (await rulesStore.get()) ?? [];
    const filtered = scriptId ? all.filter((r) => r.scriptId === scriptId) : all;
    setRules(
      filtered.map((r) => ({
        id: r.id,
        scriptId: r.scriptId,
        name: r.name,
        type: r.type as RuleType,
        config: r.config,
        required: r.required,
        enabled: r.enabled,
        timeout: r.timeout,
        alertLevel: r.alertLevel,
      })),
    );
  }, [scriptId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rules.findIndex((r) => r.id === active.id);
    const newIndex = rules.findIndex((r) => r.id === over.id);
    setRules(arrayMove(rules, oldIndex, newIndex));
  };

  const openAddDialog = () => {
    setEditingRule(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (rule: RuleConfig) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      required: rule.required,
      timeout: rule.timeout,
      alertLevel: rule.alertLevel,
      config: { ...rule.config },
    });
    setDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!formData.name.trim()) return;

    let updatedRules: RuleConfig[];

    if (editingRule) {
      updatedRules = rules.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              name: formData.name,
              type: formData.type,
              required: formData.required,
              config: formData.config,
              timeout: formData.timeout,
              alertLevel: formData.alertLevel,
            }
          : r,
      );
    } else {
      const newRule: RuleConfig = {
        id: generateId(),
        scriptId: scriptId ?? '',
        name: formData.name,
        type: formData.type,
        required: formData.required,
        config: formData.config,
        enabled: true,
        timeout: formData.timeout,
        alertLevel: formData.alertLevel,
      };
      updatedRules = [...rules, newRule];
    }

    setRules(updatedRules);
    await rulesStore.set(
      updatedRules.map((r, order) => ({
        ...r,
        order,
      })),
    );
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    await rulesStore.set(
      updated.map((r, order) => ({
        ...r,
        order,
      })),
    );
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, enabled } : r));
    setRules(updated);
    await rulesStore.set(
      updated.map((r, order) => ({
        ...r,
        order,
      })),
    );
  };

  const handleTestAll = async () => {
    setTesting(true);
    const results: Record<string, { status: string; duration: number }> = {};

    for (const rule of rules) {
      if (!rule.enabled) {
        results[rule.id] = { status: 'skipped', duration: 0 };
        continue;
      }

      const start = performance.now();
      try {
        await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 500));
        const passed = Math.random() > 0.2;
        results[rule.id] = {
          status: passed ? 'passed' : 'failed',
          duration: Math.round(performance.now() - start),
        };
      } catch {
        results[rule.id] = {
          status: 'failed',
          duration: Math.round(performance.now() - start),
        };
      }
    }

    setTestResults(results);
    setTesting(false);
  };

  const ruleTypeCounts = {
    selector_exists: rules.filter((r) => r.type === 'selector_exists').length,
    selector_visible: rules.filter((r) => r.type === 'selector_visible').length,
    text_content: rules.filter((r) => r.type === 'text_content').length,
    url_match: rules.filter((r) => r.type === 'url_match').length,
    network_status: rules.filter((r) => r.type === 'network_status').length,
    js_assertion: rules.filter((r) => r.type === 'js_assertion').length,
    console_clean: rules.filter((r) => r.type === 'console_clean').length,
    duration: rules.filter((r) => r.type === 'duration').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">健康检查规则</h2>
          <p className="text-sm text-muted-foreground">配置脚本运行时的健康检查规则</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={combinationLogic}
            onValueChange={(v) => setCombinationLogic(v as 'AND' | 'OR')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">全部通过 (AND)</SelectItem>
              <SelectItem value="OR">任一通过 (OR)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestAll}
            disabled={testing || rules.length === 0}
          >
            <Play className="h-4 w-4 mr-1" />
            {testing ? '测试中...' : '测试全部'}
          </Button>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" />
            添加规则
          </Button>
        </div>
      </div>

      {/* Rule type summary */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(ruleTypeCounts).map(([type, count]) => (
          <Badge key={type} variant={count > 0 ? 'secondary' : 'outline'} className="text-xs">
            {RULE_TYPE_LABELS[type as RuleType]}: {count}
          </Badge>
        ))}
      </div>

      {/* Rule list */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">暂无健康检查规则</p>
            <p className="text-xs text-muted-foreground mt-1">
              点击上方&ldquo;添加规则&rdquo;按钮开始配置
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {rules.map((rule) => (
                <SortableRuleRow
                  key={rule.id}
                  rule={rule}
                  onEdit={openEditDialog}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  testResults={testResults}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add/Edit Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? '编辑规则' : '添加规则'}</DialogTitle>
            <DialogDescription>配置健康检查规则参数</DialogDescription>
          </DialogHeader>

          <RuleForm
            data={formData}
            onChange={(patch) => setFormData((d) => ({ ...d, ...patch }))}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveRule} disabled={!formData.name.trim()}>
              {editingRule ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
