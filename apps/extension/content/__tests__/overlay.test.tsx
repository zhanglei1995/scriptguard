import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StatusOverlay, type OverlayProps } from '../overlay';

function makeProps(overrides: Partial<OverlayProps> = {}): OverlayProps {
  return {
    id: 'test-script',
    status: 'success',
    scriptName: 'Test Script',
    version: '1.0.0',
    onClose: vi.fn(),
    onDetails: vi.fn(),
    ...overrides,
  };
}

describe('StatusOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('success state', () => {
    it('renders success icon and label', () => {
      render(<StatusOverlay {...makeProps()} />);
      expect(screen.getByText('✅')).toBeDefined();
      expect(screen.getByText('脚本运行正常')).toBeDefined();
    });

    it('shows script name and version', () => {
      render(<StatusOverlay {...makeProps()} />);
      expect(screen.getByText('Test Script v1.0.0')).toBeDefined();
    });

    it('shows details button', () => {
      render(<StatusOverlay {...makeProps()} />);
      expect(screen.getByText('详情')).toBeDefined();
    });

    it('auto-hides after 3s', () => {
      const onClose = vi.fn();
      render(<StatusOverlay {...makeProps({ onClose })} />);

      act(() => {
        vi.advanceTimersByTime(3300);
      });
      expect(onClose).toHaveBeenCalledWith('test-script');
    });
  });

  describe('degraded state', () => {
    it('renders degraded icon and label', () => {
      render(
        <StatusOverlay {...makeProps({ status: 'degraded', failedRules: ['selector-missing'] })} />,
      );
      expect(screen.getByText('⚠️')).toBeDefined();
      expect(screen.getByText('部分功能异常')).toBeDefined();
    });

    it('shows failed rules', () => {
      render(
        <StatusOverlay {...makeProps({ status: 'degraded', failedRules: ['rule-a', 'rule-b'] })} />,
      );
      expect(screen.getByText(/rule-a/)).toBeDefined();
      expect(screen.getByText(/rule-b/)).toBeDefined();
    });

    it('shows mute button when onMute provided', () => {
      const onMute = vi.fn();
      render(<StatusOverlay {...makeProps({ status: 'degraded', failedRules: ['r1'], onMute })} />);
      expect(screen.getByText('静默1小时')).toBeDefined();
    });

    it('does not auto-hide', () => {
      const onClose = vi.fn();
      render(
        <StatusOverlay {...makeProps({ status: 'degraded', failedRules: ['r1'], onClose })} />,
      );
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('failed state', () => {
    it('renders failed icon and label', () => {
      render(<StatusOverlay {...makeProps({ status: 'failed', failedRules: ['r1'] })} />);
      expect(screen.getByText('🔴')).toBeDefined();
      expect(screen.getByText('脚本失效')).toBeDefined();
    });

    it('shows failed rules', () => {
      render(
        <StatusOverlay
          {...makeProps({ status: 'failed', failedRules: ['submit-btn', 'console-clean'] })}
        />,
      );
      expect(screen.getByText(/submit-btn/)).toBeDefined();
      expect(screen.getByText(/console-clean/)).toBeDefined();
    });

    it('expands when "查看" is clicked', () => {
      render(
        <StatusOverlay
          {...makeProps({
            status: 'failed',
            failedRules: ['r1'],
            url: 'https://example.com',
            errorMessage: 'TypeError: x is undefined',
          })}
        />,
      );

      fireEvent.click(screen.getByText(/查看/));
      expect(screen.getByText('URL：')).toBeDefined();
      expect(screen.getByText('https://example.com')).toBeDefined();
      expect(screen.getByText('TypeError: x is undefined')).toBeDefined();
    });

    it('shows disable button when onDisable provided', () => {
      const onDisable = vi.fn();
      render(
        <StatusOverlay {...makeProps({ status: 'failed', failedRules: ['r1'], onDisable })} />,
      );
      expect(screen.getByText(/禁用脚本/)).toBeDefined();
    });

    it('does not auto-hide', () => {
      const onClose = vi.fn();
      render(<StatusOverlay {...makeProps({ status: 'failed', failedRules: ['r1'], onClose })} />);
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<StatusOverlay {...makeProps({ onClose })} />);

      fireEvent.click(screen.getByLabelText('关闭'));
      // close triggers animation then callback
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(onClose).toHaveBeenCalledWith('test-script');
    });

    it('calls onClose on ESC key', () => {
      const onClose = vi.fn();
      render(<StatusOverlay {...makeProps({ onClose })} />);

      fireEvent.keyDown(window, { key: 'Escape' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(onClose).toHaveBeenCalledWith('test-script');
    });
  });

  describe('details button', () => {
    it('calls onDetails when details button clicked', () => {
      const onDetails = vi.fn();
      render(<StatusOverlay {...makeProps({ onDetails })} />);

      fireEvent.click(screen.getByText('详情'));
      expect(onDetails).toHaveBeenCalledWith('test-script');
    });
  });
});
