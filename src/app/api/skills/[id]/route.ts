import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/session'
import { deleteFromOss } from '@/lib/oss'
import { logAudit } from '@/lib/audit'

// GET /api/skills/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const { id } = await params
  const skill = db.prepare(`
    SELECT s.*, u.name as owner_name, u.avatar_url as owner_avatar,
      COALESCE((SELECT AVG(score) FROM ratings WHERE skill_id = s.id), 0) as rating_avg,
      COALESCE((SELECT COUNT(*) FROM ratings WHERE skill_id = s.id), 0) as rating_count
    FROM skills s
    LEFT JOIN users u ON s.owner_id = u.id
    WHERE s.id = ?
  `).get(id)

  if (!skill) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ skill })
}

// DELETE /api/skills/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const db = getDb()
    const { id } = await params
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as any

    if (!skill) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only owner or admin can delete
    const isAdmin = session.role === 'admin' || session.role === 'super_admin'
    if (skill.owner_id !== session.userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from OSS
    if (skill.oss_key) {
      try { await deleteFromOss(skill.oss_key) } catch (e) { console.error('OSS delete error:', e) }
    }

    // Delete from DB (cascades to ratings and comments)
    db.prepare('DELETE FROM skills WHERE id = ?').run(id)

    logAudit(session.userId!, session.name!, 'SKILL_DELETE', skill.name, `Deleted skill id=${id}`)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
