'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { Users, ScrollText, Shield, ChevronDown } from 'lucide-react'

function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleRoleChange = async (userId: number, role: string) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    fetchUsers()
  }

  if (loading) return <div className="h-40 animate-pulse rounded-lg bg-secondary" />

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase text-muted-foreground">
            <th className="px-4 py-3">用户</th>
            <th className="px-4 py-3">Open ID</th>
            <th className="px-4 py-3">角色</th>
            <th className="px-4 py-3">注册时间</th>
            <th className="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/10" />
                  )}
                  <span className="font-medium">{u.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.open_id.slice(0, 16)}...</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  u.role === 'super_admin' ? 'bg-primary/10 text-primary' :
                  u.role === 'admin' ? 'bg-accent/10 text-accent' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {u.role === 'super_admin' ? '超级管理员' : u.role === 'admin' ? '管理员' : '普通用户'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString('zh-CN')}
              </td>
              <td className="px-4 py-3">
                <div className="relative inline-block">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className="appearance-none rounded-lg border border-input bg-background px-3 py-1.5 pr-7 text-xs outline-none focus:border-primary"
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                    <option value="super_admin">超级管理员</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AuditLogTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter) params.set('action', filter)
    const res = await fetch(`/api/admin/audit-log?${params}`)
    const data = await res.json()
    setLogs(data.logs || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const actionLabels: Record<string, string> = {
    USER_REGISTER: '用户注册',
    USER_LOGIN: '用户登录',
    SKILL_UPLOAD: '上传 Skill',
    SKILL_DOWNLOAD: '下载 Skill',
    SKILL_DELETE: '删除 Skill',
    USER_ROLE_CHANGE: '角色变更',
  }

  const actionColors: Record<string, string> = {
    USER_REGISTER: 'bg-green-100 text-green-700',
    USER_LOGIN: 'bg-blue-100 text-blue-700',
    SKILL_UPLOAD: 'bg-purple-100 text-purple-700',
    SKILL_DOWNLOAD: 'bg-amber-100 text-amber-700',
    SKILL_DELETE: 'bg-red-100 text-red-700',
    USER_ROLE_CHANGE: 'bg-orange-100 text-orange-700',
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">全部操作</option>
          <option value="USER_REGISTER">用户注册</option>
          <option value="USER_LOGIN">用户登录</option>
          <option value="SKILL_UPLOAD">上传 Skill</option>
          <option value="SKILL_DOWNLOAD">下载 Skill</option>
          <option value="SKILL_DELETE">删除 Skill</option>
          <option value="USER_ROLE_CHANGE">角色变更</option>
        </select>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-secondary" />
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">暂无日志</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase text-muted-foreground">
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">用户</th>
                <th className="px-4 py-3">操作</th>
                <th className="px-4 py-3">目标</th>
                <th className="px-4 py-3">详情</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.user_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[log.action] || 'bg-secondary text-muted-foreground'}`}>
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.target}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdminPage() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<'users' | 'audit'>('users')

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-xl bg-card" />
        </main>
      </>
    )
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center text-muted-foreground">
          <Shield className="mx-auto mb-4 h-16 w-16 opacity-30" />
          <p className="text-lg font-medium">无权访问</p>
          <p className="text-sm">需要管理员权限</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">管理后台</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setTab('users')}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'users' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            用户管理
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'audit' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ScrollText className="h-4 w-4" />
            审计日志
          </button>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          {tab === 'users' ? <UsersTab /> : <AuditLogTab />}
        </div>
      </main>
    </>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AdminPage />
    </AuthProvider>
  )
}
