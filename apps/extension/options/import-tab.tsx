/**
 * Import Tab - Tampermonkey 导入功能
 * SG-055: Tampermonkey 协同与导入
 */

import { useState, useCallback, useRef } from 'react';
import {
  importUserScript,
  parseTampermonkeyBackup,
  backupScriptToImportedScript,
  saveImportedScripts,
  type ImportedScript,
} from '../lib/tampermonkey';

interface ImportResult {
  success: boolean;
  count: number;
  scripts: ImportedScript[];
  errors: string[];
}

export function ImportTab() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImporting(true);
    setResult(null);

    const importedScripts: ImportedScript[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      try {
        const content = await file.text();

        if (file.name.endsWith('.json')) {
          // Tampermonkey backup JSON
          const backupScripts = parseTampermonkeyBackup(content);
          for (const bs of backupScripts) {
            importedScripts.push(backupScriptToImportedScript(bs));
          }
        } else if (file.name.endsWith('.js') || file.name.endsWith('.user.js')) {
          const script = importUserScript(content);
          if (script) {
            importedScripts.push(script);
          } else {
            errors.push(`${file.name}: 无法解析 UserScript 元数据`);
          }
        } else {
          errors.push(`${file.name}: 不支持的文件格式`);
        }
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    }

    if (importedScripts.length > 0) {
      await saveImportedScripts(importedScripts);
    }

    setResult({
      success: importedScripts.length > 0,
      count: importedScripts.length,
      scripts: importedScripts,
      errors,
    });
    setImporting(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileImport(e.dataTransfer.files);
    },
    [handleFileImport],
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Tampermonkey 脚本导入</h3>
        <p className="text-sm text-muted-foreground mb-4">
          支持导入 .user.js 文件和 Tampermonkey 备份 JSON 文件
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="text-4xl mb-3">📦</div>
        <p className="text-sm font-medium mb-1">拖拽文件到此处</p>
        <p className="text-xs text-muted-foreground mb-4">或使用下方按钮选择文件</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".user.js,.js"
          multiple
          className="hidden"
          onChange={(e) => handleFileImport(e.target.files)}
        />
        <input
          ref={backupInputRef}
          type="file"
          accept=".json"
          multiple
          className="hidden"
          onChange={(e) => handleFileImport(e.target.files)}
        />

        <div className="flex gap-2 justify-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            选择 .user.js 文件
          </button>
          <button
            onClick={() => backupInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
          >
            选择备份 JSON
          </button>
        </div>
      </div>

      {/* Import Progress */}
      {importing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          正在导入...
        </div>
      )}

      {/* Import Result */}
      {result && (
        <div
          className={`rounded-lg p-4 text-sm ${
            result.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {result.success && (
            <div className="mb-2">
              <p className="font-medium">导入成功</p>
              <p>已导入 {result.count} 个脚本</p>
            </div>
          )}

          {result.scripts.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.scripts.map((script) => (
                <div key={script.id} className="flex items-center gap-2 text-xs">
                  <span className="text-green-600">✓</span>
                  <span className="font-medium">{script.name}</span>
                  <span className="text-muted-foreground">v{script.version}</span>
                  <span className="text-muted-foreground">
                    ({script.matchRules.length} 个匹配规则)
                  </span>
                </div>
              ))}
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.errors.map((error, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                  <span>✗</span>
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Help */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">支持的格式：</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>
            <code className="bg-muted px-1 rounded">.user.js</code> - Tampermonkey/Greasemonkey
            用户脚本文件
          </li>
          <li>
            <code className="bg-muted px-1 rounded">.json</code> - Tampermonkey 备份文件（包含
            scripts 数组）
          </li>
        </ul>
        <p className="mt-2">导入的脚本将自动解析 @match/@include 规则并添加到脚本管理列表中。</p>
      </div>
    </div>
  );
}
