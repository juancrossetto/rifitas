import { prisma } from './prisma'

/**
 * Cancels all PENDING orders whose expiresAt has passed and releases
 * their tickets back to AVAILABLE.
 *
 * Call this on-demand (e.g. at the start of every new order request or
 * raffle page load) since Vercel has no persistent background workers.
 *
 * @param raffleId  Restrict cleanup to a single raffle (recommended for
 *                  targeted invalidation). Omit to clean up the whole table.
 */
export async function releaseExpiredReservations(raffleId?: string) {
  const now = new Date()

  const expiredOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: now },
      ...(raffleId ? { raffleId } : {}),
    },
    select: { id: true },
  })

  if (expiredOrders.length === 0) return 0

  const ids = expiredOrders.map((o) => o.id)

  await prisma.$transaction([
    prisma.ticket.updateMany({
      where: { orderId: { in: ids } },
      data: { status: 'AVAILABLE', orderId: null },
    }),
    prisma.order.updateMany({
      where: { id: { in: ids } },
      data: { status: 'CANCELLED' },
    }),
  ])

  return ids.length
}
