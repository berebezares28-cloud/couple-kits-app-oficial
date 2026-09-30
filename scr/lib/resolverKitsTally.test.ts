import assert from 'node:assert/strict'
import {
  extraerCandidatosKit,
  normalizarNombreKit,
  resolverKitPorNombre,
  resolverKitsDesdeCamposTally,
  resolverKitsPorNombres
} from './resolverKitsTally'

const kits = [
  { id: 'pumpkin', nombre: 'Pumpkin kit' },
  { id: 'snoopy', nombre: 'Snoopy kit' },
  { id: 'huesitos', nombre: 'Huesitos kit' },
  { id: 'canvas', nombre: 'Canvas Kit' },
  { id: 'multiverse', nombre: 'Multiverse Kit' },
  { id: 'carinito', nombre: 'Cariñito Kit' },
  { id: 'ajolo', nombre: 'Ajolokit' },
  { id: 'love', nombre: 'Love kit' }
]

function campoKit(value: unknown, extraOptions?: { id: string; text: string }[]) {
  return {
    label: '¿Cuál es tu kit?',
    type: 'CHECKBOXES',
    value,
    options: [
      { id: 'opt-snoopy', text: 'Snoopy kit' },
      { id: 'opt-pumpkin', text: 'Pumpkin kit' },
      { id: 'opt-huesitos', text: 'Huesitos kit' },
      ...(extraOptions ?? [])
    ]
  }
}

assert.equal(normalizarNombreKit('Pumpkin Kit'), 'pumpkinkit')
assert.equal(normalizarNombreKit('🎃 Pumpkin kit'), 'pumpkinkit')
assert.equal(normalizarNombreKit('Cariñito Kit'), 'carinitokit')

assert.equal(
  resolverKitPorNombre('Pumpkin Kit', kits)?.id,
  'pumpkin'
)
assert.equal(
  resolverKitPorNombre('pumpkin kit', kits)?.id,
  'pumpkin'
)
assert.equal(
  resolverKitPorNombre('🎃 Pumpkin kit', kits)?.id,
  'pumpkin'
)
assert.equal(
  resolverKitPorNombre('Pumpkin', kits)?.id,
  'pumpkin'
)
assert.equal(
  resolverKitPorNombre('Pumpkin kit 🎃 (temporada)', kits)?.id,
  'pumpkin'
)
assert.equal(
  resolverKitPorNombre('Cariñito Kit', kits)?.id,
  'carinito'
)
assert.equal(resolverKitPorNombre('kit', kits), null)
assert.equal(
  resolverKitPorNombre('Para pintar con mi pareja', kits),
  null
)

const porNombres = resolverKitsPorNombres(
  ['🎃 Pumpkin Kit', 'Snoopy kit'],
  kits
)
assert.deepEqual(
  porNombres.map((k) => k.kit_id).sort(),
  ['pumpkin', 'snoopy']
)

const desdeIds = extraerCandidatosKit([
  campoKit(['opt-pumpkin', 'opt-snoopy'])
])
assert.deepEqual(desdeIds.sort(), ['Pumpkin kit', 'Snoopy kit'])

const desdeTexto = extraerCandidatosKit([
  campoKit(['Pumpkin kit'])
])
assert.deepEqual(desdeTexto, ['Pumpkin kit'])

const checkboxHijo = extraerCandidatosKit([
  {
    label: '¿Cuál es tu kit? (Pumpkin kit)',
    type: 'CHECKBOXES',
    value: true
  },
  {
    label: '¿Cuál es tu kit? (Snoopy kit)',
    type: 'CHECKBOXES',
    value: false
  }
])
assert.deepEqual(
  checkboxHijo.sort(),
  ['Pumpkin kit', '¿Cuál es tu kit? (Pumpkin kit)']
)

const checkboxTemporada = resolverKitsDesdeCamposTally(
  [
    {
      label: 'Pumpkin kit',
      type: 'CHECKBOXES',
      value: true
    }
  ],
  kits
)
assert.deepEqual(checkboxTemporada, [
  { kit_id: 'pumpkin', cantidad: 1 }
])

const dropdown = resolverKitsDesdeCamposTally(
  [
    {
      label: '¿Cuál es tu kit?',
      type: 'DROPDOWN',
      value: ['opt-pumpkin'],
      options: [
        { id: 'opt-canvas', text: 'Canvas Kit' },
        { id: 'opt-pumpkin', text: 'Pumpkin Kit' }
      ]
    }
  ],
  kits
)
assert.deepEqual(dropdown, [
  { kit_id: 'pumpkin', cantidad: 1 }
])

const noTomarNombre = extraerCandidatosKit([
  { label: 'Nombre', type: 'INPUT_TEXT', value: 'Prueba' },
  { label: 'Instagram', type: 'INPUT_TEXT', value: 'Prueba' },
  campoKit(['opt-pumpkin'])
])
assert.deepEqual(noTomarNombre, ['Pumpkin kit'])

const mixto = resolverKitsDesdeCamposTally(
  [
    campoKit(['opt-huesitos']),
    {
      label: '¿Cuál es tu kit? (Pumpkin kit)',
      type: 'CHECKBOXES',
      value: true
    },
    {
      label: '¿Para quién es el kit?',
      type: 'DROPDOWN',
      value: ['ocasion-1'],
      options: [
        {
          id: 'ocasion-1',
          text: 'Para pintar con mi pareja'
        }
      ]
    }
  ],
  kits
)
assert.deepEqual(
  mixto.map((k) => k.kit_id).sort(),
  ['huesitos', 'pumpkin']
)

console.log('resolverKitsTally: ok')
