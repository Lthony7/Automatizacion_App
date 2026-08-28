import { DomainRegistry } from '../src/domain.registry'
import { ChristianDomainProvider } from '../src/christian-domain-provider'
import { AutomotiveDomainProvider } from '../src/automotive-domain-provider'
import { AutomotiveContentType, AUTOMOTIVE_CONTENT_TYPES } from '../src/automotive-content-types'
import { AutomotiveValidator } from '../src/automotive-validator'
import { ContentEngine } from '../src/content-engine'

describe('FASE 17 Automotive vertical demostrativo — mismo Core', () => {
  test('10 tipos requeridos existen y son los del spec', () => {
    expect(AUTOMOTIVE_CONTENT_TYPES).toHaveLength(10)
    for (const required of ['car_tip','maintenance','engine','brakes','oil','tires','electrical','diagnostics','car_fact','common_failure']) {
      expect(AUTOMOTIVE_CONTENT_TYPES).toContain(required)
    }
    expect(AUTOMOTIVE_CONTENT_TYPES).toContain(AutomotiveContentType.OIL)
  })

  test('AutomotiveValidator: 5 reglas de seguridad', async () => {
    const v = new AutomotiveValidator()
    // Regla 1: diagnóstico con certeza sin evidencia → WARNING
    const r1 = await v.validate({ contentType: 'diagnostics', title: 'Ruido al frenar', script: 'Con certeza es la bomba de freno', diagnosisEvidence: false })
    expect(r1.warnings.some(w => w.includes('No afirmar diagnósticos'))).toBe(true)

    // Regla 2: reparación profesional sin advertencia → WARNING
    const r2 = await v.validate({ contentType: 'brakes', title: 'Frenos', script: 'Repare los frenos usted mismo en casa' })
    expect(r2.warnings.some(w => w.includes('requiere profesional'))).toBe(true)

    // Regla 3: instrucción peligrosa → INVALID
    const r3 = await v.validate({ contentType: 'maintenance', title: 'X', script: 'No use gato, trabaje debajo del auto suspendido' })
    expect(r3.status).toBe('INVALID')
    expect(r3.errors.length).toBeGreaterThan(0)

    // Regla 4: preventivo vs reparación
    const r4 = await v.validate({ contentType: 'maintenance', title: 'Mantenimiento', script: 'Para reparar falla del motor sustituya el bloque' })
    expect(r4.warnings.some(w => w.includes('Diferencie mantenimiento preventivo'))).toBe(true)

    // Regla 5: spec fabricante sin fuente → WARNING
    const r5 = await v.validate({ contentType: 'engine', title: 'Torque', script: 'Apriete a 150 Nm el cárter' })
    expect(r5.warnings.some(w => w.includes('No inventar especificaciones'))).toBe(true)

    // Contenido correcto → VALID
    const rOk = await v.validate({
      contentType: 'maintenance',
      title: 'Mantenimiento preventivo cada 10k km',
      script: 'Mantenimiento preventivo: revise nivel de aceite y presión de neumáticos. Consulte el manual del fabricante. Si detecta falla consulte a un profesional.',
      manufacturerSource: true,
    })
    expect(rOk.status).toBe('VALID')
  })

  test('CHRISTIAN y AUTOMOTIVE coexisten en el mismo DomainRegistry y ContentEngine (mismo Core)', async () => {
    const registry = new DomainRegistry()
    new ChristianDomainProvider(registry)
    new AutomotiveDomainProvider(registry)

    expect(registry.list().sort()).toEqual(['automotive','christian'])

    const christianTypes = (await registry.get('christian')!.getContentTypes()) as import('../src/domain.interface').ContentType[]
    const autoTypes = (await registry.get('automotive')!.getContentTypes()) as import('../src/domain.interface').ContentType[]
    expect(christianTypes.some(c => c.id === 'morning_prayer')).toBe(true)
    expect(autoTypes.some(c => c.id === 'maintenance')).toBe(true)
    expect(christianTypes.map(c=>c.vertical)).toEqual(expect.arrayContaining(['christian']))
    expect(autoTypes.map(c=>c.vertical)).toEqual(expect.arrayContaining(['automotive']))

    // Mismo Core: ContentEngine resuelve ambos dominios
    const mockAI = {
      generate: async ({ domain, contentType }: any) => ({
        hook: `Hook ${domain}/${contentType}`,
        title: `Video ${domain} ${contentType}`,
        script: domain === 'automotive'
          ? 'Mantenimiento preventivo: revise aceite. Consulte el manual del fabricante.'
          : 'Oración de la mañana para comenzar el día.',
        description: 'Desc',
        cta: 'Síguenos',
        hashtags: ['#test'],
        references: [],
        metadata: {},
      }),
    }

    const resolver = { getDomain: (d: string) => registry.get(d) as any }
    const engine = new ContentEngine(resolver as any, mockAI as any)

    const christianResult = await engine.generate({
      id: 'c1', tenantId: 't1', domain: 'christian', contentType: 'morning_prayer', idea: { text: 'oración matutina' },
    })
    const automotiveResult = await engine.generate({
      id: 'a1', tenantId: 't1', domain: 'automotive', contentType: 'maintenance', idea: { text: 'mantenimiento 10k' },
    })

    expect(christianResult.status).toBe('VALIDATED')
    expect(automotiveResult.status).toBe('VALIDATED')
    expect(christianResult.content.domain).toBe('christian')
    expect(automotiveResult.content.domain).toBe('automotive')
  })

  test('3 videos de prueba: mantenimiento, aceite, diagnóstico — todos VALID', async () => {
    const v = new AutomotiveValidator()
    const videos = [
      {
        contentType: 'maintenance',
        title: 'Mantenimiento preventivo cada 10.000 km',
        script: 'Mantenimiento preventivo: revise nivel de aceite, presión de neumáticos y estado de frenos. Este mantenimiento preventivo no corrige una falla existente; para fallas consulte a un profesional. Consulte el manual del fabricante.',
        manufacturerSource: true,
      },
      {
        contentType: 'oil',
        title: 'Cambio de aceite 5W-30 sintético',
        script: 'Cambio de aceite con viscosidad 5W-30 según manual del fabricante (consulte el manual del fabricante para su modelo). Intervalo recomendado por fabricante cada 10.000 km. Recicle el aceite usado.',
        manufacturerSource: true,
      },
      {
        contentType: 'diagnostics',
        title: 'Ruido al frenar: posibles causas',
        script: 'El ruido al frenar podría ser desgaste de pastillas o disco. Se recomienda diagnóstico con escáner y revisión visual por un profesional calificado. No afirme certeza sin inspección.',
        diagnosisEvidence: false,
      },
    ]
    for (const video of videos) {
      const res = await v.validate(video)
      expect(res.status).not.toBe('INVALID')
      expect(res.errors).toHaveLength(0)
    }
  })

  test('No se construyó plataforma separada: Automotive reutiliza Workflow/Review/Scheduler/Publication/Analytics/Cost', async () => {
    // Mismo ContentEngine, mismo validator interface, mismo rule provider shape
    const autoProvider = new AutomotiveDomainProvider(new DomainRegistry())
    expect(autoProvider.getValidator()).toBeInstanceOf(AutomotiveValidator)
    // Workflow canTransition es genérico: DRAFT->QUEUED permitido, PUBLISHED->DRAFT no
    const can = await autoProvider.getRuleProvider().canTransition({}, 'DRAFT', 'QUEUED', {})
    const cannot = await autoProvider.getRuleProvider().canTransition({}, 'PUBLISHED', 'DRAFT', {})
    expect(can).toBe(true)
    expect(cannot).toBe(false)
  })
})
