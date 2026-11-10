// Compatibilidad con los endpoints de Finanzas existentes.
export {
  crearSupabaseServidor,
  obtenerAccesoApp as obtenerAccesoFinanzas,
  exigirAppPagina as exigirFinanzasPagina,
  autorizarApp as autorizarFinanzas
} from './appAuth'
