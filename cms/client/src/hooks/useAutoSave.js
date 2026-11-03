import { useCallback, useEffect, useRef, useState } from 'react'

export const AUTO_SAVE_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SAVING: 'saving',
  SUCCESS: 'success',
  ERROR: 'error',
}

export function useAutoSave({ data, onSave, delay = 1500, enabled = true, shouldSave }) {
  const [status, setStatus] = useState(AUTO_SAVE_STATUS.IDLE)
  const [lastSaved, setLastSaved] = useState(null)

  const timerRef = useRef(null)
  const savingRef = useRef(false)
  const mountedRef = useRef(true)
  const dataRef = useRef(data)
  const onSaveRef = useRef(onSave)
  const shouldSaveRef = useRef(shouldSave)
  const savedSnapshotRef = useRef(JSON.stringify(data))

  dataRef.current = data
  onSaveRef.current = onSave
  shouldSaveRef.current = shouldSave

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimeout(timerRef.current)
    }
  }, [])

  const runSave = useCallback(async () => {
    if (savingRef.current) return false

    const snapshot = dataRef.current
    const serialized = JSON.stringify(snapshot)

    if (serialized === savedSnapshotRef.current) return true
    if (shouldSaveRef.current && !shouldSaveRef.current(snapshot)) return false

    savingRef.current = true
    setStatus(AUTO_SAVE_STATUS.SAVING)

    try {
      await onSaveRef.current(snapshot)
      savedSnapshotRef.current = serialized

      if (mountedRef.current) {
        setLastSaved(new Date())
        setStatus(AUTO_SAVE_STATUS.SUCCESS)
      }
      return true
    } catch (error) {
      if (mountedRef.current) setStatus(AUTO_SAVE_STATUS.ERROR)
      return false
    } finally {
      savingRef.current = false

      if (mountedRef.current && JSON.stringify(dataRef.current) !== serialized) {
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => runSave(), 300)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    const serialized = JSON.stringify(data)
    if (serialized === savedSnapshotRef.current) return undefined

    if (shouldSaveRef.current && !shouldSaveRef.current(data)) {
      setStatus(AUTO_SAVE_STATUS.IDLE)
      return undefined
    }

    setStatus(AUTO_SAVE_STATUS.PENDING)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runSave(), delay)

    return () => clearTimeout(timerRef.current)
  }, [data, enabled, delay, runSave])

  const saveNow = useCallback(async () => {
    clearTimeout(timerRef.current)
    return runSave()
  }, [runSave])

  const markSaved = useCallback((snapshot = dataRef.current) => {
    clearTimeout(timerRef.current)
    savedSnapshotRef.current = JSON.stringify(snapshot)
    setLastSaved(new Date())
    setStatus(AUTO_SAVE_STATUS.SUCCESS)
  }, [])

  const reset = useCallback((snapshot = dataRef.current) => {
    clearTimeout(timerRef.current)
    savedSnapshotRef.current = JSON.stringify(snapshot)
    setLastSaved(new Date())
    setStatus(AUTO_SAVE_STATUS.IDLE)
  }, [])

  return { status, lastSaved, saveNow, markSaved, reset }
}
