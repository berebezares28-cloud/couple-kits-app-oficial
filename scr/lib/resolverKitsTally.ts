export type KitNombre = {
  id: string
  nombre: string
}

export type TallyOption = {
  id?: string
  text?: string
  label?: string
  name?: string
}

export type TallyField = {
  label?: string
  type?: string
  value?: unknown
  options?: TallyOption[]
}

const MIN_FUZZY = 5

export function normalizarNombreKit(valor: string): string {
  return valor
    .replace(/<[^>]+>/g, ' ')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function textoOpcion(option: TallyOption): string {
  return (
    option.text ||
    option.label ||
    option.name ||
    ''
  ).trim()
}

function valoresCampo(field: TallyField): unknown[] {
  if (field.value == null || field.value === false) {
    return []
  }

  if (Array.isArray(field.value)) {
    return field.value
  }

  return [field.value]
}

export function getSelectedOptionTexts(field?: TallyField | null): string[] {
  if (!field) return []

  const values = valoresCampo(field)
  if (values.length === 0) return []

  if (field.options?.length) {
    const porId = field.options
      .filter((option) =>
        values.includes(option.id)
      )
      .map(textoOpcion)
      .filter(Boolean)

    if (porId.length > 0) return porId

    const porTexto = field.options
      .filter((option) => {
        const texto = textoOpcion(option)
        return texto.length > 0 && values.includes(texto)
      })
      .map(textoOpcion)

    if (porTexto.length > 0) return porTexto
  }

  return values
    .filter(
      (value): value is string =>
        typeof value === 'string' &&
        value.trim().length > 0 &&
        !esIdentificador(value)
    )
    .map((value) => value.trim())
}

function esIdentificador(valor: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      valor
    ) || /^question_/i.test(valor)
  )
}

function textosDesdeCheckbox(field: TallyField): string[] {
  if (field.value !== true || !field.label) {
    return []
  }

  const textos = [field.label.trim()]
  const entreParentesis = field.label.match(/\(([^)]+)\)\s*$/)

  if (entreParentesis?.[1]) {
    textos.push(entreParentesis[1].trim())
  }

  return textos
}

const TIPOS_ELECCION = new Set([
  'CHECKBOXES',
  'MULTIPLE_CHOICE',
  'DROPDOWN',
  'MULTI_SELECT',
  'RANKING'
])

export function extraerCandidatosKit(
  fields: TallyField[] | null | undefined
): string[] {
  if (!Array.isArray(fields)) return []

  const candidatos: string[] = []

  for (const field of fields) {
    const esEleccion =
      Boolean(field.options?.length) ||
      TIPOS_ELECCION.has(String(field.type ?? ''))

    if (esEleccion) {
      candidatos.push(...getSelectedOptionTexts(field))
    }

    candidatos.push(...textosDesdeCheckbox(field))
  }

  return Array.from(
    new Set(
      candidatos
        .map((texto) => texto.trim())
        .filter(Boolean)
    )
  )
}

function puntajeCoincidencia(
  candidatoNorm: string,
  kitNorm: string
): number {
  if (!candidatoNorm || !kitNorm) return 0

  if (candidatoNorm === kitNorm) {
    return 1000 + kitNorm.length
  }

  if (
    kitNorm.length >= MIN_FUZZY &&
    candidatoNorm.includes(kitNorm)
  ) {
    return 500 + kitNorm.length
  }

  if (
    candidatoNorm.length >= MIN_FUZZY &&
    kitNorm.includes(candidatoNorm)
  ) {
    return 400 + candidatoNorm.length
  }

  return 0
}

export function resolverKitPorNombre(
  nombreTally: string,
  kits: KitNombre[]
): KitNombre | null {
  const candidatoNorm = normalizarNombreKit(nombreTally)

  if (!candidatoNorm) return null

  let mejor: { kit: KitNombre; puntaje: number } | null =
    null

  for (const kit of kits) {
    const puntaje = puntajeCoincidencia(
      candidatoNorm,
      normalizarNombreKit(kit.nombre)
    )

    if (puntaje === 0) continue

    if (!mejor || puntaje > mejor.puntaje) {
      mejor = { kit, puntaje }
    }
  }

  return mejor?.kit ?? null
}

export function resolverKitsPorNombres(
  nombresTally: string[],
  kits: KitNombre[]
): { kit_id: string; cantidad: number }[] {
  const porId = new Map<string, number>()

  for (const nombre of nombresTally) {
    const kit = resolverKitPorNombre(nombre, kits)

    if (!kit) continue

    porId.set(kit.id, (porId.get(kit.id) ?? 0) + 1)
  }

  return Array.from(porId.entries()).map(
    ([kit_id, cantidad]) => ({
      kit_id,
      cantidad
    })
  )
}

export function resolverKitsDesdeCamposTally(
  fields: TallyField[] | null | undefined,
  kits: KitNombre[]
): { kit_id: string; cantidad: number }[] {
  return resolverKitsPorNombres(
    extraerCandidatosKit(fields),
    kits
  )
}
