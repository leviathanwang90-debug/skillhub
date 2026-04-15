import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '50')
    const action = searchParams.get('action') || ''

    const db = getDb()
    let where = ''
    const params: any[] = []

    if (action) {
      where = 'WHERE action = ?'
      params.push(action)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM audit_logs ${where}`).get(...params) as any
    const logs = db.prepare(`
      SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, size, page * size)

    return NextResponse.json({ logs, total: countRow.total, page, size })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
