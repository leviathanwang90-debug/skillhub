'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { Star, Download, User, ArrowLeft, FileArchive, MessageSquare, Send, Trash2 } from 'lucide-react'

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110 disabled:cursor-default"
        >
          <Star
            className={`h-5 w-5 ${
              i <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function SkillDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [skill, setSkill] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [myRating, setMyRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const fetchSkill = useCallback(async () => {
    const res = await fetch(`/api/skills/${id}`)
    const data = await res.json()
    setSkill(data.skill)
    setLoading(false)
  }, [id])

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/skills/${id}/comments`)
    const data = await res.json()
    setComments(data.comments || [])
  }, [id])

  const fetchMyRating = useCallback(async () => {
    if (!user) return
    const res = await fetch(`/api/skills/${id}/rating`)
    const data = await res.json()
    setMyRating(data.score || 0)
  }, [id, user])

  useEffect(() => {
    fetchSkill()
    fetchComments()
  }, [fetchSkill, fetchComments])

  useEffect(() => {
    fetchMyRating()
  }, [fetchMyRating])

  const handleRate = async (score: number) => {
    if (!user) return
    const res = await fetch(`/api/skills/${id}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    })
    if (res.ok) {
      setMyRating(score)
      fetchSkill()
    }
  }

  const handleDownload = async () => {
    if (!user) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/skills/${id}/download`)
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
        fetchSkill()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  const handleComment = async () => {
    if (!user || !newComment.trim()) return
    const res = await fetch(`/api/skills/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    })
    if (res.ok) {
      setNewComment('')
      fetchComments()
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个 Skill 吗？')) return
    const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/')
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="h-64 animate-pulse rounded-xl bg-card" />
        </main>
      </>
    )
  }

  if (!skill) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">
          <p className="text-lg">Skill 不存在</p>
        </main>
      </>
    )
  }

  const isOwner = user && user.id === skill.owner_id
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin')

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>

        {/* Skill Info Card */}
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 animate-fade-up">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{skill.name}</h1>
              {skill.summary && (
                <p className="mb-4 text-muted-foreground">{skill.summary}</p>
              )}
            </div>
            {(isOwner || isAdmin) && (
              <button
                onClick={handleDelete}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="删除"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Meta */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {skill.owner_avatar ? (
                <img src={skill.owner_avatar} alt="" className="h-5 w-5 rounded-full" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span>{skill.owner_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{skill.rating_avg ? Number(skill.rating_avg).toFixed(1) : '-'}</span>
              <span className="text-xs">({skill.rating_count} 评分)</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>{skill.download_count} 下载</span>
            </div>
            <span className="text-xs">{new Date(skill.created_at).toLocaleDateString('zh-CN')}</span>
          </div>

          {/* Description */}
          {skill.description && (
            <div className="mb-6 rounded-lg bg-secondary/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">介绍</h3>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {skill.description}
              </div>
            </div>
          )}

          {/* File & Download */}
          {skill.file_name && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <FileArchive className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">{skill.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(skill.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {user && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {downloading ? '下载中...' : '下载'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rating */}
        {user && (
          <div className="mt-6 rounded-xl border border-border bg-card p-6">
            <h3 className="mb-3 text-sm font-semibold">我的评分</h3>
            <StarRating value={myRating} onChange={handleRate} />
          </div>
        )}

        {/* Comments */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-4 w-4" />
            评论 ({comments.length})
          </h3>

          {user && (
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="写下你的评论..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
              />
              <button
                onClick={handleComment}
                disabled={!newComment.trim()}
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}

          {comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无评论</p>
          ) : (
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  {c.user_avatar ? (
                    <img src={c.user_avatar} alt="" className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.user_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <SkillDetailPage />
    </AuthProvider>
  )
}
