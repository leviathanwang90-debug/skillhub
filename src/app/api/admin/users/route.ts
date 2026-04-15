import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { logAudit } from '@/lib/audit'

// GET /api/admin/users
export async function GET() {
  try {
    await requireAdmin()
    const db = getDb()
    const users = db.prepare('SELECT id, open_id, name, avatar_url, role, created_at, updated_at FROM users ORDER BY created_at DESC').all()
    return NextResponse.json({ users })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/admin/users — update user role
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { userId, role } = await req.json()

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    db.prepare('UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?').run(role, userId)

    logAudit(session.userId!, session.name!, 'USER_ROLE_CHANGE', user.name, `${user.role} -> ${role}`)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
