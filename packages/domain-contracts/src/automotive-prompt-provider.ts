/*
 * Automotive Prompt Provider - Content Automation Platform FASE 17
 * Prompts versionados por contentType; el Core invoca getPrompt con variables
 */

import { DomainPromptProvider, Prompt } from './domain.interface'

export class AutomotivePromptProvider implements DomainPromptProvider {
  private prompts: Map<string, Prompt[]> = new Map()

  constructor() { this.initialize() }

  async getPrompts(contentType: string, version?: string): Promise<Prompt[]> {
    const all = this.prompts.get(contentType) ?? []
    return version ? all.filter(p => p.version === version) : all
  }

  async getPrompt(contentType: string, variables: Record<string, string>): Promise<string> {
    const all = this.prompts.get(contentType) ?? []
    const def = all.find(p => p.isDefault) ?? all[0]
    if (!def) throw new Error(`No prompt for automotive type: ${contentType}`)
    let t = def.template
    for (const [k, v] of Object.entries(variables)) t = t.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    return t
  }

  async listVersions(contentType: string) {
    return (this.prompts.get(contentType) ?? []).map(p => ({ version: p.version, releasedAt: new Date() }))
  }

  private add(type: string, version: string, title: string, template: string, vars: string[], isDefault = true) {
    const p: Prompt = { id: `${type}-${version}`, contentType: type, version, title, template, variables: vars, isDefault }
    if (!this.prompts.has(type)) this.prompts.set(type, [])
    this.prompts.get(type)!.push(p)
  }

  private initialize() {
    this.add('car_tip', '1.0.0', 'Consejo Automotriz',
      'Genera un consejo práctico sobre {tema} para {tipo_vehiculo}. Tono {tono}, duración {duracion_minutos} min. Incluye paso accionable y cierre con invitación a mantenimiento preventivo.',
      ['tema','tipo_vehiculo','tono','duracion_minutos'])

    this.add('maintenance', '1.0.0', 'Mantenimiento Preventivo',
      'Explica mantenimiento preventivo de {sistema} para {modelo}. Frecuencia {frecuencia}, herramientas {herramientas}. Diferencia claramente de una reparación correctiva. Tono {tono}, {duracion_minutos} min.',
      ['sistema','modelo','frecuencia','herramientas','tono','duracion_minutos'])

    this.add('engine', '1.0.0', 'Motor',
      'Contenido sobre {tema_motor} en {modelo}. Menciona precauciones de seguridad y cuándo consultar a un profesional. No inventes par de apriete: si mencionas Nm cite "consulte el manual del fabricante". Tono {tono}, {duracion_minutos} min.',
      ['tema_motor','modelo','tono','duracion_minutos'])

    this.add('brakes', '1.0.0', 'Frenos',
      'Guía de inspección de frenos para {modelo}: {sintoma}. Incluye advertencia de acudir a taller calificado si hay desgaste crítico. Tono {tono}, {duracion_minutos} min.',
      ['modelo','sintoma','tono','duracion_minutos'])

    this.add('oil', '1.0.0', 'Aceite',
      'Explica cambio de aceite {viscosidad} para {modelo}. Intervalo {intervalo}, pasos seguros y disposición del aceite usado. Tono {tono}, {duracion_minutos} min.',
      ['viscosidad','modelo','intervalo','tono','duracion_minutos'])

    this.add('tires', '1.0.0', 'Neumáticos',
      'Guía de neumáticos para {modelo}: presión {presion}, rotación y cuándo reemplazar. Advierte uso de gato seguro y profesional si es necesario. Tono {tono}, {duracion_minutos} min.',
      ['modelo','presion','tono','duracion_minutos'])

    this.add('electrical', '1.0.0', 'Sistema Eléctrico',
      'Contenido sobre {sistema_electrico} en {modelo}. Desconexión de batería y seguridad eléctrica. Use lenguaje tentative para diagnósticos sin evidencia. Tono {tono}, {duracion_minutos} min.',
      ['sistema_electrico','modelo','tono','duracion_minutos'])

    this.add('diagnostics', '1.0.0', 'Diagnóstico',
      'Posibles causas de "{sintoma}" en {modelo}. Liste causas probables con lenguaje tentativo ("podría ser", "se recomienda diagnóstico con escáner"). No afirme certeza sin datos suficientes. Tono {tono}, {duracion_minutos} min.',
      ['sintoma','modelo','tono','duracion_minutos'])

    this.add('car_fact', '1.0.0', 'Dato Curioso',
      'Dato curioso verificado sobre {tema} con fuente {fuente}. Breve,  entretenido y sin especulación. Tono {tono}, {duracion_minutos} min.',
      ['tema','fuente','tono','duracion_minutos'])

    this.add('common_failure', '1.0.0', 'Falla Común',
      'Falla frecuente "{falla}" en {modelo}: síntomas, causas probables (lenguaje tentativo), y cuándo acudir a taller. No invente especificaciones. Tono {tono}, {duracion_minutos} min.',
      ['falla','modelo','tono','duracion_minutos'])
  }
}
