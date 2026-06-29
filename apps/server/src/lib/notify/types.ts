export interface NotifyPayload {
  title: string;
  body: string;
  level: string;
  url?: string;
}

export interface NotifyChannelAdapter {
  send(
    config: Record<string, unknown>,
    payload: NotifyPayload,
  ): Promise<{ success: boolean; error?: string }>;
}
