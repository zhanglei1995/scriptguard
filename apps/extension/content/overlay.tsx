import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { OVERLAY_CSS } from './overlay-styles'

export type OverlayStatus = 'success' | 'degraded' | 'failed'

export interface OverlayProps {
  id: string
  status: OverlayStatus
  scriptName: string
  version?: string
  failedRules?: string[]
  errorMessage?: string
  url?: string
  onClose: (id: string) => void
  onDetails: (id: string) => void
  onMute?: (id: string) => void
  onDisable?: (id: string) => void
  onRetest?: (id: string) => void
  onCopyError?: (id: string) => void
  onOpenBackend?: () => void
  onPositionChange?: (id: string, x: number, y: number) => void
}

const STORAGE_KEY = 'sg-overlay-position'

function getStatusConfig(status: OverlayStatus) {
  switch (status) {
    case 'success':
      return { icon: '✅', titleClass: 'sg-overlay__title--success', label: '脚本运行正常' }
    case 'degraded':
      return { icon: '⚠️', titleClass: 'sg-overlay__title--degraded', label: '部分功能异常' }
    case 'failed':
      return { icon: '🔴', titleClass: 'sg-overlay__title--failed', label: '脚本失效' }
  }
}

function loadPosition(id: string): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, { x: number; y: number }>
    return map[id] ?? null
  } catch {
    return null
  }
}

