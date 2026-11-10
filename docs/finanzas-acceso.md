# Acceso a Couple Kits

Todas las páginas del negocio y sus API requieren una sesión de Supabase Auth y
una fila en `finanzas_accesos` (nombre histórico de la lista de miembros).
Cada página y handler comprueba la sesión en el servidor. RLS limita las tablas
del negocio al equipo, incluyendo las consultas directas desde el navegador.
Middleware renueva la sesión y evita el almacenamiento de respuestas privadas en caché.

Cada persona tiene su propia cuenta. Las cookies persisten al cerrar el navegador
y los tokens se renuevan automáticamente. Cerrar sesión, revocar el acceso o borrar
las cookies requiere volver a entrar. No se autoriza acceso mediante user_metadata.

## Activación inicial

- `FINANZAS_ALLOWED_EMAILS`: correos autorizados, separados por comas; solo servidor.
- `FINANZAS_PROVISION_TOKEN`: secreto aleatorio hexadecimal de 32 bytes; solo producción.
- `SUPABASE_SERVICE_ROLE_KEY`: credencial administrativa existente; nunca va al navegador.

El administrador llama `POST /api/finanzas/activar` con el token en el encabezado
Bearer y el correo autorizado en JSON. El endpoint crea la cuenta y su membresía,
sin enviar mensajes. Rechaza correos fuera de la lista y cuentas que ya iniciaron
sesión. Devuelve un token de recuperación de un solo uso.

Entregar privadamente el enlace `/acceso#token_hash=TOKEN&type=recovery`.
El fragmento evita incluir el token en solicitudes HTTP y registros de acceso.
La pantalla lo consume, lo elimina de la dirección y permite elegir una contraseña
de al menos 12 caracteres. No guardar enlaces de activación en Git ni en logs.

Las cuentas ya activadas se recuperan mediante las herramientas administrativas
de Supabase. Los miembros no pueden conceder acceso a otros desde la Data API.

## Integraciones

- Tally conserva `/api/tally`, sin login interactivo. Requiere una firma HMAC
  `Tally-Signature` válida con `TALLY_SIGNING_SECRET`, configurada también en Tally.
  No procesa datos si falta la clave o la firma no coincide.
- El cron conserva su autorización `CRON_SECRET` y su cliente administrativo.
- El aprovisionamiento conserva el secreto administrativo independiente y la lista
  de correos permitidos; no acepta registro público.

## Despliegue

Crear primero las tablas nuevas con la migración `ingresos_extra`. Desplegar las
comprobaciones de sesión antes de aplicar `proteger_finanzas` a gastos y saldos,
para que la versión anterior no calcule esos movimientos con permisos anónimos.
Las migraciones no actualizan ni eliminan registros del negocio.
Para extender la protección, desplegar los clientes con sesión antes de aplicar
`proteger_toda_la_app`. Configurar la firma en Tally antes de desplegar su validación.

## Verificación

- Sin sesión: páginas redirigen al acceso; API devuelve 401.
- Usuario sin membresía: API devuelve 403 y RLS no permite leer ni escribir datos del negocio.
- Con membresía: ingresos extra afectan P&L, cuentas y periodos; no cambian kits,
  consumo de insumos ni costos FIFO.
- Cerrar sesión elimina la sesión del navegador y devuelve al acceso.

Ejecutar `node scripts/test-auth.cjs` para verificar cobertura de guardas, miembros,
rechazo de invitados, redirecciones y firmas de Tally sin escribir en producción.
