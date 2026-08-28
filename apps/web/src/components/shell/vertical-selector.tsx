'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Cross, Dumbbell, BookOpen, Car, ChefHat } from 'lucide-react'
import { getBrandConfig, applyBrandToCSS } from '@/theme/branding'

type Vertical = {
  id: string
  label: string
  icon: React.ReactNode
  tagline: string
}

const VERTICALS: Vertical[] = [
  {
    id: 'christian',
    label: 'Cristiano',
    icon: <Cross className="h-5 w-5" />,
    tagline: 'Contenido que inspira',
  },
  {
    id: 'automotive',
    label: 'Automotriz',
    icon: <Car className="h-5 w-5" />,
    tagline: 'Tu guía automotriz',
  },
  {
    id: 'fitness',
    label: 'Fitness',
    icon: <Dumbbell className="h-5 w-5" />,
    tagline: 'Entrena mejor',
  },
  {
    id: 'education',
    label: 'Educación',
    icon: <BookOpen className="h-5 w-5" />,
    tagline: 'Aprende rápido',
  },
  {
    id: 'cooking',
    label: 'Cocina',
    icon: <ChefHat className="h-5 w-5" />,
    tagline: 'Recetas en corto',
  },
]

type VerticalSelectorProps = {
  selectedVertical: string
  onVerticalChange: (vertical: string) => void
}

export function VerticalSelector({
  selectedVertical,
  onVerticalChange,
}: VerticalSelectorProps) {
  const [openVertical, setOpenVertical] = useState(false)

  const brand = getBrandConfig(selectedVertical)
  const selectedVerticalData = VERTICALS.find((vertical) => vertical.id === selectedVertical)

  useEffect(() => {
    applyBrandToCSS(brand)
  }, [selectedVertical])

  return (
    <div className="flex items-center">
      <div className="relative">
        <button
          onClick={() => setOpenVertical((open) => !open)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface hover:border-primary transition-colors"
          aria-label="Seleccionar temática"
          aria-expanded={openVertical}
        >
          <div className="flex items-center gap-2" style={{ color: brand.colors.primary }}>
            {selectedVerticalData?.icon}
          </div>
          <span className="font-medium">Temática: {selectedVerticalData?.label ?? selectedVertical}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openVertical ? 'rotate-180' : ''}`} />
        </button>

        {openVertical && (
          <div className="absolute top-full right-0 mt-1 w-56 bg-background border border-border rounded-lg shadow-lg z-50">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-textSecondary uppercase tracking-wide">
                Temática de trabajo
              </p>
            </div>
            <div className="divide-y divide-border">
              {VERTICALS.map((vertical) => (
                <button
                  key={vertical.id}
                  onClick={() => {
                    onVerticalChange(vertical.id)
                    setOpenVertical(false)
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-muted ${
                    selectedVertical === vertical.id ? 'bg-primary/10' : ''
                  } flex items-center gap-3`}
                >
                  <div className={`p-2 rounded-lg ${selectedVertical === vertical.id ? 'bg-primary/10' : 'bg-surface'}`}>
                    <div style={{ color: getBrandConfig(vertical.id).colors.primary }}>
                      {vertical.icon}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{vertical.label}</span>
                    <span className="text-xs text-textSecondary">{vertical.tagline}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
