/**
 * 消息类型定义
 * 关联: TDD §5.1 内部 API
 */

export type HealthStatus = 'healthy' | 'degraded' | 'failed' | 'unknown';

export type RunAt = 'document_start' | 'document_idle' | 'document_end' | 'manual';

export type AlertLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PublicScript {
  id: string;
  name: string;
  version: string;
  runAt: RunAt;
  code: string;
  rules: PublicCheckRule[];
}

export interface PublicCheckRule {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  required: boolean;
  timeout: number;
  alertLevel: AlertLevel;
}

export interface CheckReport {
  scriptId: string;
  status: HealthStatus;
  url: string;
  duration: number;
  failedRules: string[];
  errorMessage?: string;
}

// Background ↔ Content Script 消息
export type BackgroundMessage =
  | { type: 'GET_SCRIPTS_FOR_URL'; payload: { url: string } }
  | { type: 'REPORT_CHECK'; payload: CheckReport }
  | { type: 'PING' };

export type BackgroundResponse =
  | { type: 'SCRIPTS_RESULT'; scripts: PublicScript[] }
  | { type: 'PONG'; timestamp: number }
  | { ok: true }
  | { ok: false; error: string };
