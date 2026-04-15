import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { uploadToOss } from '@/lib/oss'
import { logAudit } from '@/lib/audit'

// GET /api/skills — list skills
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = parseInt(searchParams.get('page') || '0')
  const size = parseInt(searchParams.get('size') || '20')

  const db = getDb()
  let where = ''
  const params: any[] = []

  if (q) {
    where = 'WHERE (s.name LIKE ? OR s.summary LIKE ?)'
    params.push(`%${q}%`, `%${q}%`)
  }

  const orderBy = sort === 'downloads' ? 's.download_count DESC' :
                  sort === 'rating' ? 'rating_avg DESC' :
                  's.created_at DESC'

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM skills s ${where}`).get(...params) as any
  const total = countRow.total

  const rows = db.prepare(`
    SELECT s.*, u.name as owner_name, u.avatar_url as owner_avatar,
      COALESCE((SELECT AVG(score) FROM ratings WHERE skill_id = s.id), 0) as rating_avg,
      COALESCE((SELECT COUNT(*) FROM ratings WHERE skill_id = s.id), 0) as rating_count
    FROM skills s
    LEFT JOIN users u ON s.owner_id = u.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, size, page * size)

  return NextResponse.json({ skills: rows, total, page, size })
}

// POST /api/skills — create skill (multipart form)
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await req.formData()
    const name = formData.get('name') as string
    const summary = formData.get('summary') as string || ''
    const description = formData.get('description') as string || ''
    const file = formData.get('file') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()

    let ossKey = ''
    let fileName = ''
    let fileSize = 0

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      fileName = file.name
      fileSize = buffer.length
      ossKey = await uploadToOss(`skills/${slug}/${fileName}`, buffer, file.type || 'application/octet-stream')
    }

    const db = getDb()
    const result = db.prepare(
      `INSERT INTO skills (name, slug, summary, description, owner_id, oss_key, file_name, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(name, slug, summary, description, session.userId!, ossKey, fileName, fileSize)

    logAudit(session.userId!, session.name!, 'SKILL_UPLOAD', name, `File: ${fileName}, Size: ${fileSize}`)

    const skill = db.prepare('SELECT * FROM skills WHERE id = ?').get(result.lastInsertRowid)

    return NextResponse.json({ skill }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create skill error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
