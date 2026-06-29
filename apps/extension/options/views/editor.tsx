/**
 * Script Editor - 脚本编辑器 MVP
 * SG-026: 脚本编辑器 MVP
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  EditorView as CodeMirrorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter,
} from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintGutter } from '@codemirror/lint';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent } from '../../components/ui/card';
import { scriptsStore, rulesStore } from '../../storage/chrome';
import type { Script, CheckRule as StorageCheckRule } from '../../storage/schemas';
import { X, Plus } from 'lucide-react';

const DRAFT_KEY = 'sg-editor-draft';

interface EditorDraft {
  scriptId: string;
  name: string;
  version: string;
  code: string;
  matchRules: string[];
  runAt: string;
  timeout: number;
  savedAt: number;
}

export function EditorView({ scriptId }: { scriptId?: string }) {
  const [script, setScript] = useState<Script | null>(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [matchRules, setMatchRules] = useState<string[]>([]);
  const [runAt, setRunAt] = useState<string>('document_idle');
  const [timeout, setTimeout] = useState(5000);
  const [changelog, setChangelog] = useState('');
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [rules, setRules] = useState<StorageCheckRule[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [activeTab, setActiveTab] = useState('rules');

  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<CodeMirrorView | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: script?.code ?? '// 在此编写脚本代码\n',
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        foldGutter(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightSelectionMatches(),
        lintGutter(),
        javascript(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap, ...searchKeymap]),
        CodeMirrorView.theme({
          '&': { fontSize: `${fontSize}px` },
          '.cm-gutters': {
            backgroundColor: 'var(--background)',
            borderRight: '1px solid var(--border)',
          },
          '.cm-activeLineGutter': { backgroundColor: 'var(--accent)' },
          '.cm-activeLine': { backgroundColor: 'var(--accent)/0.5' },
        }),
        CodeMirrorView.updateListener.of((update) => {
          if (update.docChanged) {
            setIsDirty(true);
          }
        }),
      ],
    });

    const view = new CodeMirrorView({
      state,
      parent: editorRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [script?.code, fontSize]);

  // Load script data
  useEffect(() => {
    async function load() {
      const scripts = (await scriptsStore.get()) ?? [];
      const found = scriptId ? scripts.find((s) => s.id === scriptId) : scripts[0];
      if (found) {
        setScript(found);
        setName(found.name);
        setVersion(found.version);
        setMatchRules(found.matchRules);
        setRunAt(found.runAt);
      }

      const allRules = (await rulesStore.get()) ?? [];
      if (found) {
        setRules(allRules.filter((r) => r.scriptId === found.id));
      }
    }
    load();
  }, [scriptId]);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    draftTimerRef.current = setInterval(() => {
      if (isDirty && editorViewRef.current) {
        const draft: EditorDraft = {
          scriptId: script?.id ?? '',
          name,
          version,
          code: editorViewRef.current.state.doc.toString(),
          matchRules,
          runAt,
          timeout,
          savedAt: Date.now(),
        };
        chrome.storage.session.set({ [DRAFT_KEY]: draft });
      }
    }, 5000);

    return () => {
      if (draftTimerRef.current) clearInterval(draftTimerRef.current);
    };
  }, [isDirty, name, version, matchRules, runAt, timeout, script?.id]);

  // Load draft on mount
  useEffect(() => {
    chrome.storage.session.get(DRAFT_KEY).then((result) => {
      const draft = result[DRAFT_KEY] as EditorDraft | undefined;
      if (draft && draft.scriptId === scriptId && editorViewRef.current) {
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: draft.code,
          },
        });
        setName(draft.name);
        setVersion(draft.version);
        setMatchRules(draft.matchRules);
        setRunAt(draft.runAt);
        setTimeout(draft.timeout);
      }
    });
  }, [scriptId]);

  const handleSaveClick = useCallback(() => {
    setChecklistOpen(true);
  }, []);

  // Keyboard shortcut: Cmd+S / Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveClick();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveClick]);

  const performSave = useCallback(async () => {
    if (!script || !editorViewRef.current) return;

    const code = editorViewRef.current.state.doc.toString();
    const updatedScript: Script = {
      ...script,
      name,
      version,
      code,
      matchRules,
      runAt: runAt as Script['runAt'],
      config: { ...script.config, timeout },
      updatedAt: Date.now(),
    };

    const scripts = (await scriptsStore.get()) ?? [];
    const idx = scripts.findIndex((s) => s.id === script.id);
    if (idx >= 0) {
      scripts[idx] = updatedScript;
    } else {
      scripts.push(updatedScript);
    }
    await scriptsStore.set(scripts);

    // Clear draft
    await chrome.storage.session.remove(DRAFT_KEY);

    setIsDirty(false);
    setChecklistOpen(false);
    setChangelog('');
  }, [script, name, version, matchRules, runAt, timeout]);

  const addMatchRule = () => {
    setMatchRules([...matchRules, '']);
  };

  const updateMatchRule = (index: number, value: string) => {
    const updated = [...matchRules];
    updated[index] = value;
    setMatchRules(updated);
  };

  const removeMatchRule = (index: number) => {
    setMatchRules(matchRules.filter((_, i) => i !== index));
  };

  const hasRulesConfigured = rules.length > 0;
  const lintPassed = true; // TODO: actual lint check
  const testPassed = true; // TODO: actual test check

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-3">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setIsDirty(true);
            }}
            className="w-[200px] font-medium"
            placeholder="脚本名称"
          />
          <Badge variant="outline">v{version}</Badge>
          {isDirty && <Badge variant="warning">未保存</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsDirty(false);
              window.history.back();
            }}
          >
            取消
          </Button>
          <Button size="sm" onClick={handleSaveClick}>
            保存
          </Button>
        </div>
      </div>

      {/* Main content: Left panel + Right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: basic info */}
        <div className="w-[280px] border-r p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-sm font-medium">名称</label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">版本</label>
            <Input
              value={version}
              onChange={(e) => {
                setVersion(e.target.value);
                setIsDirty(true);
              }}
              className="mt-1"
              placeholder="1.0.0"
            />
          </div>

          <div>
            <label className="text-sm font-medium">URL 匹配规则</label>
            <div className="mt-1 space-y-1">
              {matchRules.map((rule, i) => (
                <div key={i} className="flex gap-1">
                  <Input
                    value={rule}
                    onChange={(e) => updateMatchRule(i, e.target.value)}
                    placeholder="*://example.com/*"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => removeMatchRule(i)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={addMatchRule}>
                <Plus className="h-4 w-4 mr-1" /> 添加规则
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">运行时机</label>
            <Select
              value={runAt}
              onValueChange={(v) => {
                setRunAt(v);
                setIsDirty(true);
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document_start">document_start</SelectItem>
                <SelectItem value="document_idle">document_idle</SelectItem>
                <SelectItem value="document_end">document_end</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">超时时间 (ms)</label>
            <Input
              type="number"
              min={1000}
              max={60000}
              value={timeout}
              onChange={(e) => {
                setTimeout(Number(e.target.value));
                setIsDirty(true);
              }}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">字体大小</label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              >
                -
              </Button>
              <span className="text-sm w-8 text-center">{fontSize}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel: CodeMirror editor */}
        <div className="flex-1 overflow-hidden">
          <div ref={editorRef} className="h-full" />
        </div>
      </div>

      {/* Bottom panel: tabs */}
      <div className="border-t">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mx-3 mt-2">
            <TabsTrigger value="rules">规则 ({rules.length})</TabsTrigger>
            <TabsTrigger value="config">配置</TabsTrigger>
            <TabsTrigger value="versions">版本</TabsTrigger>
            <TabsTrigger value="history">历史</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="px-4 pb-3">
            <Card>
              <CardContent className="p-3">
                {rules.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    暂无规则，前往规则配置页面添加
                  </p>
                ) : (
                  <div className="space-y-1">
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.enabled ? 'success' : 'muted'} className="text-xs">
                            {rule.type}
                          </Badge>
                          <span>{rule.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {rule.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="px-4 pb-3">
            <Card>
              <CardContent className="p-3 text-sm text-muted-foreground">
                脚本配置面板（开发中）
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="versions" className="px-4 pb-3">
            <Card>
              <CardContent className="p-3 text-sm text-muted-foreground">
                版本历史面板（开发中）
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="px-4 pb-3">
            <Card>
              <CardContent className="p-3 text-sm text-muted-foreground">
                运行历史面板（开发中）
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Before-save checklist popup */}
      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存前检查</DialogTitle>
            <DialogDescription>请确认以下检查项</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className={hasRulesConfigured ? 'text-green-600' : 'text-yellow-600'}>
                {hasRulesConfigured ? '✓' : '○'}
              </span>
              <span>已配置健康检查规则</span>
              {!hasRulesConfigured && (
                <Badge variant="warning" className="text-xs">
                  未配置
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={lintPassed ? 'text-green-600' : 'text-yellow-600'}>
                {lintPassed ? '✓' : '○'}
              </span>
              <span>代码规范检查通过</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={testPassed ? 'text-green-600' : 'text-yellow-600'}>
                {testPassed ? '✓' : '○'}
              </span>
              <span>测试通过</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">变更说明 *</label>
            <Textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="描述本次修改内容..."
              className="mt-1"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChecklistOpen(false)}>
              取消
            </Button>
            <Button onClick={performSave} disabled={!changelog.trim()}>
              确认保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
