'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/',
    label: 'Inicio',
    icon: '🏠',
    isActive: (path: string) => path === '/'
  },
  {
    href: '/pedidos',
    label: 'Pedidos',
    icon: '📦',
    isActive: (path: string) =>
      path.startsWith('/pedidos')
  },
  {
    href: '/insumos',
    label: 'Insumos',
    icon: '📚',
    isActive: (path: string) =>
      path.startsWith('/insumos')
  },
  {
    href: '/finanzas',
    label: 'Finanzas',
    icon: '💰',
    isActive: (path: string) =>
      path.startsWith('/finanzas')
  }
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-black"
      style={{
        boxShadow: '0 -4px 0 0 #000'
      }}
    >
      <div className="max-w-md mx-auto flex">
        {navItems.map((item) => {
          const active = item.isActive(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition"
              style={{
                background: active
                  ? '#c6302c'
                  : 'transparent',
                color: active ? '#fff' : '#666'
              }}
            >
              <span className="text-lg leading-none">
                {item.icon}
              </span>
              <span
                className="text-[0.65rem] font-semibold uppercase tracking-wide"
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
