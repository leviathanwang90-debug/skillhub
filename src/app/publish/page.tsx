'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/components/auth-provider'
import { Header } from '@/components/header'
import { Upload, FileArchive, X } from 'lucide-react'

function PublishPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-xl bg-card" />
        </main>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
          <p className="text-lg">请先登录</p>
        </main>
      </>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('请输入 Skill 名称')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('summary', summary.trim())
      formData.append('description', description.trim())
      if (file) formData.append('file', file)

      const res = await fetch('/api/skills', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      router.push(`/skill/${data.skill.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">发布 Skill</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              名称 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：my-awesome-skill"
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">简介</label>
            <input
              type="text"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="一句话描述这个 Skill"
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">详细介绍</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              placeholder="详细描述 Skill 的功能、使用方法等"
              className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Skill 文件</label>
            {file ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <FileArchive className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-card py-8 transition-colors hover:border-primary/50 hover:bg-secondary/50">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">点击或拖拽上传文件</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? '发布中...' : '发布 Skill'}
          </button>
        </form>
      </main>
    </>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <PublishPage />
    </AuthProvider>
  )
}
