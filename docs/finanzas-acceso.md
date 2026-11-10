# Acceso a Finanzas

Finanzas, Dashboard y sus API requieren una sesión de Supabase Auth y una fila en
`finanzas_accesos`. Las comprobaciones se hacen en el servidor; RLS también limita
el acceso directo a ingresos, gastos y saldos a los miembros del equipo.

El resto de la aplicación conserva su modelo de acceso existente.

## Activación inicial

- `FINANZAS_ALLOWED_EMAILS`: correos autorizados, separados por comas; solo servidor.
- `FINANZAS_PROVISION_TOKEN`: secreto aleatorio hexadecimal de 32 bytes; solo producción.
- `SUPABASE_SERVICE_ROLE_KEY`: credencial administrativa existente; nunca va al navegador.

El administrador llama `POST /api/finanzas/activar` con el token en el encabezado
Bearer y el correo autorizado en JSON. El endpoint crea la cuenta y su membresía,
sin enviar mensajes. Rechaza correos fuera de la lista y cuentas que ya iniciaron
sesión. Devuelve un token de recuperación de un solo uso.

Entregar privadamente el enlace `/finanzas/acceso#token_hash=TOKEN&type=recovery`.
El fragmento evita incluir el token en solicitudes HTTP y registros de acceso.
La pantalla lo consume, lo elimina de la dirección y permite elegir una contraseña
de al menos 12 caracteres. No guardar enlaces de activación en Git ni en logs.

Las cuentas ya activadas se recuperan mediante las herramientas administrativas
de Supabase. Los miembros no pueden conceder acceso a otros desde la Data API.

## Despliegue

Crear primero las tablas nuevas con la migración `ingresos_extra`. Desplegar las
comprobaciones de sesión antes de aplicar `proteger_finanzas` a gastos y saldos,
para que la versión anterior no calcule esos movimientos con permisos anónimos.
Las migraciones no actualizan ni eliminan registros del negocio.

## Verificación

- Sin sesión: páginas redirigen al acceso; API devuelve 401.
- Usuario sin membresía: API devuelve 403 y RLS no permite leer ni escribir ingresos.
- Con membresía: ingresos extra afectan P&L, cuentas y periodos; no cambian kits,
  consumo de insumos ni costos FIFO.
- Cerrar sesión elimina la sesión del navegador y devuelve al acceso.
