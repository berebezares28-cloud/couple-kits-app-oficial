// Pruebas aisladas: no consulta ni modifica la base de producción.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { createHmac } = require('node:crypto')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)])
const exceptions = new Set(['app/api/tally/route.ts', 'app/api/cron/purga-pedidos/route.ts', 'app/api/finanzas/activar/route.ts'])
let handlers = 0
let pages = 0
for (const file of walk(path.join(root, 'app'))) {
  const rel = path.relative(root, file)
  const source = fs.readFileSync(file, 'utf8')
  if (file.endsWith('/route.ts') && !exceptions.has(rel)) {
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
    for (const node of ast.statements) {
      if (!ts.isFunctionDeclaration(node) || !node.body || !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(node.name?.text)) continue
      assert.match(node.body.statements[0].getText(ast), /await autorizar(App|Finanzas)\(/, rel + ': ' + node.name.text)
      assert.match(node.body.statements[1].getText(ast), /if \(acceso.response\) return acceso.response/, rel)
      handlers++
    }
    assert.doesNotMatch(source, /getSupabaseAdminOrError|createSupabaseAdmin|from ['"].*\/supabase['"]/, rel)
  }
  if (file.endsWith('/page.tsx') && !['app/acceso/page.tsx', 'app/finanzas/acceso/page.tsx'].includes(rel)) {
    assert.match(source, /await exigir(App|Finanzas)Pagina\(/, rel)
    assert.doesNotMatch(source, /import \{ supabase \}/, rel)
    pages++
  }
}

require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
}).outputText, file)
const { destinoSeguro } = require('../scr/lib/rutasAcceso.ts')
for (const destino of [null, 'https://otro.example', '//otro.example', '/\\otro.example', '/acceso', '/finanzas/acceso', '/api/tally', '/pedidos\n']) assert.equal(destinoSeguro(destino), '/')
assert.equal(destinoSeguro('/pedidos?estatus=Confirmado'), '/pedidos?estatus=Confirmado')
assert.equal(destinoSeguro('/insumos/abc'), '/insumos/abc')
const { firmaTallyValida } = require('../scr/lib/tallySeguridad.ts')
const payload = { data: { submissionId: 'test', fields: [] } }
const secret = 'secreto-solo-de-prueba'
const firma = createHmac('sha256', secret).update(JSON.stringify(payload)).digest('base64')
assert.equal(firmaTallyValida(payload, firma, secret), true)
assert.equal(firmaTallyValida({ data: {} }, firma, secret), false)
assert.equal(firmaTallyValida(payload, firma, 'otra-clave'), false)
assert.equal(firmaTallyValida(payload, null, secret), false)
assert.equal(firmaTallyValida(payload, 'incorrecta', secret), false)

let user = null
let member = false
let membershipReads = 0
const client = {
  auth: { getUser: async () => ({ data: { user }, error: null }) },
  from() {
    membershipReads++
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: member ? { user_id: user?.id } : null, error: null }) }
    return query
  }
}
const originalLoad = Module._load
Module._load = function (name) {
  if (name === 'server-only') return {}
  if (name === 'react') return { cache: (f) => f }
  if (name === 'next/headers') return { cookies: () => ({ getAll: () => [], set() {} }) }
  if (name === 'next/navigation') return { redirect: (to) => { throw Error('REDIRECT ' + to) } }
  if (name === '@supabase/ssr') return { createServerClient: () => client }
  return originalLoad.apply(this, arguments)
}

async function test() {
  const auth = require('../scr/lib/appAuth.ts')
  let result = await auth.autorizarApp(new Request('https://app.example/api/pedidos'))
  assert.equal(result.response.status, 401)
  assert.equal(membershipReads, 0)
  user = { id: 'usuario-sin-acceso' }
  result = await auth.autorizarApp(new Request('https://app.example/api/pedidos'))
  assert.equal(result.response.status, 403)
  member = true
  result = await auth.autorizarApp(new Request('https://app.example/api/pedidos'))
  assert.equal(result.client, client)
  result = await auth.autorizarApp(new Request('https://app.example/api/pedidos', { method: 'POST', headers: { origin: 'https://otro.example' } }))
  assert.equal(result.response.status, 403)
  user = null
  await assert.rejects(() => auth.exigirAppPagina('/pedidos'), /REDIRECT \/acceso\?volver=%2Fpedidos/)
  console.log(JSON.stringify({ privateHandlers: handlers, privatePages: pages, guest401: true, nonMember403: true, memberAllowed: true, csrfBlocked: true, safeRedirects: true, tallySignature: true, productionWrites: 0 }))
}
test().catch((error) => { console.error(error); process.exitCode = 1 })
