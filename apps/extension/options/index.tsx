/**
 * Options Page - 扩展选项页
 * SG-024: Options 页面骨架
 * SG-048: React.lazy code splitting
 * SG-026: 脚本编辑器 MVP
 * SG-027: 健康检查规则配置 UI
 */

import { lazy, Suspense, useState } from 'react';
import type { PlasmoGetStyle } from 'plasmo';
import { cn } from '../lib/utils';
import { ThemeProvider, ThemeToggle } from '../components/ui/theme-provider';
import { Button } from '../components/ui/button';
import {
  LayoutDashboard,
  FileCode,
  FlaskConical,
  Bell,
  ScrollText,
  Settings,
  Info,
  Search,
  BellRing,
  Menu,
  X,
  ArrowLeft,
  Plus,
} from 'lucide-react';

const DashboardTab = lazy(() =>
  import('./views/dashboard').then((mod) => ({ default: mod.DashboardTab })),
);

const ScriptsTab = lazy(() =>
  import('./views/scripts').then((mod) => ({ default: mod.ScriptsTab })),
);

const TestReportsTab = lazy(() =>
  import('./views/test-reports').then((mod) => ({ default: mod.TestReportsTab })),
);

const AlertsTab = lazy(() => import('./views/alerts').then((mod) => ({ default: mod.AlertsTab })));

const LogsTab = lazy(() =>
  import('./logs').then((mod) => {
    performance.mark('logs-tab-loaded');
    return { default: mod.LogsTab };
  }),
);

const SettingsTab = lazy(() =>
  import('./views/settings').then((mod) => ({ default: mod.SettingsTab })),
);

const ImportTab = lazy(() => import('./import-tab').then((mod) => ({ default: mod.ImportTab })));

const EditorView = lazy(() =>
  import('./views/editor').then((mod) => ({ default: mod.EditorView })),
);

const RulesView = lazy(() => import('./views/rules').then((mod) => ({ default: mod.RulesView })));

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement('style');
  style.textContent = `
    body { width: 960px; min-height: 640px; margin: 0; }
  `;
  return style;
};

type TabId = 'overview' | 'scripts' | 'tests' | 'alerts' | 'logs' | 'settings' | 'import' | 'about';

type SubView = { type: 'editor'; scriptId?: string } | { type: 'rules'; scriptId?: string } | null;

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'overview', label: '概览', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'scripts', label: '脚本', icon: <FileCode className="h-4 w-4" /> },
  { id: 'tests', label: '测试', icon: <FlaskConical className="h-4 w-4" /> },
  { id: 'alerts', label: '告警', icon: <Bell className="h-4 w-4" /> },
  { id: 'logs', label: '日志', icon: <ScrollText className="h-4 w-4" /> },
  { id: 'import', label: '导入', icon: <Plus className="h-4 w-4" /> },
  { id: 'settings', label: '设置', icon: <Settings className="h-4 w-4" /> },
  { id: 'about', label: '关于', icon: <Info className="h-4 w-4" /> },
];

function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
      加载中...
    </div>
  );
}

function AboutView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="text-2xl">🛡️</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">ScriptGuard</h2>
          <p className="text-sm text-muted-foreground">v0.1.0 · 用户脚本健康监控与管理平台</p>
        </div>
      </div>
      <div className="text-sm text-muted-foreground space-y-2">
        <p>监控脚本健康状态，自动检测变更和异常行为。</p>
        <p>支持 Tampermonkey/Greasemonkey 脚本导入、定时检测、告警通知等功能。</p>
      </div>
    </div>
  );
}

function OptionsPageInner() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subView, setSubView] = useState<SubView>(null);

  if (subView?.type === 'editor') {
    return (
      <div className="flex h-screen bg-background text-foreground">
        <Suspense fallback={<TabLoadingFallback />}>
          <EditorView scriptId={subView.scriptId} />
        </Suspense>
      </div>
    );
  }

  if (subView?.type === 'rules') {
    return (
      <div className="flex h-screen bg-background text-foreground flex-col">
        <header className="flex h-12 items-center border-b px-4">
          <Button variant="ghost" size="sm" onClick={() => setSubView(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Suspense fallback={<TabLoadingFallback />}>
            <RulesView scriptId={subView.scriptId} />
          </Suspense>
        </main>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardTab />;
      case 'scripts':
        return <ScriptsTab />;
      case 'tests':
        return <TestReportsTab />;
      case 'alerts':
        return <AlertsTab />;
      case 'logs':
        return <LogsTab />;
      case 'import':
        return <ImportTab />;
      case 'settings':
        return <SettingsTab />;
      case 'about':
        return <AboutView />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-all duration-base',
          sidebarOpen ? 'w-48' : 'w-0 overflow-hidden',
          'max-md:hidden',
        )}
      >
        <div className="flex h-12 items-center gap-2 border-b px-4">
          <span className="text-lg">🛡️</span>
          <span className="text-sm font-semibold truncate">ScriptGuard</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                activeTab === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="flex h-12 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <span className="text-sm font-semibold">ScriptGuard</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-0.5 p-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center gap-3 border-b px-4">
          <button className="max-md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索..."
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex-1" />

          <button className="relative h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </button>

          <ThemeToggle />

          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
            U
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Suspense fallback={<TabLoadingFallback />}>{renderContent()}</Suspense>
        </main>
      </div>
    </div>
  );
}

function OptionsPage() {
  return (
    <ThemeProvider>
      <OptionsPageInner />
    </ThemeProvider>
  );
}

export default OptionsPage;
