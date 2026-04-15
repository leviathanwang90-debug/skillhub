import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { getDownloadUrl } from '@/lib/oss'
import { logAudit } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const db = getDb()
    const { id } = await params
    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as any

    if (!skill) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!skill.oss_key) {
      return NextResponse.json({ error: 'No file attached' }, { status: 404 })
    }

    // Increment download count
    db.prepare('UPDATE skills SET download_count = download_count + 1 WHERE id = ?').run(id)

    // Log download
    logAudit(session.userId!, session.name!, 'SKILL_DOWNLOAD', skill.name, `File: ${skill.file_name}`)

    // Generate signed URL
    const url = await getDownloadUrl(skill.oss_key, skill.file_name)

    return NextResponse.json({ url })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
