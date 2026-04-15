'use client'

import Link from 'next/link'
import { Star, Download, User } from 'lucide-react'

interface SkillCardProps {
  skill: {
    id: number
    name: string
    slug: string
    summary: string
    owner_name: string
    owner_avatar: string
    rating_avg: number
    rating_count: number
    download_count: number
    created_at: string
  }
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <Link
      href={`/skill/${skill.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
          {skill.name}
        </h3>
      </div>

      {skill.summary && (
        <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {skill.summary}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {skill.owner_avatar ? (
            <img src={skill.owner_avatar} alt="" className="h-4 w-4 rounded-full" />
          ) : (
            <User className="h-3.5 w-3.5" />
          )}
          <span>{skill.owner_name}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {skill.rating_avg ? skill.rating_avg.toFixed(1) : '-'}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {skill.download_count}
          </span>
        </div>
      </div>
    </Link>
  )
}
