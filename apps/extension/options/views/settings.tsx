/**
 * Settings - 设置页面
 * SG-045: 设置页面（通知 + 通用）
 */

import { useEffect, useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Switch } from '../../components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog'
import { Badge } from '../../components/ui/badge'
import { Empty } from '../../components/ui/empty'
import { preferencesStore, channelsStore, defaultPreferences } from '../../storage/chrome'
import {
  type UserPreferences as Prefs,
  type NotifyChannel,
} from '../../storage/schemas'

export function SettingsTab() {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">通用</TabsTrigger>
        <TabsTrigger value="notifications">通知</TabsTrigger>
        <TabsTrigger value="integrations">集成</TabsTrigger>
        <TabsTrigger value="account">账户</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <GeneralSettings />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationSettings />
      </TabsContent>
      <TabsContent value="integrations">
        <IntegrationSettings />
      </TabsContent>
      <TabsContent value="account">
        <AccountSettings />
      </TabsContent>
    </Tabs>
  )
}

// ====== General Settings ======
function GeneralSettings() {
  const [prefs, setPrefs] = useState<Prefs>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    preferencesStore.get().then((p) => {
      if (p) setPrefs(p)
      setLoading(false)
    })
  }, [])

  const save = async (patch: Partial<Prefs>) => {
    const updated = { ...prefs, ...patch }
    setPrefs(updated)
    setSaving(true)
    await preferencesStore.set(updated)
    setSaving(false)
  }

  if (loading) {
    return <div className="text-center py-8 text-sm text-muted-foreground">加载中...</div>
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">外观</CardTitle>
          <CardDescription>自定义界面外观</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">主题</div>
              <div className="text-xs text-muted-foreground">选择界面主题</div>
            </div>
            <Select
              value={prefs.theme}
              onValueChange={(v) => save({ theme: v as Prefs['theme'] })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">浅色</SelectItem>
                <SelectItem value="dark">深色</SelectItem>
                <SelectItem value="system">跟随系统</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">语言</div>
              <div className="text-xs text-muted-foreground">选择界面语言</div>
            </div>
            <Select
              value={prefs.language}
              onValueChange={(v) => save({ language: v })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">检测</CardTitle>
          <CardDescription>配置自动检测行为</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">自动检测</div>
              <div className="text-xs text-muted-foreground">页面加载时自动检查脚本状态</div>
            </div>
            <Switch
              checked={prefs.autoCheck}
              onCheckedChange={(checked) => save({ autoCheck: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">检测间隔（分钟）</div>
              <div className="text-xs text-muted-foreground">自动检测的默认间隔</div>
            </div>
            <Input
              type="number"
              min={1}
              max={1440}
              className="w-[100px]"
              value={prefs.defaultIntervalMinutes}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (v > 0) save({ defaultIntervalMinutes: v })
              }}
            />
          </div>
        </CardContent>
      </Card>

      {saving && (
        <div className="text-xs text-muted-foreground text-center">保存中...</div>
      )}
    </div>
  )
}

// ====== Notification Settings ======
function NotificationSettings() {
  const [channels, setChannels] = useState<NotifyChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<NotifyChannel | null>(null)

  const loadChannels = useCallback(async () => {
    const data = await channelsStore.get()
    setChannels(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadChannels()
  }, [loadChannels])

  const handleAdd = () => {
    setEditingChannel(null)
    setDialogOpen(true)
  }

  const handleEdit = (channel: NotifyChannel) => {
    setEditingChannel(channel)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const updated = channels.filter((c) => c.id !== id)
    await channelsStore.set(updated)
    setChannels(updated)
  }

  const handleTest = (channel: NotifyChannel) => {
    alert(`测试通知已发送到 ${channel.type} 渠道`)
  }

  const channelTypeLabel: Record<string, string> = {
    browser: '浏览器通知',
    email: '邮件',
    webhook: 'Webhook',
  }

  if (loading) {
    return <div className="text-center py-8 text-sm text-muted-foreground">加载中...</div>
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">通知渠道</div>
          <div className="text-xs text-muted-foreground">配置告警通知的接收方式</div>
        </div>
        <Button size="sm" onClick={handleAdd}>
          添加渠道
        </Button>
      </div>

      {channels.length === 0 ? (
        <Empty
          title="暂无通知渠道"
          description="添加通知渠道以接收脚本告警"
        />
      ) : (
        <div className="space-y-2">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Badge variant={channel.enabled ? 'success' : 'muted'}>
                    {channel.enabled ? '已启用' : '已禁用'}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium">
                      {channelTypeLabel[channel.type] ?? channel.type}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {Object.entries(channel.config)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ') || '无配置'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleTest(channel)}>
                    测试
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(channel)}>
                    编辑
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(channel.id)}>
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ChannelDialog
        open={dialogOpen}
        channel={editingChannel}
        onClose={() => setDialogOpen(false)}
        onSave={async (ch) => {
          let updated: NotifyChannel[]
          if (editingChannel) {
            updated = channels.map((c) => (c.id === ch.id ? ch : c))
          } else {
            updated = [...channels, ch]
          }
          await channelsStore.set(updated)
          setChannels(updated)
          setDialogOpen(false)
        }}
      />
    </div>
  )
}

function ChannelDialog({
  open,
  channel,
  onClose,
  onSave,
}: {
  open: boolean
  channel: NotifyChannel | null
  onClose: () => void
  onSave: (ch: NotifyChannel) => void
}) {
  const [type, setType] = useState<string>(channel?.type ?? 'browser')
  const [configStr, setConfigStr] = useState(
    channel ? JSON.stringify(channel.config, null, 2) : '{}'
  )

  useEffect(() => {
    if (channel) {
      setType(channel.type)
      setConfigStr(JSON.stringify(channel.config, null, 2))
    } else {
      setType('browser')
      setConfigStr('{}')
    }
  }, [channel])

  const handleSave = () => {
    try {
      const config = JSON.parse(configStr) as Record<string, string>
      onSave({
        id: channel?.id ?? crypto.randomUUID(),
        type: type as NotifyChannel['type'],
        enabled: channel?.enabled ?? true,
        config,
      })
    } catch {
      alert('配置 JSON 格式错误')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{channel ? '编辑渠道' : '添加渠道'}</DialogTitle>
          <DialogDescription>配置通知渠道参数</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">类型</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="browser">浏览器通知</SelectItem>
                <SelectItem value="email">邮件</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">配置 (JSON)</label>
            <textarea
              className="mt-1 w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={configStr}
              onChange={(e) => setConfigStr(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ====== Integration Settings ======
function IntegrationSettings() {
  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tampermonkey 导入</CardTitle>
          <CardDescription>从 Tampermonkey 导入用户脚本</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => alert('Tampermonkey 导入功能开发中...')}>
            导入脚本
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">GitHub Actions</CardTitle>
          <CardDescription>配置 GitHub Actions CI 集成</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">GitHub Token</label>
            <Input type="password" placeholder="ghp_xxxx" className="mt-1" disabled />
          </div>
          <div>
            <label className="text-sm font-medium">仓库地址</label>
            <Input placeholder="owner/repo" className="mt-1" disabled />
          </div>
          <p className="text-xs text-muted-foreground">GitHub Actions 集成功能开发中...</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ====== Account Settings ======
function AccountSettings() {
  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">账户信息</CardTitle>
          <CardDescription>管理你的 ScriptGuard 账户</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="text-4xl mb-3">👤</div>
            <p className="text-sm text-muted-foreground mb-4">尚未登录</p>
            <Button onClick={() => alert('登录功能开发中...')}>登录 / 注册</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">订阅计划</CardTitle>
          <CardDescription>查看当前订阅状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary">免费版</Badge>
              <p className="text-xs text-muted-foreground mt-1">基础监控功能</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              升级计划
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
