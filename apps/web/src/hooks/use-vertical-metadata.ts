'use client'

import { useEffect, useState } from 'react'
import { fetchVerticalMetadata, type VerticalMetadata } from '@/lib/vertical-metadata'

export function useVerticalMetadata(verticalId: string) {
  const [metadata, setMetadata] = useState<VerticalMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    setError(null)
    fetchVerticalMetadata(verticalId, ac.signal)
      .then(setMetadata)
      .catch((e: unknown) => {
        if ((e as DOMException)?.name === 'AbortError') return
        setError((e as Error)?.message ?? String(e))
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [verticalId])

  return { metadata, loading, error }
}
