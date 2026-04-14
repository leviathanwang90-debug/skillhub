import { useState, useCallback, useEffect, useRef } from 'react'
import { fetchJson, getCsrfHeaders, buildApiUrl } from '@/api/client'
import type { User } from '@/api/types'

/**
 * Detects whether the current page is running inside the Feishu (Lark) client.
 */
export function isFeishuClient(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('lark') || ua.includes('feishu')
}

interface FeishuLoginResult {
  user: User | null
  error: string | null
  loading: boolean
}

interface FeishuConfig {
  appId: string
}

/**
 * Fetches the Feishu App ID from the backend.
 */
async function fetchFeishuConfig(): Promise<FeishuConfig> {
  const resp = await fetchJson<{ data: FeishuConfig }>(buildApiUrl('/api/v1/auth/feishu/config'))
  return resp.data
}

/**
 * Sends the Feishu authorization code to the backend and returns the
 * authenticated user.
 */
async function loginWithFeishuCode(code: string): Promise<User> {
  const resp = await fetchJson<{ data: User }>(buildApiUrl('/api/v1/auth/feishu/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getCsrfHeaders(),
    },
    body: JSON.stringify({ code }),
    credentials: 'include',
  })
  return resp.data
}

/**
 * Obtains a temporary authorization code from the Feishu JSSDK.
 *
 * Uses `window.h5sdk.ready` + `tt.requestAuthCode` as documented at
 * https://open.feishu.cn/document/client-docs/h5/development-guide/step-3
 */
function requestFeishuAuthCode(appId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h5sdk = (window as any).h5sdk
    if (!h5sdk) {
      reject(new Error('Feishu JSSDK (h5sdk) not loaded'))
      return
    }

    h5sdk.ready(() => {
      const tt = (window as any).tt
      if (!tt || !tt.requestAuthCode) {
        reject(new Error('tt.requestAuthCode is not available'))
        return
      }

      tt.requestAuthCode({
        appId,
        success(res: { code: string }) {
          resolve(res.code)
        },
        fail(err: any) {
          reject(new Error('tt.requestAuthCode failed: ' + JSON.stringify(err)))
        },
      })
    })
  })
}

/**
 * React hook that orchestrates the full Feishu H5 silent-login flow.
 *
 * When called, it:
 * 1. Fetches the Feishu App ID from the backend
 * 2. Calls `tt.requestAuthCode` via the JSSDK to get a temporary code
 * 3. Posts the code to `/api/v1/auth/feishu/login`
 * 4. Returns the authenticated user
 */
export function useFeishuLogin(): FeishuLoginResult & { trigger: () => void } {
  const [state, setState] = useState<FeishuLoginResult>({
    user: null,
    error: null,
    loading: false,
  })
  const attemptedRef = useRef(false)

  const trigger = useCallback(async () => {
    if (state.loading) return
    setState({ user: null, error: null, loading: true })

    try {
      // Step 1: Get Feishu App ID
      const config = await fetchFeishuConfig()

      // Step 2: Get authorization code from JSSDK
      const code = await requestFeishuAuthCode(config.appId)

      // Step 3: Exchange code for session
      const user = await loginWithFeishuCode(code)

      setState({ user, error: null, loading: false })
    } catch (err: any) {
      setState({ user: null, error: err.message || 'Feishu login failed', loading: false })
    }
  }, [state.loading])

  // Auto-trigger on mount if in Feishu client
  useEffect(() => {
    if (!attemptedRef.current && isFeishuClient()) {
      attemptedRef.current = true
      trigger()
    }
  }, [trigger])

  return { ...state, trigger }
}
