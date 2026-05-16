import { SalesHistoryTable } from '@/components/admin/SalesHistoryTable'

export const dynamic = 'force-dynamic'

export default function VentasPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-on-surface">Historial de ventas</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Todas las órdenes del sistema. Filtrá por estado, método de pago o rifa.
        </p>
      </div>
      <SalesHistoryTable />
    </div>
  )
}