function savePosition(id: string, x: number, y: number): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, { x: number; y: number }>) : {}
    map[id] = { x, y }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export function StatusOverlay({
  id,
  status,
  scriptName,
  version,
  failedRules = [],
  errorMessage,
  url,
  onClose,
  onDetails,
  onMute,
  onDisable,
  onRetest,
  onCopyError,
  onOpenBackend,
  onPositionChange,
}: OverlayProps) {
  const [expanded, setExpanded] = useState(false)
  const [closing, setClosing] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const saved = loadPosition(id)
    return saved ?? { x: window.innerWidth - 376, y: 16 }
  })
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const config = getStatusConfig(status)

  // Success auto-hide after 3s
  useEffect(() => {
    if (status !== 'success') return
    const timer = setTimeout(() => {
      setClosing(true)
      setTimeout(() => onClose(id), 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [status, id, onClose])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setClosing(true)
        setTimeout(() => onClose(id), 300)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [id, onClose])

  // Drag handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      e.preventDefault()
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return
        const dx = ev.clientX - dragRef.current.startX
        const dy = ev.clientY - dragRef.current.startY
        const newX = dragRef.current.origX + dx
        const newY = dragRef.current.origY + dy
        setPos({ x: newX, y: newY })
        containerRef.current?.classList.add('sg-overlay--dragging')
      }

      const onMouseUp = () => {
        if (dragRef.current) {
          const finalPos = { x: dragRef.current.origX, y: dragRef.current.origY }
          const el = containerRef.current
          if (el) {
            finalPos.x = parseInt(el.style.left, 10)
            finalPos.y = parseInt(el.style.top, 10)
          }
          savePosition(id, finalPos.x, finalPos.y)
          onPositionChange?.(id, finalPos.x, finalPos.y)
        }
        dragRef.current = null
        containerRef.current?.classList.remove('sg-overlay--dragging')
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [pos, id, onPositionChange]
  )

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => onClose(id), 300)
  }, [id, onClose])

  const containerStyle: CSSProperties = {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
  }

  return (
    <div
      ref={containerRef}
      className={`sg-overlay sg-overlay--${status}${closing ? ' sg-overlay--closing' : ''}`}
      style={containerStyle}
      role="alert"
      aria-live="polite"
    >
      <div className="sg-overlay__header" onMouseDown={onMouseDown} style={{ cursor: 'grab' }}>
        <span className={`sg-overlay__icon sg-overlay__icon--${status}`}>{config.icon}</span>
        <div className="sg-overlay__content">
          <p className={`sg-overlay__title ${config.titleClass}`}>{config.label}</p>
          <p className="sg-overlay__subtitle">
            {scriptName}
            {version ? ` v${version}` : ''}
          </p>
        </div>
        <button className="sg-overlay__close" onClick={handleClose} aria-label="关闭">
          ✕
        </button>
      </div>

      {status !== 'success' && failedRules.length > 0 && (
        <div className="sg-overlay__body">
          <p className="sg-overlay__subtitle" style={{ margin: 0 }}>
            失败：
          </p>
          <div className="sg-overlay__rules">
            {failedRules.map((rule) => (
              <span
                key={rule}
                className={`sg-overlay__rule-tag${status === 'degraded' ? ' sg-overlay__rule-tag--degraded' : ''}`}
              >
                ❌ {rule}
              </span>
            ))}
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="sg-overlay__actions" style={{ padding: '0 14px 12px' }}>
          <button className="sg-overlay__btn sg-overlay__btn--secondary" onClick={() => onDetails(id)}>
            详情
          </button>
        </div>
      )}

      {status === 'degraded' && (
        <div className="sg-overlay__actions" style={{ padding: '0 14px 12px' }}>
          <button className="sg-overlay__btn sg-overlay__btn--primary" onClick={() => onDetails(id)}>
            详情
          </button>
          {onMute && (
            <button className="sg-overlay__btn sg-overlay__btn--warning" onClick={() => onMute(id)}>
              静默1小时
            </button>
          )}
        </div>
      )}

      {status === 'failed' && !expanded && (
        <div className="sg-overlay__actions" style={{ padding: '0 14px 12px' }}>
          <button className="sg-overlay__btn sg-overlay__btn--primary" onClick={() => setExpanded(true)}>
            📋 查看
          </button>
          {onMute && (
            <button className="sg-overlay__btn sg-overlay__btn--secondary" onClick={() => onMute(id)}>
              🔇 静音
            </button>
          )}
          {onDisable && (
            <button className="sg-overlay__btn sg-overlay__btn--danger" onClick={() => onDisable(id)}>
              ⏸ 禁用脚本
            </button>
          )}
        </div>
      )}

      {status === 'failed' && expanded && (
        <div className="sg-overlay__expand">
          <div className="sg-overlay__expand-content">
            {url && (
              <div className="sg-overlay__expand-row">
                <span className="sg-overlay__expand-label">URL：</span>
                <span className="sg-overlay__expand-value">{url}</span>
              </div>
            )}
            {failedRules.length > 0 && (
              <>
                <div className="sg-overlay__expand-row">
                  <span className="sg-overlay__expand-label">失败规则：</span>
                  <span className="sg-overlay__expand-value">{failedRules.length}</span>
                </div>
                {failedRules.map((rule) => (
                  <div key={rule} className="sg-overlay__expand-row" style={{ paddingLeft: 8 }}>
                    <span className="sg-overlay__expand-value">❌ {rule}</span>
                  </div>
                ))}
              </>
            )}
            {errorMessage && (
              <div className="sg-overlay__stack">{errorMessage}</div>
            )}
          </div>
          <div className="sg-overlay__actions" style={{ marginTop: 8 }}>
            {onRetest && (
              <button className="sg-overlay__btn sg-overlay__btn--primary" onClick={() => onRetest(id)}>
                🧪 重新测试
              </button>
            )}
            {onCopyError && (
              <button className="sg-overlay__btn sg-overlay__btn--secondary" onClick={() => onCopyError(id)}>
                📋 复制错误
              </button>
            )}
            {onMute && (
              <button className="sg-overlay__btn sg-overlay__btn--secondary" onClick={() => onMute(id)}>
                🔇 静音1小时
              </button>
            )}
            {onDisable && (
              <button className="sg-overlay__btn sg-overlay__btn--danger" onClick={() => onDisable(id)}>
                ⏸ 禁用此页脚本
              </button>
            )}
            {onOpenBackend && (
              <button className="sg-overlay__btn sg-overlay__btn--secondary" onClick={onOpenBackend}>
                ⚙ 打开管理后台
              </button>
            )}
          </div>
          <div className="sg-overlay__actions" style={{ marginTop: 4, padding: '0 0 4px' }}>
            <button className="sg-overlay__btn sg-overlay__btn--secondary" onClick={() => setExpanded(false)}>
              ▲ 折叠
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ====== OverlayManager ======

export interface OverlayOptions {
  scriptId: string
  status: OverlayStatus
  scriptName: string
  version?: string
  failedRules?: string[]
  errorMessage?: string
  url?: string
  onDetails?: (id: string) => void
  onMute?: (id: string) => void
  onDisable?: (id: string) => void
  onRetest?: (id: string) => void
  onCopyError?: (id: string) => void
}

interface OverlayInstance {
  id: string
  host: HTMLDivElement
  root: Root
}

export class OverlayManager {
  private instances: Map<string, OverlayInstance> = new Map()
  private focusedIndex: number = -1
  private styleElement: HTMLStyleElement | null = null

  private ensureStyles(): void {
    if (this.styleElement || typeof document === 'undefined') return
    this.styleElement = document.createElement('style')
    this.styleElement.textContent = OVERLAY_CSS
    document.head.appendChild(this.styleElement)
  }

  show(options: OverlayOptions): void {
    this.ensureStyles()
    this.hide(options.scriptId)

    const host = document.createElement('div')
    host.id = `sg-overlay-${options.scriptId}`
    host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483646;pointer-events:none;'
    document.body.appendChild(host)

    const root = createRoot(host)

    const handleClose = (id: string) => {
      this.hide(id)
    }

    const handleDetails = (id: string) => {
      options.onDetails?.(id)
      chrome.runtime?.sendMessage({ type: 'OPEN_OPTIONS', payload: { scriptId: id } }).catch(() => {
        chrome.runtime?.openOptionsPage?.()
      })
    }

    const handleOpenBackend = () => {
      chrome.runtime?.openOptionsPage?.()
    }

    root.render(
      <StatusOverlay
        id={options.scriptId}
        status={options.status}
        scriptName={options.scriptName}
        version={options.version}
        failedRules={options.failedRules}
        errorMessage={options.errorMessage}
        url={options.url}
        onClose={handleClose}
        onDetails={handleDetails}
        onMute={options.onMute}
        onDisable={options.onDisable}
        onRetest={options.onRetest}
        onCopyError={options.onCopyError}
        onOpenBackend={handleOpenBackend}
      />
    )

    this.instances.set(options.scriptId, { id: options.scriptId, host, root })
    this.setupKeyboardNavigation()
  }

  hide(scriptId: string): void {
    const instance = this.instances.get(scriptId)
    if (!instance) return
    instance.root.unmount()
    instance.host.remove()
    this.instances.delete(scriptId)
    this.setupKeyboardNavigation()
  }

  hideAll(): void {
    for (const [id] of this.instances) {
      this.hide(id)
    }
  }

  getVisibleIds(): string[] {
    return Array.from(this.instances.keys())
  }

  private setupKeyboardNavigation(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    if (this.instances.size > 1) {
      window.addEventListener('keydown', this.handleKeyDown)
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const ids = this.getVisibleIds()
    if (ids.length === 0) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      this.focusedIndex = (this.focusedIndex + 1) % ids.length
      this.highlightOverlay(ids[this.focusedIndex])
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      this.focusedIndex = (this.focusedIndex - 1 + ids.length) % ids.length
      this.highlightOverlay(ids[this.focusedIndex])
    }
  }

  private highlightOverlay(id: string): void {
    const instance = this.instances.get(id)
    if (!instance) return
    const el = instance.host.firstElementChild as HTMLElement | null
    if (el) {
      el.style.outline = '2px solid #3b82f6'
      el.style.outlineOffset = '2px'
      setTimeout(() => {
        el.style.outline = ''
        el.style.outlineOffset = ''
      }, 1500)
    }
  }

  destroy(): void {
    this.hideAll()
    window.removeEventListener('keydown', this.handleKeyDown)
    this.styleElement?.remove()
    this.styleElement = null
  }
}

// Singleton
let managerInstance: OverlayManager | null = null

export function getOverlayManager(): OverlayManager {
  if (!managerInstance) {
    managerInstance = new OverlayManager()
  }
  return managerInstance
}
