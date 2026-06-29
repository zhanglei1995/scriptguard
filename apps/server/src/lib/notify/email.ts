import type { NotifyChannelAdapter, NotifyPayload } from './types.js';

interface EmailConfig {
  to: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
}

async function sendWithRetry(
  fn: () => Promise<void>,
  maxAttempts = 3,
): Promise<{ success: boolean; error?: string }> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      await fn();
      return { success: true };
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  return { success: false, error: 'Exhausted retries' };
}

function buildHtml(payload: NotifyPayload): string {
  const levelColors: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };
  const color = levelColors[payload.level] ?? '#6b7280';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f9fafb;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:${color};padding:16px 24px;">
      <h1 style="color:#fff;margin:0;font-size:18px;">${payload.title}</h1>
    </div>
    <div style="padding:24px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">${payload.body}</p>
      ${payload.url ? `<a href="${payload.url}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;">View Details</a>` : ''}
    </div>
    <div style="padding:12px 24px;background:#f3f4f6;color:#6b7280;font-size:12px;">
      ScriptGuard Alert · ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;
}

export class EmailChannel implements NotifyChannelAdapter {
  async send(
    config: Record<string, unknown>,
    payload: NotifyPayload,
  ): Promise<{ success: boolean; error?: string }> {
    const channelConfig = config as unknown as EmailConfig;
    if (!channelConfig.to) return { success: false, error: 'Missing email address' };

    const smtpHost =
      channelConfig.SMTP_HOST ?? (config.SMTP_HOST as string) ?? (config.SMTP_HOST as string);
    const smtpPort =
      channelConfig.SMTP_PORT ?? (config.SMTP_PORT as number) ?? (config.SMTP_PORT as number);
    const smtpUser =
      channelConfig.SMTP_USER ?? (config.SMTP_USER as string) ?? (config.SMTP_USER as string);
    const smtpPass =
      channelConfig.SMTP_PASS ?? (config.SMTP_PASS as string) ?? (config.SMTP_PASS as string);
    const smtpFrom =
      channelConfig.SMTP_FROM ?? (config.SMTP_FROM as string) ?? (config.SMTP_FROM as string);

    if (!smtpHost) return { success: false, error: 'SMTP_HOST not configured' };

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: String(smtpHost),
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: smtpUser ? { user: String(smtpUser), pass: String(smtpPass) } : undefined,
    });

    return sendWithRetry(async () => {
      await transporter.sendMail({
        from: String(smtpFrom || smtpUser),
        to: String(channelConfig.to),
        subject: payload.title,
        html: buildHtml(payload),
      });
    });
  }
}
