import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export function ensureDir(relativePath: string) {
  const target = join(process.cwd(), relativePath)
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true })
  }
}

export function buildBaselinePath(dir: string, fileName: string) {
  return join(process.cwd(), dir, fileName)
}
