/**
 * SyncUI - 冲突解决弹窗
 * SG-031: 客户端弹冲突解决弹窗
 */

import type { Conflict } from './sync'

export interface ConflictResolution {
  conflictId: string
  resolution: 'local' | 'server' | 'merge'
}

/**
 * 显示冲突解决弹窗
 * 返回用户对每个冲突的选择
 */
export async function showConflictDialog(
  conflicts: Conflict[]
): Promise<ConflictResolution[]> {
  const resolutions: ConflictResolution[] = []

  for (const conflict of conflicts) {
    const resolution = await showSingleConflictDialog(conflict)
    resolutions.push({
      conflictId: conflict.id,
      resolution,
    })
  }

  return resolutions
}

/**
 * 显示单个冲突的解决弹窗
 */
function showSingleConflictDialog(
  conflict: Conflict
): Promise<'local' | 'server' | 'merge'> {
  return new Promise((resolve) => {
    const entityLabel = conflict.entity === 'script' ? '脚本' : '规则'
    const localName = getEntityName(conflict.local)
    const serverName = getEntityName(conflict.server)

    const message = [
      `检测到${entityLabel}冲突:`,
      '',
      `本地版本: ${localName}`,
      `云端版本: ${serverName}`,
      '',
      '请选择解决方案:',
      '1. 保留本地版本',
      '2. 保留云端版本',
      '3. 合并',
    ].join('\n')

    const choice = prompt(message, '2')

    switch (choice) {
      case '1':
        resolve('local')
        break
      case '3':
        resolve('merge')
        break
      case '2':
      default:
        resolve('server')
        break
    }
  })
}

/**
 * 从实体对象中提取名称
 */
function getEntityName(entity: unknown): string {
  if (entity && typeof entity === 'object' && 'name' in entity) {
    return String((entity as Record<string, unknown>).name)
  }
  return '未知'
}
