import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/session'

// POST /api/skills/[id]/rating
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { score } = await req.json()
    const { id } = await params

    if (!score || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Score must be 1-5' }, { status: 400 })
    }

    const db = getDb()
    const skill = db.prepare('SELECT id FROM skills WHERE id = ?').get(id)
    if (!skill) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Upsert rating
    db.prepare(`
      INSERT INTO ratings (skill_id, user_id, score) VALUES (?, ?, ?)
      ON CONFLICT(skill_id, user_id) DO UPDATE SET score = excluded.score
    `).run(id, session.userId!, score)

    // Return updated avg
    const stats = db.prepare(
      'SELECT AVG(score) as avg, COUNT(*) as count FROM ratings WHERE skill_id = ?'
    ).get(id) as any

    return NextResponse.json({ ratingAvg: stats.avg, ratingCount: stats.count })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/skills/[id]/rating — get current user's rating
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const db = getDb()
    const { id } = await params
    const rating = db.prepare(
      'SELECT score FROM ratings WHERE skill_id = ? AND user_id = ?'
    ).get(id, session.userId!) as any

    return NextResponse.json({ score: rating?.score || 0 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
