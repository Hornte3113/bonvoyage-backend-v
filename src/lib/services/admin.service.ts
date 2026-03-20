import db from '@/lib/db'

export async function requireAdmin(clerkId: string): Promise<string | null> {
  const result = await db.query(
    `SELECT u.user_id FROM users u
     JOIN user_identities ui ON ui.user_id = u.user_id
     WHERE ui.provider_id = $1
       AND u.role = 'ADMIN'
       AND u.deleted_at IS NULL
     LIMIT 1`,
    [clerkId]
  )
  return result.rows[0]?.user_id ?? null
}
