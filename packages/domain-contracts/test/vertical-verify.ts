import { getVerticalMetadata } from '../src/vertical-metadata'

let passed = 0
let failed = 0
function assert(name: string, condition: boolean) {
  if (condition) { passed++; console.log(`  OK ${name}`) }
  else { failed++; console.log(`  FAIL ${name}`) }
}

(async () => {
console.log('=== FASE 15 Vertical Metadata ===\n')

const christian = getVerticalMetadata('christian')
assert('Christian has 4 categories', christian.contentCategories.length === 4)
assert('Christian categories are Oraciones/Versículos/Reflexiones/Biblia',
  christian.contentCategories.map((c) => c.defaultLabel).join('|') === 'Oraciones|Versículos|Reflexiones|Biblia')

const automotive = getVerticalMetadata('automotive')
assert('Automotive has 4 categories', automotive.contentCategories.length === 4)
assert('Automotive categories are Consejos/Mantenimiento/Diagnóstico/Fallas',
  automotive.contentCategories.map((c) => c.defaultLabel).join('|') === 'Consejos|Mantenimiento|Diagnóstico|Fallas')

assert('Same nav id set across verticals',
  christian.nav.map((n) => n.id).join(',') === automotive.nav.map((n) => n.id).join(','))

assert('Nav contains all 16 required sections', christian.nav.length === 16 &&
  ['dashboard','projects','content','ideas','calendar','review','videos','media','templates','social-accounts','publications','analytics','costs','settings','users','audit']
    .every((id) => christian.nav.some((n) => n.id === id)))

// Frontend Shell must not hardcode long nav arrays (backend provides)
// Structural check: Shell file should import useVerticalMetadata, not contain a 16-item literal
let shellText = ''
try { shellText = require('fs').readFileSync('C:/Users/lthon/OneDrive/Escritorio/AutomatizacionApp/apps/web/src/components/shell/shell.tsx', 'utf8') } catch { shellText = '' }
assert('Shell consumes metadata via hook (not hard-coded nav)', shellText.includes('useVerticalMetadata'))
assert('Shell has no 16-item hard-coded nav literal', !shellText.includes("label: 'Producción'") && !shellText.includes("label: 'Biblioteca'"))

// Dashboard is dynamic via vertical prop
let dashText = ''
try { dashText = require('fs').readFileSync('C:/Users/lthon/OneDrive/Escritorio/AutomatizacionApp/apps/web/src/components/dashboard/dashboard.tsx', 'utf8') } catch { dashText = '' }
assert('Dashboard receives vertical prop', dashText.includes('vertical'))
assert('Dashboard renders categories from metadata', dashText.includes('contentCategories'))
assert('Dashboard shows 9 KPIs (Videos hoy, Objetivo, etc.)', ['Videos hoy','Objetivo diario','Pendientes','Aprobados','Programados','Publicados','Errores','Costo diario','Costo mensual'].every((k) => dashText.includes(k)))

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
})()
