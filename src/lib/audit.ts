import { getDb } from './db'

export function logAudit(
  userId: number | null,
  userName: string,
  action: string,
  target: string,
  detail: string = ''
) {
  const db = getDb()
  db.prepare(
    `INSERT INTO audit_logs (user_id, user_name, action, target, detail) VALUES (?, ?, ?, ?, ?)`
  ).run(userId, userName, action, target, detail)
}
