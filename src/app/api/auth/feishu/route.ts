import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logAudit } from '@/lib/audit'

const FEISHU_APP_ID = process.env.FEISHU_APP_ID!
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET!
const INITIAL_ADMIN_OPEN_IDS = (process.env.INITIAL_ADMIN_OPEN_IDS || '').split(',').filter(Boolean)

async function getAppAccessToken(): Promise<string> {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET }),
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(`Failed to get app_access_token: ${data.msg}`)
  return data.app_access_token
}

async function getUserAccessToken(code: string, appAccessToken: string) {
  const res = await fetch('https://open.feishu.cn/open-apis/authen/v1/oidc/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${appAccessToken}`,
    },
    body: JSON.stringify({ grant_type: 'authorization_code', code }),
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(`Failed to get user_access_token: ${data.msg}`)
  return data.data
}

async function getUserInfo(userAccessToken: string) {
  const res = await fetch('https://open.feishu.cn/open-apis/authen/v1/user_info', {
    method: 'GET',
    headers: { Authorization: `Bearer ${userAccessToken}` },
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(`Failed to get user info: ${data.msg}`)
  return data.data
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    }

    // 1. Get app_access_token
    const appAccessToken = await getAppAccessToken()

    // 2. Exchange code for user_access_token
    const tokenData = await getUserAccessToken(code, appAccessToken)
    const userAccessToken = tokenData.access_token

    // 3. Get user info
    const userInfo = await getUserInfo(userAccessToken)
    const openId = userInfo.open_id as string
    const name = (userInfo.name || userInfo.en_name || 'Unknown') as string
    const avatarUrl = (userInfo.avatar_url || userInfo.avatar_thumb || '') as string

    // 4. Upsert user in database
    const db = getDb()
    let user = db.prepare('SELECT * FROM users WHERE open_id = ?').get(openId) as any

    const isInitialAdmin = INITIAL_ADMIN_OPEN_IDS.includes(openId)

    if (!user) {
      const role = isInitialAdmin ? 'super_admin' : 'user'
      const result = db.prepare(
        'INSERT INTO users (open_id, name, avatar_url, role) VALUES (?, ?, ?, ?)'
      ).run(openId, name, avatarUrl, role)
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
      logAudit(user.id, name, 'USER_REGISTER', openId, `Feishu login, role: ${role}`)
    } else {
      db.prepare('UPDATE users SET name = ?, avatar_url = ?, updated_at = datetime("now") WHERE id = ?')
        .run(name, avatarUrl, user.id)
      if (isInitialAdmin && user.role === 'user') {
        db.prepare('UPDATE users SET role = "super_admin" WHERE id = ?').run(user.id)
        user.role = 'super_admin'
      }
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id)
    }

    // 5. Create session
    const session = await getSession()
    session.userId = user.id
    session.openId = user.open_id
    session.name = user.name
    session.avatarUrl = user.avatar_url
    session.role = user.role
    await session.save()

    logAudit(user.id, name, 'USER_LOGIN', openId, 'Feishu H5 silent login')

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatar_url,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error('Feishu auth error:', error)
    return NextResponse.json({ error: error.message || 'Auth failed' }, { status: 500 })
  }
}

// GET /api/auth/feishu — return current session
export async function GET() {
  const session = await getSession()
  if (!session.userId) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({
    user: {
      id: session.userId,
      name: session.name,
      avatarUrl: session.avatarUrl,
      role: session.role,
    },
  })
}
