import process from 'node:process'

function parseArgs(argv) {
  const parsed = {
    apiUrl: process.env.VITE_CLOUDFLARE_API_URL?.trim() ?? '',
    requireKakao: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (token === '--require-kakao') {
      parsed.requireKakao = true
      continue
    }

    if (token === '--api-url') {
      parsed.apiUrl = argv[index + 1]?.trim() ?? ''
      index += 1
    }
  }

  return parsed
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} (${url})`)
  }

  return response.json()
}

function assertBindings(runtimeStatus) {
  const missingBindings = Object.entries(runtimeStatus.bindings)
    .filter(([, enabled]) => !enabled)
    .map(([binding]) => binding)

  if (missingBindings.length > 0) {
    throw new Error(`Missing runtime bindings: ${missingBindings.join(', ')}`)
  }
}

async function main() {
  const { apiUrl, requireKakao } = parseArgs(process.argv.slice(2))

  if (!apiUrl) {
    throw new Error('API URL is required. Set VITE_CLOUDFLARE_API_URL or pass --api-url <url>.')
  }

  const normalizedApiUrl = apiUrl.replace(/\/$/, '')
  const [health, runtimeStatus] = await Promise.all([
    fetchJson(`${normalizedApiUrl}/api/health`),
    fetchJson(`${normalizedApiUrl}/api/runtime-status`),
  ])

  if (!health.ok) {
    throw new Error('Health check returned ok=false.')
  }

  if (!runtimeStatus.ok) {
    throw new Error('Runtime status returned ok=false.')
  }

  assertBindings(runtimeStatus)

  console.log(`API URL: ${normalizedApiUrl}`)
  console.log('Health: ok')
  console.log(
    `Bindings: db=${runtimeStatus.bindings.db}, session=${runtimeStatus.bindings.session}, bucket=${runtimeStatus.bindings.bucket}`,
  )
  console.log('Kakao runtime readiness: checked')

  if (requireKakao && !runtimeStatus.auth.kakaoOAuthConfigured) {
    throw new Error('Kakao OAuth is not configured in the live Worker.')
  }
}

await main()
