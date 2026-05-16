import Link from 'next/link'
import { LogoutButton } from '@/components/admin/LogoutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col">
      <header className="bg-on-surface text-inverse-on-surface py-3 px-gutter shadow-md sticky top-0 z-20">
        <div className="max-w-layout mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 font-display font-bold text-lg hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-primary-container">confirmation_number</span>
              Rifas Admin
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/admin" label="Dashboard" icon="dashboard" />
              <NavLink href="/admin/rifas" label="Rifas" icon="list" />
              <NavLink href="/admin/ordenes" label="Órdenes" icon="pending_actions" />
              <NavLink href="/admin/ventas" label="Ventas" icon="receipt_long" />
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1 transition-opacity">
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Ver sitio
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-layout w-full mx-auto px-margin-mobile lg:px-margin-desktop py-8">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm opacity-70 hover:opacity-100 hover:bg-white/10 transition-all"
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      {label}
    </Link>
  )
}
