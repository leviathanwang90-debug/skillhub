'use client'

import Link from 'next/link'
import { useAuth } from './auth-provider'
import { Package, Upload, Shield, LogOut, LogIn } from 'lucide-react'

export function Header() {
  const { user, loading, login, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">SkillHub</span>
        </Link>

        <nav className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
          ) : user ? (
            <>
              <Link
                href="/publish"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Upload className="h-4 w-4" />
                发布
              </Link>
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Shield className="h-4 w-4" />
                  管理
                </Link>
              )}
              <div className="ml-2 flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary/20" />
                )}
                <span className="text-sm font-medium">{user.name}</span>
                <button
                  onClick={logout}
                  className="ml-1 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                  title="退出登录"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              飞书登录
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
