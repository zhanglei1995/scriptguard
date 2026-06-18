/**
 * 用户脚本注入器
 * 将用户脚本注入 MAIN world，带超时保护和错误隔离
 *
 * 关联: TDD §9.4 Content Script 错误隔离
 */

export const INJECT_RESULT_SOURCE = 'scriptguard-inject-result'

export const DEFAULT_TIMEOUT = 10_000

export interface InjectResult {
  status: 'success' | 'error' | 'timeout'
  error?: string
}

/**
 * 将用户脚本注入 MAIN world 并等待结果
 * 使用 <script> 标签注入，通过 postMessage 通信
 */
export function injectScript(
  scriptId: string,
  code: string,
  options: { timeout?: number; doc?: Document } = {}
): Promise<InjectResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  const doc = options.doc ?? document

  return new Promise((resolve) => {
    let resolved = false

    const handler = (e: MessageEvent) => {
      if (resolved) return
      const data = e.data
      if (
        typeof data === 'object' &&
        data !== null &&
        data.source === INJECT_RESULT_SOURCE &&
        data.scriptId === scriptId
      ) {
        resolved = true
        window.removeEventListener('message', handler)
        resolve({ status: data.status, error: data.error })
      }
    }

    window.addEventListener('message', handler)

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        window.removeEventListener('message', handler)
        resolve({ status: 'timeout', error: `Script timed out after ${timeout}ms` })
      }
    }, timeout)

    const wrappedCode = `(function(){
var S="${INJECT_RESULT_SOURCE}",ID="${scriptId}";
try{
${code}
window.postMessage({source:S,scriptId:ID,status:"success"},'*');
}catch(e){
window.postMessage({source:S,scriptId:ID,status:"error",error:e.message||String(e)},'*');
}
})();`

    const el = doc.createElement('script')
    el.textContent = wrappedCode
    ;(doc.documentElement || doc.head || doc.body)?.appendChild(el)
    el.remove()

    void timer
  })
}
