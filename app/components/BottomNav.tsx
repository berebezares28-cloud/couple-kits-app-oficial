'use client'

import Link from 'next/link'
import Image from 'next/image'
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
    href: '/locales',
    label: 'Locales',
    icon: '🏪',
    isActive: (path: string) =>
      path.startsWith('/locales')
  },
  {
    href: '/finanzas',
    label: 'Finanzas',
    icon: '💰',
    isActive: (path: string) =>
      path.startsWith('/finanzas')
  }
]

const desktopNavItems = [
  ...navItems.map((item) => item.href === '/pedidos'
    ? { ...item, isActive: (path: string) => path.startsWith('/pedidos') && path !== '/pedidos/resumen' }
    : item),
  { href: '/pedidos/resumen', label: 'Resumen de pedidos', icon: '📋', isActive: (path: string) => path === '/pedidos/resumen' },
  { href: '/kits', label: 'Kits', icon: '🎨', isActive: (path: string) => path.startsWith('/kits') },
  { href: '/dashboard', label: 'Dashboard', icon: '📊', isActive: (path: string) => path === '/dashboard' },
  { href: '/contenido', label: 'Contenido', icon: '📱', isActive: (path: string) => path.startsWith('/contenido') }
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-60 flex-col border-r-2 border-black bg-white">
        <Link prefetch={false} href="/" className="flex items-center gap-3 px-5 py-7">
          <Image src="/images/logo.png" alt="" width={42} height={42} />
          <div>
            <span className="block text-xl font-black tracking-tight text-[#c6302c]">Couple Kits</span>
            <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-gray-500 mt-1">Estudio</span>
          </div>
        </Link>
        <nav aria-label="Navegación de escritorio" className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
          {desktopNavItems.map((item) => (
            <Link prefetch={false} key={item.href} href={item.href}
              aria-current={item.isActive(pathname) ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${item.isActive(pathname) ? 'bg-[#c6302c] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}>
              <span aria-hidden="true" className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    <nav aria-label="Navegación móvil"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-black"
      style={{
        boxShadow: '0 -4px 0 0 #000'
      }}
    >
      <div className="max-w-md mx-auto flex">
        {navItems.map((item) => {
          const active = item.isActive(pathname)

          return (
            <Link
              prefetch={false}
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
    </>
  )
}
