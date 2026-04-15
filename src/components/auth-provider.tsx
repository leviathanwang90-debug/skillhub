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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check existing session
  useEffect(() => {
    fetch('/api/auth/feishu')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async () => {
    if (!isInFeishu()) {
      alert('请在飞书客户端中打开此页面')
      return
    }

    try {
      const tt = (window as any).tt
      if (!tt) {
        alert('飞书 JSSDK 未加载')
        return
      }

      const code = await new Promise<string>((resolve, reject) => {
        tt.requestAuthCode({
          appId: process.env.NEXT_PUBLIC_FEISHU_APP_ID,
          success: (res: any) => resolve(res.code),
          fail: (err: any) => reject(new Error(err.errMsg || 'requestAuthCode failed')),
        })
      })

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
