import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('App setup mode', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('shows setup blocker instead of demo mode when production-like env is unconfigured', async () => {
    vi.doMock('./lib/env', () => ({
      appEnv: {
        adminUserId: '',
        cloudflareApiUrl: '',
        enableDemoMode: '',
      },
      isCloudflareConfigured: false,
      isDemoModeEnabled: false,
    }))

    const { default: App } = await import('./App')
    render(<App />)

    expect(await screen.findByText('배포 설정 필요')).toBeInTheDocument()
    expect(screen.queryByText('데모 모드')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('데모 권한')).not.toBeInTheDocument()
  })
})
