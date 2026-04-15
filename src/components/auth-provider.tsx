'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface User {
  id: number
  name: string
  avatarUrl: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

function isInFeishu(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('lark') || ua.includes('feishu')
}

/**
 * 等待飞书 JSSDK 加载就绪，返回 Promise
 * 飞书客户端内会注入 window.h5sdk，通过 h5sdk.ready() 确认环境就绪
 */
function waitForH5SDK(timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const h5sdk = (window as any).h5sdk
    if (h5sdk) {
      h5sdk.error((err: any) => {
        console.error('h5sdk error:', err)
      })
      h5sdk.ready(() => {
        console.log('h5sdk ready')
        resolve()
      })
      // 超时保护
      setTimeout(() => reject(new Error('h5sdk ready timeout')), timeout)
    } else {
      // h5sdk 不存在，可能不在飞书环境中
      reject(new Error('h5sdk not found'))
    }
  })
}

/**
 * 获取飞书免登授权码
 * 优先使用 requestAccess（新版），降级到 requestAuthCode（旧版）
 */
function getAuthCode(appId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tt = (window as any).tt
    if (!tt) {
      reject(new Error('tt not found'))
      return
    }

    // 优先使用 requestAccess（新版 API）
    if (tt.requestAccess) {
      tt.requestAccess({
        appID: appId, // requestAccess 用大写 ID
        scopeList: [],
        success: (res: any) => {
          console.log('requestAccess success')
          resolve(res.code)
        },
        fail: (err: any) => {
          console.warn('requestAccess failed:', err)
          // errno === 103 表示客户端版本过低，降级到 requestAuthCode
          if (err.errno === 103) {
            callRequestAuthCode(tt, appId, resolve, reject)
          } else {
            reject(new Error(err.errString || err.errMsg || 'requestAccess failed'))
          }
        },
      })
    } else {
      // JSSDK 版本过低，直接使用 requestAuthCode
      callRequestAuthCode(tt, appId, resolve, reject)
    }
  })
}

function callRequestAuthCode(
  tt: any,
  appId: string,
  resolve: (code: string) => void,
  reject: (err: Error) => void
) {
  tt.requestAuthCode({
    appId: appId, // requestAuthCode 用小写 d
    success: (res: any) => {
      console.log('requestAuthCode success')
      resolve(res.code)
    },
    fail: (err: any) => {
      console.error('requestAuthCode failed:', err)
      reject(new Error(err.errString || err.errMsg || 'requestAuthCode failed'))
    },
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 检查已有 session
  useEffect(() => {
    fetch('/api/auth/feishu')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // 飞书环境自动登录：h5sdk 就绪后自动触发免登
  useEffect(() => {
    if (user) return // 已登录则跳过
    if (!isInFeishu()) return // 非飞书环境跳过

    const autoLogin = async () => {
      try {
        await waitForH5SDK()
        const appId = process.env.NEXT_PUBLIC_FEISHU_APP_ID
        if (!appId) {
          console.error('NEXT_PUBLIC_FEISHU_APP_ID not set')
          return
        }
        const code = await getAuthCode(appId)
        const res = await fetch('/api/auth/feishu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
        } else if (data.error) {
          console.error('Auto login failed:', data.error)
        }
      } catch (err) {
        console.warn('Auto login skipped:', err)
      }
    }

    // 等待 session 检查完成后再尝试自动登录
    if (!loading) {
      autoLogin()
    }
  }, [user, loading])

  const login = useCallback(async () => {
    if (!isInFeishu()) {
      alert('请在飞书客户端中打开此页面')
      return
    }

    try {
      await waitForH5SDK()
      const appId = process.env.NEXT_PUBLIC_FEISHU_APP_ID
      if (!appId) {
        alert('应用配置错误：缺少 App ID')
        return
      }
      const code = await getAuthCode(appId)
      const res = await fetch('/api/auth/feishu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUser(data.user)
    } catch (error) {
      console.error('Feishu login error:', error)
      alert('登录失败，请重试')
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
