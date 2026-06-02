import { mkdtemp, rm, cp, access } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'

const repoRoot = process.cwd()
const distDir = path.join(repoRoot, 'dist')

async function assertDistExists() {
  try {
    await access(distDir)
  } catch {
    throw new Error('dist directory does not exist. Run `npm run build` first.')
  }
}

function runWranglerFrom(tempDir, args) {
  return new Promise((resolve, reject) => {
    const child =
      process.platform === 'win32'
        ? spawn(
            'powershell.exe',
            [
              '-NoProfile',
              '-Command',
              `& "${path.join(repoRoot, 'node_modules', '.bin', 'wrangler.cmd')}" pages deploy . ${args.join(' ')}`,
            ],
            {
              cwd: tempDir,
              stdio: 'inherit',
              env: process.env,
            },
          )
        : spawn(path.join(repoRoot, 'node_modules', '.bin', 'wrangler'), ['pages', 'deploy', '.', ...args], {
            cwd: tempDir,
            stdio: 'inherit',
            env: process.env,
          })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`wrangler pages deploy exited with code ${code ?? 'unknown'}`))
    })
  })
}

async function main() {
  await assertDistExists()

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'gattaca-pages-'))

  try {
    await cp(distDir, tempDir, { recursive: true, force: true })
    await runWranglerFrom(tempDir, process.argv.slice(2))
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

await main()
