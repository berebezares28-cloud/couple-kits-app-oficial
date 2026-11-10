const secciones = ['/pedidos', '/insumos', '/locales', '/finanzas', '/kits', '/dashboard', '/contenido', '/ventas']

export function esPaginaAcceso(pathname: string) {
  return pathname === '/acceso' || pathname === '/finanzas/acceso'
}

export function destinoSeguro(destino?: string | null): string {
  if (!destino?.startsWith('/') || destino.startsWith('//') || /[\\\u0000-\u001f]/.test(destino)) return '/'
  const url = new URL(destino, 'https://couplekits.invalid')
  if (url.origin !== 'https://couplekits.invalid' || esPaginaAcceso(url.pathname)) return '/'
  if (url.pathname !== '/' && !secciones.some((s) => url.pathname === s || url.pathname.startsWith(`${s}/`))) return '/'
  return `${url.pathname}${url.search}`
}
