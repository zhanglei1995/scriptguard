import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PopupApp from '~popup';
import { useScriptsStore } from '~store/scripts';

// Mock chrome.tabs.query
const mockQuery = vi.fn();
Object.defineProperty(chrome.tabs, 'query', { value: mockQuery, writable: true });

// Mock chrome.runtime.openOptionsPage
const mockOpenOptions = vi.fn();
Object.defineProperty(chrome.runtime, 'openOptionsPage', {
  value: mockOpenOptions,
  writable: true,
});

// Mock chrome.runtime.sendMessage
const mockSendMessage = vi.fn();
Object.defineProperty(chrome.runtime, 'sendMessage', {
  value: mockSendMessage,
  writable: true,
});

describe('PopupApp', () => {
  beforeEach(() => {
    useScriptsStore.setState({ scripts: [], filter: {} });
    mockQuery.mockResolvedValue([{ url: 'https://example.com/orders/1234' }]);
    mockOpenOptions.mockClear();
    mockSendMessage.mockClear();
  });

  it('renders loading state initially', () => {
    render(<PopupApp />);
    expect(screen.getByText('加载中...')).toBeTruthy();
  });

  it('shows current URL after loading', async () => {
    render(<PopupApp />);
    await waitFor(() => {
      expect(screen.getByText('example.com/orders/1234')).toBeTruthy();
    });
  });

  it('shows empty state when no scripts match', async () => {
    render(<PopupApp />);
    await waitFor(() => {
      expect(screen.getByText('📭')).toBeTruthy();
      expect(screen.getByText('当前页面没有匹配的脚本')).toBeTruthy();
    });
  });

  it('shows matched scripts', async () => {
    useScriptsStore.getState().createScript({
      name: '订单页增强工具',
      version: '1.3.2',
      matchRules: ['example.com/orders/*'],
    });

    render(<PopupApp />);
    await waitFor(() => {
      expect(screen.getByText('订单页增强工具')).toBeTruthy();
      expect(screen.getByText('v1.3.2')).toBeTruthy();
      expect(screen.getByText('匹配脚本 (1)')).toBeTruthy();
    });
  });

  it('clicking open options calls chrome.runtime.openOptionsPage', async () => {
    render(<PopupApp />);
    await waitFor(() => {
      expect(screen.getByText('⚙ 打开后台')).toBeTruthy();
    });

    screen.getByText('⚙ 打开后台').click();
    expect(mockOpenOptions).toHaveBeenCalled();
  });

  it('displays header with ScriptGuard branding', async () => {
    render(<PopupApp />);
    await waitFor(() => {
      expect(screen.getByText('ScriptGuard')).toBeTruthy();
    });
  });

  it('shows bottom tab bar', async () => {
    render(<PopupApp />);
    await waitFor(() => {
      expect(screen.getByText('通知')).toBeTruthy();
      expect(screen.getByText('报告')).toBeTruthy();
      expect(screen.getByText('设置')).toBeTruthy();
    });
  });

  it('truncates long URLs', async () => {
    const longPath = '/orders/' + '1'.repeat(50);
    mockQuery.mockResolvedValue([{ url: `https://example.com${longPath}` }]);

    render(<PopupApp />);
    await waitFor(() => {
      const urlEl = screen.getByText(/example\.com/);
      expect(urlEl.textContent!.length).toBeLessThanOrEqual(50);
    });
  });

  it('handles missing tab URL gracefully', async () => {
    mockQuery.mockResolvedValue([{}]);

    render(<PopupApp />);
    await waitFor(() => {
      expect(screen.getByText('未知页面')).toBeTruthy();
    });
  });
});
