/**
 * Selector Visible Executor
 *
 * SG-016: Rule Executor Interface and Base Class
 * Checks if a matched element is visible in the DOM
 */

import { BaseExecutor } from '../base';
import type { CheckRule, ExecutionContext } from '../types';

/**
 * Configuration for selector_visible rule
 */
interface SelectorVisibleConfig {
  /** CSS selector to check */
  selector?: string;
}

/**
 * Executor for selector_visible rules
 *
 * Passes if the selector matches an element that is visible:
 * - Has non-zero dimensions (offsetWidth/offsetHeight > 0)
 * - Or getComputedStyle shows display != none && visibility != hidden
 *
 * @example
 * ```json
 * {
 *   "type": "selector_visible",
 *   "config": { "selector": "#modal" }
 * }
 * ```
 */
export class SelectorVisibleExecutor extends BaseExecutor {
  readonly type = 'selector_visible';

  protected async evaluate(rule: CheckRule, ctx: ExecutionContext): Promise<boolean> {
    const config = rule.config as SelectorVisibleConfig;
    const selector = config.selector;

    if (!selector) {
      return false;
    }

    const element = ctx.document.querySelector(selector);
    if (!element) {
      return false;
    }

    // Check offset dimensions first
    if (element instanceof HTMLElement) {
      if (element.offsetWidth > 0 || element.offsetHeight > 0) {
        return true;
      }
    }

    // Fall back to computed style
    const style = ctx.window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }
}
