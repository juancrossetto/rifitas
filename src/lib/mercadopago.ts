import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export const mpPreference = new Preference(client)
export const mpPayment = new Payment(client)

export async function createPreference({
  orderId,
  raffleTitle,
  ticketNumbers,
  unitPrice,
  quantity,
  buyerEmail,
}: {
  orderId: string
  raffleTitle: string
  ticketNumbers: number[]
  unitPrice: number
  quantity: number
  buyerEmail: string
}) {
  // MercadoPago rechaza URLs de localhost — siempre usar la URL pública de producción
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const baseUrl = rawUrl.startsWith('http://localhost') || rawUrl === ''
    ? 'https://rifar.vercel.app'
    : rawUrl

  return mpPreference.create({
    body: {
      external_reference: orderId,
      items: [
        {
          id: orderId,
          title: `${raffleTitle} - Números: ${ticketNumbers.join(', ')}`,
          quantity,
          unit_price: unitPrice,
          currency_id: 'ARS',
        },
      ],
      payer: { email: buyerEmail },
      back_urls: {
        success: `${baseUrl}/checkout/${orderId}?status=success`,
        failure: `${baseUrl}/checkout/${orderId}?status=failure`,
        pending: `${baseUrl}/checkout/${orderId}?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    },
  })
}
