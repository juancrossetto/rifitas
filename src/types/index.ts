import type { Raffle, Ticket, Order } from '@/generated/prisma'

export type { Raffle, Ticket, Order, RaffleStatus, TicketStatus, OrderStatus, PaymentMethod } from '@/generated/prisma'

export interface RaffleWithCounts extends Raffle {
  soldCount: number
  reservedCount: number
  revenue?: number
}

export interface TicketWithOrder extends Ticket {
  order?: Order | null
}
