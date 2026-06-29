export const OVERLAY_CSS = `
@keyframes sg-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

@keyframes sg-slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes sg-slide-out {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

@keyframes sg-fade-in {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 500px; }
}

.sg-overlay {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2147483646;
  min-width: 360px;
  max-width: 420px;
  font-family: 'Inter', 'PingFang SC', -apple-system, system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #0f172a;
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: sg-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
  overflow: hidden;
}

.sg-overlay--closing {
  animation: sg-slide-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.sg-overlay--dragging {
  transition: none !important;
  cursor: grabbing !important;
}

.sg-overlay--success {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.sg-overlay--degraded {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.sg-overlay--failed {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  animation: sg-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1), sg-shake 0.6s 0.3s;
}

.sg-overlay__header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px 8px;
}

.sg-overlay__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  margin-top: 1px;
}

.sg-overlay__icon--success { color: #10b981; }
.sg-overlay__icon--degraded { color: #f59e0b; }
.sg-overlay__icon--failed { color: #ef4444; }

.sg-overlay__content {
  flex: 1;
  min-width: 0;
}

.sg-overlay__title {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  line-height: 1.4;
}

.sg-overlay__title--success { color: #059669; }
.sg-overlay__title--degraded { color: #d97706; }
.sg-overlay__title--failed { color: #dc2626; }

.sg-overlay__subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 2px 0 0;
}

.sg-overlay__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 6px;
  padding: 0;
  font-size: 16px;
  line-height: 1;
  transition: background 0.15s, color 0.15s;
}

.sg-overlay__close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #475569;
}

.sg-overlay__body {
  padding: 0 14px 12px;
}

.sg-overlay__rules {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.sg-overlay__rule-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.sg-overlay__rule-tag--degraded {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.sg-overlay__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.sg-overlay__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}

.sg-overlay__btn:hover {
  opacity: 0.85;
}

.sg-overlay__btn--primary {
  background: #3b82f6;
  color: #fff;
}

.sg-overlay__btn--secondary {
  background: rgba(0, 0, 0, 0.06);
  color: #475569;
}

.sg-overlay__btn--danger {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.sg-overlay__btn--warning {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.sg-overlay__expand {
  padding: 0 14px 12px;
  animation: sg-fade-in 0.2s ease;
}

.sg-overlay__expand-content {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
}

.sg-overlay__expand-row {
  display: flex;
  gap: 8px;
  padding: 3px 0;
}

.sg-overlay__expand-label {
  color: #94a3b8;
  min-width: 60px;
  flex-shrink: 0;
}

.sg-overlay__expand-value {
  color: #334155;
  word-break: break-all;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px;
}

.sg-overlay__stack {
  margin-top: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 6px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px;
  color: #64748b;
  max-height: 120px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (prefers-color-scheme: dark) {
  .sg-overlay { color: #f1f5f9; }
  .sg-overlay--success { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.35); }
  .sg-overlay--degraded { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.35); }
  .sg-overlay--failed { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.35); }
  .sg-overlay__subtitle { color: #94a3b8; }
  .sg-overlay__close { color: #64748b; }
  .sg-overlay__close:hover { background: rgba(255, 255, 255, 0.08); color: #cbd5e1; }
  .sg-overlay__title--success { color: #34d399; }
  .sg-overlay__title--degraded { color: #fbbf24; }
  .sg-overlay__title--failed { color: #f87171; }
  .sg-overlay__rule-tag { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .sg-overlay__rule-tag--degraded { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
  .sg-overlay__btn--secondary { background: rgba(255, 255, 255, 0.08); color: #cbd5e1; }
  .sg-overlay__btn--danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  .sg-overlay__btn--warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
  .sg-overlay__expand-content { background: rgba(255, 255, 255, 0.04); }
  .sg-overlay__expand-label { color: #64748b; }
  .sg-overlay__expand-value { color: #e2e8f0; }
  .sg-overlay__stack { background: rgba(255, 255, 255, 0.05); color: #94a3b8; }
}
`;
