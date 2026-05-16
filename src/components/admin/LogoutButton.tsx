'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1 transition-opacity"
    >
      <span className="material-symbols-outlined text-sm">logout</span>
      Salir
    </button>
  )
}
