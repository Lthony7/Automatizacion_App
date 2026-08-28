import { DomainRegistry } from '../src/domain.registry'
import { ChristianDomainProvider } from '../src/christian-domain-provider'
import { AutomotiveDomainProvider } from '../src/automotive-domain-provider'
import { AutomotiveValidator } from '../src/automotive-validator'
import { AUTOMOTIVE_CONTENT_TYPES } from '../src/automotive-content-types'
import { ContentEngine } from '../src/content-engine'

let passed = 0; let failed = 0
function assert(name: string, c: boolean) { if (c) { passed++; console.log(`  OK ${name}`) } else { failed++; console.log(`  FAIL ${name}`) } }

(async () => {
console.log('=== FASE 17 Automotive demostrativo (mismo Core) ===\n')

// 10 tipos
assert('10 tipos AUTOMOTIVE', AUTOMOTIVE_CONTENT_TYPES.length === 10)
assert('contiene CAR_TIP/MAINTENANCE/ENGINE/BRAKES/OIL/TIRES/ELECTRICAL/DIAGNOSTICS/CAR_FACT/COMMON_FAILURE',
  ['car_tip','maintenance','engine','brakes','oil','tires','electrical','diagnostics','car_fact','common_failure'].every(t => AUTOMOTIVE_CONTENT_TYPES.includes(t as any)))

// 5 reglas
const v = new AutomotiveValidator()
const r1 = await v.validate({ contentType: 'diagnostics', title: 'Ruido', script: 'Con certeza es la bomba', diagnosisEvidence: false })
assert('Regla 1: certeza sin evidencia → warning', r1.warnings.some(w => w.includes('No afirmar diagnósticos')))

const r2 = await v.validate({ contentType: 'brakes', title: 'Frenos', script: 'Repare los frenos usted mismo' })
assert('Regla 2: reparación profesional sin advertencia → warning', r2.warnings.some(w => w.includes('requiere profesional')))

const r3 = await v.validate({ contentType: 'maintenance', title: 'X', script: 'No use gato, trabaje debajo del auto' })
assert('Regla 3: instrucción peligrosa → INVALID', r3.status === 'INVALID')

const r4 = await v.validate({ contentType: 'maintenance', title: 'M', script: 'Para reparar falla sustituya el bloque' })
assert('Regla 4: preventivo vs reparación → warning', r4.warnings.some(w => w.includes('Diferencie mantenimiento preventivo')))

const r5 = await v.validate({ contentType: 'engine', title: 'Torque', script: 'Apriete a 150 Nm el cárter' })
assert('Regla 5: spec fabricante sin fuente → warning', r5.warnings.some(w => w.includes('No inventar especificaciones')))

// Coexistencia: mismo Registry y mismo ContentEngine
const registry = new DomainRegistry()
new ChristianDomainProvider(registry)
new AutomotiveDomainProvider(registry)
assert('CHRISTIAN y AUTOMOTIVE registrados', registry.list().sort().join(',') === 'automotive,christian')

const mockAI = { generate: async ({ domain, contentType }: any) => ({
  hook: `Hook ${domain}/${contentType}`, title: `Video ${domain} ${contentType}`,
  script: domain === 'automotive' ? 'Mantenimiento preventivo: revise aceite. Consulte el manual del fabricante.' : 'Oración matutina.',
  description: 'Desc', cta: 'Síguenos', hashtags: ['#test'], references: [], metadata: {},
}) }
const resolver = { getDomain: (d: string) => registry.get(d) as any }
const engine = new ContentEngine(resolver as any, mockAI as any)
const cRes = await engine.generate({ id: 'c1', tenantId: 't1', domain: 'christian', contentType: 'morning_prayer', idea: { text: 'x' } })
const aRes = await engine.generate({ id: 'a1', tenantId: 't1', domain: 'automotive', contentType: 'maintenance', idea: { text: 'x' } })
assert('Mismo Core: Christian VALIDATED', cRes.status === 'VALIDATED' && cRes.content.domain === 'christian')
assert('Mismo Core: Automotive VALIDATED', aRes.status === 'VALIDATED' && aRes.content.domain === 'automotive')

// 3 videos de prueba
const videos = [
  { contentType: 'maintenance', title: 'Mantenimiento preventivo cada 10.000 km', script: 'Mantenimiento preventivo: revise aceite y neumáticos. No corrige falla existente; para fallas consulte a un profesional. Consulte el manual del fabricante.', manufacturerSource: true },
  { contentType: 'oil', title: 'Cambio de aceite 5W-30', script: 'Cambio con 5W-30 según manual del fabricante (consulte el manual para su modelo). Intervalo cada 10.000 km.', manufacturerSource: true },
  { contentType: 'diagnostics', title: 'Ruido al frenar', script: 'El ruido podría ser desgaste de pastillas. Se recomienda diagnóstico con escáner por profesional calificado.', diagnosisEvidence: false },
]
let allValid = true
for (const vid of videos) {
  const res = await v.validate(vid)
  if (res.status === 'INVALID' || res.errors.length > 0) allValid = false
}
assert('3 videos de prueba (mantenimiento, aceite, diagnóstico) todos VALID/WARNING sin errores', allValid)
console.log('  Videos: mantenimiento, aceite, diagnóstico → todos sin errores')

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
process.exit(failed>0?1:0)
})()
