import { useEffect } from 'react'
import { useSyncStore } from '../store/sync'

export function useBackgroundSync() {
  const { checkAndSync, isOnline, serverUrl } = useSyncStore()

  useEffect(() => {
    if (!isOnline || !serverUrl) return

    // Sync when coming online
    checkAndSync()

    // Periodic sync every 5 minutes
    const interval = setInterval(checkAndSync, 5 * 60_000)
    return () => clearInterval(interval)
  }, [isOnline, serverUrl, checkAndSync])
}
