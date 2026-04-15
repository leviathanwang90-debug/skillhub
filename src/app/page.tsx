'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuthProvider } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { SkillCard } from '@/components/skill-card'
import { Search, Package, SlidersHorizontal } from 'lucide-react'

function HomePage() {
  const [skills, setSkills] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      params.set('sort', sort)
      const res = await fetch(`/api/skills?${params}`)
      const data = await res.json()
      setSkills(data.skills || [])
      setTotal(data.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [query, sort])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <div className="mb-10 text-center animate-fade-up">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight">
            Discover & Share <span className="text-brand-gradient">Skills</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            探索、分享和管理 Skill 资源
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索 Skill..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-1">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-transparent py-1.5 text-sm outline-none"
            >
              <option value="newest">最新</option>
              <option value="downloads">下载最多</option>
              <option value="rating">评分最高</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package className="mb-4 h-16 w-16 opacity-30" />
            <p className="text-lg font-medium">暂无 Skill</p>
            <p className="text-sm">成为第一个发布者吧</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">共 {total} 个 Skill</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map(skill => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  )
}
