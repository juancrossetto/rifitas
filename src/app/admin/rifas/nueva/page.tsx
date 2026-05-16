import { RaffleForm } from '@/components/admin/RaffleForm'
import Link from 'next/link'

export default function NuevaRifaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/rifas" className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Rifas
        </Link>
        <span className="text-outline-variant">/</span>
        <h1 className="font-display font-bold text-headline-md text-on-surface">Nueva rifa</h1>
      </div>
      <RaffleForm mode="create" />
    </div>
  )
}
