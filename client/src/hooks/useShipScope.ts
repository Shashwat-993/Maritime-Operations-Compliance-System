import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import type { Ship } from '../api/types'

const ADMIN_SHIP_KEY = 'maritime_admin_ship_id'

export function useShipScope() {
  const { user } = useAuth()
  const [ships, setShips] = useState<Ship[]>([])
  const [adminShipId, setAdminShipIdState] = useState<string | null>(() => {
    if (typeof sessionStorage === 'undefined') return null
    return sessionStorage.getItem(ADMIN_SHIP_KEY)
  })

  const setAdminShipId = useCallback((id: string | null) => {
    setAdminShipIdState(id)
    if (id) sessionStorage.setItem(ADMIN_SHIP_KEY, id)
    else sessionStorage.removeItem(ADMIN_SHIP_KEY)
  }, [])

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get<Ship[]>('/api/ships')
        if (cancelled) return
        setShips(data)
        const stored = sessionStorage.getItem(ADMIN_SHIP_KEY)
        if (stored && data.some((s) => s.id === stored)) {
          setAdminShipIdState(stored)
        } else if (data.length > 0) {
          const first = data[0].id
          setAdminShipIdState(first)
          sessionStorage.setItem(ADMIN_SHIP_KEY, first)
        }
      } catch {
        /* pages show errors */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.role])

  const effectiveShipId = useMemo(() => {
    if (!user) return null
    if (user.role === 'CREW') return user.shipId
    return adminShipId
  }, [user, adminShipId])

  const shipQuery = useMemo(() => {
    if (!effectiveShipId) return {}
    if (user?.role === 'ADMIN') return { ship_id: effectiveShipId }
    return {}
  }, [effectiveShipId, user?.role])

  return {
    effectiveShipId,
    adminShipId,
    setAdminShipId,
    ships,
    shipQuery,
    isAdmin: user?.role === 'ADMIN',
  }
}
