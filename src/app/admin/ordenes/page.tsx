import { PendingOrdersPanel } from '@/components/admin/PendingOrdersPanel'

export const dynamic = 'force-dynamic'

export default function OrdenesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-on-surface">Órdenes pendientes</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Confirmá o rechazá los pagos por transferencia y WhatsApp. Se actualiza automáticamente cada 30 segundos.
        </p>
      </div>
      <PendingOrdersPanel />
    </div>
  )
}
