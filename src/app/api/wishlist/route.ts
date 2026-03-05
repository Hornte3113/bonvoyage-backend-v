import { auth } from '@clerk/nextjs/server'
import db from '@/lib/db'
import { ok, err } from '@/lib/response'
import { resolveUserId } from '@/lib/services/clerk.service'
import {
  AddWishlistItemSchema,
  WishlistItemResponseSchema,
} from '@/lib/schemas/wishlist.schema'
import { z } from 'zod'

// ------------------------------------------------------------
//  GET /api/wishlist
//  Lista todos los destinos en la wishlist del usuario
//  Usa vw_wishlist para enriquecer con datos del destino
// ------------------------------------------------------------
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return err('Unauthorized', 401)

  try {
    const userId = await resolveUserId(clerkId)
    if (!userId) return err('User not found', 404)

    const result = await db.query(
      `SELECT
         wishlist_id,
         user_id,
         country,
         city,
         created_at,
         destination_id,
         destination_image,
         latitude,
         longitude,
         timezone,
         currency_code,
         popular_months,
         min_flight_price
       FROM vw_wishlist
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    const wishlist = z.array(WishlistItemResponseSchema).parse(result.rows)
    return ok(wishlist)

  } catch (error) {
    console.error('[GET /wishlist]', error)
    return err('Internal server error', 500)
  }
}
