import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/session'

// GET /api/skills/[id]/comments
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const { id } = await params
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.skill_id = ?
    ORDER BY c.created_at DESC
  `).all(id)

  return NextResponse.json({ comments })
}

// POST /api/skills/[id]/comments
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { content } = await req.json()
    const { id } = await params

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const db = getDb()
    const skill = db.prepare('SELECT id FROM skills WHERE id = ?').get(id)
    if (!skill) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const result = db.prepare(
      'INSERT INTO comments (skill_id, user_id, content) VALUES (?, ?, ?)'
    ).run(id, session.userId!, content.trim())

    const comment = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
      FROM comments c LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid)

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
