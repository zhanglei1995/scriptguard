/**
 * MAIN world 错误捕获脚本
 * 注入到页面上下文中，捕获 error 和 unhandledrejection
 * 通过 window.postMessage 与 ISOLATED world 通信
 *
 * 关联: TDD §9.4 Content Script 错误隔离
 */

export const ERROR_CAPTURE_SOURCE = 'scriptguard-error-capture';

export const ERROR_CAPTURE_SCRIPT = `(function(){
var S="${ERROR_CAPTURE_SOURCE}";
window.addEventListener("error",function(e){
window.postMessage({source:S,type:"error",message:e.message,filename:e.filename,lineno:e.lineno,colno:e.colno},'*');
});
window.addEventListener("unhandledrejection",function(e){
window.postMessage({source:S,type:"unhandledrejection",reason:String(e.reason||'')},'*');
});
})();`;

export interface PageError {
  source: typeof ERROR_CAPTURE_SOURCE;
  type: 'error' | 'unhandledrejection';
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  reason?: string;
}

export function isPageError(data: unknown): data is PageError {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).source === ERROR_CAPTURE_SOURCE
  );
}

/**
 * 向 MAIN world 注入错误捕获脚本
 * 必须在 document_start 时调用
 */
export function injectErrorCapture(doc: Document = document): void {
  const script = doc.createElement('script');
  script.textContent = ERROR_CAPTURE_SCRIPT;
  (doc.documentElement || doc.head || doc.body)?.appendChild(script);
  script.remove();
}
